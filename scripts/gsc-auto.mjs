import { chromium } from 'playwright';

const DOMAIN = 'dropship.barpel.ai';

async function run() {
  // Connect to existing Chrome instance via debugging port
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const pages = await browser.contexts()[0].pages();
  const page = pages[0];

  try {
    console.log('🌐 Clicking Domain option...');
    const domainCard = page.locator('text=Domain').first();
    await domainCard.click();
    await page.waitForTimeout(1500);

    console.log(`📝 Entering domain: ${DOMAIN}`);
    const input = page.locator('input[placeholder*="domain"]').first();
    await input.fill(DOMAIN);
    await page.waitForTimeout(500);

    console.log('▶️  Clicking Continue...');
    const continueBtn = page.locator('button:has-text("CONTINUE")').first();
    await continueBtn.click();
    await page.waitForTimeout(3000);

    console.log('✅ Done! Check browser for DNS record.');
    console.log('Add the TXT record to your DNS, then click Verify.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
