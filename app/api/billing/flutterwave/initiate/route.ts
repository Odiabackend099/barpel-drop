import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * Flutterwave checkout initiation.
 * Returns the FLW config object for the frontend to open the payment modal.
 * The secret key never leaves the server — only the public key is returned.
 *
 * Supports both monthly and annual billing cycles.
 * Annual plans use separate FLW payment plan IDs with 10% discount.
 */

type BillingCycle = "monthly" | "annual";

interface PlanConfig {
  planId: string;
  amount: number;
  overageLabel: string;
}

// Plan amounts and FLW payment plan IDs (plans created once via scripts/create-flw-plans.ts)
const PLAN_MAP: Record<string, Record<BillingCycle, PlanConfig>> = {
  starter: {
    monthly: { planId: process.env.FLW_PLAN_ID_STARTER ?? "", amount: 29, overageLabel: "$0.99/min" },
    annual:  { planId: process.env.FLW_PLAN_ID_STARTER_ANNUAL ?? "", amount: 313, overageLabel: "$0.99/min" },
  },
  growth: {
    monthly: { planId: process.env.FLW_PLAN_ID_GROWTH ?? "", amount: 79, overageLabel: "$0.79/min" },
    annual:  { planId: process.env.FLW_PLAN_ID_GROWTH_ANNUAL ?? "", amount: 853, overageLabel: "$0.79/min" },
  },
  scale: {
    monthly: { planId: process.env.FLW_PLAN_ID_SCALE ?? "", amount: 179, overageLabel: "$0.69/min" },
    annual:  { planId: process.env.FLW_PLAN_ID_SCALE_ANNUAL ?? "", amount: 1933, overageLabel: "$0.69/min" },
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

  // Guard: FLW plan IDs must be configured
  if (!planConfig.planId) {
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

  const adminSupabase = createAdminClient();

  // Fetch the user email via admin API (auth.getUser() on server client already has it)
  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  // Unique reference per transaction — used as idempotency key
  const txRef = `barpel_${merchant.id}_${Date.now()}`;

  const cycleLabel = billingCycle === "annual" ? "Annual" : "Monthly";

  // Record pending transaction before opening checkout (audit trail even for abandoned payments)
  const { error: insertError } = await adminSupabase.from("billing_transactions").insert({
    merchant_id:    merchant.id,
    tx_ref:         txRef,
    plan:           planId,
    amount:         planConfig.amount,
    currency:       "USD",
    status:         "pending",
    provider:       "flutterwave",
    billing_cycle:  billingCycle,
  });

  if (insertError) {
    console.error("[flw/initiate] Failed to insert pending transaction:", insertError.message);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }

  // Return full FLW config — frontend uses this with useFlutterwave hook
  return NextResponse.json({
    public_key:      process.env.FLW_PUBLIC_KEY,
    tx_ref:          txRef,
    amount:          planConfig.amount,
    currency:        "USD",
    payment_options: "card",
    payment_plan:    planConfig.planId,
    customer: {
      email,
      name: merchant.business_name ?? "Merchant",
    },
    customizations: {
      title:       "Barpel AI",
      description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan (${cycleLabel}) — ${planConfig.overageLabel} overage`,
      logo:        `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
    },
    redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?status=success`,
    meta: {
      merchant_id:   merchant.id,
      plan:          planId,
      billing_cycle: billingCycle,
    },
  });
}
