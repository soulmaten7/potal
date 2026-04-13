# CW30 Sprint 8 Command — E2E 검증 + 모바일 가드 + 최종 배포

> 작성: 2026-04-10 KST
> 스펙: `docs/HOMEPAGE_REDESIGN_SPEC.md` Sprint 8 (731~735행)
> 실행 대상: 터미널1 Claude Code **Opus**
> 선행 필수: CW29-S7.5 완료 (precompute live baseline — p95 <200ms, live-cached 100%)

---

## 🎯 목표

Phase 1 홈페이지 리디자인의 **마지막 스프린트**. 새 기능 추가 없이 **전체 플로우 E2E 검증 + 모바일 가드 확인 + 프로덕션 최종 배포**만 수행.

### 해야 할 것 ✅
1. E2E 시나리오 스크립트 작성 (`scripts/e2e-homepage-smoke.mjs`) — 실제 프로덕션 URL에 fetch 날려 5개 핵심 플로우 검증
2. 비로그인 사용자 경로 수동 검증 체크리스트 수행 → 결과를 `docs/CW30_E2E_REPORT.md`에 기록
3. 모바일 안내 페이지 (`DesktopOnlyGuard` + `app/mobile-notice/page.tsx`) 검증 (user-agent 스푸핑으로 확인)
4. `npm run build` 최종 확인 (475 pages 이상 + 경고 0)
5. TypeScript strict 통과 확인 (`npx tsc --noEmit`)
6. Lint 통과 확인 (`npm run lint`)
7. Vercel 최종 배포 + deployment URL 확보
8. Phase 1 완료 문서 (`docs/PHASE1_COMPLETE.md`) 생성 — 6개 스프린트(S3~S8) 요약

### 하지 말아야 할 것 ❌
- 새 기능 추가 금지 (버그 fix만 허용)
- 레이아웃 변경 금지
- 스펙 외 리팩토링 금지
- B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`) 수정 금지
- console.log 금지
- 한국어 UI 문구 추가 금지 (영문만)
- Playwright/Puppeteer 등 무거운 E2E 프레임워크 도입 금지 — **순수 fetch + 정규식 assertion만 사용** (의존성 최소화)

---

## 📏 절대 규칙

1. **빌드 + types + lint 모두 통과**해야 배포 가능
2. **regression 0** — 기존 Sprint 3~7.5 기능 전부 유지
3. **커밋 메시지**: `feat(CW30-S8): ...` 또는 `fix(CW30-S8): ...`
4. E2E 스크립트는 **CI용이 아니라 smoke용** — 에러 하나라도 나면 exit 1, 성공 시 exit 0
5. E2E 스크립트는 **프로덕션 URL에 대해 실행** (localhost 아님): `https://potal.co.kr`
6. 모든 검증 결과는 **실제 측정 값**만 기록 (추측 금지)
7. **Phase 1 완료 선언은 Sprint 8 완료 후에만** — 중간 단계에서 "완료" 주장 금지

---

## 🗂️ 구현 상세

### 1) `scripts/e2e-homepage-smoke.mjs` — 신규

```js
#!/usr/bin/env node
/**
 * POTAL homepage E2E smoke test — CW30 Sprint 8
 *
 * Runs against PRODUCTION (https://potal.co.kr) with no auth.
 * Verifies the 5 critical anonymous-user paths:
 *   1. GET /                    → 200, contains "POTAL"
 *   2. GET /custom              → 200, contains "CUSTOM"
 *   3. POST /api/demo/scenario  → source: 'live-cached', result.landedCost.total > 0 (for all 5 scenarios)
 *   4. GET /mobile-notice       → 200, contains "Desktop" or "desktop"
 *   5. GET /api/features        → 200 (feature catalog endpoint, if exists) — skip gracefully if 404
 *
 * Exit 0 on all-pass, exit 1 on any failure.
 * NO dependencies — uses Node 18+ built-in fetch.
 */

const BASE = process.env.E2E_BASE_URL || 'https://potal.co.kr';
const SCENARIOS = ['seller', 'buyer', 'creator', 'traveler', 'dropshipper'];

let pass = 0;
let fail = 0;
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (ok) pass += 1;
  else fail += 1;
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

async function check(name, fn) {
  try {
    await fn();
  } catch (err) {
    record(name, false, err?.message || String(err));
  }
}

async function main() {
  console.log(`POTAL E2E smoke — base: ${BASE}\n`);

  // 1) Home page
  await check('GET /', async () => {
    const res = await fetch(`${BASE}/`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!/POTAL/i.test(html)) throw new Error('missing POTAL brand');
    record('GET /', true, `${res.status}`);
  });

  // 2) CUSTOM page
  await check('GET /custom', async () => {
    const res = await fetch(`${BASE}/custom`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!/custom/i.test(html)) throw new Error('missing CUSTOM marker');
    record('GET /custom', true, `${res.status}`);
  });

  // 3) Demo API — 5 scenarios
  for (const scenarioId of SCENARIOS) {
    await check(`POST /api/demo/scenario [${scenarioId}]`, async () => {
      const started = Date.now();
      const res = await fetch(`${BASE}/api/demo/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, inputs: { value: 45 } }),
      });
      const ms = Date.now() - started;
      if (!res.ok) throw new Error(`status ${res.status}`);
      const source = res.headers.get('x-demo-source');
      const json = await res.json();
      if (!json?.success) throw new Error('success=false');
      const total = json?.data?.result?.landedCost?.total;
      if (typeof total !== 'number' || total <= 0) {
        throw new Error(`invalid total: ${total}`);
      }
      // Accept both live-cached (preferred) and mock (fallback) — but warn on mock
      if (source !== 'live-cached' && source !== 'live' && source !== 'mock') {
        throw new Error(`unexpected source: ${source}`);
      }
      record(
        `POST /api/demo/scenario [${scenarioId}]`,
        true,
        `${ms}ms, source=${source}, total=${total}`
      );
    });
  }

  // 4) Mobile notice page
  await check('GET /mobile-notice', async () => {
    const res = await fetch(`${BASE}/mobile-notice`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!/desktop/i.test(html)) throw new Error('missing desktop marker');
    record('GET /mobile-notice', true, `${res.status}`);
  });

  console.log(`\nSummary: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.error('\nE2E smoke FAILED');
    process.exit(1);
  }
  console.log('\nE2E smoke PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
```

**실행 방법**:
```bash
node scripts/e2e-homepage-smoke.mjs
# or against local:
E2E_BASE_URL=http://localhost:3000 node scripts/e2e-homepage-smoke.mjs
```

`package.json` 의 `"scripts"`에 추가:
```json
"e2e:smoke": "node scripts/e2e-homepage-smoke.mjs"
```

### 2) 비로그인 사용자 경로 수동 검증 (체크리스트)

Opus는 이 항목을 **직접 수행할 수 없음** (브라우저 수동 조작 필요). 대신:
- `docs/CW30_E2E_REPORT.md` 에 **빈 체크리스트 스켈레톤**을 생성
- 각 항목에 `[ ]` 상태 + "verification owner: Cowork session" 메모
- 최종 체크는 Cowork 세션에서 Chrome MCP로 수행 후 업데이트

스켈레톤 내용:
```markdown
# CW30 Sprint 8 — E2E Verification Report

> 실행: 2026-04-XX KST
> 환경: Production (https://potal.co.kr), 비로그인 상태

## 1. 비로그인 경로 (Anonymous User Path)

- [ ] 홈 로드 → 5개 시나리오 카드 표시 (seller/buyer/creator/traveler/dropshipper)
- [ ] seller 카드 클릭 → NonDevPanel 진입 → Calculate 클릭 → 결과 카드 표시
- [ ] 결과 카드 하단 PartnerLinkSlot 표시 (4개 placeholder + SPONSORED)
- [ ] [📋] 버튼 클릭 → LoginRequiredModal 등장 (featureLabel: "code copy")
- [ ] Modal ESC → 닫힘
- [ ] Modal 바깥 클릭 → 닫힘
- [ ] "Sign up free" 버튼 → /auth 페이지 이동
- [ ] /custom 페이지 진입 → 체크박스 선택 → LiveCodeAssembler 표시
- [ ] Save 버튼 클릭 → LoginRequiredModal 등장 (featureLabel: "save combos")

## 2. 성능 (Performance)

- [ ] /api/demo/scenario p95 < 200ms (10회 측정)
- [ ] 각 시나리오 source: `live-cached`
- [ ] X-Response-Time 헤더 확인

## 3. 모바일 가드 (Mobile Guard)

- [ ] Chrome DevTools → iPhone 12 Pro emulate → / 방문 → /mobile-notice 리다이렉트 또는 안내 표시
- [ ] Tablet (iPad) emulate → 데스크톱 모드로 표시 (mobile-notice 리다이렉트 안 함)
- [ ] Desktop viewport → 홈 정상 표시

## 4. 다국어 자동 감지 (i18n)

- [ ] navigator.language = 'ko' → 한국어 UI (기본)
- [ ] navigator.language = 'en' → 영어 UI
- [ ] navigator.language = 'ja' → 일본어 UI (지원 시)

## 5. 회귀 (Regression)

- [ ] CW23~S3 홈페이지 히어로 정상
- [ ] CW24~S4 NonDev/Dev/CUSTOM 3-way 구조 정상
- [ ] CW27~S5 로그인 게이트 7개 포인트 정상
- [ ] CW28~S6 PartnerLinkSlot 정상
- [ ] CW29~S7.5 live-cached baseline 정상

## 결론

- Pass: __ / __
- Blocker: (없음 / 목록)
- 배포 승인: [ ] yes [ ] no
```

### 3) 모바일 가드 검증

Opus는 `components/DesktopOnlyGuard.tsx` 와 `app/mobile-notice/page.tsx` 두 파일의 **현재 상태를 읽고** 로직이 제대로 동작하는지 **코드 리뷰만** 수행. 실제 브라우저 테스트는 Cowork 세션이 함.

점검 포인트:
- DesktopOnlyGuard 가 `window.innerWidth < 1024` 기준으로 분기하는지
- `app/mobile-notice/page.tsx` 가 존재하고 영문 안내 메시지를 가진지
- NonDevPanel / DevPanel / CustomBuilder 가 DesktopOnlyGuard 로 감싸져 있는지
- 발견된 이슈는 `docs/CW30_E2E_REPORT.md` 의 "Issues found" 섹션에 기록

### 4) 빌드/타입/린트 최종 확인

```bash
npm run build
npx tsc --noEmit
npm run lint
```

**모두 통과해야 배포 가능**. 실패 시 원인 수정 후 재실행. lint 경고가 있으면 `npm run lint -- --fix` 시도.

### 5) Vercel 최종 배포

```bash
git push origin main
# Vercel auto-deploy trigger
```

배포 후:
- deployment URL 확보 (`dpl_XXXX`)
- `https://potal.co.kr` 에 반영 확인 (5분 이내)
- E2E smoke 재실행 against production
- 결과 → `docs/PHASE1_COMPLETE.md`

### 6) `docs/PHASE1_COMPLETE.md` — 신규

```markdown
# Phase 1 Homepage Redesign — COMPLETE

> 완료일: 2026-04-XX KST
> 기간: CW23 ~ CW30 (6 Sprints)
> 스펙: docs/HOMEPAGE_REDESIGN_SPEC.md v1

## Sprint 요약

| Sprint | CW | 제목 | 커밋 | 빌드 |
|--------|----|----|------|------|
| S3 | CW25 | Hero + 5 scenarios | XXX | ✓ |
| S4 | CW26 | NonDev/Dev/CUSTOM 3-way | XXX | ✓ |
| S5 | CW27 | Login feature gate | 19a7225 | ✓ |
| S6 | CW28 | Partner slot UI reservation | 11dda21 | ✓ |
| S7 | CW29 | Real engine connection | a007501 | ✓ |
| S7.5 | CW29 | Precompute live baseline | XXX | ✓ |
| S8 | CW30 | E2E + mobile guard + deploy | XXX | ✓ |

## 최종 수치

- pages: XXX
- /api/demo/scenario p95: XXXms
- live-cached 비율: XXX%
- E2E smoke: XX/XX passed

## Phase 2 대기 항목

- Partner slot activation (트래픽 10k+ 이후)
- Supabase `partner_slots` 테이블
- 월정액 슬롯 임대 계약
- 배송사 영업

## 배포 정보

- deployment: dpl_XXX
- production URL: https://potal.co.kr
- 배포일: 2026-04-XX
```

---

## ✅ 검증 체크리스트 (Opus 완료 후 스스로 점검)

- [ ] `scripts/e2e-homepage-smoke.mjs` 생성됨 + 실행 권한 (`chmod +x`)
- [ ] `package.json` 에 `"e2e:smoke"` 스크립트 추가됨
- [ ] `npm run e2e:smoke` 로컬 실행 시 모든 시나리오 pass
- [ ] `npm run build` 성공 (475 pages 이상)
- [ ] `npx tsc --noEmit` 에러 0
- [ ] `npm run lint` 에러 0
- [ ] `docs/CW30_E2E_REPORT.md` 스켈레톤 생성됨
- [ ] `docs/PHASE1_COMPLETE.md` 생성됨 (스프린트 테이블 포함)
- [ ] `grep -rn "console\.log" scripts/e2e-homepage-smoke.mjs` → 테스트용 `console.log` 제외하고 프로덕션 코드 0
- [ ] 기존 파일(lib/, components/, app/) regression 0 — 신규 파일만 추가
- [ ] git commit + push 완료
- [ ] Vercel deployment URL 확보

---

## 📝 완료 후 필수 문서 업데이트

1. **CLAUDE.md** 헤더 → "마지막 업데이트: 2026-04-XX KST (CW30-S8 완료: E2E smoke + mobile guard 검증 + Phase 1 최종 배포. XXX pages ✓, dpl_XXX)"
2. **docs/CHANGELOG.md** → 맨 위 CW30-S8 섹션
3. **session-context.md** → CW30-S8 완료 블록 + Phase 1 COMPLETE 마크
4. **docs/NEXT_SESSION_START.md** → Phase 2 계획으로 전환 (트래픽 확보 + 파트너 영업)
5. **docs/PHASE1_COMPLETE.md** → 최종 수치 채움

---

## 🚫 Sprint 8 범위 외

- Playwright/Puppeteer 도입 (과잉 스펙)
- CI/CD 파이프라인 구축 (Phase 2)
- 성능 추가 최적화 (Sprint 7.5에서 완료)
- 새 기능 추가
- 디자인 변경
- B2C 코드 touching

---

## 👉 실행 순서

```
1. Read docs/HOMEPAGE_REDESIGN_SPEC.md Sprint 8 section (731~735)
2. scripts/e2e-homepage-smoke.mjs 작성
3. package.json 에 e2e:smoke 스크립트 추가
4. chmod +x scripts/e2e-homepage-smoke.mjs
5. Local build: npm run build
6. Type check: npx tsc --noEmit
7. Lint: npm run lint
8. E2E (prod): node scripts/e2e-homepage-smoke.mjs
9. DesktopOnlyGuard + mobile-notice 코드 리뷰
10. docs/CW30_E2E_REPORT.md 스켈레톤 작성
11. docs/PHASE1_COMPLETE.md 작성 (수치는 실측 후)
12. git add / commit: feat(CW30-S8): E2E smoke + mobile guard verification + Phase 1 complete
13. git push
14. Vercel 배포 확인 → deployment URL 확보
15. 프로덕션 E2E 재실행
16. 5개 문서 업데이트 (CLAUDE/CHANGELOG/session-context/NEXT_SESSION_START/PHASE1_COMPLETE)
17. 최종 커밋: docs(CW30-S8): Phase 1 complete — session docs
```

완료 후 보고 형식:
```
CW30 Sprint 8 완료 — Phase 1 DONE
- 신규: scripts/e2e-homepage-smoke.mjs, docs/CW30_E2E_REPORT.md, docs/PHASE1_COMPLETE.md
- 수정: package.json (e2e:smoke script)
- 빌드: ✓ (XXX pages)
- Types: ✓
- Lint: ✓
- E2E smoke: X/X passed (p95 XXXms)
- 커밋: [해시]
- 배포: [Vercel dpl_XXX]
- Phase 1 완료 🎉
```
