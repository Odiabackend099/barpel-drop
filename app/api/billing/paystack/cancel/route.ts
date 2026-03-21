import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import { getSubscription, disableSubscription } from "@/lib/paystack/client";

/**
 * Self-service Paystack subscription cancellation.
 *
 * Cancels the merchant's subscription via Paystack API,
 * then clears subscription columns locally.
 * Credit balance is NOT touched — merchant keeps remaining minutes.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, paystack_subscription_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  if (!merchant.paystack_subscription_id) {
    return NextResponse.json({ error: "No active Paystack subscription" }, { status: 400 });
  }

  // Fetch subscription from Paystack to get the email_token required for cancellation
  let emailToken: string;
  try {
    const sub = await getSubscription(merchant.paystack_subscription_id);
    emailToken = sub.data.email_token;
  } catch (err) {
    console.error("[paystack/cancel] Failed to fetch subscription:", (err as Error).message);
    return NextResponse.json({ error: "Failed to cancel subscription. Please try again." }, { status: 500 });
  }

  // Cancel with Paystack — if API fails, do not clear local columns
  try {
    await disableSubscription({ code: merchant.paystack_subscription_id, token: emailToken });
  } catch (err) {
    console.error("[paystack/cancel] Paystack disable error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to cancel subscription. Please try again." }, { status: 500 });
  }

  // Clear subscription columns — credit balance untouched
  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("merchants")
    .update({
      paystack_subscription_id: null,
      paystack_plan:            null,
      plan_status:              "cancelled",
    })
    .eq("id", merchant.id);

  return NextResponse.json({ success: true });
}
