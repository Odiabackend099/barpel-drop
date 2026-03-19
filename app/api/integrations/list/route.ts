import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/integrations/list
 * Returns all integrations for the authenticated merchant.
 * Sensitive fields (access_token_secret_id, webhook_secret_vault_id) are NOT returned.
 */
export async function GET(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  // Get merchant ID for this user
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Return safe columns only — no Vault reference IDs
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select(
      "id, platform, shop_domain, shop_name, connection_active, last_synced_at, outbound_consent_confirmed_at, created_at"
    )
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ integrations: integrations ?? [] });
}
