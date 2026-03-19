import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitiseMerchantPrompt } from "@/lib/sanitise";
import { getAssistant, updateAssistant } from "@/lib/vapi/client";
import { BASE_PROMPT } from "@/lib/constants";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * PATCH /api/merchant/update
 * Updates the authenticated merchant's profile.
 * Body: { business_name?, country?, custom_prompt?, notification_preferences? }
 * Sanitises custom_prompt before saving. Updates Vapi assistant if prompt changed.
 */
export async function PATCH(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  let body: {
    business_name?: string;
    country?: string;
    custom_prompt?: string;
    notification_preferences?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const VALID_COUNTRIES = ["NG", "GB", "US", "CA", "GH", "KE"];
  const VALID_NOTIFICATION_KEYS = [
    "low_balance_sms",
    "monthly_summary_email",
    "payment_receipt_email",
  ];

  const updates: Record<string, unknown> = {};
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

  if (body.notification_preferences !== undefined) {
    const prefs = body.notification_preferences;
    if (typeof prefs !== "object" || prefs === null || Array.isArray(prefs)) {
      return NextResponse.json(
        { error: "notification_preferences must be an object" },
        { status: 400 }
      );
    }
    const sanitized: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(prefs)) {
      if (!VALID_NOTIFICATION_KEYS.includes(key)) {
        return NextResponse.json(
          { error: `Unknown notification key: ${key}` },
          { status: 400 }
        );
      }
      if (typeof value !== "boolean") {
        return NextResponse.json(
          { error: `notification_preferences.${key} must be a boolean` },
          { status: 400 }
        );
      }
      sanitized[key] = value;
    }
    updates.notification_preferences = sanitized;
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

  // If custom_prompt changed and merchant has a Vapi agent, sync to Vapi
  // using GET-then-PATCH to avoid wiping tools, temperature, and other model fields
  if (sanitizedPrompt !== undefined && merchant.vapi_agent_id) {
    const basePrompt = BASE_PROMPT.replace("{BUSINESS_NAME}", merchant.business_name ?? "Support");
    const fullSystemPrompt = sanitizedPrompt
      ? `${basePrompt}\n\n${sanitizedPrompt}`
      : basePrompt;

    // Fire and forget — do not block the response if Vapi update fails
    (async () => {
      try {
        const existing = await getAssistant(merchant.vapi_agent_id!);
        const existingModel = (existing.model as Record<string, unknown>) ?? {};
        await updateAssistant(merchant.vapi_agent_id!, {
          model: {
            ...existingModel,
            messages: [{ role: "system", content: fullSystemPrompt }],
          },
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[vapi] prompt sync failed:", msg);
      }
    })();
  }

  // Return merchant without vapi_agent_id (internal field)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vapi_agent_id: _vapiAgentId, ...merchantPublic } = merchant;

  return NextResponse.json({ merchant: merchantPublic });
}
