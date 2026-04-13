# CW31 — 정직한 리셋: 홈페이지 데모를 실제 엔진에 직결

**작성일**: 2026-04-10 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**예상 소요**: 1~2일 (실제 연결 + 전 시나리오 재검증 포함)
**전제조건**: CW30-HF4 배포 완료 상태 (main 브랜치, 475 pages ✓)

---

## 🧭 배경 — 왜 CW31이 필요한가

CW24 Sprint 2에서 만든 홈페이지 데모(`/api/demo/scenario`)는 실제 엔진을 호출하지 않고, **정적 JSON 베이스라인 + 가격 비율 스케일링** 으로 결과를 만들어 왔다. Phase 1 (2026-04-10) 실사용자 테스트에서 다음 버그가 모두 같은 뿌리에서 나오는 것이 확인됐다:

| # | 시나리오 | 버그 | 근본 원인 |
|---|---------|-----|----------|
| 1 | seller (KR→US, leather wallet) | 총액 $79.38 (실제 $50.83), duty 32% (실제 KORUS 0%) | `applyInputsToResult`가 origin/destination 무시, baseline이 중국발 고관세 가정 |
| 2 | seller | "Chinese Section 301" 경고가 한국산에도 표시 | `mock-results.ts`의 하드코딩 notes |
| 3 | d2c (KR→US) | 통화 기호 ₩, quantity=500 무시 | baseline 통화 필드 미교체, quantity 스케일링 누락 |
| 4 | d2c | "Korea-EU FTA" 가 US 목적지에도 표시 | `extras.ftaName` 하드코딩 |
| 5 | 전체 | Country dropdown 10개 한정 | `COUNTRY_OPTIONS` 하드코딩 |
| 6 | 전체 | DevPanel 코드 snippet이 입력값 반영 안 됨 | 코드가 템플릿 리터럴이 아닌 정적 문자열 |

**핵심 증거** — `app/api/demo/scenario/route.ts` 라인 74~108:

```ts
function applyInputsToResult(baseline, inputs) {
  const value = Number(inputs.value ?? inputs.declaredValue ?? baseline.landedCost.productValue);
  if (!Number.isFinite(value) || value <= 0 || value === baseline.landedCost.productValue) return baseline;
  const ratio = value / baseline.landedCost.productValue;
  // ⚠️ origin, destinationCountry, quantity, material 완전 무시
  return {
    ...baseline,
    landedCost: {
      ...baseline.landedCost,
      productValue: round2(value),
      duty: round2(baseline.landedCost.duty * ratio),
      taxes: round2(baseline.landedCost.taxes * ratio),
      // ...
    },
  };
}
```

이 함수는 **가격만** 비율로 늘리고, 사용자가 바꾼 출발지/도착지/수량/품목은 전혀 반영하지 않는다. 즉 홈페이지 데모는 실질적으로 "고정된 시연 카드"이고, "POTAL은 실제로 계산할 줄 아는 엔진"이라는 주장과 일치하지 않는 상태였다.

**다행인 점** — POTAL 본체(`/api/v1/calculate`, `app/lib/cost-engine/GlobalCostEngine.ts`)는 이미 제대로 작동하고 있다. `calculateGlobalLandedCostAsync()` 함수 하나만 데모 route에서 직접 호출하면 모든 버그가 사라진다. **새로 만들 엔진은 없다. 연결만 바꾼다.**

---

## 🎯 목적

1. `/api/demo/scenario` 의 "가격 스케일링" 로직을 제거하고 **실제 cost engine 직접 호출**
2. 하드코딩된 FTA/경고/통화 제거 → 엔진이 돌려주는 값 그대로 렌더
3. DevPanel 코드 snippet을 **입력값이 반영되는 템플릿 리터럴**로 교체
4. Country dropdown 확장 (10 → `lib/data/countries-iso3166.ts` 기반 전체 목록)
5. d2c quantity 필드가 실제 `quantity` 로 엔진에 전달되게
6. **CLAUDE.md 에 CW 번호 증가 규칙 1줄 추가** (아키텍처 변경/Phase 전환/7일 경과 시 증가)

---

## 📂 수정 대상 파일 (총 6개)

| # | 파일 | 변경 성격 |
|---|------|----------|
| 1 | `app/api/demo/scenario/route.ts` | 리팩터 (핵심) — cache scaling 삭제, 실제 엔진 직결 |
| 2 | `lib/scenarios/live-baseline.json` | **삭제** |
| 3 | `lib/scenarios/live-baseline.ts` | **삭제** |
| 4 | `components/home/NonDevPanel.tsx` | country dropdown 확장 + quantity 전달 |
| 5 | `components/home/DevPanel.tsx` | 코드 snippet 템플릿 리터럴화 |
| 6 | `CLAUDE.md` | 헤더 날짜 + CW 번호 증가 규칙 1줄 추가 |

**절대 건드리지 말 것**:
- ❌ `app/api/v1/calculate/route.ts` (본체 API, 인증 요구)
- ❌ `app/lib/cost-engine/` (엔진 내부, 검증 완료된 로직)
- ❌ `lib/search/`, `lib/agent/`, `components/search/` (B2C 보호 규칙)
- ❌ `components/home/ScenarioPanel.tsx` (HF2/HF4 유지)
- ❌ `components/custom/CustomBuilder.tsx` (HF3/HF4 유지)
- ❌ `components/home/ScenarioSelector.tsx` (HF1/HF2 유지)

---

## ✏️ 작업 1 — `/api/demo/scenario/route.ts` 리라이트 (핵심)

### 1-1. Import 교체

```ts
// 삭제
import { getLiveBaseline } from '@/lib/scenarios/live-baseline';

// 추가
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
```

`getMockResult` import는 **유지** — 엔진 호출 실패 시의 최후 폴백으로만 사용. UI 깨지지 않게.

### 1-2. 삭제할 것

- `applyInputsToResult()` 함수 전체 (라인 74~108)
- `tryLiveCachedResult()` 함수 전체 (라인 110~117)
- 응답 타입에서 `'live-cached'` 제거 → `'live' | 'mock'` 만 사용

### 1-3. POST handler 교체 (핵심 로직)

현재:
```ts
const cached = tryLiveCachedResult(scenarioId, inputs);
const result = cached ?? applyInputsToResult(mock, inputs);
const source: 'mock' | 'live-cached' = cached ? 'live-cached' : 'mock';
```

→ 교체:
```ts
// Map demo inputs → GlobalCostInput
const engineInput: GlobalCostInput = {
  price: Number(inputs.value ?? 0),
  origin: String(inputs.from ?? 'CN').toUpperCase(),
  destinationCountry: String(inputs.to ?? 'US').toUpperCase(),
  productName: String(inputs.product ?? ''),
  quantity: Number(inputs.quantity ?? 1) || 1,
  shippingType: 'international',
  shippingTerms: 'DDP',
  // weight_kg, hsCode 등은 엔진이 productName → HS 자동 추정
};

let result: MockResult;
let source: 'mock' | 'live';
try {
  const engineOut = await calculateGlobalLandedCostAsync(engineInput);
  result = mapEngineResultToMockShape(engineOut, engineInput);
  source = 'live';
} catch (err) {
  console.warn('[demo] engine failed, falling back to mock', err);
  result = mock;  // UI 깨짐 방지
  source = 'mock';
}
```

### 1-4. `mapEngineResultToMockShape()` 신규 헬퍼

`GlobalLandedCost` (엔진 output) → `MockResult` (UI가 기대하는 shape) 로 변환.
필드 매핑:

| UI 필드 (`MockResult`) | 엔진 필드 (`GlobalLandedCost`) 또는 추가 계산 |
|------------------------|---------------------------------------------|
| `hsCode` | `engineOut.hsCode` |
| `hsDescription` | `engineOut.hsDescription` 또는 productName fallback |
| `restriction.blocked` | `engineOut.restricted === true` |
| `restriction.summary` | `engineOut.restrictionSummary` 또는 'No import restriction' |
| `restriction.license` | `engineOut.licenseRequired` 있을 때만 |
| `landedCost.currency` | **항상 `'USD'`** (destinationCountry 상관없이 데모 표시용 통일) |
| `landedCost.productValue` | `engineInput.price * engineInput.quantity` |
| `landedCost.duty` | `engineOut.importDuty + (engineOut.antiDumpingDuty ?? 0)` |
| `landedCost.dutyRate` | `engineOut.dutyRate ?? 0` |
| `landedCost.taxes` | `engineOut.vat ?? 0` |
| `landedCost.shipping` | `engineOut.shippingEstimate?.air_estimate ?? 0` |
| `landedCost.fees` | `engineOut.customsProcessingFee ?? 0` + `engineOut.merchandiseProcessingFee ?? 0` |
| `landedCost.total` | 위 5개 합 (round2) |
| `extras.ftaName` | `engineOut.ftaUtilization?.fta_name` (있을 때만) |
| `extras.ftaPreferentialRate` | `engineOut.ftaUtilization?.preferential_rate` |
| `notes[]` | `engineOut.notes ?? []` (하드코딩 없음) |

**중요**: 엔진 필드명은 `app/lib/cost-engine/GlobalCostEngine.ts` 의 `GlobalLandedCost` interface에서 정확히 확인 후 매핑할 것. 없는 필드는 `undefined`로 두고 UI가 자체 fallback하게.

### 1-5. Rate limit / 에러 핸들링 / 헤더

- IP throttle 30/min 유지
- `X-Response-Time`, `X-Demo-Source` 헤더 유지 (값은 `mock | live`)
- `Cache-Control: no-store` 유지
- 엔진 호출이 느리면 (5초 초과) `AbortController` 로 타임아웃 → mock fallback
- **`console.log` 절대 남기지 말 것** (CLAUDE.md 절대 규칙 #4). `console.warn` 1회만 허용.

---

## ✏️ 작업 2 — baseline 파일 삭제

```bash
rm lib/scenarios/live-baseline.json
rm lib/scenarios/live-baseline.ts
```

둘 다 다른 곳에서 import되지 않는지 먼저 확인:
```bash
grep -rn "live-baseline" --include="*.ts" --include="*.tsx" --include="*.mjs"
```

`scripts/precompute-scenario-baselines.mjs` 에서만 참조되면 그 스크립트도 그대로 두되 (향후 필요 시 재생성 가능), **데모 route에서 import를 먼저 끊어야** build 실패가 안 난다. 순서: route.ts 수정 → build 확인 → json/ts 삭제.

---

## ✏️ 작업 3 — `NonDevPanel.tsx` 수정

### 3-1. Country dropdown 확장

현재 (라인 35~46) 하드코딩 10개 → `lib/data/countries-iso3166.ts` 에서 import.

만약 해당 파일이 없으면 **새로 만들 것**:

```ts
// lib/data/countries-iso3166.ts
export interface CountryOption { value: string; label: string; flag: string; }
export const COUNTRIES: CountryOption[] = [
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'KR', label: 'Korea', flag: '🇰🇷' },
  // ... ISO 3166-1 alpha-2 전체 목록
];
```

전체 국가 목록은 복사할 소스가 이미 `app/lib/cost-engine/countries/` 또는 `lib/data/` 에 있을 가능성이 높다. 먼저:
```bash
grep -rln "ISO 3166\|alpha-2\|country.*list" lib/ app/lib/ | head
```

있으면 재사용, 없으면 최소 **50개 주요 무역국 + 나머지 ISO3166-1 전체** 포함.

### 3-2. `COUNTRY_OPTIONS_WITH_PLACEHOLDER` 자동 생성

```ts
import { COUNTRIES } from '@/lib/data/countries-iso3166';
const COUNTRY_OPTIONS = COUNTRIES.map(c => ({
  value: c.value,
  label: `${c.flag} ${c.label}`,
}));
const COUNTRY_OPTIONS_WITH_PLACEHOLDER = [
  { value: '', label: 'Select country…' },
  ...COUNTRY_OPTIONS,
];
```

`forwarder` 시나리오의 제한된 destination select도 동일하게 전체 목록 사용하거나, 혹은 의도적 제한이었다면 그대로 유지 — 판단: **전체로 확장** (10개 제한은 의도 아니었음).

### 3-3. `handleCalculate` — quantity 포함 확인

현재 `inputs` 객체가 그대로 body에 들어가므로 이미 전달은 되고 있음. route.ts 가 `inputs.quantity` 를 읽도록만 하면 충족 (작업 1-3 에서 이미 반영).

**추가 수정**: d2c의 경우 UI는 "unit value * quantity" 를 보여줘야 하는데, 지금은 엔진에 price 단위로 보내면 엔진이 quantity 적용한 totalLandedCost를 돌려준다. `mapEngineResultToMockShape` 에서 `productValue = price * quantity` 계산하면 일관됨.

---

## ✏️ 작업 4 — `DevPanel.tsx` 코드 snippet 동적화

현재 DevPanel 의 코드 snippet은 정적 문자열. 사용자가 입력한 값이 반영되지 않아 "코드 확인해봐도 입력값과 동떨어진" 문제 발생.

### 4-1. `inputs` prop 받기

`DevPanel`을 `{ scenarioId, inputs }` 로 확장. ScenarioPanel 에서 현재 `NonDevPanel`과 `DevPanel`이 각자 state를 가지고 있는지 확인:

```bash
grep -n "useState\|inputs" components/home/DevPanel.tsx
```

별도 state면 → **lift state up** 해서 `ScenarioPanel`이 `inputs`를 소유하고 양쪽에 props로 내려줌. **단, HF2/HF4 레이아웃/스타일은 유지**. state 위치만 이동.

### 4-2. 코드 snippet 템플릿 리터럴

```ts
const snippet = `curl -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price": ${inputs.value || 0},
    "origin": "${inputs.from || 'CN'}",
    "destinationCountry": "${inputs.to || 'US'}",
    "productName": "${inputs.product || ''}"${
      inputs.quantity ? `,\n    "quantity": ${inputs.quantity}` : ''
    }
  }'`;
```

언어별 탭 (curl / Node / Python) 이 이미 있다면 3개 전부 동일 방식으로 교체.

---

## ✏️ 작업 5 — `CLAUDE.md` CW 증가 규칙 추가

### 5-1. 헤더 날짜 교체

```
# 마지막 업데이트: 2026-04-10 KST (CW31: 홈페이지 데모 → 실제 cost engine 직결. applyInputsToResult/live-baseline 삭제, calculateGlobalLandedCostAsync 직접 호출. Country dropdown ISO3166 전체, DevPanel 템플릿 리터럴, quantity/통화/FTA 하드코딩 제거. 475 pages ✓)
```

### 5-2. `## 절대 규칙` 섹션 바로 아래 또는 `## 터미널 구조` 위에 새 섹션 추가:

```markdown
## 🗂 CW 번호 증가 규칙 (CW31 확정)

`CW##` 는 "Cowork 작업 배치 단위"로 세션과 무관하게 판단. 다음 중 **하나라도 해당** 하면 번호 +1:

1. **아키텍처 변경** — 데이터 흐름, API 연결 구조, DB 스키마 변경
2. **Phase 전환** — Phase 1 (기능 구현) → Phase 2 (트래픽) 같은 큰 분기
3. **7일 이상 경과** — 같은 숫자 유지 시 히스토리 혼선

같은 CW 안에서 세분화는 **Sprint (`S#`)** 또는 **Hotfix (`HF#`)** 로 표시.
예: `CW30-S2`, `CW30-HF4`, `CW31-S1`.
```

---

## ✅ 검증 순서 (Opus가 직접 수행, 단축 금지)

### 1. 타입체크 + 빌드

```bash
cd ~/potal
npm run build 2>&1 | tail -40
```

**통과 기준**:
- `✓ Compiled successfully`
- 페이지 수 475 유지
- `live-baseline` 관련 import 에러 없음

### 2. 로컬 dev 서버 시나리오별 회귀 테스트

```bash
npm run dev
```

**6 시나리오 × 3 국가 조합 = 18 케이스 매트릭스**. 각각 브라우저에서 직접 값을 입력하고 결과 확인:

| # | 시나리오 | Origin → Dest | Product | Value | Qty | 기대 포인트 |
|---|---------|-------------|---------|-------|-----|-----------|
| 1 | seller | KR → US | leather wallet | 45 | - | KORUS 0%, total ~$55~60, no Section 301 note |
| 2 | seller | CN → US | leather wallet | 45 | - | Section 301 적용 (엔진이 판단) |
| 3 | seller | KR → DE | leather wallet | 45 | - | EU VAT 적용 |
| 4 | d2c | KR → US | organic T-shirt | 28 | 500 | productValue = 14,000, 통화 USD |
| 5 | d2c | KR → DE | organic T-shirt | 28 | 500 | EU VAT, Korea-EU FTA 표시 |
| 6 | d2c | CN → JP | organic T-shirt | 28 | 500 | 일본 JCT |
| 7 | importer | CN → US | centrifugal pumps | 85000 | - | HS 자동, container 필드 정상 |
| 8 | importer | DE → KR | centrifugal pumps | 85000 | - | KR VAT, Korea-EU FTA |
| 9 | importer | JP → US | centrifugal pumps | 85000 | - | MFN duty |
| 10 | exporter | KR → US | Li-ion battery cells | 250000 | - | 위험물 경고 (엔진이 돌려주면) |
| 11 | exporter | KR → DE | Li-ion battery cells | 250000 | - | EU 배터리 규제 |
| 12 | exporter | KR → JP | Li-ion battery cells | 250000 | - | JCT |
| 13 | forwarder | KR → US | cotton T-shirts batch | 12000 | - | 일반 |
| 14 | forwarder | KR → DE | cotton T-shirts batch | 12000 | - | Korea-EU FTA |
| 15 | forwarder | VN → US | cotton T-shirts batch | 12000 | - | MFN |
| 16 | custom | (자유 조합) | 자유 | 자유 | - | CustomBuilder 정상 |
| 17 | custom | 다른 조합 | | | | |
| 18 | custom | 다른 조합 | | | | |

**매 케이스 체크**:
- [ ] 통화 기호가 destination에 맞게 표시 (USD는 $, 모두 데모는 USD 통일)
- [ ] `Duty rate (N%)` 가 엔진 rate 반영
- [ ] `X-Demo-Source: live` 응답 헤더 (Chrome DevTools Network 탭)
- [ ] DevPanel 코드 snippet에 **입력한 product/origin/dest/value** 가 그대로 들어가 있음
- [ ] `Korea-EU FTA` 같은 문구가 **정확한 조합에서만** 보임 (US 목적지에서 안 나와야 함)
- [ ] "Chinese Section 301" 같은 경고가 **CN origin일 때만** 나옴
- [ ] d2c quantity 500 → productValue = 14000 (단가 28 × 500)
- [ ] Calculate 버튼 클릭 시 "Calculating…" spinner 표시 (이미 구현됨, 회귀 없는지 확인)

### 3. POTAL MCP 교차 검증 (4개 케이스)

Cowork에서 Claude에게 다음을 요청해 응답값과 일치 확인:
- 케이스 1 (seller KR→US wallet $45) → `mcp__potal__calculate_landed_cost`
- 케이스 4 (d2c KR→US T-shirt $28 × 500) → `mcp__potal__calculate_landed_cost`
- 케이스 7 (importer CN→US pumps $85k) → `mcp__potal__calculate_landed_cost`
- 케이스 13 (forwarder KR→US cotton $12k) → `mcp__potal__calculate_landed_cost`

데모 API 응답과 MCP 응답의 `total` 차이가 **±$2 이내** 여야 통과 (환율/버전 반올림 오차 허용).

### 4. HF1/HF2/HF3/HF4 회귀 확인

- [ ] `/` 접속 시 seller 기본 선택 (HF1)
- [ ] 시나리오 버튼 `min-h-[52px]` 1줄 유지 (HF2)
- [ ] Hero `text-[26px]`, `pt-6 pb-4` 유지 (HF2)
- [ ] CUSTOM 페이지 헤더 `⚙️ POTAL for custom` 1개만 (HF3)
- [ ] CUSTOM / seller 2-column 박스 좌우 x좌표 일치 (HF4)

### 5. 프로덕션 배포

```bash
git add app/api/demo/scenario/route.ts \
        components/home/NonDevPanel.tsx \
        components/home/DevPanel.tsx \
        components/home/ScenarioPanel.tsx \
        lib/data/countries-iso3166.ts \
        CLAUDE.md
git rm lib/scenarios/live-baseline.json lib/scenarios/live-baseline.ts

git commit -m "fix(demo): connect homepage demo to real cost engine (CW31)

- Delete applyInputsToResult price-ratio scaling + live-baseline cache
- Call calculateGlobalLandedCostAsync directly in /api/demo/scenario
- Map GlobalLandedCost → MockResult shape for UI (no schema break)
- Remove hardcoded Korea-EU FTA / Section 301 notes (engine drives warnings)
- Expand country dropdown to full ISO3166 list
- Pass d2c quantity to engine (was previously ignored)
- DevPanel code snippets become template literals reflecting live inputs
- Add CW numbering rule to CLAUDE.md
- Preserve HF1/HF2/HF3/HF4 layout and behavior untouched"

git push origin main
```

프로덕션에서 케이스 1/4/7/13 재확인:
- [ ] `https://potalapp.com/?type=seller` KR→US wallet $45
- [ ] `https://potalapp.com/?type=d2c` KR→US T-shirt $28 × 500
- [ ] `https://potalapp.com/?type=importer` CN→US pumps $85k
- [ ] `https://potalapp.com/?type=forwarder` KR→US cotton $12k

---

## 📝 완료 후 문서 업데이트 (Opus 필수 수행)

### 1. `CLAUDE.md` — 작업 5-1/5-2에서 이미 수정

### 2. `docs/CHANGELOG.md` 최상단에 추가

```markdown
## [CW31] 2026-04-10 — 정직한 리셋: 홈페이지 데모 실제 엔진 직결

### Fixed (root cause)
- `/api/demo/scenario` 가 `applyInputsToResult()` 로 baseline JSON 만 가격 비율 스케일링하고 origin/destination/quantity/material 을 완전히 무시하던 구조를 제거.
- `calculateGlobalLandedCostAsync()` 직접 호출로 교체. 엔진 응답을 `MockResult` shape 로 매핑하여 UI 스키마 유지.
- 하드코딩 제거: Korea-EU FTA note, Section 301 note, 통화 기호 (모두 데모는 USD 통일), d2c quantity 무시 버그.

### Changed
- `lib/scenarios/live-baseline.json`, `lib/scenarios/live-baseline.ts` 삭제.
- `components/home/NonDevPanel.tsx` country dropdown: 10개 하드코딩 → ISO3166 전체 목록 import.
- `components/home/DevPanel.tsx` 코드 snippet: 정적 문자열 → 템플릿 리터럴 (입력값 live 반영).
- `ScenarioPanel` 이 inputs state 소유 후 NonDevPanel/DevPanel 에 props 전달 (lift state up).
- `CLAUDE.md` 에 CW 번호 증가 규칙 섹션 추가.

### Verified
- 18 케이스 매트릭스 (6 시나리오 × 3 조합) 로컬 통과.
- POTAL MCP 교차 검증 4 케이스 ±$2 이내 일치.
- HF1/HF2/HF3/HF4 회귀 없음.
- Build: 475 pages ✓.
```

### 3. `session-context.md`

`## 완료 항목` 에 추가:
```
[x] CW31 — 홈페이지 데모 실제 엔진 직결 (2026-04-10)
    - applyInputsToResult/live-baseline 삭제, calculateGlobalLandedCostAsync 직접 호출
    - 18 케이스 매트릭스 통과, POTAL MCP 교차 검증 4건 일치
    - HF1~HF4 회귀 없음, 475 pages ✓
```

`## 현재 TODO` 에서 "홈페이지 데모 버그" 관련 항목 있으면 제거.

### 4. `docs/NEXT_SESSION_START.md`

- 헤더 날짜 2026-04-10
- 다음 작업: Phase 2 traffic acquisition 논의 (CW31 완료 후 Cowork 에서 진행)

---

## ⚠️ 주의

1. **HF1/HF2/HF3/HF4 절대 건드리지 말 것** — 레이아웃/스타일 변경 금지. state 리프팅 시에도 DOM 구조 유지.
2. **B2C 코드 보호 규칙** — `lib/search/`, `lib/agent/`, `components/search/` 접근 금지.
3. **`/api/v1/calculate` 본체 route 건드리지 말 것** — 엔진 함수만 import.
4. **console.log 금지** — 프로덕션 코드에 남기지 말 것 (`console.warn` 폴백 1회만 허용).
5. **새 숫자 만들기 금지** — mock-results 유지하되 하드코딩 note만 제거. 엔진 응답 그대로 렌더.
6. **force push 금지**.
7. **Notion Session Log는 Cowork에서 처리** — Opus는 4개 코드 문서만 건드림.

---

## 🏁 완료 후 리포트 포맷

```
CW31 완료 ✅
- 파일 수정: route.ts / NonDevPanel.tsx / DevPanel.tsx / ScenarioPanel.tsx / CLAUDE.md (+ countries-iso3166.ts 신규)
- 파일 삭제: live-baseline.json, live-baseline.ts
- Build: 475 pages ✓
- 18 케이스 매트릭스: 전부 통과 / 실패 N건 (상세 기재)
- POTAL MCP 교차 검증: 4/4 ±$2 이내 일치
- 프로덕션 배포: 커밋 해시 <hash>, Vercel 배포 성공
- HF1/HF2/HF3/HF4 회귀 없음
- 4개 문서 날짜 2026-04-10 갱신 완료
- 이슈/의문점: <있으면 기재>
```

끝.
