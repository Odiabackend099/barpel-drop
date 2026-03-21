import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    // Validate environment at first use — fails fast if misconfigured
    const env = getServerEnv();
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Returns the FROM address for transactional emails.
 * Uses validated RESEND_FROM_EMAIL from environment.
 * Fails fast at startup if not configured.
 */
const EMAIL_FROM = () => {
  const env = getServerEnv();
  return `Barpel AI <${env.RESEND_FROM_EMAIL}>`;
};

const EMAIL_STYLES =
  'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1B2A4A;';

const SIGNATURE = '<p style="margin-top: 32px; font-size: 12px; color: #8AADA6;">— The Barpel AI Team</p>';

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; padding: 12px 24px; background: #00A99D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">${label}</a>`;
}

/** HTML-escape user-supplied strings before interpolating into email HTML. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface SupportTicket {
  ticketRef: string;
  category: string;
  subject: string;
  message: string;
  userEmail: string;
  firstName: string;
}

// ─── Receipt email ──────────────────────────────────────────────────────────

/** Sent after every successful payment (charge.completed + subscription.renewed). */
export async function sendReceiptEmail(opts: {
  to: string;
  planName: string;
  amount: string;
  minutesAdded: number;
  nextRenewalDate: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`;

  await getResend().emails.send({
    from: EMAIL_FROM(),
    to: opts.to,
    subject: `Receipt for Barpel AI — ${opts.planName} Plan`,
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Thank you for your payment.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #8AADA6;">Plan</td><td style="padding: 8px 0; font-weight: 600;">${opts.planName} — ${opts.amount}/month</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Date</td><td style="padding: 8px 0;">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Minutes added</td><td style="padding: 8px 0;">${opts.minutesAdded} minutes</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Next renewal</td><td style="padding: 8px 0;">${opts.nextRenewalDate}</td></tr>
        </table>

        <p style="margin-top: 24px;">${ctaButton(dashboardUrl, "View your billing dashboard →")}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          Questions? Reply to this email.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Dunning emails ─────────────────────────────────────────────────────────

/** Day 0: first notification that payment failed. */
export async function sendPaymentFailedEmail(to: string, businessName: string) {
  const billingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`;

  await getResend().emails.send({
    from: EMAIL_FROM(),
    to,
    subject: "Action needed — your Barpel AI payment didn't go through",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi there,</p>

        <p>We tried to charge the card on file for <strong>${businessName}</strong>'s Barpel AI plan, but the payment didn't go through.</p>

        <p>This usually happens when a card expires or the bank declines the charge. You can update your payment method from your billing page:</p>

        <p style="margin-top: 24px;">${ctaButton(billingUrl, "Update payment method →")}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          If you recently updated your card, you can ignore this — we'll retry automatically.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

/** Day 3: softer reminder with link to billing page. */
export async function sendPaymentReminderEmail(to: string, businessName: string) {
  const billingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`;

  await getResend().emails.send({
    from: EMAIL_FROM(),
    to,
    subject: "Reminder — please update your payment method for Barpel AI",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi there,</p>

        <p>Just a quick reminder — the payment for <strong>${businessName}</strong>'s Barpel AI plan is still outstanding.</p>

        <p>To keep your AI support line running without interruption, please update your card:</p>

        <p style="margin-top: 24px;">${ctaButton(billingUrl, "Update payment method →")}</p>

        ${SIGNATURE}
      </div>
    `,
  });
}

/** Day 7: final warning before service restriction. */
export async function sendFinalWarningEmail(to: string, businessName: string) {
  const billingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`;

  await getResend().emails.send({
    from: EMAIL_FROM(),
    to,
    subject: "Urgent — your Barpel AI line will pause in 48 hours",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi there,</p>

        <p>We've been unable to process payment for <strong>${businessName}</strong>'s Barpel AI plan.</p>

        <p style="color: #E74C3C; font-weight: 600;">Your AI support line will be paused in 48 hours if payment is not resolved.</p>

        <p>Please update your payment method now to avoid any disruption:</p>

        <p style="margin-top: 24px;">${ctaButton(billingUrl, "Update payment method →")}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          Need help? Reply to this email and we'll sort it out.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Account deleted email ──────────────────────────────────────────────────

/** Sent after account deletion (GDPR Article 17 — right to erasure). */
export async function sendAccountDeletedEmail(to: string) {
  await getResend().emails.send({
    from: EMAIL_FROM(),
    to,
    subject: "Your Barpel AI account has been deleted",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Your Barpel AI account has been permanently deleted.</p>

        <p>All personal data has been removed from our systems. Financial records are retained in anonymised form as required by law.</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          If you did not request this, contact us immediately at support@barpel.ai
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Lead / contact form emails ─────────────────────────────────────────────

interface LeadPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  interest?: string;
  message?: string;
  source_url?: string;
}

/** Internal alert: sent to support@barpel.ai when a contact form is submitted. */
export async function sendLeadNotificationEmail(lead: LeadPayload) {
  const supportEmail = "support@barpel.ai";

  await getResend().emails.send({
    from: EMAIL_FROM(),
    to: supportEmail,
    replyTo: lead.email,
    subject: `🔥 New enquiry from ${lead.name}${lead.company ? ` at ${lead.company}` : ""}`,
    html: `
      <div style="${EMAIL_STYLES}">
        <h2 style="margin-top: 0; color: #00A99D;">New Contact Form Submission</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #8AADA6; width: 120px;">Name</td>
              <td style="padding: 8px 0; font-weight: 600;">${lead.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #00A99D;">${lead.email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Company</td>
              <td style="padding: 8px 0;">${lead.company || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Phone</td>
              <td style="padding: 8px 0;">${lead.phone || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Interest</td>
              <td style="padding: 8px 0;">${lead.interest || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Source</td>
              <td style="padding: 8px 0; font-size: 12px;">${lead.source_url || "Direct"}</td></tr>
        </table>

        <div style="background: #F0FAF9; border-left: 3px solid #00A99D; padding: 16px; border-radius: 4px; margin-top: 16px;">
          <p style="margin: 0; font-size: 14px; color: #1B2A4A;">${(lead.message || "").replace(/\n/g, "<br/>")}</p>
        </div>

        <p style="margin-top: 24px;">
          ${ctaButton(`mailto:${lead.email}`, "Reply to lead →")}
        </p>

        <p style="margin-top: 16px; font-size: 12px; color: #8AADA6;">
          Submitted at ${new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" })} UTC
        </p>
      </div>
    `,
  });
}

/** Confirmation: sent to the lead immediately after they submit the contact form. */
export async function sendLeadAutoReplyEmail(lead: LeadPayload) {
  await getResend().emails.send({
    from: `Barpel AI <support@barpel.ai>`,
    to: lead.email,
    subject: "We got your message — Barpel AI",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi ${lead.name.split(" ")[0]},</p>

        <p>Thanks for reaching out — we've received your message and someone from our team will get back to you within a few hours on business days.</p>

        <p>In the meantime, you can explore what Barpel AI can do for your store:</p>

        <p style="margin-top: 24px;">${ctaButton(`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://dropship.barpel.ai"}/pricing`, "View pricing & plans →")}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          You're receiving this because you contacted us at <a href="https://dropship.barpel.ai/contact" style="color: #00A99D;">barpel.ai/contact</a>.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Activation email ───────────────────────────────────────────────────────

export async function sendActivationEmail(opts: {
  to: string;
  businessName: string;
  supportPhone: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`;

  await getResend().emails.send({
    from: EMAIL_FROM(),
    to: opts.to,
    subject: "Your Barpel AI line is ready — here's where to add it",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi there,</p>

        <p>Your AI support line is set up and ready to take calls.<br/>
        <strong>Your number: ${opts.supportPhone}</strong></p>

        <p>Here is exactly where to add it in 3 places:</p>

        <p><strong>1. Your Shopify store's Contact page</strong><br/>
        Admin → Online Store → Pages → Contact → add "Call us: ${opts.supportPhone}"</p>

        <p><strong>2. Your order confirmation emails</strong><br/>
        Admin → Settings → Notifications → Order confirmation → add the number</p>

        <p><strong>3. Your Instagram/TikTok bio</strong><br/>
        Paste ${opts.supportPhone} where customers can see it</p>

        <p>That's all. The AI does the rest.</p>

        <p style="margin-top: 24px;">${ctaButton(dashboardUrl, "Go to your dashboard →")}</p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Welcome email (CEO Raphael's personal welcome) ─────────────────────────

/** Sent to every new user immediately after signup. */
export async function sendWelcomeEmail(to: string, name?: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://dropship.barpel.ai";
  const safeName = name ? esc(name.slice(0, 100)) : null;
  const greeting = safeName ? `Hi ${safeName}` : "Hi there";

  await getResend().emails.send({
    from: `Raphael from Barpel AI <hello@barpel.ai>`,
    to,
    subject: "Welcome to Barpel Drop AI",
    html: `
      <div style="${EMAIL_STYLES}">
        <div style="display: none;">We're glad to have you on board.</div>

        <p>${greeting},</p>

        <p>My name is Raphael, CEO and co-founder of Barpel AI. We're glad to have you on board.</p>

        <p>At Barpel Drop AI, our mission is to help you identify winning products, understand your market in real time, and scale your Shopify or dropshipping business with data-driven insights and automation. You now have access to tools designed to reduce guesswork and help you make faster, smarter business decisions.</p>

        <p>As you get started, we recommend:</p>
        <ul style="color: #1B2A4A; padding-left: 20px;">
          <li style="margin-bottom: 6px;">Exploring your dashboard and available features</li>
          <li style="margin-bottom: 6px;">Testing product insights and recommendations</li>
          <li style="margin-bottom: 6px;">Reaching out to our support team if you need guidance</li>
          <li style="margin-bottom: 6px;">Staying consistent with testing and scaling strategies</li>
        </ul>

        <p>Our team is committed to supporting your growth every step of the way. If there is anything at all we can do to help, please reach out to our Customer Success Team at <a href="mailto:hello@barpel.ai" style="color: #00A99D;">hello@barpel.ai</a></p>

        <p style="margin-top: 24px;">${ctaButton(`${baseUrl}/dashboard`, "Go to your dashboard →")}</p>

        <p>Welcome once again to Barpel Drop AI — we're excited to be part of your journey.</p>

        <p style="margin-top: 24px;">
          <strong>Raphael Kposo</strong><br/>
          <span style="color: #8AADA6;">CEO, Barpel Drop AI</span>
        </p>
      </div>
    `,
  });
}

// ─── New user alert (internal — CEO + co-founder) ───────────────────────────

/** Internal alert sent to founding team when a new user signs up. */
export async function sendNewUserAlertEmail(email: string, name?: string | null) {
  const safeName = name ? esc(name.slice(0, 100)) : null;
  const displayName = safeName || email;

  await getResend().emails.send({
    from: `Barpel AI <hello@barpel.ai>`,
    to: ["raphael@barpel.ai", "austyn@barpel.ai"],
    subject: `New signup — ${displayName}`,
    html: `
      <div style="${EMAIL_STYLES}">
        <h2 style="margin-top: 0; color: #00A99D;">New User Signed Up</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #8AADA6; width: 100px;">Name</td>
              <td style="padding: 8px 0; font-weight: 600;">${safeName || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${esc(email)}" style="color: #00A99D;">${esc(email)}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Time</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" })} UTC</td></tr>
        </table>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Password reset email ───────────────────────────────────────────────────

/** Branded password reset email with secure link. */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await getResend().emails.send({
    from: `Barpel AI <hello@barpel.ai>`,
    to,
    subject: "Reset your Barpel AI password",
    html: `
      <div style="${EMAIL_STYLES}">
        <div style="display: none;">Click the link below — it expires in 1 hour.</div>

        <p>Hi there,</p>

        <p>You requested a password reset for your Barpel AI account. Click the button below to set a new password:</p>

        <p style="margin-top: 24px;">${ctaButton(resetUrl, "Reset password →")}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Password changed confirmation ──────────────────────────────────────────

/** Security notification sent after a successful password change. */
export async function sendPasswordChangedEmail(to: string) {
  await getResend().emails.send({
    from: `Barpel AI <hello@barpel.ai>`,
    to,
    subject: "Your password was changed — Barpel AI",
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi there,</p>

        <p>Your Barpel AI password was just changed successfully.</p>

        <p>If you made this change, no further action is needed.</p>

        <p style="color: #E74C3C; font-weight: 600;">If you did not make this change, please contact us immediately at <a href="mailto:support@barpel.ai" style="color: #E74C3C;">support@barpel.ai</a></p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Low credits alert ──────────────────────────────────────────────────────

/** Sent when a merchant's credit balance drops below 1 minute. Max once per 7 days. */
export async function sendLowCreditsAlertEmail(to: string, businessName: string, balanceMinutes: number) {
  const billingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`;

  await getResend().emails.send({
    from: `Barpel AI <hello@barpel.ai>`,
    to,
    subject: `You have ${balanceMinutes} minute${balanceMinutes === 1 ? "" : "s"} left — Barpel AI`,
    html: `
      <div style="${EMAIL_STYLES}">
        <p>Hi there,</p>

        <p>Your Barpel AI credit balance for <strong>${esc(businessName)}</strong> is running low — you have <strong>${balanceMinutes} minute${balanceMinutes === 1 ? "" : "s"}</strong> remaining.</p>

        <p style="color: #E74C3C; font-weight: 600;">When your credits reach zero, your AI support line will stop taking calls.</p>

        <p>Top up now to keep your line running:</p>

        <p style="margin-top: 24px;">${ctaButton(billingUrl, "Top up now →")}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #8AADA6;">
          You're receiving this because low-balance notifications are enabled in your settings.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Support ticket confirmation (user-facing) ─────────────────────────────

/** Sent to the user after they submit a support request from the dashboard. */
export async function sendSupportTicketConfirmEmail(
  to: string,
  firstName: string,
  ticketRef: string,
  subject: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://dropship.barpel.ai";

  await getResend().emails.send({
    from: `Barpel AI Support <support@barpel.ai>`,
    to,
    subject: `[${ticketRef}] We received your support request`,
    html: `
      <div style="${EMAIL_STYLES}">
        <div style="display: none;">We'll reply within a few hours on business days.</div>

        <p>Hi ${esc(firstName)},</p>

        <p>We've received your support request and our team will get back to you shortly.</p>

        <div style="background: #F0FAF9; border-left: 3px solid #00A99D; padding: 16px; border-radius: 4px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #8AADA6; width: 100px;">Ticket</td>
                <td style="padding: 4px 0; font-weight: 600; font-family: monospace;">${ticketRef}</td></tr>
            <tr><td style="padding: 4px 0; color: #8AADA6;">Subject</td>
                <td style="padding: 4px 0;">${esc(subject)}</td></tr>
          </table>
        </div>

        <p><strong>What happens next?</strong></p>
        <p>We'll reply to this email address within a few hours on business days (Mon–Fri, 9am–6pm PT). You can reply to this email to add more details.</p>

        <p style="margin-top: 16px; font-size: 13px;">Helpful links:</p>
        <ul style="font-size: 13px; padding-left: 20px;">
          <li><a href="${baseUrl}/contact" style="color: #00A99D;">FAQ & Contact page</a></li>
          <li><a href="${baseUrl}/dashboard/billing" style="color: #00A99D;">Billing dashboard</a></li>
        </ul>

        <p style="margin-top: 24px; font-size: 12px; color: #8AADA6;">
          You're receiving this because you submitted a support request from your Barpel AI dashboard.
        </p>

        ${SIGNATURE}
      </div>
    `,
  });
}

// ─── Support ticket notification (team-facing) ─────────────────────────────

/** Internal alert sent to support team + CEO when a dashboard support ticket is submitted. */
export async function sendSupportTeamNotificationEmail(ticket: SupportTicket) {
  await getResend().emails.send({
    from: `Barpel AI <hello@barpel.ai>`,
    to: "support@barpel.ai",
    cc: "raphael@barpel.ai",
    replyTo: ticket.userEmail,
    subject: `[${ticket.ticketRef}] ${ticket.category} — ${ticket.subject}`,
    html: `
      <div style="${EMAIL_STYLES}">
        <h2 style="margin-top: 0; color: #00A99D;">Dashboard Support Ticket</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #8AADA6; width: 100px;">Ticket</td>
              <td style="padding: 8px 0; font-weight: 600; font-family: monospace;">${ticket.ticketRef}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Category</td>
              <td style="padding: 8px 0;"><span style="background: #F0FAF9; color: #00A99D; padding: 2px 8px; border-radius: 4px; font-size: 13px;">${esc(ticket.category)}</span></td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">Subject</td>
              <td style="padding: 8px 0; font-weight: 600;">${esc(ticket.subject)}</td></tr>
          <tr><td style="padding: 8px 0; color: #8AADA6;">User</td>
              <td style="padding: 8px 0;"><a href="mailto:${esc(ticket.userEmail)}" style="color: #00A99D;">${esc(ticket.userEmail)}</a></td></tr>
        </table>

        <div style="background: #F0FAF9; border-left: 3px solid #00A99D; padding: 16px; border-radius: 4px; margin-top: 16px;">
          <p style="margin: 0; font-size: 14px; color: #1B2A4A;">${esc(ticket.message).replace(/\n/g, "<br/>")}</p>
        </div>

        <p style="margin-top: 24px;">
          ${ctaButton(`mailto:${ticket.userEmail}`, "Reply to user →")}
        </p>

        <p style="margin-top: 16px; font-size: 12px; color: #8AADA6;">
          Submitted at ${new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" })} UTC
        </p>
      </div>
    `,
  });
}
