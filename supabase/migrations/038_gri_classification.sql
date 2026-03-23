-- GRI Classification Engine tables
-- Run when DB is read-write

-- GRI classification cache
CREATE TABLE IF NOT EXISTS gri_classification_cache (
  id SERIAL PRIMARY KEY,
  product_name_hash VARCHAR(64) NOT NULL,
  destination_country VARCHAR(2) NOT NULL DEFAULT 'XX',
  hs_code VARCHAR(12) NOT NULL,
  hs_code_precision VARCHAR(4) NOT NULL,
  description TEXT,
  confidence NUMERIC(4,3),
  decision_path JSONB,
  gri_rules_applied JSONB,
  ai_call_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_name_hash, destination_country)
);
CREATE INDEX IF NOT EXISTS idx_gri_cache_lookup ON gri_classification_cache(product_name_hash, destination_country);

-- Conflict patterns table (DB version of JSON files)
CREATE TABLE IF NOT EXISTS gri_conflict_patterns (
  id SERIAL PRIMARY KEY,
  chapter INTEGER NOT NULL,
  pattern_id VARCHAR(20) NOT NULL UNIQUE,
  pattern_name VARCHAR(200) NOT NULL,
  conflict_headings TEXT[] NOT NULL,
  correct_heading VARCHAR(10) NOT NULL,
  decision_criteria JSONB NOT NULL,
  rejection_reason TEXT,
  exceptions JSONB,
  keywords TEXT[],
  gri_rule_applied VARCHAR(50),
  related_rulings TEXT[],
  source VARCHAR(50) DEFAULT 'manual',
  source_count JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gri_patterns_chapter ON gri_conflict_patterns(chapter);
CREATE INDEX IF NOT EXISTS idx_gri_patterns_keywords ON gri_conflict_patterns USING GIN(keywords);
