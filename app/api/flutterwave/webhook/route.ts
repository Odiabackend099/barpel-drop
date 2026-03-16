import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCredits } from "@/lib/credits";
import { sendReceiptEmail } from "@/lib/email/client";

/** Plan amounts for receipt emails — matches PLAN_MAP in initiate route. */
const PLAN_AMOUNTS: Record<string, { amount: number; minutes: number }> = {
  starter: { amount: 29, minutes: 30 },
  growth:  { amount: 79, minutes: 100 },
  scale:   { amount: 179, minutes: 250 },
};

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
 * Subsequent months:
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
  if (!data) return;

  // Single admin client for the lifetime of this event handler
  const adminSupabase = createAdminClient();

  // ─── charge.completed ───────────────────────────────────────────────────────
  // Fired on every successful payment. data.id = transaction ID.
  // This is where we verify the payment and add credits.
  if (eventType === "charge.completed") {
    if (data.status !== "successful") return;

    const txRef = data.tx_ref as string | undefined;
    if (!txRef) return;

    // Idempotency: skip if already processed
    const { data: existingTx } = await adminSupabase
      .from("billing_transactions")
      .select("id, status, merchant_id, plan, amount, currency")
      .eq("tx_ref", txRef)
      .single();

    if (!existingTx) return;                       // Not initiated by us — ignore
    if (existingTx.status === "completed") return;  // Already processed

    // Re-verify with Flutterwave API before giving value
    const transactionId = data.id as number;
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );
    const verified = await verifyRes.json() as {
      status: string;
      data?: { status: string; amount: number; currency: string; id: number };
    };

    if (verified.data?.status !== "successful") return;

    // Guard against underpayment attacks
    if (
      verified.data.amount < existingTx.amount ||
      verified.data.currency !== existingTx.currency
    ) {
      console.error("[flw/webhook] Amount mismatch on tx_ref:", txRef);
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

    await addCredits(adminSupabase, existingTx.merchant_id, pkg.credits_seconds, flwTransactionId);

    await adminSupabase
      .from("billing_transactions")
      .update({ status: "completed", flw_transaction_id: flwTransactionId, updated_at: new Date().toISOString() })
      .eq("tx_ref", txRef);

    // Set the plan name — subscription ID is set separately by subscription.activated
    await adminSupabase
      .from("merchants")
      .update({ flw_plan: existingTx.plan })
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
        const planInfo = PLAN_AMOUNTS[existingTx.plan] ?? { amount: existingTx.amount, minutes: Math.round(pkg.credits_seconds / 60) };
        const nextRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (authData?.user?.email) {
          await sendReceiptEmail({
            to: authData.user.email,
            planName: existingTx.plan.charAt(0).toUpperCase() + existingTx.plan.slice(1),
            amount: `$${planInfo.amount}.00`,
            minutesAdded: planInfo.minutes,
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

    // Find the merchant via flw_plan (they should have just had charge.completed)
    // Use the customer email to locate the right merchant
    const customerData = data.customer as Record<string, unknown> | undefined;
    const email = customerData?.email as string | undefined;
    if (!email) return;

    // Look up merchant by email via auth
    const { data: { users } } = await adminSupabase.auth.admin.listUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return;

    // 32-day buffer (not 30) accounts for FLW's internal retry window + timezone edge cases
    const renewalDue = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

    await adminSupabase
      .from("merchants")
      .update({
        flw_subscription_id: subscriptionId,
        plan_status: "active",
        plan_renewal_due_at: renewalDue,
        dunning_started_at: null,
        dunning_email_count: 0,
      })
      .eq("user_id", user.id)
      .is("deleted_at", null);
  }

  // ─── subscription.renewed ───────────────────────────────────────────────────
  // Fired on each monthly renewal. data.id = FLW subscription ID.
  // Reset credit_balance to the plan's full allocation (unused minutes do not roll over).
  if (eventType === "subscription.renewed") {
    const subscriptionId = String(data.id ?? "");
    if (!subscriptionId) return;

    const { data: merchant } = await adminSupabase
      .from("merchants")
      .select("id, flw_plan")
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

    // Reset balance — subscription semantics: each month starts fresh
    // Also reset dunning state and push renewal due date forward
    const nextRenewalDue = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

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
    await adminSupabase.from("credit_transactions").insert({
      merchant_id:       merchant.id,
      type:              "purchase",
      amount:            pkg.credits_seconds,
      balance_after:     pkg.credits_seconds,
      description:       `Monthly renewal — ${merchant.flw_plan} plan`,
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
        const planInfo = PLAN_AMOUNTS[merchant.flw_plan] ?? { amount: 0, minutes: Math.round(pkg.credits_seconds / 60) };
        const nextRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (authData?.user?.email) {
          await sendReceiptEmail({
            to: authData.user.email,
            planName: merchant.flw_plan.charAt(0).toUpperCase() + merchant.flw_plan.slice(1),
            amount: `$${planInfo.amount}.00`,
            minutesAdded: planInfo.minutes,
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
      .update({ flw_subscription_id: null, flw_plan: null, plan_status: "cancelled" })
      .eq("flw_subscription_id", subscriptionId);
  }
}
