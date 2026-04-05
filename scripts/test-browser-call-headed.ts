/**
 * test-browser-call-headed.ts
 *
 * Runs the "Test in Browser" flow in a headed Chromium with fake audio device flags
 * so that Daily.co's setSinkId succeeds and the call-start event fires.
 *
 * SUCCESS = the timer counts past 0:05
 * FAIL    = modal shows "Connection failed" or closes without counting
 *
 * Run: npx tsx scripts/test-browser-call-headed.ts
 */

import { chromium } from "playwright";

async function main() {
  console.log("Launching headed Chromium with fake audio device...");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
      "--allow-file-access-from-files",
    ],
  });

  const context = await browser.newContext({
    permissions: ["microphone"],
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`  [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  console.log("Step 1: Logging in with email/password...");
  await page.goto("https://dropship.barpel.ai/login");
  await page.fill('input[type="email"]', "raphaelusenkposo@gmail.com");
  await page.fill('input[type="password"]', "De260823#");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
  console.log(`  ✅ Landed at: ${page.url()}`);

  console.log("Step 2: Navigating to Integrations...");
  await page.goto("https://dropship.barpel.ai/dashboard/integrations");
  await page.waitForSelector("text=Test in Browser", { timeout: 15000 });
  console.log("  ✅ Integrations page loaded");

  console.log("Step 3: Clicking 'Test in Browser'...");
  await page.click("text=Test in Browser");

  console.log("Step 4: Waiting for modal + call-start (timer counting)...");
  await page.waitForSelector("text=Connecting...", { timeout: 10000 });
  console.log("  ✅ Modal opened — status: Connecting...");

  // Wait for either timer (call-start) or error
  try {
    // The timer shows as "0:00", "0:01", etc — all start with "0:"
    await page.waitForSelector("[class*='mono'], text=/^0:/", { timeout: 20000 });
    const timerText = await page.locator("text=/^0:/").first().textContent();
    console.log(`  ✅ CALL STARTED — timer: ${timerText}`);

    // Wait a few more seconds to confirm it's counting
    await page.waitForTimeout(6000);
    const timerAfter = await page.locator("text=/^0:/").first().textContent().catch(() => null);
    console.log(`  ✅ Timer at 6s: ${timerAfter}`);

    if (timerAfter && timerAfter !== timerText) {
      console.log("\n✅ SUCCESS — browser test call is working. AI is speaking, timer is counting.");
    } else {
      console.log("\n⚠️  Timer not advancing — check audio output");
    }

    // Take screenshot
    await page.screenshot({ path: "scripts/browser-call-result.png", fullPage: false });
    console.log("  📸 Screenshot saved: scripts/browser-call-result.png");

    // End the call
    await page.click("text=End Call").catch(() => page.click("text=Close"));
  } catch {
    // Check if error message appeared
    const errorVisible = await page.locator("text=Connection failed").isVisible().catch(() => false);
    const endedVisible = await page.locator("text=Test call complete").isVisible().catch(() => false);

    await page.screenshot({ path: "scripts/browser-call-result.png", fullPage: false });

    if (errorVisible) {
      console.log("\n❌ FAIL — 'Connection failed' shown. setSinkId likely still failing.");
      console.log("  Check: does your machine have an audio output device?");
    } else if (endedVisible) {
      console.log("\n⚠️  Call ended without counting — AI may not have spoken");
    } else {
      console.log("\n❌ FAIL — timer never appeared within 20s");
    }
    console.log("  📸 Screenshot saved: scripts/browser-call-result.png");
  }

  await page.waitForTimeout(2000);
  await browser.close();
}

main().catch((e) => {
  console.error("Script error:", e.message);
  process.exit(1);
});
