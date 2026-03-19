import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Sends a welcome email to a new merchant after signup.
 * Fire-and-forget — never blocks the signup or auth flow.
 * No-ops silently if RESEND_API_KEY is not configured.
 * Idempotency key prevents duplicate emails if triggered from multiple paths.
 */

/** HTML-escape user-supplied strings before interpolating into email HTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ queued: false, reason: "resend_not_configured" });
  }
  const resend = new Resend(apiKey);

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://dropship.barpel.ai";
  // Escape name to prevent HTML injection; truncate to 100 chars as a safeguard.
  const safeName = name ? escapeHtml(name.slice(0, 100)) : null;
  const greeting = safeName ? `Hey ${safeName}` : "Hey there";

  // Fire and forget — don't await, don't block.
  // Deduplication by design: signup/route.ts handles email/password (no OAuth code exchange),
  // callback/route.ts handles Google OAuth (signup/route.ts is never called for OAuth users).
  resend.emails
    .send({
      from: "Austyn from Barpel AI <hello@barpel.ai>",
      to: email,
      subject: "Your AI support line is almost ready",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1B2A4A;">
          <p>${greeting},</p>
          <p>You just signed up for Barpel AI — great decision.</p>
          <p>You're 3 steps away from having an AI answer your customer support calls 24/7.</p>
          <p>
            <a href="${baseUrl}/onboarding"
               style="background:#0d9488;color:white;padding:12px 24px;border-radius:8px;
                      text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;">
              Continue setup →
            </a>
          </p>
          <p>Takes about 2 minutes. No technical knowledge needed.</p>
          <p>— Austyn<br>Founder, Barpel AI</p>
          <p style="font-size:12px;color:#8AADA6;margin-top:24px;">
            Reply to this email if you have any questions. I read every reply.
          </p>
        </div>
      `,
    })
    .catch(console.error);

  return NextResponse.json({ queued: true });
}
