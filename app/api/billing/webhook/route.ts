import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureIdempotent } from "@/lib/idempotency";
import { addCredits } from "@/lib/credits";
import type Stripe from "stripe";

/**
 * Stripe webhook handler.
 * Processes checkout.session.completed events to add credits.
 *
 * Uses raw body for signature verification — standard JSON parsing
 * would corrupt the signature.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check
  const isNew = await ensureIdempotent(event.id, "stripe", supabase);
  if (!isNew) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const merchantId = session.metadata?.merchant_id;
    const creditsSeconds = parseInt(
      session.metadata?.credits_seconds ?? "0",
      10
    );

    if (!merchantId || creditsSeconds <= 0) {
      return NextResponse.json(
        { error: "Invalid metadata" },
        { status: 400 }
      );
    }

    await addCredits(
      supabase,
      merchantId,
      creditsSeconds,
      session.payment_intent as string
    );
  }

  return NextResponse.json({ ok: true });
}
