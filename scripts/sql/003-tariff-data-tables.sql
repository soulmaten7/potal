-- ============================================================
-- POTAL B2B — Tariff Data Tables
-- Run in Supabase SQL Editor
--
-- 3 tables: country_profiles, duty_rates, fta_agreements
-- These replace hardcoded data in country-data.ts, duty-rates.ts, fta.ts
-- ============================================================

-- ─── 1. Country Tax Profiles ───────────────────────────────────
-- VAT/GST rates, de minimis thresholds, currency info per country

CREATE TABLE IF NOT EXISTS country_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Country identification
  country_code VARCHAR(2) NOT NULL UNIQUE,        -- ISO 3166-1 alpha-2
  country_name VARCHAR(100) NOT NULL,
  region VARCHAR(30) NOT NULL,                     -- 'North America', 'Europe', etc.

  -- Tax rates
  vat_rate DECIMAL(5,4) NOT NULL DEFAULT 0,       -- e.g. 0.2000 = 20%
  vat_label VARCHAR(20) NOT NULL DEFAULT 'VAT',   -- 'VAT', 'GST', 'Sales Tax', etc.
  avg_duty_rate DECIMAL(5,4) NOT NULL DEFAULT 0,  -- fallback avg duty rate

  -- De minimis (below this = duty-free)
  de_minimis DECIMAL(12,2) NOT NULL DEFAULT 0,    -- in local currency
  de_minimis_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  de_minimis_usd DECIMAL(12,2) NOT NULL DEFAULT 0, -- USD equivalent

  -- Currency
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- FTA flags (simplified)
  has_fta_with_china BOOLEAN NOT NULL DEFAULT FALSE,

  -- Notes
  notes TEXT,

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_country_profiles_code ON country_profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_country_profiles_region ON country_profiles(region);

-- ─── 2. Duty Rates (HS Chapter × Country) ─────────────────────
-- Specific duty rates by HS Code chapter for each destination country

CREATE TABLE IF NOT EXISTS duty_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- HS Code identification
  hs_chapter VARCHAR(2) NOT NULL,                 -- HS Chapter (first 2 digits)
  hs_code VARCHAR(10),                            -- Full HS Code (optional, for specific rates)

  -- Country
  destination_country VARCHAR(2) NOT NULL,        -- ISO code or 'EU' for all EU members

  -- Rates
  mfn_rate DECIMAL(5,4) NOT NULL DEFAULT 0,       -- MFN duty rate (0.1200 = 12%)

  -- Additional tariffs (e.g. Section 301)
  additional_tariff DECIMAL(5,4) DEFAULT 0,       -- extra tariff rate
  additional_tariff_origin VARCHAR(2),             -- applies when origin = this country
  additional_tariff_name VARCHAR(100),             -- e.g. 'Section 301'

  -- Anti-dumping (country pair specific)
  anti_dumping_rate DECIMAL(5,4) DEFAULT 0,
  anti_dumping_origin VARCHAR(2),

  -- Notes & source
  notes TEXT,
  source VARCHAR(200),                            -- 'US HTSUS', 'EU TARIC', etc.

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_date DATE,                            -- when this rate takes effect
  expiry_date DATE,                               -- when this rate expires (null = no expiry)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one rate per chapter+country (or chapter+code+country)
  UNIQUE(hs_chapter, hs_code, destination_country)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_duty_rates_chapter ON duty_rates(hs_chapter);
CREATE INDEX IF NOT EXISTS idx_duty_rates_country ON duty_rates(destination_country);
CREATE INDEX IF NOT EXISTS idx_duty_rates_lookup ON duty_rates(hs_chapter, destination_country);

-- ─── 3. FTA Agreements ─────────────────────────────────────────
-- Free Trade Agreements between countries

CREATE TABLE IF NOT EXISTS fta_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Agreement identification
  fta_code VARCHAR(20) NOT NULL UNIQUE,           -- 'USMCA', 'RCEP', 'CPTPP', etc.
  fta_name VARCHAR(200) NOT NULL,

  -- Preferential rate
  preferential_multiplier DECIMAL(3,2) NOT NULL DEFAULT 0, -- 0.00 = duty-free, 0.50 = 50% of MFN

  -- Excluded HS chapters (stored as JSON array)
  excluded_chapters JSONB DEFAULT '[]',            -- ['24', '87'] etc.

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_date DATE,

  -- Notes
  notes TEXT,

  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. FTA Members (junction table) ──────────────────────────
-- Which countries are members of which FTA

CREATE TABLE IF NOT EXISTS fta_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fta_code VARCHAR(20) NOT NULL REFERENCES fta_agreements(fta_code) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  joined_date DATE,

  UNIQUE(fta_code, country_code)
);

CREATE INDEX IF NOT EXISTS idx_fta_members_fta ON fta_members(fta_code);
CREATE INDEX IF NOT EXISTS idx_fta_members_country ON fta_members(country_code);

-- ─── 5. Section 301 / Additional Tariffs Table ────────────────
-- Separate table for additional tariffs that apply based on origin country

CREATE TABLE IF NOT EXISTS additional_tariffs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  tariff_name VARCHAR(100) NOT NULL,              -- 'Section 301 List 3', 'EU Carbon Border'
  origin_country VARCHAR(2) NOT NULL,             -- tariff applies to goods FROM this country
  destination_country VARCHAR(2) NOT NULL,        -- tariff applied BY this country
  hs_chapter VARCHAR(2) NOT NULL,                 -- affected HS chapter

  rate DECIMAL(5,4) NOT NULL,                     -- additional tariff rate

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_date DATE,
  expiry_date DATE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tariff_name, origin_country, destination_country, hs_chapter)
);

CREATE INDEX IF NOT EXISTS idx_additional_tariffs_lookup
  ON additional_tariffs(origin_country, destination_country, hs_chapter);

-- ─── 6. Data Update Log ───────────────────────────────────────
-- Track when tariff data was last updated (for transparency)

CREATE TABLE IF NOT EXISTS tariff_update_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,                    -- 'INSERT', 'UPDATE', 'DELETE', 'BULK_UPDATE'
  records_affected INT NOT NULL DEFAULT 0,
  description TEXT,
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS Policies ──────────────────────────────────────────────
-- These tables are READ by API (service role) and WRITE by admin only

ALTER TABLE country_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fta_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fta_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_update_log ENABLE ROW LEVEL SECURITY;

-- Service role can read all
CREATE POLICY "Service role read country_profiles" ON country_profiles
  FOR SELECT USING (TRUE);
CREATE POLICY "Service role read duty_rates" ON duty_rates
  FOR SELECT USING (TRUE);
CREATE POLICY "Service role read fta_agreements" ON fta_agreements
  FOR SELECT USING (TRUE);
CREATE POLICY "Service role read fta_members" ON fta_members
  FOR SELECT USING (TRUE);
CREATE POLICY "Service role read additional_tariffs" ON additional_tariffs
  FOR SELECT USING (TRUE);
CREATE POLICY "Service role read tariff_update_log" ON tariff_update_log
  FOR SELECT USING (TRUE);
