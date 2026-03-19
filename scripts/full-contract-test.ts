/**
 * full-contract-test.ts
 *
 * Tests the COMPLETE chain: Vapi → Barpel webhook → Vault → Shopify → DB.
 * Every hop must return the correct data in the correct format.
 *
 * REQUIRES (in .env.local):
 *   VAPI_PRIVATE_KEY
 *   VAPI_WEBHOOK_SECRET
 *   NEXT_PUBLIC_BASE_URL       — https://dropship.barpel.ai
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *
 * Run: npm run test:contracts
 */

import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!VAPI_KEY) {
  console.error("❌ Missing env var: VAPI_PRIVATE_KEY");
  process.exit(1);
}
if (!BASE_URL) {
  console.error("❌ Missing env var: NEXT_PUBLIC_BASE_URL");
  process.exit(1);
}

interface ContractResult {
  pass: boolean;
  detail: string;
}

async function run() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  BARPEL FULL CONTRACT TEST");
  console.log("  Vapi API → Barpel Webhook → Vault → Shopify → DB");
  console.log("═══════════════════════════════════════════════════════\n");

  const supabase = createAdminClient();
  const results: Record<string, ContractResult> = {};

  // Get active merchant
  const { data: merchant } = await supabase
    .from("merchants")
    .select(
      "id, business_name, vapi_agent_id, vapi_phone_id, support_phone"
    )
    .eq("provisioning_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!merchant) {
    console.error("❌ No active merchant found. Run provisioning first.");
    process.exit(1);
  }

  console.log(`Testing merchant: ${merchant.business_name} (${merchant.id})`);
  console.log(`Phone: ${merchant.support_phone}`);
  console.log(`Vapi assistant: ${merchant.vapi_agent_id}\n`);

  // ── CONTRACT 1: Vapi assistant configuration ─────────────────────────────

  console.log("CONTRACT 1: Vapi assistant configuration...");

  let assistant: Record<string, unknown> = {};

  if (merchant.vapi_agent_id) {
    const assistantRes = await fetch(
      `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
      { headers: { Authorization: `Bearer ${VAPI_KEY}` } }
    );

    results["1_assistant_exists"] = {
      pass: assistantRes.status === 200,
      detail:
        assistantRes.status === 404
          ? "Assistant deleted from Vapi"
          : `Status: ${assistantRes.status}`,
    };

    if (assistantRes.ok) {
      assistant = await assistantRes.json();
      const model = assistant.model as Record<string, unknown> | undefined;
      const messages = model?.messages as
        | Array<{ content?: string }>
        | undefined;
      const tools = model?.tools as
        | Array<{ function?: { name?: string } }>
        | undefined;
      const firstMessage = assistant.firstMessage as string | undefined;
      const serverUrl = assistant.serverUrl as string | undefined;

      results["1_business_name_in_prompt"] = {
        pass:
          messages?.[0]?.content?.includes(merchant.business_name) ?? false,
        detail: `System prompt starts with: "${messages?.[0]?.content?.slice(0, 60)}..."`,
      };

      results["1_business_name_in_greeting"] = {
        pass: firstMessage?.includes(merchant.business_name) ?? false,
        detail: `First message: "${firstMessage}"`,
      };

      results["1_lookup_order_tool"] = {
        pass:
          tools?.some((t) => t.function?.name === "lookup_order") ?? false,
        detail: `Tools: ${tools?.map((t) => t.function?.name).join(", ")}`,
      };

      results["1_search_products_tool"] = {
        pass:
          tools?.some((t) => t.function?.name === "search_products") ?? false,
        detail: "Tool must be registered on assistant",
      };

      results["1_webhook_url_correct"] = {
        pass: serverUrl?.includes("dropship.barpel.ai") ?? false,
        detail: `serverUrl: ${serverUrl}`,
      };
    }
  } else {
    results["1_assistant_exists"] = {
      pass: false,
      detail: "vapi_agent_id is null in DB",
    };
  }

  // ── CONTRACT 2: Phone number ↔ assistant link ────────────────────────────

  console.log("CONTRACT 2: Phone number ↔ assistant link...");

  if (merchant.vapi_phone_id) {
    const phoneRes = await fetch(
      `https://api.vapi.ai/phone-number/${merchant.vapi_phone_id}`,
      { headers: { Authorization: `Bearer ${VAPI_KEY}` } }
    );

    if (phoneRes.ok) {
      const phone = await phoneRes.json();
      results["2_phone_linked"] = {
        pass: phone.assistantId === merchant.vapi_agent_id,
        detail: `Phone assistantId: ${phone.assistantId} | Expected: ${merchant.vapi_agent_id}`,
      };
    } else {
      results["2_phone_linked"] = {
        pass: false,
        detail: `Vapi phone number API returned ${phoneRes.status}`,
      };
    }
  } else {
    results["2_phone_linked"] = {
      pass: false,
      detail: "vapi_phone_id is null in DB",
    };
  }

  // ── CONTRACT 3: Barpel webhook responds correctly to tool calls ──────────

  console.log("CONTRACT 3: Barpel webhook contract...");

  const toolCallId = `contract_test_${Date.now()}`;
  const webhookPayload = {
    message: {
      type: "tool-calls",
      toolCallList: [
        {
          id: toolCallId,
          name: "search_products",
          arguments: {},
        },
      ],
      call: {
        metadata: { merchant_id: merchant.id },
        assistantId: merchant.vapi_agent_id,
      },
    },
  };

  const webhookRes = await fetch(`${BASE_URL}/api/vapi/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify(webhookPayload),
  });

  const webhookData = await webhookRes.json();
  const toolResult = (
    webhookData?.results as Array<{ toolCallId: string; result: string }>
  )?.[0];

  results["3_webhook_returns_200"] = {
    pass: webhookRes.status === 200,
    detail: `Status: ${webhookRes.status}`,
  };

  results["3_toolCallId_matches"] = {
    pass: toolResult?.toolCallId === toolCallId,
    detail: `Expected: ${toolCallId} | Got: ${toolResult?.toolCallId}`,
  };

  results["3_result_is_string"] = {
    pass: typeof toolResult?.result === "string",
    detail: `Type: ${typeof toolResult?.result}`,
  };

  results["3_no_newlines_in_result"] = {
    pass: !toolResult?.result?.includes("\n"),
    detail: "Newlines break Vapi response parsing",
  };

  results["3_real_shopify_data"] = {
    pass:
      !!toolResult?.result &&
      !toolResult.result.includes("trouble") &&
      !toolResult.result.includes("couldn't"),
    detail: `Result: "${toolResult?.result?.slice(0, 80)}..."`,
  };

  // ── CONTRACT 4: Order lookup chain ────────────────────────────────────────

  console.log("CONTRACT 4: Order lookup chain...");

  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token_secret_id, shop_domain, connection_active")
    .eq("merchant_id", merchant.id)
    .eq("platform", "shopify")
    .single();

  results["4_shopify_connected"] = {
    pass: integration?.connection_active === true,
    detail: `shop_domain: ${integration?.shop_domain}`,
  };

  if (integration?.access_token_secret_id) {
    const { data: shopifyToken } = await supabase.rpc(
      "vault_read_secret_by_id",
      { p_id: integration.access_token_secret_id }
    );

    results["4_vault_readable"] = {
      pass:
        !!shopifyToken &&
        typeof shopifyToken === "string" &&
        shopifyToken.length > 10,
      detail: shopifyToken
        ? `Token readable (${shopifyToken.slice(0, 8)}...)`
        : "Token empty or missing",
    };

    // Check for real orders in store
    if (shopifyToken && integration.shop_domain) {
      const ordersRes = await fetch(
        `https://${integration.shop_domain}/admin/api/2026-01/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": shopifyToken,
          },
          body: JSON.stringify({
            query: `{ orders(first: 1) { edges { node { name displayFulfillmentStatus } } } }`,
          }),
        }
      );
      const ordersData = await ordersRes.json();
      const firstOrder = ordersData?.data?.orders?.edges?.[0]?.node as
        | { name: string; displayFulfillmentStatus: string }
        | undefined;

      results["4_store_has_orders"] = {
        pass: !!firstOrder,
        detail: firstOrder
          ? `First order: ${firstOrder.name} | Status: ${firstOrder.displayFulfillmentStatus}`
          : "⚠️  Store has zero orders — create a test order in Shopify admin first",
      };

      if (firstOrder) {
        // Test the webhook with a real order number
        const orderNum = firstOrder.name.replace("#", "");
        const orderToolPayload = {
          message: {
            type: "tool-calls",
            toolCallList: [
              {
                id: `order_test_${Date.now()}`,
                name: "lookup_order",
                arguments: { order_number: orderNum },
              },
            ],
            call: {
              metadata: { merchant_id: merchant.id },
              assistantId: merchant.vapi_agent_id,
            },
          },
        };

        const orderWebhookRes = await fetch(
          `${BASE_URL}/api/vapi/webhook`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-vapi-secret": WEBHOOK_SECRET,
            },
            body: JSON.stringify(orderToolPayload),
          }
        );
        const orderData = await orderWebhookRes.json();
        const orderResult =
          (
            orderData?.results as Array<{
              toolCallId: string;
              result: string;
            }>
          )?.[0]?.result ?? "";

        results["4_order_lookup_returns_real_data"] = {
          pass:
            !orderResult.includes("trouble") &&
            !orderResult.includes("couldn't find") &&
            !orderResult.includes("wasn't able to find") &&
            orderResult.length > 20,
          detail: `AI will say: "${orderResult.slice(0, 100)}..."`,
        };
      }
    }
  } else {
    results["4_vault_readable"] = {
      pass: false,
      detail: "No access_token_secret_id in integrations row",
    };
  }

  // ── CONTRACT 5: Outbound call API ─────────────────────────────────────────

  console.log("CONTRACT 5: Outbound call API...");

  const outboundRes = await fetch(`${BASE_URL}/api/vapi/outbound`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerPhone: "+15000000000" }),
  });

  results["5_outbound_route_exists"] = {
    pass: outboundRes.status !== 404,
    detail: `Status: ${outboundRes.status} (401 is OK — means route exists but needs auth)`,
  };

  // ── PRINT FINAL RESULTS ──────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  CONTRACT TEST RESULTS");
  console.log("═══════════════════════════════════════════════════════");

  let allPass = true;
  for (const [key, value] of Object.entries(results)) {
    const icon = value.pass ? "✅" : "❌";
    console.log(`${icon} ${key}`);
    console.log(`   ${value.detail}`);
    if (!value.pass) allPass = false;
  }

  console.log("\n═══════════════════════════════════════════════════════");

  if (allPass) {
    console.log("✅ ALL CONTRACTS PASS");
    console.log(`📞 CALL THIS NUMBER: ${merchant.support_phone}`);
    console.log(
      `🗣️  AI WILL SAY: "${(assistant as Record<string, unknown>).firstMessage}"`
    );
    console.log("");
    console.log("WHAT TO SAY ON THE CALL:");
    console.log('  Say: "Where is my order?"');

    const storeResult = results["4_store_has_orders"];
    if (storeResult?.detail?.includes("First order:")) {
      const orderNum = storeResult.detail
        .split("First order: ")[1]
        ?.split(" |")[0];
      console.log(`  Give order number: ${orderNum}`);
      console.log("  AI MUST read back real tracking/status info");
    } else {
      console.log(
        "  ⚠️  No orders in store — create one first in Shopify admin"
      );
    }
  } else {
    console.log("❌ CONTRACTS FAILED — FIX ABOVE BEFORE CALLING");
  }

  console.log("═══════════════════════════════════════════════════════\n");

  if (!allPass) process.exit(1);
}

run().catch((err) => {
  console.error("Script error:", err.message ?? err);
  process.exit(1);
});
