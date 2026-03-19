import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * POST /api/test-call/browser
 * Returns the Vapi assistant ID and public key for the in-browser test call.
 * The frontend uses these with the @vapi-ai/web SDK to start a WebRTC call.
 * No phone call is made. No Twilio involved.
 */
export async function POST(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, vapi_agent_id, provisioning_status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  if (!merchant.vapi_agent_id) {
    return NextResponse.json(
      { error: "AI assistant not yet provisioned" },
      { status: 409 }
    );
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      { error: "Vapi public key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    assistant_id: merchant.vapi_agent_id,
    public_key: publicKey,
  });
}
