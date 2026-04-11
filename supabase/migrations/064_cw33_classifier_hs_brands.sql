-- Migration: 064_cw33_classifier_hs_brands.sql
-- Description: CW33 Sprint 3 — Classifier (HS database) + brand/marketplace origin + IOSS
-- Created: 2026-04-11 KST
-- Source: external drive v3 codified rules + HTSUS 2026 + brand-origins.ts

-- ─── hs_codes ────────────────────────────────────
-- Master HS code table (2-10 digits).
-- Source hierarchy:
--   1. WCO HS 2022 sections/chapters (regulations/international/wco/*.json)
--   2. US HTSUS 2026 rev4 (regulations/us/htsus/hts_2026_rev4.json)
--   3. v3 codified rules (7field_benchmark/codified_*.json)
CREATE TABLE IF NOT EXISTS hs_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code TEXT NOT NULL UNIQUE,       -- 2/4/6/8/10 digit (normalized, no dots)
    hs2 TEXT GENERATED ALWAYS AS (substring(hs_code, 1, 2)) STORED,
    hs4 TEXT GENERATED ALWAYS AS (substring(hs_code, 1, 4)) STORED,
    hs6 TEXT GENERATED ALWAYS AS (substring(hs_code, 1, 6)) STORED,
    description TEXT NOT NULL,
    level TEXT NOT NULL,                -- 'section' | 'chapter' | 'heading' | 'subheading' | 'national'
    section TEXT,                       -- WCO Section roman numeral (I-XXI)
    chapter TEXT,
    parent_code TEXT,
    indent INTEGER DEFAULT 0,
    hs_version TEXT DEFAULT '2022',
    superseded_by TEXT,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hs_chapter ON hs_codes(chapter);
CREATE INDEX IF NOT EXISTS idx_hs_hs4 ON hs_codes(hs4);
CREATE INDEX IF NOT EXISTS idx_hs_hs6 ON hs_codes(hs6);
CREATE INDEX IF NOT EXISTS idx_hs_level ON hs_codes(level);

-- ─── hs_keywords ────────────────────────────────
-- Keyword → HS code scoring hints.
-- Source: app/lib/cost-engine/hs-code/chapters/ch*.ts (keyword arrays)
CREATE TABLE IF NOT EXISTS hs_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    score NUMERIC NOT NULL DEFAULT 1.0,  -- higher = stronger match
    keyword_type TEXT,                    -- 'product' | 'material' | 'function' | 'brand'
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hsk_keyword ON hs_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_hsk_code ON hs_keywords(hs_code);

-- ─── brand_origins ──────────────────────────────
-- Brand name → primary manufacturing country.
-- Source: app/lib/data/brand-origins.ts (259 entries)
CREATE TABLE IF NOT EXISTS brand_origins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name TEXT NOT NULL UNIQUE,     -- lowercased, stripped
    country_code TEXT NOT NULL,          -- ISO 3166-1 alpha-2
    hq_country_code TEXT,                -- HQ (may differ from manufacturing)
    confidence NUMERIC NOT NULL DEFAULT 0.9,
    aliases TEXT[] DEFAULT '{}',
    category TEXT,                        -- electronics | apparel | cosmetics | …
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brand_origin ON brand_origins(brand_name);

-- ─── marketplace_origins ────────────────────────
-- E-commerce platform → default country of origin hint.
-- Source: app/lib/cost-engine/origin-detection.ts PLATFORM_ORIGINS
CREATE TABLE IF NOT EXISTS marketplace_origins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE,       -- lowercased platform name
    default_country_code TEXT NOT NULL,
    confidence NUMERIC NOT NULL DEFAULT 0.9,
    hq_country TEXT,
    domain_patterns TEXT[] DEFAULT '{}',
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mp_platform ON marketplace_origins(platform);

-- ─── eu_vat_regimes ─────────────────────────────
-- EU VAT special regimes (IOSS, OSS, Small Consignment relief).
-- Source: EU VAT Directive 2006/112/EC Article 369l (IOSS €150 threshold)
CREATE TABLE IF NOT EXISTS eu_vat_regimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_code TEXT NOT NULL UNIQUE,    -- 'IOSS' | 'OSS' | 'SCR' | 'MOSS'
    regime_name TEXT NOT NULL,
    threshold_eur NUMERIC,               -- e.g. 150 for IOSS
    threshold_description TEXT,
    applies_to_b2c BOOLEAN DEFAULT TRUE,
    applies_to_b2b BOOLEAN DEFAULT FALSE,
    registration_format TEXT,            -- e.g. 'IMxxxxxxxxxx' for IOSS
    effective_date DATE,
    expires_at DATE,
    legal_citation TEXT NOT NULL,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_euvr_code ON eu_vat_regimes(regime_code);

COMMENT ON TABLE hs_codes IS 'CW33-S3: Master HS code table (WCO 2022 + US HTSUS 2026)';
COMMENT ON TABLE hs_keywords IS 'CW33-S3: Keyword hints for HS classification (seeded from TS chapter files)';
COMMENT ON TABLE brand_origins IS 'CW33-S3: Brand → manufacturing country (259 brands)';
COMMENT ON TABLE marketplace_origins IS 'CW33-S3: E-commerce platform → default origin';
COMMENT ON TABLE eu_vat_regimes IS 'CW33-S3: EU VAT special regimes (IOSS, OSS, SCR)';
