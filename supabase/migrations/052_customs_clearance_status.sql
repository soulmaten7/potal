-- F050: Customs Clearance Status Tracking
CREATE TABLE IF NOT EXISTS customs_clearance_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  destination_country TEXT,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seller_id, reference_number)
);

CREATE INDEX IF NOT EXISTS idx_customs_status_seller ON customs_clearance_status(seller_id);
CREATE INDEX IF NOT EXISTS idx_customs_status_ref ON customs_clearance_status(reference_number);

ALTER TABLE customs_clearance_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY customs_status_service_all ON customs_clearance_status FOR ALL USING (true) WITH CHECK (true);
