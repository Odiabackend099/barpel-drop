import { generateNonce } from "@/lib/security";

const SHOPIFY_SCOPES =
  "read_orders,read_fulfillments,read_customers,read_checkouts";

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

  const params = new URLSearchParams({
    client_id: apiKey,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state: nonce,
  });

  return {
    url: `https://admin.shopify.com/oauth/install?${params.toString()}`,
    nonce,
  };
}

/**
 * Exchanges the OAuth code for a permanent access token.
 *
 * @param shopDomain - The store domain
 * @param code - The code from the OAuth callback
 * @returns The permanent access token
 */
export async function exchangeCodeForToken(
  shopDomain: string,
  code: string
): Promise<string> {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET");
  }

  const response = await fetch(
    `https://${shopDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}
