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
