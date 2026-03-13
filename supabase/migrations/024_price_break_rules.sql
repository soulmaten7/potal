-- F015: Price Break Rules
-- "Valued over/under $X" conditions in tariff schedules

CREATE TABLE IF NOT EXISTS hs_price_break_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  parent_hs_code TEXT NOT NULL,
  hs10_under TEXT NOT NULL,
  hs10_over TEXT NOT NULL,
  threshold_value NUMERIC(12,2) NOT NULL,
  threshold_unit TEXT NOT NULL DEFAULT 'unit', -- 'unit', 'kg', 'sqm', 'dozen', 'liter'
  threshold_currency TEXT NOT NULL DEFAULT 'USD',
  duty_rate_under NUMERIC(8,6) NOT NULL DEFAULT 0,
  duty_rate_over NUMERIC(8,6) NOT NULL DEFAULT 0,
  description_under TEXT NOT NULL,
  description_over TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (country, parent_hs_code, threshold_value, threshold_unit)
);

CREATE INDEX IF NOT EXISTS idx_price_break_country_hs ON hs_price_break_rules (country, parent_hs_code);

COMMENT ON TABLE hs_price_break_rules IS 'F015: Price break rules for HS 10-digit determination based on declared value';
