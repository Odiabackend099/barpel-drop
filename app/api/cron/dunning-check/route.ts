import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendPaymentFailedEmail,
  sendPaymentReminderEmail,
  sendFinalWarningEmail,
} from "@/lib/email/client";
import { sendSms } from "@/lib/twilio/client";

/**
 * Daily dunning check — runs at 10am UTC via Vercel Cron.
 *
 * Detects merchants whose subscription renewal is overdue by checking
 * plan_renewal_due_at < NOW(). Flutterwave does NOT fire a charge.failed
 * webhook for subscription renewals, so silence = failure.
 *
 * State machine: active → past_due → past_due_restricted → past_due_final → cancelled
 *
 * Timeline:
 *   Day 0-1: Email "payment didn't go through", set past_due
 *   Day 3:   Reminder email "update your card"
 *   Day 7:   Final warning email + SMS "AI line pauses in 48h"
 *   Day 9:   Restrict service (AI answers with billing notice)
 *   Day 14:  Full restriction (calls declined)
 *   Day 30:  Cancel FLW subscription via API
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    return NextResponse.json({ error: "Cron endpoint disabled" }, { status: 401 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // Find merchants with overdue renewals (plan_renewal_due_at has passed)
  // Skip merchants without plan_renewal_due_at (legacy merchants before migration)
  const { data: overdue } = await supabase
    .from("merchants")
    .select("id, user_id, business_name, flw_subscription_id, flw_plan, plan_status, plan_renewal_due_at, dunning_email_count, support_phone, cancellation_attempted_at, billing_cycle")
    .not("flw_subscription_id", "is", null)
    .not("plan_renewal_due_at", "is", null)
    .lt("plan_renewal_due_at", now.toISOString())
    .neq("plan_status", "cancelled")
    .is("deleted_at", null);

  if (!overdue?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const merchant of overdue) {
    const daysOverdue = Math.floor(
      (now.getTime() - new Date(merchant.plan_renewal_due_at).getTime()) /
        (24 * 60 * 60 * 1000)
    );

    // Get merchant email for notifications
    let email: string | undefined;
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(merchant.user_id);
      email = authData?.user?.email ?? undefined;
    } catch {
      // Can't send email — continue with status updates only
    }

    const updates: Record<string, unknown> = {};

    // Day 0-1: First notification
    if (daysOverdue >= 0 && merchant.dunning_email_count === 0) {
      updates.plan_status = "past_due";
      updates.dunning_started_at = now.toISOString();
      updates.dunning_email_count = 1;

      if (email) {
        try {
          await sendPaymentFailedEmail(email, merchant.business_name);
        } catch (err) {
          console.error(`[dunning] Failed email for merchant ${merchant.id}:`, (err as Error).message);
        }
      }
    }

    // Day 3: Reminder email
    else if (daysOverdue >= 3 && merchant.dunning_email_count === 1) {
      updates.dunning_email_count = 2;

      if (email) {
        try {
          await sendPaymentReminderEmail(email, merchant.business_name);
        } catch (err) {
          console.error(`[dunning] Reminder email failed for merchant ${merchant.id}:`, (err as Error).message);
        }
      }
    }

    // Day 7: Final warning email + SMS
    else if (daysOverdue >= 7 && merchant.dunning_email_count === 2) {
      updates.dunning_email_count = 3;

      if (email) {
        try {
          await sendFinalWarningEmail(email, merchant.business_name);
        } catch (err) {
          console.error(`[dunning] Final warning email failed for merchant ${merchant.id}:`, (err as Error).message);
        }
      }

      // Also send SMS if merchant has a phone number
      if (merchant.support_phone) {
        try {
          await sendSms(
            merchant.support_phone,
            `Barpel AI: Your payment is overdue. Your AI support line will be paused in 48 hours. Update your card at ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`
          );
        } catch (err) {
          console.error(`[dunning] SMS failed for merchant ${merchant.id}:`, (err as Error).message);
        }
      }
    }

    // Day 9: Restrict service — AI still answers but with billing warning
    else if (daysOverdue >= 9 && merchant.plan_status !== "past_due_restricted" && merchant.plan_status !== "past_due_final") {
      updates.plan_status = "past_due_restricted";
    }

    // Day 14: Full restriction — calls declined
    else if (daysOverdue >= 14 && merchant.plan_status !== "past_due_final") {
      updates.plan_status = "past_due_final";
    }

    // Cancel subscription with Flutterwave — Day 30 for monthly, Day 45 for annual (higher-value)
    // Skip if we already attempted cancellation within the last 23 hours to prevent
    // repeated daily API calls when FLW returns an error
    const cancelThreshold = merchant.billing_cycle === "annual" ? 45 : 30;
    if (daysOverdue >= cancelThreshold && merchant.flw_subscription_id) {
      const lastAttempt = merchant.cancellation_attempted_at
        ? new Date(merchant.cancellation_attempted_at).getTime()
        : 0;
      if (now.getTime() - lastAttempt < 23 * 60 * 60 * 1000) {
        // Too soon to retry — skip without incrementing processed count
        continue;
      }

      // Record the attempt regardless of outcome (throttle future retries)
      updates.cancellation_attempted_at = now.toISOString();

      try {
        const flwRes = await fetch(
          `https://api.flutterwave.com/v3/subscriptions/${merchant.flw_subscription_id}/cancel`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
          }
        );
        if (!flwRes.ok) {
          // FLW returned a non-2xx status — do not clear local subscription state
          // cancellation_attempted_at is already set above to throttle tomorrow's retry
          console.error(`[dunning] FLW cancel returned ${flwRes.status} for merchant ${merchant.id}`);
        } else {
          // Confirmed by FLW — safe to clear subscription and mark cancelled
          updates.plan_status = "cancelled";
          updates.flw_subscription_id = null;
          updates.flw_plan = null;
          updates.cancellation_confirmation_at = now.toISOString();
        }
      } catch (err) {
        // Network or timeout error — do not clear local subscription state
        console.error(`[dunning] FLW cancel threw for merchant ${merchant.id}:`, (err as Error).message);
      }
    }

    // Apply updates if any — use WHERE guard to prevent race with subscription.renewed webhook
    if (Object.keys(updates).length > 0) {
      // Re-read merchant to avoid race condition with subscription.renewed webhook
      const { data: fresh } = await supabase
        .from("merchants")
        .select("plan_status")
        .eq("id", merchant.id)
        .single();

      // If webhook already reset to 'active', skip dunning update
      if (fresh?.plan_status === "active") continue;

      await supabase
        .from("merchants")
        .update(updates)
        .eq("id", merchant.id)
        .neq("plan_status", "active");

      processed++;
    }
  }

  // Dodo dunning fallback — check Dodo subscribers who might have missed webhooks
  const { data: dodoMerchants } = await supabase
    .from("merchants")
    .select("id, user_id, business_name, dodo_subscription_id, plan_status, dunning_email_count, support_phone, cancellation_attempted_at, billing_cycle")
    .not("dodo_subscription_id", "is", null)
    .neq("plan_status", "cancelled")
    .is("deleted_at", null);

  if (dodoMerchants?.length) {
    const dodoApiKey = process.env.DODO_API_KEY;
    if (!dodoApiKey) {
      console.error("[dunning] DODO_API_KEY not configured — skipping Dodo dunning checks");
    } else {
      for (const merchant of dodoMerchants) {
        try {
          // Fetch current subscription status from Dodo API
          const dodoRes = await fetch(
            `https://api.dodopayments.com/subscriptions/${merchant.dodo_subscription_id}`,
            {
              headers: { Authorization: `Bearer ${dodoApiKey}` },
            }
          );

          if (!dodoRes.ok) {
            console.warn(`[dunning] Dodo API returned ${dodoRes.status} for merchant ${merchant.id}`);
            continue;
          }

          const dodoSub = await dodoRes.json();
          const status = dodoSub?.status?.toLowerCase();

          // Only enter dunning if status is past_due or failed, and plan_status is still active
          if ((status === "past_due" || status === "failed") && merchant.plan_status === "active") {
            const updates: Record<string, unknown> = {};
            updates.plan_status = "past_due";
            updates.dunning_started_at = now.toISOString();
            updates.dunning_email_count = 1;

            // Get merchant email for notifications
            let email: string | undefined;
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(merchant.user_id);
              email = authData?.user?.email ?? undefined;
            } catch {
              // Can't send email — continue with status updates only
            }

            if (email) {
              try {
                await sendPaymentFailedEmail(email, merchant.business_name);
              } catch (err) {
                console.error(`[dunning] Failed email for Dodo merchant ${merchant.id}:`, (err as Error).message);
              }
            }

            // Apply updates
            await supabase
              .from("merchants")
              .update(updates)
              .eq("id", merchant.id)
              .eq("plan_status", "active");

            processed++;
          }
        } catch (err) {
          console.error(`[dunning] Dodo check error for merchant ${merchant.id}:`, (err as Error).message);
        }
      }
    }
  }

  return NextResponse.json({ processed, total: (overdue?.length ?? 0) + (dodoMerchants?.length ?? 0) });
}
