import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/caller-id/status
 * Twilio StatusCallback webhook for OutgoingCallerIds verification.
 * Receives VerificationStatus (success/failed) after the verification call ends.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const verificationStatus = formData.get("VerificationStatus") as string;
  const phoneNumber = formData.get("To") as string;
  const outgoingCallerIdSid = formData.get("OutgoingCallerIdSid") as string;

  console.log(
    `[caller-id/status] Phone: ${phoneNumber}, Status: ${verificationStatus}, SID: ${outgoingCallerIdSid ?? "N/A"}`
  );

  if (verificationStatus === "success" && phoneNumber) {
    const adminSupabase = createAdminClient();
    // Mark the merchant's caller ID as fully verified on Twilio's side
    await adminSupabase
      .from("merchants")
      .update({
        verified_caller_id: phoneNumber,
        caller_id_validation_code: null,
      })
      .eq("store_phone", phoneNumber);
  }

  if (verificationStatus === "failed" && phoneNumber) {
    console.error(`[caller-id/status] Verification FAILED for ${phoneNumber}`);
  }

  // Twilio expects 200 OK
  return NextResponse.json({ received: true });
}
