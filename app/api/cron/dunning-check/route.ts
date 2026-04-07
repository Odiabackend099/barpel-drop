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
 * Approved billing providers: Dodo Payments + Shopify Managed Billing ONLY.
 *
 * Dodo webhooks handle most dunning (subscription.on_hold fires on payment failure).
 * This cron is a fallback for merchants whose webhook was missed.
 *
 * State machine: active → past_due → past_due_restricted → past_due_final → cancelled
 *
 * Timeline:
 *   Day 0-1: Email "payment didn't go through", set past_due
 *   Day 3:   Reminder email "update your card"
 *   Day 7:   Final warning email + SMS "AI line pauses in 48h"
 *   Day 9:   Restrict service (AI answers with billing notice)
 *   Day 14:  Full restriction (calls declined)
 *   Day 30/45: Cancel via Dodo API (monthly/annual)
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
  let processed = 0;

  // Dodo dunning — check subscribers who may have missed webhooks
  const { data: dodoMerchants } = await supabase
    .from("merchants")
    .select("id, user_id, business_name, dodo_subscription_id, plan_status, plan_renewal_due_at, dunning_email_count, support_phone, cancellation_attempted_at, billing_cycle")
    .not("dodo_subscription_id", "is", null)
    .neq("plan_status", "cancelled")
    .is("deleted_at", null);

  if (dodoMerchants?.length) {
    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!dodoApiKey) {
      console.error("[dunning] DODO_PAYMENTS_API_KEY not configured — skipping Dodo dunning checks");
    } else {
      for (const merchant of dodoMerchants) {
        try {
          const dodoRes = await fetch(
            `https://api.dodopayments.com/subscriptions/${merchant.dodo_subscription_id}`,
            { headers: { Authorization: `Bearer ${dodoApiKey}` }, signal: AbortSignal.timeout(8000) }
          );

          if (!dodoRes.ok) {
            console.warn(`[dunning] Dodo API returned ${dodoRes.status} for merchant ${merchant.id}`);
            continue;
          }

          const dodoSub = await dodoRes.json();
          const status = dodoSub?.status?.toLowerCase();

          // Only enter dunning if Dodo reports past_due/failed and we haven't started yet
          if ((status === "past_due" || status === "failed") && merchant.plan_status === "active") {
            let email: string | undefined;
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(merchant.user_id);
              email = authData?.user?.email ?? undefined;
            } catch {
              // Can't fetch email — continue with DB update only
            }

            if (email) {
              try {
                await sendPaymentFailedEmail(email, merchant.business_name);
              } catch (err) {
                console.error(`[dunning] Failed email for Dodo merchant ${merchant.id}:`, (err as Error).message);
              }
            }

            await supabase
              .from("merchants")
              .update({
                plan_status: "past_due",
                dunning_started_at: now.toISOString(),
                dunning_email_count: 1,
              })
              .eq("id", merchant.id)
              .eq("plan_status", "active");

            processed++;
            continue;
          }

          // Continue escalation for merchants already in dunning
          if (!merchant.plan_renewal_due_at) continue;

          const daysOverdue = Math.floor(
            (now.getTime() - new Date(merchant.plan_renewal_due_at).getTime()) /
              (24 * 60 * 60 * 1000)
          );
          if (daysOverdue < 0) continue;

          let email: string | undefined;
          try {
            const { data: authData } = await supabase.auth.admin.getUserById(merchant.user_id);
            email = authData?.user?.email ?? undefined;
          } catch {
            // Can't fetch email — continue with DB update only
          }

          const updates: Record<string, unknown> = {};

          if (daysOverdue >= 3 && merchant.dunning_email_count === 1) {
            updates.dunning_email_count = 2;
            if (email) {
              try { await sendPaymentReminderEmail(email, merchant.business_name); }
              catch (err) { console.error(`[dunning] Reminder email failed for merchant ${merchant.id}:`, (err as Error).message); }
            }
          } else if (daysOverdue >= 7 && merchant.dunning_email_count === 2) {
            updates.dunning_email_count = 3;
            if (email) {
              try { await sendFinalWarningEmail(email, merchant.business_name); }
              catch (err) { console.error(`[dunning] Final warning email failed for merchant ${merchant.id}:`, (err as Error).message); }
            }
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
          } else if (daysOverdue >= 9 && merchant.plan_status !== "past_due_restricted" && merchant.plan_status !== "past_due_final") {
            updates.plan_status = "past_due_restricted";
          } else if (daysOverdue >= 14 && merchant.plan_status !== "past_due_final") {
            updates.plan_status = "past_due_final";
          }

          // Cancel via Dodo API — Day 30 for monthly, Day 45 for annual
          const cancelThreshold = merchant.billing_cycle === "annual" ? 45 : 30;
          if (daysOverdue >= cancelThreshold) {
            const lastAttempt = merchant.cancellation_attempted_at
              ? new Date(merchant.cancellation_attempted_at).getTime()
              : 0;
            if (now.getTime() - lastAttempt < 23 * 60 * 60 * 1000) continue;

            updates.cancellation_attempted_at = now.toISOString();

            try {
              const cancelRes = await fetch(
                `https://api.dodopayments.com/subscriptions/${merchant.dodo_subscription_id}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${dodoApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ cancel_at_next_billing_date: true }),
                  signal: AbortSignal.timeout(8000),
                }
              );
              if (cancelRes.ok) {
                updates.plan_status = "cancelled";
                updates.dodo_subscription_id = null;
                updates.dodo_plan = null;
                updates.cancellation_confirmation_at = now.toISOString();
              } else {
                console.error(`[dunning] Dodo cancel returned ${cancelRes.status} for merchant ${merchant.id}`);
              }
            } catch (err) {
              console.error(`[dunning] Dodo cancel threw for merchant ${merchant.id}:`, (err as Error).message);
            }
          }

          if (Object.keys(updates).length > 0) {
            const { data: fresh } = await supabase
              .from("merchants")
              .select("plan_status")
              .eq("id", merchant.id)
              .single();

            if (fresh?.plan_status === "active") continue;

            await supabase
              .from("merchants")
              .update(updates)
              .eq("id", merchant.id)
              .neq("plan_status", "active");

            processed++;
          }
        } catch (err) {
          console.error(`[dunning] Dodo check error for merchant ${merchant.id}:`, (err as Error).message);
        }
      }
    }
  }

  return NextResponse.json({ processed, total: dodoMerchants?.length ?? 0 });
}
