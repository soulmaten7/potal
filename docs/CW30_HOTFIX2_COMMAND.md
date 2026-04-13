# CW30 Hotfix 2 — 첫 화면 압축 + 입력란 초기화

> 작성: 2026-04-10 KST
> 스프린트: Phase 1 hotfix 2 (HF1 후속)
> 실행 대상: 터미널1 Claude Code **Opus**
> 소요 예상: 30~40분
> 선행: HF1 완료 (seller pre-selected on fresh home visit) — 커밋 `83c793e`

---

## 🎯 목표

HF1으로 seller 자동 선택까지 완료했지만, 프로덕션 실측 결과 **Calculate 버튼이 top=1019px 로 958px 뷰포트 밖**에 있어서 유저가 스크롤해야 demo를 시작할 수 있음. 동시에 박스 6개가 `min-h 110px`로 과하게 공간을 잡아먹고, 입력란에 `"Handmade leather wallet"` 같은 pre-fill 값이 있어서 유저가 자기 상품 입력하려면 먼저 지워야 하는 friction 존재.

HF2는 **첫 화면 압축 4종 세트**:
1. Hero section 상하 여백 압축
2. 시나리오 박스 1줄화 + 서브타이틀 제거
3. 패널 헤더 리디자인 — `{icon} POTAL for {id} — {subtitle}` (서브타이틀이 여기로 이전)
4. 입력란 완전 초기화 — 모든 `defaultValue` 제거, placeholder 힌트만

---

## 📏 절대 규칙

1. **수정 파일 범위**: 4개만
   - `components/home/ScenarioSelector.tsx`
   - `components/home/ScenarioPanel.tsx`
   - `components/home/NonDevPanel.tsx`
   - (옵션) `lib/scenarios/scenario-config.ts` — subtitle fallback copy 참조용, 수정 불필요
2. **B2C 코드 금지** (`lib/search/`, `lib/agent/`, `components/search/`)
3. **HF1 동작 보존** — seller 자동 선택 + URL 깨끗 유지 로직 건드리지 말 것
4. **자동 계산 금지** — 유저가 Calculate 버튼 직접 눌러야 결과 표시. mount 시 fetch 호출 절대 금지.
5. **SCENARIO_FALLBACK_COPY 의 subtitle 텍스트는 그대로 유지** — 박스에서는 안 쓰지만 패널 헤더에서 사용
6. **console.log 금지**
7. **타입 에러 0 증가, 빌드 통과** (475 pages 유지)
8. **기존 결과 렌더링 로직 보존** — 유저가 Calculate 누르면 기존대로 동작

---

## 🗂️ 구현 상세

### 변경 1 — Hero 압축 (`ScenarioSelector.tsx`)

#### 1-A. section padding 축소

**기존 (line ~107)**:
```tsx
<section
  aria-label="Choose your scenario"
  className="w-full max-w-[1440px] mx-auto px-8 py-12"
>
```

**변경 후**:
```tsx
<section
  aria-label="Choose your scenario"
  className="w-full max-w-[1440px] mx-auto px-8 pt-6 pb-4"
>
```

효과: `py-12` (48+48 = 96px) → `pt-6 pb-4` (24+16 = 40px) = **56px 절감**

#### 1-B. h1 크기 + 여백 축소

**기존 (line ~109)**:
```tsx
<h1 className="text-center text-[32px] md:text-[40px] font-extrabold text-[#02122c] mb-10 leading-tight">
  {c(SCENARIO_TOP_QUESTION_KEY)}
</h1>
```

**변경 후**:
```tsx
<h1 className="text-center text-[22px] md:text-[26px] font-extrabold text-[#02122c] mb-5 leading-tight">
  {c(SCENARIO_TOP_QUESTION_KEY)}
</h1>
```

효과:
- 폰트 40px → 26px = ~16px 절감
- `mb-10` (40px) → `mb-5` (20px) = **20px 절감**
- 총 ~**36px 절감**

---

### 변경 2 — 시나리오 박스 1줄화 (`ScenarioSelector.tsx`)

#### 2-A. ScenarioButton 리디자인

**기존 (line ~40~71)**:
```tsx
function ScenarioButton({ scenario, selected, onSelect }: ScenarioButtonProps) {
  const base =
    'group relative flex flex-col items-center justify-center w-full min-h-[110px] px-3 py-4 rounded-xl border-2 text-center transition-all duration-150 cursor-pointer';
  const stateClass = selected
    ? 'bg-[#02122c] border-[#02122c] text-white shadow-lg'
    : 'bg-white border-slate-200 text-[#02122c] hover:border-[#F59E0B] hover:shadow-md';

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      className={`${base} ${stateClass}`}
    >
      <span className="text-[26px] leading-none mb-2" aria-hidden="true">
        {scenario.icon}
      </span>
      <div className="text-[13px] font-bold leading-tight">
        {c(scenario.titleKey)}
      </div>
      <div
        className={`text-[11px] mt-1 font-normal leading-snug ${
          selected ? 'text-slate-300' : 'text-slate-500'
        }`}
      >
        {c(scenario.subtitleKey)}
      </div>
    </button>
  );
}
```

**변경 후**:
```tsx
function ScenarioButton({ scenario, selected, onSelect }: ScenarioButtonProps) {
  // CW30-HF2: 가로 1줄 배치, 서브타이틀 제거 (패널 헤더로 이전).
  // min-h 110px → 52px 로 대폭 축소 → hero 압축과 합쳐 Calculate 버튼을 fold 위로 끌어올림.
  const base =
    'group relative flex flex-row items-center justify-center gap-2 w-full min-h-[52px] px-3 py-2 rounded-lg border-2 text-center transition-all duration-150 cursor-pointer';
  const stateClass = selected
    ? 'bg-[#02122c] border-[#02122c] text-white shadow-md'
    : 'bg-white border-slate-200 text-[#02122c] hover:border-[#F59E0B] hover:shadow-sm';

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      aria-label={`${c(scenario.titleKey)} — ${c(scenario.subtitleKey)}`}
      className={`${base} ${stateClass}`}
    >
      <span className="text-[20px] leading-none flex-none" aria-hidden="true">
        {scenario.icon}
      </span>
      <span className="text-[13px] font-bold leading-tight whitespace-nowrap">
        {c(scenario.titleKey)}
      </span>
    </button>
  );
}
```

**핵심 변경**:
- `flex-col` → `flex-row` (이모지 + 제목 한 줄)
- `min-h-[110px]` → `min-h-[52px]` (**58px 절감**)
- 서브타이틀 `<div>` 완전 삭제
- `rounded-xl` → `rounded-lg` (미묘하게 덜 과장)
- 이모지 `text-[26px]` → `text-[20px]`
- `aria-label` 추가 — 스크린리더는 서브타이틀까지 읽어줌 (접근성 유지)

---

### 변경 3 — 패널 헤더 리디자인 (`ScenarioPanel.tsx`)

#### 3-A. TitleBar 함수 교체

**기존 (line ~25~43)**:
```tsx
function TitleBar({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return null;
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[28px]" aria-hidden="true">{scenario.icon}</span>
      <div>
        <div className="text-[20px] font-extrabold text-[#02122c] leading-tight">
          POTAL for {scenario.titleKey.split('.').slice(-2, -1)[0]
            ? scenario.titleKey.replace('home.scenario.', '').replace('.title', '')
            : scenarioId}
        </div>
        <div className="text-[12px] text-slate-500 mt-0.5">
          Try the demo on the left — grab the code on the right.
        </div>
      </div>
    </div>
  );
}
```

**변경 후**:
```tsx
// CW30-HF2: 시나리오 박스의 서브타이틀을 이쪽 헤더로 이전.
// 포맷: `🛒 POTAL for seller — Etsy, Shopify, eBay`
function TitleBar({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return null;

  // Fallback copy lookup — scenario-config.ts 에서 정의한 subtitle 문구 재사용.
  const subtitle = SCENARIO_FALLBACK_COPY[scenario.subtitleKey] || '';

  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[30px] leading-none flex-none" aria-hidden="true">
        {scenario.icon}
      </span>
      <h2 className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[22px] md:text-[26px] font-extrabold text-[#02122c] leading-tight">
          POTAL for {scenarioId}
        </span>
        {subtitle && (
          <span className="text-[13px] md:text-[15px] font-normal text-slate-500 leading-tight">
            — {subtitle}
          </span>
        )}
      </h2>
    </div>
  );
}
```

**필수 import 추가** (파일 상단):
```tsx
import { getScenarioById, SCENARIO_FALLBACK_COPY } from '@/lib/scenarios/scenario-config';
```

**핵심 변경**:
- 서브타이틀 "Try the demo on the left..." 문구 **삭제** — 이미 좌우 2분할이 자명
- 새 서브타이틀 = scenario 원래 subtitle (Etsy, Shopify, eBay 등) with `—` 구분자
- title casing: `POTAL for seller` — 모두 소문자 id 사용 (일관성)
- `h2` 시맨틱 요소로 승격
- `mb-6` → `mb-4` (16px 추가 절감)

#### 3-B. section padding 축소

**기존 (line ~48~53)**:
```tsx
<section
  aria-live="polite"
  aria-label="Scenario detail panel"
  className="w-full max-w-[1440px] mx-auto px-8 pt-6 pb-16"
>
```

**변경 후**:
```tsx
<section
  aria-live="polite"
  aria-label="Scenario detail panel"
  className="w-full max-w-[1440px] mx-auto px-8 pt-4 pb-16"
>
```

효과: `pt-6` (24) → `pt-4` (16) = **8px 절감**

---

### 변경 4 — 입력란 완전 초기화 (`NonDevPanel.tsx`)

#### 4-A. SCENARIO_FIELDS 전체 defaultValue 제거 + placeholder 추가

**전략**: 각 FieldDef 에서 `defaultValue` 를 제거하고, placeholder 문구를 추가. select 는 첫 옵션으로 `{ value: '', label: 'Select...' }` 빈 옵션 추가.

**기존 (line ~48~101)** — SCENARIO_FIELDS 전체를 다음으로 교체:

```tsx
// Empty placeholder option for country/select dropdowns — CW30-HF2
const COUNTRY_OPTIONS_WITH_PLACEHOLDER = [
  { value: '', label: 'Select country…' },
  ...COUNTRY_OPTIONS,
];

const SCENARIO_FIELDS: Record<string, FieldDef[]> = {
  seller: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Handmade leather wallet' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Declared value', type: 'number', placeholder: '45', unit: 'USD' },
  ],
  d2c: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Organic cotton T-shirt' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Unit value', type: 'number', placeholder: '28', unit: 'USD' },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '500', unit: 'units' },
  ],
  importer: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Industrial centrifugal pumps' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Shipment value', type: 'number', placeholder: '85000', unit: 'USD' },
    {
      key: 'container',
      label: 'Container',
      type: 'select',
      options: [
        { value: '', label: 'Select container…' },
        { value: '20ft', label: '20ft' },
        { value: '40ft', label: '40ft' },
        { value: '40hc', label: '40ft HC' },
      ],
    },
  ],
  exporter: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Lithium-ion battery cells' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Shipment value', type: 'number', placeholder: '250000', unit: 'USD' },
  ],
  forwarder: [
    { key: 'product', label: 'Product type', type: 'text', placeholder: 'e.g. Cotton T-shirts (batch)' },
    { key: 'from', label: 'Origin', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    {
      key: 'to',
      label: 'Destinations',
      type: 'select',
      options: [
        { value: '', label: 'Select destination…' },
        { value: 'US', label: '🇺🇸 United States' },
        { value: 'DE', label: '🇩🇪 Germany' },
        { value: 'JP', label: '🇯🇵 Japan' },
      ],
    },
    { key: 'value', label: 'Value per shipment', type: 'number', placeholder: '12000', unit: 'USD' },
  ],
};
```

**핵심 변경**:
- **모든 `defaultValue` 제거**
- **모든 text/number 필드에 `placeholder` 추가** (힌트만, 실제 입력 아님)
- 모든 select 에 `COUNTRY_OPTIONS_WITH_PLACEHOLDER` 또는 전용 placeholder 옵션 사용
- `container` 와 `forwarder.to` 도 placeholder 옵션 포함

#### 4-B. initial state — defaultValue 없을 때 빈 문자열로 초기화

**기존 (line ~162~168)**:
```tsx
const [inputs, setInputs] = useState<Record<string, string | number>>(() => {
  const init: Record<string, string | number> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) init[f.key] = f.defaultValue;
  }
  return init;
});
```

**변경 후**:
```tsx
// CW30-HF2: defaultValue 제거됨 → 모든 필드를 빈 문자열로 초기화
const [inputs, setInputs] = useState<Record<string, string | number>>(() => {
  const init: Record<string, string | number> = {};
  for (const f of fields) {
    init[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
  }
  return init;
});
```

`defaultValue` fallback 로직은 유지 (혹시 나중에 특정 필드에만 default 넣고 싶을 때 대비).

#### 4-C. 입력 필드 렌더링 — placeholder 반영

`FieldDef` interface 에 `placeholder` 이미 있음 (line ~29). 기존 text/number input 렌더에 `placeholder={field.placeholder}` 속성 전달되는지 **확인만** — 이미 있으면 그대로, 없으면 추가.

**text input 렌더 부분** (grep 으로 찾아서 확인):
```tsx
<input
  type="text"
  value={String(inputs[field.key] ?? '')}
  placeholder={field.placeholder}   // ← 이 줄 있는지 확인
  onChange={...}
  className="..."
/>
```

**number input** 도 동일하게 `placeholder={field.placeholder}` 확인.

**select 렌더** — 추가 수정 없음. 빈 옵션이 첫 항목으로 들어가있으므로 state 가 '' 이면 자동으로 placeholder 옵션 표시됨.

#### 4-D. 결과 카드 빈 상태 — 확인만

현재 `result === null` 일 때 결과 카드가 렌더되지 않음. 이 동작 **유지**. 빈 안내 문구 추가도 **하지 않음** — 은태님이 "아무것도 안 넣어놓는 게 낫다" 의도대로 깔끔한 빈 상태 유지.

단 Calculate 버튼 위 또는 아래에 **아주 작은 힌트** 하나 추가 권장:
```tsx
{!result && !loading && !error && (
  <p className="text-[12px] text-slate-400 text-center mt-2">
    Fill in the fields above and click Calculate.
  </p>
)}
```

이건 **선택사항**. 너무 친절하다 싶으면 생략해도 됨. Opus 판단에 맡김.

#### 4-E. Calculate 버튼 활성화 조건 — 필수 필드 검증

모든 필드가 비어있을 때 Calculate 버튼은 **disabled** 되어야 함. API 호출 실패 방지.

버튼 disabled 조건:
```tsx
const allFilled = fields.every(f => {
  const v = inputs[f.key];
  return v !== undefined && v !== '' && v !== null;
});

<button
  type="button"
  disabled={loading || !allFilled}
  onClick={handleCalculate}
  className={`... ${!allFilled ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  Calculate landed cost
</button>
```

**기존 disabled 로직에 `!allFilled` 만 추가**. handler 로직 자체는 수정 금지.

---

## 📐 예상 레이아웃 변화 (1920×958 뷰포트)

| 요소 | 기존 top | 변경 후 top | 절감 |
|---|---|---|---|
| H1 "What describes..." | 266px | ~**145px** | 121px |
| 시나리오 박스 하단 | 464px | ~**230px** | 234px |
| 패널 헤더 시작 | 632px | ~**300px** | 332px |
| 입력 폼 시작 | ~720px | ~**390px** | ~330px |
| Calculate 버튼 | **1019px** | ~**680px** | **339px** |
| 결과 카드 시작 | ~1100px | ~**770px** | ~330px |

→ **Calculate 버튼이 958px 뷰포트 안으로 들어옴** ✅
→ 결과 카드는 아직 살짝 접히지만 스크롤 최소화

---

## ✅ 검증 체크리스트

### 빌드 & 타입
- [ ] `npm run build` 성공, 475 pages 유지
- [ ] `npx tsc --noEmit` 에러 0 증가
- [ ] `npm run lint` 에러/경고 0 증가

### 기능 — 로컬 dev 에서 수동 확인
- [ ] `/` 첫 진입 → seller 박스 선택됨 (HF1 보존)
- [ ] 박스 6개가 **가로 1줄**로 압축됨 (이모지 + 제목만)
- [ ] 박스 높이가 ~**52px** (이전 110px 절반 이하)
- [ ] 패널 헤더가 `🛒 POTAL for seller — Etsy, Shopify, eBay` 포맷
- [ ] 다른 박스 클릭 시 헤더의 subtitle 이 올바르게 바뀜 (Importer → "B2B container loads" 등)
- [ ] 입력란 전부 **빈 상태** (Product 빈칸, country 드롭다운 "Select country…", value 빈칸)
- [ ] 입력란에 placeholder 힌트 표시 (`e.g. Handmade leather wallet` 등)
- [ ] Calculate 버튼 초기 **disabled** (회색)
- [ ] 모든 필드 입력 후 Calculate 활성화
- [ ] Calculate 클릭 → 기존처럼 결과 표시 (live-cached 또는 mock)
- [ ] 결과 표시 후 [📋] 버튼 / 로그인 게이트 동작 유지

### 뷰포트 측정
- [ ] DevTools 에서 1920×958 뷰포트 설정
- [ ] H1 top ≤ 200px
- [ ] Calculate 버튼 top ≤ 958px (**fold 안**)
- [ ] 첫 화면에 6개 박스 + 패널 헤더 + 입력 폼 + Calculate 버튼 모두 보임

### 규칙 준수
- [ ] B2C 코드 미수정
- [ ] HF1 동작 보존 (seller 자동 선택 + URL `/` 유지)
- [ ] console.log 0건
- [ ] mount 시 자동 fetch 호출 없음 (`/api/demo/scenario` 네트워크 탭에서 0건 확인)
- [ ] `aria-label` 접근성 유지

### 커밋 & 배포
- [ ] git commit: `feat(CW30-HF2): compress hero + 1-line scenario boxes + move subtitle to panel header + empty inputs`
- [ ] git push
- [ ] Vercel 자동 배포 확인

---

## 📝 완료 후 문서 업데이트

1. **CLAUDE.md** 헤더 → "마지막 업데이트: 2026-04-10 KST (CW30-HF2: 첫 화면 압축 + 박스 1줄화 + 서브타이틀 패널 헤더 이전 + 입력란 초기화. Calculate 버튼 fold 진입. 475 pages ✓)"
2. **docs/CHANGELOG.md** 맨 위 → CW30-HF2 블록
3. **session-context.md** → CW30-HF2 완료 블록
4. **docs/HOMEPAGE_REDESIGN_SPEC.md** 결정 3 섹션 → "박스는 1줄 compact 표시, 서브타이틀은 패널 헤더로 이전" 각주

---

## 👉 실행 순서

```
1. Read components/home/ScenarioSelector.tsx
2. Edit 1-A: section padding (py-12 → pt-6 pb-4)
3. Edit 1-B: h1 size + margin (40px mb-10 → 26px mb-5)
4. Edit 2-A: ScenarioButton flex-col → flex-row, subtitle 제거, min-h 52
5. Read components/home/ScenarioPanel.tsx
6. Edit 3-A: TitleBar 교체 + SCENARIO_FALLBACK_COPY import
7. Edit 3-B: section pt-6 → pt-4
8. Read components/home/NonDevPanel.tsx (defaultValue/placeholder 부분 집중)
9. Edit 4-A: SCENARIO_FIELDS 전체 교체 (defaultValue 제거, placeholder 추가)
10. Edit 4-B: initial state 빈 문자열 폴백
11. Edit 4-C: text/number input placeholder 속성 확인
12. Edit 4-E: Calculate 버튼 disabled 조건에 !allFilled 추가
13. npm run build
14. npx tsc --noEmit
15. npm run lint
16. npm run dev → 로컬 수동 확인 체크리스트
17. git add (4개 파일만)
18. git commit -m "feat(CW30-HF2): compress hero + 1-line scenario boxes + move subtitle to panel header + empty inputs"
19. git push
20. 4개 문서 업데이트 + docs commit + push
```

완료 보고 형식:
```
CW30 HF2 완료 — 첫 화면 압축
- 수정: ScenarioSelector.tsx, ScenarioPanel.tsx, NonDevPanel.tsx (+X -Y)
- 빌드: ✓ 475 pages
- Types/Lint: ✓
- Calculate 버튼: 1019px → ~680px (fold 진입) ✓
- 커밋: [해시] / [docs 해시]
- 배포: Vercel [dpl_XXX]
```
