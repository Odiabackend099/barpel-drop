import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";

/**
 * GET /api/calls/export
 * Returns a CSV file containing ALL call logs for the authenticated merchant.
 * No pagination — intended for full data export / download.
 */

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { user } = await getAuthUser(supabase, request);
    if (!user) return unauthorizedResponse();

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const { data: calls, error } = await supabase
      .from("call_logs")
      .select(
        "started_at, duration_seconds, direction, call_type, sentiment, credits_charged, ai_summary, caller_number, ended_reason"
      )
      .eq("merchant_id", merchant.id)
      .order("started_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = [
      [
        "Date",
        "Duration (s)",
        "Direction",
        "Type",
        "Sentiment",
        "Credits",
        "End Reason",
        "Summary",
      ].join(","),
      ...(calls ?? []).map((c) =>
        [
          c.started_at ?? "",
          String(c.duration_seconds ?? 0),
          c.direction ?? "",
          c.call_type ?? "general",
          c.sentiment ?? "neutral",
          String(c.credits_charged ?? 0),
          escapeCsv(c.ended_reason ?? ""),
          escapeCsv(c.ai_summary ?? ""),
        ].join(",")
      ),
    ];

    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="call-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("[api/calls/export]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
