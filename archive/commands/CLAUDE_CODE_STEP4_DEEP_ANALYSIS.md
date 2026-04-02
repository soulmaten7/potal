# Claude Code 명령어: Step 4 (Country Router) 심층 분석 + 10자리 정확도 개선

> **날짜**: 2026-03-21 KST
> **목표**: Step 4에서 10자리 코드를 고를 때 빠진 데이터/로직을 찾고, 7개국 세관 기준에 맞게 정확도를 높인다
> **배경**: Step 0~3은 100% 정확 (HS6). Step 4의 10자리 선택이 66% → WRONG_SUBCODE 19건. base-agent.ts의 단순 keyword scoring이 원인.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## Phase 1: 현재 Step 4가 사용하는 데이터 vs 사용 안 하는 데이터

### 1-1. 9-field 중 Step 4에서 사용/미사용 분석

`pipeline-v3.ts` Line 136~141에서 Step 4 호출:
```typescript
routeToCountry(
  step4.confirmed_hs6,       // ✅ 사용
  input.destination_country,  // ✅ 사용
  normalized,                 // ✅ 전달 — 하지만 아래 3개만 추출
  input.price,               // ✅ 전달 — 하지만 base-agent에서 안 씀
  input.product_name         // ✅ 전달 — 하지만 base-agent에서 안 씀
)
```

`step5-country-router.ts` Line 36~40에서 keywords 추출:
```typescript
const keywords = [
  ...normalized.material_keywords,      // ✅ 사용
  ...normalized.category_tokens,        // ✅ 사용
  ...normalized.description_tokens,     // ✅ 사용
].filter(Boolean);
```

**9-field 중 Step 4에서 사용 안 되는 것:**

| 필드 | Step 4 사용 여부 | 10자리 선택에 필요한 이유 |
|------|---------------|---------------------|
| `composition` | ❌ 안 씀 | US HTS 섬유 10자리는 "% cotton" vs "% polyester"로 구분 |
| `weight_spec` | ❌ 안 씀 | US HTS "not over 27.9cm" 같은 크기/무게 기준 |
| `price` | ❌ 전달만 됨, 실제 안 씀 | US HTS "valued not over $1 each" vs "valued over $5 each" |
| `processing` | ❌ 안 씀 | "knitted" vs "woven", "roasted" vs "raw" 구분 |
| `origin_country` | ❌ 안 씀 | 원산지별 다른 세율/코드 적용 |

**base-agent.ts에서 실제 사용하는 것: keywords(material+category+description 토큰) 뿐.**
price, productName은 파라미터로 받지만 코드에서 전혀 안 씀.

### 1-2. Step 0~3 결과 중 Step 4에 전달 안 되는 것

pipeline-v3.ts에서 Step 4를 호출할 때:

| Step 0~3 결과 | Step 4에 전달 여부 | 10자리 선택에 필요한 이유 |
|-------------|--------------|---------------------|
| `confirmed_section` | ❌ 안 전달 | Section별로 10자리 구분 기준이 다름 |
| `confirmed_chapter` | ❌ 안 전달 | Chapter별 세부 분류 기준 |
| `confirmed_heading` | ❌ 안 전달 | Heading 4자리가 있으면 10자리 후보 범위가 좁아짐 |
| `step3.heading_description` | ❌ 안 전달 | "T-shirts" vs "Undershirts" 구분 |
| `step3.matched_by` | ❌ 안 전달 | Heading 선택 근거 |
| `step4.hs6_description` | ❌ 안 전달 | 6자리 설명이 10자리 매칭 힌트가 됨 |
| `normalized.composition_parsed` | ❌ 안 전달 | 성분비 정보 |
| `normalized.is_alloy` | ❌ 안 전달 | 합금 여부 |

**핵심: Step 0~3에서 이미 파악한 상품 정보(어떤 상품인지, 소재가 뭔지, 가공 방식이 뭔지)를 Step 4가 전혀 활용 안 하고 있다.**

---

## Phase 2: 7개국 세관의 10자리 구분 기준 조사

### 2-1. 각 나라가 10자리를 어떤 기준으로 세분화하는지 조사

**gov_tariff_schedules에서 각 나라별 세분화 패턴 조사:**

```sql
-- US HTS: 주요 HS6별로 10자리 후보와 description 패턴 확인
-- 6912 (ceramic tableware) — 무엇으로 구분하는지
SELECT hs_code, description, indent FROM gov_tariff_schedules
WHERE country='US' AND hs_code LIKE '6912%' ORDER BY hs_code;

-- 6109 (t-shirts) — 무엇으로 구분하는지
SELECT hs_code, description, indent FROM gov_tariff_schedules
WHERE country='US' AND hs_code LIKE '6109%' ORDER BY hs_code;

-- 7013 (glassware) — 무엇으로 구분하는지
SELECT hs_code, description, indent FROM gov_tariff_schedules
WHERE country='US' AND hs_code LIKE '7013%' ORDER BY hs_code;

-- EU도 동일하게
SELECT hs_code, description, indent FROM gov_tariff_schedules
WHERE country='EU' AND hs_code LIKE '6912%' ORDER BY hs_code;
SELECT hs_code, description, indent FROM gov_tariff_schedules
WHERE country='EU' AND hs_code LIKE '6109%' ORDER BY hs_code;

-- 7개국 전체에서 description에 나타나는 세분화 키워드 패턴 분석
-- 가격 기준: "valued over/not over $X"
SELECT count(*) FROM gov_tariff_schedules WHERE country='US' AND description ILIKE '%valued%';
-- 성분 기준: "of cotton", "of polyester"
SELECT count(*) FROM gov_tariff_schedules WHERE country='US' AND description ILIKE '%of cotton%';
-- 크기 기준: "not over X cm"
SELECT count(*) FROM gov_tariff_schedules WHERE country='US' AND description ILIKE '%cm%';
-- 무게 기준: "kg", "g/m"
SELECT count(*) FROM gov_tariff_schedules WHERE country='US' AND description ILIKE '%kg%';
```

### 2-2. 국가별 세분화 기준 패턴 정리

조사 후 아래 표를 채울 것:

| 세분화 기준 | 필요한 9-field | US | EU | GB | KR | JP | AU | CA |
|-----------|-------------|----|----|----|----|----|----|-----|
| 소재 (of cotton/silk) | material, composition | ? | ? | ? | ? | ? | ? | ? |
| 가격 (valued over $X) | price | ? | ? | ? | ? | ? | ? | ? |
| 크기 (not over X cm) | weight_spec | ? | ? | ? | ? | ? | ? | ? |
| 무게 (X kg) | weight_spec | ? | ? | ? | ? | ? | ? | ? |
| 용도 (for food contact) | category, description | ? | ? | ? | ? | ? | ? | ? |
| 가공 (knitted/woven) | processing | ? | ? | ? | ? | ? | ? | ? |
| 원산지 (general note 15) | origin_country | ? | ? | ? | ? | ? | ? | ? |

---

## Phase 3: WRONG_SUBCODE 19건 원인 분석

### 3-1. POTAL_V3_REVIEW56_Verification.xlsx에서 19건 로드

각 건마다:
1. 파이프라인이 고른 코드 + description
2. 정답 코드 + description
3. **왜 틀렸는지** — 어떤 정보가 있었으면 맞출 수 있었는지

### 3-2. 19건을 세분화 기준별로 분류

| 세분화 기준 | 건수 | 예시 |
|-----------|------|------|
| 가격 기준 미적용 | X건 | wine glass "valued over $5 each" → price 필요 |
| 소재 세부 미적용 | X건 | ceramic mug → "earthenware" vs "porcelain" 구분 |
| 상품 유형 미적용 | X건 | "mugs" vs "plates" → heading description 필요 |
| 크기/무게 미적용 | X건 | "not over 27.9cm" → weight_spec 필요 |
| 기타 | X건 | |

### 3-3. 각 기준별로 어떤 9-field/Step 결과를 사용했어야 하는지 매핑

---

## Phase 4: base-agent.ts 개선 설계

### 4-1. 현재 base-agent.ts 문제점 정리

```
현재: keywords(material+category+description)만으로 description 매칭
→ "ceramic"이 있으면 모든 ceramic 후보에 동일 점수 → 잘못된 코드 선택
```

### 4-2. 개선 방안 설계 (코드 수정은 이 Phase에서는 설계만)

**추가 전달해야 할 데이터:**
- confirmed_heading (4자리) → 10자리 후보 범위 좁히기
- hs6_description → 6자리 설명으로 10자리 매칭
- composition_parsed → 성분비 매칭 ("of cotton" = 95% cotton)
- price → 가격 기준 매칭 ("valued over $5 each")
- weight_spec → 크기/무게 기준 매칭 ("not over 27.9cm")
- processing_states → 가공 방식 매칭 ("knitted" vs "woven")

**scoring 개선 방안:**
- 현재: keyword가 description에 포함되면 +2점
- 개선:
  1. heading_description과 candidate description의 semantic 유사도
  2. price 기준 후보 자동 필터링 (valued over/not over)
  3. composition 매칭 (% cotton → "of cotton" 후보 boost)
  4. weight_spec 매칭 (dimensions → "not over X cm" 후보 매칭)
  5. indent 활용 — US HTS는 indent 구조가 있으므로 가장 세부 indent 우선

---

## Phase 5: 추가 외부 데이터 필요 여부 확인

### 5-1. gov_tariff_schedules 데이터 완성도

```sql
-- 국가별 행수 + indent 분포
SELECT country, count(*), min(indent), max(indent), avg(indent)
FROM gov_tariff_schedules GROUP BY country;

-- US: indent별 행수 — 세부 10자리가 얼마나 있는지
SELECT indent, count(*) FROM gov_tariff_schedules
WHERE country='US' GROUP BY indent ORDER BY indent;

-- EU, GB도 동일
SELECT indent, count(*) FROM gov_tariff_schedules
WHERE country='EU' GROUP BY indent ORDER BY indent;
```

### 5-2. 7개국 정부 API에서 추가 데이터 필요한지

US HTS에서 확인한 것:
- `6912003510`: "Plates not over 27.9 cm; **teacups and saucers; mugs**" ← mugs가 이미 description에 있음!
- `6912004400`: "**Mugs** and other steins" ← 이것도 있음
- 파이프라인이 3510을 골랐는데 4400이 더 정확 → **scoring이 "mug" 키워드를 못 잡은 게 문제**

→ 이건 외부 데이터 문제가 아니라 **scoring 로직 문제**.

하지만:
- EU CN 코드의 세분화 기준이 다를 수 있음
- KR/JP/AU/CA는 indent 정보가 없을 수 있음
- 일부 국가는 tariff notes/additional notes가 필요할 수 있음

```sql
-- KR 데이터 구조 확인
SELECT * FROM gov_tariff_schedules WHERE country='KR' LIMIT 10;

-- JP, AU, CA도
SELECT country, hs_code, description FROM gov_tariff_schedules
WHERE country IN ('JP','AU','CA') AND hs_code LIKE '6109%' ORDER BY country, hs_code;
```

---

## Phase 6: 해결방안 도출 + 실행

### Phase 1~5 결과를 종합하여:

1. **base-agent.ts에 전달해야 할 추가 데이터 목록** (9-field + Step 결과)
2. **scoring 로직 개선안** — 어떤 기준으로 점수를 매길지
3. **외부 데이터 추가 수집 필요 여부** — 필요하면 어디서 가져올지
4. **코드 수정 범위** — 어떤 파일을 수정해야 하는지

### 수정 파일 후보:
- `steps/v3/step5-country-router.ts` — 추가 데이터 전달
- `country-agents/base-agent.ts` — scoring 로직 개선
- `steps/v3/pipeline-v3.ts` — Step 4 호출 시 추가 파라미터 전달
- `types.ts` — CountryAgentResult 또는 함수 시그니처 변경

### ⚠️ 이 Phase에서는 설계안만 작성. 코드 수정은 은태님 확인 후 별도 진행.

---

## Phase 7: 검증 재실행

개선 후:
- 기존 WRONG_SUBCODE 19건 재테스트
- 169건 전체 US HS10 벤치마크 재실행
- 기존 Amazon 50건 regression 확인 (Step 3까지 결과 안 바뀌는지)

---

## 결과물

### 엑셀: `POTAL_V3_Step4_Deep_Analysis.xlsx`

**Sheet 1: 9-field 사용 현황** — 필드별 Step 4에서 사용 여부 + 필요한 이유
**Sheet 2: Step 0~3 결과 전달 현황** — 전달 여부 + 필요한 이유
**Sheet 3: 7개국 세분화 기준** — 국가별 10자리 구분 기준 패턴
**Sheet 4: WRONG_SUBCODE 19건 원인** — 건별 원인 + 어떤 데이터가 있었으면 맞출 수 있었는지
**Sheet 5: 개선 설계안** — scoring 로직 + 추가 데이터 + 수정 파일 목록

시트 마감: `=== 작업 종료 === | 미사용 9-field X개 | 미전달 Step결과 X개 | 추가 데이터 필요 X건 | 개선안 X개`

---

## ⚠️ 절대 규칙

1. **Step 0~3 코드 절대 수정 금지** — 분석 대상은 Step 4~6만
2. **이 명령어에서 코드 수정은 하지 않는다** — 분석 + 설계안만. 은태님 확인 후 수정
3. **gov_tariff_schedules 실제 데이터를 기반으로 분석** — 추측 금지
4. **WRONG_SUBCODE 19건 전부 분석** — 일부만 하지 않는다
5. **7개국 전부 조사** — US만 하지 않는다
6. **psql**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
