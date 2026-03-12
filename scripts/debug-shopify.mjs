import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  await page.goto("https://partners.shopify.com/");
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: "scripts/step1.png" });

  // Click log in
  const loginLinks = await page.locator("a").all();
  for (const l of loginLinks) {
    const t = await l.innerText().catch(() => "");
    if (/log.?in/i.test(t)) { await l.click(); break; }
  }
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: "scripts/step2-login.png" });
  console.log("Login page URL:", page.url());

  // Dump all inputs
  const inputs = await page.locator("input").all();
  console.log("Inputs found:", inputs.length);
  for (const inp of inputs) {
    const attrs = await inp.evaluate(el => ({
      type: el.type, name: el.name, id: el.id,
      placeholder: el.placeholder, class: el.className.substring(0,50)
    }));
    console.log("  input:", attrs);
  }

  // Dump all buttons
  const btns = await page.locator("button").all();
  for (const b of btns) {
    const t = await b.innerText().catch(() => "");
    console.log("  button:", t.trim().substring(0, 80));
  }

  // Dump all links
  const links = await page.locator("a").all();
  for (const l of links) {
    const t = await l.innerText().catch(() => "");
    const href = await l.getAttribute("href").catch(() => "");
    if (t.trim()) console.log("  link:", t.trim().substring(0, 60), "→", href?.substring(0, 60));
  }

  await new Promise(r => setTimeout(r, 30000)); // keep open 30s
  await browser.close();
})();
