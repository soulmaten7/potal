# CW29 Sprint 7 — Performance Report

> Generated: 2026-04-10 KST
> Scope: `/api/demo/scenario` live engine hookup + baseline measurement

---

## 1. 구조 변경 요약

### Before (Sprint 2 · CW24)
`POST /api/demo/scenario` 는 항상 `source: 'mock'` 만 반환. mock 데이터를 사용자 입력값(`value`)으로 선형 스케일링한 결과를 NonDevPanel 에 전달. 엔진 호출 0건.

### After (Sprint 7 · CW29)
1. 요청 도착 → IP throttle (30 req/min) → scenarioId/body 검증
2. `getScenarioApiChain(scenarioId)` 로 실제 Next.js route 경로 조회 (`/api/v1/classify`, `/api/v1/calculate`)
3. **1차 시도 — live engine chain**:
   - `classify` 단계 (선택): `timedFetch` 1.5s 타임아웃, `X-Demo-Request: true` 헤더로 withApiAuth 데모 바이패스 사용
   - `calculate` 단계 (필수): classify 결과의 `hsCode` 를 주입하여 재호출
   - 전체 체인 최대 2.5s (`TIMEOUT_TOTAL_MS`)
4. `shapeLiveToMock()` — live 응답을 NonDevPanel 이 기대하는 `MockResult` 형태로 변환
   - `pickNumber` / `pickString` helper 로 필드명 다양성 흡수 (`importDuty`/`duty`/`dutyAmount`, `totalLandedCost`/`total` 등)
   - 누락 필드는 scenario mock baseline 에서 상속 → UI 에 `undefined` 노출 절대 없음
5. **2차 fallback — mock**: 타임아웃, 네트워크 에러, JSON 파싱 실패, `duty`+`total` 모두 없음 → `applyInputsToResult(mock, inputs)` 반환
6. 응답에 `X-Response-Time: {ms}` + `X-Demo-Source: {live|mock}` 헤더 추가

### 시나리오 → Real API chain 매핑

| scenarioId | Real route chain |
|---|---|
| `seller` | `/api/v1/classify` → `/api/v1/calculate` |
| `d2c` | `/api/v1/classify` → `/api/v1/calculate` |
| `importer` | `/api/v1/classify` → `/api/v1/calculate` |
| `exporter` | `/api/v1/classify` → `/api/v1/calculate` |
| `forwarder` | `/api/v1/calculate` |

`workflow-examples.ts` 의 `apiChain` 은 사용자에게 보여주는 marketing 경로 (`/v1/classify` 등) 이므로 그대로 두고, 실제 호출은 `getScenarioApiChain()` helper 가 관리.

---

## 2. 타임아웃 / 안정성 전략

| 항목 | 값 | 근거 |
|---|---|---|
| `TIMEOUT_PER_CALL_MS` | 1500ms | 스펙 "각 엔진 호출 1.5초" (CW29 command 4번 항목) |
| `TIMEOUT_TOTAL_MS` | 2500ms | 스펙 "전체 체인 2.5초" |
| IP throttle | 30 req/min | Sprint 2 에서 설정, 홈페이지 데모 남용 방지 |
| Fallback | `getMockResult(scenarioId)` | 엔진 실패 시 100% UI 유지 |
| Error leakage | 차단 | stack trace / 엔진 내부 에러는 외부 응답에 노출 X |

`AbortSignal.timeout()` 기반, try/catch 로 덮어써서 어떤 실패도 조용히 mock fallback.

---

## 3. 성능 측정

### 3-1. 로컬 빌드
- `npm run build` ✓
- Compiled successfully in 17.1s (Turbopack)
- 475 static pages generated

### 3-2. 프로덕션 실측 — Sprint 7 vs Sprint 7.5

**Sprint 7 (real-time HTTP)** — 브라우저 DevTools 측정:

| 지표 | 값 |
|---|---|
| 데모 API 10회 호출 성공률 | 100% (UI 안 깨짐) |
| `X-Demo-Source: live` 비율 | 0/10 (전부 mock 폴백) |
| p50 server ms | ~1550 |
| p95 server ms | ~2132 (목표 2000 초과 ❌) |

**근본 원인**:
1. `/api/v1/classify` 필수 필드 누락 → 400 → mock 폴백
2. `/api/v1/calculate` 실측 4123ms (warm call) → 1.5s per-call 타임아웃 초과 → mock 폴백
3. 즉, **실시간 HTTP 경로로는 2초 예산 절대 못 맞춤**

**Sprint 7.5 precompute 실측** (`node scripts/precompute-scenario-baselines.mjs` 결과):

| Scenario | classify ms | calculate ms | 결과 |
|---|---|---|---|
| seller | 2702 | 3447 | ✅ OK |
| d2c | 961 | 3635 | ✅ OK |
| importer | 1152 | 3402 | ✅ OK |
| exporter | 998 | 3792 | ✅ OK |
| forwarder | 998 | 3200 | ✅ OK |

→ **5/5 scenarios precomputed**. Heavy 엔진 호출을 일회성 빌드 타임 작업으로 분리.

**Sprint 7.5 (cache-first)** — 목표:

| Scenario | Before p95 | After p95 (목표) | 개선 |
|---|---|---|---|
| seller | 2132ms | < 100ms | ~20x |
| d2c | 2132ms | < 100ms | ~20x |
| importer | 2132ms | < 100ms | ~20x |
| exporter | 2132ms | < 100ms | ~20x |
| forwarder | 2132ms | < 100ms | ~20x |

`/api/demo/scenario` 는 이제 JSON 파일 읽기 + scaling 연산만 수행 → 서버 ms < 10ms 예상. 네트워크 latency 포함 p95 < 200ms 목표.

**데이터 신선도 전략**:
- 수동: 관세 스케줄 업데이트 시 `node scripts/precompute-scenario-baselines.mjs` 재실행 + 커밋
- 자동화 (Sprint 9+): GitHub Action cron (주 1회) + 자동 PR

---

## 4. Supabase 인덱스 점검

### 현재 확인된 인덱스 (CW26-S4 마이그레이션 058 반영)
- `user_combos(user_id)` — list/sort 용
- `user_combos(share_slug) WHERE share_slug IS NOT NULL` — 공유 URL lookup 용
- `user_combos_pkey` on `id`
- `user_combos_share_slug_key` UNIQUE

### 점검 대상 (EXPLAIN ANALYZE 권장 — Sprint 8 이전)
- `hs_code_catalog(hs_code)` — classify 엔진이 자주 lookup
- `tariff_rates(country, hs_prefix)` — calculate 엔진의 duty rate 조회
- `fta_rules(origin, destination, hs_prefix)` — FTA 적용 여부 조회
- `trade_remedies(hs_code, country)` — anti-dumping 체크

> **Sprint 7 정책**: 인덱스 신규 생성은 **보류**. 느린 쿼리 실측 후 Sprint 8 에서 마이그레이션.
> 자동 인덱스 추가의 리스크 (쓰기 성능 저하, 중복 인덱스) 가 크므로 **측정 → 제안 → 수동 승인** 순서 필수.

---

## 5. Redis / Upstash 캐시 레이어 검토

### 현재 상황
- 데모 API 는 **stateless**: 같은 inputs 에 대해 항상 같은 결과 (mock 이든 live 든)
- 트래픽: CW22 기준 외부 사용자 0명, MRR $0 → 캐시 필요성 낮음
- Vercel serverless cold start: 100~300ms 미만 — 캐시 없이도 p95 목표 달성 가능 예상

### 도입 시 예상 효과
- **key**: `demo:${scenarioId}:${sha256(inputs)}`
- **TTL**: 10분 (mock 결과는 immutable, live 결과는 짧게)
- 캐시 히트 시: 네트워크 hop 0개 → Redis 왕복 10~30ms
- 캐시 미스 시: 현재 구조 그대로 (classify + calculate)

### 비용
- **Upstash Free Tier**: 10,000 commands/day 무료
- **Upstash Pay-as-you-go**: $0.2 per 100k commands
- 예상 월 비용: 트래픽 1만+ 방문자 기준 ~$5 미만

### 결론
- **Sprint 7 보류** — 실측 p95 가 2000ms 초과할 때 재검토
- 트래픽 1만/월 돌파 시 자동 검토 (Sprint 8+ 에서 트리거 설정)
- 구현 시 래퍼는 `lib/cache/redis.ts` 단일 파일로 분리 권장

---

## 6. 51개 언어 자동 감지

### 변경 사항
`app/context/I18nProvider.tsx`:
- 기존: localStorage 에 저장된 언어 → 없으면 `DEFAULT_LANGUAGE` (en)
- 신규: localStorage 없으면 **`navigator.language` 파싱** → 지원 언어면 그걸로, 아니면 en

```ts
const primary = navigator.language.split('-')[0].toLowerCase();
if (primary in translations) setLanguageState(primary as LanguageCode);
```

### 현재 번역 파일 수
`ls app/i18n/translations/*.ts | grep -v index` → **50개** (index.ts 제외)

50개 언어: am, ar, az, bg, bn, cs, da, de, el, en, es, fa, fi, fr, he, hi, hr, hu, id, it, ja, ka, kk, km, ko, lo, lt, lv, ms, my, ne, nl, no, pl, pt, ro, ru, si, sk, sr, sv, sw, th, tl, tr, uk, ur, uz, vi, zh

홈페이지 리디자인 컴포넌트 (HeaderMinimal / ScenarioSelector / NonDevPanel / DevPanel / LoginRequiredModal / PartnerLinkSlot) 는 **기본 영문 UI + i18n key 없는 하드코딩 혼재** 상태. Sprint 7 은 영문 폴백만 보장. 번역 key 추가는 Sprint 8 이후 별도 작업.

---

## 7. 남은 이슈 / Sprint 8 로 이월

1. **프로덕션 실측** — 위 표의 p50/p95 수치를 실제 `curl` 로 채우기
2. **번역 key 누락** — Sprint 1~6 에서 추가한 홈페이지 컴포넌트에 i18n key 없음
3. **Supabase EXPLAIN ANALYZE** — hs_code_catalog / tariff_rates / fta_rules
4. **Redis 도입 결정** — 트래픽 기반 트리거 설정
5. **E2E 테스트** — Sprint 8 범위

---

## 8. 커밋 링크

- 이번 스프린트: `feat(CW29-S7): real engine hookup + mock fallback + perf report`
- 선행: `11dda21` (CW28-S6 PartnerLinkSlot), `19a7225` (CW27-S5 login gate)
