import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function main() {
  const { data, error } = await db
    .from('integrations')
    .delete()
    .ilike('shop_domain', '%veemagic%')
    .select()

  if (error) { console.error('Error:', error.message); process.exit(1) }
  console.log('Deleted:', data?.length ?? 0, 'record(s)')
  data?.forEach((r: any) => console.log(' -', r.shop_domain, '| merchant:', r.merchant_id))
  console.log('veemagicspurs-2 is now fully free for a fresh connection.')
}

main().catch(err => { console.error(err); process.exit(1) })
