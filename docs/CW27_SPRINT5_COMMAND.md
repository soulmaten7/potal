# CW27 Sprint 5 Command — 로그인 게이트 (Login Feature Gate)

> 작성: 2026-04-10 KST
> 스펙: `docs/HOMEPAGE_REDESIGN_SPEC.md` 결정 7 (432~464행)
> 실행 대상: 터미널1 Claude Code **Opus** (`cd ~/potal && claude --dangerously-skip-permissions`)
> 선행 완료: CW23 S1 (헤더/티커), CW24 S2 (시나리오 패널), CW25 S3 (CUSTOM 빌더), CW26 S4 (user_combos + save/share)

---

## 🎯 목표

Rate Limit 없이 "가치 교환 기반" 로그인 게이트 구축.
**비로그인도 둘러보기/데모 실행은 무제한**, 단 **가치 있는 순간**(복사·저장·공유)에만 로그인 요구.

### 비로그인 가능 ✅
- 홈페이지 접근, 유형 선택, 시나리오 데모 실행 (무제한)
- CUSTOM 체크박스 선택 + 실시간 코드 **보기**
- Developer Panel 코드 **보기** (4언어 탭 전환)
- 티커, 추천 템플릿 둘러보기

### 로그인 필요 🔒
1. NonDevPanel 각 필드 옆 `[📋]` CopyBadge → `CodeCopyModal` 열기
2. `CodeCopyModal`의 "Copy to clipboard" 버튼 (Embed/API/Link 3탭 전부)
3. `DevPanel` 우측 하단 "📋 Copy code" 버튼 (4언어 전부)
4. `CustomBuilder`의 "Save this combo" 버튼 (현재 토스트만 → 정식 모달로 교체)
5. `MySavedCombos` 리스트 접근 (비로그인 시 "로그인하면 저장된 조합을 볼 수 있어요" placeholder)
6. 조합 공유 URL 생성 (`/api/combos/[id]/share` 호출)
7. `LiveCodeAssembler` 우측 "Copy code" 버튼 (있다면 — 확인 필요)

---

## 📏 절대 규칙
1. **스펙 결정 7만 범위** — Rate Limit 재도입 금지, Dashboard 게이트는 기존 로직 유지
2. **기존 데모/조립/탭 전환은 그대로 비로그인 가능** — 절대 차단하지 말 것
3. **POTAL 절대 규칙 준수** — B2C 코드 수정 금지, `console.log` 금지, `npm run build` 성공 후 push
4. **기존 로그인 모달(`LoginModal.tsx`, `OAuthBrand.tsx`) 재사용 가능 여부 먼저 점검** — 중복 생성 금지
5. **UX 문구는 영문 + 한글 병기 금지** (프로덕트는 영문만). 주석은 한국어 OK
6. **모달은 "강요"가 아닌 "친화적 안내"** — "로그인하면 ~ 가능" 긍정 문구, 닫기 가능, 배경 클릭 닫기
7. **토스트 방식(기존 CustomBuilder) → 모달 방식으로 업그레이드** (일관성)
8. **차단된 버튼에 `aria-disabled` 또는 잠금 아이콘 노출 금지** — 스펙상 **클릭 가능**, 누르면 모달
9. **Sprint 6+ 범위(광고/E2E)는 건드리지 말 것**
10. **커밋 메시지 prefix**: `feat(CW27-S5): ...` / `fix(CW27-S5): ...`

---

## 🗂️ 구현 파일 목록

### 신규 파일

| 파일 | 역할 |
|---|---|
| `lib/auth/feature-gate.ts` | `useFeatureGate()` hook — `requireLogin(action)` 반환. 내부에서 SupabaseProvider `session` 확인 |
| `components/modals/LoginRequiredModal.tsx` | 재사용 가능한 모달. `open`, `onClose`, `featureLabel`(예: "code copy", "save combos"), `onLogin` |

### 수정 파일 (7개)

| 파일 | 수정 내용 |
|---|---|
| `components/home/NonDevPanel.tsx` | `CopyBadge` 클릭 → `requireLogin('code copy')` 통과 시 `setModal(...)`, 실패 시 `LoginRequiredModal` 오픈 |
| `components/home/CodeCopyModal.tsx` | 내부 "Copy to clipboard" 버튼 클릭 시 `requireLogin` 재확인 (이중 방어). 또는 CodeCopyModal 자체를 열 때만 체크하고 내부 복사는 허용 (권장) |
| `components/home/DevPanel.tsx` | `handleCopy` 진입부에 게이트. 실패 시 `LoginRequiredModal` 오픈 |
| `components/custom/CustomBuilder.tsx` | 기존 `setSaveToast('Log in to save your combo')` 토스트 → `LoginRequiredModal` 오픈. `SaveComboModal` 진입 전에도 이중 체크 |
| `components/custom/LiveCodeAssembler.tsx` | `handleCopy` 있다면 동일 게이트 적용 (grep으로 확인 후 적용) |
| `components/custom/MySavedCombos.tsx` | 비로그인 시 "Log in to view your saved combos" placeholder 렌더 (리스트 API 호출 자체 skip). 이미 비로그인 처리 있으면 문구만 정비 |
| `components/home/HeaderMinimal.tsx` | 변경 **없음** — "Log in" 버튼은 이미 Sprint 1에서 정상 동작 |

---

## 🔧 상세 구현

### 1) `lib/auth/feature-gate.ts` — 신규

```ts
'use client';

/**
 * Feature gate hook — CW27 Sprint 5
 *
 * 스펙 결정 7 (HOMEPAGE_REDESIGN_SPEC.md 432~464):
 *   - Rate Limit 폐기, "가치 교환 기반" 로그인 게이트
 *   - 비로그인: 데모/코드 보기 무제한
 *   - 로그인 필요: 코드 복사, 조합 저장, 공유 URL 생성
 *
 * Usage:
 *   const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();
 *
 *   const handleCopy = () => {
 *     if (!requireLogin('code copy')) return;
 *     // ... actual copy logic
 *   };
 *
 *   return (
 *     <>
 *       <LoginRequiredModal
 *         open={loginRequired}
 *         featureLabel={featureLabel}
 *         onClose={closeLoginRequired}
 *       />
 *     </>
 *   );
 */

import { useCallback, useState } from 'react';
import { useSupabase } from '@/app/context/SupabaseProvider';

export type GatedFeature =
  | 'code copy'
  | 'save combos'
  | 'share combos'
  | 'view saved combos';

export function useFeatureGate() {
  const { session } = useSupabase();
  const [loginRequired, setLoginRequired] = useState(false);
  const [featureLabel, setFeatureLabel] = useState<GatedFeature>('code copy');

  const requireLogin = useCallback(
    (feature: GatedFeature): boolean => {
      if (session?.access_token) return true;
      setFeatureLabel(feature);
      setLoginRequired(true);
      return false;
    },
    [session]
  );

  const closeLoginRequired = useCallback(() => setLoginRequired(false), []);

  return { requireLogin, loginRequired, closeLoginRequired, featureLabel, isLoggedIn: !!session?.access_token };
}
```

### 2) `components/modals/LoginRequiredModal.tsx` — 신규

요구사항:
- `role="dialog" aria-modal="true"`
- ESC 닫기, 백드롭 클릭 닫기, X 버튼
- body scroll lock (CodeCopyModal.tsx 패턴 복제)
- `featureLabel`에 따라 본문 문구 변경:
  - `code copy` → "Log in to copy this code to your store or server."
  - `save combos` → "Log in to save your custom combo."
  - `share combos` → "Log in to create a shareable link."
  - `view saved combos` → "Log in to view your saved combos."
- 주요 CTA 버튼 2개:
  1. `[Log in]` → 기존 `/auth/login?next=<현재 URL>` 로 navigate (또는 `LoginModal` 트리거 — 기존 코드 확인 후 선택)
  2. `[Keep browsing]` → onClose (닫기)
- 상단 아이콘 🔒 또는 자물쇠 이모지
- 포지티브 톤: "POTAL stays free — login just unlocks the ability to take this code with you."
- Tailwind 기존 `#02122c`, `#F59E0B` 컬러 재사용

**중요**: 먼저 `grep -r "LoginModal" components app/` 로 기존 로그인 모달 확인.
- 있으면: `LoginRequiredModal`에서 해당 모달로 **위임**하거나, "Log in" 버튼 클릭 시 기존 모달을 열도록 연결
- 없으면: 직접 `/auth/login?next=` 로 `window.location.href = ...` navigate

### 3) `NonDevPanel.tsx` 수정

```tsx
// imports
import { useFeatureGate } from '@/lib/auth/feature-gate';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';

// 안쪽
const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();

const openCopyModal = (fieldType, fieldKey, fieldValue) => {
  if (!requireLogin('code copy')) return;
  setModal({ open: true, fieldType, fieldKey, fieldValue });
};

// JSX 하단
<LoginRequiredModal
  open={loginRequired}
  onClose={closeLoginRequired}
  featureLabel={featureLabel}
/>
```

### 4) `DevPanel.tsx` 수정

```tsx
const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();

const handleCopy = async () => {
  if (!requireLogin('code copy')) return;
  try {
    await navigator.clipboard.writeText(example.code[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  } catch {
    setCopied(false);
  }
};

// JSX 하단
<LoginRequiredModal open={loginRequired} onClose={closeLoginRequired} featureLabel={featureLabel} />
```

### 5) `CustomBuilder.tsx` 수정

기존 토스트 로직 제거 후:

```tsx
const { requireLogin, loginRequired, closeLoginRequired, featureLabel, isLoggedIn } = useFeatureGate();

// Save 버튼 onClick
onClick={() => {
  if (!requireLogin('save combos')) return;
  setShowSaveModal(true);
}}

// MySavedCombos에 isLoggedIn prop 전달 (또는 MySavedCombos 내부에서 useSupabase 사용 중이면 그대로 유지)

// JSX 하단
<LoginRequiredModal open={loginRequired} onClose={closeLoginRequired} featureLabel={featureLabel} />
```

토스트(`saveToast`) 상태는 "Combo saved!" 피드백 용도로만 유지.

### 6) `MySavedCombos.tsx` 수정

```tsx
const { session } = useSupabase();

if (!session?.access_token) {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <div className="text-[32px] mb-3">🔒</div>
      <h3 className="text-[15px] font-extrabold text-[#02122c] mb-2">Log in to see your saved combos</h3>
      <p className="text-[13px] text-slate-500">Your custom workflow combinations will appear here.</p>
    </div>
  );
}
// ... 기존 로그인 시 리스트 로직
```

### 7) `LiveCodeAssembler.tsx` 확인 & 수정

`grep -n "clipboard\|handleCopy\|Copy" components/custom/LiveCodeAssembler.tsx` 먼저 실행.
- Copy 버튼 있음 → DevPanel 패턴과 동일하게 게이트 적용
- 없음 → 건드리지 말 것

### 8) 공유 URL 생성 게이트

`components/custom/ComboListItem.tsx` 또는 `MySavedCombos` 내부 "Share" 버튼 존재 시 `requireLogin('share combos')` 적용.
비로그인 사용자는 MySavedCombos 자체를 못 보므로 이중 방어 목적.

---

## ✅ 검증 체크리스트 (Opus가 작업 완료 후 스스로 점검)

- [ ] `npm run build` 성공 (Turbopack 경고만 허용, 에러 0)
- [ ] 비로그인 상태로 홈 접근 → 6개 시나리오 버튼 정상 → Online Seller 클릭 → NonDevPanel "Calculate" 클릭 → 결과 카드 정상 표시 (**데모는 여전히 무제한 동작**)
- [ ] NonDevPanel `[📋]` 클릭 → `LoginRequiredModal` 오픈 → "code copy" 문구
- [ ] DevPanel "📋 Copy code" 클릭 → `LoginRequiredModal` 오픈
- [ ] DevPanel 언어 탭(cURL/Python/Node/Go) 전환 자체는 비로그인 OK
- [ ] CUSTOM 빌더 → 체크박스 선택 실시간 코드 조립 **정상**
- [ ] CUSTOM "Save this combo" 클릭 → `LoginRequiredModal` 오픈 ("save combos" 문구)
- [ ] 비로그인 상태 CUSTOM 페이지 하단 MySavedCombos → "Log in to see your saved combos" placeholder
- [ ] 추천 템플릿 리스트는 비로그인도 **보기** 가능, "Apply template" 클릭은 비로그인도 OK (기능 선택은 게이트 없음)
- [ ] ESC 키로 `LoginRequiredModal` 닫힘, 백드롭 클릭 닫힘
- [ ] "Log in" 버튼 클릭 시 기존 로그인 플로우로 연결됨 (모달 or 페이지)
- [ ] 로그인 후 같은 버튼 클릭 → 모달 없이 즉시 동작 (복사/저장/공유)
- [ ] `grep -rn "console\.log" lib/auth components/modals` → 결과 0
- [ ] TypeScript strict 통과
- [ ] Rate Limit 관련 코드 재도입 없음 (grep `rateLimit` / `rate_limit`)

---

## 📝 완료 후 업데이트 필수 문서

1. **CLAUDE.md** 헤더 — "마지막 업데이트: 2026-04-XX KST (CW27-S5 완료: 로그인 게이트 — feature-gate + LoginRequiredModal + 7개 복사/저장/공유 진입점 게이트. XXX pages ✓)"
2. **docs/CHANGELOG.md** — 맨 위에 CW27-S5 섹션 추가
3. **session-context.md** — CW27-S5 완료 블록 추가, TODO에서 Sprint 5 제거, Sprint 6 활성화
4. **docs/NEXT_SESSION_START.md** — 다음 Sprint 6 (광고 슬롯) 가이드로 갱신

---

## 🚫 Sprint 5 **범위 외** (건드리지 말 것)

- Sprint 6 (CW28): Phase 2 광고 슬롯
- Sprint 7 (CW29): 실제 엔진 연결 + 성능 최적화
- Sprint 8 (CW30): E2E 테스트
- Dashboard 페이지 자체 재설계
- 이메일 로그인/소셜 로그인 플로우 **신규 구현** (기존 Supabase Auth 재사용만)
- 유료 플랜, 결제 게이트 (CW22 확정: Forever Free + Enterprise Contact Us만)

---

## 👉 실행 순서 요약

```
1. grep 으로 기존 LoginModal / auth 진입점 파악
2. lib/auth/feature-gate.ts 작성
3. components/modals/LoginRequiredModal.tsx 작성
4. NonDevPanel.tsx, DevPanel.tsx 수정
5. CustomBuilder.tsx 수정 (토스트 → 모달)
6. MySavedCombos.tsx 비로그인 placeholder
7. LiveCodeAssembler.tsx 확인 & 필요 시 수정
8. npm run build
9. 수동 smoke test (체크리스트)
10. git add / commit: feat(CW27-S5): login feature gate
11. git push
12. CLAUDE.md + CHANGELOG.md + session-context.md + NEXT_SESSION_START.md 4개 문서 날짜 갱신
13. 최종 커밋: docs(CW27-S5): session docs update
```

완료 후 보고 형식:
```
CW27 Sprint 5 완료
- 신규 2개: lib/auth/feature-gate.ts, components/modals/LoginRequiredModal.tsx
- 수정 N개: [파일 나열]
- 빌드: ✓ (XXX pages)
- 커밋: [해시]
- 배포: [Vercel dpl_XXX]
```
