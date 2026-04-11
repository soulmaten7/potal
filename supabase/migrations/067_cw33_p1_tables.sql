-- Migration: 067_cw33_p1_tables.sql
-- Description: CW33 Sprint 6 — P1 external-API caches + specialized tax
-- Created: 2026-04-11 KST

-- ─── insurance_rate_tables ────────────────────
-- Cargo insurance rates by product category + route risk.
-- Primary source: IUMI (International Union of Marine Insurance) public stats
--                 + Lloyd's Market Association reports.
-- Existing POTAL default rates in insurance-calculator.ts are seeded here
-- with data_confidence='approximation' — commercial-grade rates must be
-- sourced from licensed providers.
CREATE TABLE IF NOT EXISTS insurance_rate_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'potal-default',
    category TEXT NOT NULL,               -- 'electronics' | 'textiles' | 'hazmat' | ...
    base_rate NUMERIC NOT NULL,           -- decimal (0.01 = 1%)
    high_risk_surcharge NUMERIC DEFAULT 0.005,
    sea_freight_surcharge NUMERIC DEFAULT 0.003,
    premium_threshold_usd NUMERIC,
    premium_surcharge NUMERIC,
    mandatory_countries TEXT[] DEFAULT '{}',
    high_risk_countries TEXT[] DEFAULT '{}',
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'approximation',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    effective_date DATE,
    UNIQUE (provider, category, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_irt_provider ON insurance_rate_tables(provider);
CREATE INDEX IF NOT EXISTS idx_irt_category ON insurance_rate_tables(category);

-- ─── carrier_rate_cache ───────────────────────
-- Snapshots of live carrier rates from DHL/FedEx/UPS/EasyPost.
CREATE TABLE IF NOT EXISTS carrier_rate_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier TEXT NOT NULL,                -- 'dhl_express' | 'fedex_intl' | 'ups_world' | 'easypost' | 'usps'
    service_level TEXT,                   -- 'express' | 'economy' | 'priority' | ...
    origin_country TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    weight_kg NUMERIC NOT NULL,
    dimensional_weight_kg NUMERIC,
    base_rate_usd NUMERIC NOT NULL,
    fuel_surcharge_pct NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    transit_days INTEGER,
    quoted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ,
    source_api TEXT NOT NULL,             -- 'dhl_express_api' | 'fedex_rate_api' | ...
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crc_lane ON carrier_rate_cache(carrier, origin_country, destination_country);
CREATE INDEX IF NOT EXISTS idx_crc_quoted ON carrier_rate_cache(quoted_at DESC);

-- ─── specialized_tax_rates ────────────────────
-- Country-specific specialized taxes (telecom, lodging, luxury, etc.)
CREATE TABLE IF NOT EXISTS specialized_tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    tax_type TEXT NOT NULL,                -- 'telecom' | 'lodging' | 'luxury' | 'excise' | ...
    tax_name TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    applicable_products TEXT[] DEFAULT '{}',
    applicable_hs_prefixes TEXT[] DEFAULT '{}',
    effective_date DATE,
    expires_at DATE,
    legal_citation TEXT NOT NULL,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_str_country ON specialized_tax_rates(country_code);
CREATE INDEX IF NOT EXISTS idx_str_type ON specialized_tax_rates(tax_type);

-- ─── data_source_health ──────────────────────
-- Operational status of external data sources used by CW33 code paths.
-- Used for dashboards + Telegram alerts.
CREATE TABLE IF NOT EXISTS data_source_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL UNIQUE,       -- 'ofac_sdn' | 'frankfurter_ecb' | 'dhl_rate_api' | ...
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL,             -- 'feed' | 'api' | 'static_file'
    last_successful_fetch TIMESTAMPTZ,
    last_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    status TEXT DEFAULT 'unknown',         -- 'healthy' | 'degraded' | 'failed' | 'unknown'
    expected_refresh_interval_hours INTEGER,
    source_citation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dsh_status ON data_source_health(status);

COMMENT ON TABLE insurance_rate_tables IS 'CW33-S6: Cargo insurance rates (POTAL default + commercial providers)';
COMMENT ON TABLE carrier_rate_cache IS 'CW33-S6: Live carrier rate quote cache (DHL/FedEx/UPS/EasyPost)';
COMMENT ON TABLE specialized_tax_rates IS 'CW33-S6: Country-specific specialized taxes (telecom/lodging/excise)';
COMMENT ON TABLE data_source_health IS 'CW33-S6: Operational health of external data feeds';
