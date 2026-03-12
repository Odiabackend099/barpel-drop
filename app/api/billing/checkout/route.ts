import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

/**
 * Creates a Stripe Checkout Session for credit package purchase.
 * Requires authenticated user (protected by middleware).
 */
export async function POST(request: Request) {
  const supabase = createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Look up the credit package
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (!pkg || !pkg.stripe_price_id) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const stripe = getStripe();

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
}
