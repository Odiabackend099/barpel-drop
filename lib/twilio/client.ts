import { withRetry } from "@/lib/retry";

/**
 * Sends an SMS via Twilio REST API using subaccount credentials.
 * Uses fetch directly to avoid bundling the full Twilio SDK.
 *
 * @param to - The recipient phone number (E.164 format)
 * @param body - The SMS message body
 * @param from - Optional sender number (defaults to TWILIO_NUMBER env var)
 */
export async function sendSms(
  to: string,
  body: string,
  from?: string
): Promise<void> {
  // B-17: Use TWILIO_SUBACCOUNT_SID / TWILIO_SUBACCOUNT_AUTH_TOKEN (not master)
  const accountSid = process.env.TWILIO_SUBACCOUNT_SID;
  const authToken = process.env.TWILIO_SUBACCOUNT_AUTH_TOKEN;
  const fromNumber = from ?? process.env.TWILIO_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing Twilio credentials (TWILIO_SUBACCOUNT_SID, TWILIO_SUBACCOUNT_AUTH_TOKEN, TWILIO_NUMBER)"
    );
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await withRetry(
    async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Twilio SMS failed (${response.status}): ${text}`);
      }
    },
    3,
    "twilio_send_sms"
  );
}
