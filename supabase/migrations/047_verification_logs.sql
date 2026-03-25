-- F040: Pre-Shipment Verification — verification history logs

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  shipment_ref TEXT,
  hs_code TEXT,
  origin TEXT,
  destination TEXT,
  risk_level TEXT NOT NULL,
  risk_score INT,
  shipment_allowed BOOLEAN NOT NULL DEFAULT true,
  checklist JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_seller ON verification_logs(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_risk ON verification_logs(risk_level);

-- RLS
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_access_verification" ON verification_logs FOR ALL USING (true);
