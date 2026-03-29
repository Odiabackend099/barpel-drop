import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureIdempotent } from "@/lib/idempotency";

export const runtime = "nodejs";

/**
 * Shopify app_subscriptions/update webhook handler.
 *
 * Security:   Per-shop HMAC verification via Vault webhook secret (base64).
 *             Uses verifyShopifyWebhook() from lib/security — no custom HMAC code.
 *             Never falls back to global SHOPIFY_API_SECRET (matches abandoned-cart pattern).
 * Idempotency: webhook_events table keyed on X-Shopify-Webhook-Id header.
 * Credit reset: ACTIVE → hard-sets credit_balance to plan allocation (no stacking).
 *
 * Plan handle → internal mapping:
 *   barpel-starter → starter → 1800 seconds (30 min)
 *   barpel-growth  → growth  → 6000 seconds (100 min)
 *   barpel-scale   → scale   → 15000 seconds (250 min)
 */

const PLAN_MAP: Record<string, { plan: string; credits: number }> = {
  "barpel-starter": { plan: "starter", credits: 1800 },
  "barpel-growth":  { plan: "growth",  credits: 6000 },
  "barpel-scale":   { plan: "scale",   credits: 15000 },
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const webhookId  = req.headers.get("x-shopify-webhook-id");
  const shopDomain = req.headers.get("x-shopify-shop-domain");

  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  // Reject if webhook ID header is missing — required for idempotency
  if (!webhookId) {
    return NextResponse.json({ error: "Missing webhook ID" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Look up merchant + per-shop webhook secret in a single query.
  // HMAC verification uses the per-shop Vault secret — never the global SHOPIFY_API_SECRET,
  // as that would allow any Shopify app holder to inject forged webhook data.
  const { data: integration, error: lookupError } = await adminSupabase
    .from("integrations")
    .select("merchant_id, webhook_secret_vault_id")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .maybeSingle();

  if (lookupError) {
    // DB error — return 503 so Shopify retries instead of silently dropping
    console.error("[shopify/subscription] DB lookup failed:", lookupError.message);
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  if (!integration) {
    // Unknown shop — return 200 to prevent Shopify retry storm
    console.warn("[shopify/subscription] Unknown shop domain:", shopDomain);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const merchantId = integration.merchant_id;

  // Per-shop HMAC verification via Vault secret
  if (!integration.webhook_secret_vault_id) {
    console.warn("[shopify/subscription] No Vault secret for merchant:", merchantId);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { data: vaultSecret } = await adminSupabase
    .rpc("vault_read_secret_by_id", { p_id: integration.webhook_secret_vault_id });

  if (!vaultSecret) {
    console.error("[shopify/subscription] Vault read failed for merchant:", merchantId);
    return NextResponse.json({ error: "Vault unavailable" }, { status: 503 });
  }

  if (!verifyShopifyWebhook(rawBody, vaultSecret, hmacHeader)) {
    console.warn("[shopify/subscription] Invalid HMAC for shop:", shopDomain);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotency guard — keyed on X-Shopify-Webhook-Id
  const isNew = await ensureIdempotent(webhookId, "shopify", adminSupabase);
  if (!isNew) {
    console.log("[shopify/subscription] Duplicate webhook, skipping:", webhookId);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status         = payload.status as string | undefined;
  const subscriptionId = payload.id as string | undefined;
  const name           = payload.name as string | undefined; // plan handle e.g. "barpel-starter"
  const billingCycle   = (payload.billing_cycles as unknown[])?.length === 1 ? "annual" : "monthly";

  console.log("[shopify/subscription] Received", { shopDomain, merchantId, status, name, subscriptionId });

  switch (status) {
    case "ACTIVE": {
      if (!name || !(name in PLAN_MAP)) {
        // Return 200 to stop Shopify retry loop — log error for investigation
        console.error("[shopify/subscription] Unrecognized plan handle:", name);
        return NextResponse.json({ received: true, error: "unrecognized_plan" }, { status: 200 });
      }

      const { plan, credits } = PLAN_MAP[name];

      // Check if this is a renewal (same subscription ID) or new activation
      const { data: merchant } = await adminSupabase
        .from("merchants")
        .select("shopify_subscription_id")
        .eq("id", merchantId)
        .single();

      const isRenewal = merchant?.shopify_subscription_id === subscriptionId;

      // RESET credit_balance to plan allocation — do NOT add on top (prevents stacking)
      await adminSupabase
        .from("merchants")
        .update({
          credit_balance:          credits,
          shopify_plan:            plan,
          shopify_subscription_id: subscriptionId ?? null,
          shopify_billing_cycle:   billingCycle,
          plan_status:             "active",
        })
        .eq("id", merchantId);

      // Audit trail
      await adminSupabase.from("credit_transactions").insert({
        merchant_id:       merchantId,
        type:              "purchase",
        amount:            credits,
        balance_after:     credits,
        description:       isRenewal
          ? `${billingCycle === "annual" ? "Annual" : "Monthly"} renewal — ${plan} plan (Shopify)`
          : `Plan activated — ${plan} (Shopify Managed Pricing)`,
        stripe_payment_id: `shopify_sub_${subscriptionId ?? "unknown"}_${Date.now()}`,
      });

      console.log("[shopify/subscription] ACTIVE processed", { merchantId, plan, credits, isRenewal });
      break;
    }

    case "CANCELLED": {
      await adminSupabase
        .from("merchants")
        .update({
          shopify_subscription_id: null,
          shopify_plan:            null,
          // credit_balance intentionally left intact — access until end of billing period
        })
        .eq("id", merchantId);

      console.log("[shopify/subscription] CANCELLED processed", { merchantId });
      break;
    }

    case "FROZEN": {
      await adminSupabase
        .from("merchants")
        .update({ plan_status: "past_due" })
        .eq("id", merchantId);

      console.log("[shopify/subscription] FROZEN processed", { merchantId });
      break;
    }

    case "EXPIRED": {
      await adminSupabase
        .from("merchants")
        .update({
          shopify_subscription_id: null,
          shopify_plan:            null,
          plan_status:             "expired",
        })
        .eq("id", merchantId);

      console.log("[shopify/subscription] EXPIRED processed", { merchantId });
      break;
    }

    case "DECLINED": {
      // Clear pending subscription state for THIS merchant only
      // Verify subscription match in JS to avoid SQL logic issues
      const { data: currentMerchant } = await adminSupabase
        .from("merchants")
        .select("shopify_subscription_id")
        .eq("id", merchantId)
        .single();

      if (!subscriptionId || currentMerchant?.shopify_subscription_id === subscriptionId) {
        await adminSupabase
          .from("merchants")
          .update({
            shopify_subscription_id: null,
            shopify_plan:            null,
          })
          .eq("id", merchantId);
      }

      console.log("[shopify/subscription] DECLINED processed", { merchantId });
      break;
    }

    default:
      console.warn("[shopify/subscription] Unhandled status:", status);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
