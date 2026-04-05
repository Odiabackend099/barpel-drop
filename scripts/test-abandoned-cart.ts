/**
 * test-abandoned-cart.ts
 *
 * End-to-end test: abandoned cart webhook → DB queue → dial-pending cron → Vapi call.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-abandoned-cart.ts
 */

import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;
const CRON_SECRET = process.env.CRON_SECRET!;
const SHOP_DOMAIN = "yvutxu-gs.myshopify.com";

if (!BASE_URL || !CRON_SECRET) {
  console.error("❌ Missing env vars: NEXT_PUBLIC_BASE_URL or CRON_SECRET");
  process.exit(1);
}

async function run() {
  const supabase = createAdminClient();

  // 1. Look up integration
  const { data: integration } = await supabase
    .from("integrations")
    .select("id, merchant_id, webhook_secret_vault_id, outbound_consent_confirmed_at, connection_active")
    .eq("shop_domain", SHOP_DOMAIN)
    .eq("platform", "shopify")
    .single();

  if (!integration) {
    console.error("❌ No integration found for", SHOP_DOMAIN);
    process.exit(1);
  }

  if (!integration.connection_active) {
    console.error("❌ Integration is not active (connection_active = false)");
    process.exit(1);
  }

  if (!integration.outbound_consent_confirmed_at) {
    console.error("❌ outbound_consent_confirmed_at is NULL — webhook will return { skipped: 'no_consent' }");
    console.error("   Fix: run the following in Supabase SQL editor:");
    console.error(`   UPDATE integrations SET outbound_consent_confirmed_at = NOW() WHERE shop_domain = '${SHOP_DOMAIN}';`);
    process.exit(1);
  }

  console.log("✅ Integration found, consent confirmed");
  console.log(`   Merchant ID: ${integration.merchant_id}`);

  // 2. Read vault secret
  const { data: vaultSecret } = await supabase
    .rpc("vault_read_secret_by_id", { p_id: integration.webhook_secret_vault_id });

  if (!vaultSecret) {
    console.error("❌ Vault read failed for webhook_secret_vault_id:", integration.webhook_secret_vault_id);
    process.exit(1);
  }

  // 3. Build mock checkout payload
  const checkoutId = `test_${Date.now()}`;
  const payload = {
    id: checkoutId,
    token: `token_${checkoutId}`,
    email: "test.customer.abandoned@example.com",
    phone: "+2348012345678",
    total_price: "120.00",
    billing_address: {
      name: "Test Customer",
      phone: "+2348012345678",
    },
    line_items: [
      { title: "Silver Earrings", quantity: 1, price: "120.00" },
    ],
  };

  const rawBody = JSON.stringify(payload);
  const hmac = createHmac("sha256", vaultSecret).update(rawBody).digest("base64");

  // 4. Fire the webhook
  console.log("\n→ Sending abandoned cart webhook...");
  const webhookRes = await fetch(`${BASE_URL}/api/outbound/abandoned-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-shopify-hmac-sha256": hmac,
      "x-shopify-shop-domain": SHOP_DOMAIN,
    },
    body: rawBody,
  });

  const webhookData = await webhookRes.json();
  console.log(`← Webhook: ${webhookRes.status}`, JSON.stringify(webhookData));

  if (!webhookRes.ok || (webhookData as Record<string, unknown>).skipped) {
    console.error("❌ Webhook did not queue a call:", webhookData);
    process.exit(1);
  }

  // 5. Verify DB record was created
  await new Promise((r) => setTimeout(r, 1500));

  const { data: pendingCall } = await supabase
    .from("pending_outbound_calls")
    .select("id, customer_phone, customer_email, scheduled_for, status")
    .eq("merchant_id", integration.merchant_id)
    .eq("customer_email", payload.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!pendingCall) {
    console.error("❌ No pending call found in DB after webhook — check Vercel logs");
    process.exit(1);
  }

  console.log(`\n✅ Pending call created: ${pendingCall.id}`);
  console.log(`   Phone: ${pendingCall.customer_phone}`);
  console.log(`   Scheduled for: ${pendingCall.scheduled_for}`);
  console.log(`   Status: ${pendingCall.status}`);

  // 6. Override scheduled_for to now so dial-pending picks it up immediately
  await supabase
    .from("pending_outbound_calls")
    .update({ scheduled_for: new Date().toISOString() })
    .eq("id", pendingCall.id);

  console.log("\n→ Overrode scheduled_for to now");

  // 7. Trigger dial-pending cron manually
  console.log("→ Triggering dial-pending cron...");
  const cronRes = await fetch(`${BASE_URL}/api/cron/dial-pending`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  const cronData = await cronRes.json();
  console.log(`← Cron: ${cronRes.status}`, JSON.stringify(cronData));

  if (!cronRes.ok) {
    console.error("❌ Cron endpoint returned an error");
    process.exit(1);
  }

  const dialed = (cronData as { dialed?: number }).dialed ?? 0;

  if (dialed === 0) {
    console.warn("⚠️  Cron ran but dialed 0 calls — check Vercel function logs for errors");
    console.warn("   Possible causes: merchant vapi_agent_id/vapi_phone_id not set, insufficient credits");
  } else {
    console.log(`\n✅ CHAIN VERIFIED — ${dialed} call(s) initiated`);
    console.log("   Check app.vapi.ai → Calls for the outbound call");
  }

  // 8. Re-check DB status
  await new Promise((r) => setTimeout(r, 2000));
  const { data: updated } = await supabase
    .from("pending_outbound_calls")
    .select("status")
    .eq("id", pendingCall.id)
    .single();

  console.log(`\n   Final call status in DB: ${updated?.status ?? "unknown"}`);
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
