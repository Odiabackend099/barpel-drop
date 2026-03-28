import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  const { data: users, error: authErr } = await sb.auth.admin.listUsers();
  if (authErr) { console.error("Auth error:", authErr); process.exit(1); }

  const user = (users.users as any[]).find((u) => u.email === "raphaelusenkposo@gmail.com");
  if (!user) { console.error("User not found"); process.exit(1); }
  console.log("User ID:", user.id);

  const { data: merchant, error: mErr } = await sb.from("merchants").select("id, business_name, provisioning_status").eq("user_id", user.id).is("deleted_at", null).single();
  if (mErr) { console.error("Merchant error:", mErr); process.exit(1); }
  console.log("Merchant:", JSON.stringify(merchant));
}

main().catch(e => { console.error(e); process.exit(1); });
