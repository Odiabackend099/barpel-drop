import { NextResponse } from "next/server";

/**
 * DEPRECATED: End-of-call processing has moved to /api/vapi/webhook.
 * This route is kept alive to prevent 404 if Vapi is still configured
 * to send end-of-call events here.
 */
export async function POST() {
  return NextResponse.json({ ok: true, deprecated: true });
}
