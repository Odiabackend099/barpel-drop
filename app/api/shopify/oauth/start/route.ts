import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAuthUrl } from "@/lib/shopify/oauth";

/**
 * Initiates the Shopify OAuth flow.
 * Stores a nonce in the database for CSRF verification (not cookies — they
 * are unreliable on Vercel serverless across redirect hops).
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shopDomain } = await request.json();
  if (!shopDomain) {
    return NextResponse.json(
      { error: "Missing shopDomain" },
      { status: 400 }
    );
  }

  // Validate the domain format
  if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(shopDomain)) {
    return NextResponse.json(
      { error: "Invalid Shopify domain. Expected: your-store.myshopify.com" },
      { status: 400 }
    );
  }

  // Look up merchant for the authenticated user
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant not found" },
      { status: 404 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/oauth/callback`;
  const { url, nonce } = buildAuthUrl(shopDomain, redirectUri);

  // Store nonce in database (replaces cookie-based approach)
  const adminSupabase = createAdminClient();
  const { error: stateError } = await adminSupabase
    .from("oauth_states")
    .insert({
      state: nonce,
      merchant_id: merchant.id,
      shop_domain: shopDomain,
    });

  if (stateError) {
    console.error("[shopify oauth start] Failed to store state:", stateError);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url });
}
