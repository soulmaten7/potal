# 확정 HS Code 기반 — 체계적 Ablation + 오류 진단 (Ground Truth 검증)

아래를 전부 실행해라. 중간에 멈추지 마라.

## 목적

**자기참조(self-referential)가 아닌, 정부 확정 HS Code를 ground truth로 사용하여 v3 파이프라인 정확도를 검증한다.**

이전 Amazon 50건 테스트는 baseline = POTAL 자체 출력이라 자기참조였다.
이번에는 CBP/EBTI 정부 판결문에서 **확정된 HS Code**가 있는 데이터를 사용한다.
파이프라인 출력 ≠ ground truth이면 → 파이프라인 오류 → 코드 수정.

## Phase 0: 확정 HS Code 데이터 확보

### 0-1. 기존 데이터 확인

아래 파일들이 있는지 확인하고 읽어라:

```
/Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7.json          — 92건 (7/7 필드 완전)
/Volumes/soulmaten/POTAL/7field_benchmark/merged_6of7.json          — 595건 (6/7 필드)
/Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7_with_category.json  — 카테고리 포함
/Volumes/soulmaten/POTAL/7field_benchmark/merged_6of7_with_category.json  — 카테고리 포함
```

각 파일의 형식을 확인하고, 아래 9개 필드가 어떻게 매핑되는지 파악:
```
product_name    ← ruling의 subject/product_description
material        ← 추출된 material 필드
origin_country  ← 추출된 origin 필드
category        ← 추출된 category 필드
description     ← ruling의 상세 설명
processing      ← 추출된 processing 필드
composition     ← 추출된 composition 필드
weight_spec     ← 추출된 weight 필드
price           ← 추출된 price 필드 (있으면)
```

**ground truth**: 각 ruling의 **확정 HS Code** (6자리)

### 0-2. 데이터 부족 시 추가 확보

만약 7/7 데이터가 92건 미만이거나 형식이 안 맞으면, 아래 소스에서 추가 확보:

**(a) CBP CROSS rulings 직접 파싱**:
- `/Volumes/soulmaten/POTAL/regulations/cbp_cross/` 폴더 확인
- ruling에서 9-field 추출 가능한 것 선별
- 확정 HS Code가 명시된 건만 사용

**(b) EU EBTI rulings**:
- `/Volumes/soulmaten/POTAL/regulations/eu_ebti/` 폴더 확인
- product description + confirmed HS code가 있는 건 추출

**(c) 없으면**: HSCodeComp 632건 (HuggingFace 공개 벤치마크) 다운로드
- https://huggingface.co/datasets 에서 "HSCodeComp" 검색
- product_name + HS code가 있는 공개 데이터

### 0-3. 테스트 데이터 준비

최종 테스트 데이터를 아래 형식으로 정리:
```json
{
  "source": "CBP_CROSS",
  "ruling_id": "N123456",
  "product_name": "Men's woven cotton shirt",
  "material": "cotton",
  "origin_country": "CN",
  "category": "clothing",
  "description": "Men's woven shirt, 100% cotton, long sleeve, button front",
  "processing": "woven",
  "composition": "100% cotton",
  "weight_spec": "",
  "price": "",
  "verified_hs6": "620520",
  "verified_section": 11,
  "verified_chapter": 62,
  "verified_heading": "6205"
}
```

저장: `/Volumes/soulmaten/POTAL/7field_benchmark/verified_test_data.json`

**⚠️ verified_hs6에서 Section/Chapter/Heading 역산:**
- verified_section: HS 2자리(chapter)로부터 WCO Section 매핑 (이미 코드에 있음)
- verified_chapter: HS6 앞 2자리
- verified_heading: HS6 앞 4자리

**목표 건수**: 최소 50건, 가능하면 100건 이상. 다양한 카테고리 포함 (소비재 + 산업재 + 식품 + 화학 등).

확보된 건수와 카테고리 분포를 출력하고, Phase 1로 진행.

---

## Phase 1: 9/9 Baseline — Ground Truth 대비 정확도

### 1-1. 전체 9/9 실행

verified_test_data.json의 모든 상품을 9/9 필드로 v3 파이프라인 실행.

**이번에는 baseline ≠ 정답이 아님.** verified_hs6가 정답.

각 상품마다:
```json
{
  "product_name": "Men's woven cotton shirt",
  "verified_hs6": "620520",
  "pipeline_hs6": "620520",
  "match": true,
  "verified_section": 11,   "pipeline_section": 11,   "section_match": true,
  "verified_chapter": 62,   "pipeline_chapter": 62,   "chapter_match": true,
  "verified_heading": "6205", "pipeline_heading": "6205", "heading_match": true,
  "pipeline_decision_path": "..."
}
```

### 1-2. 결과 집계

```
9/9 Baseline vs Ground Truth:
- Section 정확도: XX/YY (ZZ%)
- Chapter 정확도: XX/YY (ZZ%)
- Heading 정확도: XX/YY (ZZ%)
- HS6 정확도: XX/YY (ZZ%)
```

### 1-3. 틀린 건 상세 분석

9/9에서 틀린 건이 있으면 **각각 원인 분석**:

```json
{
  "product_name": "...",
  "verified_hs6": "851770",
  "pipeline_hs6": "847330",
  "fail_step": "Step 2-1",
  "error_type": "SECTION_WRONG | CHAPTER_WRONG | HEADING_WRONG | SUBHEADING_WRONG",
  "root_cause": "구체적 원인 — 어떤 키워드/규칙이 빠졌는지, 어떤 로직이 잘못됐는지",
  "fix_target": "step2-1-section-candidate.ts line XX — MATERIAL_TO_SECTION에 'XXX' 추가 필요",
  "difficulty": "EASY(사전추가) | MEDIUM(로직수정) | HARD(구조변경)"
}
```

### 1-4. 코드 수정 + 재테스트

틀린 건이 있으면:
1. 원인별로 수정 (KEYWORD_MISSING → 사전 추가, LOGIC_BUG → 코드 수정, RULE_MISSING → 규칙 추가)
2. `npm run build` 확인
3. 다시 9/9 baseline 실행
4. **모든 건이 맞을 때까지 반복**

각 수정 라운드마다 기록:
```
Fix Round 1:
- 수정: step2-1에 "polyester" → Section 11 추가
- 수정: step3에 heading 8517 키워드 추가
- 결과: 45/50 → 48/50 (+3건)

Fix Round 2:
- 수정: step2-3 Chapter 85 vs 84 분기 로직 수정
- 결과: 48/50 → 50/50 ✅
```

**⚠️ 9/9 baseline이 100%가 될 때까지 Phase 2로 넘어가지 마라.**
(단, 데이터 자체가 HS 2022 기준이 아닌 경우 등 정당한 불일치는 예외 처리하고 사유 기록)

---

## Phase 2: 체계적 Ablation (9→3) — Ground Truth 기준

Phase 1에서 9/9 = 100% 확인 후에만 진행.

### 테스트 설계

이전 Amazon 테스트와 동일한 구조:
- Level 9: 1가지 (baseline)
- Level 8: 9가지 (C(9,1) — 1개 빼기)
- Level 7: 36가지 (C(9,2) — 2개 빼기)
- Level 6: 84가지 (C(9,3))
- Level 5: 126가지 (C(9,4))
- Level 4: 126가지 (C(9,5))
- Level 3: 84가지 (C(9,6))
- **총 466 조합**

### 정확도 기준

**이번에는 ground truth (verified_hs6) 대비 정확도.**
자기참조가 아님 — 정부 확정 HS Code 대비.

### 오류 기록

틀린 건마다 동일하게 기록:
```json
{
  "product_name": "...",
  "combo_id": "8F_no_material",
  "level": 8,
  "removed_fields": ["material"],
  "verified_hs6": "620520",
  "pipeline_hs6": "392690",
  "fail_step": "Step 2-1",
  "error_type": "FIELD_DEPENDENT | KEYWORD_MISSING | LOGIC_BUG | RULE_MISSING",
  "root_cause": "...",
  "code_fix_needed": false
}
```

### 오류 유형 분류 (동일)

| error_type | 설명 | 코드 수정? |
|-----------|------|----------|
| FIELD_DEPENDENT | 필드 없어서 원천적으로 판단 불가 (정상) | ❌ |
| KEYWORD_MISSING | 키워드 사전에 단어 없음 | ✅ 사전 추가 |
| RULE_MISSING | Section/Chapter Notes 규칙 미반영 | ✅ 규칙 추가 |
| LOGIC_BUG | 코드 로직 오류 | ✅ 코드 수정 |

---

## Phase 3: 오류 진단

Phase 2에서 수집된 전체 오류를 분석:

1. **error_type별 빈도** — FIELD_DEPENDENT 몇 건, KEYWORD_MISSING 몇 건, LOGIC_BUG 몇 건
2. **Step별 오류 빈도** — 어떤 Step에서 가장 많이 깨지는지
3. **필드별 의존도** — 어떤 필드 빠지면 어떤 Step에서 깨지는지
4. **코드 수정 대상 목록** — KEYWORD_MISSING + LOGIC_BUG + RULE_MISSING 건만 추출
5. **카테고리별 오류율** — 소비재 vs 산업재 vs 식품 등 어디서 더 깨지는지

---

## Phase 4: 코드 수정 + 재테스트

KEYWORD_MISSING / LOGIC_BUG / RULE_MISSING이 있으면:
1. 코드 수정
2. npm run build 확인
3. 해당 오류 케이스만 재테스트
4. 9/9 baseline 재확인 (기존 100% 유지 확인)
5. 필요시 전체 466 재실행

**오류 0건 (FIELD_DEPENDENT 제외)이 될 때까지 반복.**

---

## 결과 저장

### JSON
- `/Volumes/soulmaten/POTAL/7field_benchmark/verified_test_data.json` — 테스트 데이터
- `/Volumes/soulmaten/POTAL/7field_benchmark/verified_ablation_results.json` — 466개 조합 결과
- `/Volumes/soulmaten/POTAL/7field_benchmark/verified_ablation_errors.json` — 오류 상세
- `/Volumes/soulmaten/POTAL/7field_benchmark/verified_ablation_fixes.json` — 코드 수정 내역

### 엑셀 — 기존 파일에 추가

**기존 `POTAL_Ablation_V2.xlsx`에 시트를 추가한다.** 새 파일 만들지 마라.

기존 파일 경로:
- `/Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx`
- `/Users/maegbug/potal/POTAL_Ablation_V2.xlsx`

기존 11시트(Amazon 50건) 아래에 다음 시트들을 추가:

### 추가 Sheet: "GT Dashboard" (Ground Truth Dashboard)
Row 1: "Ground Truth Ablation — CBP/EBTI Verified HS Codes (N건)"
Row 3: 데이터 소스 정보
- Source: CBP CROSS Rulings / EU EBTI (정부 확정 HS Code)
- Test Items: N건
- Category Distribution: 소비재 X건, 산업재 Y건, 식품 Z건...

Row 7: Level별 요약 (Amazon과 동일 형식이지만 Ground Truth 기준)
| Level | 조합 | Avg Section% | Avg Chapter% | Avg Heading% | Avg HS6% | 100% 조합 | 오류(코드) | 오류(필드) |

Row 20: 오류 유형 분포
Row 30: Step × Level 히트맵
Row 42: Amazon vs Ground Truth 비교 요약

### 추가 Sheet: "GT Baseline"
N건 상품 × ground truth 대비 파이프라인 결과

| # | product_name | material | category | verified_hs6 | pipeline_hs6 | match | fail_step | error_type |

### 추가 Sheet: "GT Level 8"
9개 조합 (동일 구조)

### 추가 Sheet: "GT Level 7"
36개 조합

### 추가 Sheet: "GT Level 6"
84개 조합

### 추가 Sheet: "GT Level 5"
126개 조합

### 추가 Sheet: "GT Level 4"
126개 조합

### 추가 Sheet: "GT Level 3"
84개 조합

### 추가 Sheet: "GT Errors"
⭐ 가장 중요 — 틀린 건 전체 (Ground Truth 기준)

| # | product_name | combo_id | level | removed_fields | verified_hs6 | pipeline_hs6 | fail_step | error_type | root_cause | code_fix_needed |

### 추가 Sheet: "GT vs Amazon"
**두 테스트 비교**

| 항목 | Amazon 50건 (자기참조) | Ground Truth N건 (정부확정) |
|------|---------------------|--------------------------|
| 9/9 HS6 정확도 | 100% | ?% |
| 코드 버그 건수 | 0 | ? |
| KEYWORD_MISSING | 0 | ? |
| LOGIC_BUG | 0 | ? |
| Level별 Avg HS6... | | |

### 추가 Sheet: "GT Code Fixes"
수정 내역 (Phase 4에서 수정한 것들)

## 엑셀 스타일

기존 POTAL_Ablation_V2.xlsx 스타일과 동일하게 맞춰라:
- 헤더: 남색(#2F5496) + 흰글자
- 정확도 조건부 서식: 100%=초록, 90%+=연초록, 70%+=노랑, 50%+=주황, <50%=빨강
- GT 시트 탭 색상: 파랑 계열 (기존 Amazon 시트와 구분)

## 진행 로그

```
═══ Phase 0: 데이터 확보 ═══
merged_7of7.json: 92건 확인
merged_6of7.json: 595건 확인
9-field 매핑 가능: XX건
카테고리: 소비재 XX, 산업재 XX, 식품 XX, 화학 XX, ...
→ verified_test_data.json 저장 (N건)

═══ Phase 1: 9/9 Baseline vs Ground Truth ═══
[1/N] Men's cotton shirt → verified=620520 pipeline=620520 ✅
[2/N] Steel bolts → verified=731815 pipeline=731815 ✅
...
[X/N] Electronic component → verified=854231 pipeline=847330 ❌ Step 2-3 CHAPTER_WRONG
...
9/9 Result: XX/N (YY%)

═══ Fix Round 1 ═══
- 수정: ...
- 재테스트: XX/N → XX/N
...
9/9 Final: N/N (100%) ✅ → Phase 2 진행

═══ Phase 2: 466 조합 × N건 ═══
...

═══ Phase 3: 오류 진단 ═══
Total errors: X건
- FIELD_DEPENDENT: X건 (정상)
- KEYWORD_MISSING: X건 (수정 필요)
- LOGIC_BUG: X건 (수정 필요)
코드 수정 필요: X건

═══ Phase 4: 수정 + 재테스트 ═══
...
```

portal 폴더에 최종 엑셀 복사:
```bash
cp /Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx /Users/maegbug/potal/POTAL_Ablation_V2.xlsx 2>/dev/null || true
```

전체를 한번에 실행하고 끝까지 완료해라. baseline 100% 될 때까지 Phase 2로 넘어가지 마라.
