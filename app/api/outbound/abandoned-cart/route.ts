import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureIdempotent } from "@/lib/idempotency";

const MIN_CART_VALUE_USD = 100;
const OUTBOUND_DELAY_MINUTES = 15;

/**
 * Shopify checkouts/create webhook.
 * Queues an outbound abandoned cart call if:
 * 1. HMAC verifies (base64, per-shop secret from Vault)
 * 2. Cart value exceeds minimum threshold
 * 3. Customer has a phone number
 * 4. Merchant confirmed outbound consent
 * 5. Customer email is NOT the merchant's own email (test order filter)
 * 6. Customer hasn't received an abandoned cart call in the last 24 hours
 */
export async function POST(request: Request) {
  const shopifyHmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";
  const rawBody = Buffer.from(await request.text());

  const supabase = createAdminClient();

  // B-16: Get per-shop webhook secret from Vault.
  // Reject unknown shops — never fall back to global SHOPIFY_API_SECRET,
  // as that would allow any Shopify app holder to inject forged webhook data.
  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 401 });
  }

  const { data: hmacIntegration } = await supabase
    .from("integrations")
    .select("webhook_secret_vault_id, merchant_id")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .maybeSingle();

  if (!hmacIntegration?.webhook_secret_vault_id) {
    // Unknown shop or no vault secret stored — reject to prevent spoofed webhooks
    return NextResponse.json({ error: "Unknown shop" }, { status: 401 });
  }

  // Read webhook secret from Vault via public RPC (vault schema not exposed through PostgREST)
  const { data: vaultSecret } = await supabase
    .rpc("vault_read_secret_by_id", { p_id: hmacIntegration.webhook_secret_vault_id });

  if (!vaultSecret) {
    console.error("[abandoned-cart] Vault read failed for shop:", shopDomain);
    return NextResponse.json({ error: "Vault unavailable" }, { status: 503 });
  }

  // B-16: Use base64 HMAC verification for Shopify webhooks (NOT hex)
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

  // Extract checkout data
  const cartTotal = parseFloat(body.total_price ?? "0");
  const customerPhone = body.phone ?? body.billing_address?.phone;
  const customerEmail: string | undefined = body.email;
  const customerName = body.billing_address?.name ?? customerEmail;

  // Skip if cart value is too low or no phone number
  if (cartTotal < MIN_CART_VALUE_USD || !customerPhone) {
    return NextResponse.json({ ok: true, skipped: "below_threshold" });
  }

  // Find the merchant by shop domain (connection_active — renamed from is_active)
  const { data: integration } = await supabase
    .from("integrations")
    .select("merchant_id, outbound_consent_confirmed_at")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .eq("connection_active", true)
    .single();

  if (!integration) {
    return NextResponse.json({ ok: true, skipped: "no_integration" });
  }

  if (!integration.outbound_consent_confirmed_at) {
    return NextResponse.json({ ok: true, skipped: "no_consent" });
  }

  const merchantId: string = integration.merchant_id;

  // B-7: Filter test orders — skip if customer email matches merchant's account email
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

  // B-7: Deduplicate — no abandoned cart call to this customer in last 24 hours
  if (customerEmail) {
    const { data: recentCall } = await supabase
      .from("pending_outbound_calls")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("customer_email", customerEmail)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(1)
      .maybeSingle();

    if (recentCall) {
      return NextResponse.json({ skipped: "recent_contact" }, { status: 200 });
    }
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
