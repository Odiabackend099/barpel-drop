import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPasswordChangedEmail } from "@/lib/email/client";

/**
 * Security-critical notification.
 * Called from the settings page after a successful password change.
 * MUST NOT fail silently — password changes are sensitive.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Send security notification — if this fails, return error to client
  try {
    await sendPasswordChangedEmail(user.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[password-changed] Email send failed:", err);
    // Don't hide the error — security notifications must succeed
    return NextResponse.json(
      {
        error:
          "Password changed, but we couldn't send a confirmation email. Please contact support if this is not you.",
      },
      { status: 500 }
    );
  }
}
