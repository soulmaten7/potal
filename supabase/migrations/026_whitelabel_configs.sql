-- F112: White-label configuration table

CREATE TABLE IF NOT EXISTS whitelabel_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL UNIQUE,
  brand_name TEXT,
  logo_url TEXT,
  primary_color CHAR(7),
  secondary_color CHAR(7),
  custom_domain TEXT,
  hide_attribution BOOLEAN DEFAULT false,
  custom_css TEXT,
  support_email TEXT,
  support_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whitelabel_configs_seller ON whitelabel_configs(seller_id);

-- RLS
ALTER TABLE whitelabel_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY whitelabel_configs_service_all ON whitelabel_configs
  FOR ALL USING (true) WITH CHECK (true);
