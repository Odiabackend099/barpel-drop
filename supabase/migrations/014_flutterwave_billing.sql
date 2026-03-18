-- Flutterwave subscription tracking
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS flw_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS flw_plan TEXT;  -- 'starter' | 'growth' | 'scale'

CREATE INDEX IF NOT EXISTS idx_merchants_flw_sub
  ON merchants(flw_subscription_id);

-- Payment audit table (distinct from credit_transactions operational ledger)
-- Tracks every billing event: pending → completed | failed
CREATE TABLE IF NOT EXISTS billing_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  tx_ref              TEXT UNIQUE NOT NULL,     -- our idempotency key: barpel_{merchantId}_{ts}
  flw_transaction_id  TEXT,                    -- Flutterwave's ID, populated on verification
  plan                TEXT NOT NULL,           -- 'starter' | 'growth' | 'scale'
  amount              NUMERIC NOT NULL,        -- USD amount charged
  currency            TEXT NOT NULL DEFAULT 'USD',
  status              TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed'
  provider            TEXT NOT NULL DEFAULT 'flutterwave',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_merchant ON billing_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_tx_ref   ON billing_transactions(tx_ref);

ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- Merchants can read their own billing history
CREATE POLICY "merchant_sees_own_billing" ON billing_transactions FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Service role has full access (for webhook handlers)
CREATE POLICY "service_role_full" ON billing_transactions FOR ALL
  USING (auth.role() = 'service_role');
