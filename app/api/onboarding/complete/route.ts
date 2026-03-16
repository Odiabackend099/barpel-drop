import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionMerchantLine } from "@/lib/provisioning/phoneService";
import { checkProvisioningGates } from "@/lib/provisioning/gates";

/**
 * POST /api/onboarding/complete
 *
 * Marks onboarding complete and triggers managed provisioning.
 * Uses the shared checkProvisioningGates() for consistent abuse prevention
 * (email verification, free-trial one-shot limit, 24h rate limit).
 */
export async function POST() {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  // ── Auth ──────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Fetch merchant ────────────────────────────────────────────────────
  const { data: merchant } = await adminSupabase
    .from("merchants")
    .select("id, provisioning_status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // ── Already active — idempotent success ───────────────────────────────
  // Return before running gates so the onboarding page can advance to Step 5.
  if (merchant.provisioning_status === "active") {
    return NextResponse.json({ success: true, already_active: true });
  }

  // ── Security gates ────────────────────────────────────────────────────
  // Covers: provisioning-in-progress (409), free-trial one-shot (402),
  // rate limit 3/24h (429), email not verified (403), + records attempt.
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

  // ── Mark onboarding complete ──────────────────────────────────────────
  await adminSupabase
    .from("merchants")
    .update({
      onboarded_at: new Date().toISOString(),
      onboarding_step: 5,
    })
    .eq("id", merchant.id);

  // Trigger provisioning server-side. waitUntil keeps the Vercel Lambda alive
  // until provisioning completes even after the HTTP response is sent.
  // The onboarding page's Realtime subscription picks up status changes.
  waitUntil(
    provisionMerchantLine(merchant.id).catch((err: unknown) => {
      console.error("[onboarding] provisioning trigger failed:", err);
    })
  );

  return NextResponse.json({ success: true });
}
