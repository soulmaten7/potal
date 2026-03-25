-- F105: White-label Branding
CREATE TABLE IF NOT EXISTS seller_branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL UNIQUE,
  config JSONB DEFAULT '{}',
  brand_profiles JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_branding_seller ON seller_branding(seller_id);

ALTER TABLE seller_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_branding_service_all ON seller_branding FOR ALL USING (true) WITH CHECK (true);
