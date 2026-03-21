-- Paystack subscription tracking on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS paystack_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subscription_id TEXT,  -- Paystack subscription code (SUB_xxxx)
  ADD COLUMN IF NOT EXISTS paystack_plan TEXT;             -- 'starter' | 'growth' | 'scale'

CREATE INDEX IF NOT EXISTS idx_merchants_paystack_sub
  ON merchants(paystack_subscription_id);

-- Paystack transaction ID on billing_transactions (flw_transaction_id stays for FLW records)
ALTER TABLE billing_transactions
  ADD COLUMN IF NOT EXISTS paystack_transaction_id TEXT;

-- Update dunning index to also cover Paystack subscribers
-- (DROP + recreate because the WHERE clause cannot be changed in-place)
DROP INDEX IF EXISTS idx_merchants_renewal_due;

CREATE INDEX IF NOT EXISTS idx_merchants_renewal_due
  ON merchants(plan_renewal_due_at)
  WHERE flw_subscription_id IS NOT NULL OR paystack_subscription_id IS NOT NULL;
