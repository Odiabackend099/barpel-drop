-- 005_vault_read_delete.sql
-- Adds read and delete wrappers for Supabase Vault.
-- Required because the vault schema is not exposed through PostgREST.
-- Matches the write wrappers created in 002_spec_alignment.sql.
-- Must also be run manually on Supabase dashboard.

-- Read a decrypted secret from Vault by UUID.
CREATE OR REPLACE FUNCTION public.vault_read_secret_by_id(p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  IF p_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT decrypted_secret INTO result
  FROM vault.decrypted_secrets
  WHERE id = p_id
  LIMIT 1;
  RETURN result;
END;
$$;

-- Delete a secret from Vault by UUID.
-- Used by disconnect route to clean up tokens when merchant disconnects.
CREATE OR REPLACE FUNCTION public.vault_delete_secret_by_id(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_id IS NULL THEN
    RETURN;
  END IF;
  DELETE FROM vault.secrets WHERE id = p_id;
END;
$$;
