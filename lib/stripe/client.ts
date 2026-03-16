import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Returns a singleton Stripe SDK instance configured with the secret key.
 * Server-side only — never import this in client components.
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
    stripeInstance = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeInstance;
}
