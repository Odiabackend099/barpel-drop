import { SupabaseClient } from "@supabase/supabase-js";

interface GateResult {
  allowed: boolean;
  error?: string;
  status?: number;
  requiresUpgrade?: boolean;
}

/**
 * Checks all provisioning security gates before allowing a merchant to
 * provision a new phone number (managed or BYOC).
 *
 * Gate 1: Blocks if already active or provisioning in progress (409)
 * Gate 2: Blocks free-trial merchants who already used their free provision (402)
 * Gate 3: Rate limits to 3 provisioning attempts per 24-hour window (429)
 * Gate 4: Requires verified email address (403)
 * Gate 5: Records the attempt (side effect — runs only if all gates pass)
 */
export async function checkProvisioningGates(
  merchantId: string,
  userId: string,
  adminSupabase: SupabaseClient
): Promise<GateResult> {
  // Fetch merchant state needed for gates 1-3
  const { data: merchant } = await adminSupabase
    .from("merchants")
    .select(
      "provisioning_status, plan, has_used_free_provision, provision_count, provisioning_attempted_at"
    )
    .eq("id", merchantId)
    .single();

  if (!merchant) {
    return { allowed: false, error: "Merchant not found", status: 404 };
  }

  // Gate 1 — One active provisioning at a time
  if (merchant.provisioning_status === "active") {
    return {
      allowed: false,
      error:
        "You already have an active phone line. Release it before provisioning a new one.",
      status: 409,
    };
  }
  if (merchant.provisioning_status === "provisioning") {
    return {
      allowed: false,
      error: "Provisioning is already in progress. Please wait.",
      status: 409,
    };
  }

  // Gate 2 — Free trial gets one free provision only
  // Paid plan merchants (starter/growth/scale) can re-provision freely.
  if (merchant.has_used_free_provision && merchant.plan === "free_trial") {
    return {
      allowed: false,
      error: "Your free provision has been used. Upgrade to a paid plan to provision a new number.",
      status: 402,
      requiresUpgrade: true,
    };
  }

  // Gate 3 — Rate limit: max 3 provisioning attempts per 24 hours
  const oneDayMs = 24 * 60 * 60 * 1000;
  let currentCount = merchant.provision_count ?? 0;

  if (merchant.provisioning_attempted_at) {
    const lastAttempt = new Date(merchant.provisioning_attempted_at).getTime();
    if (Date.now() - lastAttempt > oneDayMs) {
      // Window expired — reset counter
      currentCount = 0;
    }
  } else {
    // No previous attempts — counter starts fresh
    currentCount = 0;
  }

  if (currentCount >= 3) {
    return {
      allowed: false,
      error: "Too many provisioning attempts. Please try again tomorrow.",
      status: 429,
    };
  }

  // Gate 4 — Email must be verified before provisioning
  const { data: authData } = await adminSupabase.auth.admin.getUserById(userId);
  if (!authData?.user?.email_confirmed_at) {
    return {
      allowed: false,
      error: "Please verify your email address before provisioning a phone number.",
      status: 403,
    };
  }

  // Gate 5 — Record attempt (all gates passed)
  await adminSupabase
    .from("merchants")
    .update({
      provision_count: currentCount + 1,
      provisioning_attempted_at: new Date().toISOString(),
    })
    .eq("id", merchantId);

  return { allowed: true };
}
