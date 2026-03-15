import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware that:
 * 1. Refreshes the Supabase auth session on every request (batch cookie API)
 * 2. Protects /dashboard/* and /onboarding routes (redirects to /login)
 * 3. Gates /dashboard/* access behind onboarding completion (onboarded_at IS NOT NULL)
 * 4. Redirects authenticated users from /login to /onboarding or /dashboard
 * 5. Allows webhook routes through without auth (they use HMAC)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected routes — require authentication
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) &&
    !user
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Gate ALL /dashboard/* access behind onboarding completion.
  // onboarded_at is NULL for new users (and any user who skipped/incomplete).
  // This fires on every dashboard request — query is indexed on user_id.
  if (pathname.startsWith("/dashboard") && user) {
    const { data: merchant } = await supabase
      .from("merchants")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!merchant || !merchant.onboarded_at) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Shopify app-load redirect — when a merchant's store already has the app
  // installed, admin.shopify.com/oauth/install skips the OAuth flow and sends
  // the merchant directly to the App URL (/) with hmac + host params but no
  // code. Detect this and forward to the OAuth start route so they can
  // re-authorize and get a fresh access token stored in Vault.
  if (
    pathname === "/" &&
    request.nextUrl.searchParams.has("hmac") &&
    request.nextUrl.searchParams.has("host") &&
    !request.nextUrl.searchParams.has("code") &&
    user
  ) {
    const hostB64 = request.nextUrl.searchParams.get("host") ?? "";
    try {
      const hostDecoded = Buffer.from(hostB64, "base64").toString("utf-8");
      // host format: "admin.shopify.com/admin/stores/{shop}"
      const shopMatch = hostDecoded.match(/\/stores\/([^/]+myshopify\.com)/);
      const shop = shopMatch?.[1] ?? "";
      if (shop) {
        const startUrl = new URL("/api/shopify/oauth/start", request.url);
        startUrl.searchParams.set("returnTo", "integrations");
        startUrl.searchParams.set("shop", shop);
        return NextResponse.redirect(startUrl);
      }
    } catch {
      // Cannot decode host — fall through to landing page
    }
  }

  // Redirect authenticated users away from /login
  if (pathname === "/login" && user) {
    const { data: merchant } = await supabase
      .from("merchants")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!merchant || !merchant.onboarded_at) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     * - API webhook routes (they use HMAC verification, not JWT)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/vapi|api/billing/webhook|api/shopify/oauth/callback|api/outbound|api/cron|api/health).*)",
  ],
};
