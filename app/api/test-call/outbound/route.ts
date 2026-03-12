import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateOutboundCall } from "@/lib/vapi/client";

// Minimum credits required to place a test call (2 minutes per spec 1.10)
const MIN_CREDITS_FOR_TEST_CALL = 120;

/**
 * POST /api/test-call/outbound
 * Body: { phone_number: string } (E.164)
 * Places a real outbound call from the merchant's Vapi assistant.
 * Requires minimum 2 minutes of credits.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, vapi_agent_id, vapi_phone_id, credit_balance, business_name")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  if (!merchant.vapi_agent_id || !merchant.vapi_phone_id) {
    return NextResponse.json(
      { error: "AI phone line not yet provisioned" },
      { status: 409 }
    );
  }

  if ((merchant.credit_balance ?? 0) < MIN_CREDITS_FOR_TEST_CALL) {
    return NextResponse.json(
      {
        error: `Insufficient credits. Test calls require at least ${MIN_CREDITS_FOR_TEST_CALL} seconds (${MIN_CREDITS_FOR_TEST_CALL / 60} minutes).`,
      },
      { status: 402 }
    );
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

  try {
    const callId = await initiateOutboundCall(
      merchant.vapi_agent_id,
      merchant.vapi_phone_id,
      phoneNumber,
      {
        merchant_id: merchant.id,
        call_source: "test",
      }
    );

    return NextResponse.json({ call_id: callId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to initiate call";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
