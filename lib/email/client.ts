import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Sends the Day 3 activation email to a merchant who has set up their AI line
 * but hasn't received any calls yet.
 */
const EMAIL_FROM = () =>
  `Barpel AI <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;

const EMAIL_STYLES =
  'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1B2A4A;';

const SIGNATURE = '<p style="margin-top: 32px; font-size: 12px; color: #8AADA6;">— The Barpel AI Team</p>';

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; padding: 12px 24px; background: #00A99D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">${label}</a>`;
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
