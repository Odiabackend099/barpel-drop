import { type NextRequest } from "next/server";
import { Webhooks } from "@dodopayments/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReceiptEmail, sendPaymentFailedEmail } from "@/lib/email/client";
import { CREDIT_PACKAGES } from "@/lib/constants";

/** Plan amounts for receipt emails — derived from CREDIT_PACKAGES (single source of truth). */
const PLAN_AMOUNTS: Record<string, { monthlyAmount: number; annualAmount: number; credits: number }> = {};
for (const pkg of CREDIT_PACKAGES) {
  PLAN_AMOUNTS[pkg.id] = {
    monthlyAmount: pkg.priceUsdCents / 100,
    annualAmount:  pkg.annualPriceUsdCents / 100,
    credits:       pkg.credits,
  };
}

/**
 * Dodo Payments webhook handler.
 *
 * Security:
 * - Signature verification is handled by @dodopayments/nextjs Webhooks adapter
 *   (StandardWebhooks protocol — webhook-id, webhook-timestamp, webhook-signature headers).
 *
 * Idempotency:
 * - `onSubscriptionActive`: the atomic claim (UPDATE WHERE status='pending') is the guard.
 * - `onSubscriptionRenewed`: dodo_webhook_events keyed on subscription_id + next_billing_date.
 * - Other handlers: updates are naturally idempotent (setting same value twice is harmless).
 *
 * Trust model:
 * - metadata.txRef from the webhook is used to look up the pending billing_transaction in DB.
 * - merchantId and plan come from the DB record — NOT from metadata. Prevents forgery.
 *
 * Registered at: Dashboard → Settings → Webhooks → https://dropship.barpel.ai/api/dodo/webhook
 *
 * NOTE: handler is lazily initialized (not at module load) so that missing env vars at
 * build time don't throw "Secret can't be empty" during Next.js static analysis.
 */

// Lazy handler — built on first request so env vars are available at runtime
let _webhookHandler: ((req: NextRequest) => Promise<Response>) | null = null;

function getWebhookHandler() {
  if (!_webhookHandler) {
    _webhookHandler = Webhooks({
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,

  // ─── subscription.active ────────────────────────────────────────────────────
  // Fired when a new subscription is first activated (initial payment succeeded).
  onSubscriptionActive: async (payload) => {
    const { data } = payload;
    const txRef      = data.metadata?.txRef as string | undefined;
    const subId      = data.subscription_id;
    const customerId = data.customer.customer_id;

    if (!txRef) {
      console.error("[dodo/webhook] onSubscriptionActive: missing metadata.txRef");
      return;
    }

    const adminSupabase = createAdminClient();

    // Atomic idempotency claim — if another invocation already claimed this tx, rows = 0
    const { data: claimedRows, error: claimError } = await adminSupabase
      .from("billing_transactions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("tx_ref", txRef)
      .eq("status", "pending")
      .select("id, merchant_id, plan, amount, billing_cycle");

    if (claimError || !claimedRows || claimedRows.length === 0) {
      // Already processed or no pending transaction found with this txRef
      return;
    }

    const tx = claimedRows[0];
    const billingCycle = tx.billing_cycle ?? "monthly";

    // Fetch credit package for this plan
    const { data: pkg } = await adminSupabase
      .from("credit_packages")
      .select("credits_seconds")
      .ilike("name", tx.plan)
      .eq("is_active", true)
      .single();

    if (!pkg) {
      console.error("[dodo/webhook] Credit package not found for plan:", tx.plan);
      // Revert so it can be retried
      await adminSupabase
        .from("billing_transactions")
        .update({ status: "pending" })
        .eq("tx_ref", txRef);
      return;
    }

    // Normalize next_billing_date — Dodo SDK may return Date object or ISO string
    const rawNextBillingDate = data.next_billing_date;
    const nextBillingDateStr = rawNextBillingDate instanceof Date
      ? rawNextBillingDate.toISOString()
      : (rawNextBillingDate as string | null | undefined) ?? null;

    // Grant credits + activate plan — wrapped so tx reverts to 'pending' on failure.
    // RESET credit_balance (not ADD) — prevents stacking free trial credits on top of plan.
    // Using a direct update makes this idempotent: re-processing sets the same value.
    try {
      await adminSupabase
        .from("merchants")
        .update({
          credit_balance:       pkg.credits_seconds,
          dodo_subscription_id: subId,
          dodo_customer_id:     customerId,
          dodo_plan:            tx.plan,
          billing_cycle:        billingCycle,
          plan_status:          "active",
          plan_renewal_due_at:  nextBillingDateStr,
          dunning_started_at:   null,
          dunning_email_count:  0,
        })
        .eq("id", tx.merchant_id);

      // Audit trail
      await adminSupabase.from("credit_transactions").insert({
        merchant_id:       tx.merchant_id,
        type:              "purchase",
        amount:            pkg.credits_seconds,
        balance_after:     pkg.credits_seconds,
        description:       `Plan activated — ${tx.plan} (Dodo Payments)`,
        stripe_payment_id: `dodo_sub_${subId}`,
      });

      await adminSupabase
        .from("billing_transactions")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("tx_ref", txRef);
    } catch (err) {
      // Revert to 'pending' so Dodo webhook retry can re-attempt.
      // Safe because RESET is idempotent — re-processing sets the same credit_balance.
      console.error("[dodo/webhook] onSubscriptionActive credit grant failed — reverting tx to pending:", (err as Error).message);
      await adminSupabase
        .from("billing_transactions")
        .update({ status: "pending" })
        .eq("tx_ref", txRef);
      return;
    }

    // Best-effort receipt email
    try {
      const { data: merchantRow } = await adminSupabase
        .from("merchants")
        .select("user_id")
        .eq("id", tx.merchant_id)
        .single();

      if (merchantRow) {
        const { data: authData } = await adminSupabase.auth.admin.getUserById(merchantRow.user_id);
        const planInfo = PLAN_AMOUNTS[tx.plan];
        const amount = billingCycle === "annual"
          ? planInfo?.annualAmount ?? tx.amount
          : planInfo?.monthlyAmount ?? tx.amount;
        const planLabel = `${tx.plan.charAt(0).toUpperCase() + tx.plan.slice(1)} (${billingCycle})`;
        const renewalLabel = nextBillingDateStr
          ? new Date(nextBillingDateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : "Next billing period";

        if (authData?.user?.email) {
          await sendReceiptEmail({
            to:              authData.user.email,
            planName:        planLabel,
            amount:          `$${amount.toFixed(0)}.00`,
            minutesAdded:    planInfo?.credits ?? Math.round(pkg.credits_seconds / 60),
            nextRenewalDate: renewalLabel,
          });
        }
      }
    } catch (err) {
      console.error("[dodo/webhook] onSubscriptionActive receipt email failed:", (err as Error).message);
    }
  },

  // ─── subscription.renewed ───────────────────────────────────────────────────
  // Fired on each subsequent billing cycle.
  // Credits RESET to plan allocation — they do NOT roll over.
  onSubscriptionRenewed: async (payload) => {
    const { data } = payload;
    const subId = data.subscription_id;
    // Normalize next_billing_date — may be Date object or ISO string from Dodo SDK
    const rawNextBillingDate = data.next_billing_date;
    const nextBillingDateStr = rawNextBillingDate instanceof Date
      ? rawNextBillingDate.toISOString()
      : (rawNextBillingDate as string | null | undefined) ?? null;

    // Idempotency: key = subscription_id + next_billing_date prevents double-processing
    const rawTimestamp = payload.timestamp;
    const timestampStr = rawTimestamp instanceof Date ? rawTimestamp.toISOString() : (rawTimestamp as string);
    const idempotencyKey = `${subId}_renewed_${nextBillingDateStr ?? timestampStr}`;
    const adminSupabase = createAdminClient();

    const { error: idempotencyError } = await adminSupabase
      .from("dodo_webhook_events")
      .insert({ webhook_id: idempotencyKey });

    if (idempotencyError) {
      // Unique constraint violation = already processed
      return;
    }

    const { data: merchant } = await adminSupabase
      .from("merchants")
      .select("id, dodo_plan, billing_cycle, user_id")
      .eq("dodo_subscription_id", subId)
      .single();

    if (!merchant?.dodo_plan) {
      console.error("[dodo/webhook] onSubscriptionRenewed: merchant not found for subscription:", subId);
      return;
    }

    const { data: pkg } = await adminSupabase
      .from("credit_packages")
      .select("credits_seconds")
      .ilike("name", merchant.dodo_plan)
      .eq("is_active", true)
      .single();

    if (!pkg) {
      console.error("[dodo/webhook] Credit package not found for plan:", merchant.dodo_plan);
      return;
    }

    const billingCycle = merchant.billing_cycle ?? "monthly";

    // RESET credit_balance to plan allocation (credits do not carry over)
    await adminSupabase
      .from("merchants")
      .update({
        credit_balance:      pkg.credits_seconds,
        plan_status:         "active",
        plan_renewal_due_at: nextBillingDateStr,
        dunning_started_at:  null,
        dunning_email_count: 0,
      })
      .eq("id", merchant.id);

    // Audit trail
    await adminSupabase.from("credit_transactions").insert({
      merchant_id:       merchant.id,
      type:              "purchase",
      amount:            pkg.credits_seconds,
      balance_after:     pkg.credits_seconds,
      description:       `${billingCycle === "annual" ? "Annual" : "Monthly"} renewal — ${merchant.dodo_plan} plan`,
      stripe_payment_id: `dodo_renewal_${subId}_${Date.now()}`,
    });

    // Insert billing_transactions record for renewal
    await adminSupabase.from("billing_transactions").insert({
      merchant_id: merchant.id,
      tx_ref:      `dodo_renewal_${subId}_${Date.now()}`,
      plan:        merchant.dodo_plan,
      amount:      billingCycle === "annual"
        ? (PLAN_AMOUNTS[merchant.dodo_plan]?.annualAmount ?? 0)
        : (PLAN_AMOUNTS[merchant.dodo_plan]?.monthlyAmount ?? 0),
      currency:    "USD",
      status:      "completed",
      provider:    "dodo",
      billing_cycle: billingCycle,
    });

    // Best-effort receipt email
    try {
      const { data: authData } = await adminSupabase.auth.admin.getUserById(merchant.user_id);
      const planInfo = PLAN_AMOUNTS[merchant.dodo_plan];
      const amount = billingCycle === "annual"
        ? planInfo?.annualAmount ?? 0
        : planInfo?.monthlyAmount ?? 0;
      const renewalLabel = nextBillingDateStr
        ? new Date(nextBillingDateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "Next billing period";

      if (authData?.user?.email) {
        await sendReceiptEmail({
          to:              authData.user.email,
          planName:        `${merchant.dodo_plan.charAt(0).toUpperCase() + merchant.dodo_plan.slice(1)} (${billingCycle})`,
          amount:          `$${amount.toFixed(0)}.00`,
          minutesAdded:    planInfo?.credits ?? Math.round(pkg.credits_seconds / 60),
          nextRenewalDate: renewalLabel,
        });
      }
    } catch (err) {
      console.error("[dodo/webhook] onSubscriptionRenewed receipt email failed:", (err as Error).message);
    }
  },

  // ─── subscription.cancelled ─────────────────────────────────────────────────
  // Subscription cancelled — by the merchant or after dunning failure.
  // Credit balance untouched; subscription columns cleared.
  onSubscriptionCancelled: async (payload) => {
    const subId = payload.data.subscription_id;
    const adminSupabase = createAdminClient();

    await adminSupabase
      .from("merchants")
      .update({
        dodo_subscription_id: null,
        dodo_plan:            null,
        plan_status:          "cancelled",
      })
      .eq("dodo_subscription_id", subId);
  },

  // ─── subscription.on_hold ───────────────────────────────────────────────────
  // Payment failed — start dunning. Notify customer to update payment method.
  onSubscriptionOnHold: async (payload) => {
    const subId = payload.data.subscription_id;
    const adminSupabase = createAdminClient();

    const now = new Date().toISOString();

    const { data: merchant } = await adminSupabase
      .from("merchants")
      .select("id, user_id, dodo_customer_id, dunning_started_at, dunning_email_count")
      .eq("dodo_subscription_id", subId)
      .single();

    if (!merchant) return;

    await adminSupabase
      .from("merchants")
      .update({
        plan_status:         "past_due",
        dunning_started_at:  merchant.dunning_started_at ?? now,
        dunning_email_count: (merchant.dunning_email_count ?? 0) + 1,
      })
      .eq("id", merchant.id);

    // Notify merchant to update payment method
    try {
      const { data: authData } = await adminSupabase.auth.admin.getUserById(merchant.user_id);
      const { data: merchantRow } = await adminSupabase
        .from("merchants")
        .select("business_name")
        .eq("id", merchant.id)
        .single();

      if (authData?.user?.email) {
        await sendPaymentFailedEmail(
          authData.user.email,
          merchantRow?.business_name ?? "Your Business"
        );
      }
    } catch (err) {
      console.error("[dodo/webhook] onSubscriptionOnHold dunning email failed:", (err as Error).message);
    }
  },

  // ─── subscription.failed ────────────────────────────────────────────────────
  // Initial subscription creation failed (card declined on first attempt).
  // Mark the pending billing_transaction as failed so the user can try again.
  onSubscriptionFailed: async (payload) => {
    const txRef = payload.data.metadata?.txRef as string | undefined;
    if (!txRef) return;

    const adminSupabase = createAdminClient();
    await adminSupabase
      .from("billing_transactions")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("tx_ref", txRef)
      .eq("status", "pending");
  },

  // ─── subscription.expired ───────────────────────────────────────────────────
  // Subscription reached its end date (non-renewing) or exhausted dunning retries.
  onSubscriptionExpired: async (payload) => {
    const subId = payload.data.subscription_id;
    const adminSupabase = createAdminClient();

    await adminSupabase
      .from("merchants")
      .update({
        dodo_subscription_id: null,
        dodo_plan:            null,
        plan_status:          "expired",
      })
      .eq("dodo_subscription_id", subId);
  },
    });
  }
  return _webhookHandler;
}

export async function POST(req: NextRequest) {
  return getWebhookHandler()(req);
}
