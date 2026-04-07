-- Migration 034: Drop orphaned Flutterwave + Paystack billing columns
-- Tickets: DB-001, DB-002, DB-005, DB-008, BI-011
-- Removed: 2026-03-xx — Flutterwave and Paystack decommissioned; Dodo + Shopify only.
-- BI-013: All Flutterwave and Paystack code was removed from the application in
-- migrations 034 and API routes cleaned up in the same sprint (March–April 2026).
--
-- Safe to run: all existing billing_transactions rows use provider='dodo'.
-- Indexes referencing dropped columns are removed first.

-- 1. Drop indexes on legacy columns (must drop before dropping columns)
DROP INDEX IF EXISTS idx_merchants_flw_sub;
DROP INDEX IF EXISTS idx_merchants_paystack_sub;

-- 2. Recreate dunning index — remove FLW/Paystack predicates, add Shopify
DROP INDEX IF EXISTS idx_merchants_renewal_due;
CREATE INDEX idx_merchants_renewal_due
  ON merchants(plan_renewal_due_at)
  WHERE dodo_subscription_id IS NOT NULL
     OR shopify_subscription_id IS NOT NULL;

-- 3. Drop Flutterwave columns from merchants (DB-001)
ALTER TABLE merchants
  DROP COLUMN IF EXISTS flw_subscription_id,
  DROP COLUMN IF EXISTS flw_plan;

-- 4. Drop Paystack columns from merchants (DB-002)
ALTER TABLE merchants
  DROP COLUMN IF EXISTS paystack_customer_id,
  DROP COLUMN IF EXISTS paystack_subscription_id,
  DROP COLUMN IF EXISTS paystack_plan;

-- 5. Drop legacy provider-specific ID columns from billing_transactions (DB-001, DB-002)
ALTER TABLE billing_transactions
  DROP COLUMN IF EXISTS flw_transaction_id,
  DROP COLUMN IF EXISTS paystack_transaction_id;

-- 6. Fix provider default + add CHECK constraint (DB-005, BI-011)
ALTER TABLE billing_transactions
  ALTER COLUMN provider SET DEFAULT 'dodo',
  ADD CONSTRAINT billing_transactions_provider_check
    CHECK (provider IN ('dodo', 'shopify'));
