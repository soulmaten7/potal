-- F092: Sandbox Environment
-- Adds mode column to api_keys and usage_logs for live/sandbox separation.

-- API keys: mode column
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'live' CHECK (mode IN ('live', 'sandbox'));

-- Usage logs: mode column
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'live' CHECK (mode IN ('live', 'sandbox'));

-- Index for filtering billable usage
CREATE INDEX IF NOT EXISTS idx_usage_logs_mode ON usage_logs(mode);

-- Billable usage view (excludes sandbox)
CREATE OR REPLACE VIEW billable_usage AS
SELECT * FROM usage_logs WHERE mode = 'live';
