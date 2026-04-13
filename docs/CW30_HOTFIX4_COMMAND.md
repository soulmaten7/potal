# CW30-HF4 — CUSTOM 시나리오 section 이중 래핑 제거 (1440px 폭 정렬)

**작성일**: 2026-04-10 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**예상 소요**: 5분
**전제조건**: CW30-HF3 배포 완료된 상태 (main 브랜치)

---

## 🎯 문제

CUSTOM 시나리오의 좌우 2-column 박스(`Search features` / `Live code`)가 다른 5개 시나리오의 박스(`Online Seller demo` / `Developer workflow`)보다 **좌우로 더 좁고 안쪽으로 들여쓰기** 되어 보임.

### 원인 — section 이중 래핑

`ScenarioPanel.tsx` (line 56~74) 가 이미 바깥에서 감싸고 있음:
```tsx
<section className="w-full max-w-[1440px] mx-auto px-8 pt-4 pb-16">
  <TitleBar />
  {scenario?.isCustom ? <CustomBuilder /> : <div className="grid...">...</div>}
</section>
```

그런데 `CustomBuilder.tsx` 가 내부에서 **한 번 더** 같은 사이즈로 감쌈:
```tsx
<section className="w-full max-w-[1440px] mx-auto px-8 pt-0 pb-16">
```

→ CUSTOM만 `px-8 + px-8 = 좌우 각 64px` 추가 들여쓰기 발생 (총 128px 더 좁음)
→ `pb-16`도 이중 적용되어 하단 여백 과다
→ 5개 일반 시나리오는 ScenarioPanel의 단일 `<section>`만 사용하는데 CUSTOM만 이중 래핑

### 사용처 확인 완료

`CustomBuilder`는 `ScenarioPanel.tsx`에서만 직접 렌더됨. `/combos/[slug]/page.tsx`는 `/?type=custom&combo=...` 로 redirect만 하고 직접 렌더 안 함. **따라서 CustomBuilder 외부 section 래퍼 제거해도 안전**.

---

## 📂 수정 대상 파일

**단 1개 파일만 수정**: `components/custom/CustomBuilder.tsx`

다른 파일은 절대 건드리지 말 것. 특히:
- ❌ `components/home/ScenarioPanel.tsx` (부모 section이 폭 담당, 유지)
- ❌ `components/home/ScenarioSelector.tsx` (HF1 + HF2 유지)
- ❌ `app/combos/[slug]/page.tsx` (CustomBuilder 직접 렌더 안 함)

---

## ✏️ 구체적 변경사항

### Before (components/custom/CustomBuilder.tsx 라인 58~77, HF3 직후 상태)

```tsx
  return (
    <section
      aria-label="CUSTOM builder — assemble your workflow"
      className="w-full max-w-[1440px] mx-auto px-8 pt-0 pb-16"
    >
      {/* Helper hint (HF3: heading removed, only instructional hint kept) */}
      <p className="text-[12px] text-slate-500 mb-3">
        Pick any combination of POTAL&apos;s {FEATURE_COUNT} features. The code
        on the right updates instantly.
      </p>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
```

### After

```tsx
  return (
    <div aria-label="CUSTOM builder — assemble your workflow">
      {/* Helper hint (HF3: heading removed, only instructional hint kept) */}
      <p className="text-[12px] text-slate-500 mb-3">
        Pick any combination of POTAL&apos;s {FEATURE_COUNT} features. The code
        on the right updates instantly.
      </p>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
```

**변경 요약**:
1. `<section>` → `<div>` 로 태그 변경 (랜드마크 역할은 부모 ScenarioPanel의 `<section aria-label="Scenario detail panel">`이 이미 담당)
2. `className` 전체 제거 (`w-full max-w-[1440px] mx-auto px-8 pt-0 pb-16` → 없음). `aria-label`만 유지.
3. **파일 하단의 닫는 태그도 함께 수정**: 파일 맨 마지막의 `</section>` → `</div>` 로 변경 필요. 파일 끝부분 확인 후 정확히 1개 닫는 태그만 변경.

### 닫는 태그 위치 확인 방법

```bash
grep -n "</section>" components/custom/CustomBuilder.tsx
```
→ CustomBuilder의 `return (...)` 블록을 닫는 `</section>` 1개만 `</div>` 로 변경. 만약 다른 용도의 `</section>`이 있으면 함수 최상위 return 블록 끝(가장 들여쓰기가 얕은 것)만 변경.

---

## ✅ 검증 순서 (Opus가 직접 수행)

### 1. 타입체크 + 빌드

```bash
cd ~/potal
npm run build 2>&1 | tail -30
```

**통과 기준**:
- `✓ Compiled successfully`
- 페이지 수 475 유지

### 2. 로컬 dev 서버 시각 확인

```bash
npm run dev
```

브라우저 또는 Chrome MCP로:
1. `http://localhost:3000/?type=seller` 접속 → `Online Seller demo` 박스 좌측 x좌표 기록
2. `http://localhost:3000/?type=custom` 접속 → `Search features` 박스 좌측 x좌표 기록
3. **두 x좌표가 동일**해야 통과. HF4 이전에는 CUSTOM 쪽이 64px 더 안쪽이었음.
4. 오른쪽 박스(`Developer workflow` vs `Live code`)도 우측 x좌표 동일 확인.
5. CUSTOM 페이지 하단 여백이 다른 시나리오와 동일한 수준인지 확인 (이전엔 `pb-16` 이중 적용되어 과했음).

### 3. HF1/HF2/HF3 회귀 확인

- [ ] `/` 접속 시 seller 기본 선택 (HF1)
- [ ] 시나리오 버튼 `min-h-[52px]` 1줄 유지 (HF2)
- [ ] Hero `text-[26px]`, `pt-6 pb-4` 유지 (HF2)
- [ ] CUSTOM 페이지에 `⚙️ POTAL for custom — Build your own combo` 헤더 1개만 (HF3)
- [ ] `Pick any combination of POTAL's 141 features...` 힌트 문구 grid 위에 유지 (HF3)

### 4. 프로덕션 배포

```bash
git add components/custom/CustomBuilder.tsx
git commit -m "fix(custom): remove nested section wrapper to align CUSTOM box with 1440px (CW30-HF4)

- CustomBuilder outer <section max-w-[1440px] mx-auto px-8 pt-0 pb-16> → plain <div>
- Parent ScenarioPanel already provides max-w-1440 + px-8 + pb-16 wrapper
- Fixes CUSTOM 2-column grid being 128px narrower than 5 other scenarios
- Preserve HF1 (seller default) + HF2 (compression) + HF3 (single heading) untouched"

git push origin main
```

Vercel 자동 배포 확인 후:
- [ ] `https://potalapp.com/?type=seller` 과 `https://potalapp.com/?type=custom` 2-column 박스 좌우 x좌표 일치 확인

---

## 📝 완료 후 문서 업데이트 (Opus 필수 수행)

### 4개 문서 헤더 날짜 오늘(2026-04-10) 확인/갱신

1. **CLAUDE.md** 헤더 1줄 업데이트
   ```
   # 마지막 업데이트: 2026-04-10 KST (CW30-HF4: CUSTOM section 이중 래핑 제거 — CustomBuilder outer <section> → <div>, 부모 ScenarioPanel의 max-w-[1440px] + px-8 단일 래퍼 사용. CUSTOM 2-column grid가 5개 일반 시나리오와 동일 폭으로 정렬. 475 pages ✓)
   ```

2. **docs/CHANGELOG.md** 최상단에 추가
   ```markdown
   ## [CW30-HF4] 2026-04-10
   ### Fixed
   - CUSTOM 시나리오 박스 폭 정렬 문제 해결. `CustomBuilder.tsx`가 자체 `<section max-w-[1440px] mx-auto px-8 pt-0 pb-16>` 래퍼를 갖고 있어 부모 `ScenarioPanel`의 동일 래퍼와 중첩되면서 CUSTOM 2-column grid가 좌우 128px 더 좁게 렌더링되던 문제.
   - CustomBuilder 외부 `<section>` → 스타일 없는 `<div aria-label=...>` 로 교체. 부모 ScenarioPanel의 단일 `<section>`이 폭/패딩 담당.
   - HF1/HF2/HF3 회귀 없음 확인.
   ```

3. **session-context.md**
   - `## 완료 항목` 에 `[x] CW30-HF4 — CUSTOM section 이중 래핑 제거 (2026-04-10)` 추가

4. **docs/NEXT_SESSION_START.md** 헤더 날짜 갱신

---

## ⚠️ 주의

1. **ScenarioPanel.tsx 절대 건드리지 말 것** — HF2 TitleBar 유지
2. **HF1/HF2/HF3 회귀 금지** — 이번 HF4는 폭 정렬 1건만
3. **B2C 코드 보호 규칙** — `lib/search/`, `lib/agent/`, `components/search/` 근처 접근 금지
4. **force push 금지**

---

## 🏁 완료 후 리포트 포맷

```
CW30-HF4 완료 ✅
- 파일 수정: components/custom/CustomBuilder.tsx (1개)
- <section ... max-w-1440 px-8 pb-16> → <div aria-label=...>
- Build: 475 pages ✓
- 로컬 확인: seller/custom 2-column 박스 좌우 x좌표 일치
- 프로덕션 배포: 커밋 해시 <hash>, Vercel 배포 성공
- HF1/HF2/HF3 회귀 없음 확인
- 4개 문서 날짜 2026-04-10 갱신 완료
```
