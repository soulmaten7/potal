-- CW34-S3: Customs Rulings Data Warehouse — Platinum layer
-- Source: EBTI (EU BTI) 231K + CBP CROSS 343K = ~575K rulings
-- Architecture: Medallion (Bronze/Silver/Gold on external drive → Platinum in Supabase)

-- Main table
CREATE TABLE IF NOT EXISTS customs_rulings (
  id                  BIGSERIAL PRIMARY KEY,
  ruling_id           TEXT NOT NULL,
  source              TEXT NOT NULL,                -- eu_ebti | cbp_cross | cbp_cross_search
  issuing_country     TEXT,                         -- ISO2 of issuing authority (DE, GB, FR for EBTI; US for CROSS)
  jurisdiction        TEXT,                         -- jurisdiction where ruling applies (EU for EBTI, US for CROSS)
  product_name        TEXT NOT NULL,
  full_description    TEXT,
  full_text           TEXT,                         -- original ruling text (CROSS batch only, nullable)

  -- HS classification (primary purpose of rulings)
  hs6                 TEXT,                         -- 6-digit WCO harmonized code
  hs_code             TEXT,                         -- national tariff code (US HTS 10-digit, EU CN 10-digit)
  chapter             SMALLINT,
  all_tariffs         TEXT[],                       -- multiple classifications if present

  -- 10 Field enrichment (keyword dictionary matching, not LLM)
  material            TEXT,                         -- e.g. cotton, leather, steel
  material_composition JSONB,                       -- e.g. {"cotton": 85, "polyester": 15}
  product_form        TEXT,                         -- e.g. knitted, woven, molded
  intended_use        TEXT,                         -- e.g. clothing, industrial, medical

  -- Conditional rules (category 4-B: "if cotton>=50% then 10%")
  conditional_rules   JSONB,                        -- DSL for runtime evaluation
  duty_rate_ad_valorem    NUMERIC(8,4),             -- conditional outcome only, null for general
  duty_per_unit_amount    NUMERIC(12,4),            -- conditional outcome only
  duty_per_unit_currency  TEXT,                     -- ISO currency code
  duty_per_unit_uom       TEXT,                     -- unit of measure (kg, piece, liter)

  -- Ruling metadata
  ruling_date         DATE,
  valid_from          DATE,                         -- EBTI only
  valid_to            DATE,                         -- EBTI only
  status              TEXT DEFAULT 'active',        -- active | invalid | revoked | superseded | legacy
  language            TEXT DEFAULT 'en',
  keywords            TEXT[],
  categories          TEXT,                         -- CROSS: Classification, Carriers, etc.
  collection          TEXT,                         -- CROSS: hq, ny, etc.
  is_usmca            BOOLEAN DEFAULT FALSE,
  is_nafta            BOOLEAN DEFAULT FALSE,

  -- Quality tracking
  confidence_score    NUMERIC(3,2) DEFAULT 1.00,   -- 0.00-1.00, reduced when fields missing
  needs_manual_review BOOLEAN DEFAULT FALSE,
  pipeline_version    TEXT DEFAULT 'cw34-s3-v1',

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT uq_ruling UNIQUE (source, ruling_id)
);

-- Performance indexes
CREATE INDEX idx_cr_hs6 ON customs_rulings (hs6);
CREATE INDEX idx_cr_hs_code ON customs_rulings (hs_code);
CREATE INDEX idx_cr_chapter ON customs_rulings (chapter);
CREATE INDEX idx_cr_source ON customs_rulings (source);
CREATE INDEX idx_cr_jurisdiction ON customs_rulings (jurisdiction);
CREATE INDEX idx_cr_issuing_country ON customs_rulings (issuing_country);
CREATE INDEX idx_cr_ruling_date ON customs_rulings (ruling_date);
CREATE INDEX idx_cr_status ON customs_rulings (status) WHERE status = 'active';
CREATE INDEX idx_cr_material ON customs_rulings (material) WHERE material IS NOT NULL;
CREATE INDEX idx_cr_product_form ON customs_rulings (product_form) WHERE product_form IS NOT NULL;
CREATE INDEX idx_cr_needs_review ON customs_rulings (needs_manual_review) WHERE needs_manual_review = TRUE;

-- Composite index for primary query pattern: hs_code + jurisdiction
CREATE INDEX idx_cr_hs_jurisdiction ON customs_rulings (hs_code, jurisdiction) WHERE status = 'active';

-- Full-text search on product_name
CREATE INDEX idx_cr_product_gin ON customs_rulings USING gin(to_tsvector('english', product_name));

-- Staging table (identical schema, used for atomic swap during data loads)
CREATE TABLE IF NOT EXISTS customs_rulings_staging (LIKE customs_rulings INCLUDING ALL);

-- RLS: read-only public access, write restricted to service role
ALTER TABLE customs_rulings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_rulings_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON customs_rulings
  FOR SELECT USING (true);

CREATE POLICY "Service role write access" ON customs_rulings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role staging access" ON customs_rulings_staging
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE customs_rulings IS 'CW34-S3 Medallion Platinum: 575K+ customs classification rulings from EBTI (EU) and CBP CROSS (US). Enriched with 10-field keyword matching.';
COMMENT ON COLUMN customs_rulings.conditional_rules IS 'Category 4-B: conditional duty rules as JSONB DSL. Evaluated at runtime by conditional-evaluator.ts. Example: {"conditions":[{"field":"material_composition.cotton","op":">=","value":50}],"then":{"ad_valorem":10},"else":{"ad_valorem":15}}';
COMMENT ON COLUMN customs_rulings.duty_rate_ad_valorem IS 'Conditional outcome only. General duty rates are resolved at runtime via duty_rates_live/macmap tables. NULL means no conditional rate in this ruling.';
