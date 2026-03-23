import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import DodoPayments from "dodopayments";

/**
 * POST /api/billing/dodo/cancel
 *
 * Self-service cancellation of a Dodo USD subscription.
 * Cancels at the end of the current billing period (cancel_at_next_billing_date = true).
 * The account stays active until the period ends — credits are not revoked early.
 *
 * Security: verifies the subscription_id belongs to the authenticated merchant
 * before calling Dodo — prevents cancelling other users' subscriptions.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  let body: { subscription_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { subscription_id } = body;
  if (!subscription_id) {
    return NextResponse.json({ error: "subscription_id is required" }, { status: 400 });
  }

  // Verify this subscription belongs to the authenticated user — prevents IDOR
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, dodo_subscription_id, plan_status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  if (merchant.dodo_subscription_id !== subscription_id) {
    return NextResponse.json(
      { error: "Subscription not found on this account" },
      { status: 403 }
    );
  }

  if (merchant.plan_status === "cancelled" || merchant.plan_status === "expired") {
    return NextResponse.json(
      { error: "Subscription is already cancelled or expired" },
      { status: 409 }
    );
  }

  try {
    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
      environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode") as
        | "test_mode"
        | "live_mode",
    });

    await dodo.subscriptions.update(subscription_id, {
      cancel_at_next_billing_date: true,
    });
  } catch (err) {
    console.error("[dodo/cancel] Dodo API error:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to cancel subscription. Please try again." },
      { status: 502 }
    );
  }

  // Mark as cancelled in DB — webhook will confirm and null out the subscription ID
  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("merchants")
    .update({ plan_status: "cancelled" })
    .eq("id", merchant.id);

  return NextResponse.json({
    success: true,
    message: "Your subscription will remain active until the end of the current billing period.",
  });
}
