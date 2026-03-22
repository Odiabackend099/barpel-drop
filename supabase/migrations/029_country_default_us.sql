-- 029_country_default_us.sql
-- Fix: merchants.country column defaulted to 'GB' (set in 002_spec_alignment.sql).
-- Every new merchant row was created with country='GB', which the onboarding page
-- then loaded and displayed, overriding the UI's useState("US") default.

-- Change column default from 'GB' to 'US'
ALTER TABLE merchants ALTER COLUMN country SET DEFAULT 'US';

-- Fix existing merchants still on onboarding step 1 who have the stale 'GB' default.
-- These merchants never explicitly chose a country — they got 'GB' automatically.
-- Merchants on step 2+ explicitly confirmed their country, so leave those alone.
UPDATE merchants
SET country = 'US'
WHERE country = 'GB'
  AND onboarding_step = 1;
