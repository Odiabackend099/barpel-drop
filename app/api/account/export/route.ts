import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

/**
 * GET /api/account/export
 *
 * GDPR Article 20 — Right to Data Portability.
 * Returns a ZIP file containing the merchant's personal data:
 *   - account.json  (profile info)
 *   - calls.csv     (call history)
 *   - billing.csv   (billing transactions)
 */

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select(
      "id, business_name, support_phone, country, created_at, flw_plan, plan_status"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (merchantError || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const zip = new JSZip();

  // account.json
  zip.file(
    "account.json",
    JSON.stringify(
      {
        business_name: merchant.business_name,
        email: user.email ?? null,
        plan: merchant.flw_plan ?? "free",
        plan_status: merchant.plan_status ?? "none",
        phone_number: merchant.support_phone ?? null,
        country: merchant.country ?? null,
        joined: merchant.created_at,
      },
      null,
      2
    )
  );

  // calls.csv
  const { data: calls } = await supabase
    .from("call_logs")
    .select(
      "started_at, duration_seconds, call_type, sentiment, credits_charged, ai_summary, direction"
    )
    .eq("merchant_id", merchant.id)
    .order("started_at", { ascending: false });

  const callsRows = [
    ["Date", "Duration (s)", "Direction", "Type", "Sentiment", "Credits", "Summary"],
    ...(calls ?? []).map((c) => [
      c.started_at ?? "",
      String(c.duration_seconds ?? 0),
      c.direction ?? "",
      c.call_type ?? "general",
      c.sentiment ?? "neutral",
      String(c.credits_charged ?? 0),
      escapeCsv(c.ai_summary ?? ""),
    ]),
  ];
  zip.file("calls.csv", callsRows.map((r) => r.join(",")).join("\n"));

  // billing.csv
  const { data: billing } = await supabase
    .from("billing_transactions")
    .select("created_at, plan, amount, currency, status")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false });

  const billingRows = [
    ["Date", "Plan", "Amount", "Currency", "Status"],
    ...(billing ?? []).map((b) => [
      b.created_at ?? "",
      b.plan ?? "",
      String(b.amount ?? 0),
      b.currency ?? "",
      b.status ?? "",
    ]),
  ];
  zip.file("billing.csv", billingRows.map((r) => r.join(",")).join("\n"));

  const zipBuffer = await zip.generateAsync({ type: "uint8array" });

  return new Response(zipBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="barpel-data-${merchant.id}.zip"`,
    },
  });
}
