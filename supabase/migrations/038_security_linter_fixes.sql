-- 038_security_linter_fixes.sql
-- Fixes all issues flagged by the Supabase database security linter.
--
-- ERRORS fixed:
--   DB-011 — RLS not enabled on webhook_events, leads, oauth_states.
--            Migration 028 was never applied to the live database.
--            This migration re-enables RLS on these three tables (idempotent).
--
-- WARNINGS fixed:
--   DB-012 — 12 public schema functions missing SET search_path.
--            A mutable search_path is a SQL injection vector for SECURITY DEFINER
--            functions: a malicious schema in the search path could shadow public
--            tables. Fix: set search_path = public, pg_temp on every function.
--            pg_temp is included so temporary tables still work inside functions.
--            The DO block reads exact signatures from pg_proc — no hardcoded
--            signatures needed, no risk of ALTER FUNCTION targeting the wrong
--            overload. Errors per-function are caught and logged (RAISE NOTICE)
--            so one bad function doesn't abort the whole migration.
--
-- INTENTIONAL (not fixed):
--   landing_signups.allow_anon_insert WITH CHECK (true):
--     Intentional. The landing page email capture form requires anon inserts.
--     Adding a restrictive check would break the form. The table only stores
--     email + created_at — no PII beyond email.
--   admin_error_log, admin_notes, dodo_webhook_events (RLS enabled, no policies):
--     Intentional. Same pattern as webhook_events/oauth_states/leads in
--     migration 028. Service role (admin client) bypasses RLS automatically;
--     no direct PostgREST access is needed or allowed for these tables.
--
-- MANUAL ACTION REQUIRED (cannot fix via SQL):
--   DB-014 — Leaked password protection is disabled.
--   Austin must enable this in the Supabase Dashboard:
--   Auth → Settings → Password Security → Enable "Leaked password protection"
-- ============================================================================


-- ── 1. ERRORS: Enable RLS on admin-only tables ──────────────────────────────
-- Idempotent — safe to run even if migration 028 was already applied.
-- No RLS policies are added here (intentional — service role only).

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;


-- ── 2. WARNINGS: Fix mutable search_path on all public schema functions ──────
-- Iterates pg_proc to find every function in the public schema that does not
-- already have search_path set, then ALTERs each one in-place. Using pg_proc
-- avoids the need to know exact parameter type signatures — PostgreSQL resolves
-- the full regprocedure (including overloads) from the OID.
-- The EXCEPTION block ensures a single failing function does not abort the
-- migration; failures are surfaced as NOTICE messages in migration logs.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- ordinary functions only (excludes aggregates, procedures)
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
        )
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public, pg_temp',
        rec.sig
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'search_path fix skipped for % — %', rec.sig, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '038: search_path fix complete.';
END;
$$;
