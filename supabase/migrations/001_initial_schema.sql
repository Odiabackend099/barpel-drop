-- ============================================================================
-- BARPLE DROP AI - INITIAL DATABASE SCHEMA
-- Multi-tenant SaaS for Voice AI Dropshipping Support
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: merchants
-- Core tenant table. Every dropshipper gets one row. RLS pins ALL queries.
-- ============================================================================
CREATE TABLE merchants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name       TEXT NOT NULL,
  support_phone       TEXT,
  vapi_agent_id       TEXT,
  vapi_phone_id       TEXT,
  custom_prompt       TEXT DEFAULT 'You are a helpful customer support agent',
  plan                TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'scale')),
  credit_balance      INTEGER DEFAULT 0,
  stripe_customer_id  TEXT UNIQUE,
  is_active           BOOLEAN DEFAULT true,
  onboarded_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Merchants only see their own row
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_self_select" ON merchants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "merchant_self_update" ON merchants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- TABLE 2: integrations
-- OAuth tokens for Shopify, TikTok Shop, WooCommerce. Encrypted at rest.
-- ============================================================================
CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('shopify', 'tiktok_shop', 'woocommerce')),
  shop_domain     TEXT,
  access_token    TEXT NOT NULL,
  webhook_secret  TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, platform)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_integrations_select" ON integrations
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "merchant_integrations_insert" ON integrations
  FOR INSERT WITH CHECK (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "merchant_integrations_update" ON integrations
  FOR UPDATE USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- TABLE 3: call_logs
-- The heart of the dashboard. Every call gets a row with full context.
-- ============================================================================
CREATE TABLE call_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  vapi_call_id    TEXT UNIQUE,
  direction       TEXT CHECK (direction IN ('inbound', 'outbound')),
  caller_number   TEXT,
  customer_name   TEXT,
  order_number    TEXT,
  call_type       TEXT CHECK (call_type IN ('wismo', 'return', 'refund', 'abandoned_cart', 'other')),
  duration_secs   INTEGER DEFAULT 0,
  transcript      TEXT,
  ai_summary      TEXT,
  sentiment       TEXT CHECK (sentiment IN ('angry', 'neutral', 'happy')),
  resolution      TEXT,
  credits_charged INTEGER DEFAULT 0,
  recording_url   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_calls_select" ON call_logs
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "merchant_calls_insert" ON call_logs
  FOR INSERT WITH CHECK (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "merchant_calls_update" ON call_logs
  FOR UPDATE USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

-- Index for fast dashboard queries
CREATE INDEX idx_call_logs_merchant_date ON call_logs(merchant_id, started_at DESC);
CREATE INDEX idx_call_logs_merchant_type ON call_logs(merchant_id, call_type);

-- ============================================================================
-- TABLE 4: credit_transactions
-- Immutable ledger. Every credit purchase and deduction is a row.
-- ============================================================================
CREATE TABLE credit_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         UUID REFERENCES merchants(id) ON DELETE CASCADE,
  type                TEXT CHECK (type IN ('purchase', 'deduction', 'refund', 'bonus')),
  amount              INTEGER NOT NULL,
  balance_after       INTEGER NOT NULL,
  description         TEXT,
  stripe_payment_id   TEXT,
  call_log_id         UUID REFERENCES call_logs(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_ledger_select" ON credit_transactions
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE INDEX idx_credit_transactions_merchant ON credit_transactions(merchant_id, created_at DESC);

-- ============================================================================
-- TABLE 5: credit_packages
-- Stripe products map to these packages
-- ============================================================================
CREATE TABLE credit_packages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  credits_seconds     INTEGER NOT NULL,
  price_usd_cents     INTEGER NOT NULL,
  stripe_price_id     TEXT UNIQUE NOT NULL,
  is_active           BOOLEAN DEFAULT true
);

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_packages_public_select" ON credit_packages
  FOR SELECT USING (true);

-- Seed data (replace stripe_price_id with your actual Stripe price IDs)
INSERT INTO credit_packages (name, credits_seconds, price_usd_cents, stripe_price_id, is_active) VALUES
  ('Starter', 6000, 1999, 'price_1T9lkG0qsLJPfq4syImLqkrl', true),
  ('Growth', 30000, 7999, 'price_1T9lkH0qsLJPfq4sCtBYPV3d', true),
  ('Scale', 90000, 19999, 'price_1T9lkJ0qsLJPfq4scTRluYfF', true);

-- ============================================================================
-- TABLE 6: return_requests
-- Track return/refund requests initiated via AI calls
-- ============================================================================
CREATE TABLE return_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  call_log_id     UUID REFERENCES call_logs(id),
  order_number    TEXT NOT NULL,
  customer_phone  TEXT,
  reason          TEXT,
  photo_url       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_returns_select" ON return_requests
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "merchant_returns_insert" ON return_requests
  FOR INSERT WITH CHECK (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- TABLE 7: webhook_events (idempotency table)
-- CRITICAL: Prevents double-processing on Nigerian network retries
-- ============================================================================
CREATE TABLE webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        TEXT UNIQUE NOT NULL,
  source          TEXT CHECK (source IN ('stripe', 'vapi', 'shopify', 'twilio')),
  processed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS - service role only

CREATE INDEX idx_webhook_events_lookup ON webhook_events(event_id, source);

-- ============================================================================
-- TRIGGER: Auto-create merchant row on signup
-- Gives 300 free credits (5 minutes) as conversion hook
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO merchants (user_id, business_name, credit_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Store'),
    300  -- 5 FREE minutes on signup
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- FUNCTION 1: deduct_call_credits
-- Atomic credit deduction with FOR UPDATE lock (prevents race conditions)
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_call_credits(
  p_merchant_id UUID,
  p_seconds     INTEGER,
  p_call_log_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance     INTEGER;
BEGIN
  -- Lock the merchant row
  SELECT credit_balance INTO current_balance
  FROM merchants
  WHERE id = p_merchant_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_balance < p_seconds THEN
    RETURN FALSE; -- Insufficient credits
  END IF;

  new_balance := current_balance - p_seconds;

  -- Deduct balance
  UPDATE merchants
  SET credit_balance = new_balance
  WHERE id = p_merchant_id;

  -- Write ledger entry
  INSERT INTO credit_transactions(
    merchant_id,
    type,
    amount,
    balance_after,
    description,
    call_log_id
  ) VALUES (
    p_merchant_id,
    'deduction',
    -p_seconds,
    new_balance,
    'Call credit deduction',
    p_call_log_id
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION 2: add_credits
-- Add credits to merchant account (called from Stripe webhook)
-- ============================================================================
CREATE OR REPLACE FUNCTION add_credits(
  p_merchant_id       UUID,
  p_seconds           INTEGER,
  p_stripe_payment_id TEXT
) RETURNS VOID AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE merchants
  SET credit_balance = credit_balance + p_seconds
  WHERE id = p_merchant_id
  RETURNING credit_balance INTO new_balance;

  INSERT INTO credit_transactions(
    merchant_id,
    type,
    amount,
    balance_after,
    description,
    stripe_payment_id
  ) VALUES (
    p_merchant_id,
    'purchase',
    p_seconds,
    new_balance,
    'Purchased ' || (p_seconds / 60) || ' minutes',
    p_stripe_payment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS VERIFICATION QUERIES (run these to verify setup)
-- ============================================================================

-- Verify all tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- All must show rowsecurity = TRUE

-- Verify no table is accessible without policy:
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = FALSE;
-- Must return 0 rows

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
