import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import { DODO_PRODUCT_MAP, CREDIT_PACKAGES } from "@/lib/constants";

/**
 * POST /api/billing/dodo/initiate
 *
 * Creates a Dodo Payments checkout session for USD subscription billing.
 * Returns a hosted checkout URL — the client does window.location.href = checkout_url.
 *
 * Security: tx_ref (UUID) is the trust anchor.
 * The webhook looks up billing_transactions by tx_ref, pulling merchantId from the DB —
 * not from metadata. metadata_userId is informational only and cannot be forged to credit
 * a different account.
 */

type BillingCycle = "monthly" | "annual";

export async function POST(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  let body: { plan?: string; billing_cycle?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planId = body.plan?.toLowerCase() as keyof typeof DODO_PRODUCT_MAP | undefined;
  if (!planId || !(planId in DODO_PRODUCT_MAP)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be starter, growth, or scale." },
      { status: 400 }
    );
  }

  const billingCycle: BillingCycle = body.billing_cycle === "annual" ? "annual" : "monthly";
  const productId = DODO_PRODUCT_MAP[planId][billingCycle];

  if (!productId) {
    return NextResponse.json(
      { error: `Dodo product ID for ${planId} ${billingCycle} not configured. Contact support.` },
      { status: 503 }
    );
  }

  // Fetch merchant — need id, email, and existing dodo_customer_id
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, dodo_customer_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  // tx_ref is the security anchor — stored in DB, verified in webhook
  const txRef = crypto.randomUUID();
  const creditPkg = CREDIT_PACKAGES.find((p) => p.id === planId);
  if (!creditPkg) {
    return NextResponse.json(
      { error: "Invalid plan. Must be starter, growth, or scale." },
      { status: 400 }
    );
  }
  const amount = billingCycle === "annual" ? creditPkg.annualPriceUsdCents : creditPkg.priceUsdCents;

  const adminSupabase = createAdminClient();

  const { error: insertError } = await adminSupabase.from("billing_transactions").insert({
    merchant_id:   merchant.id,
    tx_ref:        txRef,
    plan:          planId,
    amount:        amount / 100,   // store in USD (not cents)
    currency:      "USD",
    status:        "pending",
    provider:      "dodo",
    billing_cycle: billingCycle,
  });

  if (insertError) {
    console.error("[dodo/initiate] Failed to insert pending transaction:", insertError.message);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }

  // Build checkout URL via our Dodo adapter route
  // We derive the base URL from the incoming request so this works in all environments
  const { origin } = new URL(request.url);
  const checkoutParams = new URLSearchParams({
    productId,
    metadata_userId:       merchant.id,
    metadata_txRef:        txRef,
    metadata_plan:         planId,
    metadata_billingCycle: billingCycle,
  });

  // Pass existing customer ID to avoid duplicate Dodo customer records
  if (merchant.dodo_customer_id) {
    checkoutParams.set("customer_id", merchant.dodo_customer_id);
  }

  let checkoutUrl: string;
  try {
    const checkoutRes = await fetch(
      `${origin}/api/billing/dodo/checkout?${checkoutParams.toString()}`
    );
    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text().catch(() => "unknown");
      throw new Error(`Checkout returned ${checkoutRes.status}: ${errText}`);
    }
    const checkoutData = await checkoutRes.json() as { checkout_url?: string };
    if (!checkoutData.checkout_url) throw new Error("No checkout_url in response");
    checkoutUrl = checkoutData.checkout_url;
  } catch (err) {
    console.error("[dodo/initiate] Failed to get checkout URL:", (err as Error).message);
    // Clean up the pending transaction so it doesn't clutter the audit log
    await adminSupabase.from("billing_transactions").delete().eq("tx_ref", txRef);
    return NextResponse.json(
      { error: "Payment service unavailable. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ checkout_url: checkoutUrl });
}
