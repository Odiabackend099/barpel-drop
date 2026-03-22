/**
 * Onboarding Smoke Tests — run these before any deploy touching onboarding files.
 *
 * Tests are split into two groups:
 *   1. Static (no browser) — verify file integrity, protected files exist, no forbidden strings
 *   2. Live (browser) — navigate the production app to confirm key flows
 *
 * Run: npm run test:onboarding
 * Run headed: npm run test:onboarding:headed
 */
import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const PROD_URL = "https://dropship.barpel.ai";

// ---------------------------------------------------------------------------
// GROUP 1: Static / file-system checks (no browser needed)
// ---------------------------------------------------------------------------

test("ONBOARDING.md exists and contains lock warning", () => {
  const path = resolve(ROOT, "ONBOARDING.md");
  expect(existsSync(path), "ONBOARDING.md is missing").toBe(true);
  const content = readFileSync(path, "utf-8");
  expect(content).toContain("PERMANENTLY LOCKED");
  expect(content).toContain("[onboarding-approved]");
});

test("All 14 protected onboarding files exist", () => {
  const protectedFiles = [
    "app/onboarding/page.tsx",
    "app/api/shopify/oauth/start/route.ts",
    "app/api/shopify/oauth/callback/route.ts",
    "app/api/onboarding/complete/route.ts",
    "app/api/provisioning/byoc/route.ts",
    "app/api/provisioning/retry/route.ts",
    "app/api/billing/dodo/initiate/route.ts",
    "app/api/billing/paystack/initiate/route.ts",
    "app/api/caller-id/start/route.ts",
    "app/api/caller-id/verify/route.ts",
    "lib/provisioning/phoneService.ts",
    "lib/provisioning/gates.ts",
    "lib/callForwarding/ussdCodes.ts",
    "middleware.ts",
  ];
  for (const file of protectedFiles) {
    expect(existsSync(resolve(ROOT, file)), `Missing protected file: ${file}`).toBe(true);
  }
});

test("Onboarding page has NO TWILIO_SUBACCOUNT reference", () => {
  const source = readFileSync(resolve(ROOT, "app/onboarding/page.tsx"), "utf-8");
  expect(source, "TWILIO_SUBACCOUNT found in onboarding page — managed provision is broken").not.toContain(
    "TWILIO_SUBACCOUNT"
  );
});

test("Onboarding page has NO website field", () => {
  const source = readFileSync(resolve(ROOT, "app/onboarding/page.tsx"), "utf-8");
  // There must be no input with placeholder referencing "website" or "https://"
  expect(source).not.toMatch(/placeholder=["'][^"']*website/i);
  expect(source).not.toMatch(/placeholder=["'][^"']*https:\/\//i);
});

test("Onboarding page has NO Nigeria in country dropdown", () => {
  const source = readFileSync(resolve(ROOT, "app/onboarding/page.tsx"), "utf-8");
  expect(source, "Nigeria / NG found in onboarding page UI — must be removed").not.toMatch(/Nigeria|🇳🇬/);
  // NG as a country code in UI arrays must not appear (ussdCodes.ts backend data is exempt)
  expect(source, "isAfrica variable still present in onboarding page").not.toContain("isAfrica");
});

test("USSD code definitions exist for NG/MTN and US/Verizon", () => {
  const source = readFileSync(resolve(ROOT, "lib/callForwarding/ussdCodes.ts"), "utf-8");
  // Nigeria MTN forwardAll should use **21* prefix
  expect(source, "NG MTN forwardAll pattern missing").toContain("**21*");
  // US Verizon forwardAll should use *72 prefix
  expect(source, "US Verizon forwardAll pattern missing").toContain("*72");
  // Airtel NG forwardNoAnswer should use **61* prefix
  expect(source, "NG Airtel forwardNoAnswer pattern missing").toContain("**61*");
});

// ---------------------------------------------------------------------------
// GROUP 2: Live browser checks against production
// ---------------------------------------------------------------------------

test("Production /onboarding loads without 500 error", async ({ request }) => {
  const response = await request.get(`${PROD_URL}/onboarding`, { maxRedirects: 5 });
  expect(response.status(), `Expected non-error status on /onboarding, got ${response.status()}`).not.toBe(500);
  expect(response.status()).not.toBe(404);
});

test("Unauthenticated /dashboard redirects away from /dashboard", async ({ request }) => {
  const response = await request.get(`${PROD_URL}/dashboard`, { maxRedirects: 10 });
  // Must redirect to /onboarding or /signup — final URL must not be /dashboard
  const finalUrl = response.url();
  expect(finalUrl, `Expected redirect from /dashboard, got: ${finalUrl}`).not.toMatch(/\/dashboard$/);
});

test("Production /signup page loads", async ({ request }) => {
  const response = await request.get(`${PROD_URL}/signup`, { maxRedirects: 5 });
  expect(response.status()).not.toBe(500);
  expect(response.status()).not.toBe(404);
});
