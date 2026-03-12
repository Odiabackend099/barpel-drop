import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitiseMerchantPrompt } from "@/lib/sanitise";
import { updateAssistantPrompt } from "@/lib/vapi/client";

const BASE_PROMPT = `You are a professional AI support agent for {BUSINESS_NAME}. Your job is to help customers with:
1. Order tracking — look up their order status using the lookup_order tool
2. Return requests — initiate returns using the initiate_return tool
3. Store policies — explain policies using the get_store_policy tool

Always be warm, professional, and concise. Resolve issues in under 60 seconds when possible.
If you cannot find an order, ask for the order number politely.
Never make up tracking information. Use the tools to get real data.`;

/**
 * PATCH /api/merchant/update
 * Updates the authenticated merchant's profile.
 * Body: { business_name?, country?, custom_prompt? }
 * Sanitises custom_prompt before saving. Updates Vapi assistant if prompt changed.
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

  let body: { business_name?: string; country?: string; custom_prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const VALID_COUNTRIES = ["NG", "GB", "US", "CA", "GH", "KE"];

  const updates: Record<string, string> = {};
  let sanitizedPrompt: string | undefined;

  if (body.business_name !== undefined) {
    const name = body.business_name.trim();
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json(
        { error: "business_name must be 2–60 characters" },
        { status: 400 }
      );
    }
    updates.business_name = name;
  }

  if (body.country !== undefined) {
    if (!VALID_COUNTRIES.includes(body.country)) {
      return NextResponse.json(
        { error: `country must be one of: ${VALID_COUNTRIES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.country = body.country;
  }

  if (body.custom_prompt !== undefined) {
    // B-16: Use new { valid, sanitized, blockedReason } signature
    const result = sanitiseMerchantPrompt(body.custom_prompt);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.blockedReason ?? "Prompt contains restricted content" },
        { status: 422 }
      );
    }
    updates.custom_prompt = result.sanitized;
    sanitizedPrompt = result.sanitized;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .update(updates)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select(
      "id, business_name, country, support_phone, credit_balance, provisioning_status, onboarding_step, verified_caller_id, caller_id_verified, vapi_agent_id"
    )
    .single();

  if (error || !merchant) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  // If custom_prompt changed and merchant has a Vapi agent, update the system prompt
  if (sanitizedPrompt !== undefined && merchant.vapi_agent_id) {
    const basePrompt = BASE_PROMPT.replace("{BUSINESS_NAME}", merchant.business_name ?? "Support");
    const fullSystemPrompt = sanitizedPrompt
      ? `${basePrompt}\n\n${sanitizedPrompt}`
      : basePrompt;

    // Fire and forget — do not block the response if Vapi update fails
    updateAssistantPrompt(merchant.vapi_agent_id, fullSystemPrompt).catch(() => {
      // Non-fatal — Vapi update failure does not block the save
    });
  }

  // Return merchant without vapi_agent_id (internal field)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vapi_agent_id: _vapiAgentId, ...merchantPublic } = merchant;

  return NextResponse.json({ merchant: merchantPublic });
}
