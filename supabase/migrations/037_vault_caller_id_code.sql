-- 037_vault_caller_id_code.sql
-- BE-005: caller_id_validation_code was stored plaintext in merchants table.
-- Validation codes are now stored in Supabase Vault (see /api/caller-id/start).
-- This migration drops the plaintext column. Any in-flight verifications at
-- deploy time will simply require the user to restart the verification flow.
--
-- DB-009 verification: Migration 010 backfilled ai_voice_id = 'EXAVITQu4vr4xnSDxMaL'
-- (stale ElevenLabs ID) to 'Clara' (Vapi native). No merchants should have the
-- old ElevenLabs voice ID at this point. The SELECT below is informational:
--   SELECT COUNT(*) FROM merchants WHERE ai_voice_id = 'EXAVITQu4vr4xnSDxMaL';
-- Expected result: 0

ALTER TABLE merchants DROP COLUMN IF EXISTS caller_id_validation_code;
