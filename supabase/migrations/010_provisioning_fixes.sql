-- 010_provisioning_fixes.sql
-- Fixes two gaps found during provisioning audit:
-- Gap 1: provisioning_mode column exists but has no CHECK constraint
-- Gap 3: ai_voice_id/ai_voice_provider defaults are stale ElevenLabs values,
--         but createVapiAssistant() defaults to vapi/Clara

-- Backfill NULLs before adding CHECK constraint
UPDATE merchants SET provisioning_mode = 'barpel' WHERE provisioning_mode IS NULL;

-- Add CHECK constraint on provisioning_mode (column already exists with DEFAULT 'barpel')
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'merchants'
      AND constraint_name = 'chk_merchants_provisioning_mode'
  ) THEN
    ALTER TABLE merchants ADD CONSTRAINT chk_merchants_provisioning_mode
      CHECK (provisioning_mode IN ('barpel', 'byoc'));
  END IF;
END; $$;

-- Fix voice defaults to match createVapiAssistant() in phoneService.ts
ALTER TABLE merchants ALTER COLUMN ai_voice_id SET DEFAULT 'Clara';
ALTER TABLE merchants ALTER COLUMN ai_voice_provider SET DEFAULT 'vapi';

-- Backfill merchants with stale ElevenLabs voice ID (regardless of provider)
UPDATE merchants
SET ai_voice_id = 'Clara', ai_voice_provider = 'vapi'
WHERE ai_voice_id = 'EXAVITQu4vr4xnSDxMaL';
