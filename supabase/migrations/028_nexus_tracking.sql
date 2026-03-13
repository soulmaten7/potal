-- F054: Nexus Tracking table

CREATE TABLE IF NOT EXISTS seller_nexus_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  has_nexus BOOLEAN DEFAULT false,
  reason TEXT,
  annual_revenue NUMERIC,
  transaction_count INTEGER,
  has_physical_presence BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seller_id, jurisdiction)
);

CREATE INDEX IF NOT EXISTS idx_nexus_tracking_seller ON seller_nexus_tracking(seller_id);

ALTER TABLE seller_nexus_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY nexus_tracking_service_all ON seller_nexus_tracking FOR ALL USING (true) WITH CHECK (true);
