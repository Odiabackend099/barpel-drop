import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Shopify app_subscriptions/update webhook handler.
 *
 * Security:   Per-shop HMAC verification via Vault webhook secret.
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

async function verifyHmac(
  body: string,
  hmacHeader: string | null,
  merchantId: string
): Promise<boolean> {
  if (!hmacHeader) return false;

  const adminSupabase = createAdminClient();
  const secretName = `shopify-webhook-secret-${merchantId}`;

  // Retrieve per-shop webhook secret from Vault
  const { data: secretRows } = await adminSupabase
    .rpc("vault_lookup_secret_by_name", { p_name: secretName });

  const vaultSecretId: string | null =
    Array.isArray(secretRows) && secretRows[0]?.id ? secretRows[0].id : null;

  let webhookSecret: string | null = null;
  if (vaultSecretId) {
    const { data: secretData } = await adminSupabase
      .rpc("vault_read_secret_by_id", { p_id: vaultSecretId });
    webhookSecret = (secretData as string | null) ?? null;
  }

  // Fall back to shared API secret if per-shop secret not found
  if (!webhookSecret) {
    webhookSecret = process.env.SHOPIFY_API_SECRET ?? null;
  }

  if (!webhookSecret) return false;

  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(body, "utf8")
    .digest("base64");

  const hashBuf = Buffer.from(hash);
  const hmacBuf = Buffer.from(hmacHeader);
  if (hashBuf.length !== hmacBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, hmacBuf);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  const webhookId  = req.headers.get("x-shopify-webhook-id");
  const shopDomain = req.headers.get("x-shopify-shop-domain");

  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Look up merchant by shop domain via integrations table
  const { data: integration } = await adminSupabase
    .from("integrations")
    .select("merchant_id")
    .eq("shop_domain", shopDomain)
    .eq("platform", "shopify")
    .single();

  if (!integration) {
    // Unknown shop — return 200 to prevent Shopify retry storm
    console.warn("[shopify/subscription] Unknown shop domain:", shopDomain);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const merchantId = integration.merchant_id;

  // HMAC verification — uses per-shop Vault secret
  const valid = await verifyHmac(body, hmacHeader, merchantId);
  if (!valid) {
    console.warn("[shopify/subscription] Invalid HMAC for shop:", shopDomain);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotency guard — keyed on X-Shopify-Webhook-Id
  if (webhookId) {
    const { error: idempotencyError } = await adminSupabase
      .from("webhook_events")
      .insert({ event_id: webhookId, source: "shopify" });

    if (idempotencyError) {
      // Unique constraint violation = already processed
      console.log("[shopify/subscription] Duplicate webhook, skipping:", webhookId);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
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
        console.error("[shopify/subscription] Unrecognized plan handle:", name);
        return NextResponse.json({ error: "Unrecognized plan handle" }, { status: 400 });
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
      // Clear any pending subscription state — no credits granted
      await adminSupabase
        .from("merchants")
        .update({
          shopify_subscription_id: null,
          shopify_plan:            null,
        })
        .eq("id", merchantId)
        .is("shopify_subscription_id", subscriptionId ?? null);

      console.log("[shopify/subscription] DECLINED processed", { merchantId });
      break;
    }

    default:
      console.log("[shopify/subscription] Unhandled status:", status);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
