import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

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

    // The handle_new_user trigger fires synchronously and may set onboarded_at = NOW()
    // via the column DEFAULT. Explicitly reset it to NULL so the middleware correctly
    // routes new users to /onboarding instead of /dashboard.
    if (data.user?.id) {
      await supabase
        .from("merchants")
        .update({ onboarded_at: null })
        .eq("user_id", data.user.id);
    }

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
