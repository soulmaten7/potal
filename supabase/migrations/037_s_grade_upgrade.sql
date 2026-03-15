-- S+ Grade Upgrade: classification feedback + audit trail + batch jobs

CREATE TABLE IF NOT EXISTS classification_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  original_query text NOT NULL,
  predicted_hs6 text NOT NULL,
  corrected_hs6 text,
  corrected_by uuid,
  confidence_score numeric,
  feedback_type text NOT NULL CHECK (feedback_type IN ('correct','incorrect','ambiguous')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classification_feedback_query ON classification_feedback(original_query);
CREATE INDEX IF NOT EXISTS idx_classification_feedback_type ON classification_feedback(feedback_type, created_at DESC);

CREATE TABLE IF NOT EXISTS api_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL,
  user_id uuid,
  api_key_id text,
  endpoint text NOT NULL,
  method text NOT NULL,
  request_body jsonb,
  response_status int,
  response_time_ms int,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  prev_hash text
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON api_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_endpoint ON api_audit_log(endpoint, created_at DESC);

CREATE TABLE IF NOT EXISTS batch_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','partial_failure','failed')),
  total_items int NOT NULL,
  completed_items int DEFAULT 0,
  failed_items int DEFAULT 0,
  webhook_url text,
  results jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user ON batch_jobs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_locks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL,
  locked_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_locks_user ON rate_locks(user_id, locked_until DESC);
