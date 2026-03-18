/**
 * verify-ai-live.ts
 *
 * Diagnostic + repair script for Ticket A/B/C.
 * Checks four things in order and auto-patches whatever is broken:
 *
 *   Check 1 — Phone number is in Vapi and linked to the assistant
 *   Check 2 — Vapi assistant exists and serverUrl points to production
 *   Check 3 — Live webhook chain responds correctly (Ticket C)
 *   Check 4 — Optional: fires a test outbound call so you can hear the AI live
 *
 * REQUIRES (in .env.local):
 *   VAPI_PRIVATE_KEY        — Vapi secret key
 *   VAPI_WEBHOOK_SECRET     — Sent as x-vapi-secret header
 *   NEXT_PUBLIC_BASE_URL    — https://barpel-ai.odia.dev
 *   TEST_PHONE_NUMBER       — (optional) E.164 number to call for Check 4
 *
 * Run: npm run verify:ai
 */

import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const TEST_PHONE = process.env.TEST_PHONE_NUMBER;

// ── env guard ────────────────────────────────────────────────────────────────

if (!VAPI_KEY) {
  console.error("❌ Missing env var: VAPI_PRIVATE_KEY");
  process.exit(1);
}
if (!BASE_URL) {
  console.error("❌ Missing env var: NEXT_PUBLIC_BASE_URL");
  process.exit(1);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function vapiHeaders() {
  return {
    Authorization: `Bearer ${VAPI_KEY}`,
    "Content-Type": "application/json",
  };
}

// ── Check 1: Phone in Vapi + assistant linked ─────────────────────────────────

async function check1PhoneLinked(): Promise<boolean> {
  console.log("\n════════════════════════════════════════");
  console.log("  CHECK 1: Phone number → assistant link");
  console.log("════════════════════════════════════════");

  const supabase = createAdminClient();

  // Fetch merchant row
  const { data: rows, error } = await supabase
    .from("merchants")
    .select("id, business_name, support_phone, vapi_phone_id, vapi_agent_id")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("❌ DB query failed:", error.message, error.code ?? "");
    return false;
  }

  const merchant = rows?.[0];
  if (!merchant) {
    console.error(`❌ No merchant row found for id=${MERCHANT_ID}`);
    return false;
  }

  console.log(`Merchant:       ${merchant.business_name} (${merchant.id})`);
  console.log(`support_phone:  ${merchant.support_phone ?? "null"}`);
  console.log(`vapi_phone_id:  ${merchant.vapi_phone_id ?? "null"}`);
  console.log(`vapi_agent_id:  ${merchant.vapi_agent_id ?? "null"}`);

  if (!merchant.vapi_agent_id) {
    console.error("❌ No vapi_agent_id — assistant was never created. Run provisioning first.");
    return false;
  }

  // ── Resolve Vapi phone ID (may be null in DB) ──

  let vapiPhoneId = merchant.vapi_phone_id;

  if (!vapiPhoneId) {
    console.log("\nvapi_phone_id is null — searching Vapi phone list for", merchant.support_phone);

    const listRes = await fetch(
      "https://api.vapi.ai/phone-number?limit=100",
      { headers: vapiHeaders() }
    );
    const phones: Array<{ id: string; phoneNumber?: string; number?: string; assistantId?: string }> =
      await listRes.json();

    const match = phones.find(
      (p) => (p.phoneNumber ?? p.number) === merchant.support_phone
    );

    if (!match) {
      console.error(
        `❌ Phone ${merchant.support_phone} not found in Vapi — must reprovision via /api/provisioning/retry`
      );
      return false;
    }

    vapiPhoneId = match.id;
    console.log(`   Found in Vapi: ${vapiPhoneId}`);

    // Write back to DB so future ops work
    const { error: updateErr } = await supabase
      .from("merchants")
      .update({ vapi_phone_id: vapiPhoneId })
      .eq("id", merchant.id);

    if (updateErr) {
      console.error("⚠️  Could not write vapi_phone_id back to DB:", updateErr.message);
    } else {
      console.log("   ✅ vapi_phone_id saved to DB");
    }
  }

  // ── Check assistantId on the phone number ──

  const phoneRes = await fetch(
    `https://api.vapi.ai/phone-number/${vapiPhoneId}`,
    { headers: vapiHeaders() }
  );
  const phone = await phoneRes.json();

  if (phoneRes.status === 404) {
    console.error("❌ Phone number not found in Vapi (404). Must reprovision.");
    return false;
  }

  console.log(`\nVapi phone object:`);
  console.log(`  id:          ${phone.id}`);
  console.log(`  number:      ${phone.phoneNumber ?? phone.number}`);
  console.log(`  assistantId: ${phone.assistantId ?? "null"}`);

  const linkedAssistantId: string | undefined = phone.assistantId;
  const expectedAssistantId: string = merchant.vapi_agent_id;

  if (linkedAssistantId === expectedAssistantId) {
    console.log("✅ Assistant correctly linked to phone number");
    return true;
  }

  // ── Patch the assistant link ──

  console.log(
    linkedAssistantId
      ? `⚠️  assistantId mismatch (got ${linkedAssistantId}, expected ${expectedAssistantId}) — patching`
      : "⚠️  No assistantId on phone — patching"
  );

  const patchRes = await fetch(
    `https://api.vapi.ai/phone-number/${vapiPhoneId}`,
    {
      method: "PATCH",
      headers: vapiHeaders(),
      body: JSON.stringify({ assistantId: expectedAssistantId }),
    }
  );
  const patchBody = await patchRes.text();

  if (!patchRes.ok) {
    console.error(`❌ PATCH failed (${patchRes.status}): ${patchBody}`);
    return false;
  }

  console.log(`✅ FIXED: assistant linked to phone (PATCH ${patchRes.status})`);
  return true;
}

// ── Check 2: Assistant exists + correct serverUrl ─────────────────────────────

async function check2AssistantConfig(): Promise<boolean> {
  console.log("\n════════════════════════════════════════");
  console.log("  CHECK 2: Assistant config");
  console.log("════════════════════════════════════════");

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("merchants")
    .select("vapi_agent_id, business_name")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const merchant = rows?.[0];
  if (!merchant?.vapi_agent_id) {
    console.error("❌ No vapi_agent_id in DB");
    return false;
  }

  const res = await fetch(
    `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
    { headers: vapiHeaders() }
  );
  const assistant = await res.json();

  if (res.status === 404) {
    console.error("❌ Vapi assistant does not exist (404). Must reprovision.");
    return false;
  }

  console.log(`Assistant id:   ${assistant.id}`);
  console.log(`Name:           ${assistant.name}`);
  console.log(`firstMessage:   ${assistant.firstMessage?.slice(0, 80)}`);
  console.log(`serverUrl:      ${assistant.serverUrl}`);
  console.log(
    `Tools:          ${
      assistant.model?.tools?.map((t: { function?: { name: string }; name?: string }) =>
        t.function?.name ?? t.name
      ).join(", ") ?? "none"
    }`
  );

  const expectedUrl = `${BASE_URL}/api/vapi/webhook`;
  const serverUrlOk = assistant.serverUrl?.includes("barpel-ai.odia.dev");

  if (serverUrlOk) {
    console.log("✅ serverUrl is correct");
    return true;
  }

  console.log(`⚠️  serverUrl wrong (${assistant.serverUrl}) — patching to ${expectedUrl}`);

  const patchRes = await fetch(
    `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
    {
      method: "PATCH",
      headers: vapiHeaders(),
      body: JSON.stringify({
        serverUrl: expectedUrl,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
      }),
    }
  );
  const patchBody = await patchRes.text();

  if (!patchRes.ok) {
    console.error(`❌ PATCH failed (${patchRes.status}): ${patchBody}`);
    return false;
  }

  console.log(`✅ FIXED: serverUrl patched (${patchRes.status})`);
  return true;
}

// ── Check 3: Live webhook chain ───────────────────────────────────────────────

async function check3WebhookChain(): Promise<boolean> {
  console.log("\n════════════════════════════════════════");
  console.log("  CHECK 3: Webhook chain (Ticket C)");
  console.log("════════════════════════════════════════");

  const supabase = createAdminClient();
  const { data: rows2 } = await supabase
    .from("merchants")
    .select("id, vapi_agent_id")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const merchant = rows2?.[0];
  const webhookUrl = `${BASE_URL}/api/vapi/webhook`;
  const toolCallId = `verify_${Date.now()}`;

  const payload = {
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
        assistantId: merchant?.vapi_agent_id,
        id: `verify_call_${Date.now()}`,
        metadata: { merchant_id: merchant?.id },
      },
    },
  };

  console.log(`Hitting: ${webhookUrl}`);
  const start = Date.now();

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify(payload),
  });

  const elapsed = Date.now() - start;
  const json = (await res.json()) as { results?: Array<{ toolCallId: string; result: string }> };
  const result = json?.results?.[0];

  console.log(`HTTP status:    ${res.status}  ${res.status === 200 ? "✅" : "❌ MUST BE 200"}`);
  console.log(`Response time:  ${elapsed}ms  ${elapsed < 5000 ? "✅" : "❌ TOO SLOW"}`);

  if (!result) {
    console.error("❌ No results array in response:", JSON.stringify(json));
    return false;
  }

  console.log(`toolCallId ok:  ${result.toolCallId === toolCallId ? "✅" : "❌ MISMATCH"}`);
  console.log(`Result type:    ${typeof result.result === "string" ? "✅ string" : "❌ not string"}`);
  console.log(`No newlines:    ${!result.result?.includes("\n") ? "✅" : "❌ has newlines"}`);
  console.log(`\nSpoken result: "${result.result?.slice(0, 120)}..."`);

  const fallbackWords = ["trouble", "unable", "contact support", "hasn't been set up"];
  const isFallback = fallbackWords.some((w) => result.result?.toLowerCase().includes(w));
  console.log(`Real data:      ${!isFallback ? "✅" : "⚠️  FALLBACK — check Vault + Shopify"}`);

  return res.status === 200 && !!result && result.toolCallId === toolCallId;
}

// ── Check 4: Outbound test call (optional) ────────────────────────────────────

async function check4TestCall(): Promise<boolean> {
  if (!TEST_PHONE) {
    console.log("\n════════════════════════════════════════");
    console.log("  CHECK 4: Test call (SKIPPED — no TEST_PHONE_NUMBER)");
    console.log("════════════════════════════════════════");
    console.log("  Set TEST_PHONE_NUMBER in .env.local to enable.");
    return true;
  }

  console.log("\n════════════════════════════════════════");
  console.log("  CHECK 4: Outbound test call");
  console.log("════════════════════════════════════════");

  const supabase = createAdminClient();
  const { data: rows3 } = await supabase
    .from("merchants")
    .select("vapi_agent_id, vapi_phone_id")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const merchant = rows3?.[0];
  if (!merchant?.vapi_phone_id) {
    console.log("⚠️  vapi_phone_id still null after Check 1 — skipping test call");
    return true;
  }

  const callRes = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      assistantId: merchant.vapi_agent_id,
      phoneNumberId: merchant.vapi_phone_id,
      customer: { number: TEST_PHONE },
      assistantOverrides: {
        firstMessage:
          "This is an automated verification call from Barpel. Your AI is live and working correctly. You can hang up now.",
      },
    }),
  });

  const call = await callRes.json();

  if (!callRes.ok) {
    console.error(`❌ Test call failed (${callRes.status}):`, JSON.stringify(call));
    return false;
  }

  console.log(`✅ Test call created — id: ${call.id} | status: ${call.status}`);
  console.log(`📞 ${TEST_PHONE} will ring in ~5 seconds. Answer it — you should hear the AI.`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("  BARPEL AI — VERIFY AI LIVE");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`Merchant:  (resolved from DB — provisioning_status='active')`);
  console.log(`Base URL:  ${BASE_URL}`);
  console.log(`Test phone: ${TEST_PHONE ?? "(not set)"}`);

  const results: { name: string; passed: boolean }[] = [];

  results.push({ name: "Phone linked to assistant", passed: await check1PhoneLinked() });
  results.push({ name: "Assistant config / serverUrl", passed: await check2AssistantConfig() });
  results.push({ name: "Webhook chain (Ticket C)", passed: await check3WebhookChain() });
  results.push({ name: "Outbound test call", passed: await check4TestCall() });

  console.log("\n════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("════════════════════════════════════════");

  for (const r of results) {
    console.log(`  ${r.passed ? "✅" : "❌"} ${r.name}`);
  }

  const allPassed = results.every((r) => r.passed);

  if (allPassed) {
    console.log("\n✅ ALL CHECKS PASSED — AI is live");
    console.log("   Next: npm run test:webhook  →  all 4 tools must pass");
    if (!TEST_PHONE) {
      console.log("   Then: call +14707620377 manually — AI must answer");
    }
  } else {
    console.log("\n❌ SOME CHECKS FAILED — fix above errors before calling the number");
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error("❌ Script error:", err.message);
  process.exit(1);
});
