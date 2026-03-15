import { withRetry } from "@/lib/retry";

/**
 * Initiates an outbound call via the Vapi API.
 *
 * @param assistantId - The Vapi assistant ID configured for the merchant
 * @param phoneNumberId - The Vapi phone number ID to call from
 * @param customerPhone - The customer's phone number (E.164)
 * @param metadata - Additional context passed to the assistant
 * @returns The Vapi call ID
 */
export async function initiateOutboundCall(
  assistantId: string,
  phoneNumberId: string,
  customerPhone: string,
  metadata: Record<string, string>
): Promise<string> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

  const response = await withRetry(
    () =>
      fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId,
          phoneNumberId,
          customer: { number: customerPhone },
          metadata,
        }),
      }),
    3,
    "vapi_outbound_call"
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vapi outbound call failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Fetches the full Vapi assistant object.
 * Required before PATCH to avoid wiping nested fields (Vapi replaces, not merges).
 *
 * @param assistantId - The Vapi assistant ID
 * @returns Full assistant object from Vapi
 */
export async function getAssistant(
  assistantId: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

  const response = await withRetry(
    () =>
      fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    3,
    "vapi_get_assistant"
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vapi get assistant failed (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * PATCHes a Vapi assistant with arbitrary fields.
 * Always GET the assistant first and merge changes to avoid wiping nested objects.
 *
 * @param assistantId - The Vapi assistant ID
 * @param patch - Partial assistant object to PATCH
 */
export async function updateAssistant(
  assistantId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

  const response = await withRetry(
    () =>
      fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      }),
    3,
    "vapi_update_assistant"
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vapi update assistant failed (${response.status}): ${text}`);
  }
}

/**
 * Deletes a Vapi assistant.
 * Treats 404 as success (assistant already deleted).
 *
 * @param assistantId - The Vapi assistant ID
 */
export async function deleteAssistant(assistantId: string): Promise<void> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

  const response = await withRetry(
    () =>
      fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    3,
    "vapi_delete_assistant"
  );

  // 404 = already deleted — treat as success
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Vapi delete assistant failed (${response.status}): ${text}`);
  }
}

/**
 * Deletes a Vapi phone number.
 * Must be called BEFORE deleteAssistant — phone number references the assistant.
 * After deletion the merchant will not be billed for this number.
 * Treats 404 as success (number already deleted).
 *
 * @param phoneNumberId - The Vapi phone number ID
 */
export async function deletePhoneNumber(phoneNumberId: string): Promise<void> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) throw new Error("Missing VAPI_PRIVATE_KEY");

  const response = await withRetry(
    () =>
      fetch(`https://api.vapi.ai/phone-number/${phoneNumberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    3,
    "vapi_delete_phone_number"
  );

  // 404 = already deleted — treat as success
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Vapi delete phone number failed (${response.status}): ${text}`);
  }
}
