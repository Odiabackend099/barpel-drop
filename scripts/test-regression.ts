/**
 * LAYER 3: Regression Test
 *
 * Runs Layer 1 automatically. No phone call. No human interaction.
 * Exits with code 1 if Layer 1 fails so CI/Vercel post-deploy hooks catch it.
 *
 * Add to Vercel: post-deploy hook or GitHub Action after each push.
 *
 * Run: npm run test:regression
 */

import { execSync } from "child_process";

console.log("Running regression test suite...");

// Layer 1: Vapi tool-call response shape
try {
  execSync(
    "npx tsx --env-file=.env.local scripts/test-layer1-webhook.ts",
    {
      stdio: "inherit",
      timeout: 30_000, // 30s max — Layer 1 should complete in ~3s
      env: {
        ...process.env,
        TEST_ORDER_NUMBER: process.env.TEST_ORDER_NUMBER || "1001",
      },
    }
  );
} catch {
  console.error("\n❌ LAYER 1 REGRESSION FAILED — deployment may be broken");
  process.exit(1);
}

// Layer 1B: DB write + credit deduction + Shopify + security boundaries
try {
  execSync(
    "npx tsx --env-file=.env.local scripts/test-layer1b-eoc.ts",
    {
      stdio: "inherit",
      timeout: 60_000, // 60s max — includes DB round-trips + 500ms settle waits
    }
  );
} catch {
  console.error("\n❌ LAYER 1B REGRESSION FAILED — contract tests broken");
  process.exit(1);
}

console.log("\n✅ ALL REGRESSION TESTS PASSED");
process.exit(0);
