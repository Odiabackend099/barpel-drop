import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureIdempotent } from "@/lib/idempotency";

/**
 * Shopify orders/create webhook.
 * Cancels any pending abandoned cart recovery call for this customer.
 * Without this, a customer who completes their purchase would still
 * receive a "you left items in your cart" call — embarrassing and
 * wastes merchant credits.
 *
 * Validation mirrors abandoned-cart/route.ts:
 * 1. HMAC verification (base64, per-shop secret from Vault)
 * 2. Idempotency check (shopify_order_{order.id})
 * 3. Cancel matching pending calls by checkout token or customer email
 */
export async function POST(request: Request) {
  const shopifyHmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";
  const rawBody = Buffer.from(await request.text());

  const supabase = createAdminClient();

  // Get per-shop webhook secret from Vault — reject unknown shops, no global fallback.
  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 401 });
  }

  const { data: hmacIntegration } = await supabase
    .from("integrations")
    .select("webhook_secret_vault_id")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .maybeSingle();

  if (!hmacIntegration?.webhook_secret_vault_id) {
    return NextResponse.json({ error: "Unknown shop" }, { status: 401 });
  }

  const { data: vaultSecret } = await supabase
    .rpc("vault_read_secret_by_id", { p_id: hmacIntegration.webhook_secret_vault_id });

  if (!vaultSecret) {
    console.error("[order-completed] Vault read failed for shop:", shopDomain);
    return NextResponse.json({ error: "Vault unavailable" }, { status: 503 });
  }

  if (!verifyShopifyWebhook(rawBody, vaultSecret, shopifyHmac)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody.toString());

  // Idempotency check on Shopify order ID
  const eventId = `shopify_order_${body.id}`;
  const isNew = await ensureIdempotent(eventId, "shopify", supabase);
  if (!isNew) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Find merchant by shop domain
  const { data: integration } = await supabase
    .from("integrations")
    .select("merchant_id")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .eq("connection_active", true)
    .maybeSingle();

  if (!integration) {
    return NextResponse.json({ ok: true, skipped: "no_integration" });
  }

  const merchantId: string = integration.merchant_id;
  const customerEmail: string | undefined = body.email;
  const checkoutToken: string | undefined = body.checkout_token;

  // Cancel all pending abandoned cart calls matching this order
  // Match on checkout token (most reliable) OR customer email (fallback)
  let cancelled = 0;

  if (checkoutToken) {
    const { data } = await supabase
      .from("pending_outbound_calls")
      .update({ status: "cancelled" })
      .eq("merchant_id", merchantId)
      .eq("shopify_checkout_token", checkoutToken)
      .eq("status", "pending")
      .select("id");

    cancelled += data?.length ?? 0;
  }

  if (customerEmail && cancelled === 0) {
    // Only match by email if checkout token didn't find anything
    const { data } = await supabase
      .from("pending_outbound_calls")
      .update({ status: "cancelled" })
      .eq("merchant_id", merchantId)
      .eq("customer_email", customerEmail)
      .eq("status", "pending")
      .select("id");

    cancelled += data?.length ?? 0;
  }

  return NextResponse.json({ ok: true, cancelled });
}
