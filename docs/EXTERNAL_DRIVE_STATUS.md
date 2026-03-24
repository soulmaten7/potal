# 외장하드 (/Volumes/soulmaten/POTAL/) 진행 상황 요약
> 마지막 업데이트: 2026-03-19 22:00 KST (테스트 16 완료)
> 이 파일은 Cowork(Claude Desktop)이 외장하드 내용을 파악할 수 있도록 정리한 것입니다.
> 외장하드 총 용량: ~894GB (WDC 상품 데이터 302GB 포함)

---

## 1. v3 HS Code 분류 엔진 — 테스트 이력 (15개 테스트 완료)

### 📍 현재 상태
- **v3 파이프라인 Step 0~4 구현 완료** (TypeScript, npm run build 성공)
- **Section 100% + Chapter 100%** 달성 (20건 깨끗한 데이터 기준)
- **Heading 60% + 6-digit 25%** (keyword overlap 한계 → 구조화된 매칭 필요)
- **AI 호출 0회** — 592개 Notes 규칙 + 7,446개 HS description 전부 코드화
- **코드 위치**: `app/lib/cost-engine/gri-classifier/steps/v3/`

### 핵심 테스트 결과 (V3_TEST_LOG.md에서 발췌)

| # | 테스트명 | Section | Chapter | Heading | 6-digit | 비고 |
|---|---------|---------|---------|---------|---------|------|
| 1 | CBP 495건 | 42% | 34% | - | - | 데이터 품질 문제 |
| 6 | **클린 20건 최종** ⭐ | **100%** | **100%** | - | - | Step 2 구조 검증 완료 |
| 7 | 필드 빼기 | - | - | - | - | material = CRITICAL |
| 8 | Step 0-4 전체 | 100% | 100% | 60% | 25% | Heading 한계 확인 |
| 12 | codified 반영 | 100% | 100% | 45% | 20% | product_type 오류로 퇴보 |

### 필드 영향도 확정 (테스트 7)
| 필드 | Section/Chapter 영향 | Heading/Subheading 영향 |
|------|---------------------|----------------------|
| **product_name** | CRITICAL | CRITICAL |
| **material** | CRITICAL (-55%) | HIGH |
| **category** | HIGH (override) | HIGH |
| processing | None | HIGH (예상) |
| composition | None | HIGH (예상, "of cotton" 구분) |
| description | Low (-5%) | MEDIUM |
| weight_spec | None | LOW |
| price | None | LOW |

### Heading 60% 한계 원인 (테스트 9, 13-15)
- **keyword overlap 방식의 한계** — heading description과 셀러 입력의 어휘 차이
- 예: "t-shirt" vs "T-shirts, singlets and other vests" (하이픈/대소문자 차이)
- 예: "tire" → heading description에 아예 없음 (pneumatic tyres만)
- **해결 방향**: heading별 상품 키워드 사전 (CBP/EBTI 판결문에서 추출) 또는 세미콜론 앞 product_type 정밀 파싱

### Description 문법 구조 분석 완료 (테스트 13-15)
- **6,854개 description 전수 분석 완료**
- **88%**: 세미콜론 구조 `[product_type]; [condition]`
- **12%** (765건): 세미콜론 없음 → 83%가 단순 구조(A+B), 8%가 "of [material]" 분리 필요
- **파싱 공식 확정**:
  - 세미콜론 앞 = product_type (매칭 대상)
  - "of [material]" = material_hint (product_type에서 분리!)
  - 세미콜론 뒤 = condition (processing/gender/use/weight)
- **이전 코드화 실패 원인**: "of plastics"를 product_type에 포함 → material=plastic 오매칭 → 15% 퇴보

---

## 2. 11개 TLC 영역 데이터 수집 (100% 완료)

### 외장하드 경로: `/Volumes/soulmaten/POTAL/tlc_data/` (97MB)

| # | 영역 | 완성도 | 신규 수집 핵심 파일 |
|---|------|--------|-------------------|
| 1 | Export Controls | ✅ | bis_entity_list.json(**2,633건**), country_chart_structured.json(195국), ECCN 658건 |
| 2 | Rules of Origin | ✅ | **5 FTA PSR 2,771건** (USMCA 443 + CPTPP 454 + **RCEP 1,030** + KORUS 242 + EU-UK 227) |
| 3 | Insurance/Shipping | ✅ | cif_fob_country_matrix.json(30국 FOB/CIF), insurance_rates_structured.json(13카테고리) |
| 4 | Currency | ✅ | currency_rules_structured.json(7국 공식환율 소스 + 20국 반올림 규칙) |
| 5 | Special Tax | ✅ | additional_country_special_taxes.json(**8개국 추가**: TH/MY/PH/VN/ID/EG/SA/TR, 46항목) |
| 6 | Sanctions | ✅ | **EU 24.1MB + UK 16.6MB + UN 2MB** = 42.7MB 3대 제재 목록 |
| 7 | AD/CVD | ✅ | ita_adcvd_cases_2000_current.json(590건) + ita_sunset_continuations.json(**647건** 현행 유효) |
| 8 | Duty Rate | ✅ | us_trq_entries.json(**372건** TRQ) + eu_seasonal_tariffs.json(13개 농산물) |
| 9 | VAT/GST | ✅ | eu_remaining_14_vat_rates.json(**14국** 경감세율) + india_gst_slab_mapping.json(5슬래브) |
| 10 | De Minimis | ✅ | fta_deminimis_thresholds.json(USMCA/RCEP/CPTPP/EU-UK) |
| 11 | Customs Fees | ✅ | DB 240국 이미 완비 |

### 주요 성과
- **RCEP PSR 1,030건 수집 성공** — NZ MFAT에서 Annex 3A PDF 159페이지 발견 + 추출
- **BIS Entity List 2,633건** — BIS 공식 HTML 16.6MB → 파싱 성공
- **3대 제재 목록 42.7MB** — EU/UK/UN 공식 소스에서 직접 다운로드

---

## 3. HS Code 규칙 코드화 (100% 완료)

### 외장하드 경로: `/Volumes/soulmaten/POTAL/7field_benchmark/`

| 파일 | 내용 | 건수 |
|------|------|------|
| codified_rules.json | Section Notes + Chapter Notes 규칙 | **592개** |
| codified_headings.json | Heading 구조화 조건 | **1,233개** |
| codified_subheadings.json | Subheading 구조화 조건 | **5,621개** (미분류 **0건**) |
| ai_derived_rules.json | AI 필요 4건 → 규칙 변환 | 9개 (4건 AI, 5건 코드) |
| ai4_codified_rules.json | CBP 12,550건 판결 기반 규칙 | 21개 |

### 규칙 검증 현황
- **592개 Notes 규칙**: 3중 교차검증 통과 (원문 대조 98.5%, FP 0건, FN 0건)
- **matchExclusion**: 구문 단위 매칭으로 수정 (38개 compound phrases)
- **AI 필요 4건**: Ch.9(향신료), Ch.40(고무), Ch.42(가죽), Ch.95(완구) — category 필드로 해결
- **실효 AI 호출 비율**: 전체 분류의 ~0.07-0.14% (1,000건당 1~2건)

---

## 4. CBP CROSS + EBTI 판결문 데이터

### 외장하드 경로: `/Volumes/soulmaten/POTAL/regulations/us/cross_rulings/`

| 데이터 | 건수 | 위치 |
|--------|------|------|
| CBP CROSS 전체 텍스트 | 39,430건 (8 batch × ~5K) | regulations/us/cross_rulings/batches/ |
| CBP CROSS 메타데이터 | 180,537건 (29 search batches) | regulations/us/cross_rulings/search_batches/ |
| EU EBTI | 501,457건 | regulations/eu_ebti/ |
| **합계** | **~720,000건** | |

### 7필드 벤치마크 데이터 (CBP에서 추출)
| 파일 | 건수 | 내용 |
|------|------|------|
| 7of7.json | 171건 | 7개 필드 전부 존재하는 ruling |
| 6of7.json | 1,485건 | 6개 필드 존재 |
| 5of7.json | 5,106건 | 5개 필드 존재 |
| complete_from_6of7.json | 1,656건 | 정밀 추출 (추출율: material 99%, function 86%, processing 99%) |
| merged_7of7.json | 92건 | 7/7 완전 추출 데이터 |
| merged_6of7.json | 595건 | 6/7 데이터 (대부분 price만 missing) |
| merged_7of7_with_category.json | 92건 | category 추가 (88% 추출 성공) |
| merged_6of7_with_category.json | 595건 | category 추가 |

---

## 5. HS Correlation 변환 데이터

### 외장하드 경로: `/Volumes/soulmaten/POTAL/hs_correlation/`

| 파일 | 건수 | 내용 |
|------|------|------|
| cbp_cross_hs2022.csv | 142,251건 | CBP CROSS → HS 2022 변환 |
| ebti_hs2022.csv | 231,726건 | EU EBTI → HS 2022 변환 |
| split_judgment_records.csv | 19,527건 | 분할 판단 필요 |
| **확정 사용 가능** | **352,916건** | **(94.4%)** — HS 2022 기준 정답 데이터 |

---

## 6. 경쟁사 벤치마크

### 외장하드 경로: `/Volumes/soulmaten/POTAL/analysis/`

| 파일 | 내용 |
|------|------|
| POTAL_12_TLC_Competitor_Benchmark.xlsx | 12개 TLC 기능 × TOP 3 경쟁사 (14시트) |

### 핵심 수치
| 기능 | 업계 1위 | POTAL 위치 |
|------|---------|-----------|
| HS Code | Tarifflo **89%** | **24%** (v3.0) → Step 2 **100%** (Section/Chapter) |
| Duty Rate | Descartes | **82%** (113M+ records, **데이터 규모 1위**) |
| VAT/GST | Avalara 190국 | **88%** (240국, **커버리지 1위**) |
| Sanctions | Dow Jones 5M | **75%** (21K + EU/UK/UN 42MB 추가) |

---

## 7. WDC 상품 데이터 + 필드 분석

### 외장하드 경로: `/Volumes/soulmaten/POTAL/wdc-products/`

| 항목 | 수치 |
|------|------|
| 전체 상품 수 | 17.6억건 (1,761,211,362) |
| products_detailed.jsonl | 302GB |
| 필드 존재율 (1,000건 샘플) | name 100%, description 22%, sku 16%, brand 2%, gtin 2%, price 0% |
| 7가지 HS 분류 정보 존재율 | 소재 7%, 기능 8%, 가공 3%, 성분비 7%, 무게 12%, 가격 0%, 원산지 1% |

### 핵심 시사점
- WDC = **name 기반 HS 6자리 매핑**에만 활용 (description 22%로 보충)
- 10자리 분류에 필요한 price/origin은 WDC에 없음 → API 입력 필수
- 셀러 데이터(9필드)와 WDC 데이터의 품질 차이가 큼

---

## 8. 다음 단계 (v3 파이프라인)

### 즉시 (P0)
1. **Heading 매칭 개선** — 현재 60% → 목표 90%+
   - 방법 A: heading별 대표 상품 키워드 사전 (CBP/EBTI 판결문에서 heading별 top keywords 추출)
   - 방법 B: 세미콜론 앞 product_type 정밀 파싱 (테스트 13-15에서 확정된 공식 적용)
   - 방법 C: AI 1회 호출 (heading 후보 3개 + 입력 → LLM 선택, ~$0.001/건)

2. **Subheading 매칭 개선** — 현재 25% → 목표 80%+
   - composition → subheading suffix 직접 매핑 ("Of cotton" = .10)
   - processing → subheading suffix 매핑 ("Roasted" = .21, "Not roasted" = .11)

### 이번 주 (P1)
3. **100건 벤치마크** — 20건이 아닌 100건 이상으로 통계적 유의미한 테스트
4. **CBP 100건 벤치마크** — arXiv:2412.14179 방법론 재현 (경쟁사 비교)

### 다음 주 (P2)
5. **v3 엔진을 /api/v1/classify에 연동** — 실제 API 엔드포인트에 통합
6. **Beta 출시 준비** — HS Code 89%+ + 11 TLC 완성 후

---

## 파일 경로 요약

| 용도 | 경로 |
|------|------|
| v3 파이프라인 코드 | `app/lib/cost-engine/gri-classifier/steps/v3/` |
| 592개 Notes 규칙 | `app/lib/cost-engine/gri-classifier/data/codified-rules.ts` |
| 1,233개 Heading 조건 | `app/lib/cost-engine/gri-classifier/data/codified-headings.ts` |
| 5,621개 Subheading 조건 | `app/lib/cost-engine/gri-classifier/data/codified-subheadings.ts` |
| 테스트 로그 | `/Volumes/soulmaten/POTAL/7field_benchmark/V3_TEST_LOG.md` |
| 20건 테스트 데이터 | `/Volumes/soulmaten/POTAL/7field_benchmark/clean_test_20_v3.json` |
| 11 TLC 수집 데이터 | `/Volumes/soulmaten/POTAL/tlc_data/` (97MB, 11/11 DONE) |
| 경쟁사 벤치마크 | `/Volumes/soulmaten/POTAL/analysis/POTAL_12_TLC_Competitor_Benchmark.xlsx` |
| HS 변환 데이터 | `/Volumes/soulmaten/POTAL/hs_correlation/` (352,916건 정답) |
| CBP/EBTI 판결문 | `/Volumes/soulmaten/POTAL/regulations/` (~720K건) |
