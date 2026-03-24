# Claude Code 명령어: Step 4-6 전체 데이터 & 코드 감사 + 수정

> **날짜**: 2026-03-21 KST
> **목표**: Step 4~6이 의존하는 모든 DB 데이터 + 코드를 점검하고, 불완전한 부분을 수정
> **제약**: Step 0~3 절대 수정 금지. Step 4~6 관련 파일 + DB 데이터만 대상.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM` (예: `2603211500`)
- **열**: A:순번 | B:시간 | C:구분(COMMAND/RESULT/ANALYSIS/DECISION/ERROR/FIX) | D:상세내용 | E:파일경로 | F:상태
- **디테일**: 명령어 그대로, 결과 전체, DB 쿼리는 쿼리문+행수+샘플5건, 수정은 변경전/후
- **시트 마감**: `=== 작업 종료 === | 소요시간 | 빌드 | 테스트 | 생성/수정 파일`

---

## 발견된 문제 현황 (Cowork에서 사전 조사 완료)

### 문제 1: gov_tariff_schedules — 세율 데이터 불완전

| 국가 | 행수 | duty_rate_pct 있음 | duty_rate_pct NULL | duty_rate_text 있음 |
|------|------|-------------------|-------------------|-------------------|
| AU | 6,652 | 6,652 (100%) ✅ | 0 | 6,652 ✅ |
| CA | 6,626 | 6,626 (100%) ✅ | 0 | 6,626 ✅ |
| JP | 6,633 | 6,633 (100%) ✅ | 0 | 6,633 ✅ |
| KR | 6,646 | 6,646 (100%) ✅ | 0 | 6,646 ✅ |
| US | 28,718 | 12,771 (44%) | 15,947 (56%) ❌ | 13,835 |
| EU | 17,278 | 0 (0%) | 17,278 (100%) ❌❌ | 0 ❌❌ |
| GB | 17,289 | 0 (0%) | 17,289 (100%) ❌❌ | 0 ❌❌ |

**EU/GB**: 세율 텍스트도, 숫자도 전부 비어있음. 세율 데이터가 아예 없음.
**US**: 44%만 숫자 파싱됨. "1.5¢/kg" 같은 비율 아닌 형식은 파싱 안 됨. "Free" → 0으로는 파싱됨.

### 문제 2: base-agent.ts — 컬럼명 수정은 완료

이전 세션에서 `duty_rate` → `duty_rate_pct`로 3곳 수정 완료. 빌드 통과.
하지만 **duty_rate_pct가 null이면 dutyRate: undefined가 반환**되므로, 데이터가 없으면 코드 수정만으로는 의미 없음.

### 문제 3: hs_price_break_rules — 구조 확인 필요

18건 전부 US만 해당. 컬럼 구조:
`parent_hs_code, hs10_under, hs10_over, threshold_value, duty_rate_under, duty_rate_over, description_under, description_over`

step6-price-break.ts가 이 구조에 맞게 코딩되어 있는지 확인 필요.

---

## Phase 1: 전체 데이터 감사

### 1-1. gov_tariff_schedules 전체 분석

```sql
-- 국가별 세율 현황 (위 표 재확인)
SELECT country,
  count(*) as total,
  count(duty_rate_pct) as has_pct,
  count(*) - count(duty_rate_pct) as null_pct,
  count(CASE WHEN length(duty_rate_text) > 0 THEN 1 END) as has_text
FROM gov_tariff_schedules GROUP BY country ORDER BY country;

-- US: duty_rate_text가 있는데 duty_rate_pct가 null인 행 (파싱 가능한 것)
SELECT duty_rate_text, count(*)
FROM gov_tariff_schedules
WHERE country = 'US' AND duty_rate_pct IS NULL AND length(duty_rate_text) > 0
GROUP BY duty_rate_text ORDER BY count(*) DESC LIMIT 20;

-- US: duty_rate_text 형식별 분포 (%, ¢/kg, Free 등)
SELECT
  CASE
    WHEN duty_rate_text LIKE '%\%%' THEN 'percent'
    WHEN duty_rate_text LIKE '%¢%' THEN 'cents_per_unit'
    WHEN duty_rate_text = 'Free' THEN 'free'
    WHEN length(duty_rate_text) = 0 THEN 'empty'
    ELSE 'other'
  END as rate_type,
  count(*)
FROM gov_tariff_schedules WHERE country = 'US'
GROUP BY rate_type ORDER BY count(*) DESC;

-- EU: description만 있고 세율이 전부 비어있는 이유 파악
SELECT hs_code, description, duty_rate_text, duty_rate_pct, special_rates, source
FROM gov_tariff_schedules WHERE country = 'EU' LIMIT 10;

-- GB: 마찬가지
SELECT hs_code, description, duty_rate_text, duty_rate_pct, special_rates, source
FROM gov_tariff_schedules WHERE country = 'GB' LIMIT 10;
```

**분석 후 결정할 것:**
1. US의 나머지 56% — `duty_rate_text`에서 파싱할 수 있는가? (예: "16.5%" → 16.5)
2. EU/GB — 어디서 세율을 가져와야 하는가? (EU TARIC API? UK Trade Tariff API?)
3. "1.5¢/kg" 같은 종량세(specific duty) — 숫자로 변환 가능한가? (물량 모르면 불가)

### 1-2. hs_price_break_rules 전체 감사

```sql
-- 전체 18건 조회 + 구조 확인
SELECT * FROM hs_price_break_rules ORDER BY parent_hs_code;

-- 컬럼 타입 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'hs_price_break_rules' ORDER BY ordinal_position;
```

### 1-3. gri_classification_cache 상태

```sql
-- 캐시 테이블 존재 여부 + 행 수
SELECT count(*) FROM gri_classification_cache;

-- 캐시에 잘못된 HS6-only 결과가 저장되어 있을 수 있음 → 확인
SELECT cache_key, product_name, material,
  result->>'confirmed_hs6' as hs6,
  result->>'final_hs_code' as final_code,
  result->>'hs_code_precision' as precision
FROM gri_classification_cache LIMIT 10;
```

---

## Phase 2: 코드 감사 (Step 4~6 관련 파일 전부)

### 2-1. 파일 목록 (전부 읽고 검토)

```
# Step 4 Country Router
app/lib/cost-engine/gri-classifier/steps/v3/step5-country-router.ts
app/lib/cost-engine/gri-classifier/country-agents/base-agent.ts     ← 이미 수정됨
app/lib/cost-engine/gri-classifier/country-agents/index.ts
app/lib/cost-engine/gri-classifier/country-agents/us-agent.ts
app/lib/cost-engine/gri-classifier/country-agents/eu-agent.ts
app/lib/cost-engine/gri-classifier/country-agents/uk-agent.ts
app/lib/cost-engine/gri-classifier/country-agents/kr-agent.ts
app/lib/cost-engine/gri-classifier/country-agents/jp-agent.ts
app/lib/cost-engine/gri-classifier/country-agents/au-agent.ts
app/lib/cost-engine/gri-classifier/country-agents/ca-agent.ts

# Step 5 Price Break
app/lib/cost-engine/gri-classifier/steps/v3/step6-price-break.ts

# Step 6 Final
app/lib/cost-engine/gri-classifier/steps/v3/step7-final.ts

# 오케스트레이터
app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3.ts

# 타입
app/lib/cost-engine/gri-classifier/types.ts
```

### 2-2. 각 파일에서 확인할 것

**base-agent.ts:**
- `.select()` 쿼리의 컬럼명이 실제 DB와 일치하는지 (duty_rate_pct ✅ 이미 수정)
- `duty_rate_pct`가 null일 때 처리 로직이 올바른지
- `hs_code` LIKE 쿼리 형식이 DB 저장 형식과 맞는지 (점 없는 숫자 형식 확인)

**7개 country agent (us/eu/uk/kr/jp/au/ca-agent.ts):**
- 각 agent가 `baseClassify()`를 올바르게 호출하는지
- 국가별 특수 로직이 있는지 (예: EU는 8자리, US는 10자리)
- countryCode 파라미터가 DB의 `country` 컬럼 값과 일치하는지 (예: UK agent가 'GB'로 조회하는지 'UK'로 조회하는지)

**step5-country-router.ts:**
- `routeToCountry()` 반환값이 pipeline-v3.ts가 기대하는 구조와 정확히 일치하는지
- keywords 조합이 올바른지 (material + category + description tokens)

**step6-price-break.ts:**
- DB 컬럼명 일치 확인: `parent_hs_code`, `hs10_under`, `hs10_over`, `threshold_value`, `duty_rate_under`, `duty_rate_over`
- 가격 비교 로직: price > threshold → hs10_over, price <= threshold → hs10_under
- 반환값이 pipeline-v3.ts가 기대하는 구조와 일치하는지 (final_hs_code, price_break_applied, rule_description, duty_rate)

**step7-final.ts:**
- Country Router null (233개국) 처리
- Country Router 결과 + Price Break 결과 조합 우선순위
- confidence 계산 로직
- country_specific 객체 구조가 V3PipelineResult 타입과 일치하는지

**pipeline-v3.ts:**
- Step 4/5/6 호출 순서
- 변수 전달 (step5 → step6 → finalResult)
- 결과 빌드 시 모든 필드가 채워지는지

### 2-3. 코드 ↔ DB 교차 검증

각 파일에서 DB를 조회하는 부분마다:
1. 쿼리하는 **테이블명** 확인
2. `.select()`의 **컬럼명**이 실제 DB 컬럼과 일치하는지
3. `.eq()`, `.like()` 등의 **필터 조건**이 데이터 형식에 맞는지
4. 반환값에서 접근하는 **필드명**이 실제 쿼리 결과와 일치하는지

---

## Phase 3: 수정 사항 결정 + 실행

Phase 1~2 결과를 바탕으로 수정할 것들을 정리하고 실행.

### 예상되는 수정 사항:

**데이터 수정:**
1. US: `duty_rate_text`가 "XX%" 형식인데 `duty_rate_pct`가 null인 행 → 파싱하여 UPDATE
2. US: "Free" → duty_rate_pct = 0 확인 (이미 처리된 것 같지만 재확인)
3. US: "1.5¢/kg" 같은 종량세 → 당장은 null 유지 (물량 정보 없으면 변환 불가)
4. EU/GB: 세율 데이터 소스 확인 → 별도 수집 작업이 필요한지 판단 (이 명령어에서 수집까지 하지 않을 수 있음)

**코드 수정 (발견 시):**
1. DB 컬럼명 불일치 → 코드 수정
2. Country agent의 country code 불일치 → 수정
3. step6-price-break.ts가 DB 구조와 안 맞으면 → 수정
4. null/undefined 처리 누락 → 방어 코드 추가

### 수정 후:
```bash
# 빌드 확인
npm run build

# 테스트 5개 재실행 (Supabase SERVICE_ROLE_KEY 사용)
# Cotton T-Shirt → US (HS8/HS10 + duty 기대)
# Steel Bottle → KR (HS6 + duty 기대)
# Watch Strap → 없음 (HS6, country=null)
# Shrimp → BR (HS6, unsupported)
# Ceramic → US + $200 (HS10 + duty + price break 확인)
```

---

## Phase 4: 최종 보고

### 엑셀에 기록할 최종 요약:

1. **데이터 품질 보고서**: 7개국별 세율 완성도 (수정 전 → 수정 후)
2. **코드 감사 결과**: 파일별 발견 이슈 + 수정 내역
3. **테스트 결과**: 5개 상품 전체 decision_path 포함
4. **남은 작업**: EU/GB 세율 수집 등 이 세션에서 못 끝낸 것

### 시트 마감:
```
=== 작업 종료 === | 총 소요시간 | 빌드 결과 | 테스트 X/5 PASS | 수정파일 N개 | DB UPDATE N행
```
