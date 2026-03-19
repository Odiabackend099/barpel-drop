import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * Creates a Stripe Checkout Session for credit package purchase.
 * Requires authenticated user (protected by middleware).
 *
 * NOTE: Stripe is disabled in production (STRIPE_ENABLED=false).
 * Flutterwave is the primary payment processor — use /api/billing/flutterwave/initiate instead.
 */
export async function POST(request: Request) {
  // Stripe is disabled until live keys are available.
  // All payments go through Flutterwave (/api/billing/flutterwave/initiate).
  if (process.env.STRIPE_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Card payments via Stripe are not available.", use_flutterwave: true },
      { status: 503 }
    );
  }

  const supabase = createClient();

  // Verify authenticated user
  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  let body: { package_id?: string; packageId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  // Accept both package_id (from billing/onboarding pages) and packageId
  const packageId = body.package_id ?? body.packageId;
  if (!packageId) {
    return NextResponse.json(
      { error: "Missing package_id" },
      { status: 400 }
    );
  }

  // Look up the merchant
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, stripe_customer_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Look up the credit package by name (case-insensitive).
  // The frontend sends slug IDs ("starter", "growth", "scale") from CREDIT_PACKAGES
  // but the DB primary key is a UUID — match by name instead.
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("*")
    .ilike("name", packageId)
    .eq("is_active", true)
    .single();

  if (!pkg || !pkg.stripe_price_id) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const stripe = getStripe();

  try {
    // Get or create Stripe customer
    let customerId = merchant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { merchant_id: merchant.id },
      });
      customerId = customer.id;

      await supabase
        .from("merchants")
        .update({ stripe_customer_id: customerId })
        .eq("id", merchant.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
      metadata: {
        merchant_id: merchant.id,
        package_id: packageId,
        credits_seconds: String(pkg.credits_seconds),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[billing/checkout] Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
