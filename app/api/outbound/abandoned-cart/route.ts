import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureIdempotent } from "@/lib/idempotency";

const MIN_CART_VALUE_USD = 100;
const OUTBOUND_DELAY_MINUTES = 15;
const E164_REGEX = /^\+[1-9]\d{9,14}$/;

/**
 * Shopify checkouts/create webhook.
 * Queues an outbound abandoned cart call if:
 * 1. HMAC verifies (base64, per-shop secret from Vault)
 * 2. Cart value exceeds minimum threshold
 * 3. Customer has a valid E.164 phone number
 * 4. Merchant confirmed outbound consent
 * 5. Customer email is NOT the merchant's own email (test order filter)
 * 6. Customer hasn't received an abandoned cart call in the last 24 hours
 */
export async function POST(request: Request) {
  const shopifyHmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";
  const rawBody = Buffer.from(await request.text());

  const supabase = createAdminClient();

  // Reject unknown shops — never fall back to global SHOPIFY_API_SECRET,
  // as that would allow any Shopify app holder to inject forged webhook data.
  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 401 });
  }

  // #13: Merge two separate integrations queries into one round-trip.
  // Both HMAC verification and consent check need data from the same row.
  const { data: integration } = await supabase
    .from("integrations")
    .select("webhook_secret_vault_id, merchant_id, outbound_consent_confirmed_at, connection_active")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .maybeSingle();

  if (!integration?.webhook_secret_vault_id) {
    // Unknown shop or no vault secret stored — reject to prevent spoofed webhooks
    return NextResponse.json({ error: "Unknown shop" }, { status: 401 });
  }

  // Read webhook secret from Vault via public RPC (vault schema not exposed through PostgREST)
  const { data: vaultSecret } = await supabase
    .rpc("vault_read_secret_by_id", { p_id: integration.webhook_secret_vault_id });

  if (!vaultSecret) {
    console.error("[abandoned-cart] Vault read failed for shop:", shopDomain);
    return NextResponse.json({ error: "Vault unavailable" }, { status: 503 });
  }

  // Use base64 HMAC verification for Shopify webhooks (NOT hex)
  if (!verifyShopifyWebhook(rawBody, vaultSecret, shopifyHmac)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody.toString());

  // Idempotency check on Shopify checkout token
  const eventId = `shopify_checkout_${body.id}`;
  const isNew = await ensureIdempotent(eventId, "shopify", supabase);
  if (!isNew) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // #12: Strip non-numeric characters before parsing price — Shopify occasionally
  // returns locale-formatted strings (e.g. "$99.00") which cause parseFloat to
  // return NaN, silently skipping valid high-value carts.
  const rawPrice = String(body.total_price ?? "0").replace(/[^0-9.]/g, "");
  const cartTotal = parseFloat(rawPrice);

  // #14: Check phone in priority order: top-level > shipping_address > billing_address.
  // Shopify checkouts for physical goods often populate shipping_address.phone
  // even when billing_address.phone is null.
  const customerPhone: string | undefined =
    body.phone ??
    body.shipping_address?.phone ??
    body.billing_address?.phone;

  const customerEmail: string | undefined = body.email;
  const customerName: string | undefined =
    body.billing_address?.name ??
    body.shipping_address?.name ??
    customerEmail;

  // #11: Validate phone in E.164 format before going any further.
  // The dial-pending cron also validates, but better to reject at queue time
  // than to create a row that will immediately fail when dialled.
  if (!customerPhone || !E164_REGEX.test(customerPhone)) {
    return NextResponse.json({ ok: true, skipped: "invalid_phone" });
  }

  // Skip if cart value is too low (NaN < threshold is false in JS, so also guard NaN)
  if (isNaN(cartTotal) || cartTotal < MIN_CART_VALUE_USD) {
    return NextResponse.json({ ok: true, skipped: "below_threshold" });
  }

  // Integration must be active and merchant must have confirmed outbound consent
  if (!integration.connection_active) {
    return NextResponse.json({ ok: true, skipped: "no_integration" });
  }

  if (!integration.outbound_consent_confirmed_at) {
    return NextResponse.json({ ok: true, skipped: "no_consent" });
  }

  const merchantId: string = integration.merchant_id;

  // Filter test orders — skip if customer email matches merchant's account email
  if (customerEmail) {
    const { data: merchantData } = await supabase
      .from("merchants")
      .select("user_id")
      .eq("id", merchantId)
      .single();

    if (merchantData?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        merchantData.user_id
      );

      const merchantEmail = userData.user?.email;
      if (
        merchantEmail &&
        customerEmail.toLowerCase() === merchantEmail.toLowerCase()
      ) {
        return NextResponse.json({ skipped: "test_order" }, { status: 200 });
      }
    }
  }

  // #15: Deduplicate on BOTH email and phone — customers without email but with
  // the same phone number could otherwise receive multiple calls from separate
  // checkout sessions (e.g. different devices, different checkout tokens).
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (customerEmail) {
    const { data: recentByEmail } = await supabase
      .from("pending_outbound_calls")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("customer_email", customerEmail)
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)
      .maybeSingle();

    if (recentByEmail) {
      return NextResponse.json({ skipped: "recent_contact" }, { status: 200 });
    }
  }

  // Phone dedup — catches customers with no email or different email on repeat sessions
  const { data: recentByPhone } = await supabase
    .from("pending_outbound_calls")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("customer_phone", customerPhone)
    .gte("created_at", twentyFourHoursAgo)
    .limit(1)
    .maybeSingle();

  if (recentByPhone) {
    return NextResponse.json({ skipped: "recent_contact" }, { status: 200 });
  }

  // Schedule the outbound call
  const scheduledFor = new Date(
    Date.now() + OUTBOUND_DELAY_MINUTES * 60 * 1000
  );

  await supabase.from("pending_outbound_calls").insert({
    merchant_id: merchantId,
    customer_phone: customerPhone,
    customer_name: customerName,
    customer_email: customerEmail ?? null,
    cart_value_usd: cartTotal,
    cart_items: body.line_items ?? [],
    shop_domain: shopDomain,
    shopify_checkout_token: body.token ?? null,
    scheduled_for: scheduledFor.toISOString(),
    status: "pending",
  });

  return NextResponse.json({ ok: true });
}
