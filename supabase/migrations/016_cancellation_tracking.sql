-- Track Flutterwave subscription cancellation attempts and confirmations.
-- cancellation_attempted_at: set on every Day-30 cron attempt (throttle repeated calls)
-- cancellation_confirmation_at: set only when FLW API returns 2xx (confirmed by FLW)
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS cancellation_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_confirmation_at TIMESTAMPTZ;
