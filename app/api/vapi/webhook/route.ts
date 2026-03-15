import { NextResponse } from "next/server";
import { verifyVapiSecret } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupOrder } from "@/lib/shopify/client";
import { searchProducts } from "@/lib/shopify/productSearch";
import { getTracking, formatTrackingMessage, isAfterShipEnabled } from "@/lib/aftership/client";
import { sendSms } from "@/lib/twilio/client";
import { withRetry } from "@/lib/retry";

const LOW_BALANCE_THRESHOLD_SECS = 600; // 10 minutes — warn earlier so merchant can act
const LOW_BALANCE_THROTTLE_HOURS = 24;
const SHORT_CALL_THRESHOLD_SECS = 15;

/**
 * Vapi serverUrl webhook — handles ALL Vapi server events:
 * - tool-calls: mid-call tool execution (must respond within 5 seconds)
 * - end-of-call-report: saves call data to golden call_logs table
 */
export async function POST(request: Request) {
  // Step 1: Verify Vapi secret using constant-time comparison
  const vapiSecret = request.headers.get("x-vapi-secret") ?? "";
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET ?? "";

  if (!verifyVapiSecret(vapiSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Vapi wraps all server events in a top-level "message" key.
  // Source: https://docs.vapi.ai/server-url/events
  const msg = body.message ?? body;
  const { type, toolCallList, call } = msg;

  const supabase = createAdminClient();

  // Handle end-of-call-report: save everything to golden call_logs table
  if (type === "end-of-call-report") {
    return handleEndOfCallReport(msg, supabase);
  }

  // Handle tool-calls: mid-call tool execution
  if (type !== "tool-calls" || !toolCallList?.length) {
    return NextResponse.json({ ok: true });
  }

  const merchantId: string | undefined = call?.metadata?.merchant_id;
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant_id" }, { status: 400 });
  }

  // Zero-balance and suspended guard: if merchant has no credits or line is
  // suspended, return a graceful message for ALL tool calls
  const { data: creditCheck } = await supabase
    .from("merchants")
    .select("credit_balance, provisioning_status")
    .eq("id", merchantId)
    .single();

  // Unknown merchant — return safe fallback for all tool calls
  if (!creditCheck) {
    const unknownResults = toolCallList.map((tc: { id: string }) => ({
      toolCallId: tc.id,
      result:
        "I apologize, but I'm unable to assist at the moment. Please try again later.",
    }));
    return NextResponse.json({ results: unknownResults });
  }

  if (creditCheck.credit_balance <= 0) {
    const zeroBalanceResults = toolCallList.map((tc: { id: string }) => ({
      toolCallId: tc.id,
      result:
        "Thank you for calling. Our support line is temporarily unavailable. " +
        "Please contact the store directly by email or visit our website.",
    }));
    return NextResponse.json({ results: zeroBalanceResults });
  }

  // Suspended guard: merchant paused their AI line — decline all tool calls
  if (creditCheck.provisioning_status === "suspended") {
    const suspendedResults = toolCallList.map((tc: { id: string }) => ({
      toolCallId: tc.id,
      result:
        "Thank you for calling. Our support line is temporarily unavailable. " +
        "Please contact the store directly or visit our website.",
    }));
    return NextResponse.json({ results: suspendedResults });
  }

  const results = [];

  for (const toolCall of toolCallList) {
    // Vapi sends: { id, name, arguments: {...} } — arguments is an object.
    // Source: https://docs.vapi.ai/tools/custom-tools
    const name: string = toolCall.name ?? toolCall.function?.name;
    const rawArgs = toolCall.arguments ?? toolCall.function?.arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : (rawArgs ?? {});
    const toolCallId: string = toolCall.id;
    let result: string;

    try {
      switch (name) {
        case "lookup_order": {
          result = await handleLookupOrder(supabase, merchantId, args.order_number);
          break;
        }
        case "initiate_return": {
          result = await handleInitiateReturn(
            supabase,
            merchantId,
            args.order_number,
            args.reason,
            args.customer_phone,
            call?.id
          );
          break;
        }
        case "get_store_policy": {
          result = await handleGetStorePolicy(supabase, merchantId);
          break;
        }
        case "search_products": {
          result = await handleSearchProducts(supabase, merchantId, args.search_term ?? null);
          break;
        }
        default:
          result =
            "I don't have that capability yet. Let me connect you with a human agent.";
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        result =
          "I'm checking your order now, please stay on the line.";
      } else {
        result =
          "I apologize, but I'm unable to look that up at the moment. Could you please try again in a moment?";
      }
    }

    // B-5: Use results[].toolCallId and results[].result format per RESEARCH_NOTES.md R-1
    results.push({ toolCallId, result });
  }

  return NextResponse.json({ results });
}

async function handleLookupOrder(
  supabase: ReturnType<typeof createAdminClient>,
  merchantId: string,
  orderNumber: string
): Promise<string> {
  // B-6: Read from integrations using correct column name (connection_active)
  const { data: integration } = await supabase
    .from("integrations")
    .select("shop_domain, access_token_secret_id, connection_active")
    .eq("merchant_id", merchantId)
    .eq("platform", "shopify")
    .eq("connection_active", true)
    .single();

  if (!integration) {
    return "I don't have access to your store's order system yet. Please contact support directly.";
  }

  // B-6: Decrypt the Shopify token from Vault via public RPC
  // (vault schema not exposed through PostgREST)
  const { data: shopifyToken } = await supabase
    .rpc("vault_read_secret_by_id", { p_id: integration.access_token_secret_id });
  if (!shopifyToken) {
    return "I'm unable to access your store's orders right now. Please contact support.";
  }

  // B-5: 4-second timeout race — return holding message if approaching 5s Vapi limit
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 4000)
  );

  // Step 1: Look up Shopify order first to get tracking number
  let order: Awaited<ReturnType<typeof lookupOrder>> | null = null;
  try {
    order = await withRetry(
      () => lookupOrder(integration.shop_domain, shopifyToken, orderNumber),
      3,
      "shopify_order_lookup"
    );
  } catch {
    return `I wasn't able to find order ${orderNumber}. Could you double-check the order number?`;
  }

  if (!order) {
    return `I wasn't able to find order ${orderNumber}. Could you double-check the order number?`;
  }

  // Step 2: If tracking number exists, try AfterShip (if configured) else use Shopify status
  if (order.trackingNumbers.length > 0 && isAfterShipEnabled()) {
    const trackingNumber = order.trackingNumbers[0];

    const dataPromise = Promise.all([
      Promise.resolve(order),
      withRetry(() => getTracking(trackingNumber), 3, "aftership_tracking"),
    ]);

    const raceResult = await Promise.race([dataPromise, timeoutPromise]);

    if (raceResult === null) {
      return "I'm checking your order now, please stay on the line.";
    }

    const [, trackingData] = raceResult;

    if (trackingData) {
      if (trackingData.events.length === 0) {
        return "Your order has shipped but the carrier hasn't logged a scan yet. Please check back in 24 hours or check your email for shipping updates.";
      }
      return formatTrackingMessage(trackingData);
    }
  }

  // Fall back to Shopify fulfillment status
  const statusMap: Record<string, string> = {
    FULFILLED: "has been shipped and is on its way",
    UNFULFILLED: "is being prepared for shipping",
    PARTIALLY_FULFILLED: "has been partially shipped",
    null: "is being processed",
  };

  const status =
    statusMap[order.fulfillmentStatus ?? "null"] ?? "is being processed";
  const items = order.lineItems
    .map((i) => `${i.title} (x${i.quantity})`)
    .join(", ");

  return `Your order ${order.name} containing ${items} ${status}.`;
}

async function handleInitiateReturn(
  supabase: ReturnType<typeof createAdminClient>,
  merchantId: string,
  orderNumber: string,
  reason: string,
  customerPhone: string,
  callId: string
): Promise<string> {
  // Create return request in DB
  await supabase.from("return_requests").insert({
    merchant_id: merchantId,
    call_log_id: callId || null,
    order_number: orderNumber,
    customer_phone: customerPhone,
    reason,
    status: "pending",
  });

  // Send SMS with return instructions
  if (customerPhone) {
    const returnLink = `${process.env.NEXT_PUBLIC_BASE_URL}/return/${orderNumber}`;
    await sendSms(
      customerPhone,
      `Your return request for order ${orderNumber} has been initiated. Please upload photos of the item here: ${returnLink}`
    ).catch(() => {
      // SMS failure should not block the tool response
    });
  }

  return `I've started your return process for order ${orderNumber}. You'll receive an SMS shortly with a link to upload photos of the item. Our team will review your request within 24 hours.`;
}

async function handleGetStorePolicy(
  supabase: ReturnType<typeof createAdminClient>,
  merchantId: string
): Promise<string> {
  const { data: merchant } = await supabase
    .from("merchants")
    .select("custom_prompt")
    .eq("id", merchantId)
    .single();

  if (merchant?.custom_prompt) {
    return merchant.custom_prompt;
  }

  return "Our standard return policy allows returns within 30 days of delivery for items in original condition. Refunds are processed within 5-7 business days after we receive the returned item.";
}

async function handleSearchProducts(
  supabase: ReturnType<typeof createAdminClient>,
  merchantId: string,
  searchTerm: string | null
): Promise<string> {
  const { data: integration } = await supabase
    .from("integrations")
    .select("shop_domain, access_token_secret_id, connection_active")
    .eq("merchant_id", merchantId)
    .eq("platform", "shopify")
    .eq("connection_active", true)
    .single();

  if (!integration) {
    return "I don't have access to our product catalogue right now. Please visit our website to browse.";
  }

  const { data: shopifyToken } = await supabase
    .rpc("vault_read_secret_by_id", { p_id: integration.access_token_secret_id });
  if (!shopifyToken) {
    return "I'm unable to access our products right now. Please visit our website to browse.";
  }

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 4500)
  );

  try {
    return await Promise.race([
      searchProducts(integration.shop_domain, shopifyToken, searchTerm),
      timeoutPromise,
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "timeout") {
      return "Let me check our products, one moment please.";
    }
    console.error("[webhook] search_products error:", msg);
    return "I had trouble accessing our product catalogue. Please visit our website to browse.";
  }
}

// ============================================================================
// END-OF-CALL-REPORT HANDLER
// Saves every field from Vapi's end-of-call-report into one call_logs row.
// This is the ONLY moment call data enters our system from Vapi.
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
async function handleEndOfCallReport(
  msg: Record<string, any>,
  supabase: ReturnType<typeof createAdminClient>
) {
  const call = msg.call ?? {};
  const artifact = msg.artifact ?? {};
  const analysis = msg.analysis ?? {};
  const endedReason: string | undefined = msg.endedReason;

  // 1. Identify merchant via assistantId → merchants.vapi_agent_id
  const assistantId: string | undefined = call.assistantId;
  if (!assistantId) {
    console.error("[webhook] end-of-call-report missing assistantId");
    return NextResponse.json({ received: true });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, credit_balance, low_balance_notified_at, support_phone")
    .eq("vapi_agent_id", assistantId)
    .single();

  if (!merchant) {
    console.error("[webhook] Unknown assistantId:", assistantId);
    return NextResponse.json({ received: true });
  }

  // 2. Calculate duration
  const startedAt = call.startedAt ? new Date(call.startedAt) : null;
  const endedAt = call.endedAt ? new Date(call.endedAt) : new Date();
  const durationSeconds = startedAt
    ? Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000))
    : 0;

  // 3. Extract tool results from messages array
  const allMessages: any[] = artifact.messages ?? [];
  const toolResults = allMessages
    .filter((m: any) => m.role === "tool_call_result")
    .map((m: any) => ({ tool: m.name, result: m.result }));

  // 4. Determine call type by which tool actually fired (deterministic)
  let callType = "general";
  if (toolResults.some((t: any) => t.tool === "lookup_order")) {
    callType = "order_lookup";
  } else if (toolResults.some((t: any) => t.tool === "initiate_return")) {
    callType = "return_request";
  } else if (toolResults.some((t: any) => t.tool === "search_products")) {
    callType = "product_search";
  }

  // Check for abandoned cart recovery via pending_outbound_calls
  const vapiCallId: string | undefined = call.id;
  if (vapiCallId) {
    const { data: pendingCall } = await supabase
      .from("pending_outbound_calls")
      .select("id")
      .eq("vapi_call_id", vapiCallId)
      .maybeSingle();
    if (pendingCall) callType = "abandoned_cart_recovery";
  }

  // 5. Simple sentiment detection from transcript
  const transcript: string = artifact.transcript ?? "";
  const sentiment = detectSentiment(transcript);

  // 6. Upsert into call_logs — idempotent via onConflict: 'vapi_call_id'
  const { data: callLog, error: insertError } = await supabase
    .from("call_logs")
    .upsert(
      {
        merchant_id: merchant.id,
        vapi_call_id: vapiCallId,
        vapi_assistant_id: assistantId,
        caller_number: call.customer?.number ?? null,
        called_number: call.phoneNumber?.number ?? null,
        direction: call.type === "outboundPhoneCall" ? "outbound" : "inbound",
        started_at: call.startedAt ?? null,
        ended_at: call.endedAt ?? null,
        duration_seconds: durationSeconds,
        ended_reason: endedReason ?? null,
        transcript,
        messages_raw: allMessages,
        recording_url: artifact.recordingUrl ?? call.recordingUrl ?? null,
        ai_summary: analysis.summary ?? null,
        ai_success_evaluation: analysis.successEvaluation ?? null,
        tool_results: toolResults,
        call_type: callType,
        sentiment,
        credits_charged: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vapi_call_id" }
    )
    .select("id")
    .single();

  if (insertError) {
    console.error("[webhook] call_logs upsert failed:", insertError.message);
    // Still return 200 — Vapi does not retry on our errors
    return NextResponse.json({ received: true });
  }

  // 7. Credit deduction — skip short calls (hang-ups, wrong numbers)
  let creditsCharged = 0;
  if (durationSeconds >= SHORT_CALL_THRESHOLD_SECS && callLog) {
    try {
      const { data: deducted } = await supabase.rpc("deduct_call_credits", {
        p_merchant_id: merchant.id,
        p_seconds: durationSeconds,
        p_call_log_id: callLog.id,
      });
      creditsCharged = deducted ?? 0;
    } catch {
      // Deduction failed but call was logged — do not block 200
    }

    // Update call log with actual credits charged
    await supabase
      .from("call_logs")
      .update({ credits_charged: creditsCharged })
      .eq("id", callLog.id);
  }

  // 8. Low-balance SMS warning (24h throttle, 10-minute threshold)
  // Re-fetch credit_balance — the merchant object is stale after deduction
  const { data: updatedMerchant } = await supabase
    .from("merchants")
    .select("credit_balance")
    .eq("id", merchant.id)
    .single();
  const updatedBalance = updatedMerchant?.credit_balance ?? merchant.credit_balance;

  if (updatedBalance < LOW_BALANCE_THRESHOLD_SECS) {
    const lastNotified = merchant.low_balance_notified_at;
    const hoursSince = lastNotified
      ? (Date.now() - new Date(lastNotified).getTime()) / 3_600_000
      : Infinity;

    if (hoursSince > LOW_BALANCE_THROTTLE_HOURS && merchant.support_phone) {
      const minutesRemaining = Math.floor(updatedBalance / 60);
      const billingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`;

      const smsBody =
        updatedBalance <= 0
          ? `Barpel Alert: You've used all your minutes for this month. Your AI line is paused. Top up at ${billingUrl}`
          : `Barpel Alert: You have ${minutesRemaining} minutes left this month. Top up now to keep your AI line running: ${billingUrl}`;

      await sendSms(merchant.support_phone, smsBody).catch(() => {
        // SMS failure must not block call processing
      });

      await supabase
        .from("merchants")
        .update({ low_balance_notified_at: new Date().toISOString() })
        .eq("id", merchant.id);
    }
  }

  return NextResponse.json({ received: true, credits_charged: creditsCharged });
}

/**
 * Detects sentiment from transcript using phrase patterns.
 * Returns 'negative' | 'positive' | 'neutral' for the golden schema.
 */
function detectSentiment(transcript: string): "positive" | "neutral" | "negative" {
  const text = transcript.toLowerCase();

  const negativePatterns = [
    "this is ridiculous", "unacceptable", "i want my money back",
    "terrible", "never again", "this is a scam", "worst experience",
    "completely unacceptable", "very frustrated",
  ];

  const positivePatterns = [
    "thank you so much", "that's great", "perfect", "brilliant",
    "really appreciate", "very helpful", "excellent service",
    "amazing", "wonderful",
  ];

  const negativeScore = negativePatterns.filter((p) => text.includes(p)).length;
  const positiveScore = positivePatterns.filter((p) => text.includes(p)).length;

  if (negativeScore > positiveScore && negativeScore > 0) return "negative";
  if (positiveScore > negativeScore && positiveScore > 0) return "positive";
  return "neutral";
}
/* eslint-enable @typescript-eslint/no-explicit-any */
