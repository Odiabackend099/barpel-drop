/**
 * One-time repair script: provisions all merchants stuck at pending/failed
 * with no vapi_agent_id.
 *
 * Run: npx tsx --env-file=.env.local scripts/reprovision-stuck.ts
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_KEY in .env.local
 *   - VAPI_PRIVATE_KEY in .env.local
 *   - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN in .env.local
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { provisionMerchantLine } from "@/lib/provisioning/phoneService";

async function main() {
  const supabase = createAdminClient();

  const { data: merchants, error } = await supabase
    .from("merchants")
    .select("id, business_name, provisioning_status")
    .in("provisioning_status", ["pending", "failed"])
    .is("vapi_agent_id", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Failed to fetch merchants:", error.message);
    process.exit(1);
  }

  if (!merchants || merchants.length === 0) {
    console.log("✅ No stuck merchants found — all provisioned.");
    return;
  }

  console.log(`Found ${merchants.length} stuck merchant(s):\n`);
  merchants.forEach((m) => {
    console.log(`  • ${m.business_name} (${m.id}) — ${m.provisioning_status}`);
  });
  console.log();

  let successCount = 0;
  let failCount = 0;

  for (const merchant of merchants) {
    console.log(`⏳ Provisioning: ${merchant.business_name} (${merchant.id})`);
    try {
      const result = await provisionMerchantLine(merchant.id);
      if (result.success) {
        console.log(`✅ Done: ${merchant.business_name}`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${merchant.business_name} — ${result.error}`);
        failCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error: ${merchant.business_name} — ${msg}`);
      failCount++;
    }
    console.log();
  }

  console.log(`\nSummary: ${successCount} succeeded, ${failCount} failed`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
