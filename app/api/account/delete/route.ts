import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountDeletedEmail } from "@/lib/email/client";

/**
 * DELETE /api/account/delete
 *
 * GDPR Article 17 — Right to Erasure.
 * Permanently deletes the authenticated merchant's account and all personal data.
 * Financial records (billing_transactions) are anonymised but retained for 7 years.
 * Call logs are anonymised (PII removed, credits_charged retained for audit).
 *
 * Deletion order matters:
 *  1. Cancel Flutterwave subscription (stop billing first)
 *  2. Release Vapi phone number (holds reference to assistant)
 *  3. Delete Vapi assistant
 *  4. Delete Vault secrets (Shopify tokens, BYOC Twilio creds)
 *  5. Anonymise call logs (keep for audit, remove PII)
 *  6. Delete personal data tables
 *  7. Anonymise billing transactions (financial law: 7-year retention)
 *  8. Delete merchant row
 *  9. Delete Supabase auth user (last — invalidates session)
 * 10. Send confirmation email (fire-and-forget)
 */
export async function DELETE(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "Invalid confirmation. Type DELETE to confirm." },
      { status: 400 }
    );
  }

  // Fetch merchant with all fields needed for cleanup
  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select(
      "id, user_id, email, business_name, flw_subscription_id, vapi_agent_id, vapi_phone_id, provisioning_mode"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (merchantError || !merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const adminSupabase = createAdminClient();
  const errors: string[] = [];
  const merchantEmail = merchant.email ?? user.email;

  // Step 1: Cancel Flutterwave subscription
  if (merchant.flw_subscription_id) {
    try {
      await fetch(
        `https://api.flutterwave.com/v3/subscriptions/${merchant.flw_subscription_id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`FLW cancel: ${msg}`);
    }
  }

  // Step 2: Release Vapi phone number
  if (merchant.vapi_phone_id) {
    try {
      const res = await fetch(
        `https://api.vapi.ai/phone-number/${merchant.vapi_phone_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          },
        }
      );
      if (!res.ok && res.status !== 404) {
        errors.push(`Vapi phone delete: ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Vapi phone delete: ${msg}`);
    }
  }

  // Step 3: Delete Vapi assistant
  if (merchant.vapi_agent_id) {
    try {
      const res = await fetch(
        `https://api.vapi.ai/assistant/${merchant.vapi_agent_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          },
        }
      );
      if (!res.ok && res.status !== 404) {
        errors.push(`Vapi assistant delete: ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Vapi assistant delete: ${msg}`);
    }
  }

  // Step 4: Delete Vault secrets
  try {
    // BYOC Twilio credentials
    if (merchant.provisioning_mode === "byoc") {
      await adminSupabase
        .rpc("vault_delete_secret_by_id", {
          secret_id: `twilio_byoc_sid_${merchant.id}`,
        })
        .throwOnError();
      await adminSupabase
        .rpc("vault_delete_secret_by_id", {
          secret_id: `twilio_byoc_token_${merchant.id}`,
        })
        .throwOnError();
    }

    // Shopify access token from vault
    const { data: integration } = await adminSupabase
      .from("integrations")
      .select("access_token_secret_id, webhook_secret_vault_id")
      .eq("merchant_id", merchant.id)
      .eq("platform", "shopify")
      .single();

    if (integration?.access_token_secret_id) {
      await adminSupabase.rpc("vault_delete_secret_by_id", {
        secret_id: integration.access_token_secret_id,
      });
    }
    if (integration?.webhook_secret_vault_id) {
      await adminSupabase.rpc("vault_delete_secret_by_id", {
        secret_id: integration.webhook_secret_vault_id,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Vault delete: ${msg}`);
  }

  // Step 5: Anonymise call logs — keep for audit, remove PII
  try {
    await adminSupabase
      .from("call_logs")
      .update({
        caller_number: "deleted",
        transcript: "deleted",
        tool_results: null,
        ai_summary: null,
        recording_url: null,
        messages_raw: null,
      })
      .eq("merchant_id", merchant.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Anonymise call logs: ${msg}`);
  }

  // Step 6: Delete personal data tables
  try {
    await adminSupabase
      .from("abandoned_carts")
      .delete()
      .eq("merchant_id", merchant.id);
  } catch {
    // Table may not exist — non-critical
  }

  try {
    await adminSupabase
      .from("pending_outbound_calls")
      .delete()
      .eq("merchant_id", merchant.id);
  } catch {
    // Non-critical
  }

  try {
    await adminSupabase
      .from("integrations")
      .delete()
      .eq("merchant_id", merchant.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Delete integrations: ${msg}`);
  }

  try {
    await adminSupabase
      .from("oauth_states")
      .delete()
      .eq("merchant_id", merchant.id);
  } catch {
    // Non-critical
  }

  // Step 7: Anonymise billing transactions — financial law requires 7-year retention
  try {
    await adminSupabase
      .from("billing_transactions")
      .update({ merchant_id: null })
      .eq("merchant_id", merchant.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Anonymise billing: ${msg}`);
  }

  // Step 8: Delete merchant row
  try {
    await adminSupabase.from("merchants").delete().eq("id", merchant.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Delete merchant: ${msg}`);
    // If merchant deletion fails, this is critical — but we still try to clean up auth
  }

  // Step 9: Delete Supabase auth user — LAST (invalidates session)
  try {
    await adminSupabase.auth.admin.deleteUser(merchant.user_id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Delete auth user: ${msg}`);
  }

  // Step 10: Send confirmation email (fire-and-forget)
  if (merchantEmail) {
    sendAccountDeletedEmail(merchantEmail).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[account/delete] Email failed:", msg);
    });
  }

  if (errors.length > 0) {
    console.error("[account/delete] Cleanup errors:", errors);
  }

  return NextResponse.json({ success: true });
}
