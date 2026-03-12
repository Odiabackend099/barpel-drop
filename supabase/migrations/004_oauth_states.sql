-- Migration 004: Database-backed OAuth state (replaces cookie-based CSRF nonce)
-- Fixes CSRF mismatch on Vercel serverless where cookies are lost between redirect hops.

CREATE TABLE IF NOT EXISTS oauth_states (
  state       TEXT        PRIMARY KEY,
  merchant_id UUID        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  shop_domain TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_created_at ON oauth_states(created_at);

-- Cleanup: run periodically to purge abandoned OAuth flows
-- DELETE FROM oauth_states WHERE created_at < NOW() - INTERVAL '1 hour';
