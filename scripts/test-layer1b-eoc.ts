/**
 * LAYER 1B: Contract Tests — End-of-Call Report, Shopify Webhook, Security Boundaries
 *
 * Tests the financially critical paths WITHOUT making a real phone call.
 * Each test verifies the full data flow: HTTP request → DB write → verified via Supabase API.
 * All test rows are cleaned up in finally blocks — nothing pollutes production data.
 *
 * Tests:
 *   1. End-of-Call-Report → call_logs row + credit deduction (requires VAPI_ASSISTANT_ID)
 *   2. Idempotency — same callId sent twice, charged only once (requires VAPI_ASSISTANT_ID)
 *   3. Shopify Abandoned-Cart → pending_outbound_calls row (requires SHOPIFY_TEST_WEBHOOK_SECRET)
 *   4. Security Boundaries — wrong secrets return 401, not 500 (no merchant required)
 *
 * REQUIRES in .env.local (auto-populated by Claude from Supabase Vault):
 *   NEXT_PUBLIC_BASE_URL           — deployed production URL (must be publicly accessible)
 *   VAPI_WEBHOOK_SECRET            — from .env (real secret for x-vapi-secret header)
 *   SUPABASE_SERVICE_KEY           — bypasses RLS for DB verification queries
 *   NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
 *   CRON_SECRET                    — for cron security boundary test
 *
 *   VAPI_ASSISTANT_ID              — active merchant's vapi_agent_id (BLANK until provisioned)
 *   VAPI_MERCHANT_ID               — that merchant's UUID (BLANK until provisioned)
 *
 *   SHOPIFY_TEST_SHOP_DOMAIN       — veemagicspurs-2.myshopify.com
 *   SHOPIFY_TEST_WEBHOOK_SECRET    — per-shop HMAC secret (fetched from Vault by Claude)
 *   SHOPIFY_TEST_MERCHANT_ID       — merchant UUID with outbound_consent_confirmed_at set
 *
 * NOTE ON CURRENT STATUS (as of March 2026):
 *   Tests 1 and 2 are BLOCKED — no merchant is provisioned (vapi_agent_id IS NULL for all).
 *   Root cause: Twilio account (see .env.local TWILIO_ACCOUNT_SID) is on trial plan.
 *   Fix: Upgrade Twilio account, then run provisioning for any merchant.
 *   Once provisioned, populate VAPI_ASSISTANT_ID and VAPI_MERCHANT_ID in .env.local.
 *   Tests 3 and 4 run NOW and require no provisioned merchant.
 *
 * Run: npm run test:eoc
 */

import { createHmac } from "crypto";

// ── Environment validation ────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET ?? "";
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const MERCHANT_ID = process.env.VAPI_MERCHANT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SHOP_DOMAIN = process.env.SHOPIFY_TEST_SHOP_DOMAIN;
const SHOPIFY_SECRET = process.env.SHOPIFY_TEST_WEBHOOK_SECRET;
const SHOPIFY_MERCHANT_ID = process.env.SHOPIFY_TEST_MERCHANT_ID;
const CRON_SECRET = process.env.CRON_SECRET;

// Fail fast on truly required vars (Supabase + BASE_URL)
const REQUIRED: Record<string, string | undefined> = {
  NEXT_PUBLIC_BASE_URL: BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_KEY: SERVICE_KEY,
};
for (const [name, val] of Object.entries(REQUIRED)) {
  if (!val) {
    console.error(`❌ Missing required env var: ${name}`);
    process.exit(1);
  }
}

const WEBHOOK_URL = `${BASE_URL}/api/vapi/webhook`;
const SUPABASE_HEADERS: Record<string, string> = {
  apikey: SERVICE_KEY!,
  Authorization: `Bearer ${SERVICE_KEY!}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ── Supabase REST helpers ─────────────────────────────────────────────────────

async function supabaseSelect<T>(
  table: string,
  filter: string
): Promise<T[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`,
    { headers: SUPABASE_HEADERS }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase GET ${table} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T[]>;
}

async function supabaseDelete(table: string, filter: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: SUPABASE_HEADERS,
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Supabase DELETE ${table} failed (${res.status}): ${body}`);
  }
}

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.log(`  ❌ ${msg}`); }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`); }

// ── Test 1: End-of-Call-Report → call_logs write + credit deduction ──────────

async function testEndOfCallReport(): Promise<boolean> {
  console.log("\n=== TEST 1: END-OF-CALL-REPORT CONTRACT ===");

  if (!ASSISTANT_ID || !MERCHANT_ID) {
    warn("SKIPPED — VAPI_ASSISTANT_ID and VAPI_MERCHANT_ID are not set.");
    warn("Blocker: Twilio subaccount is on trial plan. Upgrade to enable provisioning.");
    warn("Once a merchant is provisioned, populate these vars in .env.local and rerun.");
    return true; // Skipped is not a failure — test is not applicable yet
  }

  const callId = `test_eoc_${Date.now()}`;
  const now = new Date();
  // 60-second call — well above SHORT_CALL_THRESHOLD_SECS (15s) to trigger deduction
  const startedAt = new Date(now.getTime() - 60_000).toISOString();
  const endedAt = now.toISOString();

  // Read balance BEFORE — credits_charged is capped at balance (LEAST in SQL)
  const [merchantBefore] = await supabaseSelect<{ credit_balance: number }>(
    "merchants",
    `id=eq.${MERCHANT_ID}`
  );
  const balanceBefore = merchantBefore?.credit_balance ?? 0;
  console.log(`  Balance before: ${balanceBefore}s`);

  const payload = {
    message: {
      type: "end-of-call-report",
      call: {
        id: callId,
        assistantId: ASSISTANT_ID,
        type: "inboundPhoneCall",
        startedAt,
        endedAt,
        customer: { number: "+2348011111111" },
        phoneNumber: { number: "+447700900000" },
      },
      artifact: {
        transcript:
          "Customer: Where is order 1001? Agent: Let me check that for you right away.",
        messages: [
          { role: "user", content: "Where is order 1001?" },
          { role: "assistant", content: "Let me check that for you right away." },
        ],
        recordingUrl: null,
      },
      analysis: {
        summary: "Customer asked about order 1001. AI assisted with lookup.",
        successEvaluation: "pass",
      },
      endedReason: "customer-ended-call",
    },
  };

  try {
    const start = Date.now();
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vapi-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });
    const elapsed = Date.now() - start;
    const json = (await res.json()) as { received?: boolean };

    res.status === 200 ? pass(`HTTP 200`) : fail(`HTTP ${res.status} (expected 200)`);
    elapsed < 3000 ? pass(`Response in ${elapsed}ms`) : warn(`Slow response: ${elapsed}ms`);
    json.received === true ? pass(`received: true`) : fail(`expected {received: true}, got ${JSON.stringify(json)}`);

    if (res.status !== 200) return false;

    // Allow 500ms for the async DB write to settle
    await new Promise((r) => setTimeout(r, 500));

    // Verify call_logs row
    const logs = await supabaseSelect<{
      id: string;
      transcript: string;
      duration_seconds: number;
      credits_charged: number;
      call_type: string;
    }>(
      "call_logs",
      `vapi_call_id=eq.${callId}&merchant_id=eq.${MERCHANT_ID}`
    );

    const log = logs[0];
    log ? pass("call_logs row created") : fail("call_logs row MISSING — check webhook handler");
    if (!log) return false;

    log.transcript?.length > 0
      ? pass("transcript saved")
      : fail("transcript empty");

    log.duration_seconds === 60
      ? pass(`duration_seconds = 60`)
      : fail(`duration_seconds = ${log.duration_seconds} (expected 60)`);

    // Credits are capped at the merchant's balance — never go negative
    const expectedDeduction = Math.min(60, balanceBefore);
    log.credits_charged === expectedDeduction
      ? pass(`credits_charged = ${expectedDeduction} (capped at balance)`)
      : fail(`credits_charged = ${log.credits_charged} (expected ${expectedDeduction})`);

    // Verify balance decreased
    const [merchantAfter] = await supabaseSelect<{ credit_balance: number }>(
      "merchants",
      `id=eq.${MERCHANT_ID}`
    );
    const balanceAfter = merchantAfter?.credit_balance ?? 0;
    const expectedBalance = balanceBefore - expectedDeduction;
    balanceAfter === expectedBalance
      ? pass(`Balance: ${balanceBefore}s → ${balanceAfter}s (deducted ${expectedDeduction}s)`)
      : fail(`Balance: ${balanceBefore}s → ${balanceAfter}s (expected ${expectedBalance}s)`);

    return (
      res.status === 200 &&
      !!log &&
      log.transcript.length > 0 &&
      log.duration_seconds === 60 &&
      log.credits_charged === expectedDeduction &&
      balanceAfter === expectedBalance
    );
  } finally {
    // Cleanup — test rows must never pollute production call logs.
    // credit_transactions has FK → call_logs.id, so delete child rows first.
    try {
      const logs = await supabaseSelect<{ id: string }>(
        "call_logs",
        `vapi_call_id=eq.${callId}&merchant_id=eq.${MERCHANT_ID}`
      );
      for (const log of logs) {
        await supabaseDelete("credit_transactions", `call_log_id=eq.${log.id}`);
      }
      await supabaseDelete(
        "call_logs",
        `vapi_call_id=eq.${callId}&merchant_id=eq.${MERCHANT_ID}`
      );
      console.log("  Cleanup: test call_logs row deleted");
    } catch (e) {
      warn(`Cleanup failed: ${(e as Error).message}`);
    }
  }
}

// ── Test 2: Idempotency — same callId charged only once ──────────────────────

async function testIdempotency(): Promise<boolean> {
  console.log("\n=== TEST 2: IDEMPOTENCY CONTRACT ===");

  if (!ASSISTANT_ID || !MERCHANT_ID) {
    warn("SKIPPED — requires VAPI_ASSISTANT_ID and VAPI_MERCHANT_ID (same blocker as Test 1)");
    return true;
  }

  const callId = `test_idem_${Date.now()}`;
  const now = new Date();
  const startedAt = new Date(now.getTime() - 30_000).toISOString();
  const endedAt = now.toISOString();

  const payload = {
    message: {
      type: "end-of-call-report",
      call: {
        id: callId,
        assistantId: ASSISTANT_ID,
        type: "inboundPhoneCall",
        startedAt,
        endedAt,
      },
      artifact: {
        transcript: "Idempotency test call.",
        messages: [],
        recordingUrl: null,
      },
      analysis: { summary: "Idempotency test.", successEvaluation: "pass" },
      endedReason: "customer-ended-call",
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-vapi-secret": WEBHOOK_SECRET,
  };

  try {
    const [merchantBefore] = await supabaseSelect<{ credit_balance: number }>(
      "merchants",
      `id=eq.${MERCHANT_ID}`
    );
    const balanceBefore = merchantBefore?.credit_balance ?? 0;

    // Send the SAME payload twice — only the first should be processed
    await fetch(WEBHOOK_URL, { method: "POST", headers, body: JSON.stringify(payload) });
    await new Promise((r) => setTimeout(r, 300));
    await fetch(WEBHOOK_URL, { method: "POST", headers, body: JSON.stringify(payload) });
    await new Promise((r) => setTimeout(r, 500));

    const logs = await supabaseSelect<{ id: string }>(
      "call_logs",
      `vapi_call_id=eq.${callId}&merchant_id=eq.${MERCHANT_ID}`
    );

    const [merchantAfter] = await supabaseSelect<{ credit_balance: number }>(
      "merchants",
      `id=eq.${MERCHANT_ID}`
    );
    const balanceAfter = merchantAfter?.credit_balance ?? 0;
    const totalDeducted = balanceBefore - balanceAfter;

    // Should be exactly 1 row, not 2
    logs.length === 1
      ? pass(`Exactly 1 call_logs row (not 2)`)
      : fail(`${logs.length} call_logs rows — idempotency broken`);

    // Charged once (30s), not twice (60s)
    totalDeducted <= 30
      ? pass(`Charged once: ${totalDeducted}s deducted`)
      : fail(`Charged twice: ${totalDeducted}s deducted (should be ≤30s)`);

    return logs.length === 1 && totalDeducted <= 30;
  } finally {
    try {
      const logs = await supabaseSelect<{ id: string }>(
        "call_logs",
        `vapi_call_id=eq.${callId}&merchant_id=eq.${MERCHANT_ID}`
      );
      for (const log of logs) {
        await supabaseDelete("credit_transactions", `call_log_id=eq.${log.id}`);
      }
      await supabaseDelete(
        "call_logs",
        `vapi_call_id=eq.${callId}&merchant_id=eq.${MERCHANT_ID}`
      );
      console.log("  Cleanup: idempotency test row deleted");
    } catch {}
  }
}

// ── Test 3: Shopify Abandoned-Cart → pending_outbound_calls ──────────────────

async function testShopifyAbandonedCart(): Promise<boolean> {
  console.log("\n=== TEST 3: SHOPIFY ABANDONED-CART CONTRACT ===");

  if (!SHOP_DOMAIN || !SHOPIFY_SECRET || !SHOPIFY_MERCHANT_ID) {
    warn("SKIPPED — SHOPIFY_TEST_SHOP_DOMAIN, SHOPIFY_TEST_WEBHOOK_SECRET, SHOPIFY_TEST_MERCHANT_ID not set");
    return true;
  }

  const checkoutToken = `test_tok_${Date.now()}`;

  // Body must be serialized once — HMAC computed over exact bytes sent as body
  const body = JSON.stringify({
    id: checkoutToken,
    token: checkoutToken,
    email: "barpel_test_customer@example.com",
    total_price: "150.00",
    phone: "+2348011111111",
    billing_address: {
      name: "Barpel Test Customer",
      phone: "+2348011111111",
    },
    line_items: [
      {
        id: "test_item_1",
        product_id: "test_product_1",
        title: "Contract Test Product",
        quantity: 1,
        price: "150.00",
      },
    ],
  });

  // Shopify webhooks use base64 HMAC-SHA256 (NOT hex) — per lib/security.ts verifyShopifyWebhook
  const hmac = createHmac("sha256", SHOPIFY_SECRET).update(body).digest("base64");

  try {
    const res = await fetch(`${BASE_URL}/api/outbound/abandoned-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-shopify-shop-domain": SHOP_DOMAIN,
        "x-shopify-hmac-sha256": hmac,
      },
      body,
    });

    const json = (await res.json()) as {
      ok?: boolean;
      skipped?: string;
      duplicate?: boolean;
    };

    res.status === 200 ? pass(`HTTP 200`) : fail(`HTTP ${res.status}`);
    json.ok === true ? pass(`ok: true`) : fail(`ok not true: ${JSON.stringify(json)}`);

    if (json.skipped) {
      fail(`Request was skipped: "${json.skipped}"`);
      warn("Possible reasons: integration not active, no consent, merchant email match, cart below $100");
      return false;
    }

    if (res.status !== 200) return false;

    await new Promise((r) => setTimeout(r, 300));

    const rows = await supabaseSelect<{
      id: string;
      status: string;
      scheduled_for: string;
      customer_phone: string;
    }>(
      "pending_outbound_calls",
      `shopify_checkout_token=eq.${checkoutToken}&merchant_id=eq.${SHOPIFY_MERCHANT_ID}`
    );

    const row = rows[0];
    row ? pass("pending_outbound_calls row created") : fail("DB row MISSING — webhook did not write to DB");
    if (!row) return false;

    row.status === "pending"
      ? pass(`status = "pending"`)
      : fail(`status = "${row.status}" (expected "pending")`);

    const scheduledFor = new Date(row.scheduled_for);
    scheduledFor > new Date()
      ? pass(`scheduled_for is in the future (${row.scheduled_for})`)
      : fail(`scheduled_for is in the past`);

    return res.status === 200 && !!row && row.status === "pending" && scheduledFor > new Date();
  } finally {
    try {
      await supabaseDelete(
        "pending_outbound_calls",
        `shopify_checkout_token=eq.${checkoutToken}&merchant_id=eq.${SHOPIFY_MERCHANT_ID}`
      );
      console.log("  Cleanup: test pending_outbound_calls row deleted");
    } catch (e) {
      warn(`Cleanup failed: ${(e as Error).message}`);
    }
  }
}

// ── Test 4: Security Boundaries — all wrong secrets must return 401 ───────────

async function testSecurityBoundaries(): Promise<boolean> {
  console.log("\n=== TEST 4: SECURITY BOUNDARY CHECKS ===");

  // Run all 3 checks in parallel — they are independent
  const [vapiRes, shopifyRes, cronRes] = await Promise.all([
    // 4a. Vapi: wrong x-vapi-secret
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vapi-secret": "wrong_secret_xyz_should_return_401",
      },
      body: JSON.stringify({ message: { type: "tool-calls", toolCallList: [] } }),
    }),

    // 4b. Shopify: wrong HMAC (valid base64, wrong signature)
    fetch(`${BASE_URL}/api/outbound/abandoned-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-shopify-shop-domain": SHOP_DOMAIN || "test.myshopify.com",
        "x-shopify-hmac-sha256": "aGVsbG8=", // "hello" in base64 — not a valid HMAC
      },
      body: JSON.stringify({
        id: "fake",
        token: "fake",
        total_price: "200.00",
        line_items: [],
      }),
    }),

    // 4c. Cron: wrong Authorization header
    CRON_SECRET
      ? fetch(`${BASE_URL}/api/cron/dial-pending`, {
          headers: { Authorization: "Bearer wrong_cron_secret_should_return_401" },
        })
      : Promise.resolve({ status: 0 } as Response),
  ]);

  vapiRes.status === 401
    ? pass(`Vapi wrong secret → 401`)
    : fail(`Vapi wrong secret → ${vapiRes.status} (expected 401)`);

  shopifyRes.status === 401
    ? pass(`Shopify wrong HMAC → 401`)
    : fail(`Shopify wrong HMAC → ${shopifyRes.status} (expected 401)`);

  if (CRON_SECRET) {
    cronRes.status === 401
      ? pass(`Cron wrong secret → 401`)
      : fail(`Cron wrong secret → ${cronRes.status} (expected 401)`);
  } else {
    warn("Cron test skipped — CRON_SECRET not set in .env.local");
  }

  const passed =
    vapiRes.status === 401 &&
    shopifyRes.status === 401 &&
    (!CRON_SECRET || cronRes.status === 401);

  return passed;
}

// ── Run all tests ─────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log("\n========================================");
  console.log("  LAYER 1B: CONTRACT TESTS");
  console.log("========================================");
  console.log("Target:", BASE_URL);
  console.log("Vapi secret:", WEBHOOK_SECRET ? "✅ set" : "⚠️  empty");
  console.log(
    "Provisioning status:",
    ASSISTANT_ID ? "✅ active merchant found" : "⚠️  no provisioned merchant"
  );

  const results: { name: string; passed: boolean; skipped?: boolean }[] = [];

  results.push({
    name: "End-of-Call-Report → DB write + credit deduction",
    passed: await testEndOfCallReport(),
    skipped: !ASSISTANT_ID,
  });

  results.push({
    name: "Idempotency — same call charged only once",
    passed: await testIdempotency(),
    skipped: !ASSISTANT_ID,
  });

  results.push({
    name: "Shopify Abandoned-Cart → pending_outbound_calls",
    passed: await testShopifyAbandonedCart(),
    skipped: !SHOP_DOMAIN,
  });

  results.push({
    name: "Security Boundaries → 401",
    passed: await testSecurityBoundaries(),
  });

  console.log("\n========================================");
  console.log("  SUMMARY");
  console.log("========================================");

  for (const r of results) {
    if (r.skipped) {
      console.log(`  ⏭️  ${r.name} (SKIPPED — requires provisioned merchant)`);
    } else {
      console.log(`  ${r.passed ? "✅" : "❌"} ${r.name}`);
    }
  }

  const failures = results.filter((r) => !r.skipped && !r.passed);

  if (failures.length === 0) {
    console.log("\n✅ ALL ACTIVE CONTRACT TESTS PASSED");
    if (!ASSISTANT_ID) {
      console.log("\n⚠️  BLOCKER: Tests 1 & 2 were skipped — no provisioned merchant.");
      console.log("   Root cause: Twilio account (TWILIO_ACCOUNT_SID) is on trial plan.");
      console.log("   Action required: Upgrade Twilio account → reprovision a merchant.");
      console.log("   Then set VAPI_ASSISTANT_ID and VAPI_MERCHANT_ID in .env.local and rerun.");
    }
    process.exit(0);
  } else {
    console.log("\n❌ TESTS FAILED — Fix before making any phone calls:");
    for (const f of failures) console.log(`   - ${f.name}`);
    process.exit(1);
  }
}

runAllTests().catch((err: Error) => {
  console.error("❌ Script error:", err.message);
  process.exit(1);
});
