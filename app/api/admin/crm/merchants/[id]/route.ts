import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeHealthScore } from "@/lib/admin-health-score";

/**
 * GET /api/admin/crm/merchants/[id]
 * Full merchant detail with enriched data for admin CRM.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const adminSupabase = createAdminClient();
  const merchantId = params.id;

  // Fetch merchant
  const { data: merchant, error: merchantError } = await adminSupabase
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .is("deleted_at", null)
    .single();

  if (merchantError || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Parallel queries for enrichment
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    authResult,
    allCallsResult,
    recentCallsResult,
    creditTxResult,
    billingTxResult,
    integrationsResult,
    notesResult,
  ] = await Promise.all([
    // Auth data
    adminSupabase.auth.admin.getUserById(merchant.user_id),

    // All call logs for stats (lightweight columns)
    adminSupabase
      .from("call_logs")
      .select("call_type, sentiment, started_at, duration_seconds, credits_charged")
      .eq("merchant_id", merchantId),

    // Recent 5 calls (with summary)
    adminSupabase
      .from("call_logs")
      .select(
        "id, direction, call_type, duration_seconds, sentiment, ai_summary, started_at, credits_charged"
      )
      .eq("merchant_id", merchantId)
      .order("started_at", { ascending: false })
      .limit(5),

    // Recent 10 credit transactions
    adminSupabase
      .from("credit_transactions")
      .select("id, type, amount, balance_after, description, created_at")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Recent 10 billing transactions
    adminSupabase
      .from("billing_transactions")
      .select("id, plan, amount, currency, status, provider, created_at")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Integrations
    adminSupabase
      .from("integrations")
      .select("platform, shop_domain, shop_name, connection_active")
      .eq("merchant_id", merchantId),

    // Admin notes
    adminSupabase
      .from("admin_notes")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false }),
  ]);

  // Compute call stats
  const allCalls = allCallsResult.data ?? [];
  const callsByType: Record<string, number> = {};
  const callsBySentiment: Record<string, number> = {};
  let calls7d = 0;
  let calls30d = 0;
  let lastCallAt: string | null = null;
  let totalDuration = 0;
  let totalCreditsUsed = 0;

  for (const call of allCalls) {
    // By type
    const ct = call.call_type ?? "general";
    callsByType[ct] = (callsByType[ct] ?? 0) + 1;

    // By sentiment
    const s = call.sentiment ?? "neutral";
    callsBySentiment[s] = (callsBySentiment[s] ?? 0) + 1;

    // Recency
    if (call.started_at) {
      if (!lastCallAt || call.started_at > lastCallAt) lastCallAt = call.started_at;
      const ts = new Date(call.started_at).getTime();
      if (ts >= new Date(sevenDaysAgo).getTime()) calls7d++;
      if (ts >= new Date(thirtyDaysAgo).getTime()) calls30d++;
    }

    totalDuration += call.duration_seconds ?? 0;
    totalCreditsUsed += call.credits_charged ?? 0;
  }

  // Auth data
  const authUser = authResult.data?.user;
  const email = authUser?.email ?? "";
  const lastSignInAt = authUser?.last_sign_in_at ?? null;

  // Health score
  const health = computeHealthScore({
    planStatus: merchant.plan_status,
    lastSignInAt,
    lastCallAt,
    creditBalance: merchant.credit_balance ?? 0,
    plan: merchant.plan,
    callsLast7Days: calls7d,
    callsLast30Days: calls30d,
    createdAt: merchant.created_at,
  });

  return NextResponse.json({
    merchant: {
      id: merchant.id,
      businessName: merchant.business_name,
      email,
      country: merchant.country,
      plan: merchant.plan,
      planStatus: merchant.plan_status,
      creditBalance: merchant.credit_balance ?? 0,
      creditMinutes: Math.floor((merchant.credit_balance ?? 0) / 60),
      accountActive: merchant.account_active,
      provisioningStatus: merchant.provisioning_status,
      onboardedAt: merchant.onboarded_at,
      createdAt: merchant.created_at,
      lastSignInAt,
      health,
    },
    callStats: {
      total: allCalls.length,
      byType: callsByType,
      bySentiment: callsBySentiment,
      calls7d,
      calls30d,
      totalDuration,
      totalCreditsUsed,
      lastCallAt,
    },
    recentCalls: recentCallsResult.data ?? [],
    creditTransactions: creditTxResult.data ?? [],
    billingTransactions: billingTxResult.data ?? [],
    integrations: integrationsResult.data ?? [],
    notes: notesResult.data ?? [],
  });
}
