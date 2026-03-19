import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/integrations/cart-stats
 * Returns abandoned cart recovery stats for the last 30 days.
 */
export async function GET(request: Request) {
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: calls } = await supabase
    .from("pending_outbound_calls")
    .select("status")
    .eq("merchant_id", merchant.id)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const total = calls?.length ?? 0;
  const dialed = calls?.filter((c) => ["completed", "dialing", "failed"].includes(c.status)).length ?? 0;
  const recovered = calls?.filter((c) => c.status === "completed").length ?? 0;

  return NextResponse.json({ detected: total, called: dialed, recovered });
}
