-- CW38: Seed ALL country_profiles from country-data.ts (240 countries)
-- Migration: 070_cw38_country_profiles_full_seed.sql
-- Generated: 2026-04-17
-- Purpose: Move from 53 DB + 187 hardcoded fallback → 240 DB-managed

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('US', 'United States', 'North America', 0, 'Sales Tax', 0.05, 800, 'USD', 800, 'USD', false, 'State sales tax varies 0-10.25%. De minimis $800 except CN/HK origin ($0 per IEEPA Aug 2025).', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CA', 'Canada', 'North America', 0.05, 'GST', 0.08, 20, 'CAD', 15, 'CAD', false, 'GST 5% federal + PST/HST varies by province (0-10%).', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MX', 'Mexico', 'North America', 0.16, 'IVA', 0.15, 50, 'USD', 50, 'MXN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GB', 'United Kingdom', 'Europe', 0.20, 'VAT', 0.04, 135, 'GBP', 170, 'GBP', false, 'VAT collected at point of sale for goods ≤£135.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('DE', 'Germany', 'Europe', 0.19, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, 'EU IOSS for goods ≤€150. VAT always applies.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('FR', 'France', 'Europe', 0.20, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IT', 'Italy', 'Europe', 0.22, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ES', 'Spain', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NL', 'Netherlands', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BE', 'Belgium', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AT', 'Austria', 'Europe', 0.20, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SE', 'Sweden', 'Europe', 0.25, 'VAT', 0.042, 150, 'EUR', 160, 'SEK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('DK', 'Denmark', 'Europe', 0.25, 'VAT', 0.042, 150, 'EUR', 160, 'DKK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('FI', 'Finland', 'Europe', 0.255, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NO', 'Norway', 'Europe', 0.25, 'VAT', 0.05, 350, 'NOK', 33, 'NOK', false, 'VOEC scheme: VAT at point of sale for ≤NOK 3000.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CH', 'Switzerland', 'Europe', 0.081, 'VAT', 0.03, 5, 'CHF', 5.60, 'CHF', false, 'De minimis based on duty amount, not goods value.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PL', 'Poland', 'Europe', 0.23, 'VAT', 0.042, 150, 'EUR', 160, 'PLN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IE', 'Ireland', 'Europe', 0.23, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PT', 'Portugal', 'Europe', 0.23, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GR', 'Greece', 'Europe', 0.24, 'VAT', 0.042, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CZ', 'Czech Republic', 'Europe', 0.21, 'VAT', 0.042, 150, 'EUR', 160, 'CZK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('RO', 'Romania', 'Europe', 0.19, 'VAT', 0.042, 150, 'EUR', 160, 'RON', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('HU', 'Hungary', 'Europe', 0.27, 'VAT', 0.042, 150, 'EUR', 160, 'HUF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BG', 'Bulgaria', 'Europe', 0.20, 'DDC', 0.045, 294, 'BGN', 160, 'BGN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('HR', 'Croatia', 'Europe', 0.25, 'PDV', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SK', 'Slovakia', 'Europe', 0.20, 'DPH', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SI', 'Slovenia', 'Europe', 0.22, 'DDV', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LT', 'Lithuania', 'Europe', 0.21, 'PVM', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LV', 'Latvia', 'Europe', 0.21, 'PVN', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('EE', 'Estonia', 'Europe', 0.22, 'KM', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CY', 'Cyprus', 'Europe', 0.19, 'FPA', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MT', 'Malta', 'Europe', 0.18, 'VAT', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LU', 'Luxembourg', 'Europe', 0.17, 'TVA', 0.045, 150, 'EUR', 160, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IS', 'Iceland', 'Europe', 0.24, 'VSK', 0.03, 10000, 'ISK', 71, 'ISK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('RS', 'Serbia', 'Europe', 0.20, 'PDV', 0.10, 50, 'EUR', 50, 'RSD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('UA', 'Ukraine', 'Europe', 0.20, 'PDV', 0.10, 100, 'EUR', 100, 'UAH', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BA', 'Bosnia', 'Europe', 0.17, 'PDV', 0.10, 0, 'BAM', 0, 'BAM', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ME', 'Montenegro', 'Europe', 0.21, 'PDV', 0.10, 0, 'EUR', 0, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MK', 'North Macedonia', 'Europe', 0.18, 'DDV', 0.10, 0, 'MKD', 0, 'MKD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AL', 'Albania', 'Europe', 0.20, 'TVSH', 0.10, 0, 'ALL', 0, 'ALL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GE', 'Georgia', 'Europe', 0.18, 'VAT', 0.05, 300, 'GEL', 100, 'GEL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MD', 'Moldova', 'Europe', 0.20, 'TVA', 0.10, 0, 'MDL', 0, 'MDL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BY', 'Belarus', 'Europe', 0.20, 'VAT', 0.10, 22, 'EUR', 22, 'BYN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AM', 'Armenia', 'Europe', 0.20, 'VAT', 0.10, 0, 'AMD', 0, 'AMD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AZ', 'Azerbaijan', 'Europe', 0.18, 'VAT', 0.10, 0, 'AZN', 0, 'AZN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('EC', 'Ecuador', 'Americas', 0.12, 'IVA', 0.12, 400, 'USD', 400, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('VE', 'Venezuela', 'Americas', 0.16, 'IVA', 0.15, 0, 'VES', 0, 'VES', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BO', 'Bolivia', 'Americas', 0.13, 'IVA', 0.10, 0, 'BOB', 0, 'BOB', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PY', 'Paraguay', 'Americas', 0.10, 'IVA', 0.10, 0, 'PYG', 0, 'PYG', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('UY', 'Uruguay', 'Americas', 0.22, 'IVA', 0.12, 200, 'USD', 200, 'UYU', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CR', 'Costa Rica', 'Americas', 0.13, 'IVA', 0.10, 0, 'CRC', 0, 'CRC', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PA', 'Panama', 'Americas', 0.07, 'ITBMS', 0.10, 0, 'PAB', 0, 'PAB', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GT', 'Guatemala', 'Americas', 0.12, 'IVA', 0.10, 0, 'GTQ', 0, 'GTQ', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('HN', 'Honduras', 'Americas', 0.15, 'ISV', 0.10, 0, 'HNL', 0, 'HNL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SV', 'El Salvador', 'Americas', 0.13, 'IVA', 0.10, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NI', 'Nicaragua', 'Americas', 0.15, 'IVA', 0.10, 0, 'NIO', 0, 'NIO', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('DO', 'Dominican Republic', 'Americas', 0.18, 'ITBIS', 0.10, 200, 'USD', 200, 'DOP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('JM', 'Jamaica', 'Americas', 0.15, 'GCT', 0.12, 0, 'JMD', 0, 'JMD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TT', 'Trinidad', 'Americas', 0.125, 'VAT', 0.10, 0, 'TTD', 0, 'TTD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CU', 'Cuba', 'Americas', 0.20, 'VAT', 0.15, 0, 'CUP', 0, 'CUP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PR', 'Puerto Rico', 'Americas', 0.115, 'IVU', 0.05, 800, 'USD', 800, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('JP', 'Japan', 'Asia Pacific', 0.10, 'JCT', 0.05, 10000, 'JPY', 67, 'JPY', true, 'RCEP member. De minimis ¥10,000 for customs duty.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KR', 'South Korea', 'Asia Pacific', 0.10, 'VAT', 0.08, 150, 'USD', 150, 'KRW', true, 'FTA with China. De minimis $150 USD.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CN', 'China', 'Asia Pacific', 0.13, 'VAT', 0.098, 50, 'CNY', 7, 'CNY', false, 'Cross-border e-commerce has separate tax regime (9.1% composite).', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('HK', 'Hong Kong', 'Asia Pacific', 0, 'None', 0, 0, 'HKD', 0, 'HKD', true, 'Free port. No customs duty, no VAT/GST.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TW', 'Taiwan', 'Asia Pacific', 0.05, 'VAT', 0.065, 2000, 'TWD', 63, 'TWD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SG', 'Singapore', 'Asia Pacific', 0.09, 'GST', 0, 400, 'SGD', 300, 'SGD', true, 'Zero customs duty on most goods. GST on imports >$400 SGD.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AU', 'Australia', 'Oceania', 0.10, 'GST', 0.05, 1000, 'AUD', 650, 'AUD', true, 'ChAFTA with China. GST on all imports. Duty de minimis AUD 1000.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NZ', 'New Zealand', 'Oceania', 0.15, 'GST', 0.05, 1000, 'NZD', 600, 'NZD', true, 'FTA with China. GST collected at border.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IN', 'India', 'Asia Pacific', 0.18, 'GST', 0.20, 0, 'INR', 0, 'INR', false, 'No de minimis. IGST on all imports. BCD varies widely.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TH', 'Thailand', 'Asia Pacific', 0.07, 'VAT', 0.10, 1500, 'THB', 43, 'THB', true, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('VN', 'Vietnam', 'Asia Pacific', 0.10, 'VAT', 0.10, 1000000, 'VND', 40, 'VND', true, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MY', 'Malaysia', 'Asia Pacific', 0.08, 'SST', 0.08, 500, 'MYR', 110, 'MYR', true, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PH', 'Philippines', 'Asia Pacific', 0.12, 'VAT', 0.10, 10000, 'PHP', 175, 'PHP', true, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ID', 'Indonesia', 'Asia Pacific', 0.11, 'VAT', 0.10, 3, 'USD', 3, 'IDR', true, 'Very low de minimis (USD 3). VAT on all imports.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PK', 'Pakistan', 'Asia', 0.17, 'GST', 0.15, 0, 'PKR', 0, 'PKR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BD', 'Bangladesh', 'Asia', 0.15, 'VAT', 0.15, 0, 'BDT', 0, 'BDT', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LK', 'Sri Lanka', 'Asia', 0.15, 'VAT', 0.12, 0, 'LKR', 0, 'LKR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MM', 'Myanmar', 'Asia', 0.05, 'CT', 0.05, 0, 'MMK', 0, 'MMK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KH', 'Cambodia', 'Asia', 0.10, 'VAT', 0.10, 0, 'KHR', 0, 'KHR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LA', 'Laos', 'Asia', 0.10, 'VAT', 0.07, 0, 'LAK', 0, 'LAK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NP', 'Nepal', 'Asia', 0.13, 'VAT', 0.10, 0, 'NPR', 0, 'NPR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MN', 'Mongolia', 'Asia', 0.10, 'VAT', 0.05, 0, 'MNT', 0, 'MNT', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KZ', 'Kazakhstan', 'Asia', 0.12, 'VAT', 0.10, 200, 'EUR', 200, 'KZT', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('UZ', 'Uzbekistan', 'Asia', 0.12, 'VAT', 0.10, 0, 'UZS', 0, 'UZS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KG', 'Kyrgyzstan', 'Asia', 0.12, 'VAT', 0.10, 200, 'EUR', 200, 'KGS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TJ', 'Tajikistan', 'Asia', 0.15, 'VAT', 0.10, 0, 'TJS', 0, 'TJS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TM', 'Turkmenistan', 'Asia', 0.15, 'VAT', 0.10, 0, 'TMT', 0, 'TMT', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BN', 'Brunei', 'Asia', 0, 'None', 0.03, 0, 'BND', 0, 'BND', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AF', 'Afghanistan', 'Asia', 0, 'BRT', 0.10, 0, 'AFN', 0, 'AFN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AE', 'United Arab Emirates', 'Middle East', 0.05, 'VAT', 0.05, 1000, 'AED', 272, 'AED', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SA', 'Saudi Arabia', 'Middle East', 0.15, 'VAT', 0.05, 1000, 'SAR', 267, 'SAR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IL', 'Israel', 'Middle East', 0.17, 'VAT', 0.08, 75, 'USD', 75, 'ILS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TR', 'Turkey', 'Middle East', 0.20, 'VAT', 0.12, 150, 'EUR', 160, 'TRY', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('QA', 'Qatar', 'Middle East', 0, 'None', 0.05, 0, 'QAR', 0, 'QAR', false, 'No VAT. Customs duty 5% on most goods.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KW', 'Kuwait', 'Middle East', 0, 'None', 0.05, 0, 'KWD', 0, 'KWD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('JO', 'Jordan', 'Middle East', 0.16, 'GST', 0.10, 0, 'JOD', 0, 'JOD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LB', 'Lebanon', 'Middle East', 0.11, 'VAT', 0.05, 0, 'LBP', 0, 'LBP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IQ', 'Iraq', 'Middle East', 0.15, 'VAT', 0.10, 0, 'IQD', 0, 'IQD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IR', 'Iran', 'Middle East', 0.09, 'VAT', 0.15, 0, 'IRR', 0, 'IRR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('YE', 'Yemen', 'Middle East', 0.05, 'GST', 0.10, 0, 'YER', 0, 'YER', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('OM', 'Oman', 'Middle East', 0.05, 'VAT', 0.05, 1000, 'OMR', 390, 'OMR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BH', 'Bahrain', 'Middle East', 0.10, 'VAT', 0.05, 300, 'BHD', 800, 'BHD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SY', 'Syria', 'Middle East', 0, 'None', 0.15, 0, 'SYP', 0, 'SYP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BR', 'Brazil', 'Latin America', 0.17, 'ICMS', 0.20, 50, 'USD', 50, 'BRL', false, 'Complex tax: II + IPI + ICMS + PIS/COFINS. Remessa Conforme program.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CL', 'Chile', 'Latin America', 0.19, 'IVA', 0.06, 30, 'USD', 30, 'CLP', true, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CO', 'Colombia', 'Latin America', 0.19, 'IVA', 0.10, 200, 'USD', 200, 'COP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AR', 'Argentina', 'Latin America', 0.21, 'IVA', 0.18, 50, 'USD', 50, 'ARS', false, 'Additional perception taxes on imports.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PE', 'Peru', 'Latin America', 0.18, 'IGV', 0.06, 200, 'USD', 200, 'PEN', true, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ZA', 'South Africa', 'Africa', 0.15, 'VAT', 0.10, 500, 'ZAR', 27, 'ZAR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NG', 'Nigeria', 'Africa', 0.075, 'VAT', 0.15, 0, 'NGN', 0, 'NGN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('EG', 'Egypt', 'Africa', 0.14, 'VAT', 0.15, 0, 'EGP', 0, 'EGP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KE', 'Kenya', 'Africa', 0.16, 'VAT', 0.12, 0, 'KES', 0, 'KES', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MA', 'Morocco', 'Africa', 0.20, 'VAT', 0.15, 0, 'MAD', 0, 'MAD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TN', 'Tunisia', 'Africa', 0.19, 'TVA', 0.15, 0, 'TND', 0, 'TND', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('DZ', 'Algeria', 'Africa', 0.19, 'TVA', 0.15, 0, 'DZD', 0, 'DZD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LY', 'Libya', 'Africa', 0, 'None', 0.10, 0, 'LYD', 0, 'LYD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GH', 'Ghana', 'Africa', 0.15, 'VAT', 0.12, 0, 'GHS', 0, 'GHS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CI', 'Ivory Coast', 'Africa', 0.18, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SN', 'Senegal', 'Africa', 0.18, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CM', 'Cameroon', 'Africa', 0.1925, 'TVA', 0.15, 0, 'XAF', 0, 'XAF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TZ', 'Tanzania', 'Africa', 0.18, 'VAT', 0.12, 0, 'TZS', 0, 'TZS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('UG', 'Uganda', 'Africa', 0.18, 'VAT', 0.12, 0, 'UGX', 0, 'UGX', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ET', 'Ethiopia', 'Africa', 0.15, 'VAT', 0.15, 0, 'ETB', 0, 'ETB', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('RW', 'Rwanda', 'Africa', 0.18, 'VAT', 0.12, 0, 'RWF', 0, 'RWF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CD', 'DR Congo', 'Africa', 0.16, 'TVA', 0.15, 0, 'CDF', 0, 'CDF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AO', 'Angola', 'Africa', 0.14, 'IVA', 0.12, 0, 'AOA', 0, 'AOA', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MZ', 'Mozambique', 'Africa', 0.17, 'IVA', 0.12, 0, 'MZN', 0, 'MZN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MU', 'Mauritius', 'Africa', 0.15, 'VAT', 0.10, 0, 'MUR', 0, 'MUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MG', 'Madagascar', 'Africa', 0.20, 'TVA', 0.12, 0, 'MGA', 0, 'MGA', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BW', 'Botswana', 'Africa', 0.14, 'VAT', 0.10, 0, 'BWP', 0, 'BWP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ZW', 'Zimbabwe', 'Africa', 0.15, 'VAT', 0.15, 0, 'ZWL', 0, 'ZWL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NA', 'Namibia', 'Africa', 0.15, 'VAT', 0.10, 0, 'NAD', 0, 'NAD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SD', 'Sudan', 'Africa', 0.17, 'VAT', 0.15, 0, 'SDG', 0, 'SDG', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('FJ', 'Fiji', 'Oceania', 0.15, 'VAT', 0.10, 0, 'FJD', 0, 'FJD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PG', 'Papua New Guinea', 'Oceania', 0.10, 'GST', 0.10, 0, 'PGK', 0, 'PGK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('WS', 'Samoa', 'Oceania', 0.15, 'VAGST', 0.10, 0, 'WST', 0, 'WST', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TO', 'Tonga', 'Oceania', 0.15, 'CT', 0.10, 0, 'TOP', 0, 'TOP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('VU', 'Vanuatu', 'Oceania', 0.15, 'VAT', 0.08, 0, 'VUV', 0, 'VUV', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('HT', 'Haiti', 'Americas', 0.10, 'TCA', 0.10, 0, 'HTG', 0, 'HTG', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BS', 'Bahamas', 'Americas', 0.12, 'VAT', 0.15, 0, 'BSD', 0, 'BSD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BB', 'Barbados', 'Americas', 0.175, 'VAT', 0.10, 0, 'BBD', 0, 'BBD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BZ', 'Belize', 'Americas', 0.125, 'GST', 0.10, 0, 'BZD', 0, 'BZD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GY', 'Guyana', 'Americas', 0.14, 'VAT', 0.10, 0, 'GYD', 0, 'GYD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SR', 'Suriname', 'Americas', 0.10, 'BTW', 0.10, 0, 'SRD', 0, 'SRD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ZM', 'Zambia', 'Africa', 0.16, 'VAT', 0.12, 0, 'ZMW', 0, 'ZMW', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MW', 'Malawi', 'Africa', 0.165, 'VAT', 0.12, 0, 'MWK', 0, 'MWK', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BJ', 'Benin', 'Africa', 0.18, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BF', 'Burkina Faso', 'Africa', 0.18, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ML', 'Mali', 'Africa', 0.18, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NE', 'Niger', 'Africa', 0.19, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TG', 'Togo', 'Africa', 0.18, 'TVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GA', 'Gabon', 'Africa', 0.18, 'TVA', 0.15, 0, 'XAF', 0, 'XAF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CG', 'Republic of Congo', 'Africa', 0.185, 'TVA', 0.15, 0, 'XAF', 0, 'XAF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GN', 'Guinea', 'Africa', 0.18, 'TVA', 0.12, 0, 'GNF', 0, 'GNF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SL', 'Sierra Leone', 'Africa', 0.15, 'GST', 0.12, 0, 'SLE', 0, 'SLE', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LR', 'Liberia', 'Africa', 0.10, 'GST', 0.10, 0, 'LRD', 0, 'LRD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MR', 'Mauritania', 'Africa', 0.16, 'TVA', 0.12, 0, 'MRU', 0, 'MRU', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TD', 'Chad', 'Africa', 0.18, 'TVA', 0.15, 0, 'XAF', 0, 'XAF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SZ', 'Eswatini', 'Africa', 0.15, 'VAT', 0.10, 0, 'SZL', 0, 'SZL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LS', 'Lesotho', 'Africa', 0.15, 'VAT', 0.10, 0, 'LSL', 0, 'LSL', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SC', 'Seychelles', 'Africa', 0.15, 'VAT', 0.10, 0, 'SCR', 0, 'SCR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('DJ', 'Djibouti', 'Africa', 0.10, 'TVA', 0.12, 0, 'DJF', 0, 'DJF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SO', 'Somalia', 'Africa', 0.05, 'ST', 0.10, 0, 'SOS', 0, 'SOS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ER', 'Eritrea', 'Africa', 0.05, 'ST', 0.10, 0, 'ERN', 0, 'ERN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SS', 'South Sudan', 'Africa', 0.18, 'VAT', 0.10, 0, 'SSP', 0, 'SSP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LI', 'Liechtenstein', 'Europe', 0.081, 'MWST', 0.03, 5, 'CHF', 5.60, 'CHF', false, 'Swiss customs union. Same tariff as Switzerland.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MC', 'Monaco', 'Europe', 0.20, 'TVA', 0.042, 150, 'EUR', 160, 'EUR', false, 'French customs territory. Same tariff as France/EU.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AD', 'Andorra', 'Europe', 0.045, 'IGI', 0.05, 0, 'EUR', 0, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SM', 'San Marino', 'Europe', 0.17, 'VAT', 0.042, 0, 'EUR', 0, 'EUR', false, 'EU customs union agreement.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('XK', 'Kosovo', 'Europe', 0.18, 'TVSH', 0.10, 0, 'EUR', 0, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PS', 'Palestine', 'Middle East', 0.16, 'VAT', 0.10, 0, 'ILS', 0, 'ILS', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MV', 'Maldives', 'Asia', 0.08, 'GST', 0.10, 0, 'MVR', 0, 'MVR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BT', 'Bhutan', 'Asia', 0.05, 'BST', 0.10, 0, 'BTN', 0, 'BTN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TL', 'Timor-Leste', 'Asia', 0.025, 'ST', 0.05, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MO', 'Macau', 'Asia', 0.0, 'None', 0.0, 0, 'MOP', 0, 'MOP', true, 'Free port. No customs duty, no VAT/GST (like Hong Kong).', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KY', 'Cayman Islands', 'Americas', 0.0, 'None', 0.22, 0, 'KYD', 0, 'KYD', false, 'No income tax, no VAT. Import duty is main revenue source.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BM', 'Bermuda', 'Americas', 0.0, 'None', 0.22, 0, 'BMD', 0, 'BMD', false, 'No income tax, no VAT. Import duty averages 22%.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('VG', 'British Virgin Islands', 'Americas', 0.0, 'None', 0.10, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AW', 'Aruba', 'Americas', 0.07, 'BBO', 0.08, 0, 'AWG', 0, 'AWG', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CW', 'Curaçao', 'Americas', 0.06, 'OB', 0.08, 0, 'ANG', 0, 'ANG', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AG', 'Antigua and Barbuda', 'Americas', 0.15, 'ABST', 0.12, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('DM', 'Dominica', 'Americas', 0.15, 'VAT', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GD', 'Grenada', 'Americas', 0.15, 'VAT', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KN', 'Saint Kitts and Nevis', 'Americas', 0.17, 'VAT', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('LC', 'Saint Lucia', 'Americas', 0.125, 'VAT', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('VC', 'Saint Vincent and the Grenadines', 'Americas', 0.16, 'VAT', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TC', 'Turks and Caicos Islands', 'Americas', 0.0, 'None', 0.15, 0, 'USD', 0, 'USD', false, 'No VAT/GST. Revenue from import duties.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AI', 'Anguilla', 'Americas', 0.13, 'GST', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MS', 'Montserrat', 'Americas', 0.0, 'None', 0.10, 0, 'XCD', 0, 'XCD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SX', 'Sint Maarten', 'Americas', 0.05, 'TOT', 0.08, 0, 'ANG', 0, 'ANG', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('VI', 'US Virgin Islands', 'Americas', 0.0, 'None', 0.06, 800, 'USD', 800, 'USD', false, 'US customs territory. Same de minimis as US mainland.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('FK', 'Falkland Islands', 'Americas', 0.0, 'None', 0.10, 0, 'FKP', 0, 'FKP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GL', 'Greenland', 'Americas', 0.0, 'None', 0.05, 0, 'DKK', 0, 'DKK', false, 'Not part of EU. Danish territory with separate customs.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GF', 'French Guiana', 'Americas', 0.0, 'None', 0.042, 150, 'EUR', 160, 'EUR', false, 'French overseas department. Exempt from EU VAT but EU customs.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GP', 'Guadeloupe', 'Americas', 0.085, 'TVA', 0.042, 150, 'EUR', 160, 'EUR', false, 'French overseas department. Reduced VAT rate.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MQ', 'Martinique', 'Americas', 0.085, 'TVA', 0.042, 150, 'EUR', 160, 'EUR', false, 'French overseas department. Reduced VAT rate.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PM', 'Saint Pierre and Miquelon', 'Americas', 0.0, 'None', 0.05, 0, 'EUR', 0, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BQ', 'Bonaire, Sint Eustatius and Saba', 'Americas', 0.08, 'ABB', 0.08, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MF', 'Saint Martin (French)', 'Americas', 0.0, 'None', 0.05, 0, 'EUR', 0, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BL', 'Saint Barthélemy', 'Americas', 0.0, 'None', 0.05, 0, 'EUR', 0, 'EUR', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('FO', 'Faroe Islands', 'Europe', 0.25, 'MVG', 0.05, 0, 'DKK', 0, 'DKK', false, 'Danish territory. Not part of EU.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GI', 'Gibraltar', 'Europe', 0.0, 'None', 0.05, 0, 'GIP', 0, 'GIP', false, 'British Overseas Territory. Not part of EU customs union.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GG', 'Guernsey', 'Europe', 0.0, 'None', 0.0, 0, 'GBP', 0, 'GBP', false, 'Crown dependency. No VAT, no customs duty on most goods.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('JE', 'Jersey', 'Europe', 0.05, 'GST', 0.0, 135, 'GBP', 170, 'GBP', false, 'Crown dependency. 5% GST since 2008.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IM', 'Isle of Man', 'Europe', 0.20, 'VAT', 0.04, 135, 'GBP', 170, 'GBP', false, 'Crown dependency. UK VAT and customs territory.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AX', 'Åland Islands', 'Europe', 0.0, 'None', 0.042, 150, 'EUR', 160, 'EUR', false, 'Finnish autonomy. EU customs but VAT-exempt for imports.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SJ', 'Svalbard and Jan Mayen', 'Europe', 0.0, 'None', 0.0, 0, 'NOK', 0, 'NOK', false, 'Norwegian territory. Tax-free zone, no customs duty.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CV', 'Cape Verde', 'Africa', 0.15, 'IVA', 0.10, 0, 'CVE', 0, 'CVE', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GM', 'Gambia', 'Africa', 0.15, 'VAT', 0.12, 0, 'GMD', 0, 'GMD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GW', 'Guinea-Bissau', 'Africa', 0.17, 'IVA', 0.12, 0, 'XOF', 0, 'XOF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CF', 'Central African Republic', 'Africa', 0.19, 'TVA', 0.15, 0, 'XAF', 0, 'XAF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('BI', 'Burundi', 'Africa', 0.18, 'TVA', 0.12, 0, 'BIF', 0, 'BIF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KM', 'Comoros', 'Africa', 0.10, 'TCA', 0.10, 0, 'KMF', 0, 'KMF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('ST', 'São Tomé and Príncipe', 'Africa', 0.15, 'IVA', 0.10, 0, 'STN', 0, 'STN', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GQ', 'Equatorial Guinea', 'Africa', 0.15, 'IVA', 0.15, 0, 'XAF', 0, 'XAF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('RE', 'Réunion', 'Africa', 0.085, 'TVA', 0.042, 150, 'EUR', 160, 'EUR', false, 'French overseas department. Reduced VAT. EU customs territory.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('YT', 'Mayotte', 'Africa', 0.0, 'None', 0.042, 150, 'EUR', 160, 'EUR', false, 'French overseas department. Exempt from EU VAT.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SH', 'Saint Helena', 'Africa', 0.0, 'None', 0.10, 0, 'SHP', 0, 'SHP', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('SB', 'Solomon Islands', 'Oceania', 0.10, 'GST', 0.10, 0, 'SBD', 0, 'SBD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NC', 'New Caledonia', 'Oceania', 0.11, 'TGC', 0.10, 0, 'XPF', 0, 'XPF', false, 'French territory. Not part of EU. Own customs/tax system.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PF', 'French Polynesia', 'Oceania', 0.16, 'TVA', 0.10, 0, 'XPF', 0, 'XPF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('GU', 'Guam', 'Oceania', 0.04, 'GRT', 0.05, 800, 'USD', 800, 'USD', false, 'US territory. 4% GRT (Gross Receipts Tax).', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('AS', 'American Samoa', 'Oceania', 0.0, 'None', 0.05, 0, 'USD', 0, 'USD', false, 'US territory. Not part of US customs territory.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MP', 'Northern Mariana Islands', 'Oceania', 0.0, 'None', 0.05, 800, 'USD', 800, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CK', 'Cook Islands', 'Oceania', 0.15, 'VAT', 0.08, 0, 'NZD', 0, 'NZD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KI', 'Kiribati', 'Oceania', 0.0, 'None', 0.10, 0, 'AUD', 0, 'AUD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('MH', 'Marshall Islands', 'Oceania', 0.0, 'None', 0.08, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('FM', 'Micronesia', 'Oceania', 0.0, 'None', 0.08, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('PW', 'Palau', 'Oceania', 0.0, 'None', 0.05, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NR', 'Nauru', 'Oceania', 0.0, 'None', 0.05, 0, 'AUD', 0, 'AUD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TV', 'Tuvalu', 'Oceania', 0.0, 'None', 0.08, 0, 'AUD', 0, 'AUD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NU', 'Niue', 'Oceania', 0.125, 'GST', 0.05, 0, 'NZD', 0, 'NZD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('WF', 'Wallis and Futuna', 'Oceania', 0.0, 'None', 0.05, 0, 'XPF', 0, 'XPF', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('TK', 'Tokelau', 'Oceania', 0.0, 'None', 0.05, 0, 'NZD', 0, 'NZD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('IO', 'British Indian Ocean Territory', 'Asia', 0.0, 'None', 0.0, 0, 'USD', 0, 'USD', false, NULL, true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CX', 'Christmas Island', 'Oceania', 0.10, 'GST', 0.05, 1000, 'AUD', 650, 'AUD', false, 'Australian territory. Same customs/GST as Australia.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('CC', 'Cocos (Keeling) Islands', 'Oceania', 0.10, 'GST', 0.05, 1000, 'AUD', 650, 'AUD', false, 'Australian territory. Same customs/GST as Australia.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('NF', 'Norfolk Island', 'Oceania', 0.10, 'GST', 0.05, 1000, 'AUD', 650, 'AUD', false, 'Australian territory. Same customs/GST as Australia.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

INSERT INTO country_profiles (country_code, country_name, region, vat_rate, vat_label, avg_duty_rate, de_minimis, de_minimis_currency, de_minimis_usd, currency, has_fta_with_china, notes, is_active, updated_by)
VALUES ('KP', 'North Korea', 'Asia', 0.0, 'None', 0.10, 0, 'KPW', 0, 'KPW', false, 'Subject to international sanctions. Trade heavily restricted.', true, 'cw38-migration')
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
  notes = COALESCE(EXCLUDED.notes, country_profiles.notes),
  updated_at = NOW(),
  updated_by = 'cw38-migration';

