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
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");

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

  // B-15: Handle OAuth denial FIRST — before any other logic.
  // Try to look up return_to from oauth_states so denial redirects to the correct page.
  const shopifyDenied = searchParams.get("error");
  if (shopifyDenied) {
    const state = searchParams.get("state");
    if (state) {
      const adminSupabase = createAdminClient();
      const { data: oauthState } = await adminSupabase
        .from("oauth_states")
        .select("return_to")
        .eq("state", state)
        .single();
      if (oauthState?.return_to === "integrations") {
        returnTo = "integrations";
      }
      await adminSupabase.from("oauth_states").delete().eq("state", state);
    }
    if (returnTo === "integrations") {
      const dest = new URL(`${baseUrl}/dashboard/integrations`);
      dest.searchParams.set("shopify_denied", "1");
      return NextResponse.redirect(dest.toString());
    }
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
    .select("merchant_id, shop_domain, created_at, return_to, app_type")
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

  // ── Verify Shopify HMAC — OAuth callback uses hex encoding (NOT base64) ──
  //
  // State is deleted AFTER HMAC verification (not before) to prevent a timing
  // attack where a forged denial request (error=access_denied&state=X) deletes
  // the state before the legitimate request arrives, causing a csrf_mismatch
  // loop. HMAC verification is the authoritative security check here.
  //
  // Credentials are chosen based on which app initiated the OAuth flow.
  // Main app uses SHOPIFY_API_SECRET; custom app uses BARPEL_CONNECT_CLIENT_SECRET.
  // Using the wrong secret produces invalid_hmac (Shopify signs with the
  // originating app's secret).
  let apiSecret: string | undefined;
  let appCredentials: { clientId: string; clientSecret: string } | undefined;

  if (oauthState.app_type === "barpel-connect") {
    const connectId = process.env.BARPEL_CONNECT_CLIENT_ID;
    const connectSecret = process.env.BARPEL_CONNECT_CLIENT_SECRET;
    if (!connectId || !connectSecret) {
      console.error("[shopify oauth callback] Barpel Connect env vars missing for app_type=barpel-connect");
      return redirectError("missing_secret");
    }
    apiSecret = connectSecret;
    appCredentials = { clientId: connectId, clientSecret: connectSecret };
  } else {
    apiSecret = process.env.SHOPIFY_API_SECRET;
  }

  if (!apiSecret) {
    return redirectError("missing_secret");
  }

  const params = new URLSearchParams(searchParams);
  params.delete("hmac");
  params.sort();
  const message = Buffer.from(params.toString());
  if (!verifyHmacSha256(message, apiSecret, hmac)) {
    return redirectError("invalid_hmac");
  }

  // Delete the used state only after HMAC verification (single-use token — prevents replay attacks)
  await adminSupabase.from("oauth_states").delete().eq("state", state);

  // Exchange code for permanent offline access token.
  // exchangeCodeForToken throws if Shopify returns an online (per-user) token.
  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(shop, code, appCredentials);
  } catch (err) {
    console.error("[shopify oauth callback] token exchange failed:", err);
    return redirectError("token_exchange_failed");
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

  const merchantId = merchant.id;

  // ── Vault storage — run both operations in parallel ───────────────────────
  // B-14: Store access token in Supabase Vault via public wrapper functions.
  // vault.* schema is not exposed through PostgREST, so we use
  // public.vault_create_secret / public.vault_update_secret wrappers.
  async function upsertVaultSecret(name: string, value: string, description: string): Promise<string> {
    const { data: existingRows } = await adminSupabase
      .rpc("vault_lookup_secret_by_name", { p_name: name });

    const existingId = Array.isArray(existingRows) && existingRows[0]?.id
      ? existingRows[0].id as string
      : null;

    if (existingId) {
      const { error } = await adminSupabase
        .rpc("vault_update_secret", { p_id: existingId, p_secret: value });
      if (error) throw new Error(error.message);
      return existingId;
    } else {
      const { data: secretId, error } = await adminSupabase
        .rpc("vault_create_secret", { p_secret: value, p_name: name, p_description: description });
      if (error) throw new Error(error.message);
      return secretId as string;
    }
  }

  const webhookSecret = randomBytes(32).toString("hex");

  const [accessTokenResult, webhookSecretResult] = await Promise.all([
    upsertVaultSecret(
      `shopify-token-${merchantId}`,
      accessToken,
      `Shopify OAuth token for merchant ${merchantId}`,
    ).catch((err) => { console.error("[shopify callback] Failed to store access token in Vault:", err); return null; }),

    upsertVaultSecret(
      `shopify-webhook-secret-${merchantId}`,
      webhookSecret,
      `Shopify webhook HMAC secret for merchant ${merchantId}`,
    ).catch((err) => { console.error("[shopify callback] Failed to store webhook secret in Vault:", err); return null; }),
  ]);

  if (!accessTokenResult) {
    return redirectError("vault_store_failed");
  }

  // Fetch shop display name from Shopify (non-fatal — falls back to domain)
  let shopName = shop;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const shopRes = await fetch(`https://${shop}/admin/api/2026-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (shopRes.ok) {
      const shopData = await shopRes.json();
      shopName = shopData.shop?.name ?? shop;
    }
  } catch {
    // non-fatal
  }

  // Upsert integration — store Vault UUID references (not raw tokens)
  const { error: upsertError } = await adminSupabase.from("integrations").upsert(
    {
      merchant_id: merchantId,
      platform: "shopify",
      shop_domain: shop,
      shop_name: shopName,
      access_token_secret_id: accessTokenResult,
      webhook_secret_vault_id: webhookSecretResult,
      connection_active: true,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "merchant_id,platform" }
  );

  if (upsertError) {
    console.error("[shopify callback] Integration upsert failed:", upsertError);
    // Postgres unique violation — this shop is already connected to another merchant.
    // Clean up the Vault secret we just wrote to avoid orphaned secrets.
    if (upsertError.code === "23505") {
      try {
        await adminSupabase
          .rpc("vault_update_secret", { p_id: accessTokenResult, p_secret: "__revoked__" });
      } catch {
        // Best-effort cleanup — non-fatal
      }
      return redirectError("store_already_connected");
    }
    return redirectError("vault_store_failed");
  }

  // ── Register Shopify webhooks ─────────────────────────────────────────────
  // Run all registrations in parallel. Each is idempotent — we check for an
  // existing webhook before creating to prevent duplicates on reconnect
  // (Shopify does not deduplicate duplicate webhook topics automatically).
  const isCustomApp = oauthState.app_type === "barpel-connect";

  async function registerWebhook(topic: string, address: string): Promise<void> {
    // Check if this webhook already exists to avoid duplicates on reconnect
    const listRes = await fetch(
      `https://${shop}/admin/api/2026-01/webhooks.json?topic=${encodeURIComponent(topic)}`,
      { headers: { "X-Shopify-Access-Token": accessToken } }
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      if (Array.isArray(listData.webhooks) && listData.webhooks.length > 0) {
        return; // Already registered — skip
      }
    }

    await fetch(`https://${shop}/admin/api/2026-01/webhooks.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ webhook: { topic, address, format: "json" } }),
    });
  }

  const webhookRegistrations = [
    // Abandoned cart — triggers outbound recovery call when checkout is created
    registerWebhook("checkouts/create", `${baseUrl}/api/outbound/abandoned-cart`),
    // Order completed — cancels pending abandoned cart calls so buyers aren't called
    registerWebhook("orders/create", `${baseUrl}/api/outbound/order-completed`),
  ];

  // app_subscriptions/update is only relevant for Shopify Billing (managed pricing).
  // Custom Distribution apps cannot use Shopify Billing — skip for barpel-connect.
  if (!isCustomApp) {
    webhookRegistrations.push(
      registerWebhook("app_subscriptions/update", `${baseUrl}/api/shopify/webhooks/subscription`)
    );
  }

  await Promise.allSettled(
    webhookRegistrations.map((p) => p.catch((err) =>
      console.error("[shopify callback] webhook registration failed:", err)
    ))
  );

  console.log("[shopify oauth callback] success", {
    returnTo,
    shop,
    merchantId,
    appType: oauthState.app_type ?? "main",
  });

  // Redirect based on where the OAuth flow started
  if (returnTo === "onboarding") {
    return NextResponse.redirect(`${baseUrl}/onboarding`);
  }
  return NextResponse.redirect(`${baseUrl}/dashboard/integrations?connected=shopify`);
}
