import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendActivationEmail } from "@/lib/email/client";

/**
 * Day 3 activation check — runs daily at 9am UTC via Vercel Cron.
 *
 * Finds merchants who completed onboarding 3+ days ago, have an active AI line,
 * but have received 0 calls. Sends them an email showing exactly where to put
 * their phone number so customers can find it.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Find merchants who:
  // 1. Completed onboarding (step >= 4)
  // 2. Have an active AI line (provisioning_status = 'active')
  // 3. Signed up 3+ days ago
  // 4. Haven't been sent the activation email yet
  // 5. Haven't been deleted
  const { data: candidates } = await supabase
    .from("merchants")
    .select("id, business_name, support_phone, user_id")
    .gte("onboarding_step", 4)
    .eq("provisioning_status", "active")
    .lte("created_at", threeDaysAgo)
    .is("activation_email_sent_at", null)
    .is("deleted_at", null);

  if (!candidates?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let sent = 0;

  for (const merchant of candidates) {
    // Check if merchant has had any calls (NOT EXISTS pattern)
    const { count } = await supabase
      .from("call_logs")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .limit(1);

    if ((count ?? 0) > 0) continue; // Has calls — skip

    // Get merchant's email from auth
    const { data: authData } = await supabase.auth.admin.getUserById(
      merchant.user_id
    );
    const email = authData?.user?.email;
    if (!email) continue;

    try {
      await sendActivationEmail({
        to: email,
        businessName: merchant.business_name,
        supportPhone: merchant.support_phone ?? "",
      });

      // Mark as sent so we never email this merchant again
      await supabase
        .from("merchants")
        .update({ activation_email_sent_at: new Date().toISOString() })
        .eq("id", merchant.id);

      sent++;
    } catch (err) {
      console.error(
        `[activation-check] Failed to send email for merchant ${merchant.id}:`,
        err
      );
    }
  }

  return NextResponse.json({ processed: candidates.length, sent });
}
