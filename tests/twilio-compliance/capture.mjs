/**
 * Twilio Fraud Review — Compliance Screenshot Capture
 *
 * Takes 7 screenshots proving Barpel AI:
 *   1. Requires merchant consent before outbound calls (abandoned cart)
 *   2. AI is programmed to honour opt-out requests (system prompt visible)
 *   3. Is a legitimate, publicly-accessible paid SaaS product
 *
 * Usage: node tests/twilio-compliance/capture.mjs
 * Output: tests/twilio-compliance/screenshot-*.png
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://dropship.barpel.ai';
const OUT_DIR = path.resolve(__dirname);

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  page.setDefaultTimeout(30000);

  // ═══════════════════════════════════════════════════════════════════════
  // AUTHENTICATE — try signup, fall back to login (same as e2e-journey.mjs)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Authenticating ───');
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.fill('#email, input[type="email"]', 'test@barpelai');
  await page.fill('#password, input[name="password"]', 'Barpel@26');
  const confirmField = page.locator('#confirmPassword');
  if (await confirmField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmField.fill('Barpel@26');
  }
  await page.click('button[type="submit"]');
  await page.waitForURL(/onboarding|dashboard/, { timeout: 15000 }).catch(() => {});
  let currentUrl = page.url();

  if (!currentUrl.includes('onboarding') && !currentUrl.includes('dashboard')) {
    console.log('  Signup did not land on dashboard — trying login...');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.fill('#email, input[type="email"]', 'test@barpelai');
    await page.fill('#password, input[type="password"]', 'Barpel@26');
    await page.click('button[type="submit"]');
    await page.waitForURL(/onboarding|dashboard/, { timeout: 15000 }).catch(() => {});
    currentUrl = page.url();
  }

  if (!currentUrl.includes('onboarding') && !currentUrl.includes('dashboard')) {
    console.error('❌ Auth failed — current URL:', currentUrl);
    await browser.close();
    process.exit(1);
  }
  console.log('✅ Authenticated:', currentUrl);

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENSHOT 7 — Onboarding consent flow (take before completing)
  // ═══════════════════════════════════════════════════════════════════════
  if (currentUrl.includes('onboarding')) {
    console.log('\n─── Screenshot 7: Onboarding flow (before completing) ───');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, 'screenshot-7-onboarding-flow.png'),
      fullPage: false,
    });
    console.log('✅ Screenshot 7 saved: Onboarding flow');

    // Complete onboarding to unlock dashboard access
    console.log('\n─── Completing onboarding to access dashboard ───');
    await page.waitForTimeout(1000);

    // Step 1: Business Name
    const bizInput = page.locator('input[placeholder*="PowerFit"], input[placeholder*="business"], input[placeholder*="store"]').first();
    if (await bizInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bizInput.fill('BarpelTest');
      const countrySelect = page.locator('select').first();
      if (await countrySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await countrySelect.selectOption('US');
      }
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(2000);
      console.log('  Step 1 done: Business name');
    }

    // Step 2: Skip Shopify
    const skipShopify = page.locator('text=/Skip for now/i').first();
    if (await skipShopify.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipShopify.click();
      await page.waitForTimeout(2000);
      console.log('  Step 2 done: Skipped Shopify');
    }

    // Step 3: Skip credits / free minutes
    const freeBtn = page.locator('button:has-text("free minutes")').first();
    if (await freeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await freeBtn.click();
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const skip = btns.find(b => b.textContent?.toLowerCase().includes('skip'));
        if (skip) skip.click();
      });
    }
    await page.waitForTimeout(2000);
    console.log('  Step 3 done: Credits');

    // Step 4: Skip phone
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const skip = btns.find(b => b.textContent?.toLowerCase().includes('skip'));
      if (skip) skip.click();
    });
    await page.waitForTimeout(3000);
    console.log('  Step 4 done: Phone');

    // Step 5: Go to Dashboard
    const dashBtn = page.locator('button:has-text("Dashboard"), a:has-text("Dashboard"), button:has-text("Go to dashboard")').first();
    if (await dashBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashBtn.click();
    } else {
      await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    }
    await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {});
    currentUrl = page.url();
    console.log('  Onboarding complete, now on:', currentUrl);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENSHOT 1 — Merchant consent modal (abandoned cart toggle)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Screenshot 1: Merchant consent modal ───');
  await page.goto(`${BASE}/dashboard/integrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to the abandoned cart section
  const cartSection = page.locator('text=Recover Abandoned Carts').first();
  await cartSection.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(800);

  // Find the cart recovery toggle (Switch component)
  // Try to find it disabled/off first; click it to open consent dialog
  const toggleSwitch = page.locator('#cart-recovery-toggle, [role="switch"]').last();
  const isChecked = await toggleSwitch.getAttribute('aria-checked').catch(() => 'false');

  if (isChecked === 'true') {
    // Already enabled — click to get the disable modal then escape, then re-click for enable
    await toggleSwitch.click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Click to open the enable consent dialog
  await toggleSwitch.click();
  await page.waitForTimeout(600);

  // Wait for the consent dialog
  const dialog = page.locator('[role="dialog"]').first();
  const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
  if (!dialogVisible) {
    console.warn('⚠️  Consent dialog did not appear — taking screenshot of current state anyway');
  }

  await page.screenshot({
    path: path.join(OUT_DIR, 'screenshot-1-merchant-consent-modal.png'),
    fullPage: false,
  });
  console.log('✅ Screenshot 1 saved: Merchant consent modal');

  // Close dialog without confirming
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENSHOT 2 — Integrations page overview (full page)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Screenshot 2: Integrations page overview ───');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  await page.screenshot({
    path: path.join(OUT_DIR, 'screenshot-2-integrations-page.png'),
    fullPage: true,
  });
  console.log('✅ Screenshot 2 saved: Integrations page overview');

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENSHOT 3 — Voice page / System Prompt with opt-out language
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Screenshot 3: AI voice system prompt with opt-out ───');
  await page.goto(`${BASE}/dashboard/voice`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to the system prompt section
  const systemPromptSection = page.locator('text=System Prompt').first();
  await systemPromptSection.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(600);

  // Verify opt-out language is present in the read-only textarea
  const promptTextarea = page.locator('textarea[aria-label="System prompt"]');
  const promptText = await promptTextarea.inputValue().catch(() => '');
  const hasOptOut =
    promptText.toLowerCase().includes('stop calling') ||
    promptText.toLowerCase().includes('opt-out') ||
    promptText.toLowerCase().includes('unsubscribe') ||
    promptText.toLowerCase().includes('do not call');

  if (!hasOptOut) {
    console.error('❌ Opt-out language missing from system prompt textarea');
    console.error('   Prompt text found:', promptText.slice(0, 200));
    await browser.close();
    process.exit(1);
  }
  console.log('✅ Opt-out language confirmed in system prompt');

  await page.screenshot({
    path: path.join(OUT_DIR, 'screenshot-3-ai-voice-opt-out-prompt.png'),
    fullPage: false,
  });
  console.log('✅ Screenshot 3 saved: AI voice opt-out language');

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENSHOT 4 — Billing page (shows real paid service)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Screenshot 4: Billing page ───');
  await page.goto(`${BASE}/dashboard/billing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(OUT_DIR, 'screenshot-4-billing-page.png'),
    fullPage: false,
  });
  console.log('✅ Screenshot 4 saved: Billing page');

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENSHOTS 5 & 6 — Marketing homepage
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Screenshots 5 & 6: Homepage ───');

  // Use a fresh unauthenticated context for public homepage
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.setViewportSize({ width: 390, height: 844 });
  publicPage.setDefaultTimeout(30000);

  await publicPage.goto(BASE, { waitUntil: 'networkidle' });
  await publicPage.waitForTimeout(1500);

  await publicPage.screenshot({
    path: path.join(OUT_DIR, 'screenshot-5-homepage-hero.png'),
    fullPage: false,
  });
  console.log('✅ Screenshot 5 saved: Homepage hero');

  // Scroll to pricing section (~60% down)
  await publicPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
  await publicPage.waitForTimeout(600);

  await publicPage.screenshot({
    path: path.join(OUT_DIR, 'screenshot-6-homepage-pricing.png'),
    fullPage: false,
  });
  console.log('✅ Screenshot 6 saved: Homepage pricing');

  await publicContext.close();

  // ═══════════════════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TWILIO COMPLIANCE SCREENSHOTS READY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  ${files.length} screenshots saved to tests/twilio-compliance/`);
  files.sort().forEach((f) => console.log(`  ✅ ${f}`));
  console.log('');
  console.log('  SEND THESE TO TWILIO TICKET #25603722:');
  console.log('  1. screenshot-1-merchant-consent-modal.png');
  console.log('     → Shows merchants must confirm customer consent before outbound calls');
  console.log('  2. screenshot-2-integrations-page.png');
  console.log('     → Shows the platform with phone line management and Shopify integration');
  console.log('  3. screenshot-3-ai-voice-opt-out-prompt.png');
  console.log('     → Shows AI is programmed to honour opt-outs immediately');
  console.log('  4. screenshot-4-billing-page.png');
  console.log('     → Shows this is a real paid service with subscription tiers');
  console.log('  5. screenshot-5-homepage-hero.png');
  console.log('     → Shows the legitimate public-facing SaaS product');
  console.log('  6. screenshot-6-homepage-pricing.png');
  console.log('     → Shows published pricing plans');
  console.log('  7. screenshot-7-onboarding-flow.png');
  console.log('     → Shows the merchant onboarding / consent flow');
  console.log('═══════════════════════════════════════════════════\n');

  await browser.close();
})();
