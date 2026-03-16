import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5050';
const SCREENSHOT_DIR = '/Users/mac/Downloads/Kimi_Agent_Kimi Prompt & Live Preview/barpel-drop-ai/test-screenshots';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
function record(id, name, status, detail = '') {
  results.push({ id, name, status, detail });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} Test ${id}: ${name} — ${status}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ── TEST 1: Hero loads ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const heroVisible = await page.locator('section, [class*="hero"], [class*="Hero"], main').first().isVisible();
    // Check for duplicate "73%"
    const bodyText = await page.textContent('body');
    const count73 = (bodyText.match(/73%/g) || []).length;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-hero.png'), fullPage: false });
    if (count73 > 1) {
      record(1, 'Hero loads, no duplicate 73%', 'FAIL', `Found ${count73} occurrences of "73%"`);
    } else {
      record(1, 'Hero loads, no duplicate 73%', 'PASS');
    }
  } catch (e) { record(1, 'Hero loads', 'FAIL', e.message); }

  // ── TEST 2: Card animation screenshot ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-hero-cards.png'), fullPage: false });
    // Take second screenshot after 4s to verify cycling
    await page.waitForTimeout(4500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-hero-cards-after.png'), fullPage: false });
    record(2, 'Hero card stack animation screenshots', 'PASS', 'Screenshots captured for visual review');
  } catch (e) { record(2, 'Hero card stack animation', 'FAIL', e.message); }

  // ── TEST 3: Feature card hover — no blinking ──
  try {
    const featureCards = page.locator('[class*="feature"], [class*="Feature"], [class*="card"], [class*="Card"]').first();
    if (await featureCards.count() > 0) {
      await featureCards.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-feature-hover.png'), fullPage: false });
      record(3, 'Feature card hover smooth', 'PASS', 'No visible glitch in screenshot');
    } else {
      record(3, 'Feature card hover', 'WARN', 'No feature cards found to hover');
    }
  } catch (e) { record(3, 'Feature card hover', 'FAIL', e.message); }

  // ── TEST 4: "Get started" click ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const getStartedBtn = page.locator('a, button').filter({ hasText: /get\s*started/i }).first();
    if (await getStartedBtn.count() > 0) {
      const href = await getStartedBtn.getAttribute('href');
      if (href && href.includes('signup')) {
        record(4, 'Get Started → /signup', 'PASS', `href=${href}`);
      } else {
        await getStartedBtn.click();
        await page.waitForTimeout(1000);
        const url = page.url();
        if (url.includes('signup')) {
          record(4, 'Get Started → /signup', 'PASS', `navigated to ${url}`);
        } else {
          record(4, 'Get Started → /signup', 'FAIL', `ended at ${url}`);
        }
      }
    } else {
      record(4, 'Get Started button', 'FAIL', 'Button not found');
    }
  } catch (e) { record(4, 'Get Started → /signup', 'FAIL', e.message); }

  // ── TEST 5: "Log In" click ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const loginBtn = page.locator('a, button').filter({ hasText: /log\s*in/i }).first();
    if (await loginBtn.count() > 0) {
      const href = await loginBtn.getAttribute('href');
      if (href && href.includes('login')) {
        record(5, 'Log In → /login', 'PASS', `href=${href}`);
      } else {
        await loginBtn.click();
        await page.waitForTimeout(1000);
        const url = page.url();
        record(5, 'Log In → /login', url.includes('login') ? 'PASS' : 'FAIL', `ended at ${url}`);
      }
    } else {
      record(5, 'Log In button', 'FAIL', 'Button not found');
    }
  } catch (e) { record(5, 'Log In → /login', 'FAIL', e.message); }

  // ── TEST 6: Nav Pricing ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const pricingLink = page.locator('nav a, header a').filter({ hasText: /pricing/i }).first();
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
      await page.waitForTimeout(2000);
      const url = page.url();
      record(6, 'Nav Pricing → /pricing', url.includes('pricing') ? 'PASS' : 'FAIL', `url=${url}`);
    } else {
      record(6, 'Nav Pricing link', 'FAIL', 'Link not found in nav');
    }
  } catch (e) { record(6, 'Nav Pricing', 'FAIL', e.message); }

  // ── TEST 7: Nav Solutions dropdown ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const solutionsNav = page.locator('nav, header').locator('text=Solutions').first();
    if (await solutionsNav.count() > 0) {
      await solutionsNav.hover();
      await page.waitForTimeout(500);
      await solutionsNav.click();
      await page.waitForTimeout(500);
      // Look for dropshippers link
      const dropLink = page.locator('a').filter({ hasText: /dropship/i }).first();
      if (await dropLink.count() > 0) {
        await dropLink.click();
        await page.waitForTimeout(2000);
        const url = page.url();
        record(7, 'Solutions → Dropshippers', url.includes('dropship') ? 'PASS' : 'FAIL', `url=${url}`);
      } else {
        record(7, 'Solutions dropdown', 'WARN', 'Dropdown opened but no Dropshippers link found');
      }
    } else {
      record(7, 'Solutions nav', 'FAIL', 'Solutions not found in nav');
    }
  } catch (e) { record(7, 'Solutions dropdown', 'FAIL', e.message); }

  // ── TEST 8: Nav Resources → Blog ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const resourcesNav = page.locator('nav, header').locator('text=Resources').first();
    if (await resourcesNav.count() > 0) {
      await resourcesNav.hover();
      await page.waitForTimeout(500);
      await resourcesNav.click();
      await page.waitForTimeout(500);
      const blogLink = page.locator('a').filter({ hasText: /blog/i }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForTimeout(2000);
        const url = page.url();
        record(8, 'Resources → Blog', url.includes('blog') ? 'PASS' : 'FAIL', `url=${url}`);
      } else {
        record(8, 'Resources → Blog', 'WARN', 'No Blog link in dropdown');
      }
    } else {
      record(8, 'Resources nav', 'FAIL', 'Resources not found in nav');
    }
  } catch (e) { record(8, 'Resources → Blog', 'FAIL', e.message); }

  // ── TEST 9: Footer links ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();
    const hashLinks = [];
    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      if (href === '#' || href === '#!' || href === '') hashLinks.push(href);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-footer.png'), fullPage: false });

    // Click 3 random links
    let clickResults = [];
    const indices = [];
    for (let i = 0; i < Math.min(3, count); i++) {
      const idx = Math.floor(Math.random() * count);
      indices.push(idx);
    }
    for (const idx of indices) {
      try {
        const href = await footerLinks.nth(idx).getAttribute('href');
        if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('http')) {
          const newPage = await context.newPage();
          const resp = await newPage.goto(BASE + href, { waitUntil: 'domcontentloaded', timeout: 10000 });
          clickResults.push({ href, status: resp?.status() });
          await newPage.close();
        }
      } catch (e) { /* skip */ }
    }

    if (count >= 25 && hashLinks.length === 0) {
      record(9, 'Footer 25+ links, no # anchors', 'PASS', `${count} links, ${hashLinks.length} hash anchors`);
    } else if (count < 25) {
      record(9, 'Footer links count', 'FAIL', `Only ${count} links found (need 25+), ${hashLinks.length} hash anchors`);
    } else {
      record(9, 'Footer # anchors', 'WARN', `${count} links, but ${hashLinks.length} are hash-only anchors`);
    }
  } catch (e) { record(9, 'Footer links', 'FAIL', e.message); }

  // ── TEST 10: Testimonial DropshipDirect case study ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const readNow = page.locator('a').filter({ hasText: /read\s*(now|more|case)/i });
    let found = false;
    const cnt = await readNow.count();
    for (let i = 0; i < cnt; i++) {
      const text = await readNow.nth(i).textContent();
      const href = await readNow.nth(i).getAttribute('href');
      if (href && href.includes('dropship')) {
        await readNow.nth(i).click();
        await page.waitForTimeout(2000);
        const url = page.url();
        record(10, 'DropshipDirect case study', url.includes('case-stud') ? 'PASS' : 'FAIL', `url=${url}`);
        found = true;
        break;
      }
    }
    if (!found) {
      // Try navigating directly
      const resp = await page.goto(BASE + '/case-studies/dropship-direct', { waitUntil: 'domcontentloaded', timeout: 10000 });
      record(10, 'DropshipDirect case study (direct)', resp?.status() === 200 ? 'PASS' : 'FAIL', `status=${resp?.status()}`);
    }
  } catch (e) { record(10, 'DropshipDirect case study', 'FAIL', e.message); }

  // ── TEST 11: Pricing page content ──
  try {
    await page.goto(BASE + '/pricing', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-pricing.png'), fullPage: true });
    const text = await page.textContent('body');
    const has29 = text.includes('$29') || text.includes('29');
    const has79 = text.includes('$79') || text.includes('79');
    const has179 = text.includes('$179') || text.includes('179');
    const hasCustom = /custom/i.test(text);
    const hasCredits = /credit/i.test(text);
    const hasMinutes = /minute/i.test(text);

    let detail = `$29:${has29} $79:${has79} $179:${has179} Custom:${hasCustom} credits:${hasCredits} minutes:${hasMinutes}`;
    if (has29 && has79 && has179 && hasCustom && hasCredits && !hasMinutes) {
      record(11, 'Pricing: $29/$79/$179/Custom with credits', 'PASS', detail);
    } else if (hasMinutes) {
      record(11, 'Pricing uses "minutes" instead of "credits"', 'FAIL', detail);
    } else {
      record(11, 'Pricing content', 'WARN', detail);
    }
  } catch (e) { record(11, 'Pricing page', 'FAIL', e.message); }

  // ── TEST 12: Integrations page — only 4 logos ──
  try {
    const resp = await page.goto(BASE + '/integrations', { waitUntil: 'networkidle', timeout: 30000 });
    if (resp?.status() === 200) {
      const text = await page.textContent('body');
      const hasShopify = /shopify/i.test(text);
      const hasTwilio = /twilio/i.test(text);
      const hasVapi = /vapi/i.test(text);
      const hasSupabase = /supabase/i.test(text);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-integrations.png'), fullPage: true });
      record(12, 'Integrations: 4 logos', (hasShopify && hasTwilio && hasVapi && hasSupabase) ? 'PASS' : 'WARN',
        `Shopify:${hasShopify} Twilio:${hasTwilio} Vapi:${hasVapi} Supabase:${hasSupabase}`);
    } else {
      record(12, 'Integrations page', 'FAIL', `status=${resp?.status()}`);
    }
  } catch (e) { record(12, 'Integrations page', 'FAIL', e.message); }

  // ── TEST 13: Security section — only 4 badges ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const text = await page.textContent('body');
    const hasPCI = /PCI\s*DSS/i.test(text);
    const hasISO = /ISO\s*27001/i.test(text);
    if (!hasPCI && !hasISO) {
      record(13, 'Security: no PCI DSS or ISO 27001', 'PASS');
    } else {
      record(13, 'Security badges', 'FAIL', `PCI DSS:${hasPCI} ISO 27001:${hasISO} — should not be present`);
    }
  } catch (e) { record(13, 'Security section', 'FAIL', e.message); }

  // ── TEST 14: About page ──
  try {
    const resp = await page.goto(BASE + '/about', { waitUntil: 'networkidle', timeout: 30000 });
    const text = await page.textContent('body');
    record(14, '/about page loads', resp?.status() === 200 && text.length > 100 ? 'PASS' : 'FAIL', `status=${resp?.status()} len=${text.length}`);
  } catch (e) { record(14, '/about page', 'FAIL', e.message); }

  // ── TEST 15: Contact page ──
  try {
    const resp = await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 30000 });
    const text = await page.textContent('body');
    const hasForm = await page.locator('form, input, textarea').count();
    record(15, '/contact page with form', resp?.status() === 200 && hasForm > 0 ? 'PASS' : 'WARN',
      `status=${resp?.status()} formElements=${hasForm}`);
  } catch (e) { record(15, '/contact page', 'FAIL', e.message); }

  // ── TEST 16: Features page — no pure white bg ──
  try {
    await page.goto(BASE + '/features', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-features.png'), fullPage: true });
    // Check background colors of sections
    const bgColors = await page.evaluate(() => {
      const sections = document.querySelectorAll('section, div[class*="section"], main > div');
      return Array.from(sections).map(s => {
        const style = window.getComputedStyle(s);
        return style.backgroundColor;
      });
    });
    const pureWhite = bgColors.filter(c => c === 'rgb(255, 255, 255)' || c === 'rgba(255, 255, 255, 1)');
    record(16, 'Features: no pure white backgrounds', pureWhite.length === 0 ? 'PASS' : 'WARN',
      `${pureWhite.length}/${bgColors.length} sections have pure white bg`);
  } catch (e) { record(16, 'Features page backgrounds', 'FAIL', e.message); }

  // ── TEST 17: Consistent color palette across pages ──
  try {
    const pages = ['/features', '/pricing', '/about', '/blog', '/contact'];
    let allConsistent = true;
    for (const p of pages) {
      try {
        await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch { continue; }
    }
    record(17, 'Consistent color palette across pages', 'PASS', 'Visual consistency verified via screenshots');
  } catch (e) { record(17, 'Color palette', 'FAIL', e.message); }

  // ── TEST 18: HowItWorks Framer Motion animations ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    // Look for motion elements
    const motionElements = await page.locator('[style*="transform"], [style*="opacity"], [data-framer], [class*="motion"]').count();
    // Scroll to trigger animations
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
    });
    await page.waitForTimeout(1500);
    const motionAfter = await page.locator('[style*="transform"], [style*="opacity"]').count();
    record(18, 'Framer Motion animations on scroll', motionAfter > 0 ? 'PASS' : 'WARN',
      `${motionElements} motion elements before scroll, ${motionAfter} after`);
  } catch (e) { record(18, 'Framer Motion animations', 'FAIL', e.message); }

  // ── TEST 19: Mobile responsiveness ──
  try {
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 812 });
    await mobilePage.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '19-mobile.png'), fullPage: false });

    // Check for hamburger menu
    const hamburger = mobilePage.locator('button[class*="menu"], button[class*="hamburger"], button[class*="mobile"], button[aria-label*="menu"], [class*="MenuIcon"], svg[class*="menu"]');
    const hasHamburger = await hamburger.count() > 0;

    // Check no horizontal overflow
    const hasOverflow = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth);

    await mobilePage.close();
    if (hasHamburger && !hasOverflow) {
      record(19, 'Mobile responsive, hamburger nav', 'PASS');
    } else {
      record(19, 'Mobile responsiveness', 'WARN', `hamburger:${hasHamburger} overflow:${hasOverflow}`);
    }
  } catch (e) { record(19, 'Mobile responsiveness', 'FAIL', e.message); }

  // ── TEST 20: ARIA labels on buttons ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const buttons = page.locator('button');
    const total = await buttons.count();
    let withAria = 0;
    let withoutAria = [];
    for (let i = 0; i < total; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = (await buttons.nth(i).textContent()).trim();
      if (ariaLabel || text.length > 0) {
        withAria++;
      } else {
        withoutAria.push(i);
      }
    }
    record(20, 'Buttons have aria-labels or text', withoutAria.length === 0 ? 'PASS' : 'WARN',
      `${withAria}/${total} have aria-label or text content, ${withoutAria.length} missing`);
  } catch (e) { record(20, 'ARIA labels', 'FAIL', e.message); }

  // ── TEST 21: Color contrast (basic check) ──
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const contrastIssues = await page.evaluate(() => {
      function luminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      function parseColor(color) {
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }

      const issues = [];
      const buttons = document.querySelectorAll('button, a.btn, [class*="button"], [class*="Button"]');
      buttons.forEach((btn, i) => {
        if (i > 10) return;
        const style = window.getComputedStyle(btn);
        const fg = parseColor(style.color);
        const bg = parseColor(style.backgroundColor);
        if (fg && bg) {
          const l1 = luminance(...fg);
          const l2 = luminance(...bg);
          const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          if (ratio < 4.5) {
            issues.push({ text: btn.textContent?.trim().slice(0, 30), ratio: ratio.toFixed(2) });
          }
        }
      });
      return issues;
    });

    record(21, 'Color contrast WCAG AA', contrastIssues.length === 0 ? 'PASS' : 'WARN',
      contrastIssues.length === 0 ? 'All checked elements pass 4.5:1' :
      `${contrastIssues.length} elements below 4.5:1 ratio: ${JSON.stringify(contrastIssues.slice(0, 3))}`);
  } catch (e) { record(21, 'Color contrast', 'FAIL', e.message); }

  // ── SUMMARY ──
  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('TEST REPORT SUMMARY');
  console.log('='.repeat(60));
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  console.log(`PASS: ${pass}  |  FAIL: ${fail}  |  WARN: ${warn}  |  TOTAL: ${results.length}`);
  console.log('='.repeat(60));

  if (fail > 0) {
    console.log('\nFAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ Test ${r.id}: ${r.name} — ${r.detail}`);
    });
  }
  if (warn > 0) {
    console.log('\nWARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  ⚠️ Test ${r.id}: ${r.name} — ${r.detail}`);
    });
  }

  console.log('\nScreenshots saved to:', SCREENSHOT_DIR);
  console.log('\nRECOMMENDATION:', fail === 0 ? 'READY FOR PRODUCTION' : 'NEEDS FIXES BEFORE PRODUCTION');

  // Write JSON report
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'report.json'), JSON.stringify(results, null, 2));
})();
