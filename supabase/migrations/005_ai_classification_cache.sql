-- ============================================================
-- Migration 005: AI Classification Cache + Live Tariff Data
-- ============================================================
-- Purpose: AI 분류 결과 캐싱, 외부 API 관세율 저장, FTA 데이터 저장
-- 이 테이블들이 채워질수록 AI 호출과 외부 API 호출이 줄어들어 비용 절감
-- ============================================================

-- 1. HS Code 분류 캐시 테이블
-- AI가 분류한 결과를 저장해서 같은 상품 재요청 시 AI 호출 없이 즉시 리턴
CREATE TABLE IF NOT EXISTS hs_classification_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 상품명 해시 (SHA256) → 빠른 조회용
  product_name_hash TEXT NOT NULL,
  -- 원본 상품명 (디버깅/분석용)
  product_name TEXT NOT NULL,
  -- 카테고리 힌트 (있으면 더 정확한 매칭)
  product_category TEXT,

  -- 분류 결과
  hs_code TEXT NOT NULL,              -- 최대 10자리 (예: '6404110000')
  hs_code_6 TEXT GENERATED ALWAYS AS (LEFT(hs_code, 6)) STORED,  -- 6자리 추출
  hs_chapter TEXT GENERATED ALWAYS AS (LEFT(hs_code, 2)) STORED, -- 챕터 추출
  description TEXT NOT NULL,           -- HS Code 설명
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.0,  -- 0.00 ~ 1.00

  -- 대안 코드들 (AI가 제안한 차선책들)
  alternatives JSONB DEFAULT '[]'::jsonb,

  -- 분류 출처
  source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('keyword', 'ai', 'external', 'manual')),

  -- 캐시 관리
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ,          -- NULL이면 유효, 값 있으면 무효화됨

  -- 조회 횟수 (인기 상품 분석용)
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  -- 유니크 제약: 같은 상품명+카테고리 조합은 1개만
  CONSTRAINT uq_product_hash_category UNIQUE (product_name_hash, COALESCE(product_category, '__none__'))
);

-- 인덱스: 해시로 빠른 조회
CREATE INDEX IF NOT EXISTS idx_cache_product_hash ON hs_classification_cache(product_name_hash);
-- 인덱스: 무효화되지 않은 것만 조회
CREATE INDEX IF NOT EXISTS idx_cache_valid ON hs_classification_cache(product_name_hash) WHERE invalidated_at IS NULL;
-- 인덱스: HS Code로 역방향 조회 (관세율 변경 시 영향받는 캐시 찾기)
CREATE INDEX IF NOT EXISTS idx_cache_hs_code ON hs_classification_cache(hs_code);
CREATE INDEX IF NOT EXISTS idx_cache_hs_chapter ON hs_classification_cache(hs_chapter);


-- 2. 실시간 관세율 테이블
-- 외부 API에서 가져온 관세율을 저장 → 같은 HS Code + 국가 재요청 시 API 호출 없이 리턴
CREATE TABLE IF NOT EXISTS duty_rates_live (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 관세율 키: HS Code + 목적지 국가 + 원산지 국가
  hs_code TEXT NOT NULL,               -- 6~10자리
  hs_chapter TEXT GENERATED ALWAYS AS (LEFT(hs_code, 2)) STORED,
  destination_country TEXT NOT NULL,    -- ISO 2자리 (예: 'US', 'KR')
  origin_country TEXT,                 -- 원산지 (NULL이면 MFN 기본 세율)

  -- 세율 정보
  mfn_rate NUMERIC(6,4) NOT NULL DEFAULT 0.0,      -- MFN 기본 세율 (0.1200 = 12%)
  additional_tariff NUMERIC(6,4) DEFAULT 0.0,       -- 추가 관세 (301조 등)
  anti_dumping_rate NUMERIC(6,4) DEFAULT 0.0,       -- 반덤핑 관세
  excise_rate NUMERIC(6,4) DEFAULT 0.0,             -- 특별소비세
  total_effective_rate NUMERIC(6,4) GENERATED ALWAYS AS (
    mfn_rate + COALESCE(additional_tariff, 0) + COALESCE(anti_dumping_rate, 0) + COALESCE(excise_rate, 0)
  ) STORED,

  -- 세율 메타데이터
  rate_type TEXT DEFAULT 'ad_valorem' CHECK (rate_type IN ('ad_valorem', 'specific', 'compound')),
  specific_rate_info TEXT,              -- specific/compound일 때 상세 정보
  notes TEXT,                           -- 추가 설명

  -- 데이터 출처
  source_api TEXT NOT NULL DEFAULT 'hardcoded' CHECK (source_api IN ('hardcoded', 'wto', 'dutify', 'customs', 'manual')),
  effective_date DATE,                 -- 세율 적용 시작일
  expiry_date DATE,                    -- 세율 만료일 (NULL이면 무기한)

  -- 캐시 관리
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ,

  -- 원본 API 응답 (디버깅용)
  api_response_raw JSONB,

  -- 유니크: 같은 HS Code + 국가 조합은 1개만
  CONSTRAINT uq_duty_rate UNIQUE (hs_code, destination_country, COALESCE(origin_country, '__mfn__'))
);

-- 인덱스: 주요 조회 패턴
CREATE INDEX IF NOT EXISTS idx_duty_hs_dest ON duty_rates_live(hs_code, destination_country);
CREATE INDEX IF NOT EXISTS idx_duty_chapter_dest ON duty_rates_live(hs_chapter, destination_country);
CREATE INDEX IF NOT EXISTS idx_duty_valid ON duty_rates_live(hs_code, destination_country) WHERE invalidated_at IS NULL;


-- 3. 실시간 FTA 세율 테이블
-- 외부 API에서 가져온 FTA 특혜 세율을 저장
CREATE TABLE IF NOT EXISTS fta_rates_live (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- FTA 키: 원산지 + 목적지 + HS 챕터
  origin_country TEXT NOT NULL,         -- ISO 2자리
  destination_country TEXT NOT NULL,    -- ISO 2자리
  hs_chapter TEXT,                     -- 2자리 챕터 (NULL이면 전체 적용)
  hs_code TEXT,                        -- 세부 코드 (NULL이면 챕터 전체)

  -- FTA 정보
  fta_name TEXT NOT NULL,              -- 예: 'USMCA', 'RCEP', 'KORUS'
  fta_code TEXT,                       -- 약어
  preferential_rate NUMERIC(6,4) NOT NULL,  -- 특혜 세율 (MFN 대비 비율, 0.0 = 면세)

  -- 조건
  requires_certificate_of_origin BOOLEAN DEFAULT true,
  rules_of_origin_notes TEXT,          -- 원산지 규정 요약

  -- 메타데이터
  source_api TEXT NOT NULL DEFAULT 'hardcoded' CHECK (source_api IN ('hardcoded', 'wto', 'dutify', 'customs', 'manual')),
  effective_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,

  -- 캐시 관리
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ,

  -- 원본 API 응답
  api_response_raw JSONB,

  -- 유니크: 같은 FTA + 국가 + 챕터 조합
  CONSTRAINT uq_fta_rate UNIQUE (origin_country, destination_country, fta_name, COALESCE(hs_chapter, '__all__'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_fta_countries ON fta_rates_live(origin_country, destination_country);
CREATE INDEX IF NOT EXISTS idx_fta_valid ON fta_rates_live(origin_country, destination_country) WHERE invalidated_at IS NULL AND is_active = true;


-- 4. 외부 API 호출 로그 (비용 추적 + 디버깅)
CREATE TABLE IF NOT EXISTS external_api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 어떤 API를 호출했는지
  api_provider TEXT NOT NULL,           -- 'claude', 'wto', 'dutify' 등
  api_endpoint TEXT,                    -- 호출한 엔드포인트

  -- 요청/응답
  request_payload JSONB,
  response_status INTEGER,              -- HTTP 상태 코드
  response_time_ms INTEGER,             -- 응답 시간
  response_payload JSONB,

  -- 비용 추적
  estimated_cost_usd NUMERIC(8,6),     -- 예상 비용 (AI: 토큰 기반, API: 콜당 과금)
  tokens_used INTEGER,                 -- AI API일 때 사용 토큰 수

  -- 에러 정보
  error_message TEXT,
  is_success BOOLEAN DEFAULT true,

  -- 어떤 셀러의 요청으로 발생했는지
  triggered_by_seller_id UUID REFERENCES sellers(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 비용 분석용
CREATE INDEX IF NOT EXISTS idx_api_log_provider ON external_api_logs(api_provider, created_at);
CREATE INDEX IF NOT EXISTS idx_api_log_cost ON external_api_logs(created_at) WHERE estimated_cost_usd > 0;


-- 5. 캐시 통계 뷰 (대시보드용)
CREATE OR REPLACE VIEW cache_stats AS
SELECT
  'hs_classification' AS cache_type,
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE invalidated_at IS NULL) AS valid_entries,
  COUNT(*) FILTER (WHERE invalidated_at IS NOT NULL) AS invalidated_entries,
  SUM(hit_count) AS total_hits,
  AVG(confidence) AS avg_confidence,
  MAX(updated_at) AS last_updated
FROM hs_classification_cache
UNION ALL
SELECT
  'duty_rates' AS cache_type,
  COUNT(*),
  COUNT(*) FILTER (WHERE invalidated_at IS NULL),
  COUNT(*) FILTER (WHERE invalidated_at IS NOT NULL),
  NULL,
  AVG(mfn_rate),
  MAX(updated_at)
FROM duty_rates_live
UNION ALL
SELECT
  'fta_rates' AS cache_type,
  COUNT(*),
  COUNT(*) FILTER (WHERE invalidated_at IS NULL),
  COUNT(*) FILTER (WHERE invalidated_at IS NOT NULL),
  NULL,
  AVG(preferential_rate),
  MAX(updated_at)
FROM fta_rates_live;


-- 6. RLS (Row Level Security) 정책
-- 캐시 테이블은 서비스 역할만 접근 가능 (셀러는 직접 접근 불가)
ALTER TABLE hs_classification_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_rates_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE fta_rates_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_api_logs ENABLE ROW LEVEL SECURITY;

-- 서비스 역할 정책 (API 서버에서만 접근)
CREATE POLICY "Service role full access" ON hs_classification_cache
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON duty_rates_live
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON fta_rates_live
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON external_api_logs
  FOR ALL USING (auth.role() = 'service_role');


-- 7. 자동 updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cache_updated_at
  BEFORE UPDATE ON hs_classification_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_duty_updated_at
  BEFORE UPDATE ON duty_rates_live
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fta_updated_at
  BEFORE UPDATE ON fta_rates_live
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
