# v3 파이프라인 — 체계적 Ablation + 오류 진단 테스트 (V2)

아래를 전부 실행해라. 중간에 멈추지 마라.

## 목적

**점수를 매기는 게 아니라, 오류를 찾아서 코드를 고치는 것.**

9개 필드를 체계적으로 줄여가며 파이프라인을 돌리되, 틀린 건마다 **왜 틀렸는지** 원인을 분류한다.
원인 분류 결과 → 파이프라인 코드 수정 → 다시 테스트 → 오류 0건까지 반복.

이 파이프라인은 수억 건의 상품명을 처리할 것이므로, 어떤 상품이든 9-Field가 정확히 있으면 HS 10자리까지 100% 맞아야 한다.

## 실행 순서 (이 순서대로, 건너뛰지 마라)

### Phase 1: 9/9 Baseline + 독립 검증
### Phase 2: 체계적 Ablation (9→3)
### Phase 3: 오류 진단 + 코드 수정
### Phase 4: 수정 후 재테스트 (오류 0까지 반복)

---

## Phase 1: 9/9 Baseline + 독립 검증

### 1-1. Amazon 50건 9/9 Baseline 실행

`amazon_50_products.json` (`/Volumes/soulmaten/POTAL/7field_benchmark/`)을 읽어서 9/9 전체 필드로 v3 파이프라인을 돌린다.

각 상품마다 기록:
```json
{
  "product_name": "...",
  "pipeline_section": 11,
  "pipeline_chapter": 61,
  "pipeline_heading": "6109",
  "pipeline_hs6": "610910",
  "pipeline_decision_path": [...],  // 전체 decision_path 저장
  "step21_output": "S11(0.95,material)",
  "step23_output": "Ch61(0.90,keyword)",
  "step3_output": "6109(0.85,heading_match)",
  "step4_output": "610910(0.80,subheading_match)"
}
```

### 1-2. 독립 검증용 데이터 생성

baseline 결과를 검증하기 위해 **2가지를 동시에** 확인:

**(a) CBP CROSS 교차검증**: 50개 상품명 각각을 CBP CROSS rulings DB(`/Volumes/soulmaten/POTAL/regulations/cbp_cross/`)에서 검색. 유사 상품이 있으면 해당 ruling의 HS Code와 파이프라인 결과를 비교.

**(b) 수동 검증 CSV 생성**: 아래 형식으로 `/Volumes/soulmaten/POTAL/7field_benchmark/baseline_verification.csv` 저장
```
product_name | material | category | pipeline_section | pipeline_chapter | pipeline_heading | pipeline_hs6 | cbp_match_hs6 | match_status | verification_note
```
- match_status: CONFIRMED (CBP 일치) / MISMATCH (CBP 불일치) / NO_CBP_DATA (CBP에 없음)
- 불일치 건은 어떤 Step에서 갈라졌는지 기록

**⚠️ 중요**: baseline에서 이미 틀린 게 있으면 Phase 2로 넘어가지 말고, 먼저 해당 오류를 분석하고 코드를 수정해라. 수정 후 다시 baseline 돌려서 확인. 이 루프를 baseline이 깨끗해질 때까지 반복.

---

## Phase 2: 체계적 Ablation (9→3)

### 필드 정의
```
필수 3개: product_name, material, origin_country
선택 6개: category, description, processing, composition, weight_spec, price
```

### 테스트 조합 — 모든 레벨, 모든 조합

| Level | 필드 수 | 빼는 수 | 조합 수 | 계산 |
|-------|--------|--------|--------|------|
| 9 | 9 | 0 | 1 | baseline |
| 8 | 8 | 1 | 9 | C(9,1) |
| 7 | 7 | 2 | 36 | C(9,2) |
| 6 | 6 | 3 | 84 | C(9,3) |
| 5 | 5 | 4 | 126 | C(9,4) |
| 4 | 4 | 5 | 126 | C(9,5) |
| 3 | 3 | 6 | 84 | C(9,6) |
| **합계** | | | **466** | × 50상품 = 23,300회 |

조합 생성: 9개 필드에서 k개를 빼는 모든 조합 = `C(9, k)`

### 필드 제외 방법
- product_name 제외 → `"unknown product"` 전달
- material 제외 → `""` (step0에서 "unknown"으로 대체됨)
- origin_country 제외 → `""` (step0에서 "CN"으로 대체됨)
- category/description/processing/composition/weight_spec → `""`
- price → `undefined`

### Step별 정확도 기록

각 조합 × 50개 상품마다 파이프라인 각 Step 출력을 baseline과 비교:

| Step | 비교 대상 | 의미 |
|------|----------|------|
| Step 2-1/2-2 | `confirmed_section` | Section 맞았는가 |
| Step 2-3/2-4 | `confirmed_chapter` | Chapter 맞았는가 |
| Step 3 | `confirmed_heading` | Heading(4자리) 맞았는가 |
| Step 4 | `confirmed_hs6` | HS6(6자리) 맞았는가 |

### ⭐ 핵심: 틀린 건마다 오류 기록

**% 숫자보다 중요한 것**: 틀린 각 건의 원인.

틀린 상품이 있으면 반드시 아래를 기록:
```json
{
  "product_name": "Stainless Steel Water Bottle",
  "combo": "6F_no_material_category_description",
  "level": 6,
  "removed_fields": ["material", "category", "description"],
  "fail_step": "Step 2-1",        // 처음 틀린 Step
  "baseline_section": 15,
  "got_section": 7,
  "baseline_chapter": 73,
  "got_chapter": 39,
  "baseline_heading": "7323",
  "got_heading": "3924",
  "baseline_hs6": "732390",
  "got_hs6": "392490",
  "error_type": "SECTION_WRONG",   // 아래 분류 기준 참고
  "root_cause": "material 없어서 steel→plastic으로 Section 이동",
  "fix_possible": "material이 있으면 해결됨 (필수 필드)",
  "code_fix_needed": false
}
```

### 오류 유형 분류 (error_type)

| error_type | 설명 | 코드 수정 필요? |
|-----------|------|--------------|
| SECTION_WRONG | Section부터 틀림 — material/category 키워드 매칭 실패 | step2-1 수정 |
| CHAPTER_WRONG | Section 맞지만 Chapter 틀림 — Chapter 후보 선택 오류 | step2-3 수정 |
| HEADING_WRONG | Chapter 맞지만 Heading 틀림 — Heading 매칭 부족 | step3 수정 |
| SUBHEADING_WRONG | Heading 맞지만 HS6 틀림 — Subheading 세분화 오류 | step4 수정 |
| FIELD_DEPENDENT | 해당 필드 없으면 원천적으로 판단 불가 (정상 동작) | 수정 불필요 |
| KEYWORD_MISSING | 키워드 사전에 해당 단어가 없음 | 사전 추가 |
| RULE_MISSING | Section/Chapter Notes 규칙이 반영 안 됨 | 규칙 추가 |
| LOGIC_BUG | 코드 로직 오류 (조건문, 우선순위 등) | 코드 버그 수정 |

### 분류 기준:
1. **9/9에서 맞고 필드 빼면 틀리는 경우**: 빠진 필드 때문 → `FIELD_DEPENDENT` (수정 불필요, "이 필드를 넣으면 맞습니다" 안내)
2. **9/9에서도 틀린 경우**: 파이프라인 구조 문제 → `LOGIC_BUG` / `KEYWORD_MISSING` / `RULE_MISSING` (반드시 수정)
3. **특정 필드 조합에서만 틀리는 경우**: 해당 필드가 다른 필드를 잘못 override → `LOGIC_BUG` (수정 필요)

---

## Phase 3: 오류 진단 + 코드 수정

### 3-1. 오류 집계

Phase 2 결과에서:
1. **9/9에서 틀린 상품** → 최우선 수정 (파이프라인 근본 결함)
2. **error_type별 빈도**: KEYWORD_MISSING 몇 건, RULE_MISSING 몇 건, LOGIC_BUG 몇 건
3. **Step별 오류 빈도**: Step 2-1에서 가장 많이 깨지는지, Step 3에서 깨지는지
4. **필드별 의존도**: "material 빠지면 Step 2-1에서 XX% 깨짐" — 이건 정상 (FIELD_DEPENDENT)

### 3-2. 코드 수정 대상 식별

**수정해야 하는 것** (KEYWORD_MISSING, RULE_MISSING, LOGIC_BUG):
- 어떤 파일의 어떤 함수를 고쳐야 하는지 목록 작성
- 각각 구체적 수정 내용 기술

**수정하면 안 되는 것** (FIELD_DEPENDENT):
- 이건 "셀러에게 이 필드를 추가하세요" 안내로 해결
- 코드를 고치는 게 아님

### 3-3. 코드 수정 실행

수정 대상이 있으면:
1. 해당 TypeScript 파일 수정
2. `npm run build` 확인 (0 errors)
3. 수정 내역 기록

---

## Phase 4: 수정 후 재테스트

수정 완료 후:
1. 9/9 baseline 다시 실행 → 50/50 확인
2. 수정한 오류 케이스만 다시 실행 → 수정 확인
3. 전체 466 조합 재실행은 필요시에만 (수정이 광범위한 경우)

**반복 조건**: 9/9에서 틀린 건이 0이 될 때까지 Phase 3-4 반복.

---

## 결과 저장

### JSON (전체 결과 + 오류 상세)
- `/Volumes/soulmaten/POTAL/7field_benchmark/ablation_v2_results.json` — 466개 조합 요약
- `/Volumes/soulmaten/POTAL/7field_benchmark/ablation_v2_errors.json` — 틀린 건 전체 상세 (오류 기록 형식)
- `/Volumes/soulmaten/POTAL/7field_benchmark/ablation_v2_fixes.json` — 코드 수정 내역

### 엑셀
`/Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx`

portal 폴더에도 복사:
```bash
cp /Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx /Users/maegbug/potal/POTAL_Ablation_V2.xlsx 2>/dev/null || true
```

## 엑셀 시트 구조 (11시트)

### Sheet 1: "Dashboard"
한눈에 보는 요약

Row 1: 제목 "POTAL v3 — Systematic Ablation + Error Diagnosis (466 Combos × 50 Products)"
Row 3: 테스트 정보
- Total Combinations: 466
- Total Pipeline Runs: 23,300
- Products: 50 (Amazon real seller data)
- ⚠️ Baseline = POTAL 자체 출력 (독립 검증 필요)

Row 7: **Level별 요약**
| Level | 필드 수 | 조합 수 | Avg Section% | Avg Chapter% | Avg Heading% | Avg HS6% | Min HS6% | Max HS6% | 100% 조합 수 | 오류 건수 합계 |

Row 20: **오류 유형 분포**
| error_type | 건수 | 비율 | 수정 필요? | 수정 대상 파일 |

Row 30: **Step별 평균 정확도 × Level** (히트맵)
| | Section | Chapter | Heading | HS6 |
| Level 9 | | | | |
| Level 8 | | | | |
| ... | | | | |

Row 42: **핵심 발견 + 수정 사항 요약**

### Sheet 2: "9/9 Baseline Detail"
50개 상품 × 파이프라인 결과 상세

| # | product_name | material | category | Section | Chapter | Heading | HS6 | CBP Match | Status | Decision Path 요약 |

### Sheet 3: "Level 8 (Remove 1)"
9개 조합 × Step별 정확도 + 오류 수

| 제외 필드 | Section% | Chapter% | Heading% | HS6% | ΔHS6 | 오류 건수 | 주요 error_type | 첫 실패 Step |

### Sheet 4: "Level 7 (Remove 2)"
36개 조합 (동일 구조)

### Sheet 5: "Level 6 (Remove 3)"
84개 조합

### Sheet 6: "Level 5 (Remove 4)"
126개 조합

### Sheet 7: "Level 4 (Remove 5)"
126개 조합

### Sheet 8: "Level 3 (Remove 6)"
84개 조합

### Sheet 9: "Error Diagnosis"
⭐ **가장 중요한 시트**

틀린 건 전체 목록 (모든 조합에서 발생한 오류):

| # | product_name | combo_id | level | removed_fields | fail_step | error_type | baseline vs got | root_cause | code_fix_needed | fix_description |

- error_type별 필터 가능
- fail_step별 정렬 가능
- code_fix_needed = TRUE인 것만 필터 → 수정 대상 목록

### Sheet 10: "Field Importance Matrix"
필드 × Step 영향도 (466개 데이터 기반 통계)

| Field | 포함시 Avg Section% | 미포함시 Avg Section% | Section Impact | ... (Chapter, Heading, HS6도 동일) |

- Impact = 포함 - 미포함
- 모든 466개 조합에서 해당 필드가 포함/미포함인 경우를 나눠서 평균 계산

### Sheet 11: "Code Fixes Log"
수정한 코드 변경 내역

| # | 수정일 | 대상 파일 | 함수명 | 변경 내용 | 관련 error_type | 영향 상품 수 | Before→After |

## 엑셀 스타일

- 폰트: Arial 11
- 헤더: 남색(#2F5496) 배경 + 흰색 글자 + Bold
- 정확도 조건부 서식: 100%=초록(#C6EFCE), 90%+=연초록(#E2EFDA), 70%+=노랑(#FFEB9C), 50%+=주황(#FFD9B3), <50%=빨강(#FFC7CE)
- error_type 색상: LOGIC_BUG=빨강, KEYWORD_MISSING=주황, RULE_MISSING=노랑, FIELD_DEPENDENT=회색
- code_fix_needed = TRUE → 빨강 배경
- 자동 열 너비, 셀 테두리

## 진행 로그 형식

```
═══ Phase 1: Baseline ═══
[1/50] Cotton T-Shirt → S11 Ch61 H6109 HS610910 ✅
[2/50] Stainless Steel Bottle → S15 Ch73 H7323 HS732390 ✅
...
Baseline: 50/50 ✅ (틀린 건 0 → Phase 2 진행)

═══ Phase 2: Ablation ═══
[Level 8] 1/9 no_product_name → S:48/50 Ch:46/50 H:44/50 HS6:42/50 (오류 8건)
  ❌ #3 Water Bottle: Step 2-1 SECTION_WRONG (S15→S7) — product_name 없어서 material만으로 판단
  ❌ #7 Yoga Mat: Step 3 HEADING_WRONG (4016→3918) — product_name 없어서 heading 키워드 매칭 실패
  ...
[Level 8] 2/9 no_material → S:24/50 Ch:20/50 H:20/50 HS6:20/50 (오류 30건)
  ❌ ...

═══ Phase 3: Error Summary ═══
Total errors: 1,234건
- FIELD_DEPENDENT: 1,100건 (89%) — 정상, 수정 불필요
- KEYWORD_MISSING: 80건 (6%) — 사전 추가 필요
- LOGIC_BUG: 34건 (3%) — 코드 수정 필요
- RULE_MISSING: 20건 (2%) — 규칙 추가 필요

Code fixes needed: 54건 (4.4%)
Files to modify: step2-1 (20건), step3 (25건), step4 (9건)

═══ Phase 4: Fix & Retest ═══
Fix 1: step2-1 — added "neoprene" to MATERIAL_TO_SECTION → 12건 해결
Fix 2: step3 — added heading 8523 for USB drives → 8건 해결
...
Retest: 9/9 baseline 50/50 ✅
Remaining code-fix errors: 0 ✅
```

## 실행

1. Phase 1 실행 (baseline + 검증)
2. baseline이 깨끗하면 Phase 2 실행 (466 조합)
3. Phase 3 오류 진단
4. Phase 4 코드 수정 + 재테스트
5. 엑셀 생성 (`scripts/ablation_v2.ts` + `scripts/ablation_v2_xlsx.py`)
6. portal 폴더에 복사

전체를 한번에 실행하고 끝까지 완료해라. 단, baseline에서 오류가 있으면 멈추고 수정 먼저 해라.
