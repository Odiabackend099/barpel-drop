-- Migration 019: Add notification_preferences JSONB column to merchants table
-- Required for Settings page notification toggles (Ticket 33 — GDPR)

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "low_balance_sms": true,
    "monthly_summary_email": true,
    "payment_receipt_email": true
  }'::jsonb;
