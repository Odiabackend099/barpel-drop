import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures a webhook event is processed exactly once.
 * Inserts the event_id into the webhook_events table.
 * If it already exists (unique constraint violation), returns false.
 *
 * @param eventId - The external event identifier (Stripe event ID, Vapi call ID, etc.)
 * @param source - The webhook source ('stripe' | 'vapi' | 'shopify' | 'twilio')
 * @param adminClient - Supabase client with service role (bypasses RLS)
 * @returns true if this is a new event to process, false if duplicate
 */
export async function ensureIdempotent(
  eventId: string,
  source: "stripe" | "vapi" | "shopify" | "twilio",
  adminClient: SupabaseClient
): Promise<boolean> {
  const { error } = await adminClient
    .from("webhook_events")
    .insert({ event_id: eventId, source });

  if (error?.code === "23505") {
    // PostgreSQL unique violation — this event was already processed
    return false;
  }

  if (error) {
    throw new Error(`Idempotency check failed: ${error.message}`);
  }

  return true;
}
