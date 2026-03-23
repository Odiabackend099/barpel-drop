import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/supabase/auth-guard";
import { CustomerPortal } from "@dodopayments/nextjs";

/**
 * GET /api/billing/dodo/customer-portal?customer_id=cus_xxx
 *
 * Redirects the authenticated customer to the Dodo-hosted customer portal.
 * From the portal, subscribers can:
 *   - Update their payment method
 *   - View past invoices and receipts
 *   - Manage their subscription
 *
 * Security: verifies the customer_id belongs to the authenticated merchant
 * before calling Dodo — prevents IDOR (accessing another user's billing portal).
 */

const _portalHandler = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode") as
    | "test_mode"
    | "live_mode",
});

export async function GET(request: Request) {
  const supabase = createClient();

  const { user } = await getAuthUser(supabase, request);
  if (!user) return unauthorizedResponse();

  const url = new URL(request.url);
  const customer_id = url.searchParams.get("customer_id");
  if (!customer_id) {
    return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
  }

  // Verify ownership — prevents IDOR
  const { data: merchant } = await supabase
    .from("merchants")
    .select("dodo_customer_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!merchant || merchant.dodo_customer_id !== customer_id) {
    return NextResponse.json(
      { error: "Customer not found on this account" },
      { status: 403 }
    );
  }

  return _portalHandler(request as Parameters<typeof _portalHandler>[0]);
}
