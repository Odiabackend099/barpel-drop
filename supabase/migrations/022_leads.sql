-- 022_leads.sql
-- Lead capture table for enterprise / contact form submissions

CREATE TABLE IF NOT EXISTS leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  name         text NOT NULL,
  email        text NOT NULL,
  company      text,
  phone        text,
  interest     text,         -- dropdown value: "Enterprise plan", "Custom integration", etc.
  message      text,
  source_url   text,         -- page the form was submitted from
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  status       text NOT NULL DEFAULT 'new'
               CONSTRAINT leads_status_check
               CHECK (status IN ('new', 'contacted', 'qualified', 'closed_won', 'closed_lost')),
  notes        text          -- internal team follow-up notes
);

-- Index for fast lookups by email and status
CREATE INDEX IF NOT EXISTS leads_email_idx  ON leads (email);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
