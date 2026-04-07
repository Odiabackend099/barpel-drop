-- 036_scope_vapi_call_id_unique.sql
-- DB-006: vapi_call_id UNIQUE was global (no merchant scoping).
-- Vapi UUIDs are globally unique in practice, but the constraint should be
-- scoped to merchant_id to be architecturally correct and to allow the same
-- call ID to theoretically be reused across completely separate Vapi accounts.
--
-- Change: drop the single-column UNIQUE constraint, add a composite unique
-- index on (merchant_id, vapi_call_id). The existing idx_call_logs_vapi_call_id
-- index is dropped and replaced.

-- Drop the global unique constraint (created implicitly by UNIQUE on column).
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_vapi_call_id_key;

-- Drop the old single-column index (was created explicitly in migration 009).
DROP INDEX IF EXISTS idx_call_logs_vapi_call_id;

-- Add composite unique index scoped to merchant.
-- NULLS are not considered equal in unique indexes — NULL vapi_call_id rows
-- (calls without a Vapi ID) will not conflict with each other.
CREATE UNIQUE INDEX idx_call_logs_merchant_vapi_call_id
  ON call_logs(merchant_id, vapi_call_id)
  WHERE vapi_call_id IS NOT NULL;
