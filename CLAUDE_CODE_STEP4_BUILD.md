# Claude Code 명령어: Step 4-1 (7-8자리) + Step 4-2 (9-10자리) 구현

> **날짜**: 2026-03-21 KST
> **목표**: codified_national_full_final.json (125,576행)을 사용하여 7개국 각각의 7-8자리 + 9-10자리 매칭 로직을 country-agents에 구현
> **구조**: 7개국 = 7개 로직. 공통 함수 없음. 나라별 독립 처리.
> **제약**: Step 0~3 코드 절대 수정 금지. country-agents/ 파일만 수정.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 현재 구조

```
pipeline-v3.ts
  → step5-country-router.ts (routeToCountry)
    → country-agents/index.ts (routeToCountryAgent)
      → country-agents/us-agent.ts (classifyUS)
      → country-agents/eu-agent.ts (classifyEU)
      → country-agents/uk-agent.ts (classifyUK)
      → country-agents/kr-agent.ts (classifyKR)
      → country-agents/jp-agent.ts (classifyJP)
      → country-agents/au-agent.ts (classifyAU)
      → country-agents/ca-agent.ts (classifyCA)
        → country-agents/base-agent.ts (baseClassify) ← 현재 7개국 공통. 이걸 나라별로 분리
```

**현재 문제**: 7개국이 전부 base-agent.ts의 `desc.includes(keyword) + 2` 로직을 공유함. 나라별 세분화 기준이 다른데 같은 로직을 쓰고 있음.

---

## 변경 구조

7개 agent가 각자 자기 나라의 codified_national_full_final.json을 로드하여 독립적으로 매칭.

```
country-agents/
├── base-agent.ts       ← 유지 (fallback용). 하지만 주 로직이 아님
├── index.ts            ← 유지 (라우팅)
├── us-agent.ts         ← US 전용 7-8자리 + 9-10자리 로직
├── eu-agent.ts         ← EU 전용
├── uk-agent.ts         ← UK 전용
├── kr-agent.ts         ← KR 전용
├── jp-agent.ts         ← JP 전용 (9자리 체계)
├── au-agent.ts         ← AU 전용 (8자리 체계)
├── ca-agent.ts         ← CA 전용
└── data/               ← 나라별 코드화 JSON (신규)
    ├── us_codified.json
    ├── eu_codified.json
    ├── gb_codified.json
    ├── kr_codified.json
    ├── jp_codified.json
    ├── au_codified.json
    └── ca_codified.json
```

---

## Phase 1: 코드화 JSON을 코드에서 로드할 수 있는 형태로 변환

### 1-1. codified_national_full_final.json → 나라별 분리 + TypeScript import 가능 형태

```python
# /Volumes/soulmaten/POTAL/hs_national_rules/{country}/codified_national_full_final.json
# → app/lib/cost-engine/gri-classifier/country-agents/data/{country}_codified.json
# 또는 .ts 파일로 export

# HS6별로 그룹핑 — Step 4에서 HS6로 조회하므로
# { "610910": [후보1, 후보2, ...], "691200": [후보1, 후보2, ...] }
```

### 1-2. HS6 기준 인덱싱

각 나라 JSON을 HS6 기준으로 인덱싱:

```json
{
  "610910": {
    "candidates": [
      {
        "national_code": "61091000",
        "description": "Of cotton",
        "indent": 1,
        "pattern_type": "MATERIAL_DETAIL",
        "conditions": {"material": "cotton"},
        "keywords": ["cotton", "knitted"]
      },
      {
        "national_code": "6109100004",
        "description": "T-shirts, all white, short hemmed sleeves",
        "indent": 3,
        "pattern_type": "GENDER",
        "conditions": {"color": "white", "sleeve": "short hemmed"},
        "keywords": ["white", "short", "hemmed", "t-shirt"]
      }
    ],
    "tree": {
      "61091000": ["6109100004", "6109100007", "6109100012"]
    }
  }
}
```

---

## Phase 2: Step 4-1 (7-8자리) 매칭 로직 — 나라별 구현

### 입력 (Step 3 결과 + 9-field):

```typescript
interface Step4Input {
  // Step 3 결과
  hs6: string;                    // "610910"
  hs6_description: string;        // "Of cotton"
  heading: string;                // "6109"
  heading_description: string;    // "T-shirts, singlets..."
  section: number;                // 11
  chapter: number;                // 61

  // 9-field
  product_name: string;           // "Cotton T-Shirt"
  material: string;               // "cotton"
  composition: string;            // "95% cotton, 5% elastane"
  price: number | null;           // 15
  weight_spec: string | null;     // "2.2 pounds"
  processing: string;             // "knitted"
  category: string;               // "clothing"
  description: string;            // "Men's crew neck..."

  // Normalized
  material_keywords: string[];
  category_tokens: string[];
  processing_states: string[];
  composition_parsed: {material: string, pct: number}[];
}
```

### 2-1. US Agent (가장 복잡)

US는 indent 계층이 있으므로 **트리 탐색**:

```
Step 4-1-US:
1. HS6 → codified에서 해당 HS6 아래 모든 후보 로드
2. indent 0~11 계층에서 7-8자리 레벨(indent 1~3) 후보 추출
3. 각 후보의 pattern_type에 따라 매칭:
   - MATERIAL_DETAIL → material, composition 매칭
   - PRICE_THRESHOLD → price 비교 (valued over/not over)
   - GENDER → product_name에서 men/women/boys/girls 추출
   - PROCESSING → processing_states 매칭
   - COMPOSITION_PCT → composition_parsed 매칭
   - SIZE_THRESHOLD → weight_spec에서 cm/inch 파싱
   - WEIGHT_THRESHOLD → weight_spec에서 kg/pounds 파싱
   - END_USE → category 매칭
   - CATCH_ALL → 다른 후보 전부 탈락 시 선택
4. 가장 높은 점수의 7-8자리 후보 확정
```

### 2-2. EU Agent

EU는 flat 구조 (indent 없음):

```
Step 4-1-EU:
1. HS6 → 후보 로드 (CN8 레벨)
2. 각 후보의 pattern_type에 따라 매칭:
   - MATERIAL_DETAIL → material 매칭
   - PRICE_THRESHOLD → price 비교
   - PROCESSING → processing 매칭
   - COMPOSITION_PCT → composition 매칭
   - CATCH_ALL → fallback
3. 확정
```

### 2-3. GB Agent

EU와 거의 동일 (CN 기반):

```
Step 4-1-GB:
EU와 동일 로직. 데이터만 gb_codified.json 사용.
```

### 2-4. KR Agent

```
Step 4-1-KR:
1. HS6 → 후보 로드 (HSK 10자리)
2. 매칭: MATERIAL_DETAIL, PROCESSING 중심
3. 확정
```

### 2-5. JP Agent (9자리 체계)

```
Step 4-1-JP:
1. HS6 → 후보 로드 (9자리)
2. 매칭: MATERIAL_DETAIL, PROCESSING 중심
3. 7-8자리 확정 → 9번째 자리까지 (JP는 여기서 끝)
```

### 2-6. AU Agent (8자리 체계)

```
Step 4-1-AU:
1. HS6 → 후보 로드 (8자리)
2. 매칭: MATERIAL_DETAIL, PROCESSING 중심
3. 7-8자리 확정 (AU는 여기서 끝)
```

### 2-7. CA Agent

```
Step 4-1-CA:
KR과 유사. 데이터만 ca_codified.json 사용.
```

---

## Phase 3: Step 4-2 (9-10자리) 매칭 로직

### 3-1. US (통계 부호)

7-8자리 확정 후 → 그 아래 9-10자리 후보에서:
- GENDER → men/women/boys/girls
- 상품 세부 → product_name 키워드 (all white, short hemmed 등)
- CATCH_ALL → "Other"

### 3-2. EU (TARIC 무역정책)

7-8자리(CN8) 확정 후 → TARIC 9-10자리:
- 반덤핑/쿼터/특혜 관련 → origin_country 기반
- 대부분 무역정책 코드라 상품 분류와 무관 → CATCH_ALL 많음

### 3-3. GB

EU와 유사.

### 3-4. KR (통계부호)

7-8자리 확정 후 → 9-10자리:
- 무역 통계 목적
- product_name, material 키워드 매칭

### 3-5. JP — 9자리에서 끝. Step 4-2 스킵.
### 3-6. AU — 8자리에서 끝. Step 4-2 스킵.

### 3-7. CA (통계부호)

KR과 유사.

---

## Phase 4: step5-country-router.ts 수정 — 추가 데이터 전달

현재 routeToCountry()가 base-agent에 keywords만 보내는 것을 **Step 3 결과 + 9-field 전부** 보내도록 수정.

### 수정 파일: `steps/v3/step5-country-router.ts`

```typescript
// 변경: 추가 데이터 전달
const result = await routeToCountryAgent(hs6, country, {
  keywords,
  product_name: productName,
  material_keywords: normalized.material_keywords,
  category_tokens: normalized.category_tokens,
  processing_states: normalized.processing_states,
  composition_parsed: normalized.composition_parsed,
  price: price,
  weight_spec: normalized.weight_spec,
  heading: heading,                    // Step 3-1 결과
  heading_description: headingDesc,    // Step 3-1 결과
  hs6_description: hs6Desc,           // Step 3-2 결과
  section: section,                    // Step 2 결과
  chapter: chapter,                    // Step 2 결과
});
```

### 수정 파일: `country-agents/index.ts`

함수 시그니처 변경 — keywords 배열 대신 전체 데이터 객체 전달.

### 수정 파일: `steps/v3/pipeline-v3.ts`

Step 4 호출 시 heading, heading_description, hs6_description, section, chapter 추가 전달.

---

## Phase 5: 빌드 + 벤치마크

### 5-1. npm run build

```bash
npm run build  # 0 errors
```

### 5-2. 169건 US 벤치마크 재실행

이전 WRONG_SUBCODE 19건이 해결됐는지 확인:

```
목표:
  WRONG_SUBCODE 19 → 5건 이하
  US HS10 정확도 66% → 85%+
  Regression: 기존 MATCH 81건이 깨지면 안 됨
```

### 5-3. 7개국 벤치마크 (신규)

169건을 7개국 각각으로 돌려서 KR/JP/AU/CA도 확장되는지:

```
KR: 0% → X% (이제 10자리 데이터 있으니까 확장 가능)
JP: 0% → X% (9자리)
AU: 0% → X% (8자리)
CA: 0% → X% (8자리)
```

---

## 결과물

### 수정 파일:

| 파일 | 동작 | 내용 |
|------|------|------|
| country-agents/data/*.json | **신규 7개** | 나라별 HS6 인덱싱된 코드화 데이터 |
| country-agents/us-agent.ts | 수정 | US 전용 indent 트리 + 패턴 매칭 |
| country-agents/eu-agent.ts | 수정 | EU 전용 CN8 매칭 |
| country-agents/uk-agent.ts | 수정 | GB 전용 |
| country-agents/kr-agent.ts | 수정 | KR 전용 10자리 매칭 |
| country-agents/jp-agent.ts | 수정 | JP 전용 9자리 매칭 |
| country-agents/au-agent.ts | 수정 | AU 전용 8자리 매칭 |
| country-agents/ca-agent.ts | 수정 | CA 전용 |
| country-agents/index.ts | 수정 | 함수 시그니처 변경 (추가 데이터 전달) |
| step5-country-router.ts | 수정 | Step 3 결과 + 9-field 전달 |
| pipeline-v3.ts | 수정 | heading/section/chapter 추가 전달 |

### 엑셀: `POTAL_Step4_Build_Result.xlsx`

**Sheet 1: 빌드 결과**
**Sheet 2: US 169건 벤치마크 (before/after)**
**Sheet 3: 7개국 벤치마크**
**Sheet 4: WRONG_SUBCODE 변화**

시트 마감: `=== 작업 종료 === | 빌드 ✅ | US WRONG_SUBCODE X건 | 7개국 확장률 | 수정 파일 11개`

---

## ⚠️ 절대 규칙

1. **Step 0~3 코드 절대 수정 금지** — step0-input.ts ~ step4-subheading.ts
2. **7개국 = 7개 독립 로직** — 공통 함수로 합치지 않는다
3. **base-agent.ts는 fallback으로 유지** — 새 로직이 실패할 때만 사용
4. **codified_national_full_final.json이 유일한 데이터 소스** — 다른 데이터 참조 금지
5. **pattern_type에 따라 매칭 기준 분기** — PRICE면 price, GENDER면 product_name
6. **indent 트리는 US only** — 다른 6개국은 flat
7. **JP는 9자리, AU는 8자리에서 끝** — Step 4-2 스킵
8. **pipeline-v3.ts 수정은 Step 4 호출 부분만** — Step 0~3 부분 절대 수정 금지
9. **엑셀에 전체 과정 기록**
