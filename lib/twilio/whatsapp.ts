import { withRetry } from "@/lib/retry";

/**
 * Sends a WhatsApp message via Twilio REST API.
 * HTTP-only — no SDK, no bundle overhead. Same pattern as lib/twilio/client.ts.
 * OWNER NOTIFICATIONS ONLY — not customer-facing.
 *
 * Env vars:
 *   TWILIO_WHATSAPP_FROM   — E.164 number, with or without "whatsapp:" prefix
 *                            Sandbox: +14155238886  |  Prod: your registered number
 *   OWNER_WHATSAPP_NUMBERS — comma-separated E.164 numbers (spaces OK, stripped here)
 */

/** Normalise to "whatsapp:+E164" — strips ALL spaces, ensures prefix */
function toWhatsAppAddress(raw: string): string {
  const clean = raw.replace(/\s/g, ""); // strip internal spaces too (+44 7476 692326 → +447476692326)
  return clean.startsWith("whatsapp:") ? clean : `whatsapp:${clean}`;
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const rawFrom    = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !rawFrom) {
    console.warn("[whatsapp] Missing Twilio env vars — skipping notification");
    return;
  }

  const from   = toWhatsAppAddress(rawFrom);
  const toAddr = toWhatsAppAddress(to);
  const url    = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await withRetry(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: toAddr, From: from, Body: body }),
      });

      // 4xx = permanent failure (invalid number, not opted in, template required in prod)
      // Do NOT retry — retrying permanent errors wastes quota and delays response
      if (res.status >= 400 && res.status < 500) {
        const text = await res.text();
        console.error(`[whatsapp] Permanent failure (${res.status}): ${text}`);
        return; // swallow — don't throw, don't retry
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Twilio WhatsApp error (${res.status}): ${text}`); // 5xx — withRetry handles
      }
    },
    2,
    "twilio_whatsapp"
  );
}

/**
 * Sends a WhatsApp message to all configured owner numbers.
 * OWNER_WHATSAPP_NUMBERS = comma-separated E.164 numbers.
 * Spaces are stripped automatically — "+44 7476 692326" is valid in the env var.
 */
export async function notifyOwner(message: string): Promise<void> {
  const numbers = (process.env.OWNER_WHATSAPP_NUMBERS ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!numbers.length) {
    console.warn("[whatsapp] OWNER_WHATSAPP_NUMBERS not configured — skipping");
    return;
  }

  // Fire in parallel — one recipient failing doesn't block the others
  await Promise.allSettled(numbers.map((n) => sendWhatsApp(n, message)));
}
