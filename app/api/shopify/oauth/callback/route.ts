import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { verifyHmacSha256 } from "@/lib/security";
import { exchangeCodeForToken } from "@/lib/shopify/oauth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shopify OAuth callback.
 * Verifies HMAC (hex for OAuth), exchanges code for token,
 * stores token in Vault, generates per-shop webhook secret,
 * and registers the abandoned cart webhook.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  // Helper: redirect back to onboarding step 2 with a human-readable error code
  function redirectError(errorCode: string) {
    const dest = new URL(`${baseUrl}/onboarding`);
    dest.searchParams.set("step", "2");
    dest.searchParams.set("shopify_error", errorCode);
    return NextResponse.redirect(dest.toString());
  }

  // B-15: Handle OAuth denial FIRST — before any other logic
  const shopifyDenied = searchParams.get("error");
  if (shopifyDenied) {
    const returnUrl = new URL("/onboarding", baseUrl);
    returnUrl.searchParams.set("step", "2");
    returnUrl.searchParams.set("shopify_denied", "1");
    return NextResponse.redirect(returnUrl.toString());
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop");
  const hmac = searchParams.get("hmac");

  // Validate required params — all four must be present
  if (!code || !state || !shop || !hmac) {
    return redirectError("missing_params");
  }

  // Verify CSRF nonce
  const cookieStore = cookies();
  const savedNonce = cookieStore.get("shopify_oauth_nonce")?.value;
  const savedShop = cookieStore.get("shopify_oauth_shop")?.value;

  if (!savedNonce || state !== savedNonce) {
    return redirectError("csrf_mismatch");
  }

  if (savedShop && savedShop !== shop) {
    return redirectError("shop_mismatch");
  }

  // Verify Shopify HMAC — OAuth callback uses hex encoding (NOT base64)
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret || !hmac) {
    return redirectError("missing_secret");
  }

  const params = new URLSearchParams(searchParams);
  params.delete("hmac");
  params.sort();
  const message = Buffer.from(params.toString());
  if (!verifyHmacSha256(message, apiSecret, hmac)) {
    return redirectError("invalid_hmac");
  }

  // Exchange code for permanent access token
  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(shop, code);
  } catch {
    return redirectError("token_exchange_failed");
  }

  // Fetch shop display name from Shopify (non-fatal — falls back to domain)
  let shopName = shop;
  try {
    const shopRes = await fetch(`https://${shop}/admin/api/2026-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });
    if (shopRes.ok) {
      const shopData = await shopRes.json();
      shopName = shopData.shop?.name ?? shop;
    }
  } catch {
    // non-fatal
  }

  // Get authenticated user
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) {
    return redirectError("merchant_not_found");
  }

  const merchantId = merchant.id;
  const adminSupabase = createAdminClient();

  // B-14: Store access token in Supabase Vault — never raw in DB
  let accessTokenSecretId: string | null = null;
  try {
    const { data: secretId, error: vaultError } = await adminSupabase
      .schema("vault")
      .rpc("create_secret", {
        secret: accessToken,
        name: `shopify-token-${merchantId}`,
        description: `Shopify OAuth token for merchant ${merchantId}`,
      });

    if (vaultError) {
      throw new Error(vaultError.message);
    }

    accessTokenSecretId = secretId as string;
  } catch (err) {
    console.error("[shopify callback] Failed to store token in Vault:", err);
    return redirectError("vault_store_failed");
  }

  // B-14: Generate and store per-shop webhook secret in Vault
  let webhookSecretVaultId: string | null = null;
  try {
    const webhookSecret = randomBytes(32).toString("hex");
    const { data: webhookSecretId, error: webhookVaultError } = await adminSupabase
      .schema("vault")
      .rpc("create_secret", {
        secret: webhookSecret,
        name: `shopify-webhook-secret-${merchantId}`,
        description: `Shopify webhook HMAC secret for merchant ${merchantId}`,
      });

    if (webhookVaultError) {
      throw new Error(webhookVaultError.message);
    }

    webhookSecretVaultId = webhookSecretId as string;
  } catch (err) {
    console.error("[shopify callback] Failed to store webhook secret in Vault:", err);
    // Non-fatal — fall back to SHOPIFY_API_SECRET for webhook verification
  }

  // Upsert integration — store Vault UUID references (not raw tokens)
  await adminSupabase.from("integrations").upsert(
    {
      merchant_id: merchantId,
      platform: "shopify",
      shop_domain: shop,
      shop_name: shopName,
      access_token_secret_id: accessTokenSecretId,
      webhook_secret_vault_id: webhookSecretVaultId,
      connection_active: true,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "merchant_id,platform" }
  );

  // B-14: Register Shopify abandoned cart webhook
  try {
    await fetch(`https://${shop}/admin/api/2026-01/webhooks.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic: "checkouts/create",
          address: `${baseUrl}/api/outbound/abandoned-cart`,
          format: "json",
        },
      }),
    });
  } catch (err) {
    console.error("[shopify callback] Webhook registration failed:", err);
    // Non-fatal — merchant can reconnect later
  }

  // Clear OAuth cookies
  cookieStore.delete("shopify_oauth_nonce");
  cookieStore.delete("shopify_oauth_shop");

  // Redirect back to onboarding Step 2 with connected confirmation
  return NextResponse.redirect(
    `${baseUrl}/onboarding?connected=shopify&shop_name=${encodeURIComponent(shopName)}`
  );
}
