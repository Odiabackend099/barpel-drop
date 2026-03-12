import { NextResponse } from "next/server";
import { verifyVapiSecret } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureIdempotent } from "@/lib/idempotency";
import { sendSms } from "@/lib/twilio/client";

// 5-minute low-balance threshold per spec 2.3
const LOW_BALANCE_THRESHOLD_SECS = 300;
const LOW_BALANCE_THROTTLE_HOURS = 24;

/**
 * Vapi call-ended webhook — processes completed calls.
 * Logs call data, deducts credits, and sends low-balance warnings.
 */
export async function POST(request: Request) {
  // Step 1: Verify Vapi secret using constant-time comparison
  const vapiSecret = request.headers.get("x-vapi-secret") ?? "";
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET ?? "";

  if (!verifyVapiSecret(vapiSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Only process call.ended events
  if (body.type !== "call.ended" && body.message?.type !== "end-of-call-report") {
    return NextResponse.json({ ok: true });
  }

  const callData = body.call ?? body;
  const vapiCallId: string | undefined = callData.id ?? callData.call?.id;

  if (!vapiCallId) {
    return NextResponse.json({ error: "Missing call ID" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // Step 2: Idempotency check — prevent double-processing
  const isNew = await ensureIdempotent(vapiCallId, "vapi", supabaseAdmin);
  if (!isNew) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const merchantId: string | undefined = callData.metadata?.merchant_id;
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant_id" }, { status: 400 });
  }

  // Step 3: Extract call details
  const durationSecs = Math.ceil(
    callData.duration ??
      (callData.endedAt && callData.startedAt
        ? (new Date(callData.endedAt).getTime() -
            new Date(callData.startedAt).getTime()) /
          1000
        : 0)
  );

  const transcript: string = callData.transcript ?? callData.artifact?.transcript ?? "";
  const summary: string = callData.summary ?? callData.artifact?.summary ?? "";

  // Step 4: Check for matching pending_outbound_calls row (for abandoned_cart detection)
  // B-2: Look up by vapi_call_id in pending_outbound_calls
  const { data: pendingCall } = await supabaseAdmin
    .from("pending_outbound_calls")
    .select("id")
    .eq("vapi_call_id", vapiCallId)
    .maybeSingle();

  // Determine call type using exact phrase combinations from spec 2.3
  const callType = detectCallType(transcript, vapiCallId, pendingCall ? { id: pendingCall.id } : null);
  const sentiment = detectSentiment(transcript);

  // Step 5: Insert call log with credits_charged = 0 placeholder
  const { data: callLog, error: insertError } = await supabaseAdmin
    .from("call_logs")
    .insert({
      merchant_id: merchantId,
      vapi_call_id: vapiCallId,
      direction: callData.type === "outboundPhoneCall" ? "outbound" : "inbound",
      caller_number: callData.customer?.number ?? null,
      customer_name: callData.customer?.name ?? null,
      order_number: callData.metadata?.order_number ?? null,
      call_type: callType,
      duration_secs: durationSecs,
      transcript,
      ai_summary: summary.slice(0, 500),
      sentiment,
      credits_charged: 0,
      recording_url: callData.recordingUrl ?? null,
      started_at: callData.startedAt ?? new Date().toISOString(),
      ended_at: callData.endedAt ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !callLog) {
    return NextResponse.json(
      { error: `Call log insert failed: ${insertError?.message}` },
      { status: 500 }
    );
  }

  const callLogId: string = callLog.id;

  // Step 6: Short call — charge zero credits (hang-ups, wrong numbers)
  // B-3: If duration < 15 seconds, do NOT call deduct_call_credits
  let creditsCharged = 0;
  if (durationSecs >= 15) {
    // Step 7: Deduct credits atomically — store actual deducted amount
    // B-3: The RPC returns INTEGER — store that exact value in credits_charged
    try {
      const { data: deducted } = await supabaseAdmin.rpc("deduct_call_credits", {
        p_merchant_id: merchantId,
        p_seconds: durationSecs,
        p_call_log_id: callLogId,
      });
      creditsCharged = deducted ?? 0;
    } catch {
      // Deduction failed but call was logged — do not block 200
      // Sentry would capture this in production
    }

    // Update call log with actual credits charged
    await supabaseAdmin
      .from("call_logs")
      .update({ credits_charged: creditsCharged })
      .eq("id", callLogId);
  }

  // Step 8: Check remaining balance for low-credit warning (24h throttle)
  // B-4: Use mobile_number per spec 2.3 step 9
  const { data: merchant } = await supabaseAdmin
    .from("merchants")
    .select("credit_balance, low_balance_notified_at, mobile_number")
    .eq("id", merchantId)
    .single();

  if (merchant && merchant.credit_balance < LOW_BALANCE_THRESHOLD_SECS) {
    const lastNotified = merchant.low_balance_notified_at;
    const hoursSince = lastNotified
      ? (Date.now() - new Date(lastNotified).getTime()) / 3_600_000
      : Infinity;

    if (hoursSince > LOW_BALANCE_THROTTLE_HOURS && merchant.mobile_number) {
      const minutesRemaining = Math.floor(merchant.credit_balance / 60);

      await sendSms(
        merchant.mobile_number,
        `Your Barpel credits are running low. You have ${minutesRemaining} minutes remaining. Top up at ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`
      ).catch(() => {
        // SMS failure must not block call processing
      });

      await supabaseAdmin
        .from("merchants")
        .update({ low_balance_notified_at: new Date().toISOString() })
        .eq("id", merchantId);
    }
  }

  return NextResponse.json({ ok: true, credits_charged: creditsCharged });
}

/**
 * B-2: Detects call type using exact phrase combinations from spec 2.3.
 * Never uses single keywords like "return" alone.
 * Abandoned cart: detected by matching a pending_outbound_calls row.
 */
function detectCallType(
  transcript: string,
  _vapiCallId: string,
  pendingCallRow: { id: string } | null
): "wismo" | "return" | "abandoned_cart" | "other" {
  const t = transcript.toLowerCase();

  // Check abandoned cart first (explicit DB link)
  if (pendingCallRow) return "abandoned_cart";

  // WISMO — phrase combinations
  const wismoPatterns = [
    "where is my order",
    "where is my package",
    "where is my parcel",
    "when will it arrive",
    "when will it be delivered",
    "when will i receive",
    "has it shipped",
    "has my order shipped",
    "tracking number",
    "delivery date",
    "estimated delivery",
    "out for delivery",
  ];
  if (wismoPatterns.some((p) => t.includes(p))) return "wismo";

  // Return — phrase combinations, NOT single word "return"
  const returnPatterns = [
    "want to return",
    "need to return",
    "would like to return",
    "looking to return",
    "send it back",
    "send back",
    "return my order",
    "wrong item",
    "wrong product",
    "wrong size",
    "wrong colour",
    "wrong color",
    "broken item",
    "item is broken",
    "damaged item",
    "item arrived damaged",
    "refund please",
    "want a refund",
    "need a refund",
    "requesting a refund",
    "does not work",
    "doesn't work",
    "not working",
    "stopped working",
  ];
  if (returnPatterns.some((p) => t.includes(p))) return "return";

  return "other";
}

/**
 * Detects sentiment using phrase combinations per spec 2.3.
 */
function detectSentiment(transcript: string): "angry" | "neutral" | "happy" {
  const text = transcript.toLowerCase();

  const angryPatterns = [
    "this is ridiculous",
    "unacceptable",
    "i want my money back",
    "terrible",
    "never again",
    "this is a scam",
    "worst experience",
    "completely unacceptable",
    "very frustrated",
  ];

  const happyPatterns = [
    "thank you so much",
    "that's great",
    "perfect",
    "brilliant",
    "really appreciate",
    "very helpful",
    "excellent service",
    "amazing",
    "wonderful",
  ];

  const angryScore = angryPatterns.filter((p) => text.includes(p)).length;
  const happyScore = happyPatterns.filter((p) => text.includes(p)).length;

  if (angryScore > happyScore && angryScore > 0) return "angry";
  if (happyScore > angryScore && happyScore > 0) return "happy";
  return "neutral";
}
