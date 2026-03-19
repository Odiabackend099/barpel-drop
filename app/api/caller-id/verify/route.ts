import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * POST /api/caller-id/verify
 * Body: { phone_number: string, code: string }
 * Compares the code to the stored validation_code.
 * On match: stores the verified number and sets caller_id_verified = true.
 */
export async function POST(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const adminSupabase = createAdminClient();

  // Use admin client to read caller_id_validation_code (not in RLS-safe select)
  const { data: merchant } = await adminSupabase
    .from("merchants")
    .select("id, caller_id_validation_code")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  let body: { phone_number?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneNumber = body.phone_number?.trim();
  const code = body.code?.trim();

  if (!phoneNumber || !code) {
    return NextResponse.json(
      { error: "Missing phone_number or code" },
      { status: 400 }
    );
  }

  if (!/^\+\d{7,15}$/.test(phoneNumber)) {
    return NextResponse.json(
      { error: "Invalid phone number format" },
      { status: 400 }
    );
  }

  const storedCode: string | null = merchant.caller_id_validation_code;
  if (!storedCode) {
    return NextResponse.json(
      { error: "No pending verification found. Call /api/caller-id/start first." },
      { status: 400 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  let codesMatch = false;
  try {
    const a = Buffer.from(code);
    const b = Buffer.from(storedCode);
    codesMatch = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    codesMatch = false;
  }

  if (!codesMatch) {
    return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 });
  }

  // Mark caller ID as verified and clear the temp validation code
  const { error: updateError } = await adminSupabase
    .from("merchants")
    .update({
      verified_caller_id: phoneNumber,
      caller_id_verified: true,
      caller_id_validation_code: null,
    })
    .eq("id", merchant.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
