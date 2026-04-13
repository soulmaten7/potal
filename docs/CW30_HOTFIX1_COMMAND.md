# CW30 Hotfix 1 — 홈 진입 시 기본 시나리오 = seller

> 작성: 2026-04-10 KST
> 스프린트: Phase 1 hotfix (post-S8, pre-Phase 2)
> 실행 대상: 터미널1 Claude Code **Opus**
> 소요 예상: 10~15분

---

## 🎯 목표

홈페이지 (`/`) 에 **처음 진입하거나 헤더의 Home 링크를 눌렀을 때**, URL에 `?type=` 쿼리가 없으면 자동으로 `seller` 시나리오가 선택된 상태로 표시되도록 한다. 즉 `POTAL for seller` 패널이 첫 화면부터 보여서, 사용자가 바로 어떤 UI인지 감을 잡고 다른 박스(d2c, importer, exporter, forwarder, custom)를 탐색할 동기를 갖도록 한다.

### CEO 의도 (은태님 직접 인용)
> "홈을 누르거나 Potal에 처음 들어갔을때는 Online seller 박스가 선택되서 해당 POTAL for seller 시나리오가 먼저 표시되있는걸로 하자. 그래야 사람들이 그에 맞춰서 눌러볼거같아"

### UX 논리
- 현재: 첫 진입 시 6개 버튼만 표시 → 아무 선택 상태 없음 → 빈 공간이 허전하고 무엇을 눌러야 할지 힌트 부족
- 개선: `seller`가 기본 선택 → 즉시 완성된 화면 + 데모 결과까지 live-cached 로 보임 → 다른 박스 클릭 유도
- seller는 가장 보편적이고 진입장벽이 낮은 페르소나 (Shopify/이커머스 셀러)

---

## 📏 절대 규칙

1. **동작 범위 최소화** — 파일 수정은 1개만 (`components/home/ScenarioSelector.tsx`)
2. **URL은 더럽히지 말 것** — 기본 seller 상태일 때 URL을 `/?type=seller`로 강제 rewrite 하지 않는다. URL은 깨끗한 `/` 유지. 사용자가 명시적으로 다른 박스 클릭 시에만 `?type=xxx` 붙인다.
3. **SSR/prerender 안전** — `useSearchParams`는 Suspense boundary 안에 있으므로 이미 안전. 기존 구조 유지.
4. **back 버튼 동작 보존** — `?type=d2c`에서 back 해서 `/`로 돌아오면 seller 로 리셋되는 게 자연스러움 (URL ↔ UI 동기화 로직 유지).
5. **다른 시나리오가 URL에 있으면 그걸 우선** — `?type=forwarder` 직접 접근 시 forwarder가 선택돼야 함
6. **console.log 금지**
7. **B2C 코드 미수정**
8. **타입 에러 0, 빌드 통과**

---

## 🗂️ 구현 상세

### 수정 1개: `components/home/ScenarioSelector.tsx`

#### 변경 포인트 A — 초기 state

**기존 (line 82)**:
```tsx
const [selected, setSelected] = useState<ScenarioId | null>(urlType);
```

**변경 후**:
```tsx
// Default to 'seller' when no ?type= query param — CW30 hotfix 1.
// Rationale: first-time visitors should see a completed scenario panel
// immediately (POTAL for seller) so they grasp the interaction model
// before clicking other persona boxes.
const [selected, setSelected] = useState<ScenarioId | null>(
  urlType ?? 'seller'
);
```

#### 변경 포인트 B — URL 동기화 effect

**기존 (line 85~90)**:
```tsx
// Sync internal state if URL query changes (e.g. back button)
useEffect(() => {
  if (urlType !== selected) {
    setSelected(urlType);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [urlType]);
```

**변경 후**:
```tsx
// Sync internal state if URL query changes (e.g. back button, home link click).
// When URL has no ?type= param (fresh / or home link), fall back to 'seller'
// so the user always sees a completed scenario panel. — CW30 hotfix 1
useEffect(() => {
  const next = urlType ?? 'seller';
  if (next !== selected) {
    setSelected(next);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [urlType]);
```

#### 변경 포인트 C — URL rewrite 금지 확인

`handleSelect` 는 **수정하지 않는다**. 사용자가 명시적으로 박스를 클릭했을 때만 `router.replace('/?type=xxx')` 로 URL을 업데이트하는 기존 로직 유지. 기본 seller 상태에서는 URL이 `/` 그대로여야 한다 (SEO + 공유 링크 단순성).

⚠️ **주의**: `useEffect` 안에서 `router.replace` 호출 금지. URL은 클릭으로만 바뀐다.

---

## ❓ 왜 이게 충분한가 (간단 검증)

1. 첫 진입 (`https://www.potal.app/`): `urlType === null` → `selected = 'seller'` → ScenarioPanel seller 렌더링 → 기존 live-cached API 호출해서 데이터까지 보임 ✓
2. Home 링크 클릭 (`/` 로 이동): `useSearchParams`가 새 URL을 반영 → `urlType === null` → effect가 `selected`를 `'seller'`로 리셋 ✓
3. 직접 URL 접근 (`/?type=forwarder`): `urlType === 'forwarder'` → `selected = 'forwarder'` ✓
4. Back 버튼 (`/?type=d2c` → `/`): effect가 `null`을 감지 → `'seller'`로 리셋 ✓
5. 다른 박스 클릭: `handleSelect('d2c')` → URL이 `/?type=d2c` 로 업데이트 → UI 동기화 ✓

---

## ✅ 검증 체크리스트

- [ ] `components/home/ScenarioSelector.tsx` 만 수정됨 (다른 파일 수정 0)
- [ ] `npm run build` 성공 (475 pages 유지)
- [ ] `npx tsc --noEmit` 에러 0 증가 (pre-existing legacy 5개 제외)
- [ ] `npm run lint` 경고/에러 0 증가
- [ ] console.log 0건
- [ ] 로컬 dev (`npm run dev`) 수동 확인:
  - [ ] `http://localhost:3000/` → seller 박스가 선택 상태 + POTAL for seller 패널 표시
  - [ ] d2c 박스 클릭 → URL `?type=d2c` → d2c 패널 표시
  - [ ] 브라우저 back → URL `/` → seller 복귀
  - [ ] `http://localhost:3000/?type=forwarder` → forwarder 박스 선택 + 패널 표시
- [ ] B2C 코드 미수정 확인 (`git diff --name-only` → ScenarioSelector.tsx 1건만)
- [ ] git commit: `feat(CW30-HF1): default scenario = seller on fresh home visit`
- [ ] git push

---

## 📝 완료 후 문서 업데이트

1. **CLAUDE.md** 헤더 → "마지막 업데이트: 2026-04-10 KST (CW30-HF1: 홈 진입 시 기본 시나리오 seller 자동 선택. 475 pages ✓)"
2. **docs/CHANGELOG.md** 맨 위 → CW30-HF1 블록 추가
3. **session-context.md** → CW30-HF1 완료 블록 추가
4. **docs/HOMEPAGE_REDESIGN_SPEC.md** → 결정 3 (ScenarioSelector) 섹션에 "기본값: seller" 각주 추가

---

## 👉 실행 순서

```
1. Read components/home/ScenarioSelector.tsx
2. Edit: 변경 포인트 A (useState 초기값)
3. Edit: 변경 포인트 B (useEffect 폴백)
4. npm run build
5. npx tsc --noEmit
6. npm run lint
7. npm run dev → 로컬 수동 확인 4가지 시나리오
8. git add components/home/ScenarioSelector.tsx
9. git commit -m "feat(CW30-HF1): default scenario = seller on fresh home visit"
10. git push
11. Vercel 자동 배포 확인
12. 4개 문서 업데이트 + docs 커밋 + push
```

완료 후 보고 형식:
```
CW30 HF1 완료 — 홈 기본 시나리오 seller
- 수정: components/home/ScenarioSelector.tsx (+4-2)
- 빌드: ✓ 475 pages
- Types/Lint: ✓
- 커밋: [해시] / [docs 해시]
- 배포: Vercel [dpl_XXX]
```
