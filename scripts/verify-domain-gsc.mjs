import { chromium } from 'playwright';

const DOMAIN = 'dropship.barpel.ai';
const EMAIL = 'info@barpelai.net';
const PASSWORD = 'Barpel@2626';

async function run() {
  console.log('🚀 Launching Chrome for Google Search Console domain verification...\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-sync'],
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  try {
    // ── Step 1: Navigate to Google Search Console ──────────────────────────
    console.log('📍 Step 1: Navigating to Google Search Console...');
    await page.goto('https://search.google.com/search-console/welcome', {
      waitUntil: 'networkidle',
      timeout: 45000,
    });
    await page.waitForTimeout(2000);

    // ── Step 2: Click "Add property" or similar button ──────────────────────
    console.log('➕ Step 2: Looking for "Add property" button...');
    const addPropertyBtn = page.getByRole('button', { name: /add property/i })
      .or(page.getByText(/add property/i).first());

    if (await addPropertyBtn.isVisible().catch(() => false)) {
      console.log('   Clicking "Add property"...');
      await addPropertyBtn.click();
      await page.waitForTimeout(2000);
    }

    // ── Step 3: Select Domain option ───────────────────────────────────────
    console.log('🌐 Step 3: Selecting Domain verification type...');
    const domainRadio = page.getByLabel(/domain/i).first();
    if (await domainRadio.isVisible().catch(() => false)) {
      await domainRadio.click();
      console.log('   ✓ Domain option selected');
      await page.waitForTimeout(1000);
    }

    // ── Step 4: Enter domain name ──────────────────────────────────────────
    console.log(`📝 Step 4: Entering domain: ${DOMAIN}`);
    const domainInput = page.getByPlaceholder(/enter domain/i)
      .or(page.locator('input[type="text"]').first());

    if (await domainInput.isVisible().catch(() => false)) {
      await domainInput.fill(DOMAIN);
      console.log(`   ✓ Domain entered: ${DOMAIN}`);
      await page.waitForTimeout(1000);
    }

    // ── Step 5: Click Continue ─────────────────────────────────────────────
    console.log('▶️  Step 5: Clicking Continue...');
    const continueBtn = page.getByRole('button', { name: /continue/i })
      .or(page.getByRole('button', { name: /next/i })).first();

    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Clicked Continue');
    }

    // ── Step 6: Get DNS TXT record ─────────────────────────────────────────
    console.log('🔑 Step 6: Getting DNS TXT record...');
    await page.screenshot({ path: 'tests/screenshots/gsc-dns-record.png', fullPage: true });

    // Try to find and copy the DNS record value
    const dnsRecord = await page.locator('code, [data-clipboard], .copyable').first().textContent().catch(() => null);

    if (dnsRecord) {
      console.log(`\n📋 DNS TXT Record to add:\n${dnsRecord}\n`);
    } else {
      console.log('\n📋 Check the screenshot (gsc-dns-record.png) for the DNS TXT record.\n');
    }

    console.log('✅ DNS record verification step shown.');
    console.log('\n⏳ Next steps:');
    console.log('   1. Add the DNS TXT record to your domain registrar (Vercel DNS)');
    console.log('   2. Wait 1-5 minutes for DNS to propagate');
    console.log('   3. Click "Verify" button in the browser');
    console.log('   4. Once verified, the "Publish App" button will be enabled\n');

    // Keep browser open for manual verification
    console.log('Keeping browser open for 5 minutes while you add the DNS record...');
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

run();
