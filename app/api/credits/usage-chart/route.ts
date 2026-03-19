import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/credits/usage-chart
 * Returns daily credit usage from call_logs for the last 30 days.
 */
export async function GET(request: Request) {
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: logs } = await supabase
    .from("call_logs")
    .select("created_at, credits_charged")
    .eq("merchant_id", merchant.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Group by day
  const byDay: Record<string, number> = {};
  for (const log of logs ?? []) {
    const day = new Date(log.created_at).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + (log.credits_charged ?? 0);
  }

  // Fill in missing days with 0
  const result: { date: string; credits: number }[] = [];
  const cursor = new Date(thirtyDaysAgo);
  const today = new Date();
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, credits: byDay[key] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({ usage: result });
}
