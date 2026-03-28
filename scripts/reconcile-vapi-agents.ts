/**
 * reconcile-vapi-agents.ts
 *
 * Reconciles vapi_agent_id (and AI config) between the Vapi API and the DB.
 *
 * Use when merchants have a Vapi assistant that exists in the Vapi API but
 * their DB row has vapi_agent_id = null (or a stale / wrong value).
 *
 * How it works:
 *   1. Fetches ALL assistants from Vapi API (paginated)
 *   2. Each assistant has metadata.merchant_id — set at creation time
 *   3. For each assistant, loads the merchant row from the DB
 *   4. If vapi_agent_id is missing or wrong → patches it (and ai_first_message,
 *      ai_voice_id, ai_voice_provider, ai_model) from live Vapi data
 *
 * Run: npx tsx --env-file=.env.local scripts/reconcile-vapi-agents.ts
 */

import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
if (!VAPI_KEY) {
  console.error("❌ Missing env var: VAPI_PRIVATE_KEY");
  process.exit(1);
}

type VapiAssistant = {
  id: string;
  name: string;
  firstMessage?: string;
  voice?: { provider?: string; voiceId?: string };
  model?: { model?: string };
  metadata?: { merchant_id?: string };
};

async function listAllVapiAssistants(): Promise<VapiAssistant[]> {
  const all: VapiAssistant[] = [];
  const limit = 100;
  let createdAtLt: string | null = null;

  // Vapi uses cursor-based pagination via createdAtLt (not page numbers)
  while (true) {
    const url = new URL("https://api.vapi.ai/assistant");
    url.searchParams.set("limit", String(limit));
    if (createdAtLt) url.searchParams.set("createdAtLt", createdAtLt);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${VAPI_KEY}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vapi list assistants failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    const items: VapiAssistant[] = Array.isArray(data) ? data : (data.results ?? data.items ?? []);
    all.push(...items);
    if (items.length < limit) break;
    // Advance cursor to oldest item in this batch
    createdAtLt = (items[items.length - 1] as Record<string, unknown>).createdAt as string;
  }
  return all;
}

async function main() {
  const sb = createAdminClient();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("  RECONCILE: Vapi Assistants ↔ Merchants DB");
  console.log("╚══════════════════════════════════════════════════╝\n");

  console.log("Fetching all Vapi assistants...");
  const assistants = await listAllVapiAssistants();
  console.log(`Found ${assistants.length} assistant(s) in Vapi.\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let noMerchant = 0;

  for (const assistant of assistants) {
    const merchantId = assistant.metadata?.merchant_id;
    if (!merchantId) {
      console.log(`  ⚠️  Assistant "${assistant.name}" (${assistant.id}) — no merchant_id in metadata, skipping`);
      noMerchant++;
      continue;
    }

    const { data: merchant } = await sb
      .from("merchants")
      .select("id, business_name, vapi_agent_id, provisioning_status")
      .eq("id", merchantId)
      .single();

    if (!merchant) {
      console.log(`  ⚠️  Assistant "${assistant.name}" (${assistant.id}) — merchant ${merchantId} not found in DB`);
      noMerchant++;
      continue;
    }

    const needsUpdate = merchant.vapi_agent_id !== assistant.id;

    if (!needsUpdate) {
      console.log(`  ✅ ${merchant.business_name} — vapi_agent_id already correct`);
      alreadyOk++;
      continue;
    }

    console.log(`  🔧 ${merchant.business_name} — fixing vapi_agent_id`);
    console.log(`     was: ${merchant.vapi_agent_id ?? "NULL"}`);
    console.log(`     now: ${assistant.id}`);

    // Patch DB with correct agent ID + resolved AI config from Vapi
    const patch: Record<string, string | null> = {
      vapi_agent_id: assistant.id,
    };

    if (assistant.firstMessage) {
      patch.ai_first_message = assistant.firstMessage;
      console.log(`     ai_first_message: "${assistant.firstMessage.slice(0, 80)}"`);
    }
    if (assistant.voice?.voiceId) {
      patch.ai_voice_id = assistant.voice.voiceId;
      patch.ai_voice_provider = assistant.voice.provider ?? "vapi";
      console.log(`     ai_voice_id: ${assistant.voice.voiceId} (${assistant.voice.provider ?? "vapi"})`);
    }
    if (assistant.model?.model) {
      patch.ai_model = assistant.model.model;
      console.log(`     ai_model: ${assistant.model.model}`);
    }

    const { error } = await sb
      .from("merchants")
      .update(patch)
      .eq("id", merchantId);

    if (error) {
      console.error(`     ❌ DB update failed: ${error.message}`);
    } else {
      console.log(`     ✅ DB updated`);
      fixed++;
    }
  }

  console.log("\n────────────────────────────────────────────────────");
  console.log(`  Fixed:      ${fixed}`);
  console.log(`  Already OK: ${alreadyOk}`);
  console.log(`  Skipped:    ${noMerchant}`);
  console.log("────────────────────────────────────────────────────\n");

  if (fixed > 0) {
    console.log("✅ Reconciliation complete. Re-run verify-browser-call.ts to confirm.\n");
  } else if (alreadyOk > 0) {
    console.log("✅ All agents already in sync.\n");
  } else {
    console.log("⚠️  No changes made. Check Vapi for assistants with metadata.merchant_id set.\n");
  }
}

main().catch((e: Error) => {
  console.error("Script error:", e.message);
  process.exit(1);
});
