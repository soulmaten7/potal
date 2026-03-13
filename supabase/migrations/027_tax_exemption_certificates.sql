-- F053: Tax Exemption Certificate Management

CREATE TABLE IF NOT EXISTS tax_exemption_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  certificate_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  exemption_number TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  holder_tax_id TEXT,
  expiration_date DATE,
  product_categories JSONB,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_exempt_certs_seller ON tax_exemption_certificates(seller_id);
CREATE INDEX IF NOT EXISTS idx_tax_exempt_certs_jurisdiction ON tax_exemption_certificates(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_tax_exempt_certs_status ON tax_exemption_certificates(status);

ALTER TABLE tax_exemption_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_exempt_certs_service_all ON tax_exemption_certificates FOR ALL USING (true) WITH CHECK (true);
