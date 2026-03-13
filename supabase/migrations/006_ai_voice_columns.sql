-- Migration 006: AI Voice columns + provisioning_status CHECK fix
-- Ticket 8: Fix CHECK constraint to include 'needs_address' (phoneService.ts writes this value)
-- Ticket 9: Add columns for AI voice configuration per merchant

-- Fix: provisioning_status CHECK was missing 'needs_address'
-- phoneService.ts:360 writes 'needs_address' for UK merchants without TWILIO_UK_ADDRESS_SID
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS chk_merchants_provisioning_status;
ALTER TABLE merchants ADD CONSTRAINT chk_merchants_provisioning_status
  CHECK (provisioning_status IN ('pending', 'provisioning', 'active', 'failed', 'needs_address', 'suspended'));

-- AI Voice configuration columns
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS ai_first_message TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS ai_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS ai_voice_provider TEXT DEFAULT '11labs';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gpt-4o';
