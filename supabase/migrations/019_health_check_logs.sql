-- D11 Infrastructure: Health Check Logs
-- Stores automated health check results for Morning Brief consumption

CREATE TABLE IF NOT EXISTS health_check_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now(),
  overall_status text NOT NULL CHECK (overall_status IN ('green', 'yellow', 'red')),
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_ms integer NOT NULL DEFAULT 0
);

-- Index for quick latest-status lookup
CREATE INDEX IF NOT EXISTS idx_health_check_logs_checked_at
  ON health_check_logs (checked_at DESC);

-- Auto-cleanup: keep only 30 days of logs
-- (Can be run manually or via a future cron)
-- DELETE FROM health_check_logs WHERE checked_at < now() - interval '30 days';
