-- Migration 039: pg_cron job for dial-pending (every 15 minutes)
--
-- Context: Vercel Hobby plan only supports daily cron jobs.
-- The dial-pending route must run every 15 minutes to honour the
-- 15-minute cart-abandonment delay. This migration uses Supabase
-- pg_cron + pg_net to call the route directly from the database.
--
-- Prerequisites (one-time manual steps before running this migration):
--   1. Enable pg_net in Supabase Dashboard → Database → Extensions → pg_net
--   2. Store CRON_SECRET in Supabase Vault:
--        INSERT INTO vault.secrets (name, secret)
--        VALUES ('cron_secret', '<your CRON_SECRET value>');
--
-- The CRON_SECRET is never hardcoded here — it is read from Vault at runtime.

-- Enable pg_net extension (idempotent — pg_net installs into its own `net` schema)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- #2: Unschedule existing job first so this migration is idempotent on re-run.
-- cron.unschedule raises an error if the job doesn't exist, so guard with a DO block.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dial-pending-every-15m') THEN
    PERFORM cron.unschedule('dial-pending-every-15m');
  END IF;
END;
$$;

-- Schedule dial-pending every 15 minutes.
-- #3: Vault subquery is wrapped in a CASE — if secret is NULL the call is skipped,
-- preventing noisy 401s and masking secret rotation issues.
-- net.http_get is fire-and-forget (async) — acceptable for this cron.
SELECT cron.schedule(
  'dial-pending-every-15m',
  '*/15 * * * *',
  $$
    DO $$
    DECLARE
      v_secret text;
    BEGIN
      SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets
      WHERE name = 'cron_secret'
      LIMIT 1;

      IF v_secret IS NOT NULL AND v_secret <> '' THEN
        PERFORM net.http_get(
          url := 'https://dropship.barpel.ai/api/cron/dial-pending',
          headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret)
        );
      ELSE
        RAISE WARNING '[dial-pending cron] cron_secret not found in Vault — skipping http_get';
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  $$
);
