/**
 * Record a demo video of the complete Barpel Drop AI onboarding experience.
 *
 * Usage:  npx tsx scripts/record-demo.mts
 * Output: videos/barpel-demo.webm
 *
 * Two manual pauses:
 *   1. Shopify login — type your password, approve the app, press ENTER
 *   2. Browser voice test — speak to the AI, press ENTER
 *
 * Convert to MP4:
 *   ffmpeg -i videos/barpel-demo.webm -c:v libx264 -preset slow -crf 22 \
 *     -c:a aac -b:a 128k -movflags +faststart videos/barpel-demo.mp4
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as readline from "readline";

// ── Timing constants ────────────────────────────────────────────────────────
const READING_PAUSE = 3000; // let viewer read content
const TRANSITION_PAUSE = 1500; // between UI transitions
const SHORT_PAUSE = 800; // between small actions
const SCROLL_PAUSE = 2000; // between scroll segments

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Block until the user presses ENTER in the terminal. */
function waitForEnter(prompt: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

if (!fs.existsSync("videos")) fs.mkdirSync("videos");

const browser = await chromium.launch({
  headless: false,
  slowMo: 500,
  args: ["--window-size=1280,800"],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: {
    dir: "videos/",
    size: { width: 1280, height: 800 },
  },
});

const page = await context.newPage();

try {
  // ── SCENE 1: Landing page ──────────────────────────────────────────────
  await page.goto("https://dropship.barpel.ai");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(READING_PAUSE);

  // Smooth scroll down to show features and pricing
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await page.waitForTimeout(SCROLL_PAUSE);
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(TRANSITION_PAUSE);

  // Click "Get started free" CTA
  await page.click('a:has-text("Get started free")');
  await page.waitForURL(/signup/, { timeout: 10000 });
  await page.waitForTimeout(TRANSITION_PAUSE);

  // ── SCENE 2: Sign up (email + password + confirm password) ─────────────
  const email = `demo.merchant.${Date.now()}@test.com`;
  await page.fill('input[type="email"]', email);
  await page.waitForTimeout(SHORT_PAUSE);

  // Signup form has two password fields: password + confirm password
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill("Demo2026!");
  await page.waitForTimeout(SHORT_PAUSE);
  await passwordInputs.nth(1).fill("Demo2026!");
  await page.waitForTimeout(SHORT_PAUSE);

  await page.click('button[type="submit"]');
  await page.waitForURL(/onboarding/, { timeout: 15000 });
  await page.waitForTimeout(SCROLL_PAUSE);

  // ── SCENE 3: Step 1 — Business name ────────────────────────────────────
  await page.fill('input[placeholder="e.g. PowerFit Gadgets"]', "OdiaDev Store");
  await page.waitForTimeout(TRANSITION_PAUSE);

  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(SCROLL_PAUSE);

  // ── SCENE 4: Step 2 — Connect Shopify ──────────────────────────────────
  // Wait for the Shopify connection step to render
  await page.locator('text=Connect Your Shopify Store').waitFor({ timeout: 10000 });
  await page.waitForTimeout(SCROLL_PAUSE);

  // Fill store domain
  await page.fill('input[placeholder="your-store.myshopify.com"]', "odiadev.myshopify.com");
  await page.waitForTimeout(TRANSITION_PAUSE);

  await page.click('button:has-text("Connect My Shopify Store")');

  // Wait for Shopify OAuth redirect
  await page.waitForURL(/shopify\.com/, { timeout: 15000 });
  await page.waitForTimeout(SCROLL_PAUSE);

  // PAUSE — user logs into Shopify manually
  console.log("");
  console.log("════════════════════════════════════════════════════════");
  console.log("  VIDEO IS RECORDING — DO NOT CLOSE THE BROWSER");
  console.log("");
  console.log("  ACTION REQUIRED:");
  console.log("  1. In the browser — log into your Shopify account");
  console.log("  2. Click 'Install' to approve Barpel Drop AI");
  console.log("  3. You will be redirected back to Barpel automatically");
  console.log("════════════════════════════════════════════════════════");

  await waitForEnter("\nPress ENTER after you are back on the Barpel page... ");

  // Back on Barpel — wait for page to settle
  await page.waitForURL(/dropship\.barpel\.ai/, { timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(READING_PAUSE);

  // ── SCENE 5: Step 3 — Credits ──────────────────────────────────────────
  // The credits step shows pricing or free-credits option
  await page.waitForTimeout(SCROLL_PAUSE);

  // Click free credits button (partial text match)
  const freeCreditsBtn = page.locator('button:has-text("free")').first();
  if (await freeCreditsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await freeCreditsBtn.click();
    await page.waitForTimeout(SCROLL_PAUSE);
  }

  // ── SCENE 6: Step 4 — Provision AI Number ──────────────────────────────
  const provisionBtn = page.locator('button:has-text("Get My AI Number")');
  if (await provisionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await provisionBtn.click();
    await page.waitForTimeout(SCROLL_PAUSE);

    console.log("  Provisioning AI number — recording continues...");

    // Wait for phone number to appear (up to 90s)
    try {
      await page.waitForFunction(
        () =>
          document.body.innerText.match(/\+1[\s\d\-()]{10,}/) ||
          document.body.innerText.includes("\u{1F389}"),
        { timeout: 90000 }
      );
    } catch {
      console.log("  Provisioning timed out — continuing with recording...");
    }
    await page.waitForTimeout(READING_PAUSE);
  }

  // ── SCENE 7: Step 5 — Call Forwarding ──────────────────────────────────
  // The page may auto-advance to step 5
  await page.waitForTimeout(SCROLL_PAUSE);

  // Try to interact with forwarding country dropdown
  const fwdSelect = page.locator("select").first();
  if (await fwdSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fwdSelect.selectOption("US");
    await page.waitForTimeout(TRANSITION_PAUSE);

    const carrierSelect = page.locator("select").nth(1);
    if (await carrierSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await carrierSelect.selectOption({ index: 1 });
      await page.waitForTimeout(TRANSITION_PAUSE);
    }
  }
  await page.waitForTimeout(SCROLL_PAUSE);

  // Navigate to dashboard
  const dashBtn = page
    .locator('button:has-text("Go to Dashboard")')
    .or(page.locator('button:has-text("Go to My Dashboard")'))
    .first();
  if (await dashBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dashBtn.click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(READING_PAUSE);
  }

  // ── SCENE 8: Dashboard tour ────────────────────────────────────────────
  const navItems = ["Call Logs", "Integrations", "AI Voice", "Billing"];
  for (const item of navItems) {
    const link = page.locator(`a:has-text("${item}")`).first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(READING_PAUSE);
    }
  }

  // Back to Integrations for the finale
  const integrationsLink = page.locator('a:has-text("Integrations")').first();
  if (await integrationsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await integrationsLink.click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(READING_PAUSE);
  }

  // ── SCENE 9: Test in Browser — the money shot ─────────────────────────
  const testBtn = page.locator('button:has-text("Test in Browser")');
  if (await testBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await testBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "videos/final-frame.png" });

    console.log("");
    console.log("════════════════════════════════════════════════════════");
    console.log("  AI IS ACTIVE IN BROWSER");
    console.log("  Speak to the AI — this is being recorded");
    console.log('  Say "Where is my order" and give order number 1001');
    console.log("════════════════════════════════════════════════════════");

    await waitForEnter("\nPress ENTER when you are done with the call... ");

    // End call gracefully
    const endBtn = page.locator('button:has-text("End")').or(page.locator('button:has-text("Hang up")'));
    if (await endBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await endBtn.first().click();
    }
    await page.waitForTimeout(READING_PAUSE);
  }
} finally {
  // ── SAVE VIDEO ──────────────────────────────────────────────────────────
  // Playwright only flushes the video buffer when the context is closed.
  // Closing the browser directly results in a corrupted/empty video file.
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (videoPath && fs.existsSync(videoPath)) {
    const finalPath = "videos/barpel-demo.webm";
    fs.renameSync(videoPath, finalPath);
    const sizeMB = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(1);

    console.log("");
    console.log("════════════════════════════════════════════════════════");
    console.log(`  VIDEO SAVED: ${finalPath}`);
    console.log(`  File size: ${sizeMB} MB`);
    console.log("");
    console.log("  To convert to MP4:");
    console.log("  ffmpeg -i videos/barpel-demo.webm \\");
    console.log("    -c:v libx264 -preset slow -crf 22 \\");
    console.log("    -c:a aac -b:a 128k -movflags +faststart \\");
    console.log("    videos/barpel-demo.mp4");
    console.log("════════════════════════════════════════════════════════");
  } else {
    console.error("  Video file not found — recording may have failed.");
  }
}
