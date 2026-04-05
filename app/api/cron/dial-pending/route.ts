import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateOutboundCall } from "@/lib/vapi/client";

const MIN_BALANCE_SECS = 30;
const E164_REGEX = /^\+[1-9]\d{9,14}$/;

/**
 * Cron job: dials pending outbound calls.
 * Runs every minute via Vercel Cron.
 * CRON_SECRET must be a non-empty string — missing/empty = 401 for all requests.
 */
export async function GET(request: NextRequest) {
  // B-8: CRON_SECRET bypass fix — exact pattern from spec
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

  // Fetch pending calls that are due now
  const { data: pendingCalls } = await supabase
    .from("pending_outbound_calls")
    .select("*, merchants!inner(id, vapi_agent_id, vapi_phone_id, credit_balance, provisioning_status)")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(10);

  if (!pendingCalls?.length) {
    return NextResponse.json({ dialed: 0 });
  }

  let dialedCount = 0;

  for (const call of pendingCalls) {
    const merchant = (call as Record<string, unknown>).merchants as {
      id: string;
      vapi_agent_id: string | null;
      vapi_phone_id: string | null;
      credit_balance: number;
      provisioning_status: string | null;
    };

    // Skip if merchant doesn't have enough credits, no Vapi config, or line is suspended
    if (
      !merchant?.vapi_agent_id ||
      !merchant?.vapi_phone_id ||
      merchant.credit_balance < MIN_BALANCE_SECS ||
      merchant.provisioning_status === "suspended"
    ) {
      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "failed",
          error_message: merchant.provisioning_status === "suspended"
            ? "Merchant line is suspended"
            : !merchant?.vapi_agent_id
            ? "No Vapi agent configured"
            : !merchant?.vapi_phone_id
            ? "No Vapi phone configured"
            : "Insufficient credits",
        })
        .eq("id", call.id);
      continue;
    }

    // Validate phone number format before attempting call
    if (!E164_REGEX.test(call.customer_phone ?? "")) {
      await supabase
        .from("pending_outbound_calls")
        .update({ status: "failed", error_message: "Invalid phone number format" })
        .eq("id", call.id);
      continue;
    }

    try {
      const vapiCallId = await initiateOutboundCall(
        merchant.vapi_agent_id,
        merchant.vapi_phone_id,
        call.customer_phone,
        {
          merchant_id: merchant.id,
          cart_value: String(call.cart_value_usd ?? "0"),
          customer_name: call.customer_name ?? "",
        }
      );

      // B-9: "dialing" — American English, one L
      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "dialing",
          vapi_call_id: vapiCallId,
          attempt_count: (call.attempt_count ?? 0) + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq("id", call.id);

      dialedCount++;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      await supabase
        .from("pending_outbound_calls")
        .update({
          status: "failed",
          error_message: errorMessage,
          attempt_count: (call.attempt_count ?? 0) + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq("id", call.id);
    }
  }

  return NextResponse.json({ dialed: dialedCount });
}
