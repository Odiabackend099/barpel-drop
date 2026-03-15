import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionMerchantLine } from "@/lib/provisioning/phoneService";

/**
 * POST /api/onboarding/complete
 *
 * Runs abuse-prevention gates, marks onboarding complete,
 * then returns so the client can fire provisioning separately.
 *
 * Gates:
 *  1. Email must be verified
 *  2. Already-active merchants return idempotent success
 *  3. Rate limit: no double-provisioning within 10 minutes
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

  // ── Gate 1: Email verified ────────────────────────────────────────────
  const { data: authData } = await adminSupabase.auth.admin.getUserById(
    user.id
  );

  if (!authData?.user?.email_confirmed_at) {
    return NextResponse.json(
      { error: "Please verify your email first." },
      { status: 403 }
    );
  }

  // ── Fetch merchant ────────────────────────────────────────────────────
  const { data: merchant } = await adminSupabase
    .from("merchants")
    .select("id, provisioning_status, provisioning_attempted_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // ── Gate 2: Already active (idempotent) ───────────────────────────────
  if (merchant.provisioning_status === "active") {
    return NextResponse.json({ success: true, already_active: true });
  }

  // ── Gate 3: Rate limit — prevent double provisioning ──────────────────
  if (
    merchant.provisioning_status === "provisioning" &&
    merchant.provisioning_attempted_at
  ) {
    const elapsed =
      Date.now() - new Date(merchant.provisioning_attempted_at).getTime();
    if (elapsed < 10 * 60 * 1000) {
      return NextResponse.json(
        { error: "Provisioning already in progress. Please wait." },
        { status: 429 }
      );
    }
  }

  // ── Mark onboarding complete ──────────────────────────────────────────
  await adminSupabase
    .from("merchants")
    .update({
      onboarded_at: new Date().toISOString(),
      onboarding_step: 4,
    })
    .eq("id", merchant.id);

  // Trigger provisioning server-side (non-blocking). This ensures provisioning
  // starts even if the browser closes immediately after this response.
  // The onboarding page's Realtime subscription picks up status changes.
  provisionMerchantLine(merchant.id).catch((err: unknown) => {
    console.error("[onboarding] provisioning trigger failed:", err);
  });

  return NextResponse.json({ success: true });
}
