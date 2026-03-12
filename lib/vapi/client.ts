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
 * Updates a Vapi assistant's system prompt.
 *
 * @param assistantId - The Vapi assistant ID
 * @param systemPrompt - The new system prompt text
 */
export async function updateAssistantPrompt(
  assistantId: string,
  systemPrompt: string
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
        body: JSON.stringify({
          model: {
            messages: [{ role: "system", content: systemPrompt }],
          },
        }),
      }),
    3,
    "vapi_update_prompt"
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vapi prompt update failed (${response.status}): ${text}`);
  }
}
