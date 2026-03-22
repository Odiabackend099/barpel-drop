import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendSupportTicketConfirmEmail,
  sendSupportTeamNotificationEmail,
} from "@/lib/email/client";
import { rateLimit } from "@/lib/rate-limit";
import { notifyOwner } from "@/lib/twilio/whatsapp";

// ─── Valid categories ────────────────────────────────────────────────────────
const VALID_CATEGORIES = [
  "Technical Issue",
  "Billing & Payments",
  "Account & Settings",
  "Feature Request",
  "Other",
];

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
  // 1. Authenticate
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit — 3 per userId per hour, cross-instance via Redis
  if (await rateLimit(`rl:support:${user.id}`, 3, 60 * 60)) {
    return NextResponse.json(
      { error: "Too many support requests. Please wait before submitting again." },
      { status: 429 }
    );
  }

  // 3. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { category, subject, message } = body as Record<string, string | undefined>;

  // 4. Validate
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Please select a valid category." },
      { status: 400 }
    );
  }

  if (!subject?.trim() || subject.trim().length < 3 || subject.trim().length > 120) {
    return NextResponse.json(
      { error: "Subject must be 3–120 characters." },
      { status: 400 }
    );
  }

  if (!message?.trim() || message.trim().length < 10 || message.trim().length > 2000) {
    return NextResponse.json(
      { error: "Message must be 10–2000 characters." },
      { status: 400 }
    );
  }

  // 5. Generate ticket ref
  const ticketRef = "BRP-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  const userEmail = user.email ?? "";
  const firstName = userEmail.split("@")[0] ?? "there";

  // 6. Store in leads table (with explicit status to satisfy DB constraint)
  const adminSupabase = createAdminClient();
  const { error: dbError } = await adminSupabase.from("leads").insert({
    name: firstName,
    email: userEmail,
    interest: category,
    message: message.trim(),
    source_url: "dashboard_support",
    notes: ticketRef,
    status: "new", // ← Explicit status to satisfy CHECK constraint
  });

  if (dbError) {
    console.error("[support] Failed to insert ticket:", dbError);
    return NextResponse.json(
      { error: "Failed to submit your request. Please try again." },
      { status: 500 }
    );
  }

  // 7. Send emails with proper error tracking (not silent failure)
  const emailResults = await Promise.allSettled([
    sendSupportTicketConfirmEmail(
      userEmail,
      firstName,
      ticketRef,
      subject.trim(),
    ),
    sendSupportTeamNotificationEmail({
      ticketRef,
      category,
      subject: subject.trim(),
      message: message.trim(),
      userEmail,
      firstName,
    }),
  ]);

  // Log email failures for admin visibility
  const confirmEmailFailed = emailResults[0].status === "rejected";
  const teamEmailFailed = emailResults[1].status === "rejected";

  if (confirmEmailFailed) {
    console.error(
      `[support] User confirmation email failed for ticket ${ticketRef}:`,
      emailResults[0].status === "rejected" ? emailResults[0].reason : null
    );
  }

  if (teamEmailFailed) {
    console.error(
      `[support] Team notification email failed for ticket ${ticketRef}:`,
      emailResults[1].status === "rejected" ? emailResults[1].reason : null
    );
  }

  // WhatsApp ping to founder — immediate visibility, fire and forget
  notifyOwner(`[${ticketRef}] Support from ${userEmail}: ${subject.trim()}`).catch(console.error);

  // Ticket is persisted in DB, so return success. Users will see the ticketRef
  // and support team can look it up. Email failures are logged for admin alerts.
  return NextResponse.json({ success: true, ticketRef });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[support] Unhandled error:", msg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
