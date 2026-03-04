-- ============================================================================
-- POTAL Tariff Seed Data (004-tariff-seed-data.sql)
-- ============================================================================
-- Populates tables from 003-tariff-data-tables.sql
-- Safe to re-run (uses ON CONFLICT DO UPDATE)
-- ============================================================================

BEGIN;

-- ─── 1. COUNTRY_PROFILES ─────────────────────────────────────────────────

INSERT INTO country_profiles (
  country_code, country_name, region, vat_rate, vat_label,
  avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd,
  currency, has_fta_with_china, notes
) VALUES
('US', 'United States', 'North America', 0.0, 'Sales Tax', 0.05, 0, 'USD', 0, 'USD', false, 'State sales tax varies 0-10.25%. China de minimis eliminated Aug 2025.'),
('CA', 'Canada', 'North America', 0.05, 'GST', 0.08, 20, 'CAD', 15, 'CAD', false, 'GST 5% federal + PST/HST varies by province (0-10%).'),
('MX', 'Mexico', 'North America', 0.16, 'IVA', 0.15, 50, 'USD', 50, 'MXN', false, NULL),
('GB', 'United Kingdom', 'Europe', 0.20, 'VAT', 0.04, 135, 'GBP', 170, 'GBP', false, 'VAT collected at point of sale for goods ≤£135.'),
('DE', 'Germany', 'Europe', 0.19, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, 'EU IOSS for goods ≤€150. VAT always applies.'),
('FR', 'France', 'Europe', 0.20, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('IT', 'Italy', 'Europe', 0.22, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('ES', 'Spain', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('NL', 'Netherlands', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('BE', 'Belgium', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('AT', 'Austria', 'Europe', 0.20, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('SE', 'Sweden', 'Europe', 0.25, 'VAT', 0.042, 150, 'EUR', 160, 'SEK', false, NULL),
('DK', 'Denmark', 'Europe', 0.25, 'VAT', 0.042, 150, 'EUR', 160, 'DKK', false, NULL),
('FI', 'Finland', 'Europe', 0.255, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('NO', 'Norway', 'Europe', 0.25, 'VAT', 0.05, 350, 'NOK', 33, 'NOK', false, 'VOEC scheme: VAT at point of sale for ≤NOK 3000.'),
('CH', 'Switzerland', 'Europe', 0.081, 'VAT', 0.03, 5, 'CHF', 5.60, 'CHF', false, 'De minimis based on duty amount, not goods value.'),
('PL', 'Poland', 'Europe', 0.23, 'VAT', 0.042, 150, 'EUR', 160, 'PLN', false, NULL),
('IE', 'Ireland', 'Europe', 0.23, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('PT', 'Portugal', 'Europe', 0.23, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('GR', 'Greece', 'Europe', 0.24, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL),
('CZ', 'Czech Republic', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'CZK', false, NULL),
('RO', 'Romania', 'Europe', 0.19, 'VAT', 0.042, 150, 'EUR', 160, 'RON', false, NULL),
('HU', 'Hungary', 'Europe', 0.27, 'VAT', 0.042, 150, 'EUR', 160, 'HUF', false, NULL),
('JP', 'Japan', 'Asia Pacific', 0.10, 'JCT', 0.05, 10000, 'JPY', 67, 'JPY', true, 'RCEP member. De minimis ¥10,000 for customs duty.'),
('KR', 'South Korea', 'Asia Pacific', 0.10, 'VAT', 0.08, 150, 'USD', 150, 'KRW', true, 'FTA with China. De minimis $150 USD.'),
('CN', 'China', 'Asia Pacific', 0.13, 'VAT', 0.098, 50, 'CNY', 7, 'CNY', false, 'Cross-border e-commerce has separate tax regime (9.1% composite).'),
('HK', 'Hong Kong', 'Asia Pacific', 0.0, 'None', 0.0, 0, 'HKD', 0, 'HKD', true, 'Free port. No customs duty, no VAT/GST.'),
('TW', 'Taiwan', 'Asia Pacific', 0.05, 'VAT', 0.065, 2000, 'TWD', 63, 'TWD', false, NULL),
('SG', 'Singapore', 'Asia Pacific', 0.09, 'GST', 0.0, 400, 'SGD', 300, 'SGD', true, 'Zero customs duty on most goods. GST on imports >$400 SGD.'),
('AU', 'Australia', 'Oceania', 0.10, 'GST', 0.05, 1000, 'AUD', 650, 'AUD', true, 'ChAFTA with China. GST on all imports. Duty de minimis AUD 1000.'),
('NZ', 'New Zealand', 'Oceania', 0.15, 'GST', 0.05, 1000, 'NZD', 600, 'NZD', true, 'FTA with China. GST collected at border.'),
('IN', 'India', 'Asia Pacific', 0.18, 'GST', 0.20, 0, 'INR', 0, 'INR', false, 'No de minimis. IGST on all imports. BCD varies widely.'),
('TH', 'Thailand', 'Asia Pacific', 0.07, 'VAT', 0.10, 1500, 'THB', 43, 'THB', true, NULL),
('VN', 'Vietnam', 'Asia Pacific', 0.10, 'VAT', 0.10, 1000000, 'VND', 40, 'VND', true, NULL),
('MY', 'Malaysia', 'Asia Pacific', 0.08, 'SST', 0.08, 500, 'MYR', 110, 'MYR', true, NULL),
('PH', 'Philippines', 'Asia Pacific', 0.12, 'VAT', 0.10, 10000, 'PHP', 175, 'PHP', true, NULL),
('ID', 'Indonesia', 'Asia Pacific', 0.11, 'VAT', 0.10, 3, 'USD', 3, 'IDR', true, 'Very low de minimis (USD 3). VAT on all imports.'),
('AE', 'United Arab Emirates', 'Middle East', 0.05, 'VAT', 0.05, 1000, 'AED', 272, 'AED', false, NULL),
('SA', 'Saudi Arabia', 'Middle East', 0.15, 'VAT', 0.05, 1000, 'SAR', 267, 'SAR', false, NULL),
('IL', 'Israel', 'Middle East', 0.17, 'VAT', 0.08, 75, 'USD', 75, 'ILS', false, NULL),
('TR', 'Turkey', 'Middle East', 0.20, 'VAT', 0.12, 150, 'EUR', 160, 'TRY', false, NULL),
('QA', 'Qatar', 'Middle East', 0.0, 'None', 0.05, 0, 'QAR', 0, 'QAR', false, 'No VAT. Customs duty 5% on most goods.'),
('KW', 'Kuwait', 'Middle East', 0.0, 'None', 0.05, 0, 'KWD', 0, 'KWD', false, NULL),
('BR', 'Brazil', 'Latin America', 0.17, 'ICMS', 0.20, 50, 'USD', 50, 'BRL', false, 'Complex tax: II + IPI + ICMS + PIS/COFINS. Remessa Conforme program.'),
('CL', 'Chile', 'Latin America', 0.19, 'IVA', 0.06, 30, 'USD', 30, 'CLP', true, NULL),
('CO', 'Colombia', 'Latin America', 0.19, 'IVA', 0.10, 200, 'USD', 200, 'COP', false, NULL),
('AR', 'Argentina', 'Latin America', 0.21, 'IVA', 0.18, 50, 'USD', 50, 'ARS', false, 'Additional perception taxes on imports.'),
('PE', 'Peru', 'Latin America', 0.18, 'IGV', 0.06, 200, 'USD', 200, 'PEN', true, NULL),
('ZA', 'South Africa', 'Africa', 0.15, 'VAT', 0.10, 500, 'ZAR', 27, 'ZAR', false, NULL),
('NG', 'Nigeria', 'Africa', 0.075, 'VAT', 0.15, 0, 'NGN', 0, 'NGN', false, NULL),
('EG', 'Egypt', 'Africa', 0.14, 'VAT', 0.15, 0, 'EGP', 0, 'EGP', false, NULL),
('KE', 'Kenya', 'Africa', 0.16, 'VAT', 0.12, 0, 'KES', 0, 'KES', false, NULL),
('MA', 'Morocco', 'Africa', 0.20, 'VAT', 0.15, 0, 'MAD', 0, 'MAD', false, NULL)
ON CONFLICT (country_code) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  region = EXCLUDED.region,
  vat_rate = EXCLUDED.vat_rate,
  vat_label = EXCLUDED.vat_label,
  avg_duty_rate = EXCLUDED.avg_duty_rate,
  de_minimis = EXCLUDED.de_minimis,
  de_minimis_currency = EXCLUDED.de_minimis_currency,
  de_minimis_usd = EXCLUDED.de_minimis_usd,
  currency = EXCLUDED.currency,
  has_fta_with_china = EXCLUDED.has_fta_with_china,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ─── 2. DUTY_RATES ──────────────────────────────────────────────────────
-- Delete and re-insert (simpler than dealing with NULL hs_code in UNIQUE)

DELETE FROM duty_rates;

INSERT INTO duty_rates (hs_chapter, destination_country, mfn_rate) VALUES
('33', 'US', 0.0), ('33', 'GB', 0.0), ('33', 'EU', 0.0), ('33', 'JP', 0.0),
('33', 'KR', 0.08), ('33', 'AU', 0.05), ('33', 'CA', 0.065), ('33', 'CN', 0.15),
('34', 'US', 0.035), ('34', 'GB', 0.04), ('34', 'EU', 0.04), ('34', 'JP', 0.035),
('34', 'KR', 0.08), ('34', 'AU', 0.05), ('34', 'CA', 0.065), ('34', 'CN', 0.10),
('39', 'US', 0.042), ('39', 'GB', 0.065), ('39', 'EU', 0.065), ('39', 'JP', 0.04),
('39', 'KR', 0.065), ('39', 'AU', 0.05), ('39', 'CA', 0.065), ('39', 'CN', 0.10),
('42', 'US', 0.08), ('42', 'GB', 0.03), ('42', 'EU', 0.03), ('42', 'JP', 0.10),
('42', 'KR', 0.08), ('42', 'AU', 0.05), ('42', 'CA', 0.08), ('42', 'CN', 0.10),
('49', 'US', 0.0), ('49', 'GB', 0.0), ('49', 'EU', 0.0), ('49', 'JP', 0.0),
('49', 'KR', 0.0), ('49', 'AU', 0.0), ('49', 'CA', 0.0), ('49', 'CN', 0.0),
('61', 'US', 0.16), ('61', 'GB', 0.12), ('61', 'EU', 0.12), ('61', 'JP', 0.105),
('61', 'KR', 0.13), ('61', 'AU', 0.05), ('61', 'CA', 0.18), ('61', 'CN', 0.16),
('62', 'US', 0.15), ('62', 'GB', 0.12), ('62', 'EU', 0.12), ('62', 'JP', 0.10),
('62', 'KR', 0.13), ('62', 'AU', 0.05), ('62', 'CA', 0.18), ('62', 'CN', 0.16),
('63', 'US', 0.10), ('63', 'GB', 0.12), ('63', 'EU', 0.12), ('63', 'JP', 0.06),
('63', 'KR', 0.10), ('63', 'AU', 0.05), ('63', 'CA', 0.14), ('63', 'CN', 0.10),
('64', 'US', 0.12), ('64', 'GB', 0.08), ('64', 'EU', 0.08), ('64', 'JP', 0.30),
('64', 'KR', 0.13), ('64', 'AU', 0.05), ('64', 'CA', 0.18), ('64', 'CN', 0.24),
('65', 'US', 0.075), ('65', 'GB', 0.025), ('65', 'EU', 0.025), ('65', 'JP', 0.06),
('65', 'KR', 0.08), ('65', 'AU', 0.05), ('65', 'CA', 0.095), ('65', 'CN', 0.10),
('69', 'US', 0.06), ('69', 'GB', 0.05), ('69', 'EU', 0.05), ('69', 'JP', 0.03),
('69', 'KR', 0.08), ('69', 'AU', 0.05), ('69', 'CA', 0.065), ('69', 'CN', 0.12),
('71', 'US', 0.065), ('71', 'GB', 0.025), ('71', 'EU', 0.025), ('71', 'JP', 0.055),
('71', 'KR', 0.08), ('71', 'AU', 0.05), ('71', 'CA', 0.08), ('71', 'CN', 0.20),
('73', 'US', 0.034), ('73', 'GB', 0.028), ('73', 'EU', 0.028), ('73', 'JP', 0.03),
('73', 'KR', 0.08), ('73', 'AU', 0.05), ('73', 'CA', 0.065), ('73', 'CN', 0.10),
('84', 'US', 0.0), ('84', 'GB', 0.0), ('84', 'EU', 0.0), ('84', 'JP', 0.0),
('84', 'KR', 0.0), ('84', 'AU', 0.0), ('84', 'CA', 0.0), ('84', 'CN', 0.0),
('85', 'US', 0.0), ('85', 'GB', 0.0), ('85', 'EU', 0.0), ('85', 'JP', 0.0),
('85', 'KR', 0.0), ('85', 'AU', 0.0), ('85', 'CA', 0.0), ('85', 'CN', 0.0),
('87', 'US', 0.11), ('87', 'GB', 0.14), ('87', 'EU', 0.14), ('87', 'JP', 0.0),
('87', 'KR', 0.08), ('87', 'AU', 0.05), ('87', 'CA', 0.13), ('87', 'CN', 0.20),
('90', 'US', 0.02), ('90', 'GB', 0.028), ('90', 'EU', 0.028), ('90', 'JP', 0.0),
('90', 'KR', 0.08), ('90', 'AU', 0.05), ('90', 'CA', 0.05), ('90', 'CN', 0.10),
('91', 'US', 0.06), ('91', 'GB', 0.045), ('91', 'EU', 0.045), ('91', 'JP', 0.0),
('91', 'KR', 0.08), ('91', 'AU', 0.05), ('91', 'CA', 0.05), ('91', 'CN', 0.20),
('94', 'US', 0.0), ('94', 'GB', 0.0), ('94', 'EU', 0.0), ('94', 'JP', 0.0),
('94', 'KR', 0.0), ('94', 'AU', 0.05), ('94', 'CA', 0.08), ('94', 'CN', 0.0),
('95', 'US', 0.0), ('95', 'GB', 0.047), ('95', 'EU', 0.047), ('95', 'JP', 0.0),
('95', 'KR', 0.08), ('95', 'AU', 0.05), ('95', 'CA', 0.07), ('95', 'CN', 0.10),
('96', 'US', 0.04), ('96', 'GB', 0.035), ('96', 'EU', 0.035), ('96', 'JP', 0.038),
('96', 'KR', 0.08), ('96', 'AU', 0.05), ('96', 'CA', 0.065), ('96', 'CN', 0.10);

-- ─── 3. ADDITIONAL_TARIFFS ──────────────────────────────────────────────
-- Section 301 tariffs (CN→US)

DELETE FROM additional_tariffs;

INSERT INTO additional_tariffs (
  tariff_name, origin_country, destination_country, hs_chapter, rate, notes
) VALUES
('Section 301 List 3', 'CN', 'US', '85', 0.25, 'Electronics 25%'),
('Section 301 List 3', 'CN', 'US', '84', 0.25, 'Machinery/Computers 25%'),
('Section 301 List 3', 'CN', 'US', '94', 0.25, 'Furniture 25%'),
('Section 301 List 3', 'CN', 'US', '39', 0.25, 'Plastics 25%'),
('Section 301 List 3', 'CN', 'US', '73', 0.25, 'Steel articles 25%'),
('Section 301 List 3', 'CN', 'US', '87', 0.25, 'Vehicles/e-bikes 25%'),
('Section 301 List 4A', 'CN', 'US', '42', 0.075, 'Leather goods 7.5%'),
('Section 301 List 4A', 'CN', 'US', '61', 0.075, 'Knitted apparel 7.5%'),
('Section 301 List 4A', 'CN', 'US', '62', 0.075, 'Woven apparel 7.5%'),
('Section 301 List 4A', 'CN', 'US', '64', 0.075, 'Footwear 7.5%'),
('Section 301 List 4A', 'CN', 'US', '95', 0.075, 'Toys 7.5%'),
('Section 301 List 4A', 'CN', 'US', '71', 0.075, 'Jewelry 7.5%');

-- ─── 4. FTA_AGREEMENTS ──────────────────────────────────────────────────

INSERT INTO fta_agreements (
  fta_code, fta_name, preferential_multiplier, excluded_chapters, is_active
) VALUES
('USMCA', 'United States-Mexico-Canada Agreement', 0.0, '[]', true),
('RCEP', 'Regional Comprehensive Economic Partnership', 0.5, '["24"]', true),
('EU-KR', 'EU-Korea Free Trade Agreement', 0.0, '[]', true),
('EU-JP', 'EU-Japan Economic Partnership Agreement', 0.0, '[]', true),
('KORUS', 'Korea-US Free Trade Agreement', 0.0, '[]', true),
('ChAFTA', 'China-Australia Free Trade Agreement', 0.0, '["24"]', true),
('AUSFTA', 'Australia-US Free Trade Agreement', 0.0, '[]', true),
('UK-JP', 'UK-Japan CEPA', 0.0, '[]', true),
('UK-AU', 'UK-Australia FTA', 0.0, '[]', true),
('CPTPP', 'Comprehensive and Progressive Trans-Pacific Partnership', 0.0, '[]', true),
('KR-CN', 'Korea-China FTA', 0.3, '["87"]', true),
('ACFTA', 'ASEAN-China Free Trade Area', 0.0, '[]', true)
ON CONFLICT (fta_code) DO UPDATE SET
  fta_name = EXCLUDED.fta_name,
  preferential_multiplier = EXCLUDED.preferential_multiplier,
  excluded_chapters = EXCLUDED.excluded_chapters,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ─── 5. FTA_MEMBERS ─────────────────────────────────────────────────────
-- Uses correct column name: country_code (not member_country)
-- No updated_at column in this table

DELETE FROM fta_members;

INSERT INTO fta_members (fta_code, country_code) VALUES
-- USMCA
('USMCA', 'US'), ('USMCA', 'MX'), ('USMCA', 'CA'),
-- RCEP
('RCEP', 'CN'), ('RCEP', 'JP'), ('RCEP', 'KR'), ('RCEP', 'AU'), ('RCEP', 'NZ'),
('RCEP', 'SG'), ('RCEP', 'MY'), ('RCEP', 'TH'), ('RCEP', 'VN'), ('RCEP', 'PH'),
('RCEP', 'ID'), ('RCEP', 'BN'), ('RCEP', 'KH'), ('RCEP', 'LA'), ('RCEP', 'MM'),
-- EU-KR
('EU-KR', 'KR'),
('EU-KR', 'AT'), ('EU-KR', 'BE'), ('EU-KR', 'BG'), ('EU-KR', 'HR'), ('EU-KR', 'CY'),
('EU-KR', 'CZ'), ('EU-KR', 'DK'), ('EU-KR', 'EE'), ('EU-KR', 'FI'), ('EU-KR', 'FR'),
('EU-KR', 'DE'), ('EU-KR', 'GR'), ('EU-KR', 'HU'), ('EU-KR', 'IE'), ('EU-KR', 'IT'),
('EU-KR', 'LV'), ('EU-KR', 'LT'), ('EU-KR', 'LU'), ('EU-KR', 'MT'), ('EU-KR', 'NL'),
('EU-KR', 'PL'), ('EU-KR', 'PT'), ('EU-KR', 'RO'), ('EU-KR', 'SK'), ('EU-KR', 'SI'),
('EU-KR', 'ES'), ('EU-KR', 'SE'),
-- EU-JP
('EU-JP', 'JP'),
('EU-JP', 'AT'), ('EU-JP', 'BE'), ('EU-JP', 'BG'), ('EU-JP', 'HR'), ('EU-JP', 'CY'),
('EU-JP', 'CZ'), ('EU-JP', 'DK'), ('EU-JP', 'EE'), ('EU-JP', 'FI'), ('EU-JP', 'FR'),
('EU-JP', 'DE'), ('EU-JP', 'GR'), ('EU-JP', 'HU'), ('EU-JP', 'IE'), ('EU-JP', 'IT'),
('EU-JP', 'LV'), ('EU-JP', 'LT'), ('EU-JP', 'LU'), ('EU-JP', 'MT'), ('EU-JP', 'NL'),
('EU-JP', 'PL'), ('EU-JP', 'PT'), ('EU-JP', 'RO'), ('EU-JP', 'SK'), ('EU-JP', 'SI'),
('EU-JP', 'ES'), ('EU-JP', 'SE'),
-- KORUS
('KORUS', 'US'), ('KORUS', 'KR'),
-- ChAFTA
('ChAFTA', 'CN'), ('ChAFTA', 'AU'),
-- AUSFTA
('AUSFTA', 'US'), ('AUSFTA', 'AU'),
-- UK-JP
('UK-JP', 'GB'), ('UK-JP', 'JP'),
-- UK-AU
('UK-AU', 'GB'), ('UK-AU', 'AU'),
-- CPTPP
('CPTPP', 'AU'), ('CPTPP', 'BN'), ('CPTPP', 'CA'), ('CPTPP', 'CL'), ('CPTPP', 'JP'),
('CPTPP', 'MY'), ('CPTPP', 'MX'), ('CPTPP', 'NZ'), ('CPTPP', 'PE'), ('CPTPP', 'SG'),
('CPTPP', 'VN'), ('CPTPP', 'GB'),
-- KR-CN
('KR-CN', 'KR'), ('KR-CN', 'CN'),
-- ACFTA
('ACFTA', 'CN'), ('ACFTA', 'SG'), ('ACFTA', 'MY'), ('ACFTA', 'TH'), ('ACFTA', 'VN'),
('ACFTA', 'PH'), ('ACFTA', 'ID'), ('ACFTA', 'BN'), ('ACFTA', 'KH'), ('ACFTA', 'LA'),
('ACFTA', 'MM');

COMMIT;

-- Summary:
-- 58 countries, 168 duty rates, 12 additional tariffs, 12 FTAs, 100+ FTA members
