-- Affiliate referral tracking columns on merchants.
-- Stores the Tapfiliate referral code from signup (?ref= param)
-- and the affiliate ID for attribution and reporting.
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS affiliate_referral_code TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referred_by_affiliate_id TEXT;
