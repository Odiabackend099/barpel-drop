import { Checkout } from "@dodopayments/nextjs";

/**
 * GET /api/billing/dodo/checkout
 *
 * Dodo Payments Next.js adapter handler.
 * Called server-side by the initiate route — never directly by the browser.
 *
 * Query params forwarded to Dodo:
 *   productId         — Dodo product ID (prod_xxx)
 *   metadata_userId   — merchant row ID (for webhook reference only — not trusted as auth)
 *   metadata_txRef    — UUID from billing_transactions; this is the real trust anchor
 *   metadata_plan     — plan name (starter|growth|scale)
 *   metadata_billingCycle — monthly|annual
 *   customer_id       — (optional) existing Dodo customer ID to prevent duplicate creation
 *
 * Returns: { checkout_url: "https://checkout.dodopayments.com/..." }
 */
export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode") as
    | "test_mode"
    | "live_mode",
  type: "static",
});
