-- 007_db_fixes.sql
-- Fixes found during onboarding wizard audit (2026-03-13)

-- 1. Add missing column — phoneService.ts writes to this for African merchants
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS internationally_provisioned BOOLEAN DEFAULT false;

-- 2. Prevent orphaned Vapi resources on retry after partial failure
CREATE UNIQUE INDEX IF NOT EXISTS merchants_vapi_agent_id_unique
  ON merchants (vapi_agent_id) WHERE vapi_agent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS merchants_vapi_phone_id_unique
  ON merchants (vapi_phone_id) WHERE vapi_phone_id IS NOT NULL;

-- 3. Enable Supabase Realtime on merchants table
-- Required for live provisioning status updates in onboarding + dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE merchants;
