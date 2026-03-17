import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateOutboundCall } from "@/lib/vapi/client";

/**
 * POST /api/vapi/outbound
 *
 * Triggers an outbound call from the merchant's AI phone line to a customer.
 * Authenticated via Supabase session (dashboard user must be logged in).
 *
 * Body: { customerPhone: string }  — E.164 format, e.g. "+14707620377"
 *
 * Vapi API contract (verified):
 *   POST https://api.vapi.ai/call
 *   { assistantId, phoneNumberId, customer: { number } }
 *   Source: https://docs.vapi.ai/calls/outbound-calling
 */
export async function POST(request: Request) {
  const supabase = createClient();

  // Authenticate: require logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const customerPhone: string | undefined = body.customerPhone;

  // Validate E.164 format
  if (!customerPhone?.match(/^\+[1-9]\d{9,14}$/)) {
    return NextResponse.json(
      { error: "Phone number must be in E.164 format, e.g. +14707620377" },
      { status: 400 }
    );
  }

  // Look up merchant by authenticated user
  const { data: merchant } = await supabase
    .from("merchants")
    .select(
      "id, vapi_agent_id, vapi_phone_id, provisioning_status, business_name"
    )
    .eq("user_id", user.id)
    .single();

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant not found" },
      { status: 404 }
    );
  }

  if (merchant.provisioning_status !== "active") {
    return NextResponse.json(
      { error: "Your AI phone line is not set up yet" },
      { status: 400 }
    );
  }

  if (!merchant.vapi_agent_id || !merchant.vapi_phone_id) {
    return NextResponse.json(
      { error: "AI phone line is missing configuration. Please re-provision." },
      { status: 400 }
    );
  }

  try {
    const callId = await initiateOutboundCall(
      merchant.vapi_agent_id,
      merchant.vapi_phone_id,
      customerPhone,
      { merchant_id: merchant.id }
    );

    return NextResponse.json({
      success: true,
      callId,
      status: "queued",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[outbound] Vapi error:", message);
    return NextResponse.json(
      { error: "Failed to start call" },
      { status: 500 }
    );
  }
}
