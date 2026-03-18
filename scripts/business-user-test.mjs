#!/usr/bin/env node
/**
 * Business User Journey Test — Production Verification
 * Tests the complete flow: signup → dashboard → settings
 * Run: npx playwright install && node scripts/business-user-test.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://barpel-ai.odia.dev';
const TEST_EMAIL = 'testsprite@barpel-test.com';
const TEST_PASSWORD = 'TestSprite2026!';
const SCREENSHOTS_DIR = './tests/screenshots';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`);
}

class BusinessUserTest {
  constructor() {
    this.results = [];
    this.browser = null;
    this.page = null;
  }

  async setup() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
    this.browser = await chromium.launch({ headless: false, slowMo: 500 });
    this.page = await this.browser.newPage();
  }

  async takeScreenshot(name) {
    const filename = `${SCREENSHOTS_DIR}/${name}.png`;
    await this.page.screenshot({ path: filename });
    log(colors.blue, `  📸 Screenshot: ${filename}`);
  }

  test(name, passed, error = null) {
    this.results.push({ name, passed, error });
    const symbol = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    const msg = error ? ` — ${error}` : '';
    log(color, `${symbol} ${name}${msg}`);
  }

  async testDashboardHome() {
    log(colors.yellow, '\n📊 DASHBOARD HOME');
    try {
      await this.page.goto(`${BASE_URL}/dashboard`, { timeout: 10000 });
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('01-dashboard-home');

      // Check for key elements
      const hasStats = await this.page.$('text=Today') || await this.page.$('text=Calls');
      const hasSidebar = await this.page.$('text=Call Logs') || await this.page.$('text=Settings');

      this.test('Dashboard loads', !!hasStats && !!hasSidebar);
    } catch (err) {
      this.test('Dashboard loads', false, err.message);
    }
  }

  async testCallLogsPage() {
    log(colors.yellow, '\n📞 CALL LOGS');
    try {
      await this.page.click('text=Call Logs');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('02-call-logs');

      const hasSearch = await this.page.$('input[placeholder*="Search"]');
      this.test('Call Logs page loads', !!hasSearch);
    } catch (err) {
      this.test('Call Logs page loads', false, err.message);
    }
  }

  async testVoicePage() {
    log(colors.yellow, '\n🎙️  AI VOICE');
    try {
      await this.page.click('text=AI Voice');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('03-voice');

      const hasGreeting = await this.page.$('textarea');
      this.test('Voice page loads', !!hasGreeting);

      // Test updating greeting
      const textarea = await this.page.$('textarea');
      if (textarea) {
        await textarea.fill('Hello from TestSprite!');
        await this.page.click('button:has-text("Save")');
        await this.page.waitForTimeout(1000);
        const hasToast = await this.page.$('text=saved') || await this.page.$('text=Saved');
        this.test('Can update greeting', !!hasToast);
      }
    } catch (err) {
      this.test('Voice page loads', false, err.message);
    }
  }

  async testIntegrations() {
    log(colors.yellow, '\n🔗 INTEGRATIONS');
    try {
      await this.page.click('text=Integrations');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('04-integrations');

      const hasPhoneLine = await this.page.$('text=+1') || await this.page.$('text=Phone');
      this.test('Integrations page loads', !!hasPhoneLine);
    } catch (err) {
      this.test('Integrations page loads', false, err.message);
    }
  }

  async testBillingPage() {
    log(colors.yellow, '\n💳 BILLING');
    try {
      await this.page.click('text=Billing');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('05-billing');

      const hasBalance = await this.page.$('text=Credit') || await this.page.$('text=Balance');
      const hasPackages = await this.page.$('text=$') || await this.page.$('button:has-text("Buy")');

      this.test('Billing page loads', !!hasBalance);
      this.test('Credit packages visible', !!hasPackages);
    } catch (err) {
      this.test('Billing page loads', false, err.message);
    }
  }

  async testSettingsPage() {
    log(colors.yellow, '\n⚙️  SETTINGS');
    try {
      await this.page.click('text=Settings');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('06-settings-profile');

      // Test business name update
      const nameInput = await this.page.$('input#business-name');
      if (nameInput) {
        await nameInput.fill('TestSprite Updated');
        const saveButton = await this.page.$('button:has-text("Save")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(1000);
          const hasToast = await this.page.$('text=updated') || await this.page.$('text=Saved');
          this.test('Can update business name', !!hasToast);
        }
      } else {
        this.test('Can update business name', false, 'Input not found');
      }

      // Check toggles
      const toggles = await this.page.$$('[role="switch"]');
      this.test('3 notification toggles visible', toggles.length === 3);

      // Check download button
      const downloadBtn = await this.page.$('button:has-text("Download")');
      this.test('Download data button visible', !!downloadBtn);

      // Check delete account modal trigger
      const deleteBtn = await this.page.$('button:has-text("Delete My Account")');
      if (deleteBtn) {
        await deleteBtn.click();
        await this.page.waitForTimeout(500);
        const modal = await this.page.$('text=This cannot be undone');
        this.test('Delete modal opens', !!modal);
        await this.takeScreenshot('07-settings-delete-modal');

        // Close modal
        const cancelBtn = await this.page.$('button:has-text("Cancel")');
        if (cancelBtn) {
          await cancelBtn.click();
        }
      } else {
        this.test('Delete modal opens', false, 'Delete button not found');
      }
    } catch (err) {
      this.test('Settings page loads', false, err.message);
    }
  }

  async testFormValidation() {
    log(colors.yellow, '\n✔️  FORM VALIDATION');
    try {
      // Test empty business name validation
      const nameInput = await this.page.$('input#business-name');
      if (nameInput) {
        await nameInput.fill('');
        const saveButton = await this.page.$('button:has-text("Save")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(500);
          const hasError = await this.page.$('text=must be');
          this.test('Empty name validation works', !!hasError);
        }
      }
    } catch (err) {
      this.test('Empty name validation works', false, err.message);
    }
  }

  async testPasswordReset() {
    log(colors.yellow, '\n🔐 PASSWORD RESET');
    try {
      const resetBtn = await this.page.$('button:has-text("Change password")');
      if (resetBtn) {
        await resetBtn.click();
        await this.page.waitForTimeout(1000);
        const hasToast = await this.page.$('text=email sent') || await this.page.$('text=Email sent');
        this.test('Password reset sends email', !!hasToast);
      } else {
        this.test('Password reset sends email', false, 'Button not found');
      }
    } catch (err) {
      this.test('Password reset sends email', false, err.message);
    }
  }

  async testNavigationSpeed() {
    log(colors.yellow, '\n⚡ PERFORMANCE');
    try {
      const startTime = Date.now();
      await this.page.goto(`${BASE_URL}/dashboard`, { timeout: 10000 });
      await this.page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      const isPerfect = loadTime < 2000;
      const isGood = loadTime < 3000;
      const symbol = isPerfect ? '⚡' : isGood ? '✓' : '⚠️';

      log(colors.blue, `${symbol} Dashboard load time: ${loadTime}ms`);
      this.test('Dashboard loads in <3 seconds', isGood);
    } catch (err) {
      this.test('Dashboard loads in <3 seconds', false, err.message);
    }
  }

  async run() {
    await this.setup();

    log(colors.yellow, '\n' + '='.repeat(70));
    log(colors.yellow, '🚀 BUSINESS USER JOURNEY TEST');
    log(colors.yellow, `🌐 Testing: ${BASE_URL}`);
    log(colors.yellow, '='.repeat(70));

    try {
      // Login
      log(colors.yellow, '\n🔐 LOGIN');
      await this.page.goto(`${BASE_URL}/login`);
      await this.page.fill('input[type="email"]', TEST_EMAIL);
      await this.page.fill('input[type="password"]', TEST_PASSWORD);
      await this.page.click('button:has-text("Sign in")');
      await this.page.waitForURL('**/dashboard', { timeout: 10000 });
      this.test('Login succeeds', true);

      // Run tests
      await this.testDashboardHome();
      await this.testCallLogsPage();
      await this.testVoicePage();
      await this.testIntegrations();
      await this.testBillingPage();
      await this.testSettingsPage();
      await this.testFormValidation();
      await this.testPasswordReset();
      await this.testNavigationSpeed();

    } catch (err) {
      log(colors.red, `\n❌ Test suite error: ${err.message}`);
    } finally {
      await this.browser?.close();
      this.printResults();
    }
  }

  printResults() {
    log(colors.yellow, '\n' + '='.repeat(70));
    log(colors.yellow, '📊 TEST RESULTS');
    log(colors.yellow, '='.repeat(70));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    log(colors.blue, `\nTotal: ${passed}/${total} tests passed`);

    const failed = this.results.filter(r => !r.passed);
    if (failed.length > 0) {
      log(colors.red, '\n❌ Failed Tests:');
      failed.forEach(r => {
        log(colors.red, `  • ${r.name}${r.error ? ' — ' + r.error : ''}`);
      });
    } else {
      log(colors.green, '\n✅ All tests passed!');
    }

    log(colors.blue, `\n📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    log(colors.yellow, '\n' + '='.repeat(70));

    // Write JSON report
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      passed,
      total,
      passRate: Math.round((passed / total) * 100) + '%',
      tests: this.results,
      screenshotsDir: SCREENSHOTS_DIR
    };

    fs.writeFileSync(`${SCREENSHOTS_DIR}/report.json`, JSON.stringify(report, null, 2));
    log(colors.blue, '📄 JSON report saved to: tests/screenshots/report.json');
  }
}

const test = new BusinessUserTest();
await test.run();
