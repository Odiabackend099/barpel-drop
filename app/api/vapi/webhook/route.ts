import { NextResponse } from "next/server";
import { verifyVapiSecret } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupOrder } from "@/lib/shopify/client";
import { getTracking, formatTrackingMessage, isAfterShipEnabled } from "@/lib/aftership/client";
import { sendSms } from "@/lib/twilio/client";
import { withRetry } from "@/lib/retry";

/**
 * Vapi mid-call webhook — handles tool calls during an active call.
 * Must respond within 5 seconds. Returns a fallback at 4 seconds if slow.
 */
export async function POST(request: Request) {
  // Step 1: Verify Vapi secret using constant-time comparison
  const vapiSecret = request.headers.get("x-vapi-secret") ?? "";
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET ?? "";

  if (!verifyVapiSecret(vapiSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, toolCallList, call } = body;

  if (type !== "tool-calls" || !toolCallList?.length) {
    return NextResponse.json({ ok: true });
  }

  const merchantId: string | undefined = call?.metadata?.merchant_id;
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results = [];

  for (const toolCall of toolCallList) {
    const { name, arguments: args } = toolCall.function;
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
