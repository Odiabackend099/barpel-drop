/**
 * One-time script: Adds the search_products tool to ALL existing live Vapi assistants.
 *
 * Must be run AFTER deploying the webhook handler that supports search_products,
 * otherwise Vapi will hit the `default` case and return "I don't have that capability."
 *
 * Idempotent: checks if the tool already exists before adding.
 *
 * REQUIRES (in .env.local):
 *   VAPI_PRIVATE_KEY        — Vapi API bearer token
 *   SUPABASE_URL            — Supabase project URL
 *   SUPABASE_SERVICE_KEY    — Supabase service role key
 *   NEXT_PUBLIC_BASE_URL    — For webhook URL in tool definition
 *
 * Run: npm run patch:search-tool
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getAssistant, updateAssistant } from "@/lib/vapi/client";
import { BASE_PROMPT } from "@/lib/constants";

async function main() {
  const supabase = createAdminClient();
  const webhookUrl = `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").trim()}/api/vapi/webhook`;

  console.log("Webhook URL:", webhookUrl);

  // Find all merchants with live Vapi assistants
  const { data: merchants, error } = await supabase
    .from("merchants")
    .select("id, business_name, vapi_agent_id, custom_prompt")
    .not("vapi_agent_id", "is", null)
    .is("deleted_at", null);

  if (error) {
    console.error("Failed to fetch merchants:", error.message);
    process.exit(1);
  }

  if (!merchants || merchants.length === 0) {
    console.log("No merchants with live assistants found.");
    return;
  }

  console.log(`Found ${merchants.length} merchant(s) with live assistants.\n`);

  const searchProductsTool = {
    type: "function",
    function: {
      name: "search_products",
      description:
        "List available products from the store or search for a specific product by name. Use when customer asks what products are available, whether something is in stock, or how much something costs.",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description:
              "The product name or keyword the customer asked about. Leave empty if customer asked generally about all products.",
          },
        },
        required: [],
      },
    },
    server: { url: webhookUrl },
    messages: [
      {
        type: "request-start",
        content: "Let me check our product catalogue for you.",
      },
      {
        type: "request-failed",
        content:
          "I had trouble accessing our products. Please visit our website to browse.",
      },
    ],
  };

  for (const merchant of merchants) {
    const { id, business_name, vapi_agent_id, custom_prompt } = merchant;
    console.log(`--- ${business_name} (${id}) ---`);
    console.log(`    Assistant: ${vapi_agent_id}`);

    try {
      // GET full assistant from Vapi
      const existing = await getAssistant(vapi_agent_id);
      const existingModel = (existing.model as Record<string, unknown>) ?? {};
      const existingTools = (existingModel.tools as Array<Record<string, unknown>>) ?? [];

      // Check if search_products tool already exists
      const alreadyHasTool = existingTools.some((t) => {
        const fn = t.function as Record<string, unknown> | undefined;
        return fn?.name === "search_products";
      });

      if (alreadyHasTool) {
        console.log("    ✅ search_products tool already present — skipping");
        continue;
      }

      // Build updated system prompt
      const basePrompt = BASE_PROMPT.replace(
        "{BUSINESS_NAME}",
        business_name ?? "Support"
      );
      const fullPrompt = custom_prompt
        ? `${basePrompt}\n\n${custom_prompt}`
        : basePrompt;

      // Merge: keep existing tools, add search_products
      const updatedTools = [...existingTools, searchProductsTool];

      // PATCH full model object — Vapi replaces nested objects, not merges
      await updateAssistant(vapi_agent_id, {
        model: {
          ...existingModel,
          tools: updatedTools,
          messages: [{ role: "system", content: fullPrompt }],
        },
      });

      console.log("    ✅ Patched successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ❌ Failed: ${msg}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err: Error) => {
  console.error("Script error:", err.message);
  process.exit(1);
});
