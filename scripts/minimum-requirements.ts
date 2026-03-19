/**
 * minimum-requirements.ts
 *
 * Checks every prerequisite that must be true before the AI phone line
 * can answer a call. Run this FIRST — if anything is ❌, the phone will
 * not work regardless of what else you do.
 *
 * REQUIRES (in .env.local):
 *   VAPI_PRIVATE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *
 * Run: npm run minimum:check
 */

import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;

if (!VAPI_KEY) {
  console.error("❌ Missing env var: VAPI_PRIVATE_KEY");
  process.exit(1);
}

async function run() {
  const supabase = createAdminClient();

  // Get most recent active merchant
  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (merchantError) {
    console.error("❌ DB query failed:", merchantError.message);
    process.exit(1);
  }

  const checks: Record<string, boolean | string | string[]> = {
    merchant_exists: !!merchant,
    merchant_active: merchant?.provisioning_status === "active",
    vapi_agent_id: !!merchant?.vapi_agent_id,
    vapi_phone_id: !!merchant?.vapi_phone_id,
    support_phone: !!merchant?.support_phone,
    business_name: !!merchant?.business_name,
    shopify_connected: false,
    shopify_token_readable: false,
    phone_linked_to_assistant: false,
    assistant_webhook_correct: false,
    assistant_first_message: "",
    assistant_tools: [] as string[],
  };

  // Check Shopify integration
  const { data: integration } = await supabase
    .from("integrations")
    .select("connection_active, access_token_secret_id, shop_domain")
    .eq("merchant_id", merchant.id)
    .eq("platform", "shopify")
    .single();

  checks.shopify_connected = integration?.connection_active === true;

  // Check Vault token
  if (integration?.access_token_secret_id) {
    const { data: token } = await supabase.rpc("vault_read_secret_by_id", {
      p_id: integration.access_token_secret_id,
    });
    checks.shopify_token_readable =
      !!token && typeof token === "string" && token.length > 10;
  }

  // Check Vapi phone number is linked to assistant
  if (merchant.vapi_phone_id) {
    const phoneRes = await fetch(
      `https://api.vapi.ai/phone-number/${merchant.vapi_phone_id}`,
      { headers: { Authorization: `Bearer ${VAPI_KEY}` } }
    );
    if (phoneRes.ok) {
      const phone = await phoneRes.json();
      checks.phone_linked_to_assistant =
        phone.assistantId === merchant.vapi_agent_id;
    }
  }

  // Check Vapi assistant config
  if (merchant.vapi_agent_id) {
    const assistantRes = await fetch(
      `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
      { headers: { Authorization: `Bearer ${VAPI_KEY}` } }
    );
    if (assistantRes.ok) {
      const assistant = await assistantRes.json();
      checks.assistant_webhook_correct =
        assistant.serverUrl?.includes("dropship.barpel.ai") ?? false;
      checks.assistant_first_message = assistant.firstMessage ?? "(none)";
      checks.assistant_tools = (
        assistant.model?.tools?.map(
          (t: { function?: { name?: string } }) => t.function?.name
        ) ?? []
      ).filter(Boolean);
    }
  }

  // Print results
  console.log("\n══════════════════════════════════════════");
  console.log("  MINIMUM REQUIREMENTS FOR PHONE CALL");
  console.log("══════════════════════════════════════════");

  for (const [key, value] of Object.entries(checks)) {
    if (typeof value === "boolean") {
      const icon = value ? "✅" : "❌";
      console.log(`${icon} ${key}: ${value}`);
    } else {
      console.log(`ℹ️  ${key}: ${JSON.stringify(value)}`);
    }
  }

  const boolChecks = Object.entries(checks).filter(
    ([, v]) => typeof v === "boolean"
  );
  const allPass = boolChecks.every(([, v]) => v === true);

  if (allPass) {
    console.log("\n✅ ALL REQUIREMENTS MET");
    console.log(`📞 CALL THIS NUMBER: ${merchant.support_phone}`);
    console.log(`🗣️  AI WILL SAY: "${checks.assistant_first_message}"`);
    console.log(
      `🛠️  TOOLS: ${(checks.assistant_tools as string[]).join(", ")}`
    );
    if (integration?.shop_domain) {
      console.log(`🏪 SHOPIFY STORE: ${integration.shop_domain}`);
    }
  } else {
    console.log("\n❌ REQUIREMENTS NOT MET — FIX ABOVE BEFORE CALLING");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Script error:", err.message ?? err);
  process.exit(1);
});
