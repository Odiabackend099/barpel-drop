import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createVapiAssistant } from "@/lib/provisioning/phoneService";
import { withRetry } from "@/lib/retry";

/**
 * POST /api/provisioning/byoc
 *
 * BYOC (Bring Your Own Credentials) — merchant provides their own Twilio
 * Account SID, Auth Token, and phone number. We verify credentials, store
 * them in Vault, create a Vapi assistant, and import the number into Vapi
 * using the merchant's Twilio account.
 *
 * Writes to the SAME columns as auto-provisioning (single source of truth).
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { accountSid?: string; authToken?: string; phoneNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { accountSid, authToken, phoneNumber } = body;

  // --- Input validation ---
  if (!accountSid?.startsWith("AC")) {
    return NextResponse.json(
      { error: "Invalid Account SID. It should start with AC." },
      { status: 400 }
    );
  }
  if (!phoneNumber?.startsWith("+")) {
    return NextResponse.json(
      { error: "Phone number must be in E.164 format, e.g. +14707620377" },
      { status: 400 }
    );
  }
  if (!authToken || authToken.length < 20) {
    return NextResponse.json(
      { error: "Invalid Auth Token." },
      { status: 400 }
    );
  }

  // --- Fetch merchant ---
  const { data: merchant } = await supabase
    .from("merchants")
    .select(
      "id, business_name, custom_prompt, ai_first_message, ai_voice_id, ai_voice_provider, ai_model, provisioning_status, provisioning_mode, provisioning_attempted_at, vapi_agent_id"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // --- Rate limit: 30-second cooldown between attempts ---
  if (merchant.provisioning_attempted_at) {
    const lastAttempt = new Date(merchant.provisioning_attempted_at).getTime();
    const cooldown = 30 * 1000; // 30 seconds
    if (Date.now() - lastAttempt < cooldown) {
      return NextResponse.json(
        { error: "Please wait 30 seconds before trying again." },
        { status: 429 }
      );
    }
  }

  // --- Guards ---
  if (merchant.provisioning_status === "provisioning") {
    return NextResponse.json(
      { error: "Provisioning is in progress. Please wait." },
      { status: 409 }
    );
  }

  if (merchant.provisioning_status === "active") {
    return NextResponse.json(
      {
        error:
          "You already have an active phone line. Remove it first before connecting a new one.",
      },
      { status: 409 }
    );
  }

  // --- Verify Twilio credentials ---
  try {
    const twilioCheck = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
      }
    );

    if (!twilioCheck.ok) {
      return NextResponse.json(
        {
          error:
            "Invalid Twilio credentials. Please check your Account SID and Auth Token.",
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to verify Twilio credentials. Please try again." },
      { status: 502 }
    );
  }

  const adminSupabase = createAdminClient();

  // --- Store credentials in Vault (upsert pattern) ---
  const secrets = [
    {
      name: `twilio-byoc-sid-${merchant.id}`,
      value: accountSid,
      description: `BYOC Twilio Account SID for merchant ${merchant.id}`,
    },
    {
      name: `twilio-byoc-token-${merchant.id}`,
      value: authToken,
      description: `BYOC Twilio Auth Token for merchant ${merchant.id}`,
    },
  ];

  for (const secret of secrets) {
    try {
      const { data: existingRows } = await adminSupabase.rpc(
        "vault_lookup_secret_by_name",
        { p_name: secret.name }
      );

      const existingId =
        Array.isArray(existingRows) && existingRows[0]?.id
          ? (existingRows[0].id as string)
          : null;

      if (existingId) {
        await adminSupabase.rpc("vault_update_secret", {
          p_id: existingId,
          p_secret: secret.value,
        });
      } else {
        await adminSupabase.rpc("vault_create_secret", {
          p_secret: secret.value,
          p_name: secret.name,
          p_description: secret.description,
        });
      }
    } catch (err) {
      console.error(
        `[byoc] Failed to store ${secret.name} in Vault:`,
        err
      );
      return NextResponse.json(
        { error: "Failed to securely store credentials. Please try again." },
        { status: 500 }
      );
    }
  }

  // --- Set status to provisioning ---
  await adminSupabase
    .from("merchants")
    .update({
      provisioning_status: "provisioning",
      provisioning_mode: "byoc",
      provisioning_attempted_at: new Date().toISOString(),
    })
    .eq("id", merchant.id);

  // --- Provision: Create Vapi assistant + import number ---
  try {
    // Step 1: Create Vapi assistant — skip if one already exists from a previous
    // partial attempt (prevents orphaned assistants in Vapi on retry)
    let vapiAgentId: string = merchant.vapi_agent_id ?? "";
    if (!merchant.vapi_agent_id) {
      vapiAgentId = await createVapiAssistant(
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

      // Save assistant ID immediately (resume point if import fails)
      await adminSupabase
        .from("merchants")
        .update({ vapi_agent_id: vapiAgentId })
        .eq("id", merchant.id);
    }

    // Step 2: Import merchant's Twilio number into Vapi
    const vapiKey = process.env.VAPI_PRIVATE_KEY;
    if (!vapiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

    const importResp = await withRetry(
      () =>
        fetch("https://api.vapi.ai/phone-number/import", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vapiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            twilioPhoneNumber: phoneNumber,
            twilioAccountSid: accountSid,
            twilioAuthToken: authToken,
            assistantId: vapiAgentId,
          }),
        }),
      3,
      "vapi_import_byoc_number"
    );

    if (!importResp.ok) {
      const errText = await importResp.text();
      throw new Error(
        `Vapi number import failed (${importResp.status}): ${errText}`
      );
    }

    const vapiPhone = await importResp.json();
    if (!vapiPhone?.id) {
      throw new Error("Vapi number import response missing phone ID");
    }

    // Step 3: Write to SAME columns as auto-provisioning
    await adminSupabase
      .from("merchants")
      .update({
        vapi_phone_id: vapiPhone.id,
        support_phone: phoneNumber,
        provisioning_status: "active",
        provisioning_mode: "byoc",
        provisioning_error: null,
      })
      .eq("id", merchant.id);

    console.log(
      `[byoc] Provisioned ${merchant.business_name}: ${phoneNumber}`
    );

    return NextResponse.json({
      success: true,
      provisioning_status: "active",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[byoc] Failed for merchant ${merchant.id}:`,
      errorMessage
    );

    await adminSupabase
      .from("merchants")
      .update({
        provisioning_status: "failed",
        provisioning_error: errorMessage,
      })
      .eq("id", merchant.id);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
