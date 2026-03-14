import { withRetry } from "@/lib/retry";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Searches for products in a Shopify store using the GraphQL Admin API.
 * Returns a voice-friendly string that the AI reads back to the customer.
 *
 * Two modes:
 *   - General listing (no searchTerm or generic word): lists up to 8 active products
 *   - Specific search (customer names a product): detailed info with variants + stock
 *
 * @param shopDomain - The merchant's Shopify domain (e.g. "mystore.myshopify.com")
 * @param accessToken - The OAuth access token (decrypted from Vault)
 * @param searchTerm - Product name/keyword from the customer, or null for general listing
 * @returns A single-line string for Vapi TTS (no newlines — Vapi ignores responses with newlines)
 */
export async function searchProducts(
  shopDomain: string,
  accessToken: string,
  searchTerm: string | null
): Promise<string> {
  const isGeneralQuery =
    !searchTerm ||
    ["all", "available", "have", "sell", "offer", "stock", "everything", "products"].some(
      (w) => searchTerm.toLowerCase().includes(w)
    );

  let graphqlQuery: string;
  let variables: Record<string, unknown>;

  if (isGeneralQuery) {
    graphqlQuery = LIST_PRODUCTS_QUERY;
    variables = { first: 8 };
  } else {
    graphqlQuery = SEARCH_PRODUCT_QUERY;
    variables = {
      searchQuery: `${searchTerm} status:active`,
      first: 3,
    };
  }

  const response = await withRetry(
    () =>
      fetch(`https://${shopDomain}/admin/api/2026-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query: graphqlQuery, variables }),
      }),
    3,
    "shopify_product_search"
  );

  if (!response.ok) {
    throw new Error(`Shopify API returned ${response.status}`);
  }

  const json = await response.json();

  if (json.errors?.length > 0) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
  }

  const products = json?.data?.products?.edges ?? [];

  // --- GENERAL QUERY: list all products ---
  if (isGeneralQuery) {
    if (products.length === 0) {
      return "It looks like the store's catalogue hasn't been set up yet. Please contact the store directly for product information.";
    }

    const productList = products.map((e: any) => {
      const p = e.node;
      const price = p.priceRangeV2?.minVariantPrice;
      const priceText = price
        ? formatPriceForVoice(price.amount, price.currencyCode)
        : "";
      return priceText ? `${p.title} starting at ${priceText}` : p.title;
    });

    if (productList.length === 1) {
      return `We currently have one product: the ${productList[0]}. Would you like to know more?`;
    }

    if (productList.length <= 4) {
      const last = productList.pop()!;
      return `We have ${productList.join(", ")}, and ${last}. Would you like more details on any of these?`;
    }

    // More than 4 — read first 4 then summarise
    const first4 = productList.slice(0, 4);
    const remaining = productList.length - 4;
    return `We have ${productList.length} products available. These include ${first4.join(", ")}, and ${remaining} more. Would you like me to search for something specific?`;
  }

  // --- SPECIFIC SEARCH: customer asked about a particular product ---
  if (products.length === 0) {
    return `I couldn't find a product matching "${searchTerm}" in our store. Would you like me to list everything we have instead?`;
  }

  const product = products[0].node;
  const price = product.priceRangeV2?.minVariantPrice;
  const maxPrice = product.priceRangeV2?.maxVariantPrice;
  const inStock = (product.totalInventory ?? 0) > 0;

  const variants = product.variants?.edges ?? [];
  const availableVariants = variants
    .filter((v: any) => v.node.availableForSale)
    .map((v: any) => v.node.title as string)
    .filter((t: string) => t !== "Default Title");

  let result = `Yes, we have the ${product.title}.`;

  if (price) {
    const priceText = formatPriceForVoice(price.amount, price.currencyCode);
    const samePriceRange = price.amount === maxPrice?.amount;
    result += samePriceRange
      ? ` It's priced at ${priceText}.`
      : ` Prices start from ${priceText}.`;
  }

  result += inStock
    ? " It is currently in stock."
    : " Unfortunately it is currently out of stock.";

  if (availableVariants.length > 0) {
    result += ` Available options are: ${availableVariants.join(", ")}.`;
  }

  result += " Is there anything else I can help you with?";

  return result;
}

// ---------------------------------------------------------------------------
// GraphQL Queries — verified against Shopify Admin API 2026-01
// ---------------------------------------------------------------------------

const LIST_PRODUCTS_QUERY = `
  query ListProducts($first: Int!) {
    products(first: $first, query: "status:ACTIVE") {
      edges {
        node {
          title
          totalInventory
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`;

const SEARCH_PRODUCT_QUERY = `
  query SearchProduct($searchQuery: String!, $first: Int!) {
    products(first: $first, query: $searchQuery) {
      edges {
        node {
          title
          status
          totalInventory
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          variants(first: 5) {
            edges {
              node {
                title
                price
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a Shopify price for voice delivery.
 * Vapi TTS reads currency symbols naturally (e.g. "£29.99" → "twenty-nine pounds ninety-nine").
 */
function formatPriceForVoice(amount: string, currencyCode: string): string {
  const num = parseFloat(amount);
  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);

  const frac = fraction.toString().padStart(2, "0");

  const formats: Record<string, string> = {
    GBP: fraction > 0 ? `\u00A3${whole}.${frac}` : `\u00A3${whole}`,
    USD: fraction > 0 ? `$${whole}.${frac}` : `$${whole}`,
    EUR: fraction > 0 ? `\u20AC${whole}.${frac}` : `\u20AC${whole}`,
    NGN: `${whole.toLocaleString()} Naira`,
  };

  return formats[currencyCode] ?? `${amount} ${currencyCode}`;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
