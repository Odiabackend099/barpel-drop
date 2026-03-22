/**
 * Disconnect the stale Velocity Gadgets / veemagicspurs-2 Shopify integration
 * from Supabase so the merchant can be re-onboarded cleanly.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/release-veemagic-shopify.ts
 */

import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function main() {
  console.log('\nFinding veemagicspurs-2 Shopify integrations...')

  const { data: integrations, error } = await adminSupabase
    .from('integrations')
    .select('id, merchant_id, shop_domain, shop_name, access_token_secret_id')
    .eq('platform', 'shopify')
    .ilike('shop_domain', '%veemagic%')

  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${integrations?.length ?? 0} integration(s)`)
  integrations?.forEach(i => console.log(`  ${i.shop_name ?? '(unnamed)'} | ${i.shop_domain} | merchant: ${i.merchant_id}`))

  for (const integration of integrations ?? []) {
    console.log(`\nProcessing: ${integration.shop_domain}`)

    if (integration.access_token_secret_id) {
      // Read the token from vault
      const { data: token, error: vaultReadErr } = await adminSupabase
        .rpc('vault_read_secret_by_id', { p_id: integration.access_token_secret_id })

      if (vaultReadErr) {
        console.warn('  Vault read error (continuing):', vaultReadErr.message)
      }

      if (token) {
        // Delete Barpel webhooks from Shopify
        try {
          const whRes = await fetch(
            `https://${integration.shop_domain}/admin/api/2026-01/webhooks.json`,
            { headers: { 'X-Shopify-Access-Token': token } }
          )
          const whData = await whRes.json()
          for (const wh of whData?.webhooks ?? []) {
            if (wh.address?.includes('barpel') || wh.address?.includes('dropship')) {
              const delRes = await fetch(
                `https://${integration.shop_domain}/admin/api/2026-01/webhooks/${wh.id}.json`,
                { method: 'DELETE', headers: { 'X-Shopify-Access-Token': token } }
              )
              if (delRes.ok || delRes.status === 404) {
                console.log(`  Deleted webhook: ${wh.topic}`)
              } else {
                console.warn(`  Failed to delete webhook ${wh.id}: ${delRes.status}`)
              }
            }
          }
        } catch (fetchErr) {
          console.warn('  Shopify webhook cleanup failed (continuing):', fetchErr)
        }

        // Delete token from Vault
        const { error: vaultDelErr } = await adminSupabase
          .rpc('vault_delete_secret_by_id', { p_id: integration.access_token_secret_id })

        if (vaultDelErr) {
          console.warn('  Vault delete error (continuing):', vaultDelErr.message)
        } else {
          console.log('  Vault token deleted')
        }
      }
    } else {
      console.log('  No vault token to clean up')
    }

    // Disconnect in DB
    const { error: updateErr } = await adminSupabase
      .from('integrations')
      .update({ connection_active: false, access_token_secret_id: null })
      .eq('id', integration.id)

    if (updateErr) {
      console.error('  DB update error:', updateErr.message)
    } else {
      console.log(`  Integration disconnected: ${integration.shop_domain}`)
    }
  }

  console.log('\nveemagicspurs-2 is now free for a fresh Shopify connection.')
}

main().catch(err => {
  console.error('Script error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
