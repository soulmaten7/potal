-- F083: ERP Connections

CREATE TABLE IF NOT EXISTS erp_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  erp_system TEXT NOT NULL,
  status TEXT DEFAULT 'connected',
  sync_settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seller_id, erp_system)
);

CREATE INDEX IF NOT EXISTS idx_erp_conn_seller ON erp_connections(seller_id);

ALTER TABLE erp_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY erp_conn_service_all ON erp_connections FOR ALL USING (true) WITH CHECK (true);
