import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/calls/[id]
 * Returns a single call log including full transcript and recording URL.
 * Verifies the call belongs to the authenticated merchant.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const callId = params.id;
  if (!callId) {
    return NextResponse.json({ error: "Missing call ID" }, { status: 400 });
  }

  const { data: call, error } = await supabase
    .from("call_logs")
    .select("*")
    .eq("id", callId)
    .eq("merchant_id", merchant.id)
    .single();

  if (error || !call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json({ call });
}
