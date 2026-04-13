# CW29 Sprint 7 Command — 실제 엔진 연결 + 성능 최적화

> 작성: 2026-04-10 KST
> 스펙: `docs/HOMEPAGE_REDESIGN_SPEC.md` 기술 전제 1~3 (657~672행) + Sprint 7 체크리스트 (725~729행)
> 실행 대상: 터미널1 Claude Code **Opus**
> 선행 완료: CW28-S6 (커밋 `11dda21`, PartnerLinkSlot 예약)

---

## 🎯 목표

홈페이지 데모 API가 **진짜 POTAL 엔진**에서 결과를 받게 연결.
**2초 이내 p95 응답**을 보장하고, 실패 시 기존 mock 으로 자동 폴백 (UI 절대 안 깨짐).

### 해야 할 것 ✅
1. `/api/demo/scenario` POST 핸들러를 **real-first, mock-fallback** 구조로 전환
   - 기존 `source: 'mock'` 하드코딩 제거 → `'live' | 'mock'` 동적 반환
   - Sprint 2 주석 "Sprint 2: always source: mock. Later sprints can try..." 를 실제 구현으로 교체
2. 시나리오별 실제 엔진 호출 매핑:
   - **seller** (Online Seller): `/api/v1/classify` + `/api/v1/calculate` 체인
   - **d2c** (D2C Brand): `/api/v1/calculate` + `/api/v1/fta`
   - **importer**: `/api/v1/restrictions` + `/api/v1/calculate`
   - **exporter**: `/api/v1/screening` + `/api/v1/classify/eccn`
   - **forwarder**: `/api/v1/verify/pre-shipment`
   - 실제 매핑은 `lib/scenarios/workflow-examples.ts`의 `apiChain`과 정합 맞추기
3. 내부 엔진 호출 시 `X-Demo-Request: true` 헤더 사용 (기존 withApiAuth 데모 바이패스)
4. 타임아웃 설정: 각 엔진 호출 **1.5초**, 전체 체인 **2.5초** (AbortSignal.timeout)
5. 타임아웃/에러 발생 시 `getMockResult(scenarioId)` 로 즉시 폴백 + `source: 'mock'` 반환 (UI는 그대로 동작)
6. 성능 로깅: `X-Response-Time: {ms}` 응답 헤더 추가, 느리면 POTAL MCP로 추적 가능
7. Supabase 쿼리 인덱스 점검 (이미 존재하는 인덱스 확인만, 마이그레이션은 필요 시):
   - `user_combos(user_id)`, `user_combos(share_slug) WHERE NOT NULL` (CW26-S4에서 생성됨)
   - `hs_code_catalog`, `tariff_rates`, `fta_rules` 테이블 쿼리 EXPLAIN ANALYZE 점검
   - **인덱스 추가는 안전한 것만** — 의심 시 적용 보류, 보고만
8. 51개 언어 자동 감지 검증 (별도 수정 최소):
   - 홈 접근 시 `accept-language` 헤더 기반 감지 로직 존재 여부 확인
   - 없으면 `middleware.ts` 또는 `HeaderMinimal.tsx`에서 `navigator.language` 기반 기본값 세팅 (쿠키 저장)
   - 51개 번역 파일 (`app/i18n/translations/`) 중 홈페이지 리디자인 컴포넌트 (HeaderMinimal / ScenarioSelector / NonDevPanel / DevPanel / LoginRequiredModal / PartnerLinkSlot)에 누락된 키 있으면 최소 영어 폴백 보장
9. Redis/Upstash 캐시 레이어 **검토만** (실제 구현은 보류 — 트래픽 1만+ 이후)
   - 리포트: "현재 /api/demo/scenario 평균 응답 XXXms, 캐시 도입 시 예상 효과" 를 `docs/CW29_PERFORMANCE_REPORT.md` 로 저장

### 하지 말아야 할 것 ❌
- **전체 시나리오 체인을 Edge Runtime으로 이전** (리스크 큼, 별도 스프린트)
- Redis/Upstash **실제 설치** (검토만)
- POTAL B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`) 수정
- 기존 `/api/v1/*` 엔드포인트 **로직 변경** (Sprint 7은 홈페이지 데모 래퍼만 건드림)
- Rate Limit 로직 **상향/하향** (기존 30/min 유지 — 홈페이지 데모 남용 방지 용도)
- 기존 mock 데이터 (`lib/scenarios/mock-results.ts`) 제거 — **폴백 필수 자산**

---

## 📏 절대 규칙

1. **UI 절대 깨지지 않음** — 엔진 실패 시 mock 폴백 100% 보장, NonDevPanel은 항상 결과를 받음
2. **p95 < 2000ms** — 측정 결과 초과 시 캐시/프리컴퓨트 고려 보고
3. **`npm run build` 성공 후 push**, `console.log` 금지 (performance 로그도 금지 — 응답 헤더만)
4. **기존 B2C 엔드포인트 호환성 유지** — `/api/v1/calculate` 등 기존 핸들러 시그니처 변경 금지
5. **커밋 메시지**: `feat(CW29-S7): ...` / `perf(CW29-S7): ...`
6. **X-Demo-Request 바이패스만 사용** — API 키 발급/저장 금지
7. **타임아웃 반드시 AbortSignal** — try/catch 로만 처리 금지
8. **응답 JSON 스키마 유지** — NonDevPanel이 `json.data.result` 구조 기대하므로 깨지면 안 됨
9. **폴백 시 UI 표시 문구 변경 금지** — "source: mock" 여부는 응답 메타에만, 사용자 화면엔 노출 X
10. **에러 스택 trace 외부 노출 금지** — 항상 generic "Demo temporarily unavailable" 메시지

---

## 🗂️ 구현 상세

### 1) `/api/demo/scenario/route.ts` 수정

기존 구조 유지 + `source: 'mock'` 하드코딩 부분만 교체.

```ts
// 신규 함수: 시나리오 → 실제 엔진 호출 매핑
async function tryLiveEngine(
  scenarioId: string,
  inputs: Record<string, string | number | undefined>,
  baseUrl: string
): Promise<MockResult | null> {
  try {
    const chain = getScenarioApiChain(scenarioId); // from lib/scenarios/workflow-examples.ts
    if (!chain || chain.length === 0) return null;

    const started = Date.now();
    const TIMEOUT_TOTAL = 2500;
    const TIMEOUT_PER_CALL = 1500;

    // 예: seller = [classify, calculate]
    // 순차 호출 (데이터 의존성), 총 2500ms 타임아웃
    const signal = AbortSignal.timeout(TIMEOUT_TOTAL);

    let classificationResult: any = null;
    let calculateResult: any = null;

    if (chain.includes('/api/v1/classify')) {
      const r = await fetch(`${baseUrl}/api/v1/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Request': 'true',
        },
        body: JSON.stringify({
          productName: inputs.productName || inputs.product || 'leather handbag',
          category: inputs.category,
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_PER_CALL)]),
      });
      if (r.ok) {
        const json = await r.json();
        classificationResult = json.data || json;
      }
    }

    if (chain.includes('/api/v1/calculate')) {
      const r = await fetch(`${baseUrl}/api/v1/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Request': 'true',
        },
        body: JSON.stringify({
          price: inputs.value || inputs.declaredValue || 45,
          shippingPrice: inputs.shipping || 12.5,
          origin: inputs.origin || 'CN',
          destinationCountry: inputs.destination || 'US',
          hsCode: classificationResult?.hsCode,
          zipcode: inputs.zipcode,
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_PER_CALL)]),
      });
      if (r.ok) {
        const json = await r.json();
        calculateResult = json.data || json;
      }
    }

    // Assemble MockResult-shaped response from live data
    if (calculateResult) {
      return shapeLiveToMock(scenarioId, classificationResult, calculateResult);
    }
    return null;
  } catch {
    // Any error (timeout, network, parsing) → fallback
    return null;
  }
}

// 신규 함수: 실제 엔진 응답 → MockResult 형태로 변환
function shapeLiveToMock(
  scenarioId: string,
  classify: any,
  calc: any
): MockResult {
  // Map live engine response fields to the MockResult shape NonDevPanel expects.
  // Keep unknown fields from mock as baseline so UI never shows "undefined".
  const baseline = getMockResult(scenarioId)!;
  return {
    ...baseline,
    hsCode: classify?.hsCode || baseline.hsCode,
    hsCodeDescription: classify?.description || baseline.hsCodeDescription,
    landedCost: {
      productValue: calc?.productValue ?? baseline.landedCost.productValue,
      duty: calc?.duty ?? baseline.landedCost.duty,
      taxes: calc?.taxes ?? baseline.landedCost.taxes,
      shipping: calc?.shippingCost ?? baseline.landedCost.shipping,
      fees: calc?.fees ?? baseline.landedCost.fees,
      total: calc?.total ?? baseline.landedCost.total,
    },
    // restriction / hsConfidence stays on baseline for now (future sprints)
  };
}

// POST 핸들러 내부:
const startedAt = Date.now();
const baseUrl = new URL(req.url).origin;
const live = await tryLiveEngine(scenarioId, inputs, baseUrl);
const result = live ?? applyInputsToResult(mock, inputs);
const source: 'mock' | 'live' = live ? 'live' : 'mock';

const response = NextResponse.json(
  { success: true, data: { scenarioId, source, inputs, result, generatedAt: new Date().toISOString() } },
  { headers: { 'Cache-Control': 'no-store', 'X-Response-Time': `${Date.now() - startedAt}` } }
);
return response;
```

### 2) `lib/scenarios/workflow-examples.ts` 확인 & 확장

`getScenarioApiChain(scenarioId)` helper 함수 추가. 각 시나리오 `apiChain` 배열을 export 가능한 형태로 노출.

```ts
export function getScenarioApiChain(scenarioId: string): string[] {
  const example = getWorkflowExample(scenarioId);
  return example?.apiChain || [];
}
```

### 3) 51개 언어 자동 감지 점검

먼저 기존 동작 확인:
```bash
grep -rn "accept-language" app/ middleware.ts 2>/dev/null
grep -rn "navigator.language" app/ components/ 2>/dev/null
```

- **존재**: 동작만 확인하고 보고 (코드 수정 없음)
- **미존재**: `middleware.ts`에서 `accept-language` 헤더 파싱 → `NEXT_LOCALE` 쿠키 세팅
- HeaderMinimal의 언어 드롭다운은 기존 컴포넌트 재사용, 수정 금지

**검증 스크립트**:
```bash
ls app/i18n/translations/ | wc -l  # 51이어야 함
```

### 4) Supabase 인덱스 점검

```sql
-- 점검만 (수정 X)
\d+ user_combos
\d+ hs_code_catalog  -- 있으면
\d+ tariff_rates
```

Opus는 **EXPLAIN ANALYZE** 를 몇 개 샘플 쿼리에 돌려서 느린 것 (>100ms) 만 `docs/CW29_PERFORMANCE_REPORT.md` 에 기록. 실제 인덱스 추가는 Sprint 8 이후로 보류.

### 5) `docs/CW29_PERFORMANCE_REPORT.md` 신규 생성

내용 템플릿:
```markdown
# CW29 Sprint 7 Performance Report

## 데모 API 응답 속도 (p50/p95/p99)
| Scenario | p50 | p95 | p99 | live 성공률 |
|---|---|---|---|---|
| seller | ... | ... | ... | ...% |
| d2c | ... | ... | ... | ...% |
| importer | ... | ... | ... | ...% |
| exporter | ... | ... | ... | ...% |
| forwarder | ... | ... | ... | ...% |

측정 방법: `curl -X POST https://www.potal.app/api/demo/scenario ...` × 20회

## 병목
- [느린 엔진 엔드포인트 나열]
- [Supabase 쿼리 EXPLAIN 결과]

## 캐시 레이어 검토 (Redis/Upstash)
- 도입 시 예상 효과: p95 XXXms → YYYms
- 비용: Upstash Free Tier 10k/day 가능
- 결론: [도입 권고 / 보류 / 불필요]

## 인덱스 제안 (Sprint 8 이후)
- [테이블].[컬럼] → [기대 효과]
```

---

## ✅ 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] 홈 → Online Seller → Calculate → 2초 이내 결과 표시
- [ ] DevTools Network 탭에서 `/api/demo/scenario` 응답에 `X-Response-Time: {ms}` 헤더 존재
- [ ] 응답 JSON 에 `data.source` = `'live'` 또는 `'mock'` (하드코딩 아님)
- [ ] 엔진 타임아웃 시뮬레이션 시 (예: 잠깐 네트워크 끊기) UI 여전히 결과 카드 표시 (mock 폴백)
- [ ] 5개 시나리오 (seller/d2c/importer/exporter/forwarder) 전부 Calculate 동작
- [ ] NonDevPanel의 [📋] 클릭 → LoginRequiredModal 여전히 동작 (CW27 게이트 regression 없음)
- [ ] CUSTOM 빌더 Save → LoginRequiredModal 정상
- [ ] PartnerLinkSlot 결과 하단에 여전히 노출 (CW28 regression 없음)
- [ ] `grep -rn "console\.log" app/api/demo` 결과 0
- [ ] TypeScript strict 통과
- [ ] `docs/CW29_PERFORMANCE_REPORT.md` 작성됨
- [ ] 51개 번역 파일 개수 확인 (`ls app/i18n/translations/ | wc -l` ≥ 51)

---

## 📝 완료 후 필수 문서 업데이트

1. **CLAUDE.md** 헤더 → "마지막 업데이트: 2026-04-XX KST (CW29-S7 완료: 데모 API real-first + mock fallback, 5 scenarios live, p95 XXXms. XXX pages ✓)"
2. **docs/CHANGELOG.md** → 맨 위 CW29-S7 섹션
3. **session-context.md** → CW29-S7 완료 블록
4. **docs/NEXT_SESSION_START.md** → Sprint 8 (E2E + 배포) 가이드
5. **docs/CW29_PERFORMANCE_REPORT.md** 신규 (이번 세션에 작성)

---

## 🚫 Sprint 7 범위 외

- Sprint 8 (CW30): E2E 테스트, 비로그인 경로 검증, 모바일 안내 페이지, 프로덕션 최종 배포
- Redis/Upstash 실제 설치 (검토만)
- `/api/v1/*` 엔드포인트 로직 변경
- 인덱스 신규 생성 (점검·보고만)
- Edge Runtime 이전

---

## 👉 실행 순서

```
1. Read app/api/demo/scenario/route.ts 현재 구조 재확인
2. lib/scenarios/workflow-examples.ts 에 getScenarioApiChain() 추가
3. /api/demo/scenario/route.ts 에 tryLiveEngine + shapeLiveToMock 추가
4. POST 핸들러에 real-first, mock-fallback 연결
5. X-Response-Time 응답 헤더 추가
6. 51개 번역 파일 개수 확인
7. 5개 시나리오 smoke test (curl 또는 localhost)
8. Supabase EXPLAIN ANALYZE 샘플 쿼리
9. docs/CW29_PERFORMANCE_REPORT.md 작성
10. npm run build
11. 브라우저 smoke test (CW27 게이트 + CW28 슬롯 regression 없음)
12. git add / commit: feat(CW29-S7): real engine hookup + mock fallback + perf report
13. git push
14. 4개 문서 + 신규 리포트 (총 5개) 날짜 갱신
```

완료 후 보고 형식:
```
CW29 Sprint 7 완료
- 수정: app/api/demo/scenario/route.ts, lib/scenarios/workflow-examples.ts
- 신규: docs/CW29_PERFORMANCE_REPORT.md
- 5 scenarios live 성공률: seller X%, d2c X%, importer X%, exporter X%, forwarder X%
- p95: XXXms (타겟 2000ms 달성/미달)
- 빌드: ✓ (XXX pages)
- 커밋: [해시]
- 배포: [Vercel dpl_XXX]
```
