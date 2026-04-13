# CW29 Sprint 7.5 Command — Precompute Live Baseline (Real Engine Data, Fast Response)

> 작성: 2026-04-10 KST
> 스펙: `docs/HOMEPAGE_REDESIGN_SPEC.md` 기술 전제 2 (응답 < 2초) + Sprint 7 실측 결과
> 실행 대상: 터미널1 Claude Code **Opus**
> 선행 완료: CW29-S7 (real-first + mock fallback 구조, 커밋 `a007501`)

---

## 🔍 Sprint 7 실측 결과 요약 (왜 7.5가 필요한가)

브라우저에서 프로덕션 검증한 실데이터:

| 지표 | 값 |
|---|---|
| 데모 API 10회 호출 성공률 | 100% (UI 안 깨짐 ✓) |
| `X-Demo-Source: live` 비율 | **0/10** (전부 mock 폴백) |
| p50 server ms | ~1550 |
| p95 server ms | ~2132 (목표 2000 초과) |

### 근본 원인 (브라우저에서 직접 측정)

1. **`/api/v1/classify` 필수 필드 누락** → 400 에러로 폴백
   - 현재 코드가 보내는 필드: `{productName, description, originCountry, destinationCountry}`
   - 실제 필요 필드: `{productName, material, category, intendedUse, targetUser, originCountry}` (`material` 누락 시 `"Field validation failed"`)

2. **`/api/v1/calculate` 실측 4123ms (warm call)**
   - `TIMEOUT_PER_CALL_MS = 1500` 내에 절대 못 끝남
   - `TIMEOUT_TOTAL_MS = 2500` 전체 데드라인도 초과
   - 이유: GRI pipeline + AD/CVD lookup + FTA 조회 + tariff DB + de-minimis 체크 등 heavy chain
   - 단일 호출만 해도 UX 예산(2s) 초과

3. **필드 매핑은 실제로 정확함** (shapeLiveToMock의 pickNumber 키는 `importDuty`, `salesTax`, `shippingCost`, `totalLandedCost` — 실제 응답에 전부 존재)
   - 즉, **calculate만 성공하면 매핑은 정상 동작** — 하지만 시간 내 성공 못 함

### 결론

실시간 HTTP 호출로는 **절대 2초 안에 못 들어옴**. 엔진 자체가 4초+ 걸리는 heavy 연산. UX 예산 안에서 real 데이터 보여주려면 **precompute + cache** 밖에 없음.

---

## 🎯 Sprint 7.5 목표

**"Live 엔진 결과를 precompute하고 JSON으로 캐싱, 데모 API는 캐시에서 즉시 반환."**

### 핵심 아이디어

1. **one-time 스크립트** (`scripts/precompute-scenario-baselines.mjs`) 로 5개 시나리오를 실제 엔진(`/api/v1/classify` + `/api/v1/calculate`)에 돌려서 결과 수집
2. 결과를 `lib/scenarios/live-baseline.json` (커밋됨) 에 저장
3. `/api/demo/scenario` POST 핸들러를 **cache-first**로 수정:
   - `live-baseline.json` 읽음 (< 5ms) → 사용자 입력값에 맞춰 비례 스케일링 → 즉시 반환
   - `source: 'live-cached'` 로 표기
   - JSON 없으면 기존 `mock-results.ts` 폴백 (UI 절대 안 깨짐)
4. 기존 `tryLiveEngine()` HTTP 호출 **제거** (실제로 한 번도 성공 안 해서 latency만 추가)
5. classify 필드 누락 문제는 precompute 스크립트에서 **완전한 필드 세트**로 해결

### Before / After

| | Before (Sprint 7) | After (Sprint 7.5) |
|---|---|---|
| source | 100% mock | 100% live-cached (정상 시) |
| p95 | ~2132ms | < 100ms |
| 엔진 호출 | 매 request마다 HTTP fetch | 0회 (static JSON 읽기) |
| 데이터 신선도 | mock 영구 | 수동 재생성 or cron |
| 폴백 구조 | mock | mock (JSON 없을 때) |
| UI regression 리스크 | 0 | 0 |

---

## 📏 절대 규칙

1. **UI 절대 깨지지 않음** — `live-baseline.json` 없으면 즉시 mock 폴백
2. **`MockResult` 스키마 그대로 유지** — NonDevPanel은 `landedCost.productValue / duty / taxes / shipping / fees / total` 기대
3. **precompute 스크립트는 프로덕션 엔드포인트 호출** (로컬 dev 서버 X — 프로덕션 tariff DB 반영된 값 필요)
4. **`npm run build` 실행 중 네트워크 호출 금지** — Vercel 빌드 중 외부 엔진 fetch는 리스크 (precompute는 수동 실행)
5. **`console.log` 금지** — 스크립트 내부는 `process.stdout.write` 또는 주석
6. **B2C 코드 수정 금지** (`lib/search/`, `lib/agent/`, `components/search/`)
7. **커밋 메시지**: `perf(CW29-S7.5): ...` / `fix(CW29-S7.5): ...`
8. **기존 CW27 로그인 게이트 / CW28 PartnerLinkSlot regression 0** — 수정 범위는 `/api/demo/scenario` 와 scenarios 폴더만
9. **`source` 타입 확장**: `'mock' | 'live' | 'live-cached'` (live는 향후 확장 여지로 유지)
10. **precompute 스크립트는 repo에 커밋하되 CI/빌드에 연결 안 함** — 수동 `node scripts/precompute-scenario-baselines.mjs` 로만 실행

---

## 🗂️ 구현 상세

### 1) `scripts/precompute-scenario-baselines.mjs` — 신규

one-time 수동 실행 스크립트. 프로덕션 `https://www.potal.app` 을 호출해서 실제 엔진 데이터 수집.

```js
#!/usr/bin/env node
/**
 * CW29 Sprint 7.5 — Precompute live baseline for homepage demo scenarios.
 *
 * Runs once against production POTAL engines with X-Demo-Request bypass.
 * Output: lib/scenarios/live-baseline.json (committed to repo).
 *
 * Usage:
 *   node scripts/precompute-scenario-baselines.mjs
 *   node scripts/precompute-scenario-baselines.mjs --base=https://www.potal.app
 *
 * Re-run manually when tariffs are updated or engine logic changes.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../lib/scenarios/live-baseline.json');

const BASE =
  process.argv.find(a => a.startsWith('--base='))?.split('=')[1] ||
  'https://www.potal.app';

// 5개 시나리오의 precompute 입력 (스펙 시나리오 섹션 기준)
const SCENARIOS = [
  {
    id: 'seller',
    classify: {
      productName: 'leather handbag',
      material: 'leather',
      category: 'bags',
      intendedUse: 'personal',
      targetUser: 'adult',
      originCountry: 'CN',
    },
    calculate: {
      price: 45,
      shippingPrice: 12.5,
      origin: 'CN',
      destinationCountry: 'US',
      zipcode: '10001',
    },
  },
  {
    id: 'd2c',
    classify: {
      productName: 'cotton t-shirt',
      material: 'cotton',
      category: 'apparel',
      intendedUse: 'personal',
      targetUser: 'adult',
      originCountry: 'VN',
    },
    calculate: {
      price: 28,
      shippingPrice: 8,
      origin: 'VN',
      destinationCountry: 'KR',
    },
  },
  {
    id: 'importer',
    classify: {
      productName: 'industrial centrifugal pump',
      material: 'stainless steel',
      category: 'machinery',
      intendedUse: 'industrial',
      targetUser: 'business',
      originCountry: 'DE',
    },
    calculate: {
      price: 85000,
      shippingPrice: 2400,
      origin: 'DE',
      destinationCountry: 'US',
    },
  },
  {
    id: 'exporter',
    classify: {
      productName: 'lithium-ion battery module',
      material: 'lithium-ion',
      category: 'electronics',
      intendedUse: 'industrial',
      targetUser: 'business',
      originCountry: 'KR',
    },
    calculate: {
      price: 250000,
      shippingPrice: 6800,
      origin: 'KR',
      destinationCountry: 'DE',
    },
  },
  {
    id: 'forwarder',
    classify: {
      productName: 'cotton t-shirt bulk shipment',
      material: 'cotton',
      category: 'apparel',
      intendedUse: 'commercial',
      targetUser: 'business',
      originCountry: 'BD',
    },
    calculate: {
      price: 12000,
      shippingPrice: 850,
      origin: 'BD',
      destinationCountry: 'US',
    },
  },
];

async function hit(endpoint, body) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Request': 'true',
    },
    body: JSON.stringify(body),
  });
  const elapsed = Date.now() - t0;
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, elapsed, json };
}

async function precomputeOne(scenario) {
  process.stdout.write(`[${scenario.id}] classify... `);
  const classifyRes = await hit('/api/v1/classify', scenario.classify);
  process.stdout.write(`${classifyRes.elapsed}ms ${classifyRes.ok ? 'OK' : 'FAIL'}\n`);

  const hsCode = classifyRes.json?.data?.hsCode || null;

  process.stdout.write(`[${scenario.id}] calculate... `);
  const calcRes = await hit('/api/v1/calculate', {
    ...scenario.calculate,
    ...(hsCode ? { hsCode } : {}),
  });
  process.stdout.write(`${calcRes.elapsed}ms ${calcRes.ok ? 'OK' : 'FAIL'}\n`);

  if (!calcRes.ok || !calcRes.json?.data) {
    process.stdout.write(`[${scenario.id}] SKIP (calculate failed)\n`);
    return null;
  }

  const calc = calcRes.json.data;
  const classify = classifyRes.json?.data || null;

  // Shape into MockResult structure (identical to shapeLiveToMock in route.ts)
  return {
    scenarioId: scenario.id,
    source: 'live-cached',
    capturedAt: new Date().toISOString(),
    classifyElapsedMs: classifyRes.elapsed,
    calculateElapsedMs: calcRes.elapsed,
    hsCode: classify?.hsCode || calc.hsClassification?.hsCode || null,
    hsDescription:
      classify?.description ||
      calc.hsClassification?.description ||
      null,
    landedCost: {
      currency: calc.destinationCurrency || 'USD',
      productValue: Number(calc.productPrice ?? scenario.calculate.price),
      duty: Number(calc.importDuty ?? 0),
      dutyRate: Number(
        calc.dutyType === 'ad_valorem' && calc.importDuty && calc.productPrice
          ? calc.importDuty / calc.productPrice
          : calc.tariffOptimization?.mfnRate ?? 0
      ),
      taxes: Number(calc.vat ?? calc.salesTax ?? 0),
      shipping: Number(calc.shippingCost ?? scenario.calculate.shippingPrice),
      fees: Number((calc.mpf ?? 0) + (calc.insurance ?? 0)),
      total: Number(calc.totalLandedCost ?? 0),
    },
    restriction: {
      blocked: calc.regulatory_warnings?.some(w => w.category === 'restriction') || false,
      summary:
        calc.regulatory_warnings?.[0]?.note ||
        `De minimis threshold: ${calc.destinationCurrency || 'USD'} ${calc.de_minimis_detail?.threshold ?? 0}`,
    },
    notes: (calc.regulatory_warnings || [])
      .slice(0, 3)
      .map(w => w.note)
      .filter(Boolean),
  };
}

async function main() {
  process.stdout.write(`Precomputing baselines from ${BASE}\n\n`);

  const results = {};
  for (const scenario of SCENARIOS) {
    const result = await precomputeOne(scenario);
    if (result) results[scenario.id] = result;
  }

  const successCount = Object.keys(results).length;
  process.stdout.write(`\n${successCount}/${SCENARIOS.length} scenarios precomputed\n`);

  if (successCount === 0) {
    process.stdout.write('ERROR: All scenarios failed. Aborting write.\n');
    process.exit(1);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: BASE,
    scenarios: results,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  process.stdout.write(`\nWrote ${OUTPUT_PATH}\n`);
}

main().catch(err => {
  process.stderr.write(`Precompute failed: ${err?.message || err}\n`);
  process.exit(1);
});
```

### 2) `lib/scenarios/live-baseline.ts` — 신규 (loader)

```ts
/**
 * CW29 Sprint 7.5 — Live baseline loader.
 *
 * Reads precomputed scenario results from live-baseline.json (committed).
 * Returns null if file missing or scenario not present → caller falls back
 * to mock-results.ts so the UI never breaks.
 */

import type { MockResult } from './mock-results';

// Imported at build time — Next.js will inline the JSON into the server bundle.
// If the file is missing during build, the import fails loudly and Opus knows
// to run the precompute script first.
import baseline from './live-baseline.json' with { type: 'json' };

interface LiveBaselineFile {
  generatedAt: string;
  source: string;
  scenarios: Record<string, LiveBaselineEntry>;
}

interface LiveBaselineEntry extends MockResult {
  capturedAt: string;
  classifyElapsedMs: number;
  calculateElapsedMs: number;
}

const typed = baseline as unknown as LiveBaselineFile;

export function getLiveBaseline(scenarioId: string): MockResult | null {
  const entry = typed.scenarios?.[scenarioId];
  if (!entry) return null;
  // Defensive: ensure required landedCost fields are numbers
  const lc = entry.landedCost;
  if (
    !lc ||
    !Number.isFinite(lc.productValue) ||
    !Number.isFinite(lc.total)
  ) {
    return null;
  }
  return {
    scenarioId: entry.scenarioId,
    hsCode: entry.hsCode,
    hsDescription: entry.hsDescription,
    landedCost: lc,
    restriction: entry.restriction,
    notes: entry.notes || [],
  };
}

export function getBaselineMetadata(): { generatedAt: string; source: string } {
  return {
    generatedAt: typed.generatedAt,
    source: typed.source,
  };
}
```

### 3) `lib/scenarios/live-baseline.json` — 신규 (precompute 출력)

Opus가 `node scripts/precompute-scenario-baselines.mjs` 실행 후 자동 생성. 커밋 필수.

**중요**: 5개 시나리오 중 일부만 성공해도 OK — JSON에 있는 것만 live-cached로 반환, 나머지는 mock으로 폴백.

### 4) `app/api/demo/scenario/route.ts` 수정

핵심 변경:
- `tryLiveEngine()` 함수 **전체 제거** (HTTP 호출 경로)
- 신규: `tryLiveCachedResult()` — JSON에서 읽기
- POST 핸들러의 liveResult 호출 부분 교체

```ts
// 상단 import 추가
import { getLiveBaseline } from '@/lib/scenarios/live-baseline';

// source 타입 확장
interface DemoResponseData {
  scenarioId: string;
  source: 'mock' | 'live' | 'live-cached';
  inputs: Record<string, string | number | undefined>;
  result: MockResult;
  generatedAt: string;
}

// 신규 함수: precomputed JSON 에서 baseline 읽고 입력 스케일링
function tryLiveCachedResult(
  scenarioId: string,
  inputs: Record<string, string | number | undefined>
): MockResult | null {
  const baseline = getLiveBaseline(scenarioId);
  if (!baseline) return null;
  return applyInputsToResult(baseline, inputs);
}

// POST 핸들러에서 기존 tryLiveEngine 호출 부분 교체:
// 기존:
//   const totalDeadline = startedAt + TIMEOUT_TOTAL_MS;
//   const liveResult = await tryLiveEngine(scenarioId, inputs, baseUrl, totalDeadline);
//   const result = liveResult ?? applyInputsToResult(mock, inputs);
//   const source: 'mock' | 'live' = liveResult ? 'live' : 'mock';
//
// 신규:
const cached = tryLiveCachedResult(scenarioId, inputs);
const result = cached ?? applyInputsToResult(mock, inputs);
const source: 'mock' | 'live-cached' = cached ? 'live-cached' : 'mock';
```

**제거할 것**:
- `tryLiveEngine` 함수 전체 (주석 포함)
- `timedFetch`, `pickNumber`, `pickString`, `shapeLiveToMock` — 더 이상 사용 안 함
- `TIMEOUT_PER_CALL_MS`, `TIMEOUT_TOTAL_MS` 상수
- `getScenarioApiChain` import (이 파일에서는 안 쓰지만 workflow-examples.ts 의 helper는 남겨둠 — DevPanel이 쓰니까)
- `const baseUrl = new URL(req.url).origin;` 라인 (더 이상 필요 없음)

**남길 것**:
- `applyInputsToResult()` — live-cached baseline에도 적용됨
- IP throttle (30/min)
- mock fallback 경로
- `X-Response-Time`, `X-Demo-Source`, `Cache-Control` 헤더

### 5) 실행 순서 (Opus)

```bash
# Step 1: 명령어 문서 읽기
cat docs/CW29_SPRINT7_5_COMMAND.md

# Step 2: 스크립트 파일 생성
# (위의 precompute 코드를 scripts/precompute-scenario-baselines.mjs 에 저장)

# Step 3: loader 파일 생성
# (lib/scenarios/live-baseline.ts)

# Step 4: 스크립트 실행 (프로덕션 엔진 호출, 5 scenarios × ~5s = ~25s 예상)
node scripts/precompute-scenario-baselines.mjs

# Step 5: 결과 확인
cat lib/scenarios/live-baseline.json | head -50

# Step 6: route.ts 수정 (tryLiveEngine 제거, tryLiveCachedResult 추가)

# Step 7: TypeScript 체크
npx tsc --noEmit

# Step 8: 빌드
npm run build

# Step 9: 로컬 스모크 테스트 (옵션 — 프로덕션 배포 후 검증해도 됨)
# npm run dev
# curl -X POST http://localhost:3000/api/demo/scenario -H 'Content-Type: application/json' -d '{"scenarioId":"seller"}'

# Step 10: 커밋 & 푸시
git add scripts/precompute-scenario-baselines.mjs lib/scenarios/live-baseline.ts lib/scenarios/live-baseline.json app/api/demo/scenario/route.ts
git commit -m "perf(CW29-S7.5): precompute live baseline, instant cached responses"
git push

# Step 11: 5개 문서 날짜 갱신 (CLAUDE/CHANGELOG/session-context/NEXT_SESSION_START + CW29_PERFORMANCE_REPORT 섹션 3-2 업데이트)
```

---

## ✅ 검증 체크리스트

### 빌드 & 타입
- [ ] `node scripts/precompute-scenario-baselines.mjs` 성공 → `lib/scenarios/live-baseline.json` 생성됨
- [ ] 5개 시나리오 중 **최소 3개** 이상 성공 (calculate 2xx)
- [ ] `npm run build` 성공 (475 pages ±)
- [ ] `npx tsc --noEmit` 에러 0
- [ ] `grep -rn "tryLiveEngine\|timedFetch\|shapeLiveToMock" app/api/demo/` 결과 0 (완전 제거 확인)
- [ ] `grep -rn "console\.log" app/api/demo scripts/` 결과 0

### 프로덕션 동작 (배포 후 브라우저에서 측정)
- [ ] `curl -X POST https://www.potal.app/api/demo/scenario -H 'Content-Type: application/json' -d '{"scenarioId":"seller","inputs":{"value":45}}'` 응답
  - `data.source === 'live-cached'` (또는 JSON에 없으면 'mock')
  - `X-Response-Time < 200` (목표: < 100)
  - `X-Demo-Source` 헤더 존재
- [ ] 5개 시나리오 전부 200 OK + `success: true`
- [ ] p95 **< 200ms** (Sprint 7의 2132ms 대비 10배 개선)
- [ ] DevTools Network 탭에서 `/api/demo/scenario` 응답 시간 < 300ms (서버 + 네트워크 포함)

### UI Regression (CW27 + CW28 유지)
- [ ] 비로그인 → Seller 시나리오 → Calculate → 결과 카드 표시
- [ ] NonDevPanel `[📋]` 클릭 → "Log in to copy" modal (CW27 게이트 유지)
- [ ] 결과 하단 "Ship this with" + SPONSORED + 4 placeholder (CW28 유지)
- [ ] CUSTOM → 체크박스 선택 → "Save this combo" → "Log in to save your combo" modal
- [ ] CUSTOM → 조립 코드 하단 PartnerLinkSlot 표시
- [ ] ESC / backdrop click 모달 닫기

### 데이터 정확성
- [ ] `live-baseline.json` 의 `seller.landedCost.productValue === 45`
- [ ] `live-baseline.json` 의 각 entry에 `hsCode`, `hsDescription`, `landedCost.total > 0`
- [ ] NonDevPanel에서 Calculate 시 표시되는 "Total landed cost" 숫자가 mock이랑 **다름** (실제 엔진 데이터임을 의미)
- [ ] 입력값 변경 (value 45 → 100) 시 비례 스케일링 정상 동작

---

## 📝 완료 후 필수 문서 업데이트

1. **CLAUDE.md** 헤더 → "마지막 업데이트: 2026-04-10 KST (CW29-S7.5 완료: live 엔진 precompute + 캐시 — lib/scenarios/live-baseline.json 생성, p95 XXXms → <200ms, source: live-cached. 475 pages ✓)"
2. **docs/CHANGELOG.md** → 맨 위 CW29-S7.5 섹션 (before/after 테이블 포함)
3. **session-context.md** → CW29-S7.5 완료 블록, Sprint 7의 "live 0%" 문제 해결 기록
4. **docs/NEXT_SESSION_START.md** → Sprint 8 (E2E + 배포) 가이드로 갱신
5. **docs/CW29_PERFORMANCE_REPORT.md** → 섹션 3-2 "실측 p50/p95/p99" 채우기:
   - Before (Sprint 7): p50 1550ms, p95 2132ms, live 성공률 0%
   - After (Sprint 7.5): p50 ~30ms, p95 <200ms, live-cached 성공률 ≥ 60%
   - 추천: cron으로 주 1회 `node scripts/precompute-scenario-baselines.mjs` 자동화 (Sprint 9 이후)

---

## 🚫 Sprint 7.5 범위 외 (건드리지 말 것)

- Redis/Upstash 설치 (검토만 완료, 구현 X)
- 실시간 HTTP 엔진 호출 재도입 (속도 안 맞음 — 영구 포기)
- `/api/v1/calculate` 자체 최적화 (엔진 팀 별도 프로젝트)
- GitHub Action cron 자동화 (Sprint 9+)
- B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`)
- Sprint 8 범위: E2E 테스트, 모바일 가드, 최종 배포

---

## 완료 보고 형식

```
CW29 Sprint 7.5 완료
- 신규 3개:
  * scripts/precompute-scenario-baselines.mjs
  * lib/scenarios/live-baseline.ts
  * lib/scenarios/live-baseline.json (precompute 결과)
- 수정 1개: app/api/demo/scenario/route.ts (tryLiveEngine 제거, cache-first)
- precompute 결과: 5/5 또는 N/5 scenarios 성공
- Before: p95 2132ms, live 0%
- After: p95 XXms, live-cached X/5
- 빌드: ✓ (475 pages)
- 커밋: [해시]
- 배포: [Vercel dpl_XXX]
```
