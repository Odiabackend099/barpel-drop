/**
 * Create Flutterwave payment plans for Barpel AI (monthly + annual).
 *
 * Usage:
 *   npx tsx -r dotenv/config scripts/create-flw-plans.ts
 *
 * Prerequisites:
 *   - FLW_SECRET_KEY must be set (live or test key depending on environment)
 *   - Run once per environment (test + live)
 *
 * After running, store the returned plan IDs in Vercel env vars:
 *   FLW_PLAN_ID_STARTER, FLW_PLAN_ID_GROWTH, FLW_PLAN_ID_SCALE
 *   FLW_PLAN_ID_STARTER_ANNUAL, FLW_PLAN_ID_GROWTH_ANNUAL, FLW_PLAN_ID_SCALE_ANNUAL
 */

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

if (!FLW_SECRET_KEY) {
  console.error("Missing FLW_SECRET_KEY in environment");
  process.exit(1);
}

const plans = [
  // Monthly plans
  { name: "Barpel AI Starter (Monthly)", amount: 29,   currency: "USD", interval: "monthly", envVar: "FLW_PLAN_ID_STARTER" },
  { name: "Barpel AI Growth (Monthly)",  amount: 79,   currency: "USD", interval: "monthly", envVar: "FLW_PLAN_ID_GROWTH" },
  { name: "Barpel AI Scale (Monthly)",   amount: 179,  currency: "USD", interval: "monthly", envVar: "FLW_PLAN_ID_SCALE" },
  // Annual plans (10% discount)
  { name: "Barpel AI Starter (Annual)",  amount: 313,  currency: "USD", interval: "yearly",  envVar: "FLW_PLAN_ID_STARTER_ANNUAL" },
  { name: "Barpel AI Growth (Annual)",   amount: 853,  currency: "USD", interval: "yearly",  envVar: "FLW_PLAN_ID_GROWTH_ANNUAL" },
  { name: "Barpel AI Scale (Annual)",    amount: 1933, currency: "USD", interval: "yearly",  envVar: "FLW_PLAN_ID_SCALE_ANNUAL" },
];

async function createPlans() {
  console.log("Creating Flutterwave payment plans...");
  console.log(`Key: ${FLW_SECRET_KEY?.substring(0, 20)}...`);
  console.log(`Mode: ${FLW_SECRET_KEY?.includes("TEST") ? "TEST" : "LIVE"}\n`);

  const results: { envVar: string; planId: number }[] = [];

  for (const plan of plans) {
    const res = await fetch("https://api.flutterwave.com/v3/payment-plans", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount:   plan.amount,
        name:     plan.name,
        interval: plan.interval,
        currency: plan.currency,
        duration: 0, // Infinite — runs until cancelled
      }),
    });

    const data = await res.json() as { status: string; data?: { id: number; plan_token: string } };

    if (data.status === "success" && data.data) {
      console.log(`✅ ${plan.envVar}="${data.data.id}"  — ${plan.name} ($${plan.amount} ${plan.interval})`);
      results.push({ envVar: plan.envVar, planId: data.data.id });
    } else {
      console.error(`❌ Failed to create ${plan.name}:`, JSON.stringify(data));
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n─── Add to Vercel env vars ───\n");
  for (const r of results) {
    console.log(`${r.envVar}="${r.planId}"`);
  }
  console.log(`\n${results.length}/${plans.length} plans created.`);
}

createPlans().catch(console.error);
