import { generateNonce } from "@/lib/security";

/** Normalize user input into a valid myshopify.com domain */
export function normalizeShopDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/\/+$/, "");
  if (!domain.includes(".myshopify.com")) {
    domain = `${domain}.myshopify.com`;
  }
  return domain;
}

const SHOPIFY_SCOPES =
  "read_orders,read_fulfillments,read_customers,read_checkouts";

/**
 * Builds the Shopify OAuth authorisation URL.
 *
 * @param shopDomain - The merchant's store domain (e.g. "mystore.myshopify.com")
 * @param redirectUri - The callback URL
 * @returns An object with the URL and the nonce for CSRF verification
 */
export function buildAuthUrl(
  shopDomain: string,
  redirectUri: string
): { url: string; nonce: string } {
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
    url: `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`,
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
