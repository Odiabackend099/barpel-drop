-- 013_onboarding_step_5.sql
-- Expands onboarding_step CHECK constraint from 1-4 to 1-5 to support the
-- 5-step onboarding flow (Ticket 30: AI Phone Line step + Ready step split).
-- The original constraint blocked saving onboarding_step = 5, causing the
-- skip-for-now button to silently fail and onboarded_at to stay null.

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS chk_onboarding_step;
ALTER TABLE merchants ADD CONSTRAINT chk_onboarding_step
  CHECK (onboarding_step >= 1 AND onboarding_step <= 5);
