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

  // custom_app=barpel-connect: use the Barpel AI Connect custom app credentials
  // instead of the main "Barpel Drop AI" app. Required for stores that can't
  // install the main Draft app (different Shopify org).
  const customApp = searchParams.get("custom_app");
  let installClientId: string | undefined;

  if (customApp === "barpel-connect") {
    if (!isValidShop) {
      console.error("[shopify oauth start] custom_app=barpel-connect requires ?shop param");
      if (returnTo === "integrations") {
        return NextResponse.redirect(`${baseUrl}/dashboard/integrations?shopify_error=missing_shop_for_custom_app`);
      }
      return NextResponse.redirect(`${baseUrl}/onboarding?step=2&shopify_error=missing_shop_for_custom_app`);
    }

    installClientId = process.env.BARPEL_CONNECT_CLIENT_ID;
    if (!installClientId) {
      console.error("[shopify oauth start] BARPEL_CONNECT_CLIENT_ID env var missing");
      if (returnTo === "integrations") {
        return NextResponse.redirect(`${baseUrl}/dashboard/integrations?shopify_error=missing_custom_app_credentials`);
      }
      return NextResponse.redirect(`${baseUrl}/onboarding?step=2&shopify_error=missing_custom_app_credentials`);
    }
  }

  const flowType = isValidShop ? "direct" : "managed";
  const { url, nonce } = isValidShop
    ? buildDirectInstallUrl(knownShop, redirectUri, installClientId)
    : buildInstallUrl(redirectUri);

  console.log("[shopify oauth start]", {
    flowType,
    merchantId: merchant.id,
    hasShopParam: isValidShop,
    returnTo,
    redirectUri,
    appType: customApp === "barpel-connect" ? "barpel-connect" : "main",
  });

  // Store nonce in database — shop_domain is null for managed install flow.
  // Also null for barpel-connect custom app flow: Dev Dashboard apps may return
  // a different shop domain format in the callback. HMAC verification is the
  // authoritative security check; shop_domain is only a secondary defence.
  const adminSupabase = createAdminClient();
  const isCustomApp = customApp === "barpel-connect";
  const { error: stateError } = await adminSupabase
    .from("oauth_states")
    .insert({
      state: nonce,
      merchant_id: merchant.id,
      shop_domain: (isValidShop && !isCustomApp) ? knownShop : null,
      return_to: returnTo,
      app_type: isCustomApp ? "barpel-connect" : null,
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
