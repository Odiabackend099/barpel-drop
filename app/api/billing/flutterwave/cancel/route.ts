import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * Self-service subscription cancellation.
 *
 * Cancels the merchant's Flutterwave subscription via their API,
 * then clears subscription columns locally. Credit balance is NOT
 * touched — merchant keeps remaining minutes until they run out.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, flw_subscription_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  if (!merchant.flw_subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  // Cancel with Flutterwave — if API fails, don't clear local columns
  const flwRes = await fetch(
    `https://api.flutterwave.com/v3/subscriptions/${merchant.flw_subscription_id}/cancel`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    }
  );

  if (!flwRes.ok) {
    const body = await flwRes.text();
    console.error("[flw/cancel] Flutterwave API error:", body);
    return NextResponse.json(
      { error: "Failed to cancel subscription. Please try again." },
      { status: 500 }
    );
  }

  // Clear subscription columns — balance untouched
  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("merchants")
    .update({
      flw_subscription_id: null,
      flw_plan: null,
      plan_status: "cancelled",
    })
    .eq("id", merchant.id);

  return NextResponse.json({ success: true });
}
