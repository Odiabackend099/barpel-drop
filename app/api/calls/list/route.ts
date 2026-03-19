import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/calls/list
 * Returns paginated call logs with optional filters.
 * Query params: page, limit, type, sentiment, direction, from, to, search
 * Caller numbers are masked to show only last 4 digits.
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
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
  const offset = (page - 1) * limit;

  const callType = searchParams.get("type");
  const sentiment = searchParams.get("sentiment");
  const direction = searchParams.get("direction");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const search = searchParams.get("search");

  const VALID_TYPES = ["order_lookup", "return_request", "abandoned_cart_recovery", "general"];
  const VALID_SENTIMENTS = ["positive", "neutral", "negative"];
  const VALID_DIRECTIONS = ["inbound", "outbound"];

  let query = supabase
    .from("call_logs")
    .select(
      "id, direction, caller_number, call_type, duration_seconds, ai_summary, sentiment, credits_charged, started_at, ended_at, ended_reason, tool_results",
      { count: "exact" }
    )
    .eq("merchant_id", merchant.id)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (callType && VALID_TYPES.includes(callType)) {
    query = query.eq("call_type", callType);
  }
  if (sentiment && VALID_SENTIMENTS.includes(sentiment)) {
    query = query.eq("sentiment", sentiment);
  }
  if (direction && VALID_DIRECTIONS.includes(direction)) {
    query = query.eq("direction", direction);
  }
  if (fromDate) {
    query = query.gte("started_at", fromDate);
  }
  if (toDate) {
    // Include the entire to-day by appending end of day
    query = query.lte("started_at", toDate + "T23:59:59.999Z");
  }
  if (search) {
    // Search by AI summary
    query = query.ilike("ai_summary", `%${search}%`);
  }

  const { data: calls, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask caller numbers — show only last 4 digits
  const maskedCalls = (calls ?? []).map((call) => ({
    ...call,
    caller_number: maskCallerNumber(call.caller_number),
    ai_summary: call.ai_summary
      ? call.ai_summary.slice(0, 60)
      : null,
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    calls: maskedCalls,
    total,
    page,
    totalPages,
  });
}

/**
 * Masks a phone number to show only the last 4 digits.
 * E.g. "+447911123456" → "+44 XXXX XX 3456"
 */
function maskCallerNumber(number: string | null): string {
  if (!number) return "[Unknown]";
  if (number === "[RETAINED]") return "[RETAINED]";
  const last4 = number.slice(-4);
  return `+XX XXXX XX ${last4}`;
}
