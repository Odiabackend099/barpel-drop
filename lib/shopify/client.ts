import { withRetry } from "@/lib/retry";

interface ShopifyOrder {
  id: string;
  name: string;
  fulfillmentStatus: string | null;
  trackingNumbers: string[];
  trackingUrls: string[];
  lineItems: Array<{ title: string; quantity: number }>;
}

/**
 * Looks up an order from a Shopify store using the GraphQL Admin API.
 *
 * @param shopDomain - The merchant's Shopify domain (e.g. "mystore.myshopify.com")
 * @param accessToken - The OAuth access token
 * @param orderNumber - The order name (e.g. "#1001" or "ORD-4521")
 * @returns The order details or null if not found
 */
export async function lookupOrder(
  shopDomain: string,
  accessToken: string,
  orderNumber: string
): Promise<ShopifyOrder | null> {
  const cleanNumber = orderNumber.replace(/^(ORD-|#)/i, "");

  const query = `query ($search: String!) {
    orders(first: 1, query: $search) {
      edges {
        node {
          id
          name
          displayFulfillmentStatus
          fulfillments(first: 5) {
            trackingInfo {
              number
              url
            }
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
              }
            }
          }
        }
      }
    }
  }`;

  // Try multiple search formats — the primary format `name:<number>` is correct per
  // Shopify docs (https://shopify.dev/docs/api/admin-graphql/2025-01/queries/orders),
  // but custom order name prefixes or API inconsistencies can cause misses.
  // `status:any` is required to include archived orders (Shopify excludes them by default).
  const searchFormats = [
    `name:${cleanNumber}`,
    `name:#${cleanNumber}`,
    cleanNumber,
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderNode: any;

  for (const searchString of searchFormats) {
    const response = await withRetry(
      () =>
        fetch(`https://${shopDomain}/admin/api/2026-01/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query, variables: { search: searchString } }),
        }),
      3,
      "shopify_order_lookup"
    );

    if (!response.ok) {
      // HTTP-level failure (401, 403, 429) applies to all formats — fail fast
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors?.length) {
      // GraphQL error is specific to this search format — try the next one
      console.warn(`[shopify] GraphQL error for "${searchString}":`, json.errors[0].message);
      continue;
    }

    orderNode = json.data?.orders?.edges?.[0]?.node;
    if (orderNode) break; // found it — stop trying other formats
  }

  if (!orderNode) return null;

  const trackingNumbers: string[] = [];
  const trackingUrls: string[] = [];
  for (const fulfillment of orderNode.fulfillments ?? []) {
    for (const info of fulfillment.trackingInfo ?? []) {
      if (info.number) trackingNumbers.push(info.number);
      if (info.url) trackingUrls.push(info.url);
    }
  }

  return {
    id: orderNode.id,
    name: orderNode.name,
    fulfillmentStatus: orderNode.displayFulfillmentStatus,
    trackingNumbers,
    trackingUrls,
    lineItems: (orderNode.lineItems?.edges ?? []).map(
      (edge: { node: { title: string; quantity: number } }) => ({
        title: edge.node.title,
        quantity: edge.node.quantity,
      })
    ),
  };
}
