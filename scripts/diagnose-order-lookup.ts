/**
 * diagnose-order-lookup.ts
 *
 * Diagnoses why "Where is my order?" returns "trouble finding your order".
 * Checks whether the Shopify store has real orders, then tests the lookup
 * function directly with a real order number.
 *
 * REQUIRES (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *
 * Run: npm run diagnose:orders
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { lookupOrder } from "@/lib/shopify/client";

async function run() {
  const supabase = createAdminClient();

  // Get most recent active merchant
  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("id, business_name")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (merchantError || !merchant) {
    console.error("❌ No active merchant found:", merchantError?.message);
    process.exit(1);
  }

  console.log(`\nMerchant: ${merchant.business_name} (${merchant.id})`);

  // Get Shopify integration
  const { data: integration } = await supabase
    .from("integrations")
    .select("shop_domain, access_token_secret_id, connection_active")
    .eq("merchant_id", merchant.id)
    .eq("platform", "shopify")
    .single();

  if (!integration?.connection_active) {
    console.error("❌ Shopify not connected for this merchant.");
    process.exit(1);
  }

  console.log(`Shop domain: ${integration.shop_domain}`);

  // Read token from Vault
  const { data: token } = await supabase.rpc("vault_read_secret_by_id", {
    p_id: integration.access_token_secret_id,
  });

  if (!token || typeof token !== "string" || token.length < 10) {
    console.error("❌ Vault token is empty or unreadable.");
    console.error(
      "   FIX: Reconnect Shopify via the dashboard to refresh the token."
    );
    process.exit(1);
  }

  console.log(`Token: ${token.slice(0, 8)}... (readable ✅)`);

  // Step 1: Check if the store has any orders at all
  console.log("\n── Checking store for orders ──────────────────────────");

  const ordersRes = await fetch(
    `https://${integration.shop_domain}/admin/api/2026-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `{
          orders(first: 5) {
            edges {
              node {
                id
                name
                displayFulfillmentStatus
                createdAt
              }
            }
          }
        }`,
      }),
    }
  );

  if (!ordersRes.ok) {
    console.error(
      `❌ Shopify API returned ${ordersRes.status}:`,
      await ordersRes.text()
    );
    console.error("   This may mean the token lacks read_orders scope.");
    process.exit(1);
  }

  const ordersData = await ordersRes.json();

  if (ordersData.errors?.length) {
    console.error("❌ Shopify GraphQL error:", ordersData.errors[0].message);
    process.exit(1);
  }

  const orders = ordersData?.data?.orders?.edges ?? [];
  console.log(`Orders in store: ${orders.length}`);

  if (orders.length === 0) {
    console.log("\n❌ PROBLEM: Store has zero orders.");
    console.log("   The AI cannot look up an order that does not exist.");
    console.log("");
    console.log("   FIX: Create a test order in the Shopify admin:");
    console.log(
      `   → Go to https://${integration.shop_domain}/admin/orders`
    );
    console.log("   → Click 'Create order' → Add any product → Mark as paid");
    console.log("   → Note the order number (e.g. #1001)");
    console.log("   → Then call the AI and say that exact order number");
    process.exit(1);
  }

  // Print all found orders
  for (const edge of orders) {
    const o = edge.node;
    console.log(
      `  ${o.name} | ${o.displayFulfillmentStatus ?? "UNFULFILLED"} | ${o.createdAt}`
    );
  }

  // Step 2: Test lookupOrder() with the first order
  const firstOrder = orders[0].node;
  const orderNum = firstOrder.name.replace("#", "");

  console.log(`\n── Testing lookupOrder("${orderNum}") ─────────────────`);

  try {
    const result = await lookupOrder(
      integration.shop_domain,
      token,
      orderNum
    );

    if (!result) {
      console.log("\n❌ lookupOrder returned null even though order exists.");
      console.log("   This suggests a search format issue.");
      console.log(`   Order name in Shopify: "${firstOrder.name}"`);
      console.log(`   Search term used: "${orderNum}"`);
    } else {
      console.log("\n✅ Order lookup works correctly!");
      console.log(`   Name: ${result.name}`);
      console.log(`   Status: ${result.fulfillmentStatus ?? "UNFULFILLED"}`);
      console.log(`   Items: ${result.lineItems.map((i) => i.title).join(", ")}`);
      console.log(`   Tracking: ${result.trackingNumbers.join(", ") || "(none)"}`);
      console.log(
        `\n📞 Call the number and say: "Check order ${firstOrder.name}"`
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("\n❌ lookupOrder threw an error:", message);
    console.error("   Check token scope and shop domain.");
  }
}

run().catch((err) => {
  console.error("Script error:", err.message ?? err);
  process.exit(1);
});
