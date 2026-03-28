/**
 * Verifies that Shopify OAuth configuration is consistent between
 * environment variables, shopify.app.toml, and code.
 *
 * Run: npx tsx --env-file=.env.local scripts/verify-shopify-config.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(process.cwd());
let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\nShopify Config Verification\n");

// ── Environment Variables ──
const apiKey = process.env.SHOPIFY_API_KEY ?? "";
const apiSecret = process.env.SHOPIFY_API_SECRET ?? "";
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");

check("SHOPIFY_API_KEY is set", apiKey.length > 0);
check("SHOPIFY_API_SECRET is set", apiSecret.length > 0);
check("NEXT_PUBLIC_BASE_URL is set", baseUrl.length > 0);
check(
  "NEXT_PUBLIC_BASE_URL has no trailing slash",
  !(process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().endsWith("/"),
  `Value: "${process.env.NEXT_PUBLIC_BASE_URL}"`
);

// ── TOML Configuration ──
let tomlContent = "";
try {
  tomlContent = readFileSync(resolve(ROOT, "shopify.app.toml"), "utf-8");
  check("shopify.app.toml exists", true);
} catch {
  check("shopify.app.toml exists", false, "File not found");
}

if (tomlContent) {
  const clientIdMatch = tomlContent.match(/client_id\s*=\s*"([^"]+)"/);
  const tomlClientId = clientIdMatch?.[1] ?? "";
  check(
    "TOML client_id matches SHOPIFY_API_KEY",
    tomlClientId === apiKey,
    `TOML: ${tomlClientId.slice(0, 8)}... / ENV: ${apiKey.slice(0, 8)}...`
  );

  const expectedRedirectUri = `${baseUrl}/api/shopify/oauth/callback`;
  check(
    "Redirect URI in TOML redirect_urls",
    tomlContent.includes(expectedRedirectUri),
    `Expected: ${expectedRedirectUri}`
  );

  check(
    "TOML has [access_scopes] section",
    tomlContent.includes("[access_scopes]"),
    "Required for Shopify managed installation"
  );

  check(
    "TOML scopes do NOT contain read_checkouts",
    !tomlContent.includes("read_checkouts"),
    "read_checkouts is not a valid Shopify OAuth scope"
  );

  check(
    "TOML scopes do NOT contain read_fulfillments",
    !tomlContent.includes("read_fulfillments"),
    "read_fulfillments is legacy — fulfillment data accessible via read_orders"
  );

  check(
    "TOML scopes do NOT contain read_customers",
    !tomlContent.includes("read_customers"),
    "read_customers is not used by any code path"
  );
}

// ── Code Scopes ──
try {
  const oauthSource = readFileSync(resolve(ROOT, "lib/shopify/oauth.ts"), "utf-8");
  check(
    "Code scopes do NOT contain read_checkouts",
    !oauthSource.includes("read_checkouts"),
    "read_checkouts is not a valid Shopify OAuth scope"
  );
  check(
    "Code scopes do NOT contain read_fulfillments",
    !oauthSource.includes("read_fulfillments"),
    "read_fulfillments is legacy — use read_orders instead"
  );
  check(
    "Code scopes do NOT contain read_customers",
    !oauthSource.includes("read_customers"),
    "read_customers is not used by any code path"
  );
  check(
    "Code scopes contain read_orders",
    oauthSource.includes("read_orders"),
    "Required for order lookup and webhook topics"
  );
  check(
    "Code scopes contain read_products",
    oauthSource.includes("read_products"),
    "Required for product search"
  );
} catch {
  check("lib/shopify/oauth.ts readable", false, "File not found");
}

// ── Print managed install URL for manual testing ──
if (apiKey && baseUrl) {
  const redirectUri = `${baseUrl}/api/shopify/oauth/callback`;
  const managedUrl = `https://admin.shopify.com/oauth/install?client_id=${apiKey}&scope=read_orders,read_products&redirect_uri=${encodeURIComponent(redirectUri)}&state=test`;
  console.log("\n--- Managed Install URL (for manual browser testing) ---");
  console.log(managedUrl);
}

// ── Summary ──
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
}
