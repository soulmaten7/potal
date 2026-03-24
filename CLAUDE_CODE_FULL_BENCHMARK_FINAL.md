# Claude Code 명령어: 169건 US 재벤치마크 + 7개국 전체 벤치마크

> **날짜**: 2026-03-21 KST
> **목표**: (1) 169건 유효 데이터 dest=US 재벤치마크 → WRONG_SUBCODE 19건이 줄었는지 확인 (2) 169건을 7개국 각각으로 돌려서 KR/JP/AU/CA 확장률 확인
> **배경**: Step 4를 패턴 기반으로 전면 개편 + KR/JP/AU/CA 10자리 데이터 추가 + 125,576행 코드화 완료. 이전 결과(WRONG_SUBCODE 19건, KR/JP/AU/CA 0%)와 비교.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **시트 마감**: `=== 작업 종료 ===`

---

## 데이터

169건 유효 데이터: 이전 벤치마크에서 사용한 것과 동일.
- `/Volumes/soulmaten/POTAL/7field_benchmark/amazon_9field_complete.json` 에서 173건 로드
- Blend/other/무효 material 4건 제외 = 169건

---

## Part 1: 169건 US 재벤치마크

### 1-1. 전부 destination_country='US'로 실행

이전과 동일 조건. Step 0~6 전체 파이프라인.

```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### 1-2. 이전 결과와 비교

이전 결과 (POTAL_V3_US_HS10_Verification.xlsx):
- HS Expansion: 154/169 (91%)
- MATCH: 81 (47%)
- PARTIAL: 17 (10%)
- REVIEW: 56 (33%)
- MISMATCH: 0
- NO_EXPANSION: 15 (9%)
- WRONG_SUBCODE: 19건

이번에 비교할 항목:
- HS Expansion: 개선됐는지 (NO_EXPANSION 줄었는지)
- WRONG_SUBCODE: 19건 → 몇 건으로 줄었는지
- MATCH: 81건 → 늘었는지
- method: keyword_match → pattern_strong/pattern_match 변화

### 1-3. WRONG_SUBCODE 19건 재검증

이전 WRONG_SUBCODE 19건의 product를 특정해서 이번에 어떻게 바뀌었는지 1:1 대조:

```
이전 WRONG_SUBCODE 19건:
- Glass vase 7건 (7013)
- Ceramic mug 5건 (6912)
- Jewelry 4건 (7113)
- 기타 3건 (candle, leather, yoga mat)

각 건마다:
  이전 코드 → 이번 코드 → 개선 여부
```

### 1-4. gov_tariff_schedules description 대조 (10자리 정확도)

이전과 동일: final_hs_code → gov_tariff_schedules에서 description 조회 → 상품명과 대조
판정: MATCH / PARTIAL / REVIEW / MISMATCH / NO_EXPANSION

---

## Part 2: 7개국 전체 벤치마크

### 2-1. 169건을 7개국 각각으로 실행

같은 169건 상품을 7개 destination으로 각각 실행:

```
US: 169건 (Part 1에서 이미 실행)
EU: 169건
GB: 169건
KR: 169건
JP: 169건
AU: 169건
CA: 169건
총: 169 × 7 = 1,183건
```

### 2-2. 국가별 결과 비교

| 국가 | 이전 확장률 | 이번 확장률 | 변화 |
|------|----------|----------|------|
| US | 91% | ? | |
| EU | 59% | ? | |
| GB | 66% | ? | |
| KR | **0%** | ? | ← 핵심 |
| JP | **0%** | ? | ← 핵심 |
| AU | **0%** | ? | ← 핵심 |
| CA | **0%** | ? | ← 핵심 |

### 2-3. 국가별 method 분포

각 나라에서 pattern_strong / pattern_match / pattern_catch_all / db_keyword_match / exact_match 비율

---

## Part 3: Regression 확인

### 3-1. Clean 20건 regression

기존 20건 테스트 → 20/20 유지되는지

### 3-2. Amazon 50건 (CW18 원본) Step 3까지 regression

기존 Amazon 50건 → Section/Chapter/Heading/HS6 100% 유지되는지

---

## 결과물

### 엑셀: `POTAL_V3_Final_Benchmark.xlsx`

**Sheet 1: US 169건 Before/After**
| 항목 | Before (이전) | After (이번) | 변화 |
|------|-------------|------------|------|
| HS Expansion | 154/169 (91%) | ? | |
| MATCH | 81 (47%) | ? | |
| WRONG_SUBCODE | 19 | ? | |
| NO_EXPANSION | 15 | ? | |

**Sheet 2: WRONG_SUBCODE 19건 1:1 대조**
- product_name, 이전 코드, 이번 코드, 이전 판정, 이번 판정

**Sheet 3: 7개국 결과 비교**
| 국가 | 확장률 | MATCH% | method 분포 | 평균 시간 |

**Sheet 4: US 169건 전 건 상세**
- product_name, material, hs6, final_code, precision, HTS desc, 판정, duty%, method

**Sheet 5: 7개국 전 건 (1,183건)**

**Sheet 6: Regression**
- Clean 20: X/20
- Amazon 50: Section/Chapter/Heading/HS6 정확도

시트 마감: `=== 작업 종료 === | US WRONG_SUBCODE X건(이전19) | 7개국 확장률 | Regression`

---

## ⚠️ 절대 규칙

1. **169건 유효 데이터만** — Blend/other 4건 제외
2. **이전 결과와 반드시 비교** — 개선/퇴보 명확히
3. **WRONG_SUBCODE 19건 1:1 대조 필수** — 어떤 상품이 개선됐고 어떤 건 그대로인지
4. **7개국 전부 실행** — 일부만 하지 않는다
5. **Regression 필수** — Clean 20 + Amazon 50
6. **엑셀에 전부 기록**
