import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { user } = await getAuthUser(supabase, request);
    if (!user) return unauthorizedResponse();

    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("id, credit_balance, flw_plan, flw_subscription_id, paystack_plan, paystack_subscription_id, dodo_plan, dodo_subscription_id, plan_status, billing_cycle")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error || !merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const { data: transactions } = await supabase
      .from("billing_transactions")
      .select("id, created_at, plan, amount, currency, status, billing_cycle")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const activePlan = merchant.paystack_plan ?? merchant.flw_plan ?? merchant.dodo_plan ?? null;
    const hasSubscription = !!(
      merchant.paystack_subscription_id ??
      merchant.flw_subscription_id ??
      merchant.dodo_subscription_id
    );

    return NextResponse.json({
      balance: merchant.credit_balance,
      plan: activePlan ?? "free",
      plan_status: merchant.plan_status ?? "none",
      has_subscription: hasSubscription,
      billing_cycle: merchant.billing_cycle ?? "monthly",
      // Provider-specific fields for callers that need them
      flw_plan: merchant.flw_plan ?? null,
      paystack_plan: merchant.paystack_plan ?? null,
      dodo_plan: merchant.dodo_plan ?? null,
      transactions: transactions ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/billing/info] Unexpected error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
