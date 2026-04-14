# COMMAND: CW37-S4 — Screening Endpoints (Sanctions + ECCN)

**작성일**: 2026-04-14 KST
**작업 라벨**: CW37-S4
**담당 터미널**: 터미널2
**예상 소요**: 2~3시간
**선행조건**: CW37-S3 UI 리뉴얼 완료

**목적**: `screen-parties` (47K sanctions DB) + `eccn-lookup` (BIS Commerce Control List) 두 개의 Screening endpoint 구현. 둘 다 별도 input domain (사람/회사 이름 / 기술 키워드) 이라 Compute endpoint 에서 흡수 불가.

---

## Endpoint 1: `/api/v1/screen-parties`

### 기능
거래처 (바이어 / 공급사) 가 글로벌 거래제한 명단에 있는지 검색.

### 데이터 소스
- **47,926 sanctions entries** (CW33-S4 완료):
  - OFAC SDN: 18,718
  - BIS Entity List: 2,585
  - UK Sanctions: 19,761
  - UN Sanctions: 1,002
  - EU Sanctions: 5,860
- 일일 cron 업데이트 (CW34-S3-F)

### Parameters
```json
{
  "name": "Huawei Technologies",        // 필수
  "country": "CN",                       // 옵션 (필터)
  "type": "company",                     // 옵션: "company" | "individual" | "vessel" | "aircraft"
  "threshold": 0.8,                      // 옵션: fuzzy match 최소 점수 (기본 0.8)
  "sources": ["OFAC", "BIS", "EU"]       // 옵션: 특정 소스만
}
```

### Response
```json
{
  "matches": [
    {
      "name": "Huawei Technologies Co., Ltd.",
      "matchScore": 0.95,
      "type": "company",
      "source": "BIS Entity List",
      "dateListed": "2019-05-15",
      "country": "CN",
      "restrictions": "License required",
      "details": {
        "addresses": ["...",  "..."],
        "aliases": ["HUAWEI"],
        "programs": ["China-related"]
      }
    }
  ],
  "totalMatches": 3,
  "queriedAt": "2026-04-14T15:30:00Z",
  "dataLastUpdated": "2026-04-14T06:00:00Z",
  "sourceCoverage": {
    "OFAC_SDN": 18718,
    "BIS_Entity": 2585,
    "UK_Sanctions": 19761,
    "UN_Sanctions": 1002,
    "EU_Sanctions": 5860
  },
  "disclaimer": "For informational use only. Verify with official sources."
}
```

### 구현
파일: `app/api/v1/screen-parties/route.ts`
- Supabase DB `sanctioned_entities` 테이블 조회 (이미 47K rows)
- Fuzzy match: PostgreSQL `similarity()` 또는 Node-side `string-similarity`
- `matchScore` 계산 (0~1)
- threshold 미만 제외
- 소스별 분포 메타데이터 포함

---

## Endpoint 2: `/api/v1/eccn-lookup`

### 기능
기술 키워드 또는 상품 description 으로 ECCN (Export Control Classification Number) 검색. 미국 BIS Commerce Control List 기반.

### 데이터 소스
- **BIS Commerce Control List (CCL)** — 공개 데이터
- **다운로드 필요**: https://www.bis.doc.gov/index.php/regulations/commerce-control-list-ccl
- 약 2,000~3,000 ECCN 항목
- 업데이트: 분기 1회 (BIS 공식)

### Parameters
```json
{
  "keyword": "encryption",              // 필수: 검색 키워드
  "category": "Cat5_Part2",              // 옵션: "Cat1" ~ "Cat9" (10 카테고리)
  "productDescription": "256-bit AES",   // 옵션: 상세 description
  "country": "CN"                        // 옵션: 수출 대상국 (License 요건 계산)
}
```

### Response
```json
{
  "matches": [
    {
      "eccn": "5A002.a",
      "description": "Encryption commodities...",
      "category": "Cat 5 Part 2 — Info Security",
      "controlReason": ["NS", "AT", "EI"],
      "controlReasonExplanation": {
        "NS": "National Security",
        "AT": "Anti-Terrorism",
        "EI": "Encryption Item"
      },
      "licenseRequired": {
        "country_CN": true,
        "country_RU": true,
        "country_KR": false
      },
      "exceptions": ["ENC", "TSU"],
      "exceptionExplanation": {
        "ENC": "Encryption commodities and software"
      }
    }
  ],
  "totalMatches": 5,
  "queriedAt": "2026-04-14T15:30:00Z",
  "dataLastUpdated": "2025-12-15T00:00:00Z",
  "disclaimer": "For informational use only. Final ECCN determination requires BIS CCATS or attorney review."
}
```

### 구현
1. **데이터 import** (Phase 1):
   - BIS CCL XML/PDF 다운로드
   - Parser 작성 (Python 또는 Node)
   - Supabase 에 `eccn_entries` 테이블 신설:
     ```sql
     CREATE TABLE eccn_entries (
       id BIGSERIAL PRIMARY KEY,
       eccn TEXT NOT NULL UNIQUE,
       category TEXT,
       description TEXT,
       control_reasons TEXT[],
       license_required JSONB,
       exceptions TEXT[],
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now()
     );
     CREATE INDEX idx_eccn_category ON eccn_entries (category);
     CREATE INDEX idx_eccn_description_fts ON eccn_entries USING gin(to_tsvector('english', description));
     ```
   - 초기 데이터 seed (~2000~3000 rows)

2. **API route** (Phase 2):
   - 파일: `app/api/v1/eccn-lookup/route.ts`
   - keyword → Full-text search (`to_tsvector` / `to_tsquery`)
   - category 필터
   - country → `license_required[country]` lookup

3. **Cron 업데이트** (Phase 3, optional):
   - BIS 공식 CCL 분기 1회 업데이트 감지
   - 자동 re-import
   - `_stats.json` 에 last update 기록

---

## Phase 별 작업

### Phase 1: `/api/v1/screen-parties` 구현 (1시간)
- 파일: `app/api/v1/screen-parties/route.ts`
- `sanctioned_entities` 테이블 조회 (47K rows 이미 있음)
- Fuzzy matching (threshold 파라미터)
- Response 포맷 (위 예시 참조)
- `disclaimer` 필드 포함

### Phase 2: BIS CCL 데이터 import (1시간)
- 외장하드 또는 BIS 공식 다운로드
- Parser 작성
- Supabase migration `069_cw37_eccn_entries.sql`:
  ```sql
  CREATE TABLE eccn_entries (...);
  ```
- 초기 seed
- 실측 row 수 보고

### Phase 3: `/api/v1/eccn-lookup` 구현 (30분)
- 파일: `app/api/v1/eccn-lookup/route.ts`
- Full-text search
- category 필터
- Response 포맷
- `disclaimer` 필드 포함

### Phase 4: Testing (30분)
파일: `scripts/verify-cw37-s4-screening.mjs`

테스트 5 케이스:
1. screen-parties "Huawei Technologies" → BIS Entity List 매칭
2. screen-parties "John Smith" (일반 이름) → 여러 개 매칭 가능
3. screen-parties "Unknown Company XYZ" → 0 매칭
4. eccn-lookup "encryption" → 5A002.a 등 매칭
5. eccn-lookup "GPS" → 6A008 등 매칭

### Phase 5: UI 통합 (30분)
- CW37-S3 에서 만든 `components/workspace/endpoints/ScreenPartiesEndpoint.tsx`
- CW37-S3 에서 만든 `components/workspace/endpoints/EccnLookupEndpoint.tsx`
- Parameters UI 연결
- Result 표시

### Phase 6: Regression + Commit
- 모든 verify 테스트 green
- 빌드 475/475
- Commit message:
  ```
  feat(cw37-s4): Screening endpoints — sanctions + ECCN lookup
  
  - /api/v1/screen-parties: fuzzy search across 47K sanctions entries
  - /api/v1/eccn-lookup: BIS CCL full-text search (~2500 entries)
  - Migration 069: eccn_entries table
  - verify-cw37-s4-screening.mjs 5/5 green
  - Disclaimer included in all responses
  ```

---

## 원칙

- **Disclaimer 필수**: 모든 response 에 `disclaimer` 필드
- **Backward compat**: 기존 기능 안 깨지게
- **데이터 신선도 표시**: `dataLastUpdated` 필드 필수
- **출처 명시**: 각 match 에 `source` 필드 필수
- **Fuzzy match 투명**: `matchScore` 노출

---

## 완료 기준

- [ ] `/api/v1/screen-parties` 작동 (47K DB 연결)
- [ ] `/api/v1/eccn-lookup` 작동 (BIS CCL ~2500 entries seed)
- [ ] Migration 069 eccn_entries 적용
- [ ] verify-cw37-s4-screening 5/5 green
- [ ] Regression 전부 green
- [ ] UI 에서 테스트 가능 (ScreenPartiesEndpoint + EccnLookupEndpoint)
- [ ] Commit + push + 문서

완료 후 CW37-S5 (Guides 페이지) 시작.
