-- 017_call_type_product_search.sql
-- Fix: Add 'product_search' to call_type CHECK constraint.
-- Without this, any call that triggers the search_products tool fails to insert
-- into call_logs (CHECK violation), silently dropping the call log and skipping
-- credit deduction.
--
-- Reference: app/api/vapi/webhook/route.ts sets callType = "product_search"
-- when the search_products tool fires, but migration 009 only allows:
-- order_lookup, return_request, general, abandoned_cart_recovery.

ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_call_type_check;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_type_check
  CHECK (call_type IN ('order_lookup', 'return_request', 'general', 'abandoned_cart_recovery', 'product_search'));
