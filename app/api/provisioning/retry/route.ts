import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionMerchantLine } from "@/lib/provisioning/phoneService";

/**
 * POST /api/provisioning/retry
 * Triggers a provisioning retry for the authenticated merchant.
 * Resumes from the failed step — does not restart from scratch.
 */
export async function POST() {
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
    .select("id, provisioning_status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Only retry if currently failed or pending — do not re-provision active merchants
  if (merchant.provisioning_status === "active") {
    return NextResponse.json({
      success: true,
      provisioning_status: "active",
      message: "Already provisioned",
    });
  }

  const result = await provisionMerchantLine(merchant.id);

  // Fetch updated status
  const { data: updated } = await supabase
    .from("merchants")
    .select("provisioning_status")
    .eq("id", merchant.id)
    .single();

  return NextResponse.json({
    success: result.success,
    provisioning_status: updated?.provisioning_status ?? "unknown",
    ...(result.error ? { error: result.error } : {}),
  });
}
