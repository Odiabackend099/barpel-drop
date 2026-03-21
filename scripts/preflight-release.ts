import { createClient } from '@supabase/supabase-js'

async function main() {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: integrations, error } = await adminSupabase
    .from('integrations')
    .select('id, merchant_id, shop_domain, shop_name, access_token_secret_id')
    .eq('platform', 'shopify')
    .eq('connection_active', true)

  if (error) { console.error('Query error:', error); process.exit(1) }

  console.log('Active Shopify integrations found:', integrations?.length ?? 0)
  integrations?.forEach((i: any) => console.log(`  - ${i.shop_name} | ${i.shop_domain} | merchant: ${i.merchant_id}`))

  for (const integration of integrations ?? []) {
    console.log(`\nReleasing: ${integration.shop_domain}`)

    if (integration.access_token_secret_id) {
      const { data: token } = await adminSupabase
        .rpc('vault_read_secret_by_id', { p_id: integration.access_token_secret_id })

      if (token) {
        try {
          const webhooksRes = await fetch(
            `https://${integration.shop_domain}/admin/api/2026-01/webhooks.json`,
            { headers: { 'X-Shopify-Access-Token': token } }
          )
          const webhooksData = await webhooksRes.json()
          for (const wh of (webhooksData?.webhooks ?? []) as any[]) {
            if (wh.address?.includes('barpel') || wh.address?.includes('dropship')) {
              await fetch(
                `https://${integration.shop_domain}/admin/api/2026-01/webhooks/${wh.id}.json`,
                { method: 'DELETE', headers: { 'X-Shopify-Access-Token': token } }
              )
              console.log(`  ✅ Deleted webhook: ${wh.topic}`)
            }
          }
        } catch (e: any) {
          console.log(`  ⚠️ Webhook deletion skipped: ${e.message}`)
        }
      }

      const { error: vaultErr } = await adminSupabase
        .rpc('vault_delete_secret_by_id', { p_id: integration.access_token_secret_id })
      if (vaultErr) console.log(`  ⚠️ Vault: ${vaultErr.message}`)
      else console.log(`  ✅ Vault token deleted`)
    }

    const { error: updateErr } = await adminSupabase
      .from('integrations')
      .update({ connection_active: false, access_token_secret_id: null })
      .eq('id', integration.id)
    if (updateErr) { console.error(`  ❌ DB error: ${updateErr.message}`); process.exit(1) }
    else console.log(`  ✅ Integration disconnected in DB`)
  }

  const { data: remaining } = await adminSupabase
    .from('integrations')
    .select('id')
    .eq('platform', 'shopify')
    .eq('connection_active', true)

  console.log(`\nRemaining active: ${remaining?.length ?? 0}`)
  if ((remaining?.length ?? 0) === 0) {
    console.log('✅ All Shopify integrations released. veemagicspurs-2 is free.')
  } else {
    console.error('❌ Some still active'); process.exit(1)
  }
}

main()
