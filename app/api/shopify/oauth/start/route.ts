import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildInstallUrl, buildDirectInstallUrl } from "@/lib/shopify/oauth";
import { getAuthUser } from "@/lib/supabase/auth-guard";

/**
 * Initiates the Shopify OAuth flow.
 *
 * Primary path (no ?shop param): Managed install URL at admin.shopify.com/oauth/install.
 * Fallback path (?shop=x.myshopify.com): Direct shop OAuth URL for re-authorization.
 *
 * GET /api/shopify/oauth/start?returnTo=onboarding|integrations[&shop=x.myshopify.com]
 */
export async function GET(request: Request) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);

  if (!user) {
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
    if (returnTo === "integrations") {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?shopify_error=merchant_not_found`);
    }
    return NextResponse.redirect(`${baseUrl}/onboarding?step=2&shopify_error=merchant_not_found`);
  }

  const redirectUri = `${baseUrl}/api/shopify/oauth/callback`;

  // When shop is known (e.g. from a Shopify app-load redirect that sent the
  // merchant to the App URL), use the direct shop OAuth URL. This forces
  // re-authorization even when the app is already installed — the managed
  // install URL (admin.shopify.com/oauth/install) would just loop back.
  const knownShop = searchParams.get("shop") ?? "";
  const isValidShop = /^[a-zA-Z0-9-]+\.myshopify\.com$/.test(knownShop);
  const flowType = isValidShop ? "direct" : "managed";
  const { url, nonce } = isValidShop
    ? buildDirectInstallUrl(knownShop, redirectUri)
    : buildInstallUrl(redirectUri);

  console.log("[shopify oauth start]", {
    flowType,
    merchantId: merchant.id,
    hasShopParam: isValidShop,
    returnTo,
    redirectUri,
  });

  // Store nonce in database — shop_domain is null for managed install flow.
  // Shopify provides it in the callback; HMAC verification ensures authenticity.
  const adminSupabase = createAdminClient();
  const { error: stateError } = await adminSupabase
    .from("oauth_states")
    .insert({
      state: nonce,
      merchant_id: merchant.id,
      shop_domain: isValidShop ? knownShop : null,
      return_to: returnTo,
    });

  if (stateError) {
    console.error("[shopify oauth start] Failed to store state:", stateError);
    if (returnTo === "integrations") {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?shopify_error=internal`);
    }
    return NextResponse.redirect(`${baseUrl}/onboarding?step=2&shopify_error=internal`);
  }

  return NextResponse.redirect(url);
}
