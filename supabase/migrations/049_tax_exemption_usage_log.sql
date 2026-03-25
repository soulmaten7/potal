-- F053: Tax Exemption Usage Audit Log
CREATE TABLE IF NOT EXISTS tax_exemption_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL,
  seller_id TEXT NOT NULL,
  buyer_id TEXT,
  transaction_id TEXT NOT NULL,
  exempted_amount NUMERIC DEFAULT 0,
  jurisdiction TEXT,
  certificate_type TEXT,
  applied_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exemption_usage_seller ON tax_exemption_usage_log(seller_id);
CREATE INDEX IF NOT EXISTS idx_exemption_usage_cert ON tax_exemption_usage_log(certificate_id);
CREATE INDEX IF NOT EXISTS idx_exemption_usage_transaction ON tax_exemption_usage_log(transaction_id);

ALTER TABLE tax_exemption_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY exemption_usage_service_all ON tax_exemption_usage_log FOR ALL USING (true) WITH CHECK (true);
