import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/shopify/oauth";
import { cookies } from "next/headers";

/**
 * Initiates the Shopify OAuth flow.
 * Stores a nonce in a signed cookie for CSRF verification.
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

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/oauth/callback`;
  const { url, nonce } = buildAuthUrl(shopDomain, redirectUri);

  // Store nonce + shop domain in a signed cookie (5-minute expiry)
  const cookieStore = cookies();
  cookieStore.set("shopify_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });
  cookieStore.set("shopify_oauth_shop", shopDomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return NextResponse.json({ url });
}
