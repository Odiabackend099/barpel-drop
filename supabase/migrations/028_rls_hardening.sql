-- 028_rls_hardening.sql
-- RLS defense-in-depth for admin-only tables + schema fix

-- Fix: oauth_states.shop_domain was declared NOT NULL but the OAuth start
-- route inserts NULL for the managed install flow (shop domain not yet known).
-- The callback handler explicitly guards: if (oauthState.shop_domain && ...)
ALTER TABLE oauth_states ALTER COLUMN shop_domain DROP NOT NULL;

-- Enable RLS on admin-only tables so anon/authenticated roles cannot access
-- them directly via PostgREST. The service role (admin client) bypasses RLS
-- automatically, so no policies are needed — backend operation is unaffected.
--
-- INTENTIONAL: No RLS policies are created for webhook_events, oauth_states,
-- or leads. These tables are accessed exclusively via the service role (admin
-- client) in server-side API routes. The service role bypasses RLS entirely,
-- so adding policies would be redundant. Enabling RLS with zero policies
-- effectively blocks all anon/authenticated PostgREST access, which is the
-- desired behaviour for these admin-only tables.

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- leads is a marketing contact form table (not merchant data), should be
-- admin-only — no public read/write access via the anon key.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
