-- ============================================================
-- 018: HS Code 매핑 테이블 (WDC 상품명 → HS Code)
-- 3-Tier 매핑: Rule-based → Text-similarity → LLM
-- ============================================================

-- 1. WDC 상품 데이터 (원본)
CREATE TABLE IF NOT EXISTS wdc_products (
  id BIGSERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  brand TEXT,
  category TEXT,
  price_amount NUMERIC(15,2),
  price_currency TEXT DEFAULT 'USD',
  source_file TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HS Code 매핑 결과
CREATE TABLE IF NOT EXISTS hs_code_mappings (
  id BIGSERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_category TEXT,
  hs_code_6 TEXT NOT NULL,           -- 6자리 HS code
  hs_code_4 TEXT,                     -- 4자리 (heading)
  hs_code_2 TEXT,                     -- 2자리 (chapter)
  confidence NUMERIC(3,2) DEFAULT 0,  -- 0.00~1.00
  mapping_method TEXT NOT NULL,       -- 'rule', 'text_similarity', 'llm', 'manual'
  mapping_source TEXT,                -- 어떤 규칙/모델이 매핑했는지
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 키워드 → HS Code 규칙 테이블 (Rule-based, Tier 1)
CREATE TABLE IF NOT EXISTS hs_keyword_rules (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  hs_code_6 TEXT NOT NULL,
  priority INTEGER DEFAULT 0,         -- 높을수록 우선
  is_exact_match BOOLEAN DEFAULT false,
  category TEXT,                       -- 제한 조건 (카테고리 일치 시만 적용)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wdc_products_domain ON wdc_products(domain);
CREATE INDEX IF NOT EXISTS idx_wdc_products_category ON wdc_products(category);
CREATE INDEX IF NOT EXISTS idx_hs_mappings_product_name ON hs_code_mappings USING gin(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_hs_mappings_hs_code ON hs_code_mappings(hs_code_6);
CREATE INDEX IF NOT EXISTS idx_hs_mappings_method ON hs_code_mappings(mapping_method);
CREATE INDEX IF NOT EXISTS idx_hs_keyword_rules_keyword ON hs_keyword_rules USING gin(to_tsvector('english', keyword));

-- RLS 비활성 (내부 데이터)
ALTER TABLE wdc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_code_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_keyword_rules ENABLE ROW LEVEL SECURITY;
