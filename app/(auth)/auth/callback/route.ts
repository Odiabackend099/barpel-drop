import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Auth callback route — exchanges the code from Supabase for a session.
 * Redirects to /onboarding if the merchant hasn't completed setup,
 * otherwise redirects to /dashboard.
 *
 * onboarded_at is the single source of truth for onboarding completion.
 * NULL = needs onboarding. NOT NULL = onboarding done or dismissed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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
      .select("onboarded_at, onboarding_step")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    // New user or incomplete onboarding → ensure onboarded_at is NULL and redirect
    if (!merchant || !merchant.onboarded_at || (merchant.onboarding_step ?? 0) < 4) {
      // Reset onboarded_at to NULL in case the column DEFAULT set it automatically.
      // This ensures middleware correctly gates /dashboard until onboarding is done.
      if (merchant?.onboarded_at && (merchant.onboarding_step ?? 0) < 4) {
        const admin = createAdminClient();
        await admin
          .from("merchants")
          .update({ onboarded_at: null })
          .eq("user_id", user.id);
      }
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
