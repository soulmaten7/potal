# Claude Code 명령어: v3 파이프라인 Step 4~6 구현

> **날짜**: 2026-03-21 KST
> **목표**: pipeline-v3.ts가 이미 import하고 호출하는 3개 파일을 생성하여 전체 파이프라인 완성
> **제약**: Step 0~3-2 코드 절대 수정 금지. 신규 3개 파일 생성 + npm run build 통과만.

---

## 현재 상황

`pipeline-v3.ts` (오케스트레이터)는 **이미 Step 4~6 코드가 완성되어 있다.**

```typescript
// pipeline-v3.ts Line 17~19: 이미 import 하고 있음
import { routeToCountry } from './step5-country-router';        // ← 파일 없음 ❌
import { applyPriceBreakV3 } from './step6-price-break';        // ← 파일 없음 ❌
import { finalResolveV3 } from './step7-final';                  // ← 파일 없음 ❌
```

**지금 npm run build 하면 이 3개 파일이 없어서 빌드 에러가 난다.**
아래 3개 파일만 정확히 생성하면 전체 파이프라인이 완성된다.

### types.ts — ✅ 이미 완성됨 (수정 불필요)
- `ClassifyInputV3`에 `destination_country?: string` 이미 있음 (Line 161)
- `V3PipelineResult`에 `final_hs_code`, `country_specific`, `price_break_applied` 등 이미 있음 (Line 240~252)
- `CountryAgentResult` 정의 있음 (Line 107~116)
- `NormalizedInputV3` 정의 있음 (Line 171~189)

---

## 📁 파일 1: `step5-country-router.ts` (Step 4: Country Router)

### 경로
```
app/lib/cost-engine/gri-classifier/steps/v3/step5-country-router.ts
```

### pipeline-v3.ts가 호출하는 정확한 코드 (Line 133~141)
```typescript
const step5 = await routeToCountry(
  step4.confirmed_hs6,       // string: "610910"
  input.destination_country,  // string | undefined: "US"
  normalized,                 // NormalizedInputV3 타입
  input.price,               // number | undefined
  input.product_name         // string
);
```

### pipeline-v3.ts가 사용하는 step5의 필드 (Line 143~148)
```typescript
step5.country_result              // CountryAgentResult | null
step5.country_result.nationalCode // string (예: "6109100012")
step5.country_result.method       // string (예: "keyword_match")
step5.country_result.confidence   // number (예: 0.85)
step5.destination_country         // string (예: "US")
step5.is_supported                // boolean (7개국이면 true)
```

### export 해야 하는 함수 시그니처
```typescript
export async function routeToCountry(
  hs6: string,
  destinationCountry: string | undefined,
  normalized: NormalizedInputV3,
  price?: number,
  productName?: string
): Promise<{
  country_result: CountryAgentResult | null;
  destination_country: string;
  is_supported: boolean;
}>
```

### 내부 로직
이미 완성된 `country-agents/index.ts`의 `routeToCountryAgent()` 호출:
```typescript
// country-agents/index.ts에 있는 함수 (이미 완성, 수정 금지)
export async function routeToCountryAgent(
  hs6: string,
  destinationCountry: string,  // "US", "EU", "GB", "KR", "JP", "AU", "CA" 중 하나
  keywords: string[],
  price?: number,
  productName?: string
): Promise<CountryAgentResult | null>
```

이 함수가 내부적으로 `base-agent.ts`의 `baseClassify()` 호출 → `gov_tariff_schedules` DB 테이블 조회 (89,842행).

**step5-country-router.ts 코드 작성 가이드:**
```
1. SUPPORTED_COUNTRIES = new Set(['US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA'])
2. destinationCountry 없으면 → { country_result: null, destination_country: 'UNKNOWN', is_supported: false }
3. 지원 안 하는 국가면 → { country_result: null, destination_country: country, is_supported: false }
4. 지원 국가면:
   - keywords = [...normalized.material_keywords, ...normalized.category_tokens, ...normalized.description_tokens].filter(Boolean)
   - result = await routeToCountryAgent(hs6, country, keywords, price, productName)
   - return { country_result: result, destination_country: country, is_supported: true }
5. try-catch: 에러 시 → { country_result: null, destination_country: country, is_supported: true }
```

### import 필요한 것
```typescript
import type { CountryAgentResult, NormalizedInputV3 } from '../../types';
import { routeToCountryAgent } from '../../country-agents';
```

---

## 📁 파일 2: `step6-price-break.ts` (Step 5: Price Break)

### 경로
```
app/lib/cost-engine/gri-classifier/steps/v3/step6-price-break.ts
```

### pipeline-v3.ts가 호출하는 정확한 코드 (Line 155~156)
```typescript
const codeForPriceBreak = step5.country_result?.nationalCode || step4.confirmed_hs6;
const step6 = await applyPriceBreakV3(codeForPriceBreak, input.price, input.destination_country);
//                                     ^^^string         ^^^number?  ^^^string?
```

### pipeline-v3.ts가 사용하는 step6의 필드 (Line 157~175)
```typescript
step6.price_break_applied   // boolean
step6.rule_description      // string | undefined
step6.final_hs_code         // string
step6.duty_rate             // number | undefined  ← ⚠️ Line 175: price_break_duty: step6.duty_rate
```

### export 해야 하는 함수 시그니처
```typescript
export async function applyPriceBreakV3(
  hsCode: string,
  price?: number,
  destinationCountry?: string
): Promise<{
  final_hs_code: string;
  price_break_applied: boolean;
  rule_description?: string;
  duty_rate?: number;
}>
```

### ⚠️ DB 테이블 구조 확인 필수 (이것부터 먼저 하라)
```sql
-- 1. 컬럼 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'hs_price_break_rules' ORDER BY ordinal_position;

-- 2. 전체 데이터 확인 (18건)
SELECT * FROM hs_price_break_rules ORDER BY hs_code;
```

기존 `step10-price-break.ts`에서 확인된 컬럼:
- `hs_code` (text) — 6자리 HS code
- `price_threshold` (numeric) — 가격 기준값
- `condition` (text) — 'over' 또는 'not_over'

**아직 확인 안 된 컬럼:**
- `target_hs_code` — 있으면 가격분기 시 이 코드로 교체, 없으면 교체 안 함
- `duty_rate` — 있으면 반환, 없으면 `undefined`
- `destination_country` — 있으면 국가별 필터링 가능

### 내부 로직
```
1. price 없거나 0 이하 → { final_hs_code: hsCode, price_break_applied: false }
2. Supabase 연결 (getSupabase 패턴)
3. hs_price_break_rules에서 hsCode.substring(0,6) 기준 조회
4. 규칙 매칭:
   - condition === 'over' && price > price_threshold → 매칭
   - condition === 'not_over' && price <= price_threshold → 매칭
5. 매칭 시:
   - target_hs_code 있으면 → final_hs_code = target_hs_code
   - target_hs_code 없으면 → final_hs_code = hsCode (그대로)
   - duty_rate 있으면 → 반환
   - rule_description = "Price $X > $threshold: condition"
6. 매칭 없으면 → { final_hs_code: hsCode, price_break_applied: false }
7. Supabase 없거나 에러 → { final_hs_code: hsCode, price_break_applied: false }
```

### Supabase 연결 패턴 (기존 코드와 동일)
```typescript
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
```

### 참고 파일
- `app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts` — 기존 구현 (candidates[] 배열 방식)

---

## 📁 파일 3: `step7-final.ts` (Step 6: Final Resolution)

### 경로
```
app/lib/cost-engine/gri-classifier/steps/v3/step7-final.ts
```

### pipeline-v3.ts가 호출하는 정확한 코드 (Line 168~178)
```typescript
const finalResult = finalResolveV3({
  hs6: step4.confirmed_hs6,                                     // string: "610910"
  hs6_description: step4.hs6_description,                        // string: "T-shirts, singlets..."
  confidence,                                                     // number: 0.85
  country_result: step5.country_result,                          // CountryAgentResult | null
  price_break_applied: step6.price_break_applied,                // boolean
  price_break_code: step6.price_break_applied ? step6.final_hs_code : undefined,  // string | undefined
  price_break_duty: step6.duty_rate,                             // number | undefined
  ai_call_count: 0,                                              // number (v3에서는 항상 0)
  start_time: startTime,                                         // number (Date.now() 타임스탬프)
});
```

### pipeline-v3.ts가 사용하는 finalResult의 필드 (Line 179~204)
```typescript
finalResult.final_hs_code       // string (예: "6109100012" 또는 "610910")
finalResult.hs_code_precision   // 'HS10' | 'HS8' | 'HS6'
finalResult.confidence          // number
finalResult.country_specific    // 아래 객체 또는 null
  // { country: string, national_code: string, duty_rate?: number, additional_duties?: string[], method: string }
finalResult.price_break_applied // boolean
finalResult.ai_call_count       // number
finalResult.processing_time_ms  // number
```

### export 해야 하는 함수 시그니처
```typescript
export function finalResolveV3(input: {
  hs6: string;
  hs6_description: string;
  confidence: number;
  country_result: CountryAgentResult | null;
  price_break_applied: boolean;
  price_break_code?: string;
  price_break_duty?: number;
  ai_call_count: number;
  start_time: number;
}): {
  final_hs_code: string;
  hs_code_precision: 'HS10' | 'HS8' | 'HS6';
  confidence: number;
  country_specific: {
    country: string;
    national_code: string;
    duty_rate?: number;
    additional_duties?: string[];
    method: string;
  } | null;
  price_break_applied: boolean;
  ai_call_count: number;
  processing_time_ms: number;
}
```

### 내부 로직 — 우선순위
```
1. 기본값 세팅
   - final_hs_code = hs6
   - hs_code_precision = 'HS6'

2. Country Agent 결과 적용 (country_result !== null 이면)
   - final_hs_code = country_result.nationalCode
   - hs_code_precision = 코드 길이 기준:
     - .replace(/\./g, '').length >= 10 → 'HS10'
     - >= 8 → 'HS8'
     - else → 'HS6'

3. Price Break 오버라이드 (price_break_applied === true && price_break_code 있으면)
   - final_hs_code = price_break_code
   - hs_code_precision = 코드 길이 재계산

4. confidence 계산
   - country_result 있으면: Math.min(input.confidence, country_result.confidence)
   - 없으면: input.confidence

5. country_specific 조합
   - country_result 있으면:
     {
       country: country_result.nationalCode.length > 6 ? 'determined' : 'default',
       national_code: country_result.nationalCode,
       duty_rate: price_break_duty가 있으면 price_break_duty, 없으면 country_result.dutyRate,
       additional_duties: country_result.additionalDuties,
       method: country_result.method
     }
   - 없으면: null

6. processing_time_ms = Date.now() - start_time

7. ai_call_count = input.ai_call_count + (country_result?.aiCallCount || 0)
```

### import 필요한 것
```typescript
import type { CountryAgentResult } from '../../types';
```

### 참고 파일
- `app/lib/cost-engine/gri-classifier/steps/step11-final-resolve.ts` — 기존 구현

---

## 실행 순서 체크리스트

```
□ 1. DB 구조 확인 — hs_price_break_rules 컬럼 + 전체 데이터 18건 조회
□ 2. step5-country-router.ts 생성 — routeToCountry 함수
□ 3. step6-price-break.ts 생성 — applyPriceBreakV3 함수 (DB 구조에 맞게)
□ 4. step7-final.ts 생성 — finalResolveV3 함수 (순수 로직, DB 호출 없음)
□ 5. npm run build — 0 errors 확인
□ 6. 빌드 에러 있으면 수정 후 재빌드
□ 7. 테스트 5개 실행:
     - Cotton T-Shirt → US (10자리 기대)
     - Steel Water Bottle → KR (한국 코드 기대)
     - Leather Watch Strap → dest 없음 (6자리 기대)
     - Frozen Shrimp → BR (6자리, 비지원국)
     - Ceramic Tableware → US + price $200 (가격분기 확인)
□ 8. 엑셀에 전체 결과 기록
```

---

## ⚠️ 절대 규칙

1. **pipeline-v3.ts 수정 금지** — 이미 완성됨. 한 글자도 건드리지 않는다
2. **Step 0~3-2 파일 수정 금지** — step0-input.ts ~ step4-subheading.ts
3. **types.ts 수정 불필요** — 모든 타입 이미 정의됨
4. **country-agents/ 수정 금지** — 7개 agent + base + index 이미 완성
5. **3개 파일만 생성**: step5-country-router.ts, step6-price-break.ts, step7-final.ts
6. **pipeline-v3.ts의 함수 호출 시그니처를 정확히 맞춰야 한다** — 위에 적은 입력/출력 필드가 하나라도 빠지면 빌드 에러

---

## 엑셀 로깅

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

**파일 위치**: Mac portal 폴더 (이미 생성됨)

**시트 생성 규칙**: 작업 시작 시 새 시트, 이름 = `YYMMDDHHMM` (예: 2603211500)

**열**: A 순번 | B 시간 | C 구분(COMMAND/RESULT/ANALYSIS/DECISION/ERROR/FIX) | D 상세 내용 | E 파일 경로 | F 상태

**기록 대상**:
- DB 쿼리 결과 (hs_price_break_rules 구조 + 전체 데이터)
- 파일 생성 시 전체 코드
- npm run build 출력 (에러 메시지 포함)
- 테스트 5개 전체 출력 (decision_path 전체)
- 수정한 게 있으면 변경 전/후

시트 마지막: `=== 작업 종료 === | 총 소요시간 | 빌드 결과 | 테스트 X/5 PASS | 생성 파일 수`
