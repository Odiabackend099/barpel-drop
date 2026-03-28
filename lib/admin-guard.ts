import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import type { User } from "@supabase/supabase-js";

/**
 * Reusable admin auth guard.
 * Returns { user, response } — if response is non-null, return it from the route handler.
 * Checks ADMIN_EMAILS env var (comma-separated, case-insensitive).
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: User; response: null } | { user: null; response: NextResponse }> {
  const supabase = createClient();
  const { user } = await getAuthUser(supabase, request);

  if (!user?.email) {
    return { user: null, response: unauthorizedResponse() };
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, response: null };
}
