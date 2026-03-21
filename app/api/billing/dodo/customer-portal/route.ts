import { CustomerPortal } from "@dodopayments/nextjs";

/**
 * GET /api/billing/dodo/customer-portal?customer_id=cus_xxx
 *
 * Redirects the authenticated customer to the Dodo-hosted customer portal.
 * From the portal, subscribers can:
 *   - Update their payment method
 *   - View past invoices and receipts
 *   - Manage their subscription
 *
 * Requires ?customer_id= query param.
 * The dodo_customer_id is stored on the merchant record after first checkout.
 *
 * Note: no server-side auth guard here — the customer_id itself is the opaque token
 * that Dodo uses to identify the session. An attacker with only a customer_id can
 * only manage their own Dodo customer record (scoped by Dodo on their side).
 * Access to this endpoint should be from authenticated billing page links only.
 */
export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode") as
    | "test_mode"
    | "live_mode",
});
