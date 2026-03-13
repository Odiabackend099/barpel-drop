import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/integrations/disconnect
 * Body: { platform: 'shopify' }
 * Sets connection_active = false and deletes Vault secrets.
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

  let body: { platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const VALID_PLATFORMS = ["shopify", "tiktok_shop", "woocommerce"];
  if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
    return NextResponse.json({ error: "Invalid or missing platform" }, { status: 400 });
  }

  // Get merchant ID
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Fetch the integration to get Vault IDs before clearing
  const { data: integration } = await supabase
    .from("integrations")
    .select("id, access_token_secret_id, webhook_secret_vault_id")
    .eq("merchant_id", merchant.id)
    .eq("platform", body.platform)
    .eq("connection_active", true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Integration not found or already disconnected" }, { status: 404 });
  }

  // Use admin client to delete Vault secrets
  const adminSupabase = createAdminClient();

  // Delete access token from Vault via public RPC (vault schema not exposed through PostgREST)
  if (integration.access_token_secret_id) {
    try {
      await adminSupabase.rpc("vault_delete_secret_by_id", {
        p_id: integration.access_token_secret_id,
      });
    } catch {
      // Non-fatal — log but continue
    }
  }

  // Delete webhook secret from Vault
  if (integration.webhook_secret_vault_id) {
    try {
      await adminSupabase.rpc("vault_delete_secret_by_id", {
        p_id: integration.webhook_secret_vault_id,
      });
    } catch {
      // Non-fatal — log but continue
    }
  }

  // Mark integration as disconnected and clear Vault refs
  const { error: updateError } = await adminSupabase
    .from("integrations")
    .update({
      connection_active: false,
      access_token_secret_id: null,
      webhook_secret_vault_id: null,
    })
    .eq("id", integration.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
