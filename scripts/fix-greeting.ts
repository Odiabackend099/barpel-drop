import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const merchantId = "3d1ffa3e-5ed6-4e26-8336-d67099bd68f3";

  // Get merchant business_name
  const { data: merchant } = await supabase
    .from("merchants")
    .select("business_name, vapi_agent_id")
    .eq("id", merchantId)
    .single();

  console.log("Merchant:", merchant?.business_name);

  // Update the Vapi assistant's first message
  const vapi_key = process.env.VAPI_PRIVATE_KEY;
  const assistantId = merchant?.vapi_agent_id;

  const updateRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${vapi_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstMessage: `Good day. Thank you for calling ${merchant?.business_name}. How may I assist you today?`,
    }),
  });

  const result = await updateRes.json();
  console.log("✅ Updated greeting:", result.firstMessage);
}

main().catch(console.error);
