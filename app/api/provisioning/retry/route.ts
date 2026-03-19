import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionMerchantLine } from "@/lib/provisioning/phoneService";
import { checkProvisioningGates } from "@/lib/provisioning/gates";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * POST /api/provisioning/retry
 * Triggers a provisioning retry for the authenticated merchant.
 * Resumes from the failed step — does not restart from scratch.
 * Accepts optional JSON body with { country } to set merchant country before provisioning.
 */
export async function POST(request: Request) {
  const supabase = createClient();

    const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, provisioning_status, provisioning_mode")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // BYOC merchants cannot be retried via this endpoint — provisionMerchantLine()
  // uses Barpel's Twilio subaccount, not the merchant's own credentials.
  if (merchant.provisioning_mode === "byoc") {
    return NextResponse.json(
      {
        success: false,
        provisioning_status: merchant.provisioning_status,
        error:
          "BYOC lines cannot be retried here. Please reconnect your number from the Integrations page.",
      },
      { status: 422 }
    );
  }

  // Security gates — blocks if already active, free provision used, rate limited,
  // or email not verified. Also records the attempt on pass.
  const adminSupabase = createAdminClient();
  const gateResult = await checkProvisioningGates(
    merchant.id,
    user.id,
    adminSupabase
  );

  if (!gateResult.allowed) {
    return NextResponse.json(
      {
        error: gateResult.error,
        ...(gateResult.requiresUpgrade ? { requiresUpgrade: true } : {}),
      },
      { status: gateResult.status ?? 400 }
    );
  }

  // Accept optional country from request body
  let body: { country?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — country is optional
  }

  if (body.country) {
    const validCountries = ["GB", "US", "CA", "NG", "GH", "KE"];
    if (!validCountries.includes(body.country)) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }
    await adminSupabase
      .from("merchants")
      .update({ country: body.country })
      .eq("id", merchant.id);
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
