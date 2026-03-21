import { NextResponse } from "next/server";
import { sendWelcomeEmail, sendNewUserAlertEmail } from "@/lib/email/client";
import { notifyOwner } from "@/lib/twilio/whatsapp";

/**
 * Sends a welcome email to a new merchant after signup.
 * Fire-and-forget — never blocks the signup or auth flow.
 * No-ops silently if RESEND_API_KEY is not configured.
 * Also fires an internal alert to the founding team.
 */

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ queued: false, reason: "resend_not_configured" });
  }

  let body: { email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, name } = body;
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  // Fire and forget — don't await, don't block.
  // Deduplication by design: signup/route.ts handles email/password (no OAuth code exchange),
  // callback/route.ts handles Google OAuth (signup/route.ts is never called for OAuth users).
  Promise.allSettled([
    sendWelcomeEmail(email, name),
    sendNewUserAlertEmail(email, name),
  ]).catch(console.error);

  // WhatsApp ping to founder — fire and forget, never blocks signup
  notifyOwner(`New Barpel signup: ${name ?? "Unknown"} (${email})`).catch(console.error);

  return NextResponse.json({ queued: true });
}
