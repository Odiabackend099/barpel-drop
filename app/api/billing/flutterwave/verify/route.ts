import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCredits } from "@/lib/credits";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * Server-side verification of a Flutterwave transaction after the modal callback.
 *
 * CRITICAL: Per Flutterwave best practices, ALWAYS re-query their API to verify
 * a transaction before giving value to a customer. Never trust the frontend callback alone.
 * Source: developer.flutterwave.com/docs/webhooks
 *
 * Race condition protection: Uses atomic UPDATE ... WHERE status = 'pending' to claim
 * the transaction. If the webhook handler already processed it, this returns 0 rows
 * and we skip — preventing double-crediting.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  let body: { transaction_id?: string | number; tx_ref?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { transaction_id, tx_ref } = body;
  if (!transaction_id || !tx_ref) {
    return NextResponse.json({ error: "Missing transaction_id or tx_ref" }, { status: 400 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const adminSupabase = createAdminClient();

  // Atomic claim: set status to "processing" only if currently "pending".
  // If webhook already processed it, this returns 0 rows → skip.
  const { data: claimedRows, error: claimError } = await adminSupabase
    .from("billing_transactions")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("tx_ref", tx_ref)
    .eq("merchant_id", merchant.id)
    .eq("status", "pending")
    .select("id, plan, amount, currency, billing_cycle");

  if (claimError) {
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }

  // If no rows claimed, either already processed or not found
  if (!claimedRows || claimedRows.length === 0) {
    // Check if it was already completed (idempotent success)
    const { data: existingTx } = await adminSupabase
      .from("billing_transactions")
      .select("plan, status")
      .eq("tx_ref", tx_ref)
      .eq("merchant_id", merchant.id)
      .single();

    if (existingTx?.status === "completed" || existingTx?.status === "processing") {
      return NextResponse.json({ success: true, plan: existingTx.plan, already_processed: true });
    }
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const pendingTx = claimedRows[0];

  // Re-verify with Flutterwave API before giving value
  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
    { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
  );

  if (!verifyRes.ok) {
    // Revert to pending so webhook can retry
    await adminSupabase
      .from("billing_transactions")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("tx_ref", tx_ref);
    return NextResponse.json({ error: "Failed to verify with Flutterwave" }, { status: 502 });
  }

  const verifyData = await verifyRes.json() as {
    status: string;
    data?: { status: string; amount: number; currency: string; id: number };
  };

  if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
    await adminSupabase
      .from("billing_transactions")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("tx_ref", tx_ref);
    return NextResponse.json({ error: "Transaction not verified by Flutterwave" }, { status: 400 });
  }

  // Guard against underpayment attacks
  if (
    verifyData.data.amount < pendingTx.amount ||
    verifyData.data.currency !== pendingTx.currency
  ) {
    await adminSupabase
      .from("billing_transactions")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("tx_ref", tx_ref);
    return NextResponse.json({ error: "Amount or currency mismatch" }, { status: 400 });
  }

  // Look up credits_seconds from credit_packages (authoritative source)
  const { data: pkg } = await adminSupabase
    .from("credit_packages")
    .select("credits_seconds")
    .ilike("name", pendingTx.plan)
    .eq("is_active", true)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: "Credit package not found" }, { status: 500 });
  }

  const flwTransactionId = verifyData.data.id.toString();

  // Add credits to merchant balance (monthly allocation regardless of billing cycle)
  await addCredits(adminSupabase, merchant.id, pkg.credits_seconds, flwTransactionId);

  // Mark transaction completed + store FLW transaction ID
  await adminSupabase
    .from("billing_transactions")
    .update({ status: "completed", flw_transaction_id: flwTransactionId, updated_at: new Date().toISOString() })
    .eq("tx_ref", tx_ref);

  // Record which FLW plan and billing cycle this merchant is on.
  // flw_subscription_id is NOT set here — the subscription.activated webhook event
  // fires separately and carries the real FLW subscription ID for renewal tracking.
  const billingCycle = pendingTx.billing_cycle ?? "monthly";
  await adminSupabase
    .from("merchants")
    .update({ flw_plan: pendingTx.plan, billing_cycle: billingCycle })
    .eq("id", merchant.id);

  return NextResponse.json({ success: true, plan: pendingTx.plan });
}
