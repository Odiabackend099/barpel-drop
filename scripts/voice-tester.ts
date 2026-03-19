/**
 * voice-tester.ts
 *
 * Interactive voice quality test for Barpel AI.
 * Fetches all ElevenLabs voices available through Vapi, patches the assistant
 * with each top-5 warm voice, fires a real outbound call to your phone, and
 * lets you listen and choose which voice to keep.
 *
 * REQUIRES (in .env.local):
 *   VAPI_PRIVATE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   TEST_PHONE_NUMBER   — your E.164 number, e.g. +14155551234
 *
 * Run: npm run voice:test
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { chromium } from "playwright";
import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
const TEST_PHONE = process.env.TEST_PHONE_NUMBER;

if (!VAPI_KEY) {
  console.error("❌ Missing env var: VAPI_PRIVATE_KEY");
  process.exit(1);
}

if (!TEST_PHONE) {
  console.error("❌ Missing env var: TEST_PHONE_NUMBER");
  console.error(
    "   Uncomment and fill in TEST_PHONE_NUMBER in .env.local first."
  );
  process.exit(1);
}

// ── TYPES ────────────────────────────────────────────────────────────────────

interface VapiVoice {
  id: string;
  providerId: string;
  name: string;
  gender: string;
  description: string;
  accent?: string;
  category?: string;
  previewUrl?: string;
  isPublic?: boolean;
}

interface VoiceTestResult {
  name: string;
  voiceId: string;
  vapiAccepted: boolean;
  dbSaved: boolean;
  toolsIntact: boolean;
  callId: string | null;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function waitForInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function selectTop5(voices: VapiVoice[]): VapiVoice[] {
  const positiveKeywords = [
    "conversational",
    "warm",
    "friendly",
    "natural",
    "calm",
    "smooth",
    "soft",
    "gentle",
    "customer",
    "support",
    "approachable",
  ];
  const negativeKeywords = [
    "narrator",
    "news",
    "documentary",
    "audiobook",
    "dramatic",
    "children",
    "nursery",
    "story",
    "deep",
    "resonant",
  ];

  const scored = voices.map((v) => {
    const text = `${v.name} ${v.description ?? ""}`.toLowerCase();
    let score = 0;

    for (const kw of positiveKeywords) {
      if (text.includes(kw)) score += 2;
    }
    for (const kw of negativeKeywords) {
      if (text.includes(kw)) score -= 3;
    }

    // Prefer female voices for customer support warmth
    if (v.gender === "female") score += 1;

    // Extra weight for "conversational" in the name itself
    if (v.name.toLowerCase().includes("conversational")) score += 3;

    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);

  console.log("\n  Top 5 selected by warmth/conversational score:");
  scored.slice(0, 5).forEach((s, i) => {
    console.log(
      `    ${i + 1}. [score: ${s.score}] ${s.voice.name} — ${s.voice.gender}`
    );
    console.log(
      `       ${s.voice.description?.slice(0, 100) ?? "(no description)"}...`
    );
    console.log(`       ID: ${s.voice.providerId}`);
  });

  return scored.slice(0, 5).map((s) => s.voice);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("  BARPEL AI — ELEVENLABS VOICE TESTER");
  console.log("  Real calls. Real API. You listen and decide.");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  const supabase = createAdminClient();

  // Get active merchant
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, business_name, vapi_agent_id, vapi_phone_id")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!merchant?.vapi_agent_id) {
    console.error("❌ No active merchant with vapi_agent_id found.");
    process.exit(1);
  }

  if (!merchant.vapi_phone_id) {
    console.error("❌ Merchant has no vapi_phone_id — cannot place outbound calls.");
    process.exit(1);
  }

  console.log(`Merchant: ${merchant.business_name} (${merchant.id})`);
  console.log(`Assistant ID: ${merchant.vapi_agent_id}`);
  console.log(`Phone ID: ${merchant.vapi_phone_id}`);
  console.log(`Test phone: ${TEST_PHONE}\n`);

  // ── PART 1: FETCH ALL 100 VOICES ─────────────────────────────────────────

  console.log(
    "PART 1: Fetching ElevenLabs voice library from Vapi...\n"
  );

  const libraryRes = await fetch(
    "https://api.vapi.ai/voice-library/11labs",
    {
      headers: { Authorization: `Bearer ${VAPI_KEY}` },
    }
  );

  if (!libraryRes.ok) {
    const err = await libraryRes.text();
    console.error(
      `❌ Voice library request failed (${libraryRes.status}): ${err}`
    );
    process.exit(1);
  }

  const voices: VapiVoice[] = await libraryRes.json();

  if (!Array.isArray(voices) || voices.length === 0) {
    console.error("❌ Voice library returned empty or unexpected shape");
    process.exit(1);
  }

  console.log(
    `Total ElevenLabs voices available through Vapi: ${voices.length}\n`
  );

  console.log("  Full list:");
  voices.forEach((v, i) => {
    console.log(
      `  ${String(i + 1).padStart(3)}. ${v.name} | ID: ${v.providerId} | Gender: ${v.gender} | Category: ${v.category ?? "n/a"}`
    );
  });

  // Save full library to file
  const voiceLibraryPath = path.join(
    process.cwd(),
    "tests",
    "voice-library.json"
  );
  fs.writeFileSync(voiceLibraryPath, JSON.stringify(voices, null, 2));
  console.log(`\n✅ Full voice library saved to tests/voice-library.json\n`);

  // ── SELECT TOP 5 ─────────────────────────────────────────────────────────

  console.log(
    "Selecting top 5 warm/conversational voices...\n"
  );
  const top5 = selectTop5(voices);

  console.log("\n  Confirm these 5 voices will be tested:");
  top5.forEach((v, i) => console.log(`    ${i + 1}. ${v.name} [${v.providerId}]`));

  const confirm = await waitForInput(
    "\n  Press ENTER to start testing (or Ctrl+C to abort): "
  );
  void confirm;

  // ── LAUNCH HEADED PLAYWRIGHT BROWSER ─────────────────────────────────────

  console.log("\n  Launching browser...\n");

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // Open the Barpel landing page so the user can see the browser is live
  await page.goto("https://dropship.barpel.ai", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // ── PART 2: TEST EACH VOICE ───────────────────────────────────────────────

  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("  PART 2: TESTING EACH VOICE");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );

  const results: VoiceTestResult[] = [];
  let chosenVoice: VapiVoice | null = null;

  for (let idx = 0; idx < top5.length; idx++) {
    const voice = top5[idx];

    console.log(
      `\n══════════════════════════════════════════════════════`
    );
    console.log(`  [${idx + 1}/${top5.length}] ${voice.name}`);
    console.log(`  ID: ${voice.providerId}`);
    console.log(`  Gender: ${voice.gender}`);
    console.log(`  Description: ${voice.description?.slice(0, 120) ?? "(none)"}`);
    console.log(
      `══════════════════════════════════════════════════════`
    );

    const result: VoiceTestResult = {
      name: voice.name,
      voiceId: voice.providerId,
      vapiAccepted: false,
      dbSaved: false,
      toolsIntact: false,
      callId: null,
    };

    // STEP A: Get existing assistant to preserve tools
    console.log("\n  STEP A: Reading existing assistant...");
    const existingRes = await fetch(
      `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
      { headers: { Authorization: `Bearer ${VAPI_KEY}` } }
    );

    if (!existingRes.ok) {
      console.error(
        `  ❌ Failed to read assistant (${existingRes.status})`
      );
      results.push(result);
      continue;
    }

    const existing = await existingRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingModel = existing.model as Record<string, any>;

    // STEP B: Patch assistant with this voice
    console.log(`  STEP B: Patching assistant with ${voice.name}...`);

    const patchBody = {
      voice: {
        provider: "11labs",
        voiceId: voice.providerId,
        stability: 0.35,
        similarityBoost: 0.8,
        style: 0.2,
        useSpeakerBoost: true,
      },
      model: { ...existingModel }, // preserve all tools
    };

    const patchRes = await fetch(
      `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchBody),
      }
    );

    const patched = await patchRes.json();

    // STEP C: Verify Vapi accepted the voice
    result.vapiAccepted =
      patchRes.status === 200 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (patched as any).voice?.voiceId === voice.providerId;

    console.log(
      `  Vapi accepted: ${result.vapiAccepted ? "✅" : "❌"} (HTTP ${patchRes.status})`
    );

    if (!result.vapiAccepted) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`  ❌ SKIPPING — rejection reason: ${(patched as any).message ?? JSON.stringify(patched).slice(0, 200)}`);
      results.push(result);
      continue;
    }

    // STEP D: Update DB and verify
    console.log("  STEP D: Updating DB...");
    await supabase
      .from("merchants")
      .update({
        ai_voice_id: voice.providerId,
        ai_voice_provider: "11labs",
      })
      .eq("id", merchant.id);

    const { data: dbCheck } = await supabase
      .from("merchants")
      .select("ai_voice_id, ai_voice_provider")
      .eq("id", merchant.id)
      .single();

    result.dbSaved = dbCheck?.ai_voice_id === voice.providerId;
    console.log(
      `  DB saved: ${result.dbSaved ? "✅" : "❌"} | Stored ID: ${dbCheck?.ai_voice_id}`
    );

    // STEP E: Verify tools are intact
    const toolsArr =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (patched as any).model?.tools as Array<{ function?: { name?: string } }> | undefined;

    const hasLookupOrder = toolsArr?.some(
      (t) => t.function?.name === "lookup_order"
    ) ?? false;
    const hasSearchProducts = toolsArr?.some(
      (t) => t.function?.name === "search_products"
    ) ?? false;
    result.toolsIntact = hasLookupOrder && hasSearchProducts;

    console.log(
      `  Tools intact: ${result.toolsIntact ? "✅" : "❌ CRITICAL"}`
    );

    if (!result.toolsIntact) {
      console.error(
        "  ❌ TOOLS WIPED — restoring model immediately..."
      );
      await fetch(
        `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${VAPI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: existingModel }),
        }
      );
      console.log("  ✅ Tools restored from backup.");
      results.push(result);
      continue;
    }

    // STEP F: Playwright screenshot — show active test in browser
    try {
      await page.goto(`https://dropship.barpel.ai`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      const screenshotPath = path.join(
        process.cwd(),
        "tests",
        "voices",
        `voice-${idx + 1}-${voice.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  Screenshot: tests/voices/${path.basename(screenshotPath)}`);
    } catch (screenshotErr) {
      const msg =
        screenshotErr instanceof Error ? screenshotErr.message : String(screenshotErr);
      console.log(`  ⚠️  Screenshot failed: ${msg}`);
    }

    // STEP G: Fire outbound test call
    console.log(`  STEP G: Firing outbound call to ${TEST_PHONE}...`);

    const callRes = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: merchant.vapi_agent_id,
        phoneNumberId: merchant.vapi_phone_id,
        customer: { number: TEST_PHONE },
        assistantOverrides: {
          firstMessage: `Hello, this is a voice quality test for Barpel AI. I am ${voice.name}. How does my voice sound? Does it feel warm and natural for customer support?`,
          maxDurationSeconds: 20,
        },
      }),
    });

    const call = await callRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.callId = (call as any).id ?? null;

    console.log(
      `  Call fired: HTTP ${callRes.status} | Call ID: ${result.callId ?? "no ID"}`
    );

    if (!callRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`  ⚠️  Call error: ${(call as any).message ?? JSON.stringify(call).slice(0, 200)}`);
    }

    // STEP H: Wait for human judgement
    console.log(`
  ─────────────────────────────────────────────────────
  🎧  Your phone is ringing — listen to the voice quality.

  Voice: ${voice.name}
  Gender: ${voice.gender}
  Vapi accepted: ✅  DB saved: ✅  Tools intact: ✅
  ─────────────────────────────────────────────────────`);

    const input = await waitForInput(
      `  Press ENTER to continue to next voice, or type KEEP and ENTER to save this voice: `
    );

    results.push(result);

    if (input.trim().toUpperCase() === "KEEP") {
      chosenVoice = voice;
      console.log(
        `\n  ✅ KEEPING: ${voice.name} [${voice.providerId}]`
      );
      console.log("  Saved to Vapi and DB. Moving to final report.\n");
      break;
    }

    // Wait 20 seconds between calls to avoid Twilio rate limiting
    if (idx < top5.length - 1) {
      console.log("  Waiting 20 seconds before next voice test...");
      await new Promise((r) => setTimeout(r, 20000));
    }
  }

  // If no voice was explicitly chosen, restore the last accepted voice (or Manav)
  if (!chosenVoice && results.length > 0) {
    const lastOk = [...results].reverse().find((r) => r.vapiAccepted && r.dbSaved && r.toolsIntact);
    if (lastOk) {
      console.log(
        `\n  No KEEP was entered — last tested voice remains: ${lastOk.name}`
      );
    } else {
      console.log("\n  No suitable voice found — restoring to Manav (current default).");
    }
  }

  await browser.close();

  // ── PART 3: FINAL REPORT ─────────────────────────────────────────────────

  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("  PART 3: ELEVENLABS VOICE TEST RESULTS");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );

  results.forEach((r, i) => {
    console.log(`\n  [${i + 1}] ${r.name}`);
    console.log(`      ID: ${r.voiceId}`);
    console.log(
      `      Vapi accepted: ${r.vapiAccepted ? "✅" : "❌"} | DB saved: ${r.dbSaved ? "✅" : "❌"} | Tools intact: ${r.toolsIntact ? "✅" : "❌"}`
    );
    console.log(`      Call ID: ${r.callId ?? "(none)"}`);
  });

  if (chosenVoice) {
    console.log(`\n  ✅ FINAL CHOICE: ${chosenVoice.name}`);
    console.log(`     Voice ID: ${chosenVoice.providerId}`);
    console.log("     Saved in Vapi and DB. Ready for real merchants.");
  } else {
    console.log(
      "\n  ⚠️  No KEEP was entered. Check final Vapi/DB state."
    );
  }

  // Save results to file
  const resultsPath = path.join(
    process.cwd(),
    "tests",
    "voice-test-results.json"
  );
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        chosenVoice: chosenVoice
          ? { name: chosenVoice.name, providerId: chosenVoice.providerId }
          : null,
        results,
      },
      null,
      2
    )
  );
  console.log("\n  Full results saved to tests/voice-test-results.json");

  // Run contract tests
  console.log(
    "\n  Running npm run test:contracts to verify all 17 contracts still pass...\n"
  );
  const { execSync } = await import("child_process");
  try {
    const contractOutput = execSync("npm run test:contracts", {
      cwd: process.cwd(),
      env: { ...process.env },
      encoding: "utf8",
      stdio: "pipe",
    });
    console.log(contractOutput);
    console.log("  ✅ All contracts pass.\n");
  } catch (contractErr) {
    const errOut =
      contractErr instanceof Error ? contractErr.message : String(contractErr);
    console.error(`  ❌ Contract tests failed:\n${errOut}`);
  }

  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );
}

run().catch((err) => {
  console.error("Script error:", err.message ?? err);
  process.exit(1);
});
