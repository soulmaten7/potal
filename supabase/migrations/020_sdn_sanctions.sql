-- ===== 020: OFAC SDN + Sanctions List DB 테이블 =====
-- 하드코딩 65개 → DB 기반 실시간 제재 데이터로 전환
-- OFAC SDN XML 파싱 결과 저장용
-- =====

-- 제재 엔트리 메인 테이블
CREATE TABLE IF NOT EXISTS sanctions_entries (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,                -- OFAC_SDN, OFAC_CONS, BIS_ENTITY, EU_SANCTIONS, UN_SANCTIONS, UK_SANCTIONS
  source_id TEXT,                      -- 원본 리스트의 고유 ID (SDN uid 등)
  entity_type TEXT NOT NULL DEFAULT 'entity', -- individual, entity, vessel, aircraft
  name TEXT NOT NULL,                  -- 정식 이름
  country TEXT,                        -- ISO2 국가코드
  programs TEXT[],                     -- 지정 프로그램 (IRAN, RUSSIA-EO14024 등)
  remarks TEXT,                        -- 비고
  sdn_type TEXT,                       -- SDN 타입 (Individual, Entity, Vessel 등)
  title TEXT,                          -- 직함/직위
  call_sign TEXT,                      -- 선박/항공기 호출부호
  tonnage TEXT,                        -- 선박 톤수
  grt TEXT,                            -- Gross Registered Tonnage
  vessel_flag TEXT,                    -- 선박 국적
  vessel_type TEXT,                    -- 선박 종류
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

-- 별칭 테이블 (AKA, FKA, DBA 등)
CREATE TABLE IF NOT EXISTS sanctions_aliases (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES sanctions_entries(id) ON DELETE CASCADE,
  alias_type TEXT,                     -- a.k.a., f.k.a., n.k.a.
  alias_name TEXT NOT NULL,
  is_weak BOOLEAN DEFAULT false        -- weak alias 여부 (SDN 기준)
);

-- 주소 테이블
CREATE TABLE IF NOT EXISTS sanctions_addresses (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES sanctions_entries(id) ON DELETE CASCADE,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT                         -- ISO2
);

-- ID 문서 테이블 (여권, 사업자 등록 등)
CREATE TABLE IF NOT EXISTS sanctions_ids (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES sanctions_entries(id) ON DELETE CASCADE,
  id_type TEXT,                        -- Passport, Tax ID, Registration Number 등
  id_number TEXT,
  id_country TEXT,                     -- 발급국
  issue_date TEXT,
  expiration_date TEXT
);

-- 데이터 로드 메타 (마지막 업데이트 추적)
CREATE TABLE IF NOT EXISTS sanctions_load_meta (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL UNIQUE,
  last_loaded_at TIMESTAMPTZ,
  record_count INT,
  publish_date TEXT,                   -- 원본 데이터 발행일
  file_hash TEXT                       -- 파일 변경 감지용
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sanctions_entries_source ON sanctions_entries(source);
CREATE INDEX IF NOT EXISTS idx_sanctions_entries_name ON sanctions_entries USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_sanctions_entries_country ON sanctions_entries(country);
CREATE INDEX IF NOT EXISTS idx_sanctions_entries_active ON sanctions_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_sanctions_aliases_entry ON sanctions_aliases(entry_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_aliases_name ON sanctions_aliases USING gin(to_tsvector('english', alias_name));
CREATE INDEX IF NOT EXISTS idx_sanctions_ids_number ON sanctions_ids(id_number);

-- pg_trgm 유사도 검색용 인덱스 (fuzzy matching 성능)
CREATE INDEX IF NOT EXISTS idx_sanctions_entries_name_trgm ON sanctions_entries USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sanctions_aliases_name_trgm ON sanctions_aliases USING gin(alias_name gin_trgm_ops);

-- pg_trgm 유사도 검색 함수 (DB-backed screening용)
CREATE OR REPLACE FUNCTION search_sanctions_fuzzy(
  search_name TEXT,
  min_similarity FLOAT DEFAULT 0.3,
  source_filter TEXT[] DEFAULT ARRAY['OFAC_SDN'],
  max_results INT DEFAULT 10
)
RETURNS TABLE(
  entry_id BIGINT,
  source TEXT,
  matched_name TEXT,
  similarity FLOAT,
  entity_type TEXT,
  country TEXT,
  programs TEXT[],
  remarks TEXT,
  is_alias BOOLEAN
) AS $$
BEGIN
  -- Search main names
  RETURN QUERY
  SELECT
    e.id AS entry_id,
    e.source,
    e.name AS matched_name,
    similarity(upper(e.name), upper(search_name))::FLOAT AS similarity,
    e.entity_type,
    e.country,
    e.programs,
    e.remarks,
    false AS is_alias
  FROM sanctions_entries e
  WHERE e.source = ANY(source_filter)
    AND e.is_active = true
    AND similarity(upper(e.name), upper(search_name)) >= min_similarity
  UNION ALL
  -- Search aliases
  SELECT
    e.id AS entry_id,
    e.source,
    a.alias_name AS matched_name,
    similarity(upper(a.alias_name), upper(search_name))::FLOAT AS similarity,
    e.entity_type,
    e.country,
    e.programs,
    e.remarks,
    true AS is_alias
  FROM sanctions_aliases a
  JOIN sanctions_entries e ON e.id = a.entry_id
  WHERE e.source = ANY(source_filter)
    AND e.is_active = true
    AND similarity(upper(a.alias_name), upper(search_name)) >= min_similarity
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
