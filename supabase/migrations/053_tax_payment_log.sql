-- F052: Tax Payment Log
CREATE TABLE IF NOT EXISTS tax_payment_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  country TEXT NOT NULL,
  tax_type TEXT NOT NULL,
  amount JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_payment_seller ON tax_payment_log(seller_id);
CREATE INDEX IF NOT EXISTS idx_tax_payment_country ON tax_payment_log(country);

ALTER TABLE tax_payment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_payment_service_all ON tax_payment_log FOR ALL USING (true) WITH CHECK (true);
