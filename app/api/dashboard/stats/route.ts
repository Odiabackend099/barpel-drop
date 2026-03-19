import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

const MONEY_SAVED_PER_CALL = 3.40;

/**
 * GET /api/dashboard/stats
 * Returns all dashboard stats in one round trip using get_dashboard_stats RPC.
 * Query params: from (ISO date), to (ISO date)
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const { data: stats, error } = await supabase.rpc("get_dashboard_stats", {
    p_merchant_id: merchant.id,
    ...(from ? { p_date_from: from } : {}),
    ...(to ? { p_date_to: to + "T23:59:59.999Z" } : {}),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute money saved: total calls × $3.40 per spec 1.5
  const totalCalls = stats?.total_calls ?? 0;
  const moneySaved = parseFloat((totalCalls * MONEY_SAVED_PER_CALL).toFixed(2));

  return NextResponse.json({
    ...(stats ?? {}),
    money_saved: moneySaved,
  });
}
