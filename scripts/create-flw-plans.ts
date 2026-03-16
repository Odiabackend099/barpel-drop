/**
 * One-time script to create Flutterwave payment plans for Barpel AI.
 * Run ONCE: npx ts-node -r dotenv/config scripts/create-flw-plans.ts
 *
 * After running, save the printed plan IDs to Vercel env vars:
 *   FLW_PLAN_ID_STARTER=xxxxx
 *   FLW_PLAN_ID_GROWTH=xxxxx
 *   FLW_PLAN_ID_SCALE=xxxxx
 */

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

if (!FLW_SECRET_KEY) {
  console.error("Missing FLW_SECRET_KEY in environment");
  process.exit(1);
}

const plans = [
  { name: "Barpel AI Starter", amount: 29,  currency: "USD", interval: "monthly" },
  { name: "Barpel AI Growth",  amount: 79,  currency: "USD", interval: "monthly" },
  { name: "Barpel AI Scale",   amount: 179, currency: "USD", interval: "monthly" },
];

async function createPlans() {
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
      }),
    });

    const data = await res.json() as { status: string; data?: { id: number; plan_token: string } };

    if (data.status === "success" && data.data) {
      console.log(`✅ ${plan.name}`);
      console.log(`   plan_id:    ${data.data.id}`);
      console.log(`   plan_token: ${data.data.plan_token}`);
      console.log();
    } else {
      console.error(`❌ Failed to create ${plan.name}:`, JSON.stringify(data));
    }
  }
}

createPlans().catch(console.error);
