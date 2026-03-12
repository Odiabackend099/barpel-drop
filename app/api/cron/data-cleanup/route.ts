import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron job: data retention cleanup.
 * Runs nightly at 2am UTC via Vercel Cron.
 *
 * Retention windows per spec 3.5:
 * - Transcripts: NULL after 90 days
 * - Caller numbers: '[RETAINED]' after 90 days
 * - Recording URLs: NULL after 30 days
 * - Webhook events: DELETE after 72 hours (not 30 days)
 */
export async function GET(request: NextRequest) {
  // B-8: CRON_SECRET bypass fix — exact pattern from spec
  // If CRON_SECRET is not defined or is empty, refuse ALL requests
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    return NextResponse.json({ error: "Cron endpoint disabled" }, { status: 401 });
  }
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // B-10: 90 days ago — null out transcripts and redact caller numbers
  const ninetyDaysAgo = new Date(
    now.getTime() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { count: transcriptCount } = await supabase
    .from("call_logs")
    .update({ transcript: null })
    .lt("started_at", ninetyDaysAgo)
    .not("transcript", "is", null);

  const { count: callerNumberCount } = await supabase
    .from("call_logs")
    .update({ caller_number: "[RETAINED]" })
    .lt("started_at", ninetyDaysAgo)
    .not("caller_number", "is", null)
    .neq("caller_number", "[RETAINED]");

  // B-10: 30 days ago — remove recording URLs
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { count: recordingCount } = await supabase
    .from("call_logs")
    .update({ recording_url: null })
    .lt("started_at", thirtyDaysAgo)
    .not("recording_url", "is", null);

  // B-10: Webhook events — delete after 72 hours (spec 3.5)
  const webhookCutoff = new Date(
    now.getTime() - 72 * 60 * 60 * 1000
  ).toISOString();

  const { count: webhookCount } = await supabase
    .from("webhook_events")
    .delete()
    .lt("processed_at", webhookCutoff);

  // Log counts (Sentry would capture these in production)
  const summary = {
    transcripts_nulled: transcriptCount ?? 0,
    caller_numbers_redacted: callerNumberCount ?? 0,
    recordings_removed: recordingCount ?? 0,
    webhooks_deleted: webhookCount ?? 0,
  };

  return NextResponse.json({
    ok: true,
    cleaned: summary,
  });
}
