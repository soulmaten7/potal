-- F046: Webhook System — seller webhook registrations
-- Stores webhook URLs, events, and signing secrets for outbound delivery

CREATE TABLE IF NOT EXISTS seller_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['*'],
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_webhooks_seller_id ON seller_webhooks(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_webhooks_active ON seller_webhooks(active) WHERE active = true;
