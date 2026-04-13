# CW30-HF3 — CUSTOM 시나리오 헤더 이중 노출 제거

**작성일**: 2026-04-10 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**예상 소요**: 10분
**전제조건**: CW30-HF2 배포 완료된 상태 (main 브랜치)

---

## 🎯 목적

CW30-HF2에서 `ScenarioPanel.tsx`의 `TitleBar`를 새로 만들어 모든 시나리오에 통일된 패널 헤더(`⚙️ POTAL for custom — Build your own combo`)를 적용했다.

그러나 CUSTOM 시나리오는 내부에 별도의 `CustomBuilder` 컴포넌트를 쓰고 있고, 이 컴포넌트에도 자체 헤더(`⚙️ CUSTOM — Build your own workflow / Pick any combination of POTAL's 141 features...`)가 있어서 **CUSTOM 페이지에서만 헤더가 이중으로 보이는 문제**가 발생.

**해결 방침 — Option B (CEO 확정 2026-04-10)**
- CustomBuilder의 `⚙️ CUSTOM — Build your own workflow` 헤더 **블록 통째로 제거**
- 단, `Pick any combination of POTAL's 141 features. The code on the right updates instantly.` 힌트 문구는 CUSTOM의 핵심 가치 제안이므로 **살려서** 2-column grid 바로 위에 얇은 헬퍼 텍스트 한 줄로 이동
- 5개 일반 시나리오와 레이아웃 일관성 유지

---

## 📂 수정 대상 파일

**단 1개 파일만 수정**: `components/custom/CustomBuilder.tsx`

다른 파일은 절대 건드리지 말 것. 특히:
- ❌ `components/home/ScenarioPanel.tsx` (HF2 TitleBar 유지)
- ❌ `components/home/ScenarioSelector.tsx` (HF1 + HF2 유지)
- ❌ `lib/scenarios/scenario-config.ts` (서브타이틀 copy 유지)

---

## ✏️ 구체적 변경사항

### Before (components/custom/CustomBuilder.tsx 라인 58~78)

```tsx
  return (
    <section
      aria-label="CUSTOM builder — assemble your workflow"
      className="w-full max-w-[1440px] mx-auto px-8 pt-4 pb-16"
    >
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[28px]" aria-hidden="true">⚙️</span>
        <div>
          <h2 className="text-[20px] font-extrabold text-[#02122c] leading-tight">
            CUSTOM — Build your own workflow
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Pick any combination of POTAL&apos;s {FEATURE_COUNT} features. The code
            on the right updates instantly.
          </p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
```

### After

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

**변경 요약**:
1. `{/* Title */}` 블록 통째 삭제 (이모지 `⚙️` + `<h2>CUSTOM — Build your own workflow</h2>` + 래퍼 div)
2. `<p>` 헬퍼 텍스트만 남겨서 grid 바로 위에 배치 (`mb-3`로 grid와 살짝 간격)
3. `<section>`의 `pt-4` → `pt-0` 으로 변경 (HF2 TitleBar 바로 아래에 붙도록, 세로 공간 추가 절약)

---

## ✅ 검증 순서 (Opus가 직접 수행)

### 1. 타입체크 + 빌드

```bash
cd ~/potal
npm run build 2>&1 | tail -30
```

**통과 기준**:
- `✓ Compiled successfully`
- CustomBuilder.tsx 관련 에러 없음
- 페이지 수 475 유지 (HF2 기준)

### 2. 로컬 개발 서버 + 시각 확인

```bash
npm run dev
```

브라우저 또는 Chrome MCP로:
1. `http://localhost:3000/?type=custom` 접속
2. 다음 체크:
   - [ ] HF2 패널 헤더 `⚙️ POTAL for custom — Build your own combo` 가 **한 번만** 보인다
   - [ ] 기존 `⚙️ CUSTOM — Build your own workflow` 는 사라졌다
   - [ ] `Pick any combination of POTAL's 141 features. The code on the right updates instantly.` 힌트 문구는 2-column grid 바로 위에 작은 회색 텍스트로 **살아있다**
   - [ ] 왼쪽 FeatureCheckbox 패널과 오른쪽 LiveCodeAssembler 가 정상 렌더링
   - [ ] 다른 시나리오(seller/d2c/importer/exporter/forwarder) 는 변화 없음

### 3. HF1/HF2 회귀 확인

- [ ] `/` 접속 시 seller 박스가 여전히 기본 선택 (HF1)
- [ ] 시나리오 버튼들 `min-h-[52px]` 1줄 유지 (HF2)
- [ ] Hero `text-[26px]`, `pt-6 pb-4` 유지 (HF2)

### 4. 프로덕션 배포

```bash
git add components/custom/CustomBuilder.tsx
git commit -m "fix(custom): remove duplicate heading on CUSTOM scenario (CW30-HF3)

- Delete CustomBuilder's internal '⚙️ CUSTOM — Build your own workflow' title block
- Keep instructional hint as single-line helper text above 2-column grid
- HF2 panel header '⚙️ POTAL for custom — Build your own combo' now serves as the sole CUSTOM heading
- Preserve HF1 (seller default) + HF2 (Hero/button/empty inputs) untouched"

git push origin main
```

Vercel 자동 배포 확인 후:
- [ ] `https://potalapp.com/?type=custom` 프로덕션에서 동일 체크리스트 통과

---

## 📝 완료 후 문서 업데이트 (Opus 필수 수행)

### 4개 문서 헤더 날짜 오늘(2026-04-10) 확인/갱신

1. **CLAUDE.md** 헤더 1줄 업데이트
   ```
   # 마지막 업데이트: 2026-04-10 KST (CW30-HF3: CUSTOM 시나리오 헤더 중복 제거 — CustomBuilder 내부 '⚙️ CUSTOM — Build your own workflow' 타이틀 블록 삭제, 힌트 문구만 살려서 grid 위 헬퍼 텍스트로 이동. HF2 패널 헤더가 CUSTOM의 단일 헤더 역할. 475 pages ✓)
   ```

2. **docs/CHANGELOG.md** 최상단에 추가
   ```markdown
   ## [CW30-HF3] 2026-04-10
   ### Fixed
   - CUSTOM 시나리오 헤더 중복 제거. HF2 패널 헤더(`⚙️ POTAL for custom — Build your own combo`)와 CustomBuilder 내부 헤더(`⚙️ CUSTOM — Build your own workflow`)가 둘 다 보이던 이중 노출 문제 해결.
   - CustomBuilder: `{/* Title */}` 블록 통째 제거, instructional hint(`Pick any combination of POTAL's 141 features...`)는 grid 위 `text-[12px] text-slate-500` 헬퍼 텍스트로 이동.
   - `<section>` `pt-4` → `pt-0` 세로 공간 추가 절약.
   - 회귀 없음: HF1(seller default) + HF2(Hero/button/empty inputs) 유지.
   ```

3. **session-context.md**
   - `## 완료 항목` 에 `[x] CW30-HF3 — CUSTOM 헤더 중복 제거 (2026-04-10)` 추가
   - `## 현재 TODO` 에서 관련 항목 있으면 제거

4. **docs/NEXT_SESSION_START.md** 헤더 날짜 갱신 + 다음 작업 Phase 2 traffic acquisition 논의로 명시

---

## ⚠️ 주의

1. **HF1/HF2 절대 건드리지 말 것** — 이번 HF3은 CustomBuilder.tsx 단 1개 파일 수정
2. **B2C 코드 보호 규칙** — `lib/search/`, `lib/agent/`, `components/search/` 근처 접근 금지
3. **force push 금지**
4. **Notion Session Log 업데이트는 Cowork에서 처리** — Opus는 4개 코드 문서만 건드림

---

## 🏁 완료 후 리포트 포맷

Cowork(Terminal1 → Cowork)로 돌아와서 아래 포맷으로 보고:

```
CW30-HF3 완료 ✅
- 파일 수정: components/custom/CustomBuilder.tsx (1개)
- Title 블록 삭제, 힌트 헬퍼 텍스트로 이동
- Build: 475 pages ✓
- 로컬 확인: CUSTOM 페이지 헤더 1개만 노출 확인
- 프로덕션 배포: 커밋 해시 <hash>, Vercel 배포 성공
- HF1/HF2 회귀 없음 확인
- 4개 문서 날짜 2026-04-10 갱신 완료
```
