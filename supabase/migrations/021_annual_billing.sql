-- Migration: Add annual billing support
-- Adds billing_cycle column to track monthly vs annual subscriptions.

-- Track billing cycle on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly'
  CONSTRAINT merchants_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'annual'));

-- Track billing cycle on billing_transactions (for webhook to detect annual vs monthly)
ALTER TABLE billing_transactions
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly'
  CONSTRAINT billing_transactions_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'annual'));
