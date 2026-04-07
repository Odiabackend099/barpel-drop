import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Auth callback route — exchanges the code from Supabase for a session.
 * Redirects to /onboarding if the merchant hasn't completed setup,
 * otherwise redirects to /dashboard.
 *
 * onboarded_at is the single source of truth for onboarding completion.
 * NULL = needs onboarding. NOT NULL = onboarding done.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // AU-004: Validate next param — only allow relative paths to prevent open redirect
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.includes("://") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  // AU-003: Rate limit by IP — 10 attempts per minute per IP, fail-open if Redis down
  try {
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const limited = await rateLimit(`rl:auth:callback:${ip}`, 10, 60);
    if (limited) {
      return NextResponse.redirect(`${origin}/login?error=too_many_requests`);
    }
  } catch {
    // Redis unavailable — fail open
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: merchant } = await supabase
      .from("merchants")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    // onboarded_at is the single gating signal — NULL means onboarding incomplete
    if (!merchant?.onboarded_at) {
      // new_oauth=1 tells the onboarding page to fire tap('customer', userId)
      return NextResponse.redirect(`${origin}/onboarding?new_oauth=1`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
