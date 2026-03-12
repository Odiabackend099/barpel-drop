-- D-14: Add shop_name to integrations for display in UI and dashboard
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS shop_name TEXT;
