import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import { initializeTransaction } from "@/lib/paystack/client";

/**
 * Paystack checkout initiation.
 *
 * Returns an `access_code` for the frontend to open the Paystack inline popup.
 * The secret key never leaves the server — only the public key is returned.
 *
 * Supports both monthly and annual billing cycles.
 * Plans are created once in the Paystack dashboard; plan codes come from env vars.
 */

type BillingCycle = "monthly" | "annual";

interface PlanConfig {
  planCode: string;
  amount: number;    // USD cents — must match the plan configured in Paystack dashboard
  overageLabel: string;
}

const PLAN_MAP: Record<string, Record<BillingCycle, PlanConfig>> = {
  starter: {
    monthly: { planCode: process.env.PAYSTACK_PLAN_CODE_STARTER ?? "", amount: 2900, overageLabel: "$0.99/min" },
    annual:  { planCode: process.env.PAYSTACK_PLAN_CODE_STARTER_ANNUAL ?? "", amount: 31300, overageLabel: "$0.99/min" },
  },
  growth: {
    monthly: { planCode: process.env.PAYSTACK_PLAN_CODE_GROWTH ?? "", amount: 7900, overageLabel: "$0.79/min" },
    annual:  { planCode: process.env.PAYSTACK_PLAN_CODE_GROWTH_ANNUAL ?? "", amount: 85300, overageLabel: "$0.79/min" },
  },
  scale: {
    monthly: { planCode: process.env.PAYSTACK_PLAN_CODE_SCALE ?? "", amount: 17900, overageLabel: "$0.69/min" },
    annual:  { planCode: process.env.PAYSTACK_PLAN_CODE_SCALE_ANNUAL ?? "", amount: 193300, overageLabel: "$0.69/min" },
  },
};

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

  const planId = body.plan?.toLowerCase();
  if (!planId || !PLAN_MAP[planId]) {
    return NextResponse.json({ error: "Invalid plan. Must be starter, growth, or scale." }, { status: 400 });
  }

  const billingCycle: BillingCycle = body.billing_cycle === "annual" ? "annual" : "monthly";
  const planConfig = PLAN_MAP[planId][billingCycle];

  if (!planConfig.planCode) {
    return NextResponse.json(
      { error: `${billingCycle === "annual" ? "Annual" : "Monthly"} billing not configured. Contact support.` },
      { status: 503 }
    );
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, business_name")
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

  // Unique reference — used as idempotency key in billing_transactions
  const reference = `barpel_pstk_${merchant.id}_${Date.now()}`;
  const adminSupabase = createAdminClient();

  // Record pending transaction before opening checkout
  // (audit trail even for abandoned payments)
  const { error: insertError } = await adminSupabase.from("billing_transactions").insert({
    merchant_id:   merchant.id,
    tx_ref:        reference,
    plan:          planId,
    amount:        planConfig.amount / 100,   // store in USD (not cents)
    currency:      "USD",
    status:        "pending",
    provider:      "paystack",
    billing_cycle: billingCycle,
  });

  if (insertError) {
    console.error("[paystack/initiate] Failed to insert pending transaction:", insertError.message);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }

  // Call Paystack Initialize Transaction API server-side
  // This returns an access_code used to open the popup — secrets never touch the client
  let paystackData: { access_code: string; reference: string };
  try {
    const result = await initializeTransaction({
      email,
      amount:    planConfig.amount,           // USD cents
      currency:  "USD",
      reference,
      plan:      planConfig.planCode,
      metadata: {
        merchant_id:   merchant.id,
        plan:          planId,
        billing_cycle: billingCycle,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: planId },
          { display_name: "Billing Cycle", variable_name: "billing_cycle", value: billingCycle },
        ],
      },
    });
    paystackData = result.data;
  } catch (err) {
    console.error("[paystack/initiate] Paystack API error:", (err as Error).message);
    // Clean up the pending transaction so it doesn't clutter the audit log
    await adminSupabase.from("billing_transactions").delete().eq("tx_ref", reference);
    return NextResponse.json({ error: "Payment service unavailable. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    access_code:    paystackData.access_code,
    reference:      paystackData.reference,
    public_key:     process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email,
    amount:         planConfig.amount,
    plan_code:      planConfig.planCode,
    currency:       "USD",
  });
}
