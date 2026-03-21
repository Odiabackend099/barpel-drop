import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCredits } from "@/lib/credits";
import { sendReceiptEmail } from "@/lib/email/client";
import { CREDIT_PACKAGES } from "@/lib/constants";

/** Renewal buffer days — accounts for FLW's internal retry window + timezone edge cases */
const MONTHLY_RENEWAL_BUFFER_DAYS = 32;
const ANNUAL_RENEWAL_BUFFER_DAYS = 367; // 365 + 2-day buffer

/** Plan amounts for receipt emails — derived from CREDIT_PACKAGES (single source of truth). */
const PLAN_AMOUNTS: Record<string, { monthlyAmount: number; annualAmount: number; credits: number }> = {};
for (const pkg of CREDIT_PACKAGES) {
  PLAN_AMOUNTS[pkg.id] = {
    monthlyAmount: pkg.priceUsdCents / 100,
    annualAmount: pkg.annualPriceUsdCents / 100,
    credits: pkg.credits,
  };
}

/**
 * Flutterwave webhook handler.
 *
 * Security:
 * - Signature: Flutterwave sends the secret hash verbatim in the `verif-hash` header.
 *   We compare using timingSafeEqual to prevent timing attacks.
 *   Length is checked first — timingSafeEqual throws RangeError on mismatched buffer lengths.
 * - Returns 401 on invalid signature (Flutterwave retries 3× at 30-min intervals; bad-sig
 *   requests should not be silently accepted).
 * - Returns 200 immediately; processing runs async (within 60s timeout).
 *
 * Event flow for a new subscription:
 *   1. charge.completed  → verify transaction, add credits, set flw_plan
 *   2. subscription.activated → store the real FLW subscription ID (needed for renewals)
 *
 * Subsequent renewals:
 *   subscription.renewed → reset credit_balance to plan allocation (not additive)
 *   subscription.cancelled → clear subscription columns (balance untouched)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("verif-hash");
  const secretHash = process.env.FLW_SECRET_HASH ?? "";

  // timingSafeEqual prevents timing attacks; length guard is required because
  // timingSafeEqual throws RangeError when the two buffers have different lengths.
  const sigBuf    = signature !== null ? Buffer.from(signature.trim()) : null;
  const secretBuf = Buffer.from(secretHash.trim());

  const sigValid =
    sigBuf !== null &&
    secretBuf.length > 0 &&
    sigBuf.length === secretBuf.length &&
    crypto.timingSafeEqual(sigBuf, secretBuf);

  if (!sigValid) {
    console.error("[flw/webhook] Invalid or missing verif-hash signature");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ received: true }, { status: 200 });
  }

  // Process async — return 200 within Flutterwave's 60s timeout
  handleFlutterwaveEvent(event).catch((err) =>
    console.error("[flw/webhook] Processing error:", (err as Error).message)
  );

  return Response.json({ received: true }, { status: 200 });
}

async function handleFlutterwaveEvent(event: Record<string, unknown>) {
  const eventType = event.event as string;
  const data = event.data as Record<string, unknown> | undefined;

  console.log("[flw/webhook] Processing event:", eventType);

  if (!data) {
    console.warn("[flw/webhook] Event missing data payload:", eventType);
    return;
  }

  // Single admin client for the lifetime of this event handler
  const adminSupabase = createAdminClient();

  // ─── charge.completed ───────────────────────────────────────────────────────
  // Fired on every successful payment. data.id = transaction ID.
  // This is where we verify the payment and add credits.
  if (eventType === "charge.completed") {
    if (data.status !== "successful") return;

    const txRef = data.tx_ref as string | undefined;
    if (!txRef) return;

    // Atomic idempotency: claim this transaction by setting status to "completed" in a single
    // UPDATE ... WHERE status = 'pending'. If 0 rows updated, another handler already processed it.
    // This prevents the race condition between webhook and verify endpoint.
    const { data: claimedRows, error: claimError } = await adminSupabase
      .from("billing_transactions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("tx_ref", txRef)
      .eq("status", "pending")
      .select("id, merchant_id, plan, amount, currency, billing_cycle");

    if (claimError || !claimedRows || claimedRows.length === 0) {
      // Either not initiated by us, already processed, or claimed by verify endpoint
      return;
    }

    const existingTx = claimedRows[0];

    // Re-verify with Flutterwave API before giving value
    const transactionId = data.id as number;
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );

    if (!verifyRes.ok) {
      console.error("[flw/webhook] Flutterwave verify API returned:", verifyRes.status);
      // Revert to pending so it can be retried
      await adminSupabase
        .from("billing_transactions")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("tx_ref", txRef);
      return;
    }

    const verified = await verifyRes.json() as {
      status: string;
      data?: { status: string; amount: number; currency: string; id: number };
    };

    if (verified.data?.status !== "successful") {
      await adminSupabase
        .from("billing_transactions")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("tx_ref", txRef);
      return;
    }

    // Guard against underpayment attacks
    if (
      verified.data.amount < existingTx.amount ||
      verified.data.currency !== existingTx.currency
    ) {
      console.error("[flw/webhook] Amount mismatch on tx_ref:", txRef, {
        expected: existingTx.amount,
        received: verified.data.amount,
      });
      await adminSupabase
        .from("billing_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("tx_ref", txRef);
      return;
    }

    const { data: pkg } = await adminSupabase
      .from("credit_packages")
      .select("credits_seconds")
      .ilike("name", existingTx.plan)
      .eq("is_active", true)
      .single();

    if (!pkg) {
      console.error("[flw/webhook] Credit package not found for plan:", existingTx.plan);
      return;
    }

    const flwTransactionId = verified.data.id.toString();

    // Credits: monthly allocation regardless of billing cycle.
    // Annual billing is just about payment — credits still allocate monthly via subscription.renewed.
    await addCredits(adminSupabase, existingTx.merchant_id, pkg.credits_seconds, flwTransactionId);

    // Mark transaction completed
    await adminSupabase
      .from("billing_transactions")
      .update({ status: "completed", flw_transaction_id: flwTransactionId, updated_at: new Date().toISOString() })
      .eq("tx_ref", txRef);

    // Set the plan name and billing cycle — subscription ID is set separately by subscription.activated
    const billingCycle = existingTx.billing_cycle ?? "monthly";
    await adminSupabase
      .from("merchants")
      .update({ flw_plan: existingTx.plan, billing_cycle: billingCycle })
      .eq("id", existingTx.merchant_id);

    // Send receipt email (best-effort — failure must not block webhook response)
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
            to: authData.user.email,
            planName: `${existingTx.plan.charAt(0).toUpperCase() + existingTx.plan.slice(1)} (${billingCycle})`,
            amount: `$${amount.toFixed(0)}.00`,
            minutesAdded: planInfo?.credits ?? Math.round(pkg.credits_seconds / 60),
            nextRenewalDate: nextRenewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          });
        }
      }
    } catch (err) {
      console.error("[flw/webhook] Receipt email failed:", (err as Error).message);
    }
  }

  // ─── subscription.activated ─────────────────────────────────────────────────
  // Fired once when a payment plan subscription is activated.
  // data.id = the FLW subscription ID (different from the transaction ID).
  // We store this ID so subscription.renewed and subscription.cancelled can find the merchant.
  if (eventType === "subscription.activated") {
    const subscriptionId = String(data.id ?? "");
    if (!subscriptionId) return;

    // Find the merchant via the most recent completed billing_transaction
    // (avoids the O(n) listUsers() antipattern)
    const customerData = data.customer as Record<string, unknown> | undefined;
    const email = customerData?.email as string | undefined;
    if (!email) return;

    // Look up via billing_transactions → merchant_id (most recent completed transaction for this email)
    const { data: recentTx } = await adminSupabase
      .from("billing_transactions")
      .select("merchant_id, billing_cycle")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentTx || recentTx.length === 0) return;

    // Find the merchant whose email matches — check each recent transaction's merchant
    let matchedMerchantId: string | null = null;
    let matchedBillingCycle: string = "monthly";
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
        matchedMerchantId = merchant.id;
        matchedBillingCycle = tx.billing_cycle ?? "monthly";
        break;
      }
    }

    if (!matchedMerchantId) return;

    const renewalBufferDays = matchedBillingCycle === "annual"
      ? ANNUAL_RENEWAL_BUFFER_DAYS
      : MONTHLY_RENEWAL_BUFFER_DAYS;
    const renewalDue = new Date(Date.now() + renewalBufferDays * 24 * 60 * 60 * 1000).toISOString();

    await adminSupabase
      .from("merchants")
      .update({
        flw_subscription_id: subscriptionId,
        plan_status: "active",
        plan_renewal_due_at: renewalDue,
        billing_cycle: matchedBillingCycle,
        dunning_started_at: null,
        dunning_email_count: 0,
      })
      .eq("id", matchedMerchantId);
  }

  // ─── subscription.renewed ───────────────────────────────────────────────────
  // Fired on each renewal. data.id = FLW subscription ID.
  // Reset credit_balance to the plan's full allocation (unused minutes do not roll over).
  if (eventType === "subscription.renewed") {
    const subscriptionId = String(data.id ?? "");
    if (!subscriptionId) return;

    const { data: merchant } = await adminSupabase
      .from("merchants")
      .select("id, flw_plan, billing_cycle")
      .eq("flw_subscription_id", subscriptionId)
      .single();

    if (!merchant || !merchant.flw_plan) return;

    const { data: pkg } = await adminSupabase
      .from("credit_packages")
      .select("credits_seconds")
      .ilike("name", merchant.flw_plan)
      .eq("is_active", true)
      .single();

    if (!pkg) return;

    // Renewal buffer: annual plans renew yearly, monthly plans renew monthly
    const billingCycle = merchant.billing_cycle ?? "monthly";
    const renewalBufferDays = billingCycle === "annual"
      ? ANNUAL_RENEWAL_BUFFER_DAYS
      : MONTHLY_RENEWAL_BUFFER_DAYS;
    const nextRenewalDue = new Date(Date.now() + renewalBufferDays * 24 * 60 * 60 * 1000).toISOString();

    // Reset balance — subscription semantics: each period starts fresh
    // Also reset dunning state and push renewal due date forward
    await adminSupabase
      .from("merchants")
      .update({
        credit_balance: pkg.credits_seconds,
        plan_status: "active",
        plan_renewal_due_at: nextRenewalDue,
        dunning_started_at: null,
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
      description:       `${renewalLabel} renewal — ${merchant.flw_plan} plan`,
      stripe_payment_id: `flw_renewal_${subscriptionId}_${Date.now()}`,
    });

    // Send receipt email for renewal (best-effort)
    try {
      const { data: merchantFull } = await adminSupabase
        .from("merchants")
        .select("user_id")
        .eq("id", merchant.id)
        .single();

      if (merchantFull) {
        const { data: authData } = await adminSupabase.auth.admin.getUserById(merchantFull.user_id);
        const planInfo = PLAN_AMOUNTS[merchant.flw_plan];
        const amount = billingCycle === "annual"
          ? planInfo?.annualAmount ?? 0
          : planInfo?.monthlyAmount ?? 0;
        const renewalDays = billingCycle === "annual" ? 365 : MONTHLY_RENEWAL_BUFFER_DAYS;
        const nextRenewal = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000);

        if (authData?.user?.email) {
          await sendReceiptEmail({
            to: authData.user.email,
            planName: `${merchant.flw_plan.charAt(0).toUpperCase() + merchant.flw_plan.slice(1)} (${billingCycle})`,
            amount: `$${amount.toFixed(0)}.00`,
            minutesAdded: planInfo?.credits ?? Math.round(pkg.credits_seconds / 60),
            nextRenewalDate: nextRenewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          });
        }
      }
    } catch (err) {
      console.error("[flw/webhook] Renewal receipt email failed:", (err as Error).message);
    }
  }

  // ─── subscription.cancelled ─────────────────────────────────────────────────
  // Fired when merchant cancels. Clear subscription columns.
  // Do NOT touch credit_balance — merchant keeps remaining minutes until they run out.
  if (eventType === "subscription.cancelled") {
    const subscriptionId = String(data.id ?? "");
    if (!subscriptionId) return;

    await adminSupabase
      .from("merchants")
      .update({ flw_subscription_id: null, flw_plan: null, plan_status: "cancelled", billing_cycle: "monthly" })
      .eq("flw_subscription_id", subscriptionId);
  }
}
