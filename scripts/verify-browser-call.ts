/**
 * verify-browser-call.ts
 *
 * Verifies the prerequisites for the "Test in Browser" button to work.
 * Checks everything that can be verified without a real browser + speaker.
 *
 * A real browser test (with audio output) cannot be automated headlessly —
 * Daily.co/Vapi requires a real audio output device (setSinkId). This script
 * verifies everything upstream of that.
 *
 * PASSES when all are true:
 *   1. Active merchant has a vapi_agent_id in DB
 *   2. NEXT_PUBLIC_VAPI_PUBLIC_KEY is a valid UUID format
 *   3. Vapi assistant exists (GET /assistant/{id} → 200)
 *   4. Assistant has firstMessage set (AI speaks on connect)
 *   5. Assistant serverUrl points to production webhook
 *
 * Run: npx tsx --env-file=.env.local scripts/verify-browser-call.ts
 */

import { createAdminClient } from "@/lib/supabase/admin";

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 2000): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts) throw e;
      const err = e as Error;
      console.warn(`  ⚠️  Attempt ${i}/${attempts} failed (${err.message}), retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("unreachable");
}

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!VAPI_KEY) {
  console.error("❌ Missing env var: VAPI_PRIVATE_KEY");
  process.exit(1);
}
if (!BASE_URL) {
  console.error("❌ Missing env var: NEXT_PUBLIC_BASE_URL");
  process.exit(1);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  const sb = createAdminClient();
  const results: { name: string; pass: boolean; detail: string }[] = [];

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("  VERIFY: Browser Test Call Prerequisites");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // ── Check 1: Public key is a valid UUID ──────────────────────────────────

  const publicKeyOk = !!PUBLIC_KEY && UUID_RE.test(PUBLIC_KEY);
  results.push({
    name: "NEXT_PUBLIC_VAPI_PUBLIC_KEY is a valid UUID",
    pass: publicKeyOk,
    detail: PUBLIC_KEY
      ? publicKeyOk
        ? PUBLIC_KEY
        : `Invalid format: ${PUBLIC_KEY}`
      : "NOT SET",
  });

  // ── Check 2: Active merchant has vapi_agent_id ───────────────────────────

  // Match the same status check as the browser test API route:
  // provisioning_status must be 'active' OR 'suspended'
  const { data: merchant } = await retry(() =>
    sb
      .from("merchants")
      .select("id, business_name, vapi_agent_id, support_phone, provisioning_status")
      .in("provisioning_status", ["active", "suspended"])
      .not("vapi_agent_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
  );

  const hasAgentId = !!merchant?.vapi_agent_id;
  results.push({
    name: "Merchant with vapi_agent_id in DB (active or suspended)",
    pass: hasAgentId,
    detail: hasAgentId
      ? `${merchant!.business_name} [${merchant!.provisioning_status}] → ${merchant!.vapi_agent_id}`
      : "No active/suspended merchant with vapi_agent_id found",
  });

  if (!hasAgentId) {
    printResults(results);
    process.exit(1);
  }

  // ── Check 3: Vapi assistant exists ──────────────────────────────────────

  const assistantRes = await retry(() =>
    fetch(`https://api.vapi.ai/assistant/${merchant!.vapi_agent_id}`, {
      headers: { Authorization: `Bearer ${VAPI_KEY}` },
    })
  );
  const assistantExists = assistantRes.status === 200;
  const assistant = assistantExists ? await assistantRes.json() : null;

  results.push({
    name: "Vapi assistant exists (GET /assistant → 200)",
    pass: assistantExists,
    detail: assistantExists
      ? `name: ${assistant.name}`
      : `HTTP ${assistantRes.status} — must reprovision`,
  });

  if (!assistantExists) {
    printResults(results);
    process.exit(1);
  }

  // ── Check 4: firstMessage is set ────────────────────────────────────────

  const hasFirstMessage = !!assistant.firstMessage?.trim();
  results.push({
    name: "Assistant has firstMessage (AI speaks on connect)",
    pass: hasFirstMessage,
    detail: hasFirstMessage
      ? `"${assistant.firstMessage.slice(0, 80)}"`
      : "EMPTY — AI will be silent on connect",
  });

  // ── Check 5: serverUrl points to production ──────────────────────────────

  const expectedDomain = new URL(BASE_URL!).hostname;
  const serverUrlOk = !!assistant.serverUrl?.includes(expectedDomain);
  results.push({
    name: "serverUrl points to production webhook",
    pass: serverUrlOk,
    detail: assistant.serverUrl ?? "NOT SET",
  });

  // ── Check 6: Voice is configured ────────────────────────────────────────

  const hasVoice = !!assistant.voice;
  results.push({
    name: "Voice is configured",
    pass: hasVoice,
    detail: hasVoice
      ? `voiceId: ${assistant.voice?.voiceId ?? assistant.voice?.model ?? "set"}`
      : "NO VOICE — call will be silent",
  });

  printResults(results);

  const allPassed = results.every((r) => r.pass);
  if (allPassed) {
    console.log(
      "\n✅ ALL CHECKS PASSED — browser test call will work in a real browser"
    );
    console.log(
      "   Note: headless environments (CI, Playwright) will fail at the audio"
    );
    console.log(
      "   output stage (setSinkId) — this is expected and not a code bug.\n"
    );
  } else {
    console.log(
      "\n❌ SOME CHECKS FAILED — fix above before testing in browser\n"
    );
    process.exit(1);
  }
}

function printResults(results: { name: string; pass: boolean; detail: string }[]) {
  console.log("Results:");
  console.log("────────────────────────────────────────────────────");
  for (const r of results) {
    console.log(`  ${r.pass ? "✅" : "❌"} ${r.name}`);
    console.log(`     ${r.detail}`);
  }
  console.log("────────────────────────────────────────────────────");
}

main().catch((e: unknown) => {
  const err = e as Error & { cause?: unknown };
  console.error("Script error:", err.message);
  if (err.cause) console.error("Caused by:", err.cause);
  console.error(err.stack ?? "(no stack)");
  process.exit(1);
});
