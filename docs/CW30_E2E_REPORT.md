# CW30 Sprint 8 — E2E Verification Report

> 작성: 2026-04-10 KST
> 환경: Production (https://www.potal.app), 비로그인 상태
> 검증: `scripts/e2e-homepage-smoke.mjs` (Node 18+ fetch, 의존성 없음)

---

## 1. E2E Smoke — 프로덕션 측정값

### 1-1. 1차 실행 (Sprint 8 commit 전, Sprint 7.5 production 상태)

```
POTAL E2E smoke — base: https://www.potal.app

✓ GET /                                                          — 200
✓ GET /?type=custom                                              — 200
✓ POST /api/demo/scenario [seller]    — wall=921ms server=5ms source=live-cached total=79.38
✓ POST /api/demo/scenario [d2c]       — wall=260ms server=1ms source=live-cached total=59.33
✓ POST /api/demo/scenario [importer]  — wall=349ms server=1ms source=live-cached total=3187.99
✓ POST /api/demo/scenario [exporter]  — wall=253ms server=0ms source=live-cached total=8137.78
✓ POST /api/demo/scenario [forwarder] — wall=274ms server=1ms source=live-cached total=1007.21
✗ GET /mobile-notice                                             — missing desktop marker

Summary: 7 passed, 1 failed
Demo API timing: p50=274ms  p95=921ms  max=921ms
```

**핵심 성과**:
- 5/5 시나리오 **`source: live-cached`** → Sprint 7 의 0/10 대비 100% 성공
- **서버 처리 시간 0~5ms** (Sprint 7 의 2132ms 대비 ~400배 개선)
- wall time p50 274ms, p95 921ms (seller 첫 호출 cold start 포함, 나머지 250-350ms 안정)

**유일한 실패**: `/mobile-notice` 페이지가 "desktop" 마커를 SSR HTML 에 포함하지 않음.
- 원인: `MobileNoticePage` 가 `'use client'` + `Suspense fallback={null}` 구조 → SSR 시 빈 body
- "POTAL is a desktop-only tool" 텍스트는 client hydration 이후에만 렌더
- 크롤러 + E2E fetch 는 hydration 전 HTML 만 받음

### 1-2. 수정 — Sprint 8 fix

`app/mobile-notice/page.tsx` 의 `Suspense fallback={null}` →
`<Suspense fallback={<MobileNoticeFallback />}>` 로 변경.

`MobileNoticeFallback` 컴포넌트는:
- POTAL 로고
- "POTAL is a desktop-only tool" 헤딩
- "POTAL is built for focused work on a larger screen. Please visit us from a computer or laptop to access the full experience." 본문

SSR 에서 즉시 렌더 → 크롤러/E2E 모두 "desktop" 마커 확인 가능.

### 1-3. 2차 실행 (Sprint 8 배포 후 — 예상)

Sprint 8 commit 이 프로덕션에 반영되면 `/mobile-notice` 테스트도 pass 할 것.
전체 결과: **8/8 passed**.

재실행 명령:
```bash
npm run e2e:smoke
# 또는
node scripts/e2e-homepage-smoke.mjs
```

---

## 2. 비로그인 경로 (Anonymous User Path)

> ⚠️ 이 섹션은 **Cowork 세션의 Chrome MCP**가 실제 브라우저로 검증해야 함. Opus (Claude Code) 는 브라우저 조작 권한이 없음.

- [ ] 홈 로드 → 6개 시나리오 버튼 표시 (seller/d2c/importer/exporter/forwarder/custom)
- [ ] seller 버튼 클릭 → NonDevPanel 진입 → Calculate 클릭 → 결과 카드 표시
- [ ] 결과 카드 하단 PartnerLinkSlot 표시 (4개 placeholder + Sponsored 라벨)
- [ ] NonDevPanel `[📋]` 버튼 클릭 → `LoginRequiredModal` 등장 (featureLabel: "code copy")
- [ ] Modal ESC → 닫힘
- [ ] Modal 바깥 클릭 → 닫힘
- [ ] Modal "Log in" 버튼 → `/auth/login?next=...` 이동
- [ ] ?type=custom 진입 → CustomBuilder 체크박스 + LiveCodeAssembler 표시
- [ ] CUSTOM Save 버튼 클릭 (비로그인) → `LoginRequiredModal` 등장 (featureLabel: "save combos")
- [ ] CUSTOM 추천 템플릿 카드 클릭 → 체크박스 자동 선택

## 3. 성능 (Performance) — 위 섹션 1 참조

- ✅ `/api/demo/scenario` p95: **921ms** (wall time, 첫 호출 cold start 포함)
- ✅ 서버 처리 시간 p95: **5ms** (X-Response-Time 헤더)
- ✅ 5 시나리오 전부 `X-Demo-Source: live-cached`
- ✅ Sprint 7 대비 ~20x 개선 (2132ms → ~5ms server)

## 4. 모바일 가드 (Mobile Guard)

### 4-1. 코드 리뷰 (Sprint 8 범위)

`components/layout/DesktopOnlyGuard.tsx`:
- ✅ SSR-safe (server / desktop client 모두 children 렌더)
- ✅ useEffect 에서 `window.innerWidth < 768` → `router.replace('/mobile-notice?from=...')`
- ✅ `/mobile-notice` 경로에서는 guard 건너뜀 (무한 리다이렉트 방지)
- ⚠️ Spec 은 1024px breakpoint 제안, 현재 구현은 768px (태블릿 허용 — 의도된 결정)

`app/mobile-notice/page.tsx`:
- ✅ `MobileNoticeInner` (client, email 폼 + useSearchParams)
- ✅ `MobileNoticeFallback` (SSR-safe, 로고 + desktop 안내 메시지) — Sprint 8 에서 추가
- ✅ `Suspense fallback={<MobileNoticeFallback />}` 로 래핑
- ✅ 영문 메시지 ("POTAL is a desktop-only tool", "larger screen", "computer or laptop")

### 4-2. 브라우저 실측 (Cowork 담당)

- [ ] Chrome DevTools → iPhone 12 Pro emulate → `/` 방문 → `/mobile-notice` 자동 리다이렉트
- [ ] iPad emulate → 데스크톱 모드 정상 (리다이렉트 안 함, 768px 이상)
- [ ] 데스크톱 뷰포트 → 홈 정상 표시
- [ ] `/mobile-notice` 직접 방문 시 SSR HTML 에 "desktop" 단어 포함 확인 (Sprint 8 배포 후)

## 5. 다국어 자동 감지 (i18n) — Sprint 7 CW29 구현

`app/context/I18nProvider.tsx` 는 localStorage 없을 때 `navigator.language` 파싱하여 지원 언어로 세팅.

- [ ] navigator.language = 'ko' → 한국어 UI
- [ ] navigator.language = 'en' → 영어 UI
- [ ] navigator.language = 'ja' → 일본어 UI
- [ ] navigator.language = 'zz' (미지원) → 영어 폴백

> Cowork Chrome MCP 가 DevTools Console 에서 `navigator.language = 'ko'` override 후 localStorage 삭제 + 새로고침으로 검증

## 6. 회귀 (Regression) — 코드 기준

- ✅ CW23 S1~S1b: HeaderMinimal + LiveTicker + ScenarioSelector + ChromeGate 미수정
- ✅ CW24 S2: ScenarioPanel + NonDev/Dev/CodeCopy + workflow-examples 미수정
- ✅ CW25 S3: CustomBuilder + FeatureCheckbox + LiveCodeAssembler + feature-catalog 미수정
- ✅ CW26 S4: MySavedCombos + ComboListItem + SaveComboModal + RecommendedTemplates + user_combos CRUD API 미수정
- ✅ CW27 S5: lib/auth/feature-gate + LoginRequiredModal + 6 entry points 미수정
- ✅ CW28 S6: PartnerLinkSlot + partner-config 미수정
- ✅ CW29 S7.5: live-baseline.json + tryLiveCachedResult 미수정
- ✅ B2C: lib/search / lib/agent / components/search 미수정

## 7. Issues Found

### Sprint 8 에서 수정함
- 🐛 **fix**: `/mobile-notice` 가 SSR HTML 에 "desktop" 마커 누락 → Suspense fallback 에 정적 콘텐츠 추가

### Pre-existing (Sprint 8 범위 외, 문서화만)
- ⚠️ `npx tsc --noEmit` — `app/lib/tests/s-grade-verification.test.ts` 에 5개 type error (commit `0d70c0c`, 2026년 초). Next.js build 는 통과 — test 파일은 production bundle 에 포함되지 않음
- ⚠️ `npm run lint` — 전체 **808 problems** (554 errors, 254 warnings). 대부분 `@typescript-eslint/no-explicit-any` / legacy B2C 파일. Sprint 8 이 도입한 새 에러 **0건**. 수정은 별도 정리 스프린트 필요
- ⚠️ `app/mobile-notice/page.tsx:27` lint: "Calling setState synchronously within an effect can trigger cascading renders" — Sprint 1 부터 존재, 동작에는 문제 없음

## 8. 결론

| 항목 | 상태 |
|---|---|
| E2E smoke (Sprint 7.5 baseline) | 7/8 passed, 1 issue fixed in Sprint 8 |
| 빌드 (`npm run build`) | ✅ 475 pages |
| 타입 체크 (`tsc --noEmit`) | ⚠️ 5 errors in legacy test file (pre-existing) |
| 린트 (`npm run lint`) | ⚠️ 808 problems (pre-existing, no new) |
| Sprint 3~7.5 regression | ✅ 0 |
| B2C 코드 변경 | ✅ 0 |
| 프로덕션 배포 승인 | ✅ Yes (Sprint 8 commit 후) |

**배포 후 2차 E2E smoke 재실행 권장** — `/mobile-notice` fix 확인용.
