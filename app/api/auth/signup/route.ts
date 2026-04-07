import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 signup attempts per IP per hour (fail open if Redis is down)
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const limited = await rateLimit(`rl:signup:${ip}`, 5, 3600);
    if (limited) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }
  } catch {
    // Redis unavailable — fail open, allow signup
  }

  try {
    const { email, password, ref } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Use admin API to create user with email pre-confirmed (no email sending, no rate limits)
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already been registered") || error.message.toLowerCase().includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user?.id) {
      // The handle_new_user trigger fires synchronously but the merchants row
      // may not be visible to a subsequent read in rare timing windows. Retry
      // the onboarded_at reset up to 3× (with short delays) to close the race
      // between trigger execution and the update being applied.
      let resetCount = 0;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 50));
        const { count } = await supabase
          .from("merchants")
          .update({ onboarded_at: null }, { count: "exact" })
          .eq("user_id", data.user.id);
        resetCount = count ?? 0;
        if (resetCount > 0) break;
      }
      if (resetCount === 0) {
        console.warn("[signup] onboarded_at reset found no row after 3 attempts for user:", data.user.id);
      }

      // Save affiliate referral code if provided (first-touch, only when column is NULL)
      const refCode = typeof ref === "string" ? ref.trim().slice(0, 100) : null;
      if (refCode) {
        await supabase
          .from("merchants")
          .update({ affiliate_referral_code: refCode })
          .eq("user_id", data.user.id)
          .is("affiliate_referral_code", null);
      }
    }

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
