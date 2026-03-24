-- F093: Webhook Security enhancements

-- 1. Webhook events table (atomic idempotency via UNIQUE constraint)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source TEXT NOT NULL,
  event_id TEXT NOT NULL,
  topic TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);

-- 2. Secret rotation support for seller_webhooks
ALTER TABLE seller_webhooks ADD COLUMN IF NOT EXISTS previous_secret TEXT;
ALTER TABLE seller_webhooks ADD COLUMN IF NOT EXISTS secret_rotated_at TIMESTAMPTZ;
