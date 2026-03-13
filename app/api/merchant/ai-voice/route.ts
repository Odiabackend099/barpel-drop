import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitiseMerchantPrompt } from "@/lib/sanitise";
import {
  getAssistant,
  updateAssistant,
  deleteAssistant,
  deletePhoneNumber,
} from "@/lib/vapi/client";
import {
  BASE_PROMPT,
  VALID_VOICE_IDS,
  VALID_AI_MODELS,
  VALID_VOICE_PROVIDERS,
} from "@/lib/constants";

/**
 * PATCH /api/merchant/ai-voice
 *
 * Updates one or more AI voice settings for the authenticated merchant.
 * Saves to DB first (single source of truth), then syncs to Vapi via GET-then-PATCH
 * (fire-and-forget) to avoid wiping nested Vapi model fields.
 *
 * Body (all optional):
 *   custom_prompt     - AI personality system prompt (max 500 chars, sanitized)
 *   ai_first_message  - Greeting spoken when call connects (max 200 chars, sanitized)
 *   ai_voice_id       - Vapi native voice ID (whitelisted)
 *   ai_voice_provider - Voice provider (whitelisted)
 *   ai_model          - LLM model (whitelisted)
 */
export async function PATCH(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    custom_prompt?: string;
    ai_first_message?: string;
    ai_voice_id?: string;
    ai_voice_provider?: string;
    ai_model?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dbUpdate: Record<string, string> = {};
  let sanitizedPrompt: string | undefined;
  let sanitizedFirstMessage: string | undefined;

  // Validate and sanitize custom_prompt
  if (body.custom_prompt !== undefined) {
    const result = sanitiseMerchantPrompt(body.custom_prompt);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.blockedReason ?? "Prompt contains restricted content" },
        { status: 422 }
      );
    }
    dbUpdate.custom_prompt = result.sanitized;
    sanitizedPrompt = result.sanitized;
  }

  // Validate and sanitize ai_first_message
  if (body.ai_first_message !== undefined) {
    if (body.ai_first_message.length > 200) {
      return NextResponse.json(
        { error: "ai_first_message must be 200 characters or fewer" },
        { status: 400 }
      );
    }
    const result = sanitiseMerchantPrompt(body.ai_first_message);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.blockedReason ?? "First message contains restricted content" },
        { status: 422 }
      );
    }
    dbUpdate.ai_first_message = result.sanitized;
    sanitizedFirstMessage = result.sanitized;
  }

  // Validate ai_voice_id against whitelist
  if (body.ai_voice_id !== undefined) {
    if (!VALID_VOICE_IDS.includes(body.ai_voice_id)) {
      return NextResponse.json(
        { error: `ai_voice_id must be one of: ${VALID_VOICE_IDS.join(", ")}` },
        { status: 400 }
      );
    }
    dbUpdate.ai_voice_id = body.ai_voice_id;
  }

  // Validate ai_voice_provider against whitelist
  if (body.ai_voice_provider !== undefined) {
    if (!(VALID_VOICE_PROVIDERS as readonly string[]).includes(body.ai_voice_provider)) {
      return NextResponse.json(
        { error: `ai_voice_provider must be one of: ${VALID_VOICE_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }
    dbUpdate.ai_voice_provider = body.ai_voice_provider;
  }

  // Validate ai_model against whitelist
  if (body.ai_model !== undefined) {
    if (!(VALID_AI_MODELS as readonly string[]).includes(body.ai_model)) {
      return NextResponse.json(
        { error: `ai_model must be one of: ${VALID_AI_MODELS.join(", ")}` },
        { status: 400 }
      );
    }
    dbUpdate.ai_model = body.ai_model;
  }

  if (Object.keys(dbUpdate).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Save to DB first — single source of truth
  const { data: merchant, error: dbError } = await supabase
    .from("merchants")
    .update(dbUpdate)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select(
      "id, business_name, vapi_agent_id, custom_prompt, ai_first_message, ai_voice_id, ai_voice_provider, ai_model"
    )
    .single();

  if (dbError || !merchant) {
    return NextResponse.json(
      { error: dbError?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  // Sync to Vapi if assistant exists — GET-then-PATCH to avoid wiping nested fields
  if (merchant.vapi_agent_id) {
    syncToVapi(merchant, sanitizedPrompt, sanitizedFirstMessage, body).catch(
      (e: Error) => {
        console.error("[vapi] ai-voice sync failed:", e.message);
      }
    );
  }

  // Strip internal field before returning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vapi_agent_id: _va, ...merchantPublic } = merchant;
  return NextResponse.json({ success: true, merchant: merchantPublic });
}

/**
 * Fire-and-forget Vapi sync. GET current assistant, merge changes, PATCH back.
 * Separated into its own async function so PATCH route can return immediately.
 */
async function syncToVapi(
  merchant: {
    vapi_agent_id: string;
    business_name: string | null;
    custom_prompt: string | null;
    ai_first_message: string | null;
    ai_voice_id: string | null;
    ai_voice_provider: string | null;
    ai_model: string | null;
  },
  sanitizedPrompt: string | undefined,
  sanitizedFirstMessage: string | undefined,
  body: {
    ai_voice_id?: string;
    ai_voice_provider?: string;
    ai_model?: string;
  }
): Promise<void> {
  const existing = await getAssistant(merchant.vapi_agent_id);
  const existingModel = (existing.model as Record<string, unknown>) ?? {};
  const existingVoice = (existing.voice as Record<string, unknown>) ?? {};

  const patch: Record<string, unknown> = {};

  // Update system prompt — prepend BASE_PROMPT, keep existing model config
  if (sanitizedPrompt !== undefined) {
    const basePrompt = BASE_PROMPT.replace(
      "{BUSINESS_NAME}",
      merchant.business_name ?? "Support"
    );
    const fullSystemPrompt = sanitizedPrompt
      ? `${basePrompt}\n\n${sanitizedPrompt}`
      : basePrompt;

    patch.model = {
      ...existingModel,
      ...(body.ai_model ? { model: body.ai_model } : {}),
      messages: [{ role: "system", content: fullSystemPrompt }],
    };
  } else if (body.ai_model) {
    // Model changed but prompt didn't — update model field only
    patch.model = {
      ...existingModel,
      model: body.ai_model,
    };
  }

  // Update first message (top-level Vapi field)
  if (sanitizedFirstMessage !== undefined) {
    patch.firstMessage = sanitizedFirstMessage;
  }

  // Update voice config — merge with existing to avoid wiping stability/similarity
  if (body.ai_voice_id || body.ai_voice_provider) {
    patch.voice = {
      ...existingVoice,
      ...(body.ai_voice_provider ? { provider: body.ai_voice_provider } : {}),
      ...(body.ai_voice_id ? { voiceId: body.ai_voice_id } : {}),
    };
  }

  if (Object.keys(patch).length > 0) {
    await updateAssistant(merchant.vapi_agent_id, patch);
  }
}

/**
 * DELETE /api/merchant/ai-voice
 *
 * Removes the merchant's AI phone line and Vapi assistant.
 * Deletion order matters for billing:
 *   1. Delete Vapi phone number first (stops billing immediately)
 *   2. Delete Vapi assistant
 *   3. Clear all Vapi references from DB
 *
 * Partial Vapi failures are logged but do not block the DB cleanup.
 * Returns 409 if provisioning is currently in progress.
 */
export async function DELETE() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client for the full merchant read (vapi fields not exposed via regular select)
  const adminSupabase = createAdminClient();

  const { data: merchant, error: fetchError } = await adminSupabase
    .from("merchants")
    .select("id, vapi_agent_id, vapi_phone_id, provisioning_status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Reject if provisioning is currently in flight — deleting mid-provision causes race condition
  if (merchant.provisioning_status === "provisioning") {
    return NextResponse.json(
      { error: "Provisioning is in progress. Please wait before removing the AI phone line." },
      { status: 409 }
    );
  }

  const vapiErrors: string[] = [];

  // Step 1: Delete Vapi phone number FIRST (stops billing)
  if (merchant.vapi_phone_id) {
    try {
      await deletePhoneNumber(merchant.vapi_phone_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      vapiErrors.push(`Phone number deletion failed: ${msg}`);
      console.error("[vapi] phone number delete failed:", msg);
    }
  }

  // Step 2: Delete Vapi assistant
  if (merchant.vapi_agent_id) {
    try {
      await deleteAssistant(merchant.vapi_agent_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      vapiErrors.push(`Assistant deletion failed: ${msg}`);
      console.error("[vapi] assistant delete failed:", msg);
    }
  }

  // Step 3: Clear all Vapi references from DB regardless of Vapi errors
  // DB must be clean so merchant can re-provision
  const { error: clearError } = await adminSupabase
    .from("merchants")
    .update({
      vapi_agent_id: null,
      vapi_phone_id: null,
      twilio_number_sid: null,
      support_phone: null,
      provisioning_status: "pending",
      provisioning_error: null,
    })
    .eq("id", merchant.id);

  if (clearError) {
    return NextResponse.json(
      { error: `DB cleanup failed: ${clearError.message}` },
      { status: 500 }
    );
  }

  if (vapiErrors.length > 0) {
    // DB is clean, but Vapi cleanup had issues — log and return success
    // Merchant can re-provision; Vapi resources may be orphaned (manual cleanup needed)
    console.error("[vapi] partial cleanup errors:", vapiErrors);
  }

  return NextResponse.json({ success: true });
}
