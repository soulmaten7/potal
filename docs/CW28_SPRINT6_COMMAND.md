# CW28 Sprint 6 Command — Phase 2 Partner Slot UI (예약 영역만)

> 작성: 2026-04-10 KST
> 스펙: `docs/HOMEPAGE_REDESIGN_SPEC.md` 결정 6, 10, 12 (34~35, 540~647, 720~723행)
> 실행 대상: 터미널1 Claude Code **Opus**
> 선행 완료: CW27-S5 (로그인 게이트 — 커밋 `19a7225`, 475 pages ✓)

---

## 🎯 목표

계산 결과 하단에 **배송사 "바로가기 링크" 슬롯 영역**을 UI만 미리 예약.
실제 광고주 연동은 Phase 2 (트래픽 1만+ 이후). 이번 스프린트는 **자리만 잡기**.

### 해야 할 것 ✅
1. `components/home/PartnerLinkSlot.tsx` 신규 — 4칸 슬롯 UI, "Partner slot available" 플레이스홀더
2. `lib/partners/partner-config.ts` 신규 — `PARTNERS: PartnerSlot[]` 타입 + 빈 배열(또는 샘플 4개 `isActive: false`)
3. `NonDevPanel.tsx` 또는 `ScenarioPanel.tsx` 하단에 `<PartnerLinkSlot />` 마운트 (계산 결과 있을 때만)
4. CUSTOM 페이지의 `LiveCodeAssembler` 하단에도 동일 슬롯 예약 (선택 — 스펙상 계산 결과 하단이므로 CUSTOM은 `LiveCodeAssembler` 하단이 맞음)
5. "Sponsored" 라벨 필수 (스펙 결정 12-2)
6. 클릭 이벤트 X (Phase 1은 UI만 — `href="#"` 또는 `disabled` 상태로 `pointer-events-none`)

### 하지 말아야 할 것 ❌
- 실제 배송사 URL, 로고 이미지 연동 **금지** (Phase 2 범위)
- Supabase `partner_slots` 테이블 생성 **금지** (Phase 2 범위)
- 광고 API, 추적 픽셀, 클릭 카운터 **금지**
- 배너/사이드바/팝업 광고 절대 **금지** (스펙 결정 10)
- 견적 비교, 가격 표시 **금지** (스펙 결정 6: POTAL은 "계산"만)
- B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`) 수정 **금지**

---

## 📏 절대 규칙

1. **스펙 결정 6, 10, 12 범위만** — Embedded Quote / Direct Referral / 배너 광고 재도입 금지
2. **"Sponsored" 라벨 시각적으로 명확** — 중립성/신뢰 유지 (스펙 결정 12-2)
3. **월정액 슬롯 임대 방식 구조** — 클릭 당 과금 X (타입 정의에 반영)
4. **배송/물류 회사 한정** — `PartnerCategory` 타입을 `'shipping' | 'logistics'`로만 정의
5. **`npm run build` 성공 후 push**, `console.log` 금지
6. **기존 레이아웃 깨지지 않도록** — NonDevPanel/LiveCodeAssembler 높이만 살짝 늘어나는 수준, 이중 스크롤 금지
7. **커밋 메시지**: `feat(CW28-S6): ...`
8. **Phase 2 활성화 주석** — 각 파일 상단에 "Phase 1: UI reservation only. Phase 2 (traffic 10k+): activate via partner-config.ts"
9. **한국어 문구 금지** — 영문만 ("Partner slot available", "Sponsored", "Ship this with")
10. **파트너 로고는 이모지만** (🚚 📦 🚛 🏢) — 실제 브랜드 이미지 사용 금지

---

## 🗂️ 구현 상세

### 1) `lib/partners/partner-config.ts` — 신규

```ts
/**
 * Partner slot configuration — CW28 Sprint 6 (Phase 1: UI reservation)
 *
 * 스펙 결정 12 (HOMEPAGE_REDESIGN_SPEC.md 580~647):
 *   Phase 1: 슬롯 UI만 예약, 실제 광고주 연동 X
 *   Phase 2 (트래픽 10k+ 이후): 배송사 영업 시작, 월정액 슬롯 임대
 *
 * 원칙:
 *   1. 배송사 바로가기 링크만 (견적/가격/비교 X)
 *   2. "Sponsored" 표기 필수
 *   3. 월정액 슬롯 임대 (클릭 당 과금 X)
 *   4. 배송/물류 회사 한정
 *   5. 계산 결과 하단의 자연스러운 연장 (배너/팝업 X)
 */

export type PartnerCategory = 'shipping' | 'logistics';

export interface PartnerSlot {
  id: string;
  name: string;         // e.g. "DHL eCommerce"
  emoji: string;        // 🚚 📦 🚛 🏢 — Phase 1 emoji only, Phase 2 logo URL
  category: PartnerCategory;
  clickUrl: string;     // Phase 1: "#" — Phase 2: real partner URL
  isActive: boolean;    // Phase 1: false for all — Phase 2: activate after contract
  displayOrder: number; // 1~4
  // Phase 2 fields (kept for reference, not used in Phase 1):
  // contractStart?: string;
  // contractEnd?: string;
  // monthlyFee?: number; // 원
}

/**
 * Phase 1 placeholder — empty slots.
 * Phase 2 will populate this with real partners via Supabase partner_slots table.
 */
export const PARTNER_SLOTS: PartnerSlot[] = [
  { id: 'slot-1', name: 'Partner slot available', emoji: '🚚', category: 'shipping',  clickUrl: '#', isActive: false, displayOrder: 1 },
  { id: 'slot-2', name: 'Partner slot available', emoji: '📦', category: 'shipping',  clickUrl: '#', isActive: false, displayOrder: 2 },
  { id: 'slot-3', name: 'Partner slot available', emoji: '🚛', category: 'logistics', clickUrl: '#', isActive: false, displayOrder: 3 },
  { id: 'slot-4', name: 'Partner slot available', emoji: '🏢', category: 'logistics', clickUrl: '#', isActive: false, displayOrder: 4 },
];

export const PARTNER_SLOT_HEADING = 'Ship this with';
export const PARTNER_SLOT_SPONSORED_LABEL = 'Sponsored';
export const PARTNER_SLOT_PLACEHOLDER_CTA = 'Partner slot available';
```

### 2) `components/home/PartnerLinkSlot.tsx` — 신규

요구사항:
- `'use client'` (링크 클릭 처리를 위해)
- Props: `variant?: 'compact' | 'full'` (선택 — 필요 시 NonDev/CUSTOM에서 다르게)
- 스펙 결정 12의 박스 구조 준수:
  ```
  ┌─ Ship this with ──────────────┐
  │ 🚚 DHL eCommerce   [Open →]   │
  │ 📦 FedEx Priority  [Open →]   │
  │ 🚛 EMS             [Open →]   │
  │ 🏢 CJ Logistics    [Open →]   │
  │                               │
  │ Sponsored                     │
  └───────────────────────────────┘
  ```
- 비활성 슬롯(`isActive: false`) 렌더링:
  - 회색 톤 (slate-100 배경), 커서 `not-allowed`
  - "Partner slot available" 라벨
  - 우측에 작은 `—` 표시 (버튼 X)
  - `pointer-events-none` 또는 `tabIndex={-1}` (키보드 포커스 스킵)
- 활성 슬롯(`isActive: true`) 렌더링 (Phase 2 대비 코드만):
  - `<a href={slot.clickUrl} target="_blank" rel="sponsored noopener noreferrer">` — **`rel="sponsored"` 필수** (Google SEO 투명성)
  - 호버 시 `bg-amber-50`
  - 우측 "Open →" 버튼
- 하단 "Sponsored" 라벨:
  - `text-[10px] uppercase tracking-wide text-slate-400`
  - 오른쪽 정렬
- 컨테이너:
  - `rounded-2xl border border-slate-200 bg-white p-5`
  - 마진 `mt-4` 또는 `mt-6` (계산 결과와 간격)
- 접근성:
  - 전체 컨테이너에 `role="complementary" aria-label="Partner shipping options (sponsored)"`
  - 각 링크에 `aria-label={\`${slot.name} — sponsored partner\`}`

**Tailwind 색상**: 기존 POTAL 팔레트 (`#02122c`, `#F59E0B`, slate-*) 재사용.

### 3) `NonDevPanel.tsx` 수정

- import: `import PartnerLinkSlot from './PartnerLinkSlot';`
- 위치: 결과 카드(`result` 렌더 블록) **직후**, CalcButton 밖, 컴포넌트 최하단
- 조건: `{result && <PartnerLinkSlot />}` — 계산 결과 있을 때만 노출
- 왜 결과 있을 때만: 스펙 "계산 결과의 자연스러운 연장" (결정 12-5)

### 4) `components/custom/LiveCodeAssembler.tsx` 수정 (해당 시)

먼저 `grep -n "export default" components/custom/LiveCodeAssembler.tsx` 로 구조 확인.
- 컴포넌트 최하단 (조립된 코드 박스 바로 아래)에 `<PartnerLinkSlot />` 마운트
- 조건: `selectedFeatures.length > 0` 또는 조립 코드 있을 때만 노출
- 만약 LiveCodeAssembler가 단순 inline 컴포넌트라 배치 애매하면 → `CustomBuilder.tsx` 최하단 (MySavedCombos **위**)로 이동

### 5) CUSTOM 페이지에 PartnerLinkSlot 추가 대안 위치

스펙상 "계산 결과 하단"이지만 CUSTOM은 계산 결과가 없음 → **조립된 코드 블록 하단**이 "결과의 자연스러운 연장"에 해당.
Opus 판단: LiveCodeAssembler 하단이 자연스러우면 거기에, 애매하면 CustomBuilder 레벨에서 조건부로.

---

## ✅ 검증 체크리스트 (Opus 완료 후 스스로 점검)

- [ ] `npm run build` 성공 (475 pages 또는 그 이상)
- [ ] 홈 → 5개 시나리오 중 하나 → Calculate → 결과 카드 하단에 `PartnerLinkSlot` 박스 표시
- [ ] 박스 제목 "Ship this with"
- [ ] 4개 슬롯 전부 `bg-slate-100` 회색 + "Partner slot available" 문구
- [ ] 우측 상단 또는 하단에 "Sponsored" 라벨 표시 (text-[10px], slate-400)
- [ ] 비활성 슬롯 클릭해도 아무 일 없음 (`pointer-events-none` 또는 `#` 무동작)
- [ ] 키보드 Tab 포커스 시 비활성 슬롯 스킵됨
- [ ] CUSTOM 페이지 → 체크박스 선택 → 조립 코드 하단에도 `PartnerLinkSlot` 표시 (또는 조건부)
- [ ] 결과 없는 상태(페이지 첫 진입, 아직 Calculate 안 누름)에선 `PartnerLinkSlot` 미노출
- [ ] 비로그인 상태도 PartnerLinkSlot 보이기 (로그인 게이트 아님 — 단순 광고 슬롯)
- [ ] 모바일 가드(`DesktopOnlyGuard`)는 기존대로 동작, PartnerLinkSlot은 데스크톱에서만
- [ ] `grep -rn "console\.log" lib/partners components/home/PartnerLinkSlot.tsx` → 결과 0
- [ ] TypeScript strict 통과
- [ ] 기존 NonDevPanel / LiveCodeAssembler 기능 regression 없음 (Calculate, CopyBadge, Save 그대로 동작)
- [ ] `npm run build` 후 `.next` 페이지 수 이전과 동일 또는 +0

---

## 📝 완료 후 필수 문서 업데이트

1. **CLAUDE.md** 헤더 → "마지막 업데이트: 2026-04-XX KST (CW28-S6 완료: Partner slot UI 예약 — PartnerLinkSlot.tsx + partner-config.ts + NonDev/CUSTOM 하단 마운트. XXX pages ✓)"
2. **docs/CHANGELOG.md** → 맨 위 CW28-S6 섹션
3. **session-context.md** → CW28-S6 완료 블록 추가, TODO에서 Sprint 6 체크
4. **docs/NEXT_SESSION_START.md** → 다음 Sprint 7 (실제 엔진 연결 + 성능 최적화) 가이드로 갱신

---

## 🚫 Sprint 6 범위 외

- Sprint 7: 실제 엔진 연결 + 성능 최적화 (CW29)
- Sprint 8: E2E 테스트 (CW30)
- Supabase `partner_slots` 테이블 (Phase 2)
- 배송사 영업, 계약서, 월정액 과금 (Phase 2)
- 클릭 추적, 광고 리포팅 (Phase 2)
- 배너/팝업/사이드바 광고 (영원히 금지 — 스펙 결정 10)

---

## 👉 실행 순서

```
1. Read docs/HOMEPAGE_REDESIGN_SPEC.md 결정 6, 10, 12 재확인
2. lib/partners/partner-config.ts 작성
3. components/home/PartnerLinkSlot.tsx 작성
4. NonDevPanel.tsx 에 import + 결과 있을 때 마운트
5. LiveCodeAssembler.tsx 또는 CustomBuilder.tsx 에 마운트
6. npm run build
7. 수동 smoke test (홈 → Calculate → 하단 슬롯 확인)
8. git add / commit: feat(CW28-S6): partner link slot UI reservation
9. git push
10. 4개 문서 (CLAUDE/CHANGELOG/session-context/NEXT_SESSION_START) 날짜 갱신
11. 최종 커밋: docs(CW28-S6): session docs update
```

완료 후 보고 형식:
```
CW28 Sprint 6 완료
- 신규: lib/partners/partner-config.ts, components/home/PartnerLinkSlot.tsx
- 수정: components/home/NonDevPanel.tsx, components/custom/[LiveCodeAssembler or CustomBuilder].tsx
- 빌드: ✓ (XXX pages)
- 커밋: [해시]
- 배포: [Vercel dpl_XXX]
```
