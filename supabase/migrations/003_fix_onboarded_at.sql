-- ============================================================================
-- Migration 003: Fix onboarded_at default
--
-- Problem: onboarded_at column has DEFAULT NOW() which causes new users to be
-- immediately marked as onboarded when the handle_new_user trigger fires.
-- This prevents the middleware from routing new users to /onboarding.
--
-- Fix:
--   1. Remove DEFAULT from onboarded_at so new inserts leave it NULL
--   2. Reset existing rows where onboarding was never completed
--   3. Update handle_new_user to explicitly insert NULL for onboarded_at
-- ============================================================================

-- 1. Drop the DEFAULT so new merchant rows start with onboarded_at = NULL
ALTER TABLE merchants ALTER COLUMN onboarded_at DROP DEFAULT;

-- 2. Reset any user who never truly completed onboarding.
--    onboarding_step < 4 means they never reached the final step.
--    onboarding_step IS NULL means column didn't exist yet (pre-002).
UPDATE merchants
SET onboarded_at = NULL
WHERE onboarding_step IS NULL OR onboarding_step < 4;

-- 3. Update trigger to explicitly set onboarded_at = NULL and onboarding_step = 1
--    so the column DEFAULT can never silently fire for new signups.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- WARNING: raw_user_meta_data is an internal Supabase Auth field.
  -- Verify this field name still exists after any Supabase major version upgrade.
  --
  -- onboarded_at = NULL: new users must complete /onboarding before accessing /dashboard.
  -- Middleware gates /dashboard/* on onboarded_at IS NOT NULL.
  INSERT INTO merchants (user_id, business_name, credit_balance, onboarded_at, onboarding_step)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'My Store'
    ),
    300,   -- 5 free minutes on signup
    NULL,  -- explicitly NULL — middleware routes to /onboarding until this is set
    1      -- start at step 1
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate trigger to point at updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- END OF MIGRATION 003
-- Verification:
--   SELECT column_default FROM information_schema.columns
--   WHERE table_name = 'merchants' AND column_name = 'onboarded_at';
--   → Should return NULL (no default)
-- ============================================================================
