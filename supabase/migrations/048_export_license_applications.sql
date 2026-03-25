-- F038: Export License Application Tracking
CREATE TABLE IF NOT EXISTS export_license_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  eccn TEXT NOT NULL,
  destination TEXT NOT NULL,
  product_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'returned', 'expired')),
  reference_number TEXT UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_license_seller ON export_license_applications(seller_id);
CREATE INDEX IF NOT EXISTS idx_export_license_lookup ON export_license_applications(seller_id, eccn, destination, status);

ALTER TABLE export_license_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY export_license_service_all ON export_license_applications FOR ALL USING (true) WITH CHECK (true);
