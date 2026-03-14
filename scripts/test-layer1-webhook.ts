/**
 * LAYER 1: Webhook Unit Test
 *
 * Simulates exactly what Vapi sends to /api/vapi/webhook during a live call.
 * No phone call needed. No Vapi account interaction needed.
 *
 * Payload format verified from: https://docs.vapi.ai/server-url/events
 * - All Vapi server events are wrapped in a top-level "message" key
 * - toolCallList items use { id, name, arguments: {...} } — NOT function.arguments
 *
 * REQUIRES (in .env.local):
 *   NEXT_PUBLIC_BASE_URL    — e.g. https://barpel-ai.odia.dev (must be publicly accessible)
 *   VAPI_WEBHOOK_SECRET     — from VAPI_WEBHOOK_SECRET in .env (sent as x-vapi-secret header)
 *   VAPI_ASSISTANT_ID       — from: SELECT vapi_agent_id FROM merchants WHERE provisioning_status='active' LIMIT 1
 *   VAPI_MERCHANT_ID        — from: SELECT id FROM merchants WHERE vapi_agent_id='<VAPI_ASSISTANT_ID>'
 *   TEST_ORDER_NUMBER       — a real order # from veemagicspurs-2.myshopify.com (default: 1001)
 *
 * If NEXT_PUBLIC_BASE_URL is localhost, the server must be running locally.
 *
 * Run: npm run test:webhook
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const MERCHANT_ID = process.env.VAPI_MERCHANT_ID;
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET ?? "";
const ORDER_NUMBER = process.env.TEST_ORDER_NUMBER || "1001";

// Fail fast with clear messages if required env vars are missing
if (!BASE_URL) {
  console.error("❌ Missing env var: NEXT_PUBLIC_BASE_URL");
  process.exit(1);
}
if (!ASSISTANT_ID) {
  console.error("❌ Missing env var: VAPI_ASSISTANT_ID");
  console.error(
    "   Get it with: SELECT vapi_agent_id FROM merchants WHERE provisioning_status='active' LIMIT 1"
  );
  process.exit(1);
}
if (!MERCHANT_ID) {
  console.error("❌ Missing env var: VAPI_MERCHANT_ID");
  console.error(
    "   Get it with: SELECT id FROM merchants WHERE vapi_agent_id='<VAPI_ASSISTANT_ID>'"
  );
  process.exit(1);
}

const WEBHOOK_URL = `${BASE_URL}/api/vapi/webhook`;

async function runLayer1() {
  console.log("\n=== LAYER 1: WEBHOOK UNIT TEST ===");
  console.log("Target:", WEBHOOK_URL);
  console.log("Order:", ORDER_NUMBER);
  console.log("Secret header:", WEBHOOK_SECRET ? "✅ set" : "⚠️  empty");

  const toolCallId = `test_call_${Date.now()}`;

  // VERIFIED payload format from: https://docs.vapi.ai/server-url/events
  // All Vapi server events are wrapped in "message".
  // toolCallList items: { id, name, arguments: object } — NOT function.arguments (OpenAI format)
  const vapiPayload = {
    message: {
      type: "tool-calls",
      toolCallList: [
        {
          id: toolCallId, // CRITICAL: toolCallId in response must exactly match this
          name: "lookup_order",
          arguments: { order_number: ORDER_NUMBER }, // object, not JSON string
        },
      ],
      call: {
        assistantId: ASSISTANT_ID,
        id: `simulated_call_${Date.now()}`,
        metadata: { merchant_id: MERCHANT_ID }, // required: webhook uses this to find merchant
      },
    },
  };

  const start = Date.now();

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": WEBHOOK_SECRET, // Vapi sends this header for authentication
    },
    body: JSON.stringify(vapiPayload),
  });

  const elapsed = Date.now() - start;
  const json = await response.json();

  console.log("\n--- RESULTS ---");
  console.log(
    "HTTP Status:",
    response.status,
    response.status === 200 ? "✅" : "❌ MUST BE 200"
  );
  console.log(
    "Response time:",
    elapsed + "ms",
    elapsed < 5000 ? "✅" : "❌ TOO SLOW (Vapi timeout is 5s)"
  );

  const result = json?.results?.[0];

  if (!result) {
    console.error("❌ FAIL: No results array in response");
    console.error("Got:", JSON.stringify(json));
    process.exit(1);
  }

  // VERIFIED: toolCallId must match exactly
  // Source: https://docs.vapi.ai/server-url/events
  console.log(
    "toolCallId match:",
    result.toolCallId === toolCallId ? "✅" : "❌ ID MISMATCH — Vapi will ignore response"
  );
  console.log(
    "result is string:",
    typeof result.result === "string" ? "✅" : "❌ MUST BE STRING"
  );

  // VERIFIED: newlines in result cause Vapi to ignore the response
  // Source: Vapi docs "Use single-line strings only. Line breaks cause parsing errors"
  console.log(
    "no newlines:",
    !result.result?.includes("\n")
      ? "✅"
      : "❌ NEWLINES FOUND — Vapi will ignore this response"
  );

  // Check it contains real order data, not a fallback message
  const isFallback =
    result.result?.includes("couldn't find") ||
    result.result?.includes("trouble accessing") ||
    result.result?.includes("unable to access") ||
    result.result?.includes("contact support");

  console.log(
    "real order data:",
    !isFallback ? "✅" : "⚠️  FALLBACK — CHECK VAULT + SHOPIFY"
  );
  console.log("\nSpoken text the AI will say:");
  console.log('"' + result.result + '"');

  if (
    response.status === 200 &&
    result.toolCallId === toolCallId &&
    typeof result.result === "string" &&
    !result.result.includes("\n") &&
    !isFallback
  ) {
    console.log("\n✅ LAYER 1 PASSED — Webhook works correctly");
  } else {
    console.log("\n❌ LAYER 1 FAILED — Fix before proceeding to Layer 2");
    process.exit(1);
  }
}

runLayer1().catch((err: Error) => {
  console.error("❌ Script error:", err.message);
  process.exit(1);
});
