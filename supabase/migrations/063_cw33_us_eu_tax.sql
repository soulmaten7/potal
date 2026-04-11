-- Migration: 063_cw33_us_eu_tax.sql
-- Description: CW33 Sprint 2 — US/EU tax + tariff tables
-- Created: 2026-04-11 KST
-- Source: /Volumes/soulmaten/POTAL/tlc_data/duty_rate/ + tlc_data/vat_gst/
--         + regulations/us/htsus/hts_2026_rev4.json
--         + regulations/us/sales_tax/us_state_sales_tax_2024.json

-- ─── us_additional_tariffs ─────────────────────────
-- US Section 301 / 232 / IEEPA additional tariffs.
-- Source: tlc_data/duty_rate/section_{301,232,ieepa}_hts.csv (2026-03-18)
CREATE TABLE IF NOT EXISTS us_additional_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program TEXT NOT NULL,               -- 'sec301_list1' | 'sec301_list2' | ... | 'sec232_steel' | 'sec232_al' | 'ieepa_cn' | 'ieepa_reciprocal'
    hs_prefix TEXT NOT NULL,             -- e.g. '8541' or '84'
    rate NUMERIC NOT NULL,               -- decimal (0.25 = 25%)
    origin_countries TEXT[] NOT NULL,    -- applicable origins (e.g. ['CN'] for 301, ['*'] for 232 global)
    exempt_countries TEXT[] DEFAULT '{}',
    exclusion_number TEXT,               -- e.g. 'USTR-2020-0007'
    product_description TEXT,
    effective_date DATE,
    expires_at DATE,
    legal_citation TEXT NOT NULL,        -- 'USTR 83 FR 28710 (June 20, 2018)' etc.
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uat_program ON us_additional_tariffs(program);
CREATE INDEX IF NOT EXISTS idx_uat_hs ON us_additional_tariffs(hs_prefix);
CREATE INDEX IF NOT EXISTS idx_uat_active ON us_additional_tariffs(active);

-- ─── us_tariff_rate_quotas ─────────────────────────
-- US TRQ in-quota vs over-quota rates.
-- Source: tlc_data/duty_rate/us_trq_entries.json (2026-03-18)
CREATE TABLE IF NOT EXISTS us_tariff_rate_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs10 TEXT NOT NULL,                  -- 10-digit HTS code
    description TEXT NOT NULL,
    quota_year INTEGER NOT NULL,
    in_quota_rate TEXT NOT NULL,         -- e.g. '4.4¢/kg' or '0%'
    in_quota_rate_ad_valorem NUMERIC,    -- decimal if ad valorem
    over_quota_rate TEXT NOT NULL,
    over_quota_rate_ad_valorem NUMERIC,
    annual_quota_tons NUMERIC,
    quota_consumed_pct NUMERIC,
    preferential_country TEXT,           -- e.g. 'CA' for USMCA sugar quota
    effective_date DATE,
    expires_at DATE,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trq_hs10 ON us_tariff_rate_quotas(hs10);
CREATE INDEX IF NOT EXISTS idx_trq_year ON us_tariff_rate_quotas(quota_year);

-- ─── eu_reduced_vat_rates ─────────────────────────
-- EU 27 member states reduced VAT rates at chapter level.
-- Source: tlc_data/vat_gst/eu_27_vat_rates.csv + eu_remaining_14_vat_rates.json
CREATE TABLE IF NOT EXISTS eu_reduced_vat_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,          -- ISO 3166-1 alpha-2 (EU member)
    country_name TEXT NOT NULL,
    standard_rate NUMERIC NOT NULL,      -- e.g. 0.20 for 20%
    reduced_rate_1 NUMERIC,
    reduced_rate_2 NUMERIC,
    super_reduced_rate NUMERIC,
    parking_rate NUMERIC,
    zero_rated_categories TEXT[] DEFAULT '{}',
    effective_date DATE,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (country_code, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_eurv_country ON eu_reduced_vat_rates(country_code);

-- ─── eu_seasonal_tariffs ─────────────────────────
-- EU seasonal tariff adjustments (fruits, vegetables, fish).
-- Source: tlc_data/duty_rate/eu_seasonal_tariffs.json
CREATE TABLE IF NOT EXISTS eu_seasonal_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_subheading TEXT NOT NULL,
    product_name TEXT NOT NULL,
    higher_months INTEGER[] NOT NULL,    -- month numbers 1-12
    lower_months INTEGER[] NOT NULL,
    higher_rate NUMERIC,                 -- decimal
    lower_rate NUMERIC,
    effective_year INTEGER NOT NULL DEFAULT 2026,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (hs_subheading, effective_year)
);

CREATE INDEX IF NOT EXISTS idx_est_hs ON eu_seasonal_tariffs(hs_subheading);

-- ─── us_state_sales_tax ─────────────────────────
-- US state + DC sales tax with economic nexus thresholds.
-- Source: regulations/us/sales_tax/us_state_sales_tax_2024.json
--         (will be re-scraped for 2026 in CW33-S2b)
CREATE TABLE IF NOT EXISTS us_state_sales_tax (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code TEXT NOT NULL,            -- 'AL', 'AK', ..., 'DC'
    state_name TEXT NOT NULL,
    combined_avg_rate NUMERIC,           -- avg state+local rate
    state_rate NUMERIC,
    max_local_rate NUMERIC,
    nexus_sales_threshold_usd NUMERIC,   -- e.g. 100000 for most states
    nexus_transactions_threshold INTEGER,
    marketplace_facilitator_law BOOLEAN DEFAULT TRUE,
    post_wayfair BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (state_code, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_usst_code ON us_state_sales_tax(state_code);

-- ─── price_break_rules ─────────────────────────
-- HTSUS "valued over/under $X" price break rules.
-- Source: regulations/us/htsus/hts_2026_rev4.json (extracted in CW33-S2)
CREATE TABLE IF NOT EXISTS price_break_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code TEXT NOT NULL,
    threshold_usd NUMERIC NOT NULL,
    threshold_unit TEXT NOT NULL,        -- 'per_kg' | 'per_unit' | 'per_pair' | 'per_dozen'
    operator TEXT NOT NULL,              -- 'over' | 'under'
    above_rate TEXT,                     -- Post-break rate (original HTS string)
    below_rate TEXT,
    above_rate_ad_valorem NUMERIC,
    below_rate_ad_valorem NUMERIC,
    effective_date DATE,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pbr_hs ON price_break_rules(hs_code);

-- ─── Comments ─────────────────────────
COMMENT ON TABLE us_additional_tariffs IS 'CW33-S2: Section 301/232/IEEPA US additional tariffs';
COMMENT ON TABLE us_tariff_rate_quotas IS 'CW33-S2: US TRQ in/over quota rates';
COMMENT ON TABLE eu_reduced_vat_rates IS 'CW33-S2: EU VAT standard + reduced rates per member state';
COMMENT ON TABLE eu_seasonal_tariffs IS 'CW33-S2: EU seasonal tariff adjustments (fruit, veg, fish)';
COMMENT ON TABLE us_state_sales_tax IS 'CW33-S2: US state + DC sales tax + economic nexus thresholds (post-Wayfair)';
COMMENT ON TABLE price_break_rules IS 'CW33-S2: HTSUS price-break rules (valued over/under $X/kg)';
