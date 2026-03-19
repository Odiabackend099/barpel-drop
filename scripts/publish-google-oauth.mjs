import { chromium } from 'playwright';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_ID = 'powerful-hall-490617-i2';
const BRANDING_URL = `https://console.cloud.google.com/auth/branding?project=${PROJECT_ID}`;
const AUDIENCE_URL = `https://console.cloud.google.com/auth/audience?project=${PROJECT_ID}`;
const CHROME_PROFILE = join(homedir(), 'Library/Application Support/Google/Chrome');

// Values to fill in
const CONFIG = {
  appName: 'Barpel Drop AI',
  supportEmail: 'austynodia@gmail.com',
  homepageUrl: 'https://dropship.barpel.ai',
  privacyPolicyUrl: 'https://dropship.barpel.ai/legal/privacy',
  termsUrl: 'https://dropship.barpel.ai/legal/terms',
  authorizedDomain: 'barpel.ai',
};

async function run() {
  console.log('🚀 Launching Chrome in headed mode...\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: [
      '--disable-sync',
      '--disable-blink-features=AutomationControlled',
    ],
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  try {
    // ── Step 1: Fill in branding/consent screen fields ──────────────────────
    console.log('📝 Step 1: Navigating to OAuth Branding page...');
    await page.goto(BRANDING_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'tests/screenshots/oauth-1-branding-before.png', fullPage: true });
    console.log('   ✓ Branding page loaded (screenshot: oauth-1-branding-before.png)');

    // Fill app name if empty
    const appNameInput = page.getByLabel(/app name/i).first();
    if (await appNameInput.isVisible().catch(() => false)) {
      await appNameInput.clear();
      await appNameInput.fill(CONFIG.appName);
      console.log(`   ✅ App name: "${CONFIG.appName}"`);
    }

    // Fill homepage URL
    const homepageInput = page.getByLabel(/home page/i).or(page.getByPlaceholder(/homepage/i)).first();
    if (await homepageInput.isVisible().catch(() => false)) {
      await homepageInput.clear();
      await homepageInput.fill(CONFIG.homepageUrl);
      console.log(`   ✅ Homepage URL: "${CONFIG.homepageUrl}"`);
    }

    // Fill privacy policy URL
    const privacyInput = page.getByLabel(/privacy policy/i).first();
    if (await privacyInput.isVisible().catch(() => false)) {
      await privacyInput.clear();
      await privacyInput.fill(CONFIG.privacyPolicyUrl);
      console.log(`   ✅ Privacy policy URL: "${CONFIG.privacyPolicyUrl}"`);
    }

    // Fill terms of service URL
    const termsInput = page.getByLabel(/terms of service/i).first();
    if (await termsInput.isVisible().catch(() => false)) {
      await termsInput.clear();
      await termsInput.fill(CONFIG.termsUrl);
      console.log(`   ✅ Terms of service URL: "${CONFIG.termsUrl}"`);
    }

    // Save branding changes
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Branding changes saved');
    }

    await page.screenshot({ path: 'tests/screenshots/oauth-2-branding-after.png', fullPage: true });
    console.log('   ✓ Screenshot: oauth-2-branding-after.png\n');

    // ── Step 2: Publish the app ──────────────────────────────────────────────
    console.log('🚀 Step 2: Navigating to Audience (Publish) page...');
    await page.goto(AUDIENCE_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'tests/screenshots/oauth-3-audience-before.png', fullPage: true });
    console.log('   ✓ Audience page loaded (screenshot: oauth-3-audience-before.png)');

    const publishBtn = page.getByRole('button', { name: /publish app/i })
      .or(page.getByText(/publish app/i).first());

    const btnVisible = await publishBtn.isVisible().catch(() => false);
    if (!btnVisible) {
      const alreadyPublished = await page.getByText(/in production/i).isVisible().catch(() => false);
      if (alreadyPublished) {
        console.log('\n✅ App is already IN PRODUCTION — nothing to do!');
      } else {
        console.log('\n⚠️  "Publish App" button not found.');
        console.log('   → Check the browser window manually');
        console.log('   → You may need to verify the domain first in Google Search Console');
        console.log('\n   Keeping browser open for 20 seconds...');
        await page.waitForTimeout(20000);
      }
      await browser.close();
      return;
    }

    console.log('   → Found "Publish App" button, clicking...');
    await publishBtn.click();
    await page.waitForTimeout(2000);

    // Confirm dialog
    const confirmBtn = page.getByRole('button', { name: /confirm/i })
      .or(page.getByRole('button', { name: /push to production/i }));

    if (await confirmBtn.isVisible().catch(() => false)) {
      console.log('   → Confirmation dialog appeared, confirming...');
      await confirmBtn.click();
      await page.waitForTimeout(4000);
    }

    await page.screenshot({ path: 'tests/screenshots/oauth-4-published.png', fullPage: true });
    console.log('   ✓ Screenshot: oauth-4-published.png\n');

    const inProduction = await page.getByText(/in production/i).isVisible().catch(() => false);
    if (inProduction) {
      console.log('✅ SUCCESS — App is now IN PRODUCTION!');
      console.log('   Any Google Account user can now sign in to Barpel Drop AI.');
      console.log('\nNext steps:');
      console.log('   1. Verify domain in Google Search Console (if not already done)');
      console.log('   2. Test: https://dropship.barpel.ai/login → "Continue with Google"');
      console.log('   3. Sign in with any Google account\n');
    } else {
      console.log('⚠️  Could not confirm "In production" status.');
      console.log('   Check oauth-4-published.png for the current state.\n');
    }

    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

run();
