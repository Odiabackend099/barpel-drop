-- 012_provisioning_gates.sql
-- Security gates for provisioning abuse prevention.
-- 1. Adds 'free_trial' to plan CHECK constraint (new default for signups)
-- 2. Adds has_used_free_provision flag (one free number per merchant)
-- 3. Adds provision_count for rate limiting (3 attempts per 24h window)
-- provisioning_attempted_at already exists — reused for rate limit window.

-- Step 1: Expand plan CHECK to include free_trial
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_plan_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_plan_check
  CHECK (plan IN ('free_trial', 'starter', 'growth', 'scale'));
ALTER TABLE merchants ALTER COLUMN plan SET DEFAULT 'free_trial';

-- Step 2: Provisioning abuse prevention columns
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS has_used_free_provision BOOLEAN DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS provision_count INTEGER DEFAULT 0;
