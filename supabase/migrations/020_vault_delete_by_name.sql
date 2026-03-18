-- 020_vault_delete_by_name.sql
-- Adds a name-based vault secret deletion wrapper.
-- Required because BYOC Twilio credentials are stored by name (not UUID),
-- but vault_delete_secret_by_id only accepts UUIDs.
-- Must also be run manually on Supabase dashboard.

CREATE OR REPLACE FUNCTION public.vault_delete_secret_by_name(p_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_name IS NULL THEN
    RETURN;
  END IF;
  DELETE FROM vault.secrets WHERE name = p_name;
END;
$$;
