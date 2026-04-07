import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateOutboundCall } from "@/lib/vapi/client";

const MIN_BALANCE_SECS = 30;
const MAX_ATTEMPTS = 3;
const E164_REGEX = /^\+[1-9]\d{9,14}$/;

// #10: Typed interface for the joined query result — replaces unsafe Record<string,unknown> cast
interface PendingCallRow {
  id: string;
  customer_phone: string | null;
  customer_name: string | null;
  cart_value_usd: number | null;
  attempt_count: number | null;
  merchants: {
    id: string;
    vapi_agent_id: string | null;
    vapi_phone_id: string | null;
    credit_balance: number;
    provisioning_status: string | null;
  };
}

/**
 * Cron job: dials pending outbound calls.
 * Runs every 15 minutes via Supabase pg_cron (migration 039).
 * Vercel cron entry kept as daily fallback only.
 * CRON_SECRET must be a non-empty string — missing/empty = 401 for all requests.
 */
export async function GET(request: NextRequest) {
  // If CRON_SECRET is not defined or is empty, refuse ALL requests
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    return NextResponse.json({ error: "Cron endpoint disabled" }, { status: 401 });
  }
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Reset stale "dialing" calls (older than 1 hour) back to pending so they can be retried.
  // This handles cases where the Vapi call was initiated but the end-of-call webhook never fired.
  // Only reset if last_attempted_at is set (exclude NULL values which indicate never attempted).
  try {
    const { data: resetCalls } = await supabase
      .from("pending_outbound_calls")
      .update({ status: "pending", error_message: "Stale dial reset — retrying" })
      .eq("status", "dialing")
      .lt("last_attempted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .not("last_attempted_at", "is", null)
      .select("id");

    if (resetCalls && resetCalls.length > 0) {
      console.log(`[cron/dial-pending] Reset ${resetCalls.length} stale calls (no webhook received within 1 hour)`);
    }
  } catch (err) {
    console.error("[cron/dial-pending] Failed to reset stale calls:", err);
    // Don't throw — continue with pending dials even if cleanup fails
  }

  // #7: ORDER BY scheduled_for ASC so oldest queued calls are always dialled first.
  // Without ORDER BY, PostgreSQL makes no row-order guarantee and newer calls could
  // repeatedly get picked over older ones.
  const { data: pendingCalls } = await supabase
    .from("pending_outbound_calls")
    .select("*, merchants!inner(id, vapi_agent_id, vapi_phone_id, credit_balance, provisioning_status)")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(10);

  if (!pendingCalls?.length) {
    return NextResponse.json({ dialed: 0 });
  }

  let dialedCount = 0;

  for (const rawCall of pendingCalls) {
    // #10: Use typed cast via the defined interface
    const call = rawCall as unknown as PendingCallRow;
    const merchant = call.merchants;
    const attempts = call.attempt_count ?? 0;

    // #8: Hard stop after MAX_ATTEMPTS — prevents infinite retry loop on
    // permanently broken numbers or misconfigured merchants
    if (attempts >= MAX_ATTEMPTS) {
      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "failed",
          error_message: `Exceeded max attempts (${MAX_ATTEMPTS})`,
        })
        .eq("id", call.id);
      continue;
    }

    // Validate phone number format before any further processing
    if (!E164_REGEX.test(call.customer_phone ?? "")) {
      await supabase
        .from("pending_outbound_calls")
        .update({ status: "failed", error_message: "Invalid phone number format" })
        .eq("id", call.id);
      continue;
    }

    // #6: Recoverable conditions (no credits, no Vapi config, suspended) use `skipped`
    // instead of `failed` — the merchant can top up credits or fix their config and
    // the call will be picked up on the next cron run. `failed` is reserved for
    // permanent errors (bad phone, exceeded max attempts, Vapi API error).
    if (merchant.provisioning_status === "suspended") {
      await supabase
        .from("pending_outbound_calls")
        .update({ status: "skipped", error_message: "Merchant line is suspended" })
        .eq("id", call.id);
      continue;
    }

    if (!merchant?.vapi_agent_id || !merchant?.vapi_phone_id) {
      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "skipped",
          error_message: !merchant?.vapi_agent_id
            ? "No Vapi agent configured"
            : "No Vapi phone configured",
        })
        .eq("id", call.id);
      continue;
    }

    if (merchant.credit_balance < MIN_BALANCE_SECS) {
      await supabase
        .from("pending_outbound_calls")
        .update({ status: "skipped", error_message: "Insufficient credits" })
        .eq("id", call.id);
      continue;
    }

    try {
      const vapiCallId = await initiateOutboundCall(
        merchant.vapi_agent_id,
        merchant.vapi_phone_id,
        call.customer_phone!,
        {
          merchant_id: merchant.id,
          cart_value: String(call.cart_value_usd ?? "0"),
          customer_name: call.customer_name ?? "",
        }
      );

      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "dialing",
          vapi_call_id: vapiCallId,
          attempt_count: attempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq("id", call.id);

      dialedCount++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "failed",
          error_message: errorMessage,
          attempt_count: attempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq("id", call.id);
    }
  }

  return NextResponse.json({ dialed: dialedCount });
}
