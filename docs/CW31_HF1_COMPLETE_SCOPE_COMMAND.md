# CW31-HF1 — 정직한 리셋 완전판: HAZMAT 경고 + forwarder multi-destination + DevPanel 치환

**작성일**: 2026-04-10 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**예상 소요**: 3~4시간 (반나절, 1세션 완결)
**전제조건**: CW31 완료 상태 (main `776efb2`, 475 pages ✓, 18/18 live)

---

## 🧭 왜 HF1 이 필요한가

CW31 본 작업에서 18 케이스 매트릭스가 전부 live 로 통과했지만, Opus 완료 리포트 말미에 "의도적 한계" 로 넘긴 3건은 사실 **CW31 의 원래 스코프 안에 있어야 했던 누락분**. 6개 홈페이지 시나리오는 **전부** 정상 작동해야 하며 "없으면 아쉬운 기능" 이란 건 존재하지 않는다.

| 한계 | 왜 치명적인가 |
|------|-------------|
| **exporter ECCN/HAZMAT 경고 회귀** | 케이스 10~12 는 리튬이온 배터리 $250k. UN3480/3481 위험물인데 경고 없이 "✓ Allowed" 만 표시하면 사용자가 EMS 로 그냥 부칠 수 있다고 착각. **안전 이슈**. |
| **forwarder 단일 목적지** | forwarder 시나리오의 질문이 *"Can I calculate on behalf of my clients **at scale**?"*. 단일 목적지만 지원하면 seller/d2c 와 기능적으로 동일해지고 시나리오 존재 이유가 사라짐. |
| **DevPanel forwarder 코드 snippet 치환 안 됨** | 개발자가 forwarder 탭 누르고 자기 입력이 반영 안 된 placeholder 코드를 보면 "API 작동 안 하는 거 아닌가?" 하고 떠남. CW31 전체 목적("정적→동적")의 1/6 누락. |

CW 넘버링 규칙(CLAUDE.md Rule 11)에 따라 **아키텍처 변경 아님 + 같은 주차 + CW31 의 불완전 스코프 보완** → `CW31-HF1` 로 처리.

---

## 🎯 목적

1. 엔진 `checkRestrictions()` 호출을 `mapEngineResultToMockShape` 에 편입 → UI `restriction.blocked` / `restriction.summary` / `restriction.license` 필드에 매핑
2. `restrictions/rules.ts` 에 **HS 8506 (primary lithium cells)** 규칙 추가 (8507 는 이미 있음)
3. `NonDevPanel` forwarder 시나리오의 destinations 필드를 **multi-select (최대 5개)** 로 확장
4. `/api/demo/scenario` 가 forwarder multi-destination 요청 시 **목적지별 병렬 엔진 호출** (`Promise.all`)
5. forwarder 결과 UI: **목적지별 비교 테이블** (목적지 / duty / FTA / total / cheapest 강조)
6. `workflow-examples.ts` forwarder SCENARIO_DEFAULTS 에 `destinations: string[]` 추가 → `renderWorkflowCode` 가 live 선택된 destinations 배열을 snippet 에 주입

---

## 📂 수정 대상 파일 (총 7개)

| # | 파일 | 변경 성격 |
|---|------|----------|
| 1 | `app/lib/cost-engine/restrictions/rules.ts` | HS 8506 (primary lithium cells) HAZMAT 규칙 1건 추가 |
| 2 | `app/api/demo/scenario/route.ts` | `checkRestrictions()` 호출 + `mapEngineResultToMockShape` 확장 + forwarder multi-destination 병렬 처리 |
| 3 | `components/home/NonDevPanel.tsx` | forwarder 필드를 multi-select checkbox list 로 교체 + 결과 영역 forwarder 분기 (비교 테이블) |
| 4 | `components/home/ScenarioPanel.tsx` | forwarder inputs shape (`to` → `destinations: string[]`) state 처리 |
| 5 | `components/home/DevPanel.tsx` | inputs 에 `destinations` 들어오면 forwarder snippet 으로 전달 |
| 6 | `lib/scenarios/workflow-examples.ts` | SCENARIO_DEFAULTS.forwarder 에 `destinations` 추가 + `renderWorkflowCode` 가 forwarder 케이스에서 array 치환 |
| 7 | `lib/scenarios/mock-results.ts` | forwarder mock 에 `comparisonTable` 필드 추가 (fallback 시 UI 깨짐 방지) |

**절대 건드리지 말 것**:
- ❌ `app/lib/cost-engine/GlobalCostEngine.ts` (엔진 본체)
- ❌ `app/api/v1/calculate/route.ts` (공개 API)
- ❌ CW31 이 이미 검증한 seller/d2c/importer/exporter UI 구조 (forwarder 만 수정)
- ❌ HF1/HF2/HF3/HF4 레이아웃 (`ScenarioSelector`, `CustomBuilder`, `ScenarioPanel` max-width/padding 등)
- ❌ `lib/search/`, `lib/agent/`, `components/search/` (B2C 보호)

---

## ✏️ 작업 A — HAZMAT 경고 surfacing (30분)

### A-1. `restrictions/rules.ts` 에 HS 8506 규칙 추가

**위치**: `WATCHED_AND_CARRIER` 배열(라인 314~364), HS 8507 규칙(라인 316~322) **바로 위** 에 삽입.

```ts
// Primary cells (lithium primary batteries) — dangerous goods
{
  severity: 'watched',
  hsPrefix: '8506',
  category: 'Primary Lithium Cells',
  description: 'Primary lithium batteries (non-rechargeable) are regulated as dangerous goods under IATA DGR and IMDG Code. Hazmat declaration required.',
  requiredDocuments: ['Shipper\'s Declaration for Dangerous Goods (IATA)', 'UN3090 / UN3091 classification'],
  carrierRestrictions: ['USPS', 'Royal Mail', 'China Post (air)', 'Singapore Post (air)'],
},
```

### A-2. `route.ts` 에 `checkRestrictions` import 추가

```ts
import { checkRestrictions } from '@/app/lib/cost-engine/restrictions/check';
import type { RestrictionCheckResult } from '@/app/lib/cost-engine/restrictions/types';
```

### A-3. `mapEngineResultToMockShape()` 확장

현재 라인 178~183:
```ts
restriction: {
  blocked: false,
  summary: engineOut.additionalTariffNote || mock.restriction.summary,
},
```

→ 교체:
```ts
// CW31-HF1: Surface real engine restriction check (hazmat, ECCN, carriers)
const hsCode = engineOut.hsClassification?.hsCode || mock.hsCode;
const restrictionCheck: RestrictionCheckResult = checkRestrictions(
  hsCode,
  engineOut.destinationCountry || String(inputs.to ?? 'US').toUpperCase()
);

let restrictionBlocked = false;
let restrictionSummary = engineOut.additionalTariffNote || mock.restriction.summary;
let restrictionLicense: string | undefined;

if (restrictionCheck.isProhibited) {
  restrictionBlocked = true;
  restrictionSummary = restrictionCheck.restrictions[0]?.description || 'Import prohibited';
} else if (restrictionCheck.hasRestrictions) {
  // Watched/restricted/warning → show but don't block
  const top = restrictionCheck.restrictions[0];
  if (top) {
    restrictionSummary = `${top.category}: ${top.description}`;
    if (top.requiredDocuments && top.requiredDocuments.length > 0) {
      restrictionLicense = `Requires: ${top.requiredDocuments.join(', ')}`;
    } else if (restrictionCheck.restrictedCarriers.length > 0) {
      restrictionLicense = `Carrier restricted: ${restrictionCheck.restrictedCarriers.slice(0, 3).join(', ')}`;
    }
  }
}
```

그리고 return 객체의 `restriction` 을:
```ts
restriction: {
  blocked: restrictionBlocked,
  summary: restrictionSummary,
  ...(restrictionLicense ? { license: restrictionLicense } : {}),
},
```

### A-4. 검증 — 작업 A 단독 회귀

- 케이스 10 (exporter KR→US Li-ion $250k): `restriction.summary` 에 *"Primary Lithium Cells: …"* 또는 *"Lithium Batteries: …"* 표시
- 케이스 1 (seller KR→US wallet $45): HS 4202 은 규칙 없음 → `restriction.summary` 가 기존 "No import restriction" 유지
- 케이스 16 (seller CN→US wallet $200): 여전히 Section 301 note 가 summary 로 들어감 (restriction 과 additionalTariffNote 가 충돌 시 restriction 우선)

**합격 기준**: 배터리 3 케이스 모두 경고 표시 + 일반 상품 회귀 없음.

---

## ✏️ 작업 B — forwarder multi-destination (2~3시간)

### B-1. `NonDevPanel.tsx` forwarder 필드 구조 변경

**현재** (라인 94~108):
```ts
forwarder: [
  { key: 'product', label: 'Product type', type: 'text', placeholder: 'e.g. Cotton T-shirts (batch)' },
  { key: 'from', label: 'Origin', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
  {
    key: 'to',
    label: 'Destinations',
    type: 'select',
    options: [/* 3개 하드코딩 */],
  },
  { key: 'value', label: 'Value per shipment', type: 'number', placeholder: '12000', unit: 'USD' },
],
```

**→ 교체**: `to` 필드를 **새로운 타입 `'multiselect'`** 로:
```ts
{
  key: 'destinations',
  label: 'Destinations (max 5)',
  type: 'multiselect',
  options: COUNTRY_OPTIONS, // 전체 240개, placeholder 없음
  unit: 'countries',
},
```

`FieldDef` 타입 확장:
```ts
type: 'text' | 'number' | 'select' | 'multiselect';
```

### B-2. multiselect 렌더러 추가

`fields.map(...)` 의 select 분기 옆에 multiselect 분기 추가:

```tsx
{f.type === 'multiselect' ? (
  <MultiCountryPicker
    selected={Array.isArray(inputs[f.key]) ? (inputs[f.key] as string[]) : []}
    options={f.options || []}
    max={5}
    onChange={next =>
      setInputs(v => ({ ...v, [f.key]: next }))
    }
  />
) : f.type === 'select' ? (
  /* 기존 select 유지 */
) : (
  /* 기존 input 유지 */
)}
```

`MultiCountryPicker` 컴포넌트 신규 (같은 파일 내부 함수 또는 `components/home/MultiCountryPicker.tsx` 분리):
- 버튼 클릭 시 드롭다운 열림 (search box + 체크박스 리스트)
- 선택된 국가는 tag chip 으로 상단 표시 (X 버튼으로 제거)
- max=5 초과 시 나머지 체크박스 disabled
- 선택 없을 때 placeholder "Select up to 5 destinations…"
- 스타일은 기존 select 와 톤 맞춤 (rounded-lg, border-slate-200, focus:border-[#F59E0B])

### B-3. `inputs` 타입 확장

`NonDevPanel` / `ScenarioPanel` 의 `inputs` state 타입:
```ts
Record<string, string | number | string[]>
```

`Calculate` 버튼 활성화 로직(라인 290~294):
```ts
const allFilled = fields.every(f => {
  const v = inputs[f.key];
  if (f.type === 'multiselect') return Array.isArray(v) && v.length > 0;
  return v !== undefined && v !== '' && v !== null;
});
```

### B-4. `route.ts` forwarder 분기 추가

`buildEngineInput()` 위에 신규 헬퍼:
```ts
function buildForwarderInputs(
  inputs: Record<string, string | number | string[] | undefined>
): GlobalCostInput[] | null {
  const product = toStr(inputs.product);
  const from = toStr(inputs.from);
  const destinations = Array.isArray(inputs.destinations)
    ? (inputs.destinations as string[]).filter(Boolean)
    : [];
  const unitValue = toNumber(inputs.value);
  if (!from || destinations.length === 0 || unitValue <= 0) return null;

  return destinations.slice(0, 5).map(dest => ({
    price: unitValue,
    shippingPrice: 0,
    origin: from.toUpperCase(),
    destinationCountry: dest.toUpperCase(),
    productName: product,
    quantity: 1,
    shippingType: 'international' as const,
  }));
}
```

POST handler 안에 forwarder 분기:
```ts
if (scenarioId === 'forwarder') {
  const batchInputs = buildForwarderInputs(inputs);
  if (batchInputs) {
    const batchResults = await Promise.all(
      batchInputs.map(i => runEngineWithTimeout(i))
    );
    const successes = batchResults
      .map((r, i) => r ? { input: batchInputs[i], output: r } : null)
      .filter((x): x is { input: GlobalCostInput; output: GlobalLandedCost } => x !== null);

    if (successes.length > 0) {
      result = mapForwarderResultsToMockShape(successes, mock, inputs);
      source = 'live';
    }
  }
} else {
  // 기존 단일 엔진 호출 경로
  const engineInput = buildEngineInput(inputs);
  if (engineInput) {
    const engineOut = await runEngineWithTimeout(engineInput);
    if (engineOut) {
      result = mapEngineResultToMockShape(engineOut, mock, inputs);
      source = 'live';
    }
  }
}
```

### B-5. `mapForwarderResultsToMockShape()` 신규

```ts
function mapForwarderResultsToMockShape(
  results: Array<{ input: GlobalCostInput; output: GlobalLandedCost }>,
  mock: MockResult,
  inputs: Record<string, string | number | string[] | undefined>
): MockResult {
  // Per-destination rows
  const rows = results.map(({ input, output }) => {
    const productValue = round2(output.productPrice || input.price);
    const duty = round2(output.importDuty || 0);
    const taxes = round2(output.vat ?? output.salesTax ?? 0);
    const shipping = round2(output.shippingCost || 0);
    const fees = round2((output.mpf || 0) + (output.insurance || 0) + (output.brokerageFee || 0));
    const total = round2(output.totalLandedCost || productValue + duty + taxes + shipping + fees);
    return {
      destination: input.destinationCountry,
      hsCode: output.hsClassification?.hsCode || mock.hsCode,
      duty,
      taxes,
      shipping,
      fees,
      total,
      ftaName: output.ftaApplied?.hasFta ? output.ftaApplied.ftaName : null,
    };
  });

  // Cheapest
  const cheapest = rows.reduce((a, b) => (a.total < b.total ? a : b));

  // Reuse the first row for the top-level landedCost so existing UI fields
  // (hs code, restriction, total) still render something sensible.
  const first = results[0];
  const baseShape = mapEngineResultToMockShape(first.output, mock, { ...inputs, to: first.input.destinationCountry });

  return {
    ...baseShape,
    extras: {
      ...(baseShape.extras || {}),
      forwarderCheapest: `${cheapest.destination} — $${cheapest.total.toLocaleString()}`,
      forwarderCount: rows.length,
    },
    // Attach comparison rows under notes for the UI to pick up — or extend
    // MockResult type with an optional comparisonRows field. Prefer the latter.
    comparisonRows: rows,
  } as MockResult & { comparisonRows: typeof rows };
}
```

**중요**: `MockResult` 타입에 optional `comparisonRows` 필드 추가. `lib/scenarios/mock-results.ts` 의 interface 에:
```ts
export interface MockResult {
  // ... 기존 필드
  /** CW31-HF1: forwarder multi-destination comparison table */
  comparisonRows?: Array<{
    destination: string;
    hsCode: string;
    duty: number;
    taxes: number;
    shipping: number;
    fees: number;
    total: number;
    ftaName: string | null;
  }>;
}
```

`mock-results.ts` 의 `forwarder` mock 에도 `comparisonRows` 샘플 3행 추가 (fallback 시 UI 깨짐 방지).

### B-6. `NonDevPanel.tsx` 결과 영역 forwarder 분기

Result 섹션(라인 321~428) 안에 forwarder 전용 블록 삽입:

```tsx
{result.comparisonRows && result.comparisonRows.length > 0 && (
  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
    <div className="text-[11px] text-slate-500 mb-3 font-bold uppercase tracking-wide">
      Destination comparison ({result.comparisonRows.length} routes)
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="pb-2 font-bold">Destination</th>
            <th className="pb-2 font-bold text-right">Duty</th>
            <th className="pb-2 font-bold text-right">FTA</th>
            <th className="pb-2 font-bold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {[...result.comparisonRows]
            .sort((a, b) => a.total - b.total)
            .map((row, idx) => (
              <tr
                key={row.destination}
                className={`border-t border-slate-100 ${
                  idx === 0 ? 'bg-emerald-50/50' : ''
                }`}
              >
                <td className="py-2 font-bold">
                  {idx === 0 && <span className="text-emerald-600 mr-1">★</span>}
                  {row.destination}
                </td>
                <td className="py-2 text-right font-mono">
                  {fmtCurrency(row.duty, 'USD')}
                </td>
                <td className="py-2 text-right text-[11px] text-slate-500">
                  {row.ftaName || '—'}
                </td>
                <td className={`py-2 text-right font-mono font-bold ${
                  idx === 0 ? 'text-emerald-700' : 'text-[#02122c]'
                }`}>
                  {fmtCurrency(row.total, 'USD')}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
    <div className="text-[11px] text-slate-400 mt-2">
      ★ Cheapest route highlighted
    </div>
  </div>
)}
```

이 블록은 기존 HS code / Restriction / Landed cost breakdown **아래에** 추가. 상단 블록들은 첫 번째 destination 기준으로 계속 표시 (baseShape).

### B-7. 검증 — 작업 B 단독 회귀

**새 포워더 케이스 3건**:
1. forwarder KR → [US, DE, JP] / cotton T-shirts / $12000 → 3행 비교, DE 가 FTA 0% 로 cheapest 예상
2. forwarder KR → [US, GB, CA] / electronics / $8000 → 3행 (UK FTA 유무 확인)
3. forwarder CN → [KR, JP, SG] / toys / $5000 → 3행 (ASEAN FTA 테스트)

**회귀 체크**:
- seller/d2c/importer/exporter 는 forwarder 분기 안 타므로 18 케이스 중 forwarder 외 15 케이스 결과값 불변 (CW31 원본과 ±$0.01 이내)
- forwarder max=5 초과 선택 불가
- 선택 0개 시 Calculate 버튼 disabled
- p95 응답시간 < 2.5s (3 destinations × ~700ms 병렬이면 ~800ms 예상)

---

## ✏️ 작업 C — DevPanel forwarder snippet 치환 (30분)

### C-1. `workflow-examples.ts` SCENARIO_DEFAULTS.forwarder 확장

현재 라인 688~693:
```ts
forwarder: {
  product: 'Cotton T-shirts (batch)',
  from: 'KR',
  to: 'US',
  value: 12000,
},
```

**→ 교체**:
```ts
forwarder: {
  product: 'Cotton T-shirts (batch)',
  from: 'KR',
  to: 'US', // unused for forwarder but kept for type compatibility
  value: 12000,
  destinations: ['US', 'DE', 'JP'],
},
```

`SCENARIO_DEFAULTS` 타입에 `destinations?: string[]` 추가.

### C-2. `renderWorkflowCode()` forwarder 분기

`renderWorkflowCode` 내부, product/from/value 치환 **후** 에 forwarder 전용 블록 추가:

```ts
// CW31-HF1: forwarder multi-destination replacement
if (scenarioId === 'forwarder' && defaults.destinations) {
  const destArray = Array.isArray(inputs.destinations)
    ? (inputs.destinations as string[]).filter(Boolean).map(d => d.toUpperCase())
    : [];
  const liveDests = destArray.length > 0 ? destArray : defaults.destinations;

  // Default destination list in snippet is US, DE, JP — replace the tuple
  // forms that appear in each language sample.
  const defaultStr = defaults.destinations.join('","');
  const liveStr = liveDests.join('","');
  code = code.replace(
    new RegExp(`"${escapeRegExp(defaultStr)}"`, 'g'),
    `"${liveStr}"`
  );

  // Python tuple form
  const pyDefault = defaults.destinations.map(d => `"${d}"`).join(', ');
  const pyLive = liveDests.map(d => `"${d}"`).join(', ');
  code = code.replace(pyDefault, pyLive);

  // Go struct form — 한 줄에 From/To 한 쌍씩 반복
  // 기존: {HS: "610910", From: "KR", To: "US", Value: 12000},
  //       {HS: "610910", From: "KR", To: "DE", Value: 12000},
  //       {HS: "610910", From: "KR", To: "JP", Value: 12000},
  // Go 는 다른 언어보다 구조가 복잡하므로, liveDests 개수가 3 와 다르면
  // 전체 items slice 를 regenerate:
  if (liveDests.length !== 3 || !liveDests.every((d, i) => d === defaults.destinations![i])) {
    const goItemsBlock = liveDests
      .map(d => `\t\t{HS: "610910", From: "${from}", To: "${d}", Value: ${value}},`)
      .join('\n');
    // replace the 3-line block between `items := []*potal.LandedCostRequest{` and `}`
    code = code.replace(
      /(items := \[\]\*potal\.LandedCostRequest\{)[\s\S]*?(\n\t\})/,
      `$1\n${goItemsBlock}$2`
    );
  }

  // candidates query param (curl compare-countries)
  code = code.replace(
    `candidates=${defaults.destinations.join(',')}`,
    `candidates=${liveDests.join(',')}`
  );
}
```

이 regex 는 **취약하므로** Opus 가 4개 언어(curl/python/node/go) snippet 원본을 직접 읽고 치환 패턴이 정확히 매치하는지 확인 후 조정할 것. 원본 snippet 은 `workflow-examples.ts` 라인 441~541 에 정의됨.

### C-3. 검증 — 작업 C 단독

- forwarder 선택, destinations 를 `[US, DE, JP]` (기본) → snippet 원본 그대로 표시
- destinations 를 `[US, GB, CA]` 로 변경 → 4개 언어 snippet 전부에 `US, GB, CA` 반영 확인
- destinations 를 `[KR, JP, SG, AU, TH]` (5개) → Go snippet items slice 5줄로 확장, curl/node/python 배열도 5개로 확장

---

## ✏️ 작업 D — 문서 업데이트

### D-1. `CLAUDE.md` 헤더

```
# 마지막 업데이트: 2026-04-10 KST (CW31-HF1 "완전판": forwarder multi-destination (UI multi-select + 병렬 엔진 호출 + 비교 테이블), HS 8506 HAZMAT rule 추가, checkRestrictions() mapEngineResultToMockShape 편입, DevPanel forwarder snippet 치환. 21 케이스 live p95 850ms. 475 pages ✓)
```

### D-2. `docs/CHANGELOG.md` 최상단

```markdown
## [CW31-HF1] 2026-04-10 — 정직한 리셋 완전판

### Fixed
- **exporter 시나리오 HAZMAT 경고 회귀 해소**: `restrictions/rules.ts` 에 HS 8506 (primary lithium cells) 규칙 추가. `mapEngineResultToMockShape` 가 `checkRestrictions()` 호출 후 `restriction.summary`/`restriction.license` 에 결과 surfacing. 케이스 10~12 배터리 시나리오에서 IATA DGR / IMDG 안내 자동 표시.
- **forwarder 시나리오 단일 목적지 제한 해소**: UI 를 multi-select (최대 5개) 로 교체, `/api/demo/scenario` 가 목적지별 `Promise.all` 병렬 엔진 호출. 결과 UI 에 `comparisonRows` 비교 테이블 신설 (cheapest 강조).
- **DevPanel forwarder 코드 snippet 정적 → 동적**: `SCENARIO_DEFAULTS.forwarder` 에 `destinations` 배열 추가, `renderWorkflowCode` 가 4개 언어 (curl/python/node/go) snippet 에서 live 목적지 배열 치환.

### Added
- `components/home/MultiCountryPicker` — tag chip + search 기반 multi-select (재사용 가능)
- `MockResult.comparisonRows?` — forwarder 비교 테이블용 optional 필드
- `mapForwarderResultsToMockShape()` — 배치 엔진 결과를 MockResult shape 로 변환

### Verified
- 18 케이스 매트릭스 (CW31) 회귀 없음: seller/d2c/importer/exporter/custom 전부 동일 결과
- 새 forwarder 3 케이스: KR→[US,DE,JP], KR→[US,GB,CA], CN→[KR,JP,SG] live 통과
- 케이스 10~12 배터리 HAZMAT 경고 surfacing 확인
- p95 응답시간 850ms (3 목적지 병렬, 5s timeout 대비 6배 여유)
- Build 475 pages ✓, TypeScript 0 error
```

### D-3. `session-context.md` 완료 블록 추가

```
[x] CW31-HF1 — 정직한 리셋 완전판 (2026-04-10)
    - HAZMAT 경고 surfacing (HS 8506 rule + checkRestrictions 편입)
    - forwarder multi-destination (UI multi-select + 병렬 엔진 + 비교 테이블)
    - DevPanel forwarder snippet live 치환
    - 21 케이스 live 통과, 475 pages ✓
```

그리고 CW31 완료 블록 아래의 "의도된 한계 3건" 메모가 있다면 삭제 또는 "CW31-HF1 에서 해소" 표시.

### D-4. `docs/NEXT_SESSION_START.md`

- 헤더 날짜 2026-04-10
- 다음 작업: **Phase 2 traffic acquisition 논의** (Cowork 에서, CW31-HF1 완료 후 해금)

---

## ✅ 검증 순서 (Opus 직접 수행)

### 1. 타입체크 + 빌드
```bash
cd ~/potal && npm run build 2>&1 | tail -40
```
통과 기준: `✓ Compiled successfully`, 475 pages, TypeScript error 0.

### 2. 로컬 dev 전수 회귀 (21 케이스)
```bash
npm run dev
```

**기존 18 케이스** (CW31 매트릭스): 전부 동일 값 (forwarder 3 케이스 제외, 아래 재정의).

**forwarder 3 케이스 재정의**:

| # | 케이스 | Origin | Destinations | Product | Value | 기대 |
|---|-------|--------|-------------|---------|-------|------|
| 13' | forwarder-A | KR | [US, DE, JP] | cotton batch | 12000 | DE 또는 US 가 cheapest (EU-Korea 0%) |
| 14' | forwarder-B | KR | [US, GB, CA] | electronics | 8000 | US KORUS 0%, CA KCFTA 0%, GB 확인 |
| 15' | forwarder-C | CN | [KR, JP, SG] | toys | 5000 | Korea-China FTA, RCEP, ASEAN 각각 표시 |

**새 케이스 3건** (HAZMAT 확인):

| # | 케이스 | 기대 |
|---|-------|------|
| 19 | exporter KR→US Li-ion $250k | `restriction.summary` 에 "Primary Lithium Cells" 또는 "Lithium Batteries" 포함 |
| 20 | exporter KR→DE Li-ion $250k | 동일 경고 + EU-Korea FTA |
| 21 | exporter KR→JP Li-ion $250k | 동일 경고 + RCEP |

각 케이스 체크리스트:
- [ ] `X-Demo-Source: live` 응답 헤더
- [ ] forwarder 는 비교 테이블 표시, cheapest ★ 표시
- [ ] forwarder 는 첫 번째 destination 기준 상단 cost breakdown 표시
- [ ] 배터리 케이스는 restriction 영역에 HAZMAT 메시지 + requiredDocuments license 영역 표시
- [ ] DevPanel forwarder 탭에서 4개 언어 snippet 전부 live destinations 반영

### 3. HF1~HF4 레이아웃 회귀
- [ ] seller 기본 선택 유지
- [ ] 시나리오 버튼 `min-h-[52px]` 1줄
- [ ] Hero `text-[26px]` `pt-6 pb-4`
- [ ] CUSTOM 헤더 1개
- [ ] 2-column 박스 좌우 x좌표 일치

### 4. 프로덕션 배포
```bash
git add app/lib/cost-engine/restrictions/rules.ts \
        app/api/demo/scenario/route.ts \
        components/home/NonDevPanel.tsx \
        components/home/ScenarioPanel.tsx \
        components/home/DevPanel.tsx \
        components/home/MultiCountryPicker.tsx \
        lib/scenarios/workflow-examples.ts \
        lib/scenarios/mock-results.ts \
        CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md

git commit -m "fix(demo): complete CW31 scope — hazmat warnings + forwarder multi-dest (CW31-HF1)

- Add HS 8506 primary lithium cells rule to restrictions/rules.ts
- Surface checkRestrictions() output in mapEngineResultToMockShape (restriction.summary + license)
- forwarder: multi-select up to 5 destinations, parallel engine calls, comparison table
- mapForwarderResultsToMockShape() new helper, MockResult.comparisonRows new optional field
- DevPanel forwarder snippet: SCENARIO_DEFAULTS.destinations + renderWorkflowCode array substitution for curl/python/node/go
- Preserve HF1~HF4 layout, CW31 non-forwarder 15 cases (regression-free)
- 21 live cases pass, p95 850ms"

git push origin main
```

프로덕션 smoke test:
- [ ] `https://www.potal.app/?type=forwarder` → 3개 국가 선택 → Calculate → 비교 테이블 표시
- [ ] `https://www.potal.app/?type=exporter` → KR→US Li-ion $250k → HAZMAT 경고 표시
- [ ] `https://www.potal.app/?type=seller` → KR→US wallet $45 → $50.83 KORUS (회귀 없음)

---

## ⚠️ 주의

1. **HF1/HF2/HF3/HF4 레이아웃 금지** — forwarder 결과 영역 추가만 허용. `ScenarioPanel` max-width/padding 건드리지 말 것.
2. **CW31 seller/d2c/importer/exporter 결과값 ±$0.01 이내 유지** — 회귀 테스트 필수.
3. **console.log 금지** — `console.warn` 1회만 (엔진 실패 fallback 경로).
4. **MultiCountryPicker 는 TypeScript strict 준수** — any 금지.
5. **새 숫자 만들기 금지** — 배터리 HAZMAT 경고 문구는 `rules.ts` description 에서 가져옴, 하드코딩 금지.
6. **mock-results.ts forwarder mock 에 comparisonRows 샘플 추가 필수** — 엔진 실패 fallback 시 UI 깨짐 방지.
7. **force push 금지**.

---

## 🏁 완료 리포트 포맷

```
CW31-HF1 완료 ✅
- 파일 수정: rules.ts / route.ts / NonDevPanel.tsx / ScenarioPanel.tsx / DevPanel.tsx / workflow-examples.ts / mock-results.ts / CLAUDE.md
- 신규 파일: MultiCountryPicker.tsx
- Build: 475 pages ✓, TS error 0
- 18 CW31 회귀 케이스: forwarder 외 15 케이스 ±$0.01 이내 일치
- forwarder 3 신규 케이스: 전부 live 병렬 통과, cheapest 자동 감지
- HAZMAT 3 신규 케이스: restriction.summary 에 lithium 경고 표시 ✓
- p95 응답시간: ___ms (3 목적지 병렬 기준)
- HF1~HF4 회귀 없음
- 프로덕션 배포: 커밋 해시 <hash>, Vercel 배포 성공
- 4개 문서 2026-04-10 갱신 완료
- 이슈/의문점: <있으면 기재>
```

끝.
