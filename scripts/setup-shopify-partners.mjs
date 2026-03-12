/**
 * Configures Shopify Partners app with localhost redirect URIs.
 * Run: node scripts/setup-shopify-partners.mjs
 *
 * The browser will open visibly. If a CAPTCHA or 2FA appears,
 * complete it manually — the script will wait and continue automatically.
 */

import { chromium } from "playwright";

const GOOGLE_EMAIL = "Info@barpelai.net";
const GOOGLE_PASSWORD = "Barpel@2626";
const APP_URL = "http://localhost:5050";
const REDIRECT_URI = "http://localhost:5050/api/shopify/oauth/callback";
const API_KEY = "29902727b12017553fdd0920962430a5";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForVisible(page, selector, timeout = 60000) {
  await page.waitForSelector(selector, { state: "visible", timeout });
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ["--start-maximized"],
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  // ── Step 1: Go to Shopify Partners login ───────────────────────────────────
  console.log("→ Opening Shopify Partners...");
  await page.goto("https://partners.shopify.com/");
  await sleep(2000);

  // Click "Log in"
  try {
    await page.locator("a", { hasText: /log.?in/i }).first().click({ timeout: 5000 });
    await sleep(2000);
  } catch { /* already on login page */ }

  // ── Step 2: Wait for email input (may take time if Cloudflare is running) ──
  console.log("→ Waiting for login form (may need to solve CAPTCHA)...");
  console.log("   URL:", page.url());

  // Wait up to 60s for either an email input or a Google button to appear
  let emailInputVisible = false;
  let googleBtnVisible = false;

  for (let i = 0; i < 30; i++) {
    emailInputVisible = await page.locator("input[type='email'], input[name='email'], input[id='account_email']").first().isVisible().catch(() => false);
    googleBtnVisible = await page.locator("button, a").filter({ hasText: /continue with google|sign in with google/i }).first().isVisible().catch(() => false);
    if (emailInputVisible || googleBtnVisible) break;
    await sleep(2000);
    if (i % 5 === 0) console.log(`   Still waiting... (${i * 2}s)`);
  }

  if (googleBtnVisible) {
    console.log("→ Clicking 'Continue with Google'...");
    await page.locator("button, a").filter({ hasText: /continue with google|sign in with google/i }).first().click();
    await sleep(3000);
  } else if (emailInputVisible) {
    console.log("→ Filling email...");
    await page.locator("input[type='email'], input[name='email'], input[id='account_email']").first().fill(GOOGLE_EMAIL);
    await page.keyboard.press("Enter");
    await sleep(2000);

    // After email lookup, check for Google option
    const googleOption = await page.locator("button, a").filter({ hasText: /google/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (googleOption) {
      console.log("→ Clicking Google sign-in option...");
      await page.locator("button, a").filter({ hasText: /google/i }).first().click();
      await sleep(3000);
    }
  } else {
    console.log("⚠️  Login form not detected. Please log in manually in the browser.");
    console.log("   Waiting 90 seconds for manual login...");
    await sleep(90000);
  }

  // ── Step 3: Handle Google OAuth ───────────────────────────────────────────
  await sleep(3000);
  if (page.url().includes("accounts.google.com")) {
    console.log("→ On Google sign-in. Filling credentials...");

    // Email
    try {
      await page.locator("input[type='email']").fill(GOOGLE_EMAIL, { timeout: 15000 });
      await page.getByRole("button", { name: /next/i }).click();
      await sleep(3000);
    } catch (e) {
      console.log("   Google email step:", e.message);
    }

    // Password
    try {
      await page.locator("input[type='password']").fill(GOOGLE_PASSWORD, { timeout: 15000 });
      await page.getByRole("button", { name: /next/i }).click();
      await sleep(5000);
    } catch (e) {
      console.log("   Google password step:", e.message);
    }

    // 2FA — wait for manual completion if needed
    if (page.url().includes("accounts.google.com")) {
      console.log("⚠️  Google 2FA may be required. Please complete it manually.");
      console.log("   Waiting 60 seconds...");
      await sleep(60000);
    }
  }

  // ── Step 4: Wait for Partners dashboard ───────────────────────────────────
  console.log("→ Waiting for Partners dashboard...");
  for (let i = 0; i < 30; i++) {
    if (page.url().includes("partners.shopify.com") && !page.url().includes("accounts.")) break;
    await sleep(2000);
    if (i % 5 === 0) console.log(`   Waiting for redirect... (${i * 2}s) URL: ${page.url()}`);
  }
  console.log("→ Current URL:", page.url());
  await page.screenshot({ path: "scripts/after-login.png" });
  console.log("→ Screenshot: scripts/after-login.png");

  // Extract partner ID
  const partnerMatch = page.url().match(/partners\.shopify\.com\/(\d+)/);
  const partnerId = partnerMatch?.[1];
  console.log("→ Partner ID:", partnerId ?? "not found");

  // ── Step 5: Go to apps list ────────────────────────────────────────────────
  const appsUrl = partnerId
    ? `https://partners.shopify.com/${partnerId}/apps`
    : "https://partners.shopify.com/apps";
  console.log("→ Navigating to:", appsUrl);
  await page.goto(appsUrl);
  await sleep(3000);
  await page.screenshot({ path: "scripts/apps-list.png" });
  console.log("→ Screenshot: scripts/apps-list.png");

  // ── Step 6: Find the app ───────────────────────────────────────────────────
  console.log("→ Scanning app list for API key:", API_KEY);
  const links = await page.locator("a[href*='/apps/']").evaluateAll(els =>
    els.map(el => ({ href: el.getAttribute("href"), text: el.innerText?.trim() }))
  );
  console.log("→ App links found:", links.length);

  let appBase = null;
  for (const { href, text } of links) {
    if (!href || href.endsWith("/apps/") || href.includes("create") || href.includes("new")) continue;
    const fullBase = (href.startsWith("http") ? "" : "https://partners.shopify.com") + href.replace(/\/(overview|dashboard|configuration).*$/, "");

    console.log(`   Checking: ${text?.substring(0, 40)} → ${fullBase}`);
    await page.goto(fullBase + "/overview");
    await sleep(2000);
    const content = await page.content();
    if (content.includes(API_KEY)) {
      console.log("✅ Found our app!");
      appBase = fullBase;
      break;
    }
  }

  if (!appBase) {
    console.log("⚠️  Could not auto-find app. Browser will stay open for 2 minutes.");
    console.log("    Manually navigate to your app's Configuration page.");
    await sleep(120000);
    await browser.close();
    return;
  }

  // ── Step 7: Configuration page ────────────────────────────────────────────
  const configUrl = appBase + "/configuration";
  console.log("→ Going to configuration:", configUrl);
  await page.goto(configUrl);
  await sleep(3000);
  await page.screenshot({ path: "scripts/config-before.png" });
  console.log("→ Screenshot: scripts/config-before.png");

  // Dump all inputs & textareas for debugging
  const allFields = await page.locator("input[type='text'], input[type='url'], textarea").all();
  console.log("→ Fields on config page:", allFields.length);
  for (const f of allFields) {
    const info = await f.evaluate(el => ({
      tag: el.tagName, name: el.name, id: el.id,
      placeholder: el.placeholder, value: el.value?.substring(0, 60)
    }));
    console.log("  ", info);
  }

  // ── Step 8: Set App URL ────────────────────────────────────────────────────
  // Look for field containing a URL or near "App URL" label
  for (const f of allFields) {
    const val = await f.inputValue().catch(() => "");
    const attrs = await f.evaluate(el => ({
      name: el.name?.toLowerCase(), id: el.id?.toLowerCase(),
      placeholder: el.placeholder?.toLowerCase()
    }));
    const isAppUrl = attrs.name?.includes("app_url") || attrs.id?.includes("app_url") ||
                     attrs.placeholder?.includes("app url") || attrs.placeholder?.includes("https://");
    if (isAppUrl || val.includes("http")) {
      console.log("→ Setting App URL field to:", APP_URL);
      await f.clear();
      await f.fill(APP_URL);
      break;
    }
  }

  // ── Step 9: Set Redirect URI ───────────────────────────────────────────────
  for (const f of allFields) {
    const attrs = await f.evaluate(el => ({
      name: el.name?.toLowerCase(), id: el.id?.toLowerCase(),
      placeholder: el.placeholder?.toLowerCase(), tag: el.tagName
    }));
    const isRedirect = attrs.name?.includes("redirect") || attrs.id?.includes("redirect") ||
                       attrs.placeholder?.includes("redirect") || attrs.tag === "TEXTAREA";
    if (isRedirect) {
      const existing = await f.inputValue().catch(() => "");
      if (!existing.includes(REDIRECT_URI)) {
        const newVal = existing ? existing.trimEnd() + "\n" + REDIRECT_URI : REDIRECT_URI;
        await f.clear();
        await f.fill(newVal);
        console.log("→ Added redirect URI:", REDIRECT_URI);
      } else {
        console.log("→ Redirect URI already present!");
      }
      break;
    }
  }

  // ── Step 10: Save ─────────────────────────────────────────────────────────
  const saveBtn = page.locator("button").filter({ hasText: /^save/i }).first();
  if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await saveBtn.click();
    await sleep(3000);
    console.log("✅ Saved!");
  } else {
    console.log("⚠️  Save button not found. Waiting 60s for manual save...");
    await sleep(60000);
  }

  await page.screenshot({ path: "scripts/config-done.png" });
  console.log("→ Screenshot: scripts/config-done.png");
  await sleep(3000);
  await browser.close();
  console.log("✅ All done!");
})();
