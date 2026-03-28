-- Internal CRM notes, visible only to admin (service-role).
-- RLS enabled with no policies = anon/authenticated roles get zero rows.

CREATE TABLE IF NOT EXISTS admin_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id  UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  content      TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_notes_merchant ON admin_notes(merchant_id, created_at DESC);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
