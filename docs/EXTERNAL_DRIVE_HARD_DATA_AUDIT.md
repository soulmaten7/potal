# 외장하드 "까다로움" 카테고리 데이터 실측 검증 리포트
> 작성: 2026-04-14 KST | CW34-S2.5 pre-sprint audit

---

## 1. 카테고리별 상태 표

| 카테고리 | 외장하드 | Supabase | 난이도 | 예상 row |
|---------|---------|----------|--------|----------|
| WCO Explanatory Notes | ❌ 인덱스만 (97ch + 21sec) | ❌ 없음 | XL (유료 구독 필요) | — |
| unified_rulings.jsonl | ✅ 575,172건 (US+EU only) | ❌ 테이블 없음 | M (테이블 생성 + COPY) | 575K |
| EU EBTI raw | ✅ 2,642,927행 (15컬럼) | ❌ 테이블 없음 | L (247MB, 정제 필요) | 2.6M |
| EU EBTI for_db | ✅ 529,665행 (7컬럼, DB-ready) | ❌ 테이블 없음 | **S** (바로 COPY) | 530K |
| EU EBTI HS2022-mapped | ✅ 529,663행 (7컬럼) | ❌ 테이블 없음 | S (바로 COPY) | 530K |
| US CROSS full text | ✅ ~40,000건 (8 batch, 191MB) | ❌ 테이블 없음 | M (JSON 파싱) | 40K |
| US CBP combined mappings | ✅ 142,252행 (CSV) | ❌ 테이블 없음 | **S** (바로 COPY) | 142K |
| AI4 rulings (ch09/40/42/95) | ✅ 분석 파일 4개 | ❌ | — (분석용, seed 대상 아님) | — |
| 중국 세관 판례 | ❌ 없음 | ❌ | XL (수집 필요) | — |
| 일본 사전심사 사례 | ❌ 빈 폴더만 있음 | ❌ | XL (수집 필요) | — |
| US TRQ entries | ✅ 372건 | ❌ 확인 필요 (CW33에서 seed?) | S | 372 |

---

## 2. 즉시 이전 가능 파일 (난이도 S — 수정 없이 COPY)

| 파일 | 경로 | 행 수 | 컬럼 | 비고 |
|------|------|-------|------|------|
| **EU EBTI for_db** | `regulations/eu_ebti/ebti_for_db.csv` | 529,665 | product_name, hs6_code, hs_code, confidence, source, country, ruling_ref | DB-ready 정제 버전 |
| **US CBP mappings** | `cbp_cross_combined_mappings.csv` | 142,252 | product_name, hs6_code, hts_code, hs_chapter, ruling_number, source, description | CSV → COPY |
| **EU EBTI HS2022** | `hs_correlation/ebti_hs2022.csv` | 529,663 | product_name, original_hs6, converted_hs6, conversion_status, conversion_details, ruling_ref, source | HS 버전 매핑 |

**합계: ~1.2M rows, Supabase COPY 한 번이면 됨.**

---

## 3. 정제 필요 파일 (난이도 M — 파싱/변환 필요)

| 파일 | 경로 | 크기 | 작업 |
|------|------|------|------|
| **unified_rulings.jsonl** | `7field_benchmark/unified_rulings.jsonl` | 243MB, 575K lines | NDJSON → Supabase bulk insert (line-by-line stream) |
| **US CROSS full text** | `regulations/us/cross_rulings/batches/batch_*.json` | 191MB, ~40K rulings | JSON 배열 파싱, full ruling text 포함 (HQ/NY 판례 원문) |
| **EU EBTI raw** | `regulations/eu_ebti/ebti_rulings.csv` | 247MB, 2.6M rows | 15컬럼 full export (justification, keywords 등). for_db 버전 사용 권장 |

---

## 4. 실제로 없는 것 (수집 필요)

| 항목 | 상태 | 수집 난이도 | 비고 |
|------|------|-----------|------|
| **WCO Explanatory Notes** | 인덱스만 있음, 본문 없음 | XL | WCO 유료 구독 필요 (연 ~$1,000+) |
| **중국 세관 판례** | 없음 (consumption tax만 있음) | XL | 중국어 원문 + 영문 번역 필요, 공개 API 없음 |
| **일본 사전심사 사례** | 빈 폴더만 있음 | L | 일본 세관 사이트에서 크롤링 가능하지만 일본어 |
| **EU/JP/KR TRQ** | US만 372건 있음 | M | EU: TARIC API, JP: 관세율표에서 추출 |

---

## 5. CW34-S3 Data Warehouse Sprint 권장 범위

### 1순위: 즉시 이전 (난이도 S, 1일)
1. `ebti_for_db.csv` → `ebti_rulings` 테이블 (529K rows)
2. `cbp_cross_combined_mappings.csv` → `cbp_cross_mappings` 테이블 (142K rows)
3. `us_trq_entries.json` → 기존 `us_tariff_rate_quotas` 테이블 보충 확인

### 2순위: 정제 후 이전 (난이도 M, 2-3일)
4. `unified_rulings.jsonl` → `classification_rulings` 테이블 (575K rows)
5. `ebti_hs2022.csv` → `ebti_hs_mapping` 테이블 (530K rows, HS 버전 크로스 레퍼런스)

### 3순위: 후속 수집 (난이도 L/XL, CW34-S4+)
6. WCO Explanatory Notes (유료)
7. 일본 사전심사 (크롤링)
8. 중국 세관 판례 (미확보)
9. EU/JP/KR TRQ (API 수집)

---

## 6. 핵심 발견

### unified_rulings.jsonl 구조
- **575,172 rulings** (US CBP CROSS 343K + EU EBTI 232K)
- 필드: `ruling_id`, `source`, `product_description`, `full_description`, `hs6`, `hts_code`, `chapter`, `material`, `processing`
- `country` 필드 없음 — source 필드로 국가 유추 (cbp_cross = US, eu_ebti_EU = EU)
- `master_classification_engine.json`의 category_fallback 21,340 키워드가 이 데이터에서 추출된 것

### EU EBTI 3개 파일 관계
```
ebti_rulings.csv (2.6M rows, 15컬럼, raw)
  ↓ 정제/추출
ebti_for_db.csv (530K rows, 7컬럼, DB-ready)
  ↓ HS 버전 변환
ebti_hs2022.csv (530K rows, 7컬럼, HS2022 매핑)
```

### US CROSS 3개 레이어
```
regulations/us/cross_rulings/batches/ (8 batches, ~40K full text rulings)
  ↓ HS 매핑 추출
cbp_cross_combined_mappings.csv (142K product→HS 매핑)
  ↓ unified_rulings 통합
unified_rulings.jsonl (343K US entries)
```

### Supabase 현황: 판례 데이터 테이블 0개
migration 파일에 `ruling`, `ebti`, `cross_ruling`, `advance_ruling` 관련 테이블 정의 없음. 외장하드의 1.2M+ rulings 데이터가 **완전 orphaned 상태**.

---

## 7. Rule 12 원인 판정

| 데이터 | 원인 | 설명 |
|--------|------|------|
| EU EBTI 529K | **(c) 데이터 미사용** | `ebti_for_db.csv` DB-ready 파일이 이미 있으나 Supabase 테이블 미생성 |
| US CBP 142K | **(c) 데이터 미사용** | `cbp_cross_combined_mappings.csv` 정제 완료 상태이나 미연결 |
| unified_rulings 575K | **(c) 데이터 미사용** | 575K 통합 판례가 `master_classification_engine.json` 생성에만 사용되고 DB 미연결 |
| WCO EN | **(a) 데이터 부족** | 실제 본문 미보유, 유료 구독 필요 |
| 중국/일본 판례 | **(a) 데이터 부족** | 외장하드에 없음 |
