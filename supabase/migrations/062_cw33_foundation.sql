-- Migration: 062_cw33_foundation.sql
-- Description: CW33 Sprint 1 foundation tables — fta_product_rules, hs_classification_overrides
-- Created: 2026-04-11 KST
-- Principle: "No fake hardcoding. Real data codification only."

-- ─── fta_product_rules ──────────────────────────────
-- Stores FTA Rules of Origin at chapter/heading level.
-- Source: tlc_data/rules_of_origin/ (KORUS/USMCA/RCEP/CPTPP/EU-UK TCA PSR JSONs)
CREATE TABLE IF NOT EXISTS fta_product_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fta_code TEXT NOT NULL REFERENCES fta_agreements(fta_code),
    hs_scope TEXT NOT NULL,              -- e.g. '01-05', '8703', '6109.10'
    scope_level TEXT NOT NULL,           -- 'chapter' | 'heading' | 'subheading'
    rule_type TEXT,                      -- 'CTH' | 'CTSH' | 'CC' | 'RVC' | 'MIXED' | 'WO'
    rule_text TEXT NOT NULL,             -- full rule description
    rvc_percent NUMERIC,                 -- e.g. 50 for 'RVC 50%'
    rvc_method TEXT,                     -- 'net_cost' | 'transaction_value' | null
    de_minimis_percent NUMERIC,          -- de minimis non-originating content %
    cumulation_type TEXT,                -- 'bilateral' | 'diagonal' | 'full' | null
    source_citation TEXT,                -- e.g. 'USMCA Chapter 4 Annex 4-B'
    data_confidence TEXT DEFAULT 'official',  -- 'official' | 'secondary' | 'approximation'
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fpr_fta ON fta_product_rules(fta_code);
CREATE INDEX IF NOT EXISTS idx_fpr_hs_scope ON fta_product_rules(hs_scope);
CREATE INDEX IF NOT EXISTS idx_fpr_scope_level ON fta_product_rules(scope_level);

-- ─── hs_classification_overrides ────────────────────
-- Deterministic regex → HS code mappings.
-- Source: CW32 deterministicOverride() in ai-classifier-wrapper.ts (being DB-ified)
-- Runs BEFORE DB cache lookup in classifier.
-- Only hits for products whose name matches pattern_regex.
CREATE TABLE IF NOT EXISTS hs_classification_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    priority INTEGER NOT NULL DEFAULT 100,   -- lower = runs first
    pattern_regex TEXT NOT NULL,              -- JavaScript regex (case-insensitive)
    pattern_description TEXT NOT NULL,        -- human readable ("primary lithium battery")
    hs_code TEXT NOT NULL,                    -- resolved HS code (e.g. '850650')
    description TEXT NOT NULL,                -- HS description
    confidence NUMERIC NOT NULL DEFAULT 0.95, -- override confidence
    reason TEXT,                              -- why this override exists (e.g. "CW32 HS 8506 vs 8507 disambiguation")
    source_citation TEXT,                     -- e.g. 'HS 2022 heading 8506'
    data_confidence TEXT DEFAULT 'official',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hco_priority ON hs_classification_overrides(priority) WHERE active;
CREATE INDEX IF NOT EXISTS idx_hco_active ON hs_classification_overrides(active);

-- ─── Comments ───────────────────────────────────────
COMMENT ON TABLE fta_product_rules IS 'CW33: FTA product-specific rules of origin (seeded from tlc_data/rules_of_origin/)';
COMMENT ON TABLE hs_classification_overrides IS 'CW33: Deterministic HS classification overrides (replaces CW32 deterministicOverride() regex in code)';
COMMENT ON COLUMN hs_classification_overrides.priority IS 'Lower number runs first. Critical safety overrides should be <50.';
COMMENT ON COLUMN hs_classification_overrides.pattern_regex IS 'JavaScript regex syntax. Must be valid in JS RegExp constructor.';
