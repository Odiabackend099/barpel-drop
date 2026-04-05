import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

// Rate limit: 10 updates per minute per merchant
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "60 s"),
  analytics: true,
});

/**
 * POST /api/merchant/forwarding
 * Body: { store_phone, forwarding_enabled, forwarding_type?, forwarding_carrier? }
 *
 * Saves the merchant's existing store phone number and call forwarding preferences.
 * The store_phone is used for analytics and to identify which number is being forwarded.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  // Rate limit per user
  try {
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("[forwarding] Rate limit check failed:", err);
    // Continue without rate limiting if Upstash is down (fail open)
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, user_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Double-check ownership (defense in depth)
  if (merchant.user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: {
    store_phone?: string;
    forwarding_enabled?: boolean;
    forwarding_type?: string;
    forwarding_carrier?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { store_phone, forwarding_enabled, forwarding_type, forwarding_carrier } = body;

  if (store_phone !== undefined && store_phone !== null && store_phone !== "") {
    if (!E164_REGEX.test(store_phone)) {
      return NextResponse.json(
        { error: "store_phone must be in E.164 format (e.g. +2348012345678 or +14155551234)" },
        { status: 400 }
      );
    }
  }

  const update: Record<string, unknown> = {};
  if (store_phone !== undefined) update.store_phone = store_phone || null;
  if (forwarding_enabled !== undefined) update.forwarding_enabled = forwarding_enabled;
  if (forwarding_type !== undefined) update.forwarding_type = forwarding_type;
  if (forwarding_carrier !== undefined) update.forwarding_carrier = forwarding_carrier;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("merchants")
    .update(update)
    .eq("id", merchant.id);

  if (error) {
    return NextResponse.json({ error: "Failed to save forwarding settings" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
