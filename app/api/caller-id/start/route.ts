import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limit: 3 verification calls per 10 minutes per user (prevents phone call flooding)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(3, "600 s"),
  analytics: true,
});

/**
 * POST /api/caller-id/start
 * Body: { phone_number: string } (E.164 format)
 * Calls Twilio to request a caller ID verification call.
 * Twilio calls the number and speaks a 6-digit validation code.
 * Stores the validation_code in the merchants table temporarily.
 */
export async function POST(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  // Rate limit per user — prevents phone call flooding
  try {
    const { success } = await ratelimit.limit(`caller-id:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("[caller-id/start] Rate limit check failed:", err);
    // Continue without rate limiting if Upstash is down (fail open)
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  let body: { phone_number?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneNumber = body.phone_number?.trim();
  if (!phoneNumber || !/^\+\d{7,15}$/.test(phoneNumber)) {
    return NextResponse.json(
      { error: "Invalid phone number. Must be E.164 format (e.g. +447911123456)" },
      { status: 400 }
    );
  }

  // Call Twilio OutgoingCallerIds API to request verification call
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json(
      { error: "Caller ID verification is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const twilioResp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/OutgoingCallerIds.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        PhoneNumber: phoneNumber,
        FriendlyName: "Barpel Caller ID Verification",
        CallDelay: "5",
        ...(process.env.NEXT_PUBLIC_BASE_URL
          ? { StatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/caller-id/status` }
          : {}),
      }),
    }
  );

  if (!twilioResp.ok) {
    const text = await twilioResp.text();
    console.error("[caller-id/start] Twilio request failed:", text);
    return NextResponse.json(
      { error: "Failed to initiate verification call" },
      { status: 502 }
    );
  }

  const twilioData = await twilioResp.json();
  const validationCode: string = twilioData.validation_code;

  if (!validationCode) {
    return NextResponse.json(
      { error: "Verification service did not return a code" },
      { status: 502 }
    );
  }

  // Store validation code temporarily in merchant row (overwritten on each attempt)
  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("merchants")
    .update({ caller_id_validation_code: validationCode })
    .eq("id", merchant.id);

  return NextResponse.json({
    message: "A call is being placed to your number. Enter the code you hear.",
    validation_code: validationCode,
  });
}
