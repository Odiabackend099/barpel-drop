import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildInstallUrl } from "@/lib/shopify/oauth";

/**
 * Initiates the Shopify OAuth flow — ONE button, NO shop domain input.
 *
 * The merchant clicks "Connect with Shopify" and is redirected to Shopify's
 * login page. Shopify provides the shop domain in the callback — the merchant
 * never types it.
 *
 * GET /api/shopify/oauth/start?returnTo=onboarding|integrations
 */
export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim();
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const { searchParams } = new URL(request.url);
  const returnTo =
    searchParams.get("returnTo") === "integrations"
      ? "integrations"
      : "onboarding";

  // Look up merchant for the authenticated user
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim();
    if (returnTo === "integrations") {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?shopify_error=merchant_not_found`);
    }
    return NextResponse.redirect(`${baseUrl}/onboarding?step=2&shopify_error=merchant_not_found`);
  }

  const redirectUri = `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").trim()}/api/shopify/oauth/callback`;
  const { url, nonce } = buildInstallUrl(redirectUri);

  // Store nonce in database — shop_domain is null because we don't know it yet.
  // Shopify provides it in the callback; HMAC verification ensures authenticity.
  const adminSupabase = createAdminClient();
  const { error: stateError } = await adminSupabase
    .from("oauth_states")
    .insert({
      state: nonce,
      merchant_id: merchant.id,
      shop_domain: null,
      return_to: returnTo,
    });

  if (stateError) {
    console.error("[shopify oauth start] Failed to store state:", stateError);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim();
    if (returnTo === "integrations") {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?shopify_error=internal`);
    }
    return NextResponse.redirect(`${baseUrl}/onboarding?step=2&shopify_error=internal`);
  }

  return NextResponse.redirect(url);
}
