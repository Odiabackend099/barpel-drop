-- Dunning system columns on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_renewal_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dunning_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dunning_email_count INTEGER DEFAULT 0;

-- Partial index for dunning cron query efficiency
CREATE INDEX IF NOT EXISTS idx_merchants_renewal_due
  ON merchants(plan_renewal_due_at)
  WHERE flw_subscription_id IS NOT NULL;
