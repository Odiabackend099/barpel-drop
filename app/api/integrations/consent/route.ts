import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/integrations/consent
 * Body: { platform: 'shopify', revoke?: boolean }
 * Sets or clears outbound_consent_confirmed_at on the integration row.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { platform?: string; revoke?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const VALID_PLATFORMS = ["shopify", "tiktok_shop", "woocommerce"];
  if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
    return NextResponse.json({ error: "Invalid or missing platform" }, { status: 400 });
  }

  // Get merchant ID — always derived from session, never from request body
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const adminSupabase = createAdminClient();

  const { error: updateError } = await adminSupabase
    .from("integrations")
    .update({
      outbound_consent_confirmed_at: body.revoke ? null : new Date().toISOString(),
    })
    .eq("merchant_id", merchant.id)
    .eq("platform", body.platform);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // When revoking consent, cancel all pending outbound calls for this merchant
  if (body.revoke) {
    await adminSupabase
      .from("pending_outbound_calls")
      .update({ status: "cancelled" })
      .eq("merchant_id", merchant.id)
      .eq("status", "pending");
  }

  return NextResponse.json({ success: true });
}
