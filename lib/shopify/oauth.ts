import { generateNonce } from "@/lib/security";

// Scopes requested in the direct install OAuth URL (buildDirectInstallUrl).
// Must exactly match the scopes configured in Shopify Partners for the
// "Barpel AI Connect" custom distribution app. read_all_orders requires
// special Shopify approval and must NOT be included here; read_app_subscriptions
// is Shopify Billing only and not used (Barpel uses Dodo Payments).
//
// IMPORTANT: Do not add grant_options[]=per-user here or anywhere in the OAuth
// flow. Without it, Shopify issues offline (permanent) tokens by default.
// Online tokens expire after 24 hours and would break all merchant integrations.
export const SHOPIFY_SCOPES = "read_orders,read_products";

/**
 * Builds a Shopify managed install URL — NO shop domain required from the merchant.
 *
 * Shopify's managed install URL lets each merchant log into their OWN store
 * and approve access. Shopify provides the shop domain in the OAuth callback.
 * This is the correct multi-tenant approach used by Klaviyo, Gorgias, etc.
 *
 * Never use a hardcoded or env-configured shop domain here — that would
 * route every merchant to the same store, breaking multi-tenancy entirely.
 */
export function buildInstallUrl(redirectUri: string): {
  url: string;
  nonce: string;
} {
  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) throw new Error("Missing SHOPIFY_API_KEY");

  const nonce = generateNonce(16);

  // Managed install: scopes come from the Dev Dashboard app config, NOT from URL params.
  // Passing scope here causes failed_grant_with_invalid_scopes for new users.
  const params = new URLSearchParams({
    client_id: apiKey,
    redirect_uri: redirectUri,
    state: nonce,
  });

  return {
    url: `https://admin.shopify.com/oauth/install?${params.toString()}`,
    nonce,
  };
}

/**
 * Builds a direct Shopify OAuth URL for a known shop domain.
 *
 * Used when the shop is already known (e.g. from a Shopify app-load redirect
 * that sends hmac+host to the App URL). Unlike buildInstallUrl(), this goes
 * directly to the shop's OAuth endpoint and always prompts re-authorization —
 * even if the app is already installed. This is the correct reconnect path.
 */
export function buildDirectInstallUrl(
  shopDomain: string,
  redirectUri: string,
  clientId?: string,
): { url: string; nonce: string } {
  const apiKey = clientId ?? process.env.SHOPIFY_API_KEY;
  if (!apiKey) throw new Error("Missing SHOPIFY_API_KEY");

  const nonce = generateNonce(16);

  const params = new URLSearchParams({
    client_id: apiKey,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state: nonce,
  });

  return {
    url: `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`,
    nonce,
  };
}

/**
 * Exchanges the OAuth code for a permanent offline access token.
 *
 * Shopify issues offline tokens by default (no grant_options[]=per-user in
 * the OAuth URL). Offline tokens never expire. This function asserts that the
 * returned token is offline — if Shopify ever returns an online token
 * (associated_user present), it throws rather than silently storing a
 * 24-hour token that would break merchant integrations the next day.
 *
 * @param shopDomain - The store domain (e.g. mystore.myshopify.com)
 * @param code - The authorization code from the OAuth callback
 * @param credentials - Optional override credentials for custom distribution apps
 * @returns The permanent offline access token
 */
export async function exchangeCodeForToken(
  shopDomain: string,
  code: string,
  credentials?: { clientId: string; clientSecret: string },
): Promise<string> {
  const apiKey = credentials?.clientId ?? process.env.SHOPIFY_API_KEY;
  const apiSecret = credentials?.clientSecret ?? process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        }),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  // Guard: if Shopify returns an online token (associated_user is present),
  // that means grant_options[]=per-user was accidentally included somewhere.
  // Online tokens expire in 24 hours — never store them.
  if (data.associated_user) {
    throw new Error(
      "Shopify returned an online (per-user) token. Only offline tokens are permitted. " +
      "Remove grant_options[]=per-user from the OAuth flow."
    );
  }

  if (!data.access_token) {
    throw new Error("Shopify token exchange returned no access_token");
  }

  return data.access_token;
}
