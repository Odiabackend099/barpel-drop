import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCredits } from "@/lib/credits";
import { sendReceiptEmail } from "@/lib/email/client";
import { CREDIT_PACKAGES } from "@/lib/constants";

/** Renewal buffer days — accounts for Paystack's internal retry window */
const MONTHLY_RENEWAL_BUFFER_DAYS = 32;
const ANNUAL_RENEWAL_BUFFER_DAYS = 367;

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
 * Paystack webhook handler.
 *
 * Security:
 * - Paystack signs each request with HMAC SHA-512 of the raw body using the secret key.
 *   Header: x-paystack-signature
 * - We compare using timingSafeEqual (length-safe) to prevent timing attacks.
 * - Returns 401 on invalid signature.
 * - Returns 200 immediately; async processing runs within the serverless timeout.
 * - Returns 200 even on processing errors after idempotency check — prevents Paystack
 *   from retrying and causing duplicate credit grants.
 *
 * Event flow (new subscription):
 *   1. charge.success  → verify status, add credits, update billing_transaction
 *   2. subscription.create → store SUB_xxx code + plan, set plan_status = 'active'
 *
 * Renewals:
 *   charge.success with subscription_code → reset credit_balance to plan allocation (not additive)
 *
 * Cancellation:
 *   subscription.disable → clear subscription columns (balance untouched)
 *
 * Failed payment:
 *   invoice.payment_failed → start dunning flow
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";

  // HMAC SHA-512 verification — timingSafeEqual prevents timing attacks
  // Length check is required because timingSafeEqual throws RangeError on mismatched lengths
  const expectedHash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  const sigBuf      = Buffer.from(signature.trim());
  const expectedBuf = Buffer.from(expectedHash);

  const sigValid =
    secretKey.length > 0 &&
    sigBuf.length > 0 &&
    sigBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(sigBuf, expectedBuf);

  if (!sigValid) {
    console.error("[paystack/webhook] Invalid or missing x-paystack-signature");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    // Malformed payload — return 200 so Paystack doesn't retry a broken request
    return Response.json({ received: true }, { status: 200 });
  }

  // Process async — return 200 within Paystack's webhook timeout
  handlePaystackEvent(event).catch((err) =>
    console.error("[paystack/webhook] Processing error:", (err as Error).message)
  );

  return Response.json({ received: true }, { status: 200 });
}

async function handlePaystackEvent(event: Record<string, unknown>) {
  const eventType = event.event as string;
  const data = event.data as Record<string, unknown> | undefined;

  console.log("[paystack/webhook] Processing event:", eventType);

  if (!data) {
    console.warn("[paystack/webhook] Event missing data payload:", eventType);
    return;
  }

  const adminSupabase = createAdminClient();

  // ─── charge.success ──────────────────────────────────────────────────────────
  // Fired on every successful charge — both initial subscription and renewals.
  // data.reference = our tx_ref (initial) or Paystack-generated reference (renewal).
  // data.subscription_code = present on subscription charges.
  if (eventType === "charge.success") {
    if (data.status !== "success") return;

    const subscriptionCode = data.subscription_code as string | undefined;
    const reference        = data.reference as string | undefined;
    if (!reference) return;

    // ── Renewal path: subscription_code exists and we know this merchant ──────
    if (subscriptionCode) {
      const { data: merchant } = await adminSupabase
        .from("merchants")
        .select("id, paystack_plan, billing_cycle")
        .eq("paystack_subscription_id", subscriptionCode)
        .single();

      if (merchant?.paystack_plan) {
        // This is a renewal — reset credit_balance to plan allocation (credits do not roll over)
        const { data: pkg } = await adminSupabase
          .from("credit_packages")
          .select("credits_seconds")
          .ilike("name", merchant.paystack_plan)
          .eq("is_active", true)
          .single();

        if (!pkg) {
          console.error("[paystack/webhook] Credit package not found for plan:", merchant.paystack_plan);
          return;
        }

        const billingCycle = merchant.billing_cycle ?? "monthly";
        const renewalBufferDays = billingCycle === "annual"
          ? ANNUAL_RENEWAL_BUFFER_DAYS
          : MONTHLY_RENEWAL_BUFFER_DAYS;
        const nextRenewalDue = new Date(Date.now() + renewalBufferDays * 24 * 60 * 60 * 1000).toISOString();

        await adminSupabase
          .from("merchants")
          .update({
            credit_balance:     pkg.credits_seconds,
            plan_status:        "active",
            plan_renewal_due_at: nextRenewalDue,
            dunning_started_at:  null,
            dunning_email_count: 0,
          })
          .eq("id", merchant.id);

        // Insert renewal record into credit_transactions for audit trail
        const renewalLabel = billingCycle === "annual" ? "Annual" : "Monthly";
        await adminSupabase.from("credit_transactions").insert({
          merchant_id:       merchant.id,
          type:              "purchase",
          amount:            pkg.credits_seconds,
          balance_after:     pkg.credits_seconds,
          description:       `${renewalLabel} renewal — ${merchant.paystack_plan} plan`,
          stripe_payment_id: `pstk_renewal_${subscriptionCode}_${Date.now()}`,
        });

        // Best-effort receipt email for renewal
        try {
          const { data: merchantFull } = await adminSupabase
            .from("merchants")
            .select("user_id")
            .eq("id", merchant.id)
            .single();

          if (merchantFull) {
            const { data: authData } = await adminSupabase.auth.admin.getUserById(merchantFull.user_id);
            const planInfo = PLAN_AMOUNTS[merchant.paystack_plan];
            const amount = billingCycle === "annual"
              ? planInfo?.annualAmount ?? 0
              : planInfo?.monthlyAmount ?? 0;
            const renewalDays = billingCycle === "annual" ? 365 : MONTHLY_RENEWAL_BUFFER_DAYS;
            const nextRenewal = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000);

            if (authData?.user?.email) {
              await sendReceiptEmail({
                to:              authData.user.email,
                planName:        `${merchant.paystack_plan.charAt(0).toUpperCase() + merchant.paystack_plan.slice(1)} (${billingCycle})`,
                amount:          `$${amount.toFixed(0)}.00`,
                minutesAdded:    planInfo?.credits ?? Math.round(pkg.credits_seconds / 60),
                nextRenewalDate: nextRenewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
              });
            }
          }
        } catch (err) {
          console.error("[paystack/webhook] Renewal receipt email failed:", (err as Error).message);
        }

        return; // Renewal handled — stop here
      }
    }

    // ── Initial payment path: claim the pending billing_transaction ───────────
    // Atomic idempotency: UPDATE WHERE status = 'pending' ensures only one handler
    // processes this reference (prevents race with verify endpoint if implemented).
    const { data: claimedRows, error: claimError } = await adminSupabase
      .from("billing_transactions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("tx_ref", reference)
      .eq("status", "pending")
      .select("id, merchant_id, plan, amount, currency, billing_cycle");

    if (claimError || !claimedRows || claimedRows.length === 0) {
      // Already processed or not our transaction
      return;
    }

    const existingTx = claimedRows[0];

    // Guard against underpayment attacks — amount is in subunits from Paystack
    const receivedAmountSubunits = data.amount as number;
    const expectedAmountSubunits = existingTx.amount * 100; // stored in USD, Paystack returns cents
    if (receivedAmountSubunits < expectedAmountSubunits) {
      console.error("[paystack/webhook] Amount mismatch on reference:", reference, {
        expected: expectedAmountSubunits,
        received: receivedAmountSubunits,
      });
      await adminSupabase
        .from("billing_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("tx_ref", reference);
      return;
    }

    const { data: pkg } = await adminSupabase
      .from("credit_packages")
      .select("credits_seconds")
      .ilike("name", existingTx.plan)
      .eq("is_active", true)
      .single();

    if (!pkg) {
      console.error("[paystack/webhook] Credit package not found for plan:", existingTx.plan);
      return;
    }

    const paystackTxId = String(data.id ?? reference);

    // Add credits atomically — addCredits uses row-level locking
    await addCredits(adminSupabase, existingTx.merchant_id, pkg.credits_seconds, `pstk_${paystackTxId}`);

    // Mark transaction completed
    await adminSupabase
      .from("billing_transactions")
      .update({
        status:                "completed",
        paystack_transaction_id: paystackTxId,
        updated_at:            new Date().toISOString(),
      })
      .eq("tx_ref", reference);

    // Set plan on merchant — subscription_code arrives via subscription.create shortly after
    const billingCycle = existingTx.billing_cycle ?? "monthly";
    await adminSupabase
      .from("merchants")
      .update({ paystack_plan: existingTx.plan, billing_cycle: billingCycle })
      .eq("id", existingTx.merchant_id);

    // Best-effort initial receipt email
    try {
      const { data: merchantRow } = await adminSupabase
        .from("merchants")
        .select("user_id")
        .eq("id", existingTx.merchant_id)
        .single();

      if (merchantRow) {
        const { data: authData } = await adminSupabase.auth.admin.getUserById(merchantRow.user_id);
        const planInfo = PLAN_AMOUNTS[existingTx.plan];
        const amount = billingCycle === "annual"
          ? planInfo?.annualAmount ?? existingTx.amount
          : planInfo?.monthlyAmount ?? existingTx.amount;
        const renewalDays = billingCycle === "annual" ? 365 : MONTHLY_RENEWAL_BUFFER_DAYS;
        const nextRenewal = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000);

        if (authData?.user?.email) {
          await sendReceiptEmail({
            to:              authData.user.email,
            planName:        `${existingTx.plan.charAt(0).toUpperCase() + existingTx.plan.slice(1)} (${billingCycle})`,
            amount:          `$${amount.toFixed(0)}.00`,
            minutesAdded:    planInfo?.credits ?? Math.round(pkg.credits_seconds / 60),
            nextRenewalDate: nextRenewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          });
        }
      }
    } catch (err) {
      console.error("[paystack/webhook] Receipt email failed:", (err as Error).message);
    }
  }

  // ─── subscription.create ─────────────────────────────────────────────────────
  // Fired once when a subscription is created after the first charge.
  // data.subscription_code = SUB_xxx — store this for renewals and cancellation.
  // data.customer.customer_code = CUS_xxx — store for reference.
  if (eventType === "subscription.create") {
    const subscriptionCode = data.subscription_code as string | undefined;
    if (!subscriptionCode) return;

    const customerData = data.customer as Record<string, unknown> | undefined;
    const email        = customerData?.email as string | undefined;
    if (!email) return;

    // Find merchant by most recent completed billing_transaction for this email
    const { data: recentTx } = await adminSupabase
      .from("billing_transactions")
      .select("merchant_id, billing_cycle")
      .eq("status", "completed")
      .eq("provider", "paystack")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentTx || recentTx.length === 0) return;

    let matchedMerchantId: string | null = null;
    let matchedBillingCycle = "monthly";

    for (const tx of recentTx) {
      const { data: merchant } = await adminSupabase
        .from("merchants")
        .select("id, user_id")
        .eq("id", tx.merchant_id)
        .is("deleted_at", null)
        .single();

      if (!merchant) continue;

      const { data: authData } = await adminSupabase.auth.admin.getUserById(merchant.user_id);
      if (authData?.user?.email === email) {
        matchedMerchantId    = merchant.id;
        matchedBillingCycle  = tx.billing_cycle ?? "monthly";
        break;
      }
    }

    if (!matchedMerchantId) return;

    const renewalBufferDays = matchedBillingCycle === "annual"
      ? ANNUAL_RENEWAL_BUFFER_DAYS
      : MONTHLY_RENEWAL_BUFFER_DAYS;
    const renewalDue = new Date(Date.now() + renewalBufferDays * 24 * 60 * 60 * 1000).toISOString();

    const customerCode = customerData?.customer_code as string | undefined;

    await adminSupabase
      .from("merchants")
      .update({
        paystack_subscription_id: subscriptionCode,
        paystack_customer_id:     customerCode ?? null,
        plan_status:              "active",
        plan_renewal_due_at:      renewalDue,
        billing_cycle:            matchedBillingCycle,
        dunning_started_at:       null,
        dunning_email_count:      0,
      })
      .eq("id", matchedMerchantId);
  }

  // ─── subscription.disable ────────────────────────────────────────────────────
  // Fired when a subscription is cancelled (by merchant or Paystack after dunning).
  // Clear subscription columns — credit balance untouched.
  if (eventType === "subscription.disable") {
    const subscriptionCode = data.subscription_code as string | undefined;
    if (!subscriptionCode) return;

    await adminSupabase
      .from("merchants")
      .update({
        paystack_subscription_id: null,
        paystack_plan:            null,
        plan_status:              "cancelled",
        billing_cycle:            "monthly",
      })
      .eq("paystack_subscription_id", subscriptionCode);
  }

  // ─── invoice.payment_failed ───────────────────────────────────────────────────
  // Fired when a recurring charge fails. Trigger dunning flow.
  if (eventType === "invoice.payment_failed") {
    const subscriptionData = data.subscription as Record<string, unknown> | undefined;
    const subscriptionCode = subscriptionData?.subscription_code as string | undefined;
    if (!subscriptionCode) return;

    const now = new Date().toISOString();

    const { data: merchant } = await adminSupabase
      .from("merchants")
      .select("id, dunning_email_count, dunning_started_at")
      .eq("paystack_subscription_id", subscriptionCode)
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
  }
}
