import { createAdminClient } from "@/lib/supabase/admin";
import { withRetry } from "@/lib/retry";

/**
 * Base prompt for every Barpel-powered AI support assistant.
 * Appended with the merchant's custom_prompt before sending to Vapi.
 */
const BASE_PROMPT = `You are a professional AI support agent for {BUSINESS_NAME}. Your job is to help customers with:
1. Order tracking — look up their order status using the lookup_order tool
2. Return requests — initiate returns using the initiate_return tool
3. Store policies — explain policies using the get_store_policy tool

Always be warm, professional, and concise. Resolve issues in under 60 seconds when possible.
If you cannot find an order, ask for the order number politely.
Never make up tracking information. Use the tools to get real data.`;

/**
 * Maps merchant country to Twilio provisioning params.
 */
function getTwilioParams(country: string): {
  countryCode: string;
  addressSid: string | null;
  internationallyProvisioned: boolean;
} {
  switch (country) {
    case "GB":
      return {
        countryCode: "GB",
        addressSid: process.env.TWILIO_UK_ADDRESS_SID ?? null,
        internationallyProvisioned: false,
      };
    case "US":
      return {
        countryCode: "US",
        addressSid: process.env.TWILIO_US_ADDRESS_SID ?? null,
        internationallyProvisioned: false,
      };
    case "CA":
      return {
        countryCode: "CA",
        addressSid: null,
        internationallyProvisioned: false,
      };
    case "NG":
    case "GH":
    case "KE":
      // African merchants get UK numbers — flagged as internationally_provisioned
      return {
        countryCode: "GB",
        addressSid: process.env.TWILIO_UK_ADDRESS_SID ?? null,
        internationallyProvisioned: true,
      };
    default:
      return {
        countryCode: "GB",
        addressSid: process.env.TWILIO_UK_ADDRESS_SID ?? null,
        internationallyProvisioned: false,
      };
  }
}

/**
 * Purchases a Twilio phone number in the subaccount.
 * Returns { sid, phoneNumber } on success.
 * Throws with code 21631 preserved in message if UK address SID required.
 */
async function purchaseTwilioNumber(
  countryCode: string,
  addressSid: string | null
): Promise<{ sid: string; phoneNumber: string }> {
  const subAccountSid = process.env.TWILIO_SUBACCOUNT_SID;
  const subAccountAuthToken = process.env.TWILIO_SUBACCOUNT_AUTH_TOKEN;

  if (!subAccountSid || !subAccountAuthToken) {
    throw new Error("Missing TWILIO_SUBACCOUNT_SID or TWILIO_SUBACCOUNT_AUTH_TOKEN");
  }

  const credentials = Buffer.from(`${subAccountSid}:${subAccountAuthToken}`).toString("base64");
  const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${subAccountSid}`;

  // Step 1: Search for an available number
  const searchUrl = new URL(
    `${baseUrl}/AvailablePhoneNumbers/${countryCode}/Local.json`
  );
  searchUrl.searchParams.set("voiceEnabled", "true");
  searchUrl.searchParams.set("pageSize", "1");

  const searchResp = await withRetry(
    () =>
      fetch(searchUrl.toString(), {
        headers: { Authorization: `Basic ${credentials}` },
      }),
    3,
    "twilio_search_numbers"
  );

  if (!searchResp.ok) {
    const text = await searchResp.text();
    throw new Error(`Twilio number search failed (${searchResp.status}): ${text}`);
  }

  const searchData = await searchResp.json();
  const available = searchData.available_phone_numbers;

  if (!available || available.length === 0) {
    throw new Error(`No available phone numbers in ${countryCode}`);
  }

  const phoneNumber: string = available[0].phone_number;

  // Step 2: Purchase the number
  const purchaseBody = new URLSearchParams({ PhoneNumber: phoneNumber });
  if (addressSid) {
    purchaseBody.set("AddressSid", addressSid);
  }

  const purchaseResp = await withRetry(
    () =>
      fetch(`${baseUrl}/IncomingPhoneNumbers.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: purchaseBody,
      }),
    3,
    "twilio_purchase_number"
  );

  if (!purchaseResp.ok) {
    const text = await purchaseResp.text();
    // Preserve Twilio error code 21631 in the message for caller to detect
    let parsed: { code?: number; message?: string } = {};
    try { parsed = JSON.parse(text); } catch { /* non-JSON body */ }
    if (parsed.code === 21631) {
      throw new Error(`TWILIO_21631: ${parsed.message ?? "Address SID required for UK number"}`);
    }
    throw new Error(`Twilio number purchase failed (${purchaseResp.status}): ${text}`);
  }

  const purchaseData = await purchaseResp.json();
  return { sid: purchaseData.sid, phoneNumber: purchaseData.phone_number };
}

/**
 * Creates a Vapi assistant for the merchant.
 * Returns the vapi_agent_id (UUID).
 */
async function createVapiAssistant(
  businessName: string,
  customPrompt: string | null,
  merchantId: string
): Promise<string> {
  const vapiKey = process.env.VAPI_PRIVATE_KEY;
  if (!vapiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

  const basePrompt = BASE_PROMPT.replace("{BUSINESS_NAME}", businessName);
  const systemPrompt = customPrompt
    ? `${basePrompt}\n\n${customPrompt}`
    : basePrompt;

  const body = {
    name: `${businessName} Support`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
    },
    serverUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
    metadata: { merchant_id: merchantId },
    tools: [
      {
        type: "function",
        function: {
          name: "lookup_order",
          description: "Look up order status and tracking information",
          parameters: {
            type: "object",
            properties: {
              order_number: { type: "string" },
            },
            required: ["order_number"],
          },
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
        },
      },
      {
        type: "function",
        function: {
          name: "initiate_return",
          description: "Initiate a return request and send SMS",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string" },
              order_number: { type: "string" },
            },
          },
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
        },
      },
      {
        type: "function",
        function: {
          name: "get_store_policy",
          description: "Get the store's return policy",
          parameters: {
            type: "object",
            properties: {},
          },
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
        },
      },
    ],
  };

  const resp = await withRetry(
    () =>
      fetch("https://api.vapi.ai/assistant", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vapiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }),
    3,
    "vapi_create_assistant"
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Vapi assistant creation failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.id as string;
}

/**
 * Imports the Twilio number into Vapi and links it to the assistant.
 * Returns the vapi_phone_id (UUID).
 * Uses POST /phone-number/import per RESEARCH_NOTES.md R-1.
 */
async function importNumberIntoVapi(
  phoneNumber: string,
  agentId: string
): Promise<string> {
  const vapiKey = process.env.VAPI_PRIVATE_KEY;
  const subAccountSid = process.env.TWILIO_SUBACCOUNT_SID;
  const subAccountAuthToken = process.env.TWILIO_SUBACCOUNT_AUTH_TOKEN;

  if (!vapiKey) throw new Error("Missing VAPI_PRIVATE_KEY");
  if (!subAccountSid || !subAccountAuthToken) {
    throw new Error("Missing TWILIO_SUBACCOUNT_SID or TWILIO_SUBACCOUNT_AUTH_TOKEN");
  }

  const resp = await withRetry(
    () =>
      fetch("https://api.vapi.ai/phone-number/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vapiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "twilio",
          number: phoneNumber,
          twilioAccountSid: subAccountSid,
          twilioAuthToken: subAccountAuthToken,
          assistantId: agentId,
        }),
      }),
    3,
    "vapi_import_number"
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Vapi number import failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.id as string;
}

/**
 * Provisions a dedicated phone line for a merchant.
 * Runs Steps A (Twilio number) → B (Vapi assistant) → C (link number to assistant).
 * Supports retry: skips any step already completed.
 *
 * @param merchantId - The merchant's UUID
 * @returns { success, error? }
 */
export async function provisionMerchantLine(
  merchantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Read current merchant state
  const { data: merchant, error: fetchError } = await supabase
    .from("merchants")
    .select(
      "country, provisioning_status, twilio_number_sid, vapi_agent_id, vapi_phone_id, business_name, custom_prompt"
    )
    .eq("id", merchantId)
    .single();

  if (fetchError || !merchant) {
    return { success: false, error: `Merchant not found: ${fetchError?.message}` };
  }

  // Already provisioned — return immediately
  if (merchant.provisioning_status === "active") {
    return { success: true };
  }

  // Mark as provisioning
  await supabase
    .from("merchants")
    .update({
      provisioning_status: "provisioning",
      provisioning_attempted_at: new Date().toISOString(),
    })
    .eq("id", merchantId);

  const { countryCode, addressSid, internationallyProvisioned } =
    getTwilioParams(merchant.country ?? "GB");

  let twilioNumberSid = merchant.twilio_number_sid as string | null;
  let purchasedPhoneNumber: string | null = null;
  let vapiAgentId = merchant.vapi_agent_id as string | null;
  let vapiPhoneId = merchant.vapi_phone_id as string | null;

  try {
    // -----------------------------------------------------------------------
    // Step A: Purchase Twilio number (skip if already done)
    // -----------------------------------------------------------------------
    if (!twilioNumberSid) {
      // UK address SID check: if country is GB and no address SID, attempt anyway.
      // Twilio returns error 21631 if address required — handle gracefully below.
      let result: { sid: string; phoneNumber: string };
      try {
        result = await purchaseTwilioNumber(countryCode, addressSid);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.startsWith("TWILIO_21631")) {
          // UK address SID required but not configured — set needs_address status
          await supabase
            .from("merchants")
            .update({
              provisioning_status: "needs_address",
              provisioning_error: msg,
            })
            .eq("id", merchantId);
          const gracefulMsg =
            "Your UK number is being set up manually. You'll receive it within 24 hours.";
          return { success: false, error: gracefulMsg };
        }
        throw err;
      }
      twilioNumberSid = result.sid;
      purchasedPhoneNumber = result.phoneNumber;

      const updatePayload: Record<string, unknown> = {
        twilio_number_sid: twilioNumberSid,
      };
      if (internationallyProvisioned) {
        updatePayload.internationally_provisioned = true;
      }

      await supabase
        .from("merchants")
        .update(updatePayload)
        .eq("id", merchantId);
    }

    // -----------------------------------------------------------------------
    // Step B: Create Vapi assistant (skip if already done)
    // -----------------------------------------------------------------------
    if (!vapiAgentId) {
      vapiAgentId = await createVapiAssistant(
        merchant.business_name ?? "Support",
        merchant.custom_prompt ?? null,
        merchantId
      );

      await supabase
        .from("merchants")
        .update({ vapi_agent_id: vapiAgentId })
        .eq("id", merchantId);
    }

    // -----------------------------------------------------------------------
    // Step C: Import number into Vapi (skip if already done)
    // -----------------------------------------------------------------------
    if (!vapiPhoneId) {
      // Need the actual E.164 phone number for Vapi import.
      // If this is a retry, look up the number from Twilio.
      if (!purchasedPhoneNumber) {
        const subAccountSid = process.env.TWILIO_SUBACCOUNT_SID;
        const subAccountAuthToken = process.env.TWILIO_SUBACCOUNT_AUTH_TOKEN;
        const credentials = Buffer.from(
          `${subAccountSid}:${subAccountAuthToken}`
        ).toString("base64");

        const numResp = await withRetry(
          () =>
            fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${subAccountSid}/IncomingPhoneNumbers/${twilioNumberSid}.json`,
              { headers: { Authorization: `Basic ${credentials}` } }
            ),
          3,
          "twilio_fetch_number"
        );

        if (!numResp.ok) {
          throw new Error("Failed to retrieve purchased Twilio number details for Vapi import");
        }

        const numData = await numResp.json();
        purchasedPhoneNumber = numData.phone_number as string;
      }

      vapiPhoneId = await importNumberIntoVapi(purchasedPhoneNumber, vapiAgentId);

      await supabase
        .from("merchants")
        .update({
          vapi_phone_id: vapiPhoneId,
          support_phone: purchasedPhoneNumber,
        })
        .eq("id", merchantId);
    }

    // All steps complete — mark active
    await supabase
      .from("merchants")
      .update({
        provisioning_status: "active",
        provisioning_error: null,
      })
      .eq("id", merchantId);

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Mark as failed with error detail
    await supabase
      .from("merchants")
      .update({
        provisioning_status: "failed",
        provisioning_error: errorMessage,
      })
      .eq("id", merchantId);

    // Log to Sentry if available (no-op in dev without DSN)
    if (typeof globalThis !== "undefined" && (globalThis as Record<string, unknown>).Sentry) {
      const Sentry = (globalThis as Record<string, unknown>).Sentry as {
        captureException: (e: unknown, ctx: unknown) => void;
      };
      Sentry.captureException(err, { extra: { merchantId } });
    }

    return { success: false, error: errorMessage };
  }
}
