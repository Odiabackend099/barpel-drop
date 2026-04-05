import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function verifyHmac(body: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  const hashBuf = Buffer.from(hash);
  const hmacBuf = Buffer.from(hmacHeader);
  // timingSafeEqual requires equal-length buffers — length mismatch = invalid
  if (hashBuf.length !== hmacBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, hmacBuf);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256');
  const topic = req.headers.get('x-shopify-topic');

  if (!verifyHmac(body, hmac)) {
    console.warn('[Shopify Compliance] Invalid HMAC — rejecting request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Shopify Compliance] Received topic: ${topic}`, payload);

  switch (topic) {
    case 'customers/data_request': {
      // A customer has requested their data from the merchant.
      // Barpel only stores call metadata tied to the merchant (not per-customer records).
      // Log for audit trail — merchant must respond to the customer directly within 30 days.
      console.log('[Shopify Compliance] customers/data_request — logged for audit:', {
        shop_id: payload.shop_id,
        shop_domain: payload.shop_domain,
        customer: payload.customer,
        orders_requested: payload.orders_requested,
      });
      break;
    }

    case 'customers/redact': {
      // Merchant has requested deletion of a specific customer's data.
      // Barpel does not store per-customer records independently — call records
      // are associated with the merchant account. Log for compliance.
      console.log('[Shopify Compliance] customers/redact — logged for audit:', {
        shop_id: payload.shop_id,
        shop_domain: payload.shop_domain,
        customer: payload.customer,
        orders_to_redact: payload.orders_to_redact,
      });
      break;
    }

    case 'shop/redact': {
      // Merchant has uninstalled the app. Shopify fires this 48 hours after uninstall.
      // Delete all Shopify integration data for this shop.
      const shopDomain = payload.myshopify_domain as string | undefined;
      const shopId = payload.shop_id as number | undefined;

      if (shopDomain) {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
          );

          const { error } = await supabase
            .from('integrations')
            .delete()
            .eq('platform', 'shopify')
            .eq('shop_domain', shopDomain);

          if (error) {
            console.error('[Shopify Compliance] shop/redact — DB error:', error);
          } else {
            console.log(`[Shopify Compliance] shop/redact — deleted integration for ${shopDomain} (shop_id: ${shopId})`);
          }
        } catch (err) {
          console.error('[Shopify Compliance] shop/redact — unexpected error:', err);
        }
      }
      break;
    }

    default:
      console.log(`[Shopify Compliance] Unhandled topic: ${topic}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
