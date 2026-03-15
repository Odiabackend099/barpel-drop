-- 011_pending_calls_unique.sql
-- Adds a DB-level UNIQUE constraint on pending_outbound_calls to prevent
-- duplicate abandoned cart calls for the same checkout token per merchant.
-- Without this, concurrent Shopify webhook retries can insert duplicate rows
-- that the application-level idempotency check (webhook_events) doesn't fully guard.
-- NULL checkout tokens are intentionally excluded (NULL != NULL in Postgres UNIQUE).

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'pending_outbound_calls'
      AND constraint_name = 'pending_calls_checkout_unique'
  ) THEN
    ALTER TABLE pending_outbound_calls
      ADD CONSTRAINT pending_calls_checkout_unique
      UNIQUE (merchant_id, shopify_checkout_token);
  END IF;
END; $$;
