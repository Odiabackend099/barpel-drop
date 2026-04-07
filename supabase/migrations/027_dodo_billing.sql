-- 027_dodo_billing.sql
-- Dodo Payments is the approved billing provider (alongside Shopify).
-- Flutterwave and Paystack were removed — see migration 034 for cleanup.
-- BI-013: Legacy providers removed April 2026; only Dodo + Shopify remain.

-- Dodo Payments subscription tracking on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS dodo_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS dodo_plan            TEXT;  -- 'starter' | 'growth' | 'scale'

CREATE INDEX IF NOT EXISTS idx_merchants_dodo_sub
  ON merchants(dodo_subscription_id);

-- Idempotency table for Dodo renewal webhooks
-- Keyed on subscription_id + next_billing_date to prevent double-processing retries
CREATE TABLE IF NOT EXISTS dodo_webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id  TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dodo_webhook_events ENABLE ROW LEVEL SECURITY;
-- No user-facing policies: service role only (createAdminClient bypasses RLS)

-- Update dunning index to also cover Dodo subscribers
DROP INDEX IF EXISTS idx_merchants_renewal_due;

CREATE INDEX IF NOT EXISTS idx_merchants_renewal_due
  ON merchants(plan_renewal_due_at)
  WHERE flw_subscription_id IS NOT NULL
     OR paystack_subscription_id IS NOT NULL
     OR dodo_subscription_id IS NOT NULL;
