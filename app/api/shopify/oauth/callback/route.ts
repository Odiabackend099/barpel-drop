import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verifyHmacSha256 } from "@/lib/security";
import { exchangeCodeForToken } from "@/lib/shopify/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Shopify OAuth callback.
 * Verifies CSRF state from database (not cookies — they are unreliable on
 * Vercel serverless). Verifies HMAC (hex for OAuth), exchanges code for token,
 * stores token in Vault, generates per-shop webhook secret, and registers
 * the abandoned cart webhook.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim();

  // Track where the OAuth flow originated so errors redirect to the right page.
  // Updated after oauth_states is read (defaults to onboarding for early errors).
  let returnTo: "onboarding" | "integrations" = "onboarding";

  function redirectError(errorCode: string) {
    if (returnTo === "integrations") {
      const dest = new URL(`${baseUrl}/dashboard/integrations`);
      dest.searchParams.set("shopify_error", errorCode);
      return NextResponse.redirect(dest.toString());
    }
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

  // ── CSRF verification via database (replaces cookie-based nonce) ──────────
  const adminSupabase = createAdminClient();

  const { data: oauthState } = await adminSupabase
    .from("oauth_states")
    .select("merchant_id, shop_domain, created_at, return_to")
    .eq("state", state)
    .single();

  if (!oauthState) {
    return redirectError("csrf_mismatch");
  }

  // Now we know where the flow started — update redirect target
  if (oauthState.return_to === "integrations") {
    returnTo = "integrations";
  }

  // Check expiry (10 minutes)
  const stateAge = Date.now() - new Date(oauthState.created_at).getTime();
  if (stateAge > OAUTH_STATE_TTL_MS) {
    await adminSupabase.from("oauth_states").delete().eq("state", state);
    return redirectError("csrf_mismatch");
  }

  // Verify shop matches what was originally requested.
  // When shop_domain is null (one-button flow), skip this check — the HMAC
  // verification below already proves the shop param came from Shopify.
  if (oauthState.shop_domain && oauthState.shop_domain !== shop) {
    await adminSupabase.from("oauth_states").delete().eq("state", state);
    return redirectError("shop_mismatch");
  }

  // Delete the used state (single-use token — prevents replay attacks)
  await adminSupabase.from("oauth_states").delete().eq("state", state);

  // ── Verify Shopify HMAC — OAuth callback uses hex encoding (NOT base64) ──
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

  // Look up merchant using admin client (bypasses RLS).
  // We trust oauthState.merchant_id — it was stored during an authenticated
  // request in /api/shopify/oauth/start. The RLS client's auth cookie may be
  // stale after the Shopify redirect hop (middleware doesn't run on this route).
  const { data: merchant } = await adminSupabase
    .from("merchants")
    .select("id, user_id")
    .eq("id", oauthState.merchant_id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return redirectError("merchant_not_found");
  }

  // Trust oauth_states as the sole authority for merchant identity.
  // The session cookie on this domain may belong to a different user
  // (e.g. barpel-ai.odia.dev vs barpel-drop-ai.vercel.app) or be
  // expired after the Shopify redirect hop. The oauth_state was created
  // server-side during an authenticated request — that's sufficient.

  const merchantId = merchant.id;

  // B-14: Store access token in Supabase Vault via public wrapper functions.
  // vault.* schema is not exposed through PostgREST, so we use
  // public.vault_create_secret / public.vault_update_secret wrappers.
  const accessTokenSecretName = `shopify-token-${merchantId}`;
  let accessTokenSecretId: string | null = null;
  try {
    const { data: existingRows } = await adminSupabase
      .rpc("vault_lookup_secret_by_name", { p_name: accessTokenSecretName });

    const existingId = Array.isArray(existingRows) && existingRows[0]?.id
      ? existingRows[0].id as string
      : null;

    if (existingId) {
      const { error: updateError } = await adminSupabase
        .rpc("vault_update_secret", { p_id: existingId, p_secret: accessToken });
      if (updateError) throw new Error(updateError.message);
      accessTokenSecretId = existingId;
    } else {
      const { data: secretId, error: createError } = await adminSupabase
        .rpc("vault_create_secret", {
          p_secret: accessToken,
          p_name: accessTokenSecretName,
          p_description: `Shopify OAuth token for merchant ${merchantId}`,
        });
      if (createError) throw new Error(createError.message);
      accessTokenSecretId = secretId as string;
    }
  } catch (err) {
    console.error("[shopify callback] Failed to store token in Vault:", err);
    return redirectError("vault_store_failed");
  }

  // B-14: Generate and store per-shop webhook secret in Vault (upsert — non-fatal)
  const webhookSecretName = `shopify-webhook-secret-${merchantId}`;
  let webhookSecretVaultId: string | null = null;
  try {
    const webhookSecret = randomBytes(32).toString("hex");
    const { data: existingRows } = await adminSupabase
      .rpc("vault_lookup_secret_by_name", { p_name: webhookSecretName });

    const existingId = Array.isArray(existingRows) && existingRows[0]?.id
      ? existingRows[0].id as string
      : null;

    if (existingId) {
      const { error: updateError } = await adminSupabase
        .rpc("vault_update_secret", { p_id: existingId, p_secret: webhookSecret });
      if (updateError) throw new Error(updateError.message);
      webhookSecretVaultId = existingId;
    } else {
      const { data: webhookSecretId, error: createError } = await adminSupabase
        .rpc("vault_create_secret", {
          p_secret: webhookSecret,
          p_name: webhookSecretName,
          p_description: `Shopify webhook HMAC secret for merchant ${merchantId}`,
        });
      if (createError) throw new Error(createError.message);
      webhookSecretVaultId = webhookSecretId as string;
    }
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
    console.error("[shopify callback] checkouts/create webhook registration failed:", err);
    // Non-fatal — merchant can reconnect later
  }

  // Register orders/create webhook — cancels pending abandoned cart calls
  // when customer completes purchase (prevents calling buyers)
  try {
    await fetch(`https://${shop}/admin/api/2026-01/webhooks.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic: "orders/create",
          address: `${baseUrl}/api/outbound/order-completed`,
          format: "json",
        },
      }),
    });
  } catch (err) {
    console.error("[shopify callback] orders/create webhook registration failed:", err);
    // Non-fatal
  }

  // Redirect based on where the OAuth flow started
  if (returnTo === "onboarding") {
    return NextResponse.redirect(`${baseUrl}/onboarding?step=3&shopify_connected=1`);
  }
  return NextResponse.redirect(`${baseUrl}/dashboard/integrations?connected=shopify`);
}
