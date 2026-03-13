-- F082: Marketplace Connections

CREATE TABLE IF NOT EXISTS marketplace_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'US',
  status TEXT DEFAULT 'connected',
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seller_id, marketplace, region)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_conn_seller ON marketplace_connections(seller_id);

ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_conn_service_all ON marketplace_connections FOR ALL USING (true) WITH CHECK (true);
