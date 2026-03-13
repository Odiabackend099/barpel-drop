-- ============================================================================
-- BARPEL DROP AI — GOLDEN CALL_LOGS TABLE
-- Migration: 009_golden_call_logs.sql
-- Purpose:   Redesign call_logs as the single source of truth for all call
--            data from Vapi end-of-call-report webhooks.
-- Safety:    Pre-launch MVP with 0 real calls. DROP + RECREATE is safe.
--            Also drops/recreates credit_transactions and return_requests
--            (FK dependencies on call_logs).
-- ============================================================================


-- ============================================================================
-- STEP 1: Drop dependent tables (FK cascade order)
-- ============================================================================
DROP TABLE IF EXISTS return_requests CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;


-- ============================================================================
-- STEP 2: Create golden call_logs table
-- Every column maps to an exact field from the Vapi end-of-call-report payload.
-- One row per call. Every UI page reads from this table only.
-- ============================================================================
CREATE TABLE call_logs (
  -- PRIMARY IDENTITY
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- FROM VAPI: call object (message.call)
  vapi_call_id          TEXT UNIQUE,              -- message.call.id
  vapi_assistant_id     TEXT,                     -- message.call.assistantId
  caller_number         TEXT,                     -- message.call.customer.number
  called_number         TEXT,                     -- message.call.phoneNumber.number (Barpel number)
  direction             TEXT DEFAULT 'inbound'
                          CHECK (direction IN ('inbound', 'outbound')),

  -- FROM VAPI: timing
  started_at            TIMESTAMPTZ,              -- message.call.startedAt
  ended_at              TIMESTAMPTZ,              -- message.call.endedAt
  duration_seconds      INTEGER DEFAULT 0,        -- calculated: ended_at - started_at

  -- FROM VAPI: how call ended
  ended_reason          TEXT,                     -- message.endedReason

  -- FROM VAPI: artifact object (message.artifact)
  transcript            TEXT,                     -- message.artifact.transcript
  messages_raw          JSONB DEFAULT '[]'::jsonb,-- message.artifact.messages (full array)
  recording_url         TEXT,                     -- message.artifact.recordingUrl

  -- FROM VAPI: analysis object (message.analysis)
  ai_summary            TEXT,                     -- message.analysis.summary
  ai_success_evaluation TEXT,                     -- message.analysis.successEvaluation

  -- DERIVED BY BARPEL: extracted from messages_raw at save time
  tool_results          JSONB DEFAULT '[]'::jsonb,-- extracted tool_call_result messages

  -- DERIVED BY BARPEL: call classification
  call_type             TEXT DEFAULT 'general'
                          CHECK (call_type IN ('order_lookup', 'return_request', 'general', 'abandoned_cart_recovery')),

  -- DERIVED BY BARPEL: sentiment analysis (rule-based from transcript)
  sentiment             TEXT DEFAULT 'neutral'
                          CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- BILLING: credits deducted from merchant balance for this call
  credits_charged       INTEGER DEFAULT 0,

  -- METADATA
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- STEP 3: Indexes for dashboard queries
-- ============================================================================
CREATE INDEX idx_call_logs_merchant_id     ON call_logs(merchant_id);
CREATE INDEX idx_call_logs_created_at      ON call_logs(merchant_id, created_at DESC);
CREATE INDEX idx_call_logs_call_type       ON call_logs(merchant_id, call_type);
CREATE INDEX idx_call_logs_sentiment       ON call_logs(merchant_id, sentiment);
CREATE INDEX idx_call_logs_vapi_call_id    ON call_logs(vapi_call_id);


-- ============================================================================
-- STEP 4: RLS on call_logs
-- ============================================================================
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Merchants only see their own calls
CREATE POLICY "merchant_sees_own_calls"
  ON call_logs FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Service role can do everything (webhook inserts/updates)
CREATE POLICY "service_role_full_access"
  ON call_logs FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- STEP 5: Recreate credit_transactions table (FK to new call_logs)
-- ============================================================================
CREATE TABLE credit_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         UUID REFERENCES merchants(id) ON DELETE CASCADE,
  type                TEXT CHECK (type IN ('purchase', 'deduction', 'refund', 'bonus')),
  amount              INTEGER NOT NULL CHECK (amount != 0),
  balance_after       INTEGER NOT NULL,
  description         TEXT,
  stripe_payment_id   TEXT,
  call_log_id         UUID REFERENCES call_logs(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_ledger_select" ON credit_transactions
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid() AND deleted_at IS NULL
  ));

CREATE POLICY "service_role_ledger_full" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_credit_transactions_merchant ON credit_transactions(merchant_id, created_at DESC);


-- ============================================================================
-- STEP 6: Recreate return_requests table (FK to new call_logs)
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
    SELECT id FROM merchants WHERE user_id = auth.uid() AND deleted_at IS NULL
  ));

CREATE POLICY "merchant_returns_insert" ON return_requests
  FOR INSERT WITH CHECK (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid() AND deleted_at IS NULL
  ));

CREATE POLICY "service_role_returns_full" ON return_requests
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- STEP 7: updated_at trigger for call_logs
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_logs_updated_at
  BEFORE UPDATE ON call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- STEP 8: Recreate deduct_call_credits (exact D-9 from migration 002)
-- RETURNS INTEGER, uses LEAST() for partial deductions, FOR UPDATE lock
-- ============================================================================
DROP FUNCTION IF EXISTS deduct_call_credits(UUID, INTEGER, UUID);

CREATE OR REPLACE FUNCTION deduct_call_credits(
  p_merchant_id UUID,
  p_seconds     INTEGER,
  p_call_log_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_deducted        INTEGER;
BEGIN
  SELECT credit_balance INTO v_current_balance
  FROM merchants
  WHERE id = p_merchant_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN 0;
  END IF;

  v_deducted := LEAST(p_seconds, v_current_balance);

  IF v_deducted <= 0 THEN
    RETURN 0;
  END IF;

  UPDATE merchants
  SET credit_balance = credit_balance - v_deducted
  WHERE id = p_merchant_id;

  INSERT INTO credit_transactions (
    merchant_id, type, amount, balance_after, description, call_log_id
  ) VALUES (
    p_merchant_id, 'deduction', -v_deducted,
    v_current_balance - v_deducted, 'Call credit deduction', p_call_log_id
  );

  RETURN v_deducted;
END;
$$;


-- ============================================================================
-- STEP 9: Recreate add_credits (exact D-10 from migration 002)
-- RETURNS INTEGER (new balance), raises exception if merchant not found
-- ============================================================================
DROP FUNCTION IF EXISTS add_credits(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION add_credits(
  p_merchant_id              UUID,
  p_seconds                  INTEGER,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE merchants
  SET credit_balance = credit_balance + p_seconds
  WHERE id = p_merchant_id
  RETURNING credit_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Merchant % not found', p_merchant_id;
  END IF;

  INSERT INTO credit_transactions (
    merchant_id, type, amount, balance_after, description, stripe_payment_id
  ) VALUES (
    p_merchant_id, 'purchase', p_seconds, v_new_balance,
    'Purchased ' || (p_seconds / 60) || ' minutes',
    p_stripe_payment_intent_id
  );

  RETURN v_new_balance;
END;
$$;


-- ============================================================================
-- STEP 10: Update get_dashboard_stats for golden schema
-- Changes: duration_secs → duration_seconds, remove order_number from
-- recent_calls, COALESCE fallback 'other' → 'general', add ended_reason
-- ============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_merchant_id UUID,
  p_date_from   TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_date_to     TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(

    'total_calls', (
      SELECT COUNT(*)
      FROM call_logs
      WHERE merchant_id = p_merchant_id
        AND started_at BETWEEN p_date_from AND p_date_to
    ),

    'calls_by_type', (
      SELECT json_object_agg(call_type, cnt)
      FROM (
        SELECT COALESCE(call_type, 'general') AS call_type, COUNT(*) AS cnt
        FROM call_logs
        WHERE merchant_id = p_merchant_id
          AND started_at BETWEEN p_date_from AND p_date_to
        GROUP BY call_type
      ) t
    ),

    'calls_by_sentiment', (
      SELECT json_object_agg(sentiment, cnt)
      FROM (
        SELECT COALESCE(sentiment, 'neutral') AS sentiment, COUNT(*) AS cnt
        FROM call_logs
        WHERE merchant_id = p_merchant_id
          AND started_at BETWEEN p_date_from AND p_date_to
        GROUP BY sentiment
      ) t
    ),

    'avg_duration_seconds', (
      SELECT COALESCE(ROUND(AVG(duration_seconds))::INTEGER, 0)
      FROM call_logs
      WHERE merchant_id = p_merchant_id
        AND started_at BETWEEN p_date_from AND p_date_to
    ),

    'credits_used', (
      SELECT COALESCE(SUM(ABS(amount)), 0)
      FROM credit_transactions
      WHERE merchant_id = p_merchant_id
        AND type = 'deduction'
        AND created_at BETWEEN p_date_from AND p_date_to
    ),

    'recent_calls', (
      SELECT json_agg(r)
      FROM (
        SELECT
          id,
          direction,
          caller_number,
          call_type,
          sentiment,
          duration_seconds,
          ai_summary,
          credits_charged,
          ended_reason,
          started_at
        FROM call_logs
        WHERE merchant_id = p_merchant_id
        ORDER BY started_at DESC
        LIMIT 5
      ) r
    ),

    'daily_volume', (
      SELECT json_agg(d ORDER BY d.date)
      FROM (
        SELECT
          TO_CHAR(gs.date, 'YYYY-MM-DD') AS date,
          COALESCE(COUNT(cl.id), 0)      AS count
        FROM generate_series(
          (NOW() - INTERVAL '13 days')::DATE,
          NOW()::DATE,
          '1 day'::INTERVAL
        ) AS gs(date)
        LEFT JOIN call_logs cl
          ON DATE(cl.started_at) = gs.date
         AND cl.merchant_id = p_merchant_id
        GROUP BY gs.date
      ) d
    )

  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================================
-- STEP 11: Fix credit_packages pricing
-- Starter: 50 credits (3000s) / $29
-- Growth:  200 credits (12000s) / $79
-- Scale:   600 credits (36000s) / $179
-- ============================================================================
UPDATE credit_packages SET credits_seconds = 3000,  price_usd_cents = 2900  WHERE name = 'Starter';
UPDATE credit_packages SET credits_seconds = 12000, price_usd_cents = 7900  WHERE name = 'Growth';
UPDATE credit_packages SET credits_seconds = 36000, price_usd_cents = 17900 WHERE name = 'Scale';


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
