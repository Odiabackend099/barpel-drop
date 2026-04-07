import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * POST /api/affiliate/track
 * Saves affiliate referral code to the authenticated merchant's row (first-touch only).
 * Called by onboarding/page.tsx after Google OAuth signups that had a ?ref= param.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { user } = await getAuthUser(supabase, req);
  if (!user) return unauthorizedResponse();

  try {
    const { ref_code } = await req.json();
    const refCode = typeof ref_code === "string" ? ref_code.trim().slice(0, 100) : null;

    if (!refCode) {
      return NextResponse.json({ error: "ref_code is required." }, { status: 400 });
    }

    // First-touch attribution — never overwrite an existing referral code
    await supabase
      .from("merchants")
      .update({ affiliate_referral_code: refCode })
      .eq("user_id", user.id)
      .is("affiliate_referral_code", null);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
