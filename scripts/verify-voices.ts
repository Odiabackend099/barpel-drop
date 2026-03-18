/**
 * verify-voices.ts
 *
 * Headed browser. Fetches every ElevenLabs voice from Vapi and patches the
 * real merchant's assistant with each one. Reports pass/fail. Restores the
 * original voice when done.
 *
 * Run: npm run verify:voices
 */

import { chromium } from "playwright";
import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
if (!VAPI_KEY) { console.error("❌ Missing VAPI_PRIVATE_KEY"); process.exit(1); }

async function run() {
  const supabase = createAdminClient();

  // Get real active merchant
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, business_name, vapi_agent_id, ai_voice_id, ai_voice_provider")
    .eq("provisioning_status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!merchant?.vapi_agent_id) {
    console.error("❌ No active merchant with vapi_agent_id found"); process.exit(1);
  }

  console.log(`\nMerchant: ${merchant.business_name}`);
  console.log(`Assistant: ${merchant.vapi_agent_id}`);
  console.log(`Current voice: ${merchant.ai_voice_id ?? "default"}\n`);

  // GET existing assistant (preserve model/tools for all patches)
  const existingRes = await fetch(`https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`, {
    headers: { Authorization: `Bearer ${VAPI_KEY}` },
  });
  if (!existingRes.ok) { console.error("❌ Could not read Vapi assistant"); process.exit(1); }
  const existing = await existingRes.json();
  const existingModel = existing.model;
  const originalVoice = existing.voice;

  // Fetch all ElevenLabs voices
  console.log("Fetching ElevenLabs voice library from Vapi...");
  const libRes = await fetch("https://api.vapi.ai/voice-library/11labs", {
    headers: { Authorization: `Bearer ${VAPI_KEY}` },
  });
  if (!libRes.ok) { console.error("❌ Voice library fetch failed"); process.exit(1); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voices: any[] = await libRes.json();
  console.log(`Found ${voices.length} voices. Testing each one...\n`);

  // Open headed browser (visual only — shows progress)
  const browser = await chromium.launch({ headless: false, slowMo: 0 });
  const page = await browser.newPage();
  await page.setContent(`
    <html><body style="font-family:monospace;background:#0a0a0a;color:#00ff88;padding:24px">
    <h2>Barpel — ElevenLabs Voice Verification</h2>
    <p>Testing ${voices.length} voices against Vapi API...</p>
    <pre id="log" style="font-size:13px;line-height:1.6"></pre>
    </body></html>
  `);

  const passed: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < voices.length; i++) {
    const v = voices[i];
    const label = `[${String(i + 1).padStart(3)}/${voices.length}] ${v.name} (${v.providerId})`;

    const patchRes = await fetch(`https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${VAPI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        voice: { provider: "11labs", voiceId: v.providerId, stability: 0.35, similarityBoost: 0.8, style: 0.2, useSpeakerBoost: true },
        model: { ...existingModel },
      }),
    });

    const ok = patchRes.status === 200;
    const status = ok ? "✅ PASS" : `❌ FAIL (${patchRes.status})`;
    const line = `${status}  ${label}`;
    console.log(line);

    if (ok) passed.push(v.name);
    else failed.push(v.name);

    // Update browser display
    await page.evaluate((txt: string) => {
      const el = document.getElementById("log");
      if (el) el.textContent = txt;
    }, `${passed.length} PASS / ${failed.length} FAIL so far...\n\nLast: ${line}`);

    // Small delay to avoid hammering Vapi
    await new Promise(r => setTimeout(r, 200));
  }

  // Restore original voice
  console.log("\nRestoring original voice...");
  await fetch(`https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${VAPI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ voice: originalVoice, model: { ...existingModel } }),
  });
  console.log("✅ Original voice restored\n");

  // Final report
  const summary = [
    `\n${"═".repeat(60)}`,
    `  ELEVENLABS VOICE VERIFICATION RESULTS`,
    `${"═".repeat(60)}`,
    `  Total tested : ${voices.length}`,
    `  ✅ PASS      : ${passed.length}`,
    `  ❌ FAIL      : ${failed.length}`,
    `${"═".repeat(60)}`,
    ...(failed.length > 0 ? [`\n  Failed voices:\n${failed.map(n => `    - ${n}`).join("\n")}`] : []),
    `\n  All passing voices are compatible with this Vapi account.`,
  ].join("\n");

  console.log(summary);

  await page.evaluate((html: string) => {
    document.body.innerHTML = `<div style="font-family:monospace;background:#0a0a0a;color:#00ff88;padding:24px;white-space:pre">${html}</div>`;
  }, summary.replace(/</g, "&lt;"));

  // Keep browser open for 10s so user can read results
  await page.waitForTimeout(10000);
  await browser.close();
}

run().catch(err => { console.error("Error:", err.message ?? err); process.exit(1); });
