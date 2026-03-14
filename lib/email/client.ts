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
export async function sendActivationEmail(opts: {
  to: string;
  businessName: string;
  supportPhone: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`;

  await getResend().emails.send({
    from: `Barpel AI <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
    to: opts.to,
    subject: "Your Barpel AI line is ready — here's where to add it",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1B2A4A;">
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

        <p style="margin-top: 24px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #00A99D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Go to your dashboard →
          </a>
        </p>

        <p style="margin-top: 32px; font-size: 12px; color: #8AADA6;">
          — The Barpel AI Team
        </p>
      </div>
    `,
  });
}
