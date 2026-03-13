-- Ticket 15: Store tool call results from Vapi artifact.messages
-- Powers the Call Logs detail view — shows which tools fired and what they returned
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS tool_results JSONB DEFAULT '[]'::jsonb;
