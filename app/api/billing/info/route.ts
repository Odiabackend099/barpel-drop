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
      .select("id, credit_balance, flw_plan, plan_status, flw_subscription_id, billing_cycle")
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

    return NextResponse.json({
      balance: merchant.credit_balance,
      plan: merchant.flw_plan ?? "free",
      plan_status: merchant.plan_status ?? "none",
      has_subscription: !!merchant.flw_subscription_id,
      billing_cycle: merchant.billing_cycle ?? "monthly",
      transactions: transactions ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/billing/info] Unexpected error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
