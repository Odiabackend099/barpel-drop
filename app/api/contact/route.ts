import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendLeadNotificationEmail,
  sendLeadAutoReplyEmail,
} from "@/lib/email/client";
import { rateLimit } from "@/lib/rate-limit";
import { notifyOwner } from "@/lib/twilio/whatsapp";

// ─── Email format validation ──────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Slack notification ───────────────────────────────────────────────────────
async function notifySlack(lead: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  interest?: string;
  message?: string;
  source_url?: string;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // Slack optional — silently skip if not configured

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🔥 *New Sales Lead — ${lead.name}${lead.company ? ` @ ${lead.company}` : ""}*`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🔥 New Contact Form Submission" },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Name:*\n${lead.name}` },
            { type: "mrkdwn", text: `*Email:*\n${lead.email}` },
            { type: "mrkdwn", text: `*Company:*\n${lead.company || "—"}` },
            { type: "mrkdwn", text: `*Phone:*\n${lead.phone || "—"}` },
            { type: "mrkdwn", text: `*Interest:*\n${lead.interest || "—"}` },
            { type: "mrkdwn", text: `*Source:*\n${lead.source_url || "Direct"}` },
          ],
        },
        ...(lead.message
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Message:*\n${lead.message}`,
                },
              },
            ]
          : []),
        {
          type: "actions",
          elements: [
            {
              type: "button",
              style: "primary",
              text: { type: "plain_text", text: "Reply via Email" },
              url: `mailto:${lead.email}`,
            },
          ],
        },
      ],
    }),
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Rate limit — 1 per IP per 10 min, cross-instance via Redis
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    if (await rateLimit(`rl:contact:${ip}`, 1, 10 * 60)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a few minutes." },
        { status: 429 }
      );
    }
  } catch (e) {
    // Redis not configured — log and continue, don't block legitimate submissions
    console.error("[contact] Rate limit check failed:", e);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    name,
    email,
    company,
    phone,
    interest,
    message,
    source_url,
    utm_source,
    utm_medium,
    utm_campaign,
    honeypot, // hidden field — bots fill it, humans don't
  } = body as Record<string, string | undefined>;

  // 2. Honeypot check — return 200 silently so bots don't retry
  if (honeypot) {
    return NextResponse.json({ success: true });
  }

  // 3. Validate required fields
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const lead = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: company?.trim() || undefined,
    phone: phone?.trim() || undefined,
    interest: interest?.trim() || undefined,
    message: message.trim(),
    source_url: source_url?.trim() || undefined,
    utm_source: utm_source?.trim() || undefined,
    utm_medium: utm_medium?.trim() || undefined,
    utm_campaign: utm_campaign?.trim() || undefined,
  };

  // 4. Store lead in DB — best-effort, never blocks the response
  const adminSupabase = createAdminClient();
  adminSupabase
    .from("leads")
    .insert(lead)
    .then(({ error }) => {
      if (error) console.error("[contact] Failed to insert lead:", error);
    });

  // 5. Fire notifications in parallel — errors are logged but don't fail the response
  await Promise.allSettled([
    sendLeadNotificationEmail(lead).catch((e) =>
      console.error("[contact] Team email failed:", e)
    ),
    notifySlack(lead).catch((e) =>
      console.error("[contact] Slack notification failed:", e)
    ),
    sendLeadAutoReplyEmail(lead).catch((e) =>
      console.error("[contact] Auto-reply failed:", e)
    ),
  ]);

  // WhatsApp ping to founder — fire and forget, never blocks the response
  notifyOwner(
    `Contact form: ${lead.name} (${lead.email})${lead.interest ? ` — ${lead.interest}` : ""}`
  ).catch(console.error);

  return NextResponse.json({ success: true });
}
