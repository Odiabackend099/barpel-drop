/**
 * LAYER 2: Full Vapi Call Transaction Test
 *
 * Creates a real outbound call via Vapi API. The AI immediately calls
 * lookup_order (via assistantOverrides system prompt) without requiring
 * the human to speak — making the test deterministic.
 *
 * After the call ends, polls GET /call/{id} and verifies the tool fired
 * and returned real order data (not a fallback).
 *
 * REQUIRES (in .env.local):
 *   NEXT_PUBLIC_BASE_URL  — MUST be https://dropship.barpel.ai (Vapi can't reach localhost)
 *   VAPI_PRIVATE_KEY      — already in .env
 *   VAPI_ASSISTANT_ID     — from: SELECT vapi_agent_id FROM merchants LIMIT 1
 *   VAPI_PHONE_NUMBER_ID  — from Vapi dashboard → Phone Numbers → copy ID (not the number)
 *   TEST_PHONE_NUMBER     — your own number in E.164 format e.g. +2348012345678
 *   TEST_ORDER_NUMBER     — a real order # from veemagicspurs-2.myshopify.com (default: 1001)
 *
 * REQUIRES: Twilio account upgraded (not trial). Your phone must ring.
 *
 * Run: npm run test:call
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const TEST_PHONE = process.env.TEST_PHONE_NUMBER;
const ORDER_NUMBER = process.env.TEST_ORDER_NUMBER || "1001";

// Fail fast with clear messages if required env vars are missing
const missing = [
  !BASE_URL && "NEXT_PUBLIC_BASE_URL",
  !VAPI_API_KEY && "VAPI_PRIVATE_KEY",
  !ASSISTANT_ID && "VAPI_ASSISTANT_ID",
  !PHONE_NUMBER_ID && "VAPI_PHONE_NUMBER_ID",
  !TEST_PHONE && "TEST_PHONE_NUMBER",
].filter(Boolean);

if (missing.length > 0) {
  console.error("❌ Missing required env vars:");
  missing.forEach((v) => console.error("   -", v));
  process.exit(1);
}

// Layer 2 requires the webhook to be publicly accessible by Vapi's servers.
// If BASE_URL is localhost, Vapi cannot reach the webhook and the tool call will silently fail.
if (BASE_URL!.includes("localhost") || BASE_URL!.includes("127.0.0.1")) {
  console.warn(
    "⚠️  WARNING: NEXT_PUBLIC_BASE_URL is set to localhost."
  );
  console.warn(
    "   Vapi cannot reach http://localhost from their servers."
  );
  console.warn(
    "   Set NEXT_PUBLIC_BASE_URL=https://dropship.barpel.ai in .env.local"
  );
  console.warn("   Continuing anyway — this test will likely fail.\n");
}

async function runLayer2() {
  console.log("\n=== LAYER 2: FULL VAPI CALL TRANSACTION TEST ===");
  console.log("Calling:", TEST_PHONE);
  console.log("Order number being tested:", ORDER_NUMBER);
  console.log("Webhook URL Vapi will call:", BASE_URL + "/api/vapi/webhook");

  // Step 1: Create the outbound call.
  // VERIFIED: POST /call/phone with assistantId + phoneNumberId + customer.number
  // Source: Vapi outbound calling docs
  //
  // assistantOverrides injects a system prompt that makes the AI immediately call
  // lookup_order without waiting for the human to speak — this makes the test
  // deterministic and keeps the call short (~20s).
  const callRes = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId: ASSISTANT_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: TEST_PHONE,
      },
      assistantOverrides: {
        firstMessage: `Hello, this is an automated test. Looking up order number ${ORDER_NUMBER} for you now.`,
        model: {
          messages: [
            {
              role: "system",
              content: `This is an automated test call. Immediately call the lookup_order tool with order_number "${ORDER_NUMBER}". Read the result back word for word. Then say "Test complete" and end the call.`,
            },
          ],
        },
      },
    }),
  });

  if (!callRes.ok) {
    const err = await callRes.text();
    throw new Error(`Failed to create call: ${callRes.status} ${err}`);
  }

  const call = await callRes.json();
  const callId = call.id;
  console.log("✅ Call created. ID:", callId);
  console.log("Status:", call.status);
  console.log(
    "\nYour phone will ring now. Answer it and stay on for ~20-30 seconds."
  );

  // Step 2: Poll GET /call/{id} until call ends.
  // VERIFIED: poll /call/{id} checking call.status
  // Statuses: queued → ringing → in-progress → ended
  // Source: Vapi "Get Call" API reference
  console.log("\nWaiting for call to end (polling every 5s, max 3 minutes)...");

  let callData: Record<string, unknown> = {};
  const maxWait = 180_000; // 3 minutes
  const pollInterval = 5_000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    });
    callData = await pollRes.json() as Record<string, unknown>;

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`  Status: ${callData.status} (${elapsed}s elapsed)`);

    if (callData.status === "ended") break;
  }

  if (callData.status !== "ended") {
    console.error("❌ Call did not end within 3 minutes. Check Vapi dashboard.");
    process.exit(1);
  }

  // Grace delay: Vapi marks calls 'ended' slightly before artifact is fully populated.
  // Source: observed behavior — artifact.messages can be empty immediately after status=ended.
  console.log("\nWaiting 2s for artifact to populate...");
  await new Promise((r) => setTimeout(r, 2000));

  // Re-fetch to get the fully populated artifact
  const finalRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
  });
  callData = await finalRes.json() as Record<string, unknown>;

  // Step 3: Verify the tool fired in the call artifact.
  // VERIFIED: call.artifact.messages contains role: tool_call_result entries after call ends
  // Source: Vapi call analysis docs + community thread on transcript retrieval
  console.log("\n--- VERIFYING TOOL CALL RESULTS ---");

  const artifact = callData.artifact as Record<string, unknown> | undefined;
  const messages = (artifact?.messages as Array<Record<string, unknown>>) ?? [];
  const toolResults = messages.filter((m) => m.role === "tool_call_result");
  const orderLookupResult = toolResults.find((m) => m.name === "lookup_order");

  if (!orderLookupResult) {
    console.error(
      "❌ FAIL: lookup_order tool was never called during the conversation"
    );
    console.error(
      "Messages found:",
      messages.map((m) => m.role).join(", ") || "(none)"
    );
    process.exit(1);
  }

  console.log("✅ lookup_order tool fired during call");
  console.log('Result returned to AI: "' + orderLookupResult.result + '"');

  const isFallback =
    typeof orderLookupResult.result === "string" &&
    (orderLookupResult.result.includes("couldn't find") ||
      orderLookupResult.result.includes("trouble accessing") ||
      orderLookupResult.result.includes("unable to access") ||
      orderLookupResult.result.includes("contact support"));

  if (isFallback) {
    console.error(
      "⚠️  Tool fired but returned fallback — vault or Shopify lookup failed"
    );
    process.exit(1);
  }

  // Check the transcript shows the AI actually spoke the order info
  const transcript = (callData.transcript as string) ?? "";
  const orderMentioned =
    transcript.includes(ORDER_NUMBER) ||
    transcript.toLowerCase().includes("shipped") ||
    transcript.toLowerCase().includes("order");

  console.log(
    "AI spoke order information:",
    orderMentioned ? "✅" : "⚠️  check transcript"
  );
  console.log("\nFull transcript:");
  console.log(transcript || "(empty)");

  // Save full results to file for CI/audit
  const fs = await import("fs");
  const pathMod = await import("path");
  const outputDir = pathMod.join(process.cwd(), "test-results");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  const outputFile = pathMod.join(outputDir, `e2e-${Date.now()}.json`);
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        callId,
        timestamp: new Date().toISOString(),
        orderNumber: ORDER_NUMBER,
        toolFired: true,
        toolResult: orderLookupResult.result,
        transcript,
        duration: Math.round((Date.now() - start) / 1000),
      },
      null,
      2
    )
  );
  console.log(`\n💾 Results saved: ${outputFile}`);

  console.log(
    "\n✅ LAYER 2 PASSED — Full call transaction verified end-to-end"
  );
}

runLayer2().catch((err: Error) => {
  console.error("❌ Script error:", err.message);
  process.exit(1);
});
