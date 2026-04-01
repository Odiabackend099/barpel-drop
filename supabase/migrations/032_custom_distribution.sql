-- Migration 032: Custom Distribution support
-- Ensures oauth_states table supports custom app flows where shop_domain
-- may not be known upfront, and tracks which app type initiated the flow.

-- Make shop_domain nullable (managed install and custom apps don't always have it)
ALTER TABLE oauth_states ALTER COLUMN shop_domain DROP NOT NULL;

-- Add app_type column for custom distribution tracking
ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS app_type TEXT;
