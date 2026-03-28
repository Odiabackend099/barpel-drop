import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeHealthScore, type HealthStatus } from "@/lib/admin-health-score";

/**
 * GET /api/admin/crm/merchants
 * Paginated merchant list with search, filters, sort, and health scores.
 */
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const adminSupabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
  const offset = (page - 1) * limit;

  const search = searchParams.get("search");
  const planFilter = searchParams.get("plan");
  const healthFilter = searchParams.get("health") as HealthStatus | null;
  const countryFilter = searchParams.get("country");
  const sortColumn = searchParams.get("sort") ?? "created_at";
  const sortOrder = searchParams.get("order") === "asc" ? true : false; // ascending?

  const VALID_SORT_COLUMNS = [
    "created_at",
    "business_name",
    "credit_balance",
    "country",
    "plan",
  ];
  const safeSort = VALID_SORT_COLUMNS.includes(sortColumn) ? sortColumn : "created_at";

  // Build merchant query
  let query = adminSupabase
    .from("merchants")
    .select(
      "id, user_id, business_name, country, credit_balance, plan, plan_status, account_active, onboarded_at, created_at",
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order(safeSort, { ascending: sortOrder })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("business_name", `%${search}%`);
  }
  if (planFilter) {
    query = query.eq("plan", planFilter);
  }
  if (countryFilter) {
    query = query.eq("country", countryFilter);
  }

  const { data: merchants, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!merchants || merchants.length === 0) {
    return NextResponse.json({ merchants: [], total: count ?? 0, page, totalPages: 0 });
  }

  const merchantIds = merchants.map((m) => m.id);
  const userIds = merchants.map((m) => m.user_id);

  // Fetch call stats for these merchants (lightweight: only merchant_id + started_at)
  const { data: callRows } = await adminSupabase
    .from("call_logs")
    .select("merchant_id, started_at")
    .in("merchant_id", merchantIds);

  // Aggregate call stats per merchant in JS
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const callStats = new Map<
    string,
    { totalCalls: number; lastCallAt: string | null; calls7d: number; calls30d: number }
  >();

  for (const row of callRows ?? []) {
    const existing = callStats.get(row.merchant_id) ?? {
      totalCalls: 0,
      lastCallAt: null as string | null,
      calls7d: 0,
      calls30d: 0,
    };
    existing.totalCalls++;

    const startedMs = new Date(row.started_at).getTime();
    if (!existing.lastCallAt || row.started_at > existing.lastCallAt) {
      existing.lastCallAt = row.started_at;
    }
    if (startedMs >= sevenDaysAgo) existing.calls7d++;
    if (startedMs >= thirtyDaysAgo) existing.calls30d++;

    callStats.set(row.merchant_id, existing);
  }

  // Fetch auth data for last_sign_in_at (parallel)
  const authResults = await Promise.allSettled(
    userIds.map((uid) => adminSupabase.auth.admin.getUserById(uid))
  );

  const authMap = new Map<string, { email: string; lastSignInAt: string | null }>();
  for (let i = 0; i < userIds.length; i++) {
    const result = authResults[i];
    if (result.status === "fulfilled" && result.value.data?.user) {
      const u = result.value.data.user;
      authMap.set(userIds[i], {
        email: u.email ?? "",
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }
  }

  // Enrich merchants with call stats, auth data, and health scores
  const enriched = merchants.map((m) => {
    const stats = callStats.get(m.id) ?? {
      totalCalls: 0,
      lastCallAt: null,
      calls7d: 0,
      calls30d: 0,
    };
    const auth = authMap.get(m.user_id) ?? { email: "", lastSignInAt: null };

    const health = computeHealthScore({
      planStatus: m.plan_status,
      lastSignInAt: auth.lastSignInAt,
      lastCallAt: stats.lastCallAt,
      creditBalance: m.credit_balance ?? 0,
      plan: m.plan,
      callsLast7Days: stats.calls7d,
      callsLast30Days: stats.calls30d,
      createdAt: m.created_at,
    });

    return {
      id: m.id,
      businessName: m.business_name,
      email: auth.email,
      country: m.country,
      plan: m.plan,
      planStatus: m.plan_status,
      creditBalance: m.credit_balance ?? 0,
      creditMinutes: Math.floor((m.credit_balance ?? 0) / 60),
      totalCalls: stats.totalCalls,
      lastCallAt: stats.lastCallAt,
      lastSignInAt: auth.lastSignInAt,
      createdAt: m.created_at,
      health,
    };
  });

  // Post-query health filter (if set)
  const filtered = healthFilter
    ? enriched.filter((m) => m.health === healthFilter)
    : enriched;

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    merchants: filtered,
    total,
    page,
    totalPages,
  });
}
