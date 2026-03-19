import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log('⏳ Waiting for you to add the DNS record...\n');
    console.log('📋 TXT Record: google-site-verification=SXrUvIO8J_bUU7p5yEuwPe-4X9CThnaingsqe\n');
    console.log('Steps:');
    console.log('  1. Go to Vercel DNS settings');
    console.log('  2. Add TXT record with value above');
    console.log('  3. Wait 1-5 minutes for propagation');
    console.log('  4. Return here, I\'ll click Verify\n');

    // Go to the verification page
    await page.goto('https://search.google.com/search-console/welcome', {
      waitUntil: 'networkidle',
    });

    // Wait 60 seconds for user to add DNS and return
    console.log('⏳ Waiting 60 seconds...');
    await page.waitForTimeout(60000);

    console.log('🔍 Looking for Verify button...');
    const verifyBtn = page.locator('button:has-text("VERIFY")').first();

    if (await verifyBtn.isVisible().catch(() => false)) {
      console.log('✅ Found Verify button, clicking...');
      await verifyBtn.click();
      await page.waitForTimeout(5000);

      const success = await page.locator('text=verified|success|property', { timeout: 5000 }).isVisible().catch(() => false);
      if (success) {
        console.log('🎉 Domain verified successfully!');
      } else {
        console.log('⏳ Verification in progress...');
      }
    } else {
      console.log('❌ Verify button not found');
    }

    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

run();
