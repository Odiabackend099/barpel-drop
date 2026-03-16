import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCredits } from "@/lib/credits";

/**
 * Server-side verification of a Flutterwave transaction after the modal callback.
 *
 * CRITICAL: Per Flutterwave best practices, ALWAYS re-query their API to verify
 * a transaction before giving value to a customer. Never trust the frontend callback alone.
 * Source: developer.flutterwave.com/docs/webhooks
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Load the pending transaction — confirms tx_ref belongs to this merchant
  const { data: pendingTx } = await adminSupabase
    .from("billing_transactions")
    .select("id, plan, amount, currency, status")
    .eq("tx_ref", tx_ref)
    .eq("merchant_id", merchant.id)
    .single();

  if (!pendingTx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Idempotency: already processed via webhook or prior verify call
  if (pendingTx.status === "completed") {
    return NextResponse.json({ success: true, plan: pendingTx.plan, already_processed: true });
  }

  // Re-verify with Flutterwave API before giving value
  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
    { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
  );
  const verifyData = await verifyRes.json() as {
    status: string;
    data?: { status: string; amount: number; currency: string; id: number };
  };

  if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
    return NextResponse.json({ error: "Transaction not verified by Flutterwave" }, { status: 400 });
  }

  // Guard against underpayment attacks
  if (
    verifyData.data.amount < pendingTx.amount ||
    verifyData.data.currency !== pendingTx.currency
  ) {
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

  // Add credits to merchant balance
  await addCredits(adminSupabase, merchant.id, pkg.credits_seconds, flwTransactionId);

  // Mark transaction completed + store FLW transaction ID
  await adminSupabase
    .from("billing_transactions")
    .update({ status: "completed", flw_transaction_id: flwTransactionId, updated_at: new Date().toISOString() })
    .eq("tx_ref", tx_ref);

  // Record which FLW plan this merchant is on.
  // flw_subscription_id is NOT set here — the subscription.activated webhook event
  // fires separately and carries the real FLW subscription ID for renewal tracking.
  await adminSupabase
    .from("merchants")
    .update({ flw_plan: pendingTx.plan })
    .eq("id", merchant.id);

  return NextResponse.json({ success: true, plan: pendingTx.plan });
}
