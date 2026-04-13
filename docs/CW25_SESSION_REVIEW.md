# CW25 Cowork 세션 리뷰 — 이전 세션 Claude에게 전달용

> 작성: 2026-04-10 13:40 KST
> 용도: 이전 세션의 Claude가 이 파일을 읽고, HOMEPAGE_REDESIGN_SPEC.md 스펙대로 올바르게 구현되었는지 검증하기 위한 요약

---

## 이 세션에서 일어난 일 (시간순)

### 1. CW23 Sprint 1 SSR 버그 수정 (이전 세션 연속)

CW23에서 Sprint 1이 완료되었는데 프로덕션에서 안 보이는 문제가 있었음.

**원인 3가지:**
1. `app/layout.tsx`가 기존 `<Header />`를 강제 렌더 → Sprint 1의 `<HeaderMinimal />`과 이중 헤더
2. `DesktopOnlyGuard`가 SSR에서 `!ready` 일 때 `null` 반환 → Sprint 1 컨텐츠 아예 안 보임
3. `ScenarioSelector`가 `useSearchParams()` 사용 → Suspense 없이 SSR prerender 실패

**수정:**
- `components/layout/ChromeGate.tsx` 신규 — pathname 기반으로 Header/Footer/MobileBottomNav 조건부 렌더
- `DesktopOnlyGuard.tsx` 재작성 — 항상 children 렌더, mobile 리다이렉트는 useEffect에서만
- `app/page.tsx`에 `<Suspense>` 추가
- 커밋: `c626a05`

### 2. CW23-S1b UX 피드백 반영

은태님이 프로덕션 브라우저에서 직접 확인 후 4가지 피드백:

| 피드백 | 수정 내용 |
|--------|----------|
| "푸터가 없어졌어" | ChromeGate의 HIDE_FOOTER_ON에서 `/` 제거 → 홈페이지에서 Footer 복구 |
| "1440px로 맞춰놔줘" | HeaderMinimal Row1 + Row2에 `max-w-[1440px] mx-auto`, ScenarioSelector도 동일 |
| "6개가 한줄에 있어야해, 지금 크기 너무 커" | grid `grid-cols-3 lg:grid-cols-6 gap-3`, 버튼 min-h 140→110, px/py 축소, font 축소 |
| "시나리오 내용이 아무것도 안 떠" | 선택 시 guiding question 이탤릭 표시 + Sprint 2 placeholder |

- 커밋: `4a656b8`

### 3. CW24 Sprint 2 — 시나리오 상세 패널 (Opus Claude Code 실행)

Cowork에서 상세 명령어 문서(`docs/CW24_SPRINT2_COMMAND.md`)를 작성하여 Opus에 전달.

**결정 4 (HOMEPAGE_REDESIGN_SPEC.md 224~280행) 기반으로 구현한 파일:**

| 파일 | 역할 | 스펙 매핑 |
|------|------|----------|
| `components/home/ScenarioPanel.tsx` | 좌우 2분할 컨테이너 | 결정 4 레이아웃 |
| `components/home/NonDevPanel.tsx` | 왼쪽 50% 인터랙티브 데모 | 결정 4 "왼쪽 (비개발자 영역)" |
| `components/home/DevPanel.tsx` | 오른쪽 50% 워크플로우 코드 | 결정 4 "오른쪽 (개발자 영역)" |
| `components/home/CodeCopyModal.tsx` | 📋 버튼 → 3옵션 모달 (Embed/API/Link) | 결정 4 "[📋 코드 복사] 버튼" |
| `lib/scenarios/workflow-examples.ts` | 5 시나리오 × 4 언어 코드 예제 | 결정 4 "조합된 워크플로우 전체 예제" |
| `lib/scenarios/mock-results.ts` | 데모 fallback 데이터 | 스펙에 없음 (UX 안전장치) |
| `app/api/demo/scenario/route.ts` | 홈페이지 전용 데모 API | 스펙에 없음 (NonDevPanel Calculate용) |

**시나리오별 API 체인 (스펙 결정 3 테이블 기반):**
- Online Seller: `classify → check_restrictions → landed_cost`
- D2C Brand: `classify → lookup_fta → landed_cost → generate_document`
- Importer: `classify → landed_cost → screen_shipment`
- Exporter: `classify → check_restrictions → screen_denied_party → generate_document`
- Forwarder: `screen_shipment(bulk) → landed_cost(batch) → compare_countries`

**의도적으로 제외:**
- ❌ 로그인 게이트 (Sprint 5 · CW27 범위)
- ❌ CustomBuilder 실제 구현 (Sprint 3)
- ❌ Prism/Shiki syntax highlighter (빌드 무거워짐)
- ❌ 실제 POTAL 엔진 호출 (mock만. Sprint 7에서 연결 예정)

- 커밋: `bd4b4ae`

### 4. CW25 Sprint 3 — CUSTOM Builder (Opus Claude Code 실행)

Opus가 Sprint 2 완료 후 자동으로 Sprint 3까지 이어서 진행.

**결정 5+6 (HOMEPAGE_REDESIGN_SPEC.md 284~333행) 기반으로 구현한 파일:**

| 파일 | 역할 | 스펙 매핑 |
|------|------|----------|
| `lib/features/feature-catalog.ts` | 141개 CatalogEntry, 12 카테고리 그룹 | 결정 5 "140개 기능 전부 체크박스" |
| `components/custom/CustomBuilder.tsx` | CUSTOM 메인 좌우 2분할 | 결정 5-1 레이아웃 |
| `components/custom/FeatureCheckbox.tsx` | 개별 체크박스 + amber 하이라이트 + ℹ️ 툴팁 | 결정 5 "기능명 옆에 ℹ️ → 호버 시 설명" |
| `components/custom/LiveCodeAssembler.tsx` | 선택 기능 → 4언어 실시간 코드 | 결정 5 "왼쪽 체크박스 선택 시 즉시 오른쪽 코드 업데이트" |
| `lib/custom/code-templates.ts` | 141 features × 4 언어 API 템플릿 | 결정 5 "실시간 코드 조립" |

**의도적으로 제외:**
- ❌ 조합 저장/로드 (Sprint 4 · CW26 — Supabase user_combos)
- ❌ 로그인 게이트 (Sprint 5 · CW27)
- ❌ 추천 템플릿 (Sprint 4 범위)

- 커밋: `d0b9670` (CUSTOM Builder) + `d6cc87c` (code-templates.ts)

### 5. 레이아웃 버그 수정 (Cowork에서 발견 → Opus에 명령)

프로덕션 브라우저 확인 시 ScenarioPanel 좌우 2분할에서 **왼쪽 NonDevPanel에 거대한 빈 공간** 발견.

**원인:**
- `ScenarioPanel.tsx` grid에 `items-stretch` → 오른쪽 DevPanel(코드 길어서 673px)에 맞춰 왼쪽(487px)이 늘어남
- `NonDevPanel.tsx`에 `h-full` 클래스 → 위 stretch를 그대로 받아서 빈 공간

**수정 1:** `items-stretch` → `items-start`, NonDevPanel에서 `h-full` 제거
- 커밋: `685ae2c`

**수정 2:** DevPanel 코드 블록에 `max-h-[500px] overflow-y-auto` 추가 → 코드가 길면 내부 스크롤
- 커밋: `f312bcc`

**현재 상태:** 왼쪽 487px, 오른쪽 652px (165px 차이 존재). 완전히 해소되지는 않았음.

---

## 현재 프로덕션 상태 (www.potal.app)

### 동작하는 것 ✅
- POTAL 로고 + 미니멀 2줄 헤더 (Community, Help, 🌐 EN, Sign In)
- 라이브 티커 2줄 (8개 기관 풀네임 + 상대 시간)
- "What describes your cross-border workflow?" + 6개 버튼 1행
- Online Seller ~ Forwarder 클릭 → 좌우 2분할 (NonDevPanel + DevPanel)
- NonDevPanel: 시나리오별 입력 필드 + Calculate 버튼 + 결과 카드 (mock data)
- DevPanel: 4언어 탭 (cURL/Python/Node.js/Go) + API 워크플로우 코드
- CodeCopyModal: 📋 버튼 → 3옵션 (Embed/API/Link)
- CUSTOM 클릭 → 141개 체크박스 + 실시간 4언어 코드 조립
- Footer 정상 표시 (홈페이지)
- 모바일 접속 → /mobile-notice 안내 페이지

### 아직 미구현 ⏳
- Sprint 4 (CW26): 내 조합 저장 + 공유 (Supabase user_combos)
- Sprint 5 (CW27): 로그인 게이트 (📋 복사 시 로그인 필요)
- Sprint 6 (CW28): Phase 2 광고 슬롯
- Sprint 7 (CW29): 실제 엔진 연결 + 성능 최적화
- Sprint 8 (CW30): E2E 테스트 + 검증

### 남은 UX 이슈 🔧
1. **좌우 패널 높이 불균형** — 왼쪽 487px vs 오른쪽 652px. 165px 차이. 스크롤 시 왼쪽이 먼저 끝나서 빈 공간 보임. 해결 옵션: sticky left panel / 양쪽 동일 고정 높이 + 내부 스크롤
2. **시나리오 버튼과 패널 사이 여백** — 버튼 아래 ~ "POTAL for seller" 사이 빈 공간이 큼

---

## 스펙 대비 검증 포인트 (이전 세션 Claude가 확인해야 할 것)

### 결정 1 (헤더) — 구현됨
- [ ] 1줄: POTAL 로고 가운데, 큰 크기
- [ ] 2줄: 좌 Community|Help, 우 🌐 EN|Log in
- [ ] Features, Developers, Pricing, Dashboard, Sign up 전부 제거됨

### 결정 2 (티커) — 구현됨
- [ ] 풀네임 병기 (약자만 아님)
- [ ] 초록 점 + Live + 상대 시간
- [ ] 8개 기관

### 결정 3 (시나리오 셀렉터) — 구현됨
- [ ] 6개 버튼 (Online Seller / D2C Brand / Importer / Exporter / Forwarder / CUSTOM)
- [ ] 1행 6열 (2행이 아님)
- [ ] 클릭 시 페이지 이동 없이 아래 영역 동적 교체
- [ ] URL /?type=seller 쿼리 파라미터

### 결정 4 (좌우 2분할) — 구현됨 (부분 이슈 있음)
- [ ] 왼쪽 50% NonDevPanel: 인터랙티브 데모 + Calculate + 결과 카드
- [ ] 오른쪽 50% DevPanel: cURL/Python/Node/Go 탭 + 조합된 워크플로우 코드
- [ ] 각 필드/결과 옆 📋 버튼 → CodeCopyModal (Embed/API/Link 3옵션)
- [ ] **⚠️ 높이 불균형 이슈 존재 (165px 차이)**
- [ ] 5개 시나리오별 다른 워크플로우 체인

### 결정 5+6 (CUSTOM 빌더) — 구현됨
- [ ] 141개 기능 전부 체크박스 (숨김/접기 없음)
- [ ] 12 카테고리 헤더로 그룹핑
- [ ] 검색창 상단
- [ ] ℹ️ 호버 시 설명 툴팁
- [ ] 체크박스 선택/해제 시 오른쪽 코드 즉시 업데이트
- [ ] 4언어 탭: cURL / Python / Node / Go
- [ ] **CUSTOM은 CUSTOM 페이지에만 — 5개 시나리오에 적용 안 됨** ✅

### 결정 7 (로그인 게이트) — 미구현 (Sprint 5)
- 현재 📋 버튼 아무나 가능. Sprint 5에서 게이트 추가 예정

### 결정 8 (데스크톱 전용) — 구현됨
- [ ] 768px 미만 → /mobile-notice 리다이렉트
- [ ] DesktopOnlyGuard.tsx 동작

### 결정 9 (제거 항목) — 구현됨
- [ ] 헤더에서 Features/Developers/Pricing/Dashboard/Sign up 제거됨
- [ ] 홈페이지 본문에서 "140 Features" 숫자, 복잡한 폼, 에이전시 로고 배지, 기능 나열 전부 제거됨

---

## 전체 커밋 로그 (이 세션)

```
f312bcc fix(CW25): cap DevPanel code block height to reduce left-right imbalance
685ae2c fix(CW25): ScenarioPanel items-stretch → items-start, remove NonDevPanel h-full
d6cc87c feat(CW25-S3): add code-templates.ts — 141 per-feature API templates × 4 languages
d0b9670 feat(CW25-S3): CUSTOM builder — 141 feature checkboxes + live code assembly
bd4b4ae feat(CW24-S2): scenario panel + workflow examples
4a656b8 fix(CW23-S1b): Sprint 1 UX feedback — Footer restore + 1440px + 6-col compact
c626a05 fix(CW23-S1): Sprint 1 homepage SSR bugs — ChromeGate + DesktopOnlyGuard + Suspense
8c7429d content: 2026-04-10 daily post — reciprocal tariffs 185 countries
2e269aa chore(CW23-S0): update ticker fallback data + session-context header
bd09d7d fix(D4): Korea KCS gov-api-health — browser UA + fallback chain + softFail
```

총 30개 파일 변경, +6,900줄 추가
