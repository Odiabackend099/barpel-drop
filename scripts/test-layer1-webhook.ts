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

/**
 * Shared validation for all tool call tests.
 * Returns true if all checks pass.
 */
function validateToolCallResult(
  testName: string,
  response: Response,
  json: Record<string, unknown>,
  toolCallId: string,
  elapsed: number,
  fallbackPatterns: string[] = []
): boolean {
  const result = (json?.results as Array<{ toolCallId: string; result: string }>)?.[0];

  console.log(`\n--- ${testName} RESULTS ---`);
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

  if (!result) {
    console.error("❌ FAIL: No results array in response");
    console.error("Got:", JSON.stringify(json));
    return false;
  }

  console.log(
    "toolCallId match:",
    result.toolCallId === toolCallId ? "✅" : "❌ ID MISMATCH — Vapi will ignore response"
  );
  console.log(
    "result is string:",
    typeof result.result === "string" ? "✅" : "❌ MUST BE STRING"
  );
  console.log(
    "no newlines:",
    !result.result?.includes("\n")
      ? "✅"
      : "❌ NEWLINES FOUND — Vapi will ignore this response"
  );

  const defaultFallbacks = [
    "trouble accessing",
    "unable to access",
    "contact support",
    "hasn't been set up",
    "I apologize",
    "unable to look that up",
    "try again in a moment",
  ];
  const allPatterns = [...defaultFallbacks, ...fallbackPatterns];
  const isFallback = allPatterns.some((p) => result.result?.includes(p));

  console.log(
    "real data (not fallback):",
    !isFallback ? "✅" : "⚠️  FALLBACK — CHECK VAULT + SHOPIFY"
  );
  console.log("\nSpoken text the AI will say:");
  console.log('"' + result.result + '"');

  return (
    response.status === 200 &&
    result.toolCallId === toolCallId &&
    typeof result.result === "string" &&
    !result.result.includes("\n") &&
    !isFallback
  );
}

// ---------------------------------------------------------------------------
// Test 1: Order Lookup
// ---------------------------------------------------------------------------

async function testOrderLookup(): Promise<boolean> {
  console.log("\n=== TEST 1: ORDER LOOKUP ===");
  console.log("Target:", WEBHOOK_URL);
  console.log("Order:", ORDER_NUMBER);

  const toolCallId = `test_order_${Date.now()}`;

  const vapiPayload = {
    message: {
      type: "tool-calls",
      toolCallList: [
        {
          id: toolCallId,
          name: "lookup_order",
          arguments: { order_number: ORDER_NUMBER },
        },
      ],
      call: {
        assistantId: ASSISTANT_ID,
        id: `simulated_call_${Date.now()}`,
        metadata: { merchant_id: MERCHANT_ID },
      },
    },
  };

  const start = Date.now();
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify(vapiPayload),
  });
  const elapsed = Date.now() - start;
  const json = await response.json();

  return validateToolCallResult(
    "ORDER LOOKUP",
    response,
    json,
    toolCallId,
    elapsed,
    ["couldn't find"]
  );
}

// ---------------------------------------------------------------------------
// Test 2: Product Search — General Listing
// ---------------------------------------------------------------------------

async function testProductSearchGeneral(): Promise<boolean> {
  console.log("\n=== TEST 2: PRODUCT SEARCH — GENERAL LISTING ===");

  const toolCallId = `test_products_general_${Date.now()}`;

  const vapiPayload = {
    message: {
      type: "tool-calls",
      toolCallList: [
        {
          id: toolCallId,
          name: "search_products",
          arguments: {},
        },
      ],
      call: {
        assistantId: ASSISTANT_ID,
        id: `simulated_call_${Date.now()}`,
        metadata: { merchant_id: MERCHANT_ID },
      },
    },
  };

  const start = Date.now();
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify(vapiPayload),
  });
  const elapsed = Date.now() - start;
  const json = await response.json();

  return validateToolCallResult(
    "PRODUCT SEARCH (GENERAL)",
    response,
    json,
    toolCallId,
    elapsed
  );
}

// ---------------------------------------------------------------------------
// Test 3: Product Search — Specific Term
// ---------------------------------------------------------------------------

async function testProductSearchSpecific(): Promise<boolean> {
  console.log("\n=== TEST 3: PRODUCT SEARCH — SPECIFIC TERM ===");
  console.log("Search term: snowboard");

  const toolCallId = `test_products_specific_${Date.now()}`;

  const vapiPayload = {
    message: {
      type: "tool-calls",
      toolCallList: [
        {
          id: toolCallId,
          name: "search_products",
          arguments: { search_term: "snowboard" },
        },
      ],
      call: {
        assistantId: ASSISTANT_ID,
        id: `simulated_call_${Date.now()}`,
        metadata: { merchant_id: MERCHANT_ID },
      },
    },
  };

  const start = Date.now();
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify(vapiPayload),
  });
  const elapsed = Date.now() - start;
  const json = await response.json();

  return validateToolCallResult(
    "PRODUCT SEARCH (SPECIFIC)",
    response,
    json,
    toolCallId,
    elapsed,
    ["couldn't find a product"]
  );
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

async function runAllTests() {
  console.log("\n========================================");
  console.log("  LAYER 1: WEBHOOK UNIT TESTS");
  console.log("========================================");
  console.log("Target:", WEBHOOK_URL);
  console.log("Secret header:", WEBHOOK_SECRET ? "✅ set" : "⚠️  empty");

  const results: { name: string; passed: boolean }[] = [];

  results.push({ name: "Order Lookup", passed: await testOrderLookup() });
  results.push({ name: "Product Search (General)", passed: await testProductSearchGeneral() });
  results.push({ name: "Product Search (Specific)", passed: await testProductSearchSpecific() });

  console.log("\n========================================");
  console.log("  SUMMARY");
  console.log("========================================");

  for (const r of results) {
    console.log(`  ${r.passed ? "✅" : "❌"} ${r.name}`);
  }

  const allPassed = results.every((r) => r.passed);

  if (allPassed) {
    console.log("\n✅ ALL TESTS PASSED — Webhook works correctly");
  } else {
    console.log("\n❌ SOME TESTS FAILED — Fix before proceeding");
    process.exit(1);
  }
}

runAllTests().catch((err: Error) => {
  console.error("❌ Script error:", err.message);
  process.exit(1);
});
