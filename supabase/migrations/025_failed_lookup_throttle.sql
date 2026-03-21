-- Migration 025: Add throttle column for failed order lookup SMS alerts
-- Mirrors the existing low_balance_notified_at pattern
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS failed_lookup_notified_at TIMESTAMPTZ;
