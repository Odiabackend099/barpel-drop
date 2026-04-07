# Planning: Supabase pg_cron for dial-pending

## Problem
Vercel Hobby plan blocks cron schedules that run more than once per day.
The dial-pending cron must run every 15 minutes to honour the 15-minute
cart-abandonment delay. Currently set to 9AM daily → up to 19h delay.

## Solution
Use Supabase pg_cron + pg_net to call `/api/cron/dial-pending` every
15 minutes from inside the database. Free, reliable, no Vercel plan needed.

## Implementation Phases

### Phase 1 — SQL Migration
- File: `supabase/migrations/034_pg_cron_dial_pending.sql`
- Enable pg_net extension (pg_cron is already on by default in Supabase)
- Schedule job: `*/15 * * * *` → POST to `/api/cron/dial-pending`
- Pass `Authorization: Bearer {CRON_SECRET}` header
- CRON_SECRET stored in Supabase Vault as `cron_secret`
- timeout_milliseconds: 5000

### Phase 2 — Disable Vercel cron entry
- Set `dial-pending` in vercel.json back to `0 9 * * *` as a daily fallback only
- Add comment explaining Supabase pg_cron is primary

## Technical Requirements
- pg_net extension: `net.http_get()` (GET request, not POST — route uses GET)
- Auth header: `Authorization: Bearer {CRON_SECRET}`
- URL: `https://dropship.barpel.ai/api/cron/dial-pending`
- Schedule: `*/15 * * * *`
- CRON_SECRET must be stored in Supabase Vault before migration runs

## Testing Criteria
- Run `SELECT cron.job` to confirm job is registered
- Run `SELECT net.http_get(...)` manually once to confirm 200 response
- Check `net._http_response` for status_code = 200
- Check `cron.job_run_details` after 15 minutes for successful runs

## Gotchas
- pg_net is async (fire-and-forget) — expected and acceptable
- Route uses GET not POST — must use `net.http_get()` not `net.http_post()`
- CRON_SECRET must be in Vault before job is created
- Do NOT hardcode CRON_SECRET in the SQL file — read from Vault at runtime
