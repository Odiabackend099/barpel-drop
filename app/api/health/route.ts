import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Health check endpoint.
 * Returns 200 with status 'ok' if Supabase is reachable,
 * or 'degraded' if the DB ping fails.
 */
export async function GET() {
  const timestamp = Date.now();
  let dbStatus: "ok" | "unreachable" = "ok";

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("merchants")
      .select("id", { count: "exact", head: true });

    if (error) {
      dbStatus = "unreachable";
    }
  } catch {
    dbStatus = "unreachable";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const statusCode = status === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      version: "1.0.0",
      database: dbStatus,
    },
    { status: statusCode }
  );
}
