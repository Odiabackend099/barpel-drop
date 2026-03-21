-- 023_call_forwarding.sql
-- Adds call forwarding tracking columns to merchants table.
-- Applied via Supabase Management API on 2026-03-20.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS forwarding_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS forwarding_type TEXT,
  ADD COLUMN IF NOT EXISTS forwarding_carrier TEXT,
  ADD COLUMN IF NOT EXISTS store_phone TEXT;
