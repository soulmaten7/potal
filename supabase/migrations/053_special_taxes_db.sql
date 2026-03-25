-- F117-F129: Regional Special Tax Rules — DB table + seed data (12 countries, 27 rules)

CREATE TABLE IF NOT EXISTS special_tax_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  state_province TEXT,
  tax_name TEXT NOT NULL,
  tax_type TEXT NOT NULL, -- excise, environmental, luxury, digital, telecom, sin
  rate DECIMAL(8,4),
  rate_type TEXT DEFAULT 'percentage', -- percentage, fixed, per_unit
  per_unit_amount DECIMAL(12,4),
  per_unit_measure TEXT, -- kg, liter, unit, proof_gallon
  hs_codes TEXT[],
  threshold_amount DECIMAL(12,2),
  threshold_currency TEXT DEFAULT 'USD',
  effective_from DATE,
  effective_to DATE,
  description TEXT,
  authority TEXT,
  authority_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_special_tax_country ON special_tax_rules(country_code);
CREATE INDEX IF NOT EXISTS idx_special_tax_type ON special_tax_rules(tax_type);
CREATE INDEX IF NOT EXISTS idx_special_tax_hs ON special_tax_rules USING GIN(hs_codes);

-- RLS
ALTER TABLE special_tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_special_tax" ON special_tax_rules FOR SELECT USING (true);

-- Seed data: 12 countries, 27 rules
INSERT INTO special_tax_rules (country_code, tax_name, tax_type, rate, rate_type, per_unit_amount, per_unit_measure, hs_codes, description, authority) VALUES
-- US
('US', 'Federal Excise Tax - Spirits', 'excise', NULL, 'per_unit', 13.50, 'proof_gallon', ARRAY['2208'], '$13.50/proof gallon distilled spirits', 'TTB'),
('US', 'Federal Excise Tax - Beer', 'excise', NULL, 'per_unit', 3.50, 'barrel', ARRAY['2203'], '$3.50/barrel (small brewer <60K)', 'TTB'),
('US', 'Federal Excise Tax - Tobacco', 'excise', NULL, 'per_unit', 50.33, 'unit', ARRAY['2402'], '$50.33/1000 cigarettes', 'TTB'),
('US', 'Federal Excise Tax - Firearms', 'excise', 10.0000, 'percentage', NULL, NULL, ARRAY['9303','9304'], '10-11% on firearms and ammunition', 'ATF'),
('US', 'Gas Guzzler Tax', 'environmental', NULL, 'fixed', 1000.00, 'unit', ARRAY['8703'], '$1,000-$7,700 based on fuel economy', 'IRS'),
-- EU
('EU', 'Plastic Packaging Tax', 'environmental', NULL, 'per_unit', 0.80, 'kg', ARRAY['3923','3926'], '€0.80/kg non-recycled plastic packaging', 'EU Commission'),
('EU', 'CBAM (Carbon Border Adjustment)', 'environmental', NULL, 'per_unit', NULL, 'tonne_co2', ARRAY['7201','7202','7204','7601','2523','3102','3105','2716'], 'Per tonne CO2 equivalent linked to EU ETS price', 'EU Commission'),
-- GB
('GB', 'Alcohol Duty - Spirits', 'excise', NULL, 'per_unit', 28.74, 'liter', ARRAY['2208'], '£28.74/litre of pure alcohol', 'HMRC'),
('GB', 'Tobacco Duty - Cigarettes', 'excise', 16.5000, 'percentage', NULL, NULL, ARRAY['2402'], '16.5% of retail price + £6.52/pack of 20', 'HMRC'),
('GB', 'Plastic Packaging Tax', 'environmental', NULL, 'per_unit', 217.85, 'tonne', ARRAY['3923'], '£217.85/tonne for <30% recycled content', 'HMRC'),
-- IN
('IN', 'GST Compensation Cess', 'luxury', 28.0000, 'percentage', NULL, NULL, ARRAY['8703','2402','2202'], 'Additional cess on luxury and sin goods', 'GST Council'),
-- TH
('TH', 'Excise Tax - Vehicles', 'excise', 40.0000, 'percentage', NULL, NULL, ARRAY['8703'], 'Up to 40% on passenger vehicles by engine size', 'Thai Excise Dept'),
('TH', 'Excise Tax - Alcohol', 'excise', NULL, 'per_unit', NULL, 'liter', ARRAY['2203','2204','2208'], 'Per liter varies by alcohol type and ABV', 'Thai Excise Dept'),
-- KR
('KR', 'Individual Consumption Tax', 'luxury', 20.0000, 'percentage', NULL, NULL, ARRAY['7113','8703'], '개별소비세 - 보석/자동차/에어컨 등', 'NTS'),
('KR', 'Education Tax', 'sin', 30.0000, 'percentage', NULL, NULL, ARRAY['2203','2204','2208'], '교육세 - 주류 개별소비세의 30%', 'NTS'),
-- JP
('JP', 'Liquor Tax - Beer', 'excise', NULL, 'per_unit', 181.60, 'liter', ARRAY['2203'], '¥181.6/liter 酒税', 'NTA'),
('JP', 'Tobacco Tax', 'excise', NULL, 'per_unit', 15244.00, 'unit', ARRAY['2402'], '¥15,244/1000 cigarettes たばこ税', 'NTA'),
-- AU
('AU', 'Wine Equalisation Tax', 'excise', 29.0000, 'percentage', NULL, NULL, ARRAY['2204','2205','2206'], '29% WET on wholesale wine value', 'ATO'),
('AU', 'Luxury Car Tax', 'luxury', 33.0000, 'percentage', NULL, NULL, ARRAY['8703'], '33% on amount above $76,950 threshold', 'ATO'),
-- CA
('CA', 'Digital Services Tax', 'digital', 3.0000, 'percentage', NULL, NULL, ARRAY['8523','8524'], '3% on digital services revenue >C$20M', 'CRA'),
-- SA
('SA', 'Excise Tax - Energy Drinks', 'sin', 100.0000, 'percentage', NULL, NULL, ARRAY['2202'], '100% excise on energy drinks', 'GAZT'),
('SA', 'Excise Tax - Tobacco', 'sin', 100.0000, 'percentage', NULL, NULL, ARRAY['2402'], '100% excise on tobacco products', 'GAZT'),
('SA', 'Excise Tax - Soft Drinks', 'sin', 50.0000, 'percentage', NULL, NULL, ARRAY['2202'], '50% excise on carbonated drinks', 'GAZT'),
-- AE
('AE', 'Excise Tax - Tobacco', 'sin', 100.0000, 'percentage', NULL, NULL, ARRAY['2402'], '100% excise on tobacco', 'FTA'),
('AE', 'Excise Tax - Energy Drinks', 'sin', 100.0000, 'percentage', NULL, NULL, ARRAY['2202'], '100% excise on energy drinks', 'FTA'),
('AE', 'Excise Tax - Carbonated Drinks', 'sin', 50.0000, 'percentage', NULL, NULL, ARRAY['2202'], '50% excise on carbonated drinks', 'FTA'),
-- SG
('SG', 'Excise Duty - Alcohol', 'excise', NULL, 'per_unit', 88.00, 'liter', ARRAY['2203','2204','2208'], '$88/litre of alcohol for spirits', 'Singapore Customs');
