import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/merchant/profile
 * Returns the authenticated merchant's profile row.
 * Requires a valid JWT via Supabase auth.
 */
export async function GET(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select(
      "id, business_name, country, support_phone, credit_balance, provisioning_status, onboarding_step, verified_caller_id, caller_id_verified, account_active, created_at"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  return NextResponse.json({ merchant, email: user.email ?? null });
}
