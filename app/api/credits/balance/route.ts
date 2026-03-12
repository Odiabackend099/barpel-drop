import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/credits/balance
 * Returns the authenticated merchant's current credit balance.
 */
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("credit_balance")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const balanceSecs = merchant.credit_balance ?? 0;
  const balanceMins = Math.floor(balanceSecs / 60);
  const remainderSecs = balanceSecs % 60;

  let balanceDisplay: string;
  if (balanceSecs === 0) {
    balanceDisplay = "0 sec";
  } else if (balanceMins === 0) {
    balanceDisplay = `${balanceSecs} sec`;
  } else {
    balanceDisplay =
      remainderSecs > 0
        ? `${balanceMins} min ${remainderSecs} sec`
        : `${balanceMins} min`;
  }

  return NextResponse.json({
    balance_seconds: balanceSecs,
    balance_minutes: balanceMins,
    balance_display: balanceDisplay,
  });
}
