# POTAL HS Code 매핑 DB 설계 (WDC 데이터 + 관세 데이터 연결)

> 작성일: 2026-03-08 (세션 35)
> 상태: 설계 문서 (실행 전)

---

## 1. 개요

### 1.1 목표
WDC(Web Data Commons) 350GB 상품 데이터의 **상품명 → HS Code 자동 매핑**을 위한 데이터베이스 설계.

### 1.2 현재 상황
- **WDC 데이터**: 1,899개 파트 파일, ~595억 상품 (원본), ~수억 개의 실제 상품
  - 각 상품: 상품명, 카테고리, 브랜드, 재질(material), GTIN, 설명, 소스 URL
  - 형식: N-Quad (schema.org, RDF 기반)
  - 저장 위치: `/Volumes/soulmaten/POTAL/wdc-products/raw/` (350GB)

- **기존 HS Code 데이터**:
  - WCO HS 2022: 5,371개 (6자리, 완전함)
  - MacMap NTLC: 537,894건 (8-12자리, 상세)
  - MacMap MIN rates: ~86.3M행 (44개국, 품목별 최저관세)
  - MacMap AGR rates: ~148M행 예정 (특혜관세)
  - 기존 테이블: `macmap_ntlc_rates`, `macmap_min_rates`, `macmap_agr_rates`, `duty_rates_live`

- **문제점**:
  - WDC 상품 ↔ HS Code 직접 매핑 테이블 없음
  - 상품명만으로는 정확도 낮음 (텍스트 변동성)
  - 재질, 브랜드, 카테고리 정보 활용 못 함

### 1.3 주요 과제
1. 350GB 데이터를 PostgreSQL에 어떻게 효율적으로 매핑할 것인가?
2. 텍스트 기반 매칭 정확도를 높일 방법?
3. 기존 관세 테이블들과 어떻게 조인할 것인가?

---

## 2. WDC 데이터 구조 분석

### 2.1 WDC Product 데이터 스키마
```
파일 형식: N-Quad (RDF)
추출 가능 필드:
- schema.org/name          → 상품명 (한 줄당 하나)
- schema.org/category      → 카테고리 (예: "Electronics", "Clothing")
- schema.org/brand         → 브랜드명
- schema.org/material      → 재질/소재 (매우 중요 for HS 매칭)
- schema.org/description   → 설명 (최대 300자)
- schema.org/sku           → SKU
- schema.org/gtin*         → GTIN/UPC/EAN (상품 식별)
- 소스 URL                 → 웹사이트 (출처)

예시 (제조):
{
  "name": "Cotton T-shirt XL",
  "category": "Apparel > Men's > Shirts",
  "brand": "Nike",
  "material": "100% Cotton",
  "gtin": "1234567890123",
  "sku": "TS-001-XL",
  "source": "https://example.com/product/ts-001"
}
```

### 2.2 데이터 규모
- **총 상품**: ~595억 (전체), 실제 매핑 대상: ~수억 개 (중복 제거 후)
- **다운로드 상태**: 245/1899 파트 (진행중)
- **추출 전략** (extract_products_detailed.py):
  - 각 파트 gz 파일에서 schema.org 속성만 필터
  - JSONL + CSV로 저장
  - 중복 제거 (`unique_product_names.txt`)

---

## 3. HS Code 매핑 방식 비교

### 3.1 현재 POTAL HS Code 시스템

| 테이블 | HS 레벨 | 행 수 | 용도 |
|--------|---------|-------|------|
| `countries` | N/A | 240 | 국가 기본 정보 |
| `hs6_wco_hs2022` | HS6 (6자) | 5,371 | WCO 기본 분류 |
| `macmap_ntlc_rates` | NTLC (8-12) | 537,894 | MFN 관세율 (국가별) |
| `macmap_min_rates` | NTLC (8-12) | ~86.3M | 최저관세 (국가-파트너별) |
| `macmap_agr_rates` | NTLC (8-12) | ~148M | 특혜관세 (협정별) |
| `duty_rates_live` | HS6 | ~2M | WITS/WTO 라이브 |

### 3.2 HS Code 매칭 전략 3가지

#### 전략 1: 텍스트 기반 (Fast but Less Accurate)
```
상품명 "100% cotton t-shirt"
→ Elasticsearch/PostgreSQL full-text search
→ HS6 "610910" (T-shirts of cotton, knitted)
문제: 변동성 높음, 다국어 처리 어려움
```

#### 전략 2: 속성 기반 (Medium Accuracy)
```
상품명 + 재질(material) + 카테고리 + 브랜드
→ Rule Engine (IF 재질="Cotton" AND 카테고리 LIKE "Apparel" THEN HS6="610%")
→ HS Code 매핑
문제: Rule 수가 수천 개 필요, 유지보수 어려움
```

#### 전략 3: LLM 기반 (Highest Accuracy but Slower)
```
상품명 + 재질 + 카테고리 + 설명
→ Claude/GPT-4o-mini
→ HS6 코드 추론 (+ 신뢰도)
문제: API 비용 높음, 속도 느림 (배치 처리만 가능)
```

#### **추천: 하이브리드 (전략 2 + 전략 3)**
1. **Tier 1 (95%+)**: 속성 기반 Rule (재질 있을 때) → 즉시 매핑
2. **Tier 2 (80%+)**: 텍스트 + 카테고리 → SQL 유사도 함수 (pg_trgm)
3. **Tier 3 (60%+)**: LLM 추론 (배치) → 정확도 검증 후 반영

---

## 4. DB 스키마 설계

### 4.1 핵심 테이블: `wdc_products_mapped`

**목표**: WDC 상품 메타데이터 + HS Code 매핑 결과 저장

```sql
-- ============================================================
-- Table: wdc_products_mapped
-- WDC 상품 + HS Code 매핑 (최종 버전)
-- ============================================================
CREATE TABLE wdc_products_mapped (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- WDC 소스 정보
  wdc_source_url TEXT UNIQUE NOT NULL,        -- 웹사이트 URL (중복 방지)
  wdc_gtin TEXT,                               -- GTIN/UPC/EAN (정규화된 형식)

  -- 상품 기본 정보
  product_name TEXT NOT NULL,                  -- 상품명
  product_category TEXT,                       -- 카테고리 (다국어 가능)
  product_brand TEXT,                          -- 브랜드
  product_material TEXT,                       -- 재질 (HS 매핑의 핵심!)
  product_description TEXT,                    -- 설명 (최대 300자)

  -- HS Code 매핑 결과
  hs6_code CHAR(6),                            -- HS 6자리 (WCO HS2022)
  hs_code_ntlc VARCHAR(12),                    -- HS 8-12자리 (MacMap NTLC용)

  -- 매핑 신뢰도 & 메타데이터
  mapping_confidence NUMERIC(4, 2)
    CHECK (mapping_confidence >= 0 AND mapping_confidence <= 1),  -- 0.0~1.0
  mapping_method TEXT
    CHECK (mapping_method IN ('rule_based', 'text_similarity', 'llm_inferred')),
  mapping_notes TEXT,                          -- 매핑 이유/주석

  -- 데이터 품질 지표
  has_material_info BOOLEAN DEFAULT FALSE,     -- 재질 정보 유무 (Tier 1 식별)
  has_category_info BOOLEAN DEFAULT FALSE,     -- 카테고리 유무
  has_gtin BOOLEAN DEFAULT FALSE,              -- GTIN 유무

  -- 타임스탬프
  wdc_extracted_at TIMESTAMP DEFAULT NOW(),    -- WDC에서 추출한 시간
  mapped_at TIMESTAMP,                         -- HS 매핑 시간
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 다국어 지원 (JSONB)
  product_info_localized JSONB,               -- {"ko": {...}, "en": {...}, "ja": {...}}

  -- 인덱스를 위한 생성 컬럼
  hs6_prefix TEXT GENERATED ALWAYS AS (SUBSTR(hs_code_ntlc, 1, 6)) STORED
);

-- HS Code 매핑 용 인덱스
CREATE INDEX idx_wdc_products_hs6
  ON wdc_products_mapped (hs6_code);
CREATE INDEX idx_wdc_products_hs_ntlc
  ON wdc_products_mapped (hs_code_ntlc);

-- 텍스트 검색 인덱스 (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_wdc_products_name_trgm
  ON wdc_products_mapped USING GIN (product_name gin_trgm_ops);

-- GTIN 검색 인덱스
CREATE INDEX idx_wdc_products_gtin
  ON wdc_products_mapped (wdc_gtin);

-- 신뢰도별 필터링 인덱스
CREATE INDEX idx_wdc_products_confidence
  ON wdc_products_mapped (mapping_confidence DESC, mapping_method)
  WHERE mapping_confidence >= 0.8;

-- 품질 지표 인덱스
CREATE INDEX idx_wdc_products_quality
  ON wdc_products_mapped (has_material_info, has_category_info, has_gtin);
```

### 4.2 보조 테이블 1: `wdc_hs_mapping_rules` (Rule Engine 저장)

**목표**: 재질/카테고리 기반 HS Code 매핑 규칙 저장

```sql
CREATE TABLE wdc_hs_mapping_rules (
  id BIGSERIAL PRIMARY KEY,

  -- Rule 정의
  rule_name TEXT NOT NULL UNIQUE,              -- 예: "cotton_apparel_rule"
  description TEXT,

  -- 매칭 조건 (모든 조건을 AND로 평가)
  material_pattern TEXT,                       -- LIKE 패턴 (예: "%cotton%")
  category_pattern TEXT,                       -- LIKE 패턴 (예: "%apparel%")
  brand_pattern TEXT,                          -- LIKE 패턴 (선택)

  -- 매핑 결과
  target_hs6 CHAR(6) NOT NULL,                 -- 결과 HS6
  target_hs_ntlc VARCHAR(12),                  -- 결과 HS (더 상세하면)
  confidence_score NUMERIC(4, 2),              -- 기본 신뢰도 (0.0~1.0)

  -- 메타데이터
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,                -- 낮을수록 높은 우선순위
  rule_source TEXT,                            -- 'manual', 'ml_derived', 'expert'

  -- 성능 추적
  match_count BIGINT DEFAULT 0,                -- 이 규칙으로 매칭된 상품 수
  success_count BIGINT DEFAULT 0,              -- 성공적으로 매칭된 수

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hs_rules_active_priority
  ON wdc_hs_mapping_rules (is_active, priority);
```

### 4.3 보조 테이블 2: `wdc_mapping_validation` (검증 결과)

**목표**: 매핑 정확도 검증 (LLM 또는 수동 리뷰)

```sql
CREATE TABLE wdc_mapping_validation (
  id BIGSERIAL PRIMARY KEY,

  -- 검증 대상
  wdc_product_id BIGINT NOT NULL REFERENCES wdc_products_mapped(id),
  original_mapping_hs6 CHAR(6),               -- 자동 매핑 결과

  -- 검증 결과
  validated_hs6 CHAR(6),                       -- 검증자의 HS Code (수정 가능)
  is_correct BOOLEAN,                          -- 원래 매핑이 맞는가?

  -- 검증 방식
  validation_method TEXT
    CHECK (validation_method IN ('manual_expert', 'llm_review', 'statistical')),
  reviewer_notes TEXT,

  -- 신뢰도 업데이트
  new_confidence NUMERIC(4, 2),               -- 검증 후 신뢰도

  validated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 관세 테이블 조인 뷰

**목표**: WDC 상품 → HS Code → 관세율 조인 (쿼리 단순화)

```sql
-- 높은 신뢰도(>0.8)의 WDC 상품만 관세 데이터와 조인
CREATE OR REPLACE VIEW wdc_products_with_duties AS
SELECT
  wp.id,
  wp.product_name,
  wp.product_material,
  wp.product_category,
  wp.hs6_code,
  wp.hs_code_ntlc,
  wp.mapping_confidence,
  wp.mapping_method,

  -- MacMap MIN rates 조인 (최저관세)
  mmr.reporter_iso2 AS dest_country_min,
  mmr.partner_iso2 AS origin_country,
  mmr.av_duty AS min_duty_rate,
  mmr.data_year AS min_data_year,

  -- MacMap NTLC rates 조인 (MFN)
  mnt.destination_country AS dest_country_mfn,
  mnt.mfn_rate,
  mnt.nav_duty_text,
  mnt.product_description AS hs_product_desc

FROM wdc_products_mapped wp
LEFT JOIN macmap_min_rates mmr
  ON wp.hs6_code = mmr.hs6
LEFT JOIN macmap_ntlc_rates mnt
  ON wp.hs6_code = mnt.hs6
WHERE wp.mapping_confidence >= 0.8;  -- 높은 신뢰도만
```

---

## 5. 쿼리 패턴 & 인덱스 전략

### 5.1 주요 쿼리 패턴

```sql
-- 패턴 1: 상품명 → HS Code (텍스트 검색)
SELECT * FROM wdc_products_mapped
WHERE product_name % 'cotton shirt'  -- pg_trgm 연산자
AND has_material_info = TRUE
AND mapping_confidence > 0.7
LIMIT 20;
-- 인덱스: idx_wdc_products_name_trgm

-- 패턴 2: 특정 HS6 코드의 모든 상품
SELECT * FROM wdc_products_mapped
WHERE hs6_code = '610910'
ORDER BY mapping_confidence DESC;
-- 인덱스: idx_wdc_products_hs6

-- 패턴 3: 국가별 관세 + 상품
SELECT
  wp.product_name,
  wp.hs6_code,
  mmr.av_duty,
  mmr.reporter_iso2
FROM wdc_products_mapped wp
JOIN macmap_min_rates mmr ON wp.hs6_code = mmr.hs6
WHERE mmr.reporter_iso2 = 'US'
AND wp.mapping_confidence > 0.8
ORDER BY wp.id;
-- 인덱스: idx_wdc_products_hs6 + idx_macmap_min_rates_reporter_hs6

-- 패턴 4: GTIN 기반 상품 조회 (대체 키)
SELECT * FROM wdc_products_mapped
WHERE wdc_gtin = '4571392815940';
-- 인덱스: idx_wdc_products_gtin

-- 패턴 5: 신뢰도별 매핑 품질 통계
SELECT
  mapping_method,
  COUNT(*) as count,
  AVG(mapping_confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE mapping_confidence >= 0.9) as high_confidence
FROM wdc_products_mapped
GROUP BY mapping_method;
-- 인덱스: idx_wdc_products_confidence
```

### 5.2 인덱스 전략 요약

| 인덱스 | 타입 | 우선순위 | 용도 |
|--------|------|---------|------|
| `idx_wdc_products_hs6` | B-tree | 1순위 | HS6 매핑 조인 |
| `idx_wdc_products_name_trgm` | GIN (pg_trgm) | 2순위 | 텍스트 검색 |
| `idx_wdc_products_hs_ntlc` | B-tree | 3순위 | NTLC 상세 조회 |
| `idx_wdc_products_gtin` | B-tree | 4순위 | GTIN 기반 조회 |
| `idx_wdc_products_confidence` | 복합 | 5순위 | 신뢰도 필터링 |
| `idx_wdc_products_quality` | 복합 | 6순위 | 품질 지표 필터링 |

---

## 6. 기존 관세 테이블과의 통합 방식

### 6.1 데이터 플로우

```
WDC 상품 (product_name + material + category)
        ↓
[Rule Engine (rules 테이블 참조)]
        ↓
HS6 코드 + 신뢰도 (wdc_products_mapped.hs6_code)
        ↓
[LEFT JOIN macmap_ntlc_rates (HS6 prefix)]
        ↓
MFN 관세율 + 제품 설명
        ↓
[LEFT JOIN macmap_min_rates (HS6 + 국가 + 파트너)]
        ↓
최종 관세율 계산 (MIN 우선, NTLC 폴백)
        ↓
WDC 상품 + 최종 HS + 관세율 조인뷰 (wdc_products_with_duties)
```

### 6.2 조인 로직 (SQL)

**macmap_min_rates 우선 (최저관세 = 실제 적용 관세)**:
```sql
SELECT
  wp.product_name,
  wp.hs6_code,
  COALESCE(mmr.av_duty, mnt.mfn_rate) AS final_duty_rate,
  CASE
    WHEN mmr.av_duty IS NOT NULL THEN 'macmap_min'
    WHEN mnt.mfn_rate IS NOT NULL THEN 'macmap_mfn'
    ELSE 'unknown'
  END AS duty_source
FROM wdc_products_mapped wp
LEFT JOIN macmap_min_rates mmr
  ON wp.hs6_code = mmr.hs6
LEFT JOIN macmap_ntlc_rates mnt
  ON wp.hs6_code = mnt.hs6;
```

### 6.3 AGR 테이블 통합 (향후)

AGR rates가 149M행 추가되면, **협정별 우대관세** 지원:

```sql
-- 우선순위: AGR (협정) > MIN > MFN
SELECT
  wp.product_name,
  wp.hs6_code,
  mar.agreement_id,
  mta.tariff_regime,
  COALESCE(mar.av_duty, mmr.av_duty, mnt.mfn_rate) AS duty_rate,
  CASE
    WHEN mar.av_duty IS NOT NULL THEN 'agr_preferential'
    WHEN mmr.av_duty IS NOT NULL THEN 'min_standard'
    WHEN mnt.mfn_rate IS NOT NULL THEN 'mfn'
    ELSE 'unknown'
  END AS duty_type
FROM wdc_products_mapped wp
LEFT JOIN macmap_agr_rates mar
  ON wp.hs6_code = mar.hs6 AND mar.reporter_iso2 = $1
LEFT JOIN macmap_trade_agreements mta
  ON mar.agreement_id = mta.agreement_id
LEFT JOIN macmap_min_rates mmr
  ON wp.hs6_code = mmr.hs6
LEFT JOIN macmap_ntlc_rates mnt
  ON wp.hs6_code = mnt.hs6;
```

---

## 7. 데이터 규모 추정

### 7.1 저장소 예상

```
wdc_products_mapped 테이블:
- 행 수: ~5억 개 (중복 제거 후 WDC 원본의 1/1000)
- 행 크기: ~500 bytes (product_name 100, material 50, category 80 등)
- 총 크기: 5억 × 500B = 250GB

인덱스 (x 6개):
- HS6, HS_NTLC, Name (trgm), GTIN: ~100GB
- 전체 인덱스: ~100GB

JSONB localized 데이터:
- ~50GB

예상 총 테이블 크기: ~400GB

Supabase 제한:
- 현재 Plan: 8GB 스토리지
- 필요 Plan: 1TB+ Pro/Enterprise
```

### 7.2 삽입 속도 추정

**배치 삽입 (5000행 per INSERT)**:
```
- CSV/JSONL 파싱: ~10ms/행
- 데이터베이스 삽입: ~100-500 rows/sec
- 인덱싱 오버헤드: ~50% 추가
- 최종 속도: ~50-100 rows/sec (인덱스 포함)

5억 행 삽입 시간:
- 이론: 5억 / 100 = 500만 초 ≈ 58 days (순차 처리)
- 병렬화 (10 processes): ~6 days
```

**권장 전략**:
1. 초기: 신뢰도 0.9+ 상품만 삽입 (~1% = 5M행, 쉬운 작업)
2. 다음: 0.7+ (~20% = 100M행)
3. 최종: 전체 (~500M행, 점진적 업데이트)

---

## 8. 매핑 정확도 개선 방안

### 8.1 Tier 별 신뢰도 기준

```
Tier 1 (Rule-based, 신뢰도 0.95+)
├─ 조건: has_material_info = TRUE
├─ 방법: wdc_hs_mapping_rules 매칭
├─ 예: 재질="100% cotton" + 카테고리="Apparel" → HS6="610910"
└─ 추정 비중: 20-30% (재질 정보 있는 상품들)

Tier 2 (Text-similarity, 신뢰도 0.7-0.94)
├─ 조건: has_category_info = TRUE
├─ 방법: 상품명 + 카테고리 → pg_trgm 유사도 + HS 검색
├─ 예: "cotton shirt" % HS 설명 문자열
└─ 추정 비중: 40-50%

Tier 3 (LLM-inferred, 신뢰도 0.5-0.69)
├─ 조건: has_gtin = TRUE (식별 가능성 높음)
├─ 방법: Claude/GPT-4o-mini 배치 추론
├─ 예: "Blue polo shirt, 100% cotton, Nike, GTIN=123..." → HS6="610910"
└─ 추정 비중: 10-20%

Unmatched (신뢰도 < 0.5)
└─ 비중: 10-20% (매핑 불가)
```

### 8.2 검증 루프

```
자동 매핑 (confidence < 0.8)
        ↓
샘플 선택 (random or stratified)
        ↓
[LLM 검증 또는 수동 리뷰]
        ↓
wdc_mapping_validation 테이블 저장
        ↓
신뢰도 스코어 조정
        ↓
규칙 엔진 개선 (Tier 1 규칙 추가)
```

---

## 9. 구현 로드맵

### Phase 1: 기반 (1주)
- [ ] `wdc_products_mapped` 테이블 생성
- [ ] `wdc_hs_mapping_rules` 테이블 생성 (10개 기본 규칙 포함)
- [ ] 인덱스 생성
- [ ] `extract_products_detailed.py` 실행 (WDC 추출)

### Phase 2: 매핑 (2주)
- [ ] Tier 1 (Rule-based) 매핑 스크립트 작성
  - 재질 + 카테고리 → HS6 (Python + SQL)
  - 신뢰도 0.95+로 설정
- [ ] Tier 2 (Text-similarity) 매핑
  - pg_trgm 조회 + HS 설명 유사도
  - 신뢰도 0.7-0.94
- [ ] 초기 배치 삽입 (신뢰도 0.9+만, ~5M행)

### Phase 3: 검증 & 개선 (2주)
- [ ] LLM 검증 배치 (샘플 1만 건)
- [ ] 규칙 개선 (feedback loop)
- [ ] Tier 3 (LLM) 매핑 전체 (배치)
- [ ] 정확도 리포트

### Phase 4: 통합 (1주)
- [ ] 기존 관세 테이블과의 조인 뷰 생성
- [ ] API 엔드포인트 작성 (상품 HS 조회)
- [ ] 성능 튜닝

---

## 10. SQL 초안: 핵심 쿼리

### 10.1 기본 매핑 쿼리 (Tier 1)

```sql
-- WDC 상품 → HS6 (Rule-based)
INSERT INTO wdc_products_mapped (
  product_name, product_material, product_category,
  hs6_code, mapping_method, mapping_confidence,
  has_material_info, has_category_info, mapped_at
)
SELECT
  wp.product_name,
  wp.product_material,
  wp.product_category,
  r.target_hs6,
  'rule_based'::TEXT,
  r.confidence_score,
  TRUE, TRUE,
  NOW()
FROM (
  SELECT * FROM wdc_products_raw
  WHERE product_material IS NOT NULL
  AND product_category IS NOT NULL
) wp
JOIN wdc_hs_mapping_rules r ON 1=1
WHERE (wp.product_material ILIKE r.material_pattern)
AND (wp.product_category ILIKE r.category_pattern)
AND r.is_active = TRUE
AND wp.product_name NOT IN (SELECT product_name FROM wdc_products_mapped)
ORDER BY r.priority
ON CONFLICT (wdc_source_url) DO UPDATE SET
  mapped_at = NOW();
```

### 10.2 신뢰도 통계

```sql
-- 매핑 품질 리포트
SELECT
  mapping_method,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE mapping_confidence >= 0.9) as high_confidence,
  COUNT(*) FILTER (WHERE mapping_confidence >= 0.8) as medium_confidence,
  COUNT(*) FILTER (WHERE mapping_confidence < 0.8) as low_confidence,
  ROUND(AVG(mapping_confidence)::NUMERIC, 3) as avg_confidence,
  COUNT(DISTINCT hs6_code) as unique_hs6
FROM wdc_products_mapped
GROUP BY mapping_method
ORDER BY total DESC;
```

### 10.3 관세율 조인

```sql
-- WDC 상품 + 국가별 관세율
SELECT
  wp.product_name,
  wp.hs6_code,
  wp.mapping_confidence,
  mmr.reporter_iso2,
  mmr.av_duty,
  mmr.data_year,
  mnt.mfn_rate,
  ROW_NUMBER() OVER (PARTITION BY wp.id, mmr.reporter_iso2 ORDER BY mmr.data_year DESC) as year_rank
FROM wdc_products_mapped wp
LEFT JOIN macmap_min_rates mmr ON wp.hs6_code = mmr.hs6
LEFT JOIN macmap_ntlc_rates mnt ON wp.hs6_code = mnt.hs6
WHERE wp.mapping_confidence >= 0.8
LIMIT 100000;
```

---

## 11. 주의사항

### 11.1 성능 최적화
- **대량 삽입 시**: `COPY` 명령어 + batch inserts (5000행)
- **인덱싱 비용**: 삽입 후 인덱스 재구성 (매일 야간)
- **메모리**: Supabase 스토리지 모니터링 필수

### 11.2 데이터 품질
- **중복 제거**: `UNIQUE(wdc_source_url)` 제약
- **NULL 처리**: material/category 선택적이므로 COALESCE 사용
- **문자 인코딩**: UTF-8 기본, 다국어 JSONB 저장

### 11.3 관계 설계
- `wdc_products_mapped` ← `wdc_mapping_validation` (1:N)
- `wdc_products_mapped` ← `macmap_min_rates` (역조인, HS6 기준)
- `wdc_products_mapped` ← `wdc_hs_mapping_rules` (적용, rule 중심이 아닌 결과 저장)

---

## 12. 다음 단계

1. **즉시**: 테이블 스키마 검토 및 미세 조정
2. **1주일**: WDC 추출 완료, 기본 규칙 10개 작성
3. **2주일**: Tier 1 매핑 실행 및 검증
4. **1개월**: 전체 매핑 완료, LLM 검증 루프

---

**작성자**: Claude Opus 4.6
**참고 파일**:
- `/sessions/quirky-bold-thompson/mnt/portal/scripts/extract_products_detailed.py` - WDC 추출 로직
- `/sessions/quirky-bold-thompson/mnt/portal/supabase/migrations/016_macmap_bulk_tables.sql` - MIN/AGR 테이블 정의
- `/sessions/quirky-bold-thompson/mnt/portal/import_min_remaining.py` - 대량 삽입 패턴 참고
