import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Atomically deducts call credits from a merchant's balance.
 * Uses the deduct_call_credits PostgreSQL function with row-level locking.
 * The DB function returns INTEGER — the actual number of seconds deducted.
 *
 * @param adminClient - Supabase service-role client
 * @param merchantId - The merchant UUID
 * @param seconds - Duration in seconds to deduct
 * @param callLogId - The associated call_log UUID
 * @returns The actual number of seconds deducted (0 if merchant has no balance)
 */
export async function deductCredits(
  adminClient: SupabaseClient,
  merchantId: string,
  seconds: number,
  callLogId: string
): Promise<number> {
  const { data, error } = await adminClient.rpc("deduct_call_credits", {
    p_merchant_id: merchantId,
    p_seconds: seconds,
    p_call_log_id: callLogId,
  });

  if (error) {
    throw new Error(`Credit deduction failed: ${error.message}`);
  }

  // DB function returns INTEGER — the actual amount deducted
  return typeof data === "number" ? data : 0;
}

/**
 * Atomically adds credits to a merchant's balance.
 * Used after a successful Stripe payment.
 *
 * @param adminClient - Supabase service-role client
 * @param merchantId - The merchant UUID
 * @param seconds - Number of seconds to add
 * @param stripePaymentId - The Stripe Payment Intent ID for audit trail
 * @returns The new balance in seconds
 */
export async function addCredits(
  adminClient: SupabaseClient,
  merchantId: string,
  seconds: number,
  stripePaymentId: string
): Promise<number> {
  const { data, error } = await adminClient.rpc("add_credits", {
    p_merchant_id: merchantId,
    p_seconds: seconds,
    p_stripe_payment_intent_id: stripePaymentId,
  });

  if (error) {
    throw new Error(`Credit addition failed: ${error.message}`);
  }

  return data as number;
}

/**
 * Fetches the current credit balance for a merchant.
 */
export async function getBalance(
  client: SupabaseClient,
  merchantId: string
): Promise<number> {
  const { data, error } = await client
    .from("merchants")
    .select("credit_balance")
    .eq("id", merchantId)
    .single();

  if (error) {
    throw new Error(`Balance fetch failed: ${error.message}`);
  }

  return data.credit_balance;
}
