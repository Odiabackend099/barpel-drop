import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createVapiAssistantForTest } from "@/lib/provisioning/phoneService";

/**
 * POST /api/debug/vapi-setup
 *
 * TEST-ONLY endpoint: creates a Vapi assistant for the authenticated merchant
 * and sets provisioning_status = 'active', bypassing Twilio (no phone number).
 *
 * Used to enable E2E testing of AI Voice update/delete flows on trial Twilio accounts.
 * REMOVE THIS ENDPOINT before production launch.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  const { data: merchant, error: fetchError } = await adminSupabase
    .from("merchants")
    .select("id, business_name, custom_prompt, ai_first_message, ai_voice_id, ai_voice_provider, ai_model, vapi_agent_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  if (merchant.vapi_agent_id) {
    return NextResponse.json(
      { error: "Merchant already has a Vapi assistant", vapi_agent_id: merchant.vapi_agent_id },
      { status: 409 }
    );
  }

  let vapiAgentId: string;
  try {
    vapiAgentId = await createVapiAssistantForTest(
      merchant.business_name ?? "Support",
      merchant.custom_prompt ?? null,
      merchant.id,
      {
        firstMessage: merchant.ai_first_message ?? null,
        voiceId: merchant.ai_voice_id ?? null,
        voiceProvider: merchant.ai_voice_provider ?? null,
        model: merchant.ai_model ?? null,
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Vapi assistant creation failed: ${msg}` }, { status: 500 });
  }

  const { error: updateError } = await adminSupabase
    .from("merchants")
    .update({
      vapi_agent_id: vapiAgentId,
      provisioning_status: "active",
      provisioning_error: null,
    })
    .eq("id", merchant.id);

  if (updateError) {
    return NextResponse.json(
      { error: `DB update failed: ${updateError.message}`, vapi_agent_id: vapiAgentId },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, vapi_agent_id: vapiAgentId });
}
