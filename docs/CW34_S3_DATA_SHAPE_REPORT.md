# CW34-S3 Data Shape Report — 실측 스키마 감사
**작성일**: 2026-04-14 KST
**작업 라벨**: CW34-S2.5 (pre-sprint audit)
**파일 수정**: 0건 (읽기 전용 감사)

---

## 섹션 1 — 파일별 실측 스키마 표

### 1-A. EBTI (EU BTI)

| 파일 | 포맷 | 라인 수 | 실제 레코드 수 | 컬럼/키 | HS 존재 | 언어 | 정제 상태 | 시작 레이어 |
|------|------|--------|--------------|---------|---------|------|----------|------------|
| `ebti_for_db.csv` (56MB) | CSV, UTF-8, CRLF | 529,665 | **231,727** | 7 cols | ✅ `hs6_code` + `hs_code` | 다국어 (en/de/fr/it/pl/hu) | ⚠️ 부분 정제 | **Bronze→Silver** |
| `ebti_rulings.csv` (248MB) | CSV, US-ASCII | 2,642,927 | ~231K (multiline) | 15 cols | ✅ `NOMENCLATURE_CODE` | 다국어 | ❌ Raw | Bronze |
| `ebti_full_export.zip` (60MB) | ZIP | — | — | — | — | — | 미확인 | — |

**`ebti_for_db.csv` 컬럼** (7개):
```
product_name, hs6_code, hs_code, confidence, source, country, ruling_ref
```

| 필드 | 포맷 | 비고 |
|------|------|------|
| `product_name` | 자유텍스트, 멀티라인(따옴표 인용) | 대문자 위주, 일부 잘림 (줄바꿈 내 truncation) |
| `hs6_code` | 6자리 숫자 (dot 없음) | 예: `732690`, `621040` |
| `hs_code` | 10자리+별표 패딩 | 예: `7326909890************` → 실 코드 10자리, 나머지 `*` |
| `confidence` | `1.0` (고정) | 전 레코드 동일 — 정보 가치 없음 |
| `source` | `eu_ebti` (고정) | |
| `country` | `EU` (고정) | 개별 발행국 미포함 (raw에는 있음) |
| `ruling_ref` | `GB112582301`, `IT-2003-0330M-131100` 등 | 발행국 코드 prefix 포함 |

**문제점**:
1. **`hs_code` 별표 패딩** — `7326909890************` → 숫자만 추출 필요 (정규식: `/^(\d{8,10})\*+$/`)
2. **CRLF 줄바꿈** — `^M` 존재, 정규화 필요
3. **멀티라인 product_name** — CSV 따옴표 인용이지만 단순 `cut`/`awk` 파싱 불가
4. **country가 전부 `EU`** — 개별 발행국 정보 손실 (`ruling_ref` prefix에서 복원 가능: `GB`, `IT`, `DE`, `FR` 등)
5. **언어 혼재** — 대부분 영어지만 이탈리아어, 독일어, 프랑스어 상품설명 존재
6. **날짜 정보 없음** — `for_db`에는 유효기간 컬럼 없음 (raw에는 `START_DATE_OF_VALIDITY`, `END_DATE_OF_VALIDITY` 있음, DD/MM/YYYY 포맷)

**`ebti_rulings.csv` 컬럼** (15개):
```
BTI_REFERENCE, ISSUING_COUNTRY, START_DATE_OF_VALIDITY, END_DATE_OF_VALIDITY,
NOMENCLATURE_CODE, CLASSIFICATION_JUSTIFICATION, STATUS, INVALIDATION_REASON,
INVALIDATION_JUSTIFICATION, LANGUAGE, PLACE_OF_ISSUE, DATE_OF_ISSUE,
NAME_AND_ADDRESS, DESCRIPTION_OF_GOODS, KEYWORDS
```

| 필드 | 포맷 | 비고 |
|------|------|------|
| `ISSUING_COUNTRY` | 2자리 ISO | DE, GB, FR 등 (EU 27+UK) |
| `START_DATE_OF_VALIDITY` | `DD/MM/YYYY` | 예: `11/02/2004` |
| `NOMENCLATURE_CODE` | 10자리+별표 패딩 | `for_db`와 동일 패턴 |
| `STATUS` | 대부분 빈값, 일부 `INVALID` (1,586건) | |
| `LANGUAGE` | `en`/`de`/`fr`/`pl`/`it` 등 | 대부분 빈값 |
| `DESCRIPTION_OF_GOODS` | 멀티라인 자유텍스트 | raw HTML 아닌 평문 |
| `KEYWORDS` | 쉼표 구분 키워드 | |

**EBTI 국가 분포** (raw 상위):
| 국가 | 건수 (10만 라인 샘플) |
|------|---------------------|
| DE | 2,542 |
| GB | 2,491 |
| FR | 1,868 |
| (기타 EU) | ... |

---

### 1-B. CBP CROSS (US Rulings)

| 파일 | 포맷 | 아이템 수 | 키 | HS 존재 | 시작 레이어 |
|------|------|---------|-----|---------|------------|
| `batches/*.json` (8파일, 191MB) | JSON array | **39,430** | 19 keys | ⚠️ `tariffs[]` (10% 채움) | Bronze |
| `search_batches/*.json` (29파일, 49MB) | JSON array | **180,684** | 7 keys | ⚠️ `tariffs[]` | Bronze |
| `cbp_cross_hs_mappings.csv` (6MB) | CSV | **23,612** | 9 cols | ✅ `hts_code` + `hs6_code` | **Silver** ✅ |
| `cbp_cross_search_mappings.csv` (16MB) | CSV | **120,572** | 9 cols | ✅ `hts_code` + `hs6_code` | **Silver** ✅ |
| `cbp_cross_combined_mappings.csv` (16MB) | CSV | **142,252** | 7 cols | ✅ `hts_code` + `hs6_code` | **Silver** ✅ |

**`batches/*.json` 키 목록** (19개):
```
categories, collection, commodityGrouping, id, isNafta, isRevokedByOperationalLaw,
isUsmca, modifiedBy, modifies, operationallyRevoked, relatedRulings, revokedBy,
revokes, rulingDate, rulingNumber, subject, tariffs, text, url
```

| 필드 | 포맷 | 비고 |
|------|------|------|
| `rulingNumber` | `H080001`, `N274515` 등 | |
| `rulingDate` | ISO-like `2009-10-14T02:00:00` | |
| `tariffs` | 배열 `["9305.91.3030"]` | **batch_001에서 5000건 중 504건만 tariff 있음 (10%)** |
| `text` | 전문 (plain text, CRLF) | |
| `collection` | `hq` (본부), `ny` (뉴욕) 등 | |
| `categories` | `Classification`, `Carriers` 등 | |
| `isUsmca` / `isNafta` | boolean | |

**`search_batches/*.json` 키 목록** (7개 — text/url 없는 경량 버전):
```
categories, collection, commodityGrouping, rulingDate, rulingNumber, subject, tariffs
```

**`cbp_cross_hs_mappings.csv` 컬럼** (9개):
```
product_name, description, hts_code, hs6_code, hs_chapter, ruling_number, ruling_date, source, all_tariffs
```

| 필드 | 포맷 | 비고 |
|------|------|------|
| `product_name` | 자유텍스트 | 예: `Frozen Beef` |
| `description` | ruling 본문 발췌 | |
| `hts_code` | dot 포함 `0202.20.5000` | 10자리 HTS |
| `hs6_code` | 6자리 `020220` (dot 없음) | |
| `hs_chapter` | 2자리 | |
| `all_tariffs` | pipe 구분 `0202.20.5000\|0202.20.8000` | 복수 분류 |
| `ruling_date` | ISO `2016-05-04T02:00:00` | |

**핵심 발견**: `cbp_cross_hs_mappings.csv` (23,612건) + `cbp_cross_search_mappings.csv` (120,572건)은 **이미 HS 매핑 완료된 Silver 수준 데이터**. raw batch에서 AI/수동으로 HS를 추출한 결과물.

---

### 1-C. Unified Rulings

| 파일 | 포맷 | 레코드 수 | 키 | HS 존재 | 시작 레이어 |
|------|------|---------|-----|---------|------------|
| `unified_rulings.jsonl` (243MB 추정) | JSONL, UTF-8 | **575,172** | 9 keys | ✅ `hs6` + `hts_code` | **Silver** ✅ |

**키 목록** (9개):
```
ruling_id, source, product_description, full_description, hs6, hts_code, chapter, material, processing
```

| 필드 | 포맷 | 비고 |
|------|------|------|
| `ruling_id` | `W968393`, `GB112582301` 등 | CROSS + EBTI 통합 |
| `source` | `cbp_cross` / `cbp_cross_search` / `eu_ebti_EU` | |
| `product_description` | 자유텍스트 | |
| `full_description` | 자유텍스트 (≈product_description) | |
| `hs6` | 5~6자리 `21069`, `210690` | ⚠️ 일부 5자리 (앞자리 0 누락?) |
| `hts_code` | dot 포함 `2106.90.9997` | CROSS만 존재, EBTI는 빈값 가능 |
| `chapter` | 2자리 `02` | |
| `material` | 빈값 많음 | |
| `processing` | 빈값 많음 | |

**소스 분포**:
| 소스 | 건수 | 비율 |
|------|------|------|
| `cbp_cross` | ~142,251 | 24.7% |
| `cbp_cross_search` | ~200,194 (143,445+56,749) | 34.8% |
| `eu_ebti_EU` | ~231,727 | 40.3% |
| **합계** | **575,172** | |

**HS6 null rate**: 0% (10,000건 샘플 기준 전부 존재)

---

### 1-D. AI4 Rulings (챕터별 분석 결과)

| 파일 | 건수 | 구조 |
|------|------|------|
| `ai4_rulings_ch09_spice.json` | 8 | 메타 + 챕터별 통계 |
| `ai4_rulings_ch40_rubber.json` | 8 | 동일 |
| `ai4_rulings_ch42_leather.json` | 8 | 동일 |
| `ai4_rulings_ch95_toy.json` | 8 | 동일 |

**구조**: 개별 ruling 아닌 **챕터별 분석 메타데이터** (title, boundary, cbp_count, ebti_count, cbp_by_chapter). 예:
```json
{
  "title": "Ch.42 가죽 + 귀금속",
  "boundary": "Ch.42 vs Ch.71",
  "cbp_count": 4117,
  "ebti_count": 0,
  "cbp_by_chapter": {"42": 3070, "71": 833, ...}
}
```
→ **Gold 레이어 입력이 아닌 분석 산출물**. 파이프라인에 직접 사용하지 않음.

---

## 섹션 2 — 통합 스키마 제안

### 기존 `unified_rulings.jsonl`이 이미 통합본

EBTI `for_db` (231,727) + CROSS `hs_mappings` (23,612) + CROSS `search_mappings` (120,572) + CROSS `combined_mappings` 일부 = **575,172건**으로 통합 완료.

### `customs_rulings` 테이블 제안 스키마

```sql
CREATE TABLE customs_rulings (
  id              BIGSERIAL PRIMARY KEY,
  ruling_id       TEXT NOT NULL UNIQUE,       -- "GB112582301", "N274515"
  source          TEXT NOT NULL,              -- "eu_ebti", "cbp_cross", "cbp_cross_search"
  country         TEXT,                       -- ISO2: "GB", "DE", "US" (EBTI: ruling_ref prefix에서 추출)
  product_name    TEXT NOT NULL,              -- product_description
  full_text       TEXT,                       -- 원문 (CROSS batch text, EBTI DESCRIPTION_OF_GOODS)
  hs6             TEXT,                       -- 6자리 HS (정규화: 앞자리 0 보존, 6자리 고정)
  hs_code         TEXT,                       -- 국가별 세번: HTS 10자리(US) / CN 10자리(EU)
  chapter         SMALLINT,                   -- HS 챕터 (01~99)
  ruling_date     DATE,                       -- 판정일
  valid_from      DATE,                       -- 유효기간 시작 (EBTI only)
  valid_to        DATE,                       -- 유효기간 종료 (EBTI only)
  status          TEXT DEFAULT 'active',      -- active / invalid / revoked
  language        TEXT DEFAULT 'en',          -- en, de, fr, it, pl, hu
  keywords        TEXT[],                     -- EBTI KEYWORDS 또는 AI 추출
  categories      TEXT,                       -- CROSS categories ("Classification" 등)
  collection      TEXT,                       -- CROSS collection ("hq", "ny")
  all_tariffs     TEXT[],                     -- CROSS 복수 분류
  material        TEXT,                       -- unified에서 가져옴
  processing      TEXT,                       -- unified에서 가져옴
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 핵심 인덱스
CREATE INDEX idx_rulings_hs6 ON customs_rulings(hs6);
CREATE INDEX idx_rulings_chapter ON customs_rulings(chapter);
CREATE INDEX idx_rulings_source ON customs_rulings(source);
CREATE INDEX idx_rulings_country ON customs_rulings(country);
CREATE INDEX idx_rulings_ruling_date ON customs_rulings(ruling_date);

-- Full-text search
CREATE INDEX idx_rulings_product_gin ON customs_rulings
  USING gin(to_tsvector('english', product_name));
```

---

## 섹션 3 — 파이프라인 시작점 판정

### 소스별 판정

| 소스 | 파일 | 판정 | 이유 |
|------|------|------|------|
| **EBTI `for_db`** | `ebti_for_db.csv` | ⚠️ **Bronze→Silver** | HS 별표 패딩, country 전부 "EU" (복원 필요), 날짜 없음, CRLF, 멀티라인 |
| **EBTI raw** | `ebti_rulings.csv` | ❌ **Bronze** | 15컬럼 raw, 멀티라인, STATUS/LANGUAGE 등 추가 필드 보유 |
| **CROSS batch** | `batches/*.json` | ❌ **Bronze** | full text 있지만 tariffs 10%만 채움 |
| **CROSS search** | `search_batches/*.json` | ❌ **Bronze** | text 없는 경량, tariffs 채움률 미확인 |
| **CROSS HS mappings** | `cbp_cross_hs_mappings.csv` | ✅ **Silver** | HS 매핑 완료, 구조 깔끔 |
| **CROSS search mappings** | `cbp_cross_search_mappings.csv` | ✅ **Silver** | HS 매핑 완료 |
| **Unified** | `unified_rulings.jsonl` | ✅ **Silver** | 통합 완료, HS6 100% 채움 |
| **AI4 rulings** | `ai4_rulings_ch*.json` | — | 분석 메타, 파이프라인 미사용 |

### 권장 전략

**1차: `unified_rulings.jsonl` 575,172건을 Gold로 직접 적재** (Silver→Gold)
- HS6 100% 존재, 소스 태깅 완료, JSONL이라 파싱 용이
- 정규화만 필요: hs6 5자리→6자리 패딩, country 추출

**2차: EBTI raw 보강** (Bronze→Silver→Gold)
- `ebti_rulings.csv`에서 `valid_from`, `valid_to`, `language`, `ISSUING_COUNTRY`, `keywords` 추출
- unified의 EBTI 레코드에 JOIN (key: `ruling_ref` ↔ `BTI_REFERENCE`)

**3차: CROSS batch full text 보강** (Bronze→Gold)
- `batches/*.json`에서 `text` (전문) 추출
- unified의 CROSS 레코드에 JOIN (key: `ruling_id` ↔ `rulingNumber`)

---

## 섹션 4 — CW34-S3 명령어 반영 사항

### Phase B (Bronze Ingestion)

```
필요 파일:
1. /Volumes/soulmaten/POTAL/7field_benchmark/unified_rulings.jsonl
   → 575,172 JSONL records
   → 키: ruling_id, source, product_description, full_description, hs6, hts_code, chapter, material, processing

2. /Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_rulings.csv
   → ~231K records (2,642,927 lines, multiline CSV)
   → 컬럼: BTI_REFERENCE, ISSUING_COUNTRY, START_DATE_OF_VALIDITY, END_DATE_OF_VALIDITY,
           NOMENCLATURE_CODE, CLASSIFICATION_JUSTIFICATION, STATUS, INVALIDATION_REASON,
           INVALIDATION_JUSTIFICATION, LANGUAGE, PLACE_OF_ISSUE, DATE_OF_ISSUE,
           NAME_AND_ADDRESS, DESCRIPTION_OF_GOODS, KEYWORDS
   → 날짜: DD/MM/YYYY
   → HS: 10자리+별표패딩

3. /Volumes/soulmaten/POTAL/regulations/us/cross_rulings/batches/*.json (8 files, 39,430 items)
   → JSON array, 19 keys per ruling
   → tariffs: array of strings like "9305.91.3030"
   → text: full ruling text (plain text with \r\r)
```

### Phase C (Silver 정규화)

```
EBTI 정규화 규칙:
  - hs_code: /^(\d{8,10})\*+$/ → 숫자만 추출
  - hs6: hs_code[:6]
  - country: ruling_ref에서 추출 — /^([A-Z]{2})/ (예: GB112582301 → GB, IT-2003-0330M → IT)
  - 날짜: DD/MM/YYYY → YYYY-MM-DD
  - CRLF → LF
  - product_name: 따옴표 내 멀티라인 → 단일라인 (줄바꿈 → 공백)

CROSS 정규화 규칙:
  - hts_code: dot 제거하여 10자리 숫자
  - hs6: hts_code[:6] (dot 없는 버전)
  - rulingDate: ISO truncate → YYYY-MM-DD
  - categories: trim whitespace

Unified 정규화 규칙:
  - hs6: 5자리인 경우 왼쪽 0 패딩 → 6자리
  - source 매핑: cbp_cross → US, cbp_cross_search → US, eu_ebti_EU → EU
```

### Phase D (Gold 통합)

```
통합 기준:
  - PRIMARY KEY: ruling_id (UNIQUE)
  - 중복 판별: ruling_id 기준 UPSERT
  - EBTI raw 보강: LEFT JOIN on ruling_id = BTI_REFERENCE
    → valid_from, valid_to, language, country(ISSUING_COUNTRY), keywords 추가
  - CROSS batch 보강: LEFT JOIN on ruling_id = rulingNumber
    → full_text(text), categories, collection, isUsmca, isNafta 추가
```

### Phase E (Platinum — DB 적재)

```
Supabase INSERT:
  - COPY 또는 batch INSERT (1,000건 단위)
  - 인덱스: hs6, chapter, source, country, ruling_date, product_name GIN
  - RLS: 읽기 공개 (SELECT), 쓰기 admin only
```

---

## 섹션 5 — 예상 Platinum Row 수

```
소스별:
  unified (EBTI+CROSS 통합)    575,172  ← 기본 베이스
  + EBTI raw 보강 (날짜/언어)   0 추가 rows (기존 레코드에 JOIN)
  + CROSS batch 보강 (전문)     0 추가 rows (기존 레코드에 JOIN)

중복 확인:
  - unified 내부 중복: ruling_id 기준 UNIQUE — 중복 제거 필요 여부 확인 필요
  - cbp_cross (142,251) + cbp_cross_search (200,194) = 342,445
    → combined_mappings (142,252) 와 수치 일치 → search는 별도 ruling
  - EBTI: 231,727건

예상 순 Platinum rows: ~575,000건 (중복 제거 후 약 550,000~575,000)
```

---

## 섹션 6 — Supabase 용량 예측

```
평균 row 크기 추정:
  - product_name (text): ~150 bytes
  - full_text (text, nullable): CROSS만 존재 시 ~4,000 bytes (39,430건), 나머지 null
  - 기타 필드: ~200 bytes
  - full_text 없는 row: ~350 bytes
  - full_text 있는 row: ~4,200 bytes

용량 계산:
  full_text 없는 rows: 535,742 × 350 bytes = ~187 MB
  full_text 있는 rows:  39,430 × 4,200 bytes = ~166 MB
  데이터 합계: ~353 MB

  인덱스 (btree × 5 + GIN × 1): ~150 MB (추정)
  TOAST (full_text 압축): 데이터 크기 ~30% 감소

  예상 총 크기: ~400-450 MB
  → Supabase Pro (8GB) 내 충분 ✅
  → 현재 DB 사용량과 합산해도 여유 (현재 ~1.5GB 추정)
```

---

## 섹션 7 — 핵심 발견 요약

1. **`unified_rulings.jsonl`이 이미 Silver 수준 통합본** — 575,172건, HS6 100% 채움. CW34-S3의 핵심 입력.

2. **EBTI `for_db`는 정보 손실 있음** — country 전부 "EU", 날짜 없음, HS 별표 패딩. EBTI raw에서 보강 필요.

3. **CROSS `cbp_cross_hs_mappings.csv`가 Gold 수준에 가장 가까움** — HS 매핑 완료, product_name + description 존재, 23,612건.

4. **CROSS batch `tariffs` 채움률 ~10%** — raw batch 39,430건 중 대부분 tariffs 빈 배열. HS 매핑은 별도 CSV에서 이미 완료됨.

5. **`ebti_hs2022.csv` 파일 없음** — 외장하드 인벤토리와 불일치. 3개 파일만 존재 (`for_db`, `rulings`, `full_export.zip`).

6. **Supabase에 ruling 관련 테이블 없음** — 완전 신규 생성 필요.

7. **AI4 rulings 파일은 챕터별 메타 분석** — 개별 ruling이 아닌 통계 요약이라 파이프라인 직접 입력 아님.

8. **전략**: unified JSONL을 베이스로 Silver→Gold 빠르게 진행, EBTI raw + CROSS batch에서 보강 필드 JOIN.
