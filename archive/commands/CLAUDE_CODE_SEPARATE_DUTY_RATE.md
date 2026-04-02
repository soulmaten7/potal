# Claude Code 명령어: gov_tariff_schedules에서 세율 분리 → macmap 별도 조회로 리팩토링

> **날짜**: 2026-03-21 KST
> **목표**: base-agent.ts에서 duty_rate 조회를 제거하고, 최종 HS code 확정 후 macmap 테이블에서 세율을 별도 조회하는 구조로 변경
> **원칙**: gov_tariff_schedules = HS code 확장 전용, macmap = 세율 조회 전용. 역할 분리.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **디테일**: 명령어 그대로, 결과 전체, DB 쿼리→쿼리문+행수+샘플, 수정→변경전/후
- **시트 마감**: `=== 작업 종료 ===`

---

## 현재 구조 (문제)

```
Step 4 Country Router
  → base-agent.ts
    → gov_tariff_schedules에서 hs_code + description + duty_rate_pct 같이 조회
    → CountryAgentResult에 dutyRate 포함하여 반환

Step 6 Final
  → step7-final.ts
    → country_result.dutyRate를 그대로 최종 결과에 넣음
```

**문제**: gov_tariff_schedules의 duty_rate_pct가 US 44%, EU 99.4%, GB 99.4%만 있음. 세율이 없는 행은 dutyRate: undefined. 그리고 gov_tariff_schedules는 원래 **코드 확장**이 목적이지 **세율 테이블**이 아님.

## 변경 후 구조 (목표)

```
Step 4 Country Router
  → base-agent.ts
    → gov_tariff_schedules에서 hs_code + description만 조회 (duty_rate_pct 제거)
    → CountryAgentResult에 dutyRate 없이 반환

Step 6 Final
  → step7-final.ts에서 최종 HS code 확정 후
    → lookupDutyRate() 함수 호출
    → macmap_ntlc_rates / macmap_min_rates에서 세율 조회
    → 결과에 duty_rate 포함
```

---

## Phase 1: base-agent.ts 수정 (duty_rate 제거)

### 파일: `app/lib/cost-engine/gri-classifier/country-agents/base-agent.ts`

### 수정 사항 (4곳):

**1. Line 40: .select() 에서 duty_rate_pct 제거**
```typescript
// 변경 전:
.select('hs_code, description, duty_rate_pct')

// 변경 후:
.select('hs_code, description')
```

**2. Line 64: 단일 결과에서 dutyRate 제거**
```typescript
// 변경 전:
return {
  nationalCode: code,
  codePrecision: code.length,
  description: row.description || '',
  dutyRate: typeof row.duty_rate_pct === 'number' ? row.duty_rate_pct : undefined,
  confidence: 0.9,
  method: 'exact_match',
  aiCallCount: 0,
};

// 변경 후:
return {
  nationalCode: code,
  codePrecision: code.length,
  description: row.description || '',
  confidence: 0.9,
  method: 'exact_match',
  aiCallCount: 0,
};
```

**3. Line 86~91: 다중 결과 매핑에서 dutyRate 제거**
```typescript
// 변경 전:
return {
  code,
  description: String(row.description || ''),
  dutyRate: typeof row.duty_rate_pct === 'number' ? row.duty_rate_pct : undefined,
  score,
};

// 변경 후:
return {
  code,
  description: String(row.description || ''),
  score,
};
```

**4. Line 109, 121: otherEntry.dutyRate, best.dutyRate 제거**
```typescript
// 변경 전:
dutyRate: otherEntry.dutyRate,
dutyRate: best.dutyRate,

// 변경 후:
// 이 두 줄 삭제
```

---

## Phase 2: 세율 조회 함수 신규 생성

### 파일: `app/lib/cost-engine/gri-classifier/steps/v3/duty-rate-lookup.ts` (신규)

최종 HS code를 받아서 macmap 테이블에서 세율을 조회하는 함수.

### DB 테이블 정보:

**macmap_ntlc_rates** (537,894행, MFN 세율):
```sql
-- 테이블 구조 먼저 확인할 것
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'macmap_ntlc_rates' ORDER BY ordinal_position;

-- EU의 610910 세율 예시 확인
SELECT * FROM macmap_ntlc_rates
WHERE reporter = 'EU' AND hs_code LIKE '6109%'
LIMIT 5;

-- 컬럼명 확인: reporter(국가), hs_code(HS코드), rate_pct(세율) 같은 이름일 것
```

**⚠️ 반드시 DB 구조를 먼저 확인하고 코드를 작성할 것.**
macmap_ntlc_rates의 정확한 컬럼명을 모르면 코드가 또 깨짐.

### 함수 설계:

```typescript
/**
 * 최종 HS code로 macmap에서 MFN 세율을 조회
 *
 * 조회 순서:
 * 1. macmap_ntlc_rates에서 destination_country + hs_code 매칭
 * 2. 정확한 코드가 없으면 HS6으로 fallback 조회
 * 3. 그래도 없으면 undefined 반환
 */
export async function lookupDutyRate(
  hsCode: string,
  destinationCountry?: string
): Promise<{ duty_rate_pct?: number; duty_rate_text?: string; source: string } | null>
```

### 조회 로직:
```
1. destinationCountry 없으면 → null (세율 조회 불가)
2. macmap_ntlc_rates에서 reporter = destinationCountry AND hs_code = hsCode(앞6자리) 조회
3. 결과 있으면 → { duty_rate_pct, source: 'macmap_ntlc' }
4. 없으면 → macmap_min_rates에서 같은 조건 조회 (최저 세율)
5. 그래도 없으면 → null
```

### 국가 코드 매핑 주의:
- gov_tariff_schedules: country = 'US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA'
- macmap_ntlc_rates: reporter = ??? (확인 필요 — 'EU'인지 'EUN'인지, 'GB'인지 'GBR'인지)

```sql
-- macmap_ntlc_rates의 reporter 값 확인
SELECT DISTINCT reporter FROM macmap_ntlc_rates WHERE reporter IN ('US','USA','EU','EUN','GB','GBR','KR','KOR','JP','JPN','AU','AUS','CA','CAN') LIMIT 20;
```

---

## Phase 3: step7-final.ts 수정 (세율 조회 통합)

### 파일: `app/lib/cost-engine/gri-classifier/steps/v3/step7-final.ts`

### 수정 사항:

**1. lookupDutyRate import 추가**
```typescript
import { lookupDutyRate } from './duty-rate-lookup';
```

**2. finalResolveV3을 async로 변경** (DB 조회가 추가되므로)
```typescript
// 변경 전:
export function finalResolveV3(params: { ... }): FinalResolveOutput {

// 변경 후:
export async function finalResolveV3(params: { ... }): Promise<FinalResolveOutput> {
```

**3. 최종 HS code 확정 후 세율 조회 추가**
```typescript
// 기존 코드에서 finalCode가 확정된 후 (Line 61 이후):

// 세율 조회 (macmap에서)
const dutyLookup = await lookupDutyRate(finalCode, params.destination_country);
if (dutyLookup?.duty_rate_pct !== undefined) {
  dutyRate = dutyLookup.duty_rate_pct;
}
```

**4. params에 destination_country 추가**

step7-final.ts의 params 타입에 `destination_country?: string` 추가.

**⚠️ pipeline-v3.ts도 수정 필요:**
finalResolveV3 호출 시 `destination_country: input.destination_country` 전달.
그리고 finalResolveV3가 async가 되었으므로 `await` 추가.

### pipeline-v3.ts 수정:
```typescript
// 변경 전 (Line 168):
const finalResult = finalResolveV3({

// 변경 후:
const finalResult = await finalResolveV3({
```

그리고 params에 추가:
```typescript
const finalResult = await finalResolveV3({
  hs6: step4.confirmed_hs6,
  hs6_description: step4.hs6_description,
  confidence,
  country_result: step5.country_result,
  price_break_applied: step6.price_break_applied,
  price_break_code: step6.price_break_applied ? step6.final_hs_code : undefined,
  price_break_duty: step6.duty_rate,
  ai_call_count: 0,
  start_time: startTime,
  destination_country: input.destination_country,  // ← 추가
});
```

---

## Phase 4: step6-price-break.ts 확인

step6-price-break.ts는 `hs_price_break_rules` 테이블에서 `duty_rate_under`, `duty_rate_over`를 가져옴.
이건 price break 전용 세율이므로 macmap과 별개. **그대로 유지.**

다만 step6의 `duty_rate`가 pipeline-v3.ts Line 175에서 `price_break_duty`로 전달됨.
이것도 **그대로 유지** — price break 세율은 gov_tariff_schedules가 아니라 hs_price_break_rules에서 오는 거라 분리 대상 아님.

---

## Phase 5: CountryAgentResult 타입 정리

### 파일: `app/lib/cost-engine/gri-classifier/types.ts`

`CountryAgentResult`의 `dutyRate?: number` 필드:
- base-agent.ts에서 더 이상 채우지 않으므로 항상 undefined
- 하지만 필드 자체를 삭제하면 step7-final.ts Line 48 (`params.country_result.dutyRate`) 등 참조하는 곳이 깨짐

**결정**: `dutyRate` 필드는 유지하되, base-agent.ts에서 채우지 않음 → 항상 undefined.
step7-final.ts에서는 macmap lookupDutyRate로 대체.

나중에 정리할 때 `dutyRate` 필드를 완전히 제거할 수 있지만, 이번 리팩토링에서는 안전하게 유지.

---

## Phase 6: 빌드 + 테스트

```bash
npm run build  # 0 errors 확인
```

### 테스트 5개 (Supabase SERVICE_ROLE_KEY 사용):

```typescript
// 1. Cotton T-Shirt → US: HS10 확장 + macmap에서 세율 조회
{
  product_name: 'Cotton T-Shirt',
  material: 'cotton',
  origin_country: 'CN',
  destination_country: 'US',
  category: 'clothing',
  price: 15,
}
// 기대: final_hs_code = 8~10자리, duty_rate = macmap에서 가져온 값

// 2. Cotton T-Shirt → EU: macmap에서 EU 세율
{
  product_name: 'Cotton T-Shirt',
  material: 'cotton',
  origin_country: 'CN',
  destination_country: 'EU',  // ← EU도 테스트
  category: 'clothing',
  price: 15,
}

// 3. Steel Bottle → KR
// 4. Watch Strap → dest 없음 (세율 조회 안 함)
// 5. Ceramic → US + $200 (price break + macmap 세율)
```

### 검증 기준:
- Country Router가 dutyRate 없이 nationalCode만 반환하는지
- step7-final에서 macmap lookupDutyRate가 세율을 정상 반환하는지
- 세율이 country_specific.duty_rate에 들어있는지
- macmap에 데이터가 없는 경우 duty_rate: undefined로 정상 처리되는지

---

## 수정 파일 요약

| 파일 | 동작 | 내용 |
|------|------|------|
| base-agent.ts | 수정 | duty_rate_pct 조회 + 반환 제거 (4곳) |
| duty-rate-lookup.ts | **신규** | macmap에서 세율 조회 함수 |
| step7-final.ts | 수정 | async 전환 + lookupDutyRate 호출 추가 + destination_country 파라미터 추가 |
| pipeline-v3.ts | 수정 | finalResolveV3에 await 추가 + destination_country 전달 |
| types.ts | 수정 없음 | dutyRate 필드 유지 (optional이라 영향 없음) |

---

## ⚠️ 절대 규칙

1. **Step 0~3 코드 절대 수정 금지**
2. **base-agent.ts에서 duty_rate_pct 관련만 제거. hs_code/description 조회 로직은 건드리지 않는다**
3. **macmap_ntlc_rates 테이블 구조를 DB에서 먼저 확인 후 코드 작성**
4. **macmap reporter 국가 코드 형식 확인 필수** (2자리 vs 3자리)
5. **pipeline-v3.ts의 기존 Step 0~3 부분은 수정 금지. Step 6 Final 호출 부분만 수정**
