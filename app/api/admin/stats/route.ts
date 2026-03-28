import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * Admin revenue metrics endpoint.
 *
 * Returns MRR, active subscribers, churn count, dunning count,
 * and payment success rate. Protected by ADMIN_EMAILS env var.
 */
export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const adminSupabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // MRR: sum of completed billing transactions in last 30 days
  const { data: revenueRows } = await adminSupabase
    .from("billing_transactions")
    .select("amount")
    .eq("status", "completed")
    .gte("created_at", thirtyDaysAgo);

  const mrr = (revenueRows ?? []).reduce((sum, r) => sum + Number(r.amount), 0);

  // Active subscribers
  const { count: activeCount } = await adminSupabase
    .from("merchants")
    .select("id", { count: "exact", head: true })
    .not("flw_subscription_id", "is", null)
    .eq("plan_status", "active")
    .is("deleted_at", null);

  // Churn: cancelled in last 30 days (approximation via plan_status)
  const { count: churnCount } = await adminSupabase
    .from("merchants")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "cancelled")
    .is("deleted_at", null);

  // Dunning: merchants with past_due* status
  const { data: dunningRows } = await adminSupabase
    .from("merchants")
    .select("id, plan_status")
    .not("flw_subscription_id", "is", null)
    .like("plan_status", "past_due%")
    .is("deleted_at", null);

  const dunningCount = dunningRows?.length ?? 0;

  // Total merchants (ever subscribed)
  const { count: totalMerchants } = await adminSupabase
    .from("merchants")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  // Plan breakdown
  const { data: planBreakdown } = await adminSupabase
    .from("merchants")
    .select("flw_plan")
    .not("flw_subscription_id", "is", null)
    .eq("plan_status", "active")
    .is("deleted_at", null);

  const plans: Record<string, number> = {};
  for (const m of planBreakdown ?? []) {
    const plan = m.flw_plan ?? "unknown";
    plans[plan] = (plans[plan] ?? 0) + 1;
  }

  const active = activeCount ?? 0;
  const total = totalMerchants ?? 0;
  const churn = churnCount ?? 0;

  return NextResponse.json({
    mrr: Math.round(mrr * 100) / 100,
    activeSubscribers: active,
    churnCount: churn,
    churnRate: total > 0 ? Math.round((churn / total) * 10000) / 100 : 0,
    dunningCount,
    paymentSuccessRate: active + dunningCount > 0
      ? Math.round((active / (active + dunningCount)) * 10000) / 100
      : 100,
    totalMerchants: total,
    planBreakdown: plans,
  });
}
