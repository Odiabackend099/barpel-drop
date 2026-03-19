import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Safe wrapper around supabase.auth.getUser() that never throws.
 * Returns { user, error } — if anything goes wrong, user is null.
 *
 * Supports two auth methods:
 * 1. Cookie-based sessions (default Supabase SSR flow)
 * 2. Bearer token in Authorization header (for API clients / test tools)
 */
export async function getAuthUser(supabase: SupabaseClient, request?: Request) {
  try {
    // Try cookie-based auth first (default Supabase SSR flow)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return { user, error: null };

    // Fallback: check for Bearer token in Authorization header
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: { user: tokenUser }, error: tokenError } =
          await supabase.auth.getUser(token);
        if (!tokenError && tokenUser) return { user: tokenUser, error: null };
      }
    }

    return { user: null, error: error?.message ?? "Unauthorized" };
  } catch (err) {
    console.error(
      "[auth-guard] Unexpected auth error:",
      err instanceof Error ? err.message : err,
    );
    return { user: null, error: "Unauthorized" };
  }
}

/** Standard 401 JSON response for unauthorized requests. */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
