# COMMAND: CW37-S3 — UI 리뉴얼 (RapidAPI 패턴)

**작성일**: 2026-04-14 KST
**작업 라벨**: CW37-S3
**담당 터미널**: 터미널1 (Opus, UI 작업)
**예상 소요**: 5~7시간
**선행조건**: CW37-S2 Endpoint Consolidation 완료

**목적**: POTAL UI 를 RapidAPI 패턴으로 전면 리뉴얼. 페르소나 단순화 + HsCodeCalculator 전면 embed + 좌측 endpoint 리스트 + 중앙 Parameters/Result + 우측 Code Snippet.

---

## 핵심 변경 3가지

### 1. 홈페이지 단순화
**Before**: 6개 페르소나 (Online Seller / D2C Brand / Importer / Exporter / Forwarder / Custom) + 서브타이틀 + 각종 마케팅 카피

**After**:
```
POTAL
"무역 어떻게 하세요?"

┌─────────┐  ┌─────────┐
│  📤     │  │  📥     │
│  수출    │  │  수입    │
└─────────┘  └─────────┘
```
끝. 부연 설명 0.

### 2. 워크스페이스 = RapidAPI 패턴
좌측 sidebar + 중앙 Parameters/Result + 우측 Code Snippet.

### 3. HsCodeCalculator 전면 embed
모든 Compute endpoint 화면에 HsCodeCalculator 컴포넌트 embed. HS Code input 필드 제거.

---

## Phase 별 작업

### Phase 1: 홈페이지 리뉴얼 (1시간)
파일: `app/page.tsx`
변경:
- 6 페르소나 제거
- 2 버튼 (수출/수입) 만 남김
- 서브타이틀 "무역 어떻게 하세요?" 또는 비슷한 단순 메시지
- 각 버튼 클릭 → `/workspace/export` 또는 `/workspace/import`
- 제거: HeroSection, ScenarioSelector, SubtitlePanel 등 관련 컴포넌트

기존 페이지 (예: playground 기존 경로) 는 redirect:
- `/playground` → `/workspace/export` (default)
- 기존 URL 보존 (SEO)

### Phase 2: 워크스페이스 페이지 신설 (2시간)
파일: `app/workspace/[direction]/page.tsx` (dynamic route)
`direction` = "export" | "import"

레이아웃:
```
┌─ Workspace ────────────────────────────────────┐
│ [📤 수출 또는 📥 수입] ← breadcrumb              │
│                                                │
│ ┌─ 좌측 sidebar (30%) ──┐ ┌─ 중앙 (50%) ──┐   │
│ │ 🛠️ Compute           │ │ (선택 endpoint │   │
│ │  • classify           │ │  의 Parameters │   │
│ │  • calculate          │ │  + Run +       │   │
│ │  • apply-fta          │ │  Response)     │   │
│ │  • check-restrictions │ │                │   │
│ │  • compare            │ │                │   │
│ │  • generate-document  │ │                │   │
│ │                       │ │                │   │
│ │ 🔍 Screening          │ │                │   │
│ │  • screen-parties     │ │                │   │
│ │  • eccn-lookup        │ │                │   │
│ │                       │ │                │   │
│ │ 📚 Guides             │ │                │   │
│ │  • customs-filing     │ │                │   │
│ │  • incoterms          │ │                │   │
│ │  • section-301        │ │                │   │
│ │  • anti-dumping       │ │                │   │
│ └──────────────────────┘ │                │   │
│                          └────────────────┘   │
│ ┌─ 우측 (20%) ─────────────────────────────┐  │
│ │ Code Snippet (DevPanel)                   │  │
│ │ [curl] [Python] [Node] [PHP] [Go] [Ruby]  │  │
│ │                                           │  │
│ │ curl -X POST https://api.potal.app/v1/... │  │
│ │ ...                                       │  │
│ └───────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

컴포넌트 신설:
- `app/workspace/[direction]/page.tsx` — layout
- `components/workspace/EndpointSidebar.tsx` — 좌측 리스트
- `components/workspace/EndpointPanel.tsx` — 중앙 Parameters + Result
- `components/workspace/CodeSnippetPanel.tsx` — 우측 코드 (DevPanel 기반)

### Phase 3: Endpoint 별 Parameters 컴포넌트 (2시간)
각 endpoint 의 Parameters 입력 UI 를 EndpointPanel 에 동적으로 로드.

파일 구조:
```
components/workspace/endpoints/
  ├ ClassifyEndpoint.tsx
  ├ CalculateEndpoint.tsx
  ├ ApplyFtaEndpoint.tsx
  ├ CheckRestrictionsEndpoint.tsx
  ├ CompareEndpoint.tsx
  ├ GenerateDocumentEndpoint.tsx
  ├ ScreenPartiesEndpoint.tsx
  └ EccnLookupEndpoint.tsx
```

각 컴포넌트 구조:
```tsx
export function ClassifyEndpoint() {
  return (
    <>
      <Parameters>
        <HsCodeCalculator embedded={true} onResult={...} />
        {/* scenario-specific inputs if any */}
      </Parameters>
      <RunButton />
      <Result />
    </>
  );
}
```

Compute endpoints 6개는 **HsCodeCalculator embed** 기본.
Screening endpoints 2개는 HsCodeCalculator 없음 (다른 input domain).

### Phase 4: HsCodeCalculator embedded 모드 (1시간)
파일: `components/playground/HsCodeCalculator.tsx`
현재: popup 모드
추가: `embedded: boolean` prop

```tsx
interface HsCodeCalculatorProps {
  embedded?: boolean;  // true = inline UI, false = popup (기본)
  onResult?: (result: { hsCode: string; confidence: number; ... }) => void;
}
```

embedded=true 시:
- popup 대신 inline 렌더링
- 10-field 입력 필드 전부 보이게
- 결과 (HS code) 실시간 노출

### Phase 5: HS Code input 필드 전면 제거 (30분)
영향 대상 (CW37-S1 audit 에서 명시된 모든 곳):
- Seller Classify 화면
- Calculate Landed Cost 화면
- Restrictions 화면
- Compare Countries 화면
- (기타)

각 화면:
- `<input name="hsCode" />` 또는 유사 필드 제거
- HsCodeCalculator embed 로 대체
- 사용자가 직접 HS code 입력하고 싶으면 → HsCodeCalculator 의 "Edit" 버튼 (overrideMode)

### Phase 6: 시나리오 관련 코드 제거 (30분)
대상 (CW37-S1 audit 에서 명시):
- `app/api/demo/scenario/route.ts` (또는 유사)
- `components/home/NonDevPanel.tsx` (페르소나 분리)
- `components/home/ScenarioSelector.tsx`
- `lib/scenarios/*`

**주의**: 완전 삭제 X. 삭제 대신:
- redirect 처리 (기존 URL 유효)
- 주석 처리 or deprecation
- 나중 cleanup sprint 에서 완전 제거

### Phase 7: Code Snippet Panel (DevPanel) 강화 (1시간)
파일: `components/workspace/CodeSnippetPanel.tsx`
기능:
- 탭: curl / Python / Node.js / PHP / Go / Ruby / Java
- 선택된 endpoint 의 최신 Parameters 기반 실시간 생성
- Copy 버튼
- "Try in RapidAPI" 외부 링크 (optional, 장기)

Python SDK 예시:
```python
from potal_sdk import POTALClient

client = POTALClient(api_key="YOUR_API_KEY")
result = client.classify(
    product_name="Cotton T-shirt",
    material="cotton",
    origin="KR",
    destination="US"
)
print(result.hs_code)  # "6109.10.00.10"
```

### Phase 8: Testing (30분~1시간)
- 각 endpoint 화면에서 Parameters 입력 → Run → Result 노출 → Code 확인
- HsCodeCalculator embed 정상 동작
- 수출/수입 workspace 별로 추천 endpoint 순서 차이 (일부)
- 모바일 반응형 확인 (sidebar collapsible)

### Phase 9: Regression
- verify-cw32 28/28
- verify-cw33 23/23
- verify-cw34-s4 22/22
- verify-cw34-s4-5-fta 22/22
- verify-cw36-* 전부
- verify-cw37-s2-consolidation 10/10
- 빌드 475/475 (또는 변화에 따라)

### Phase 10: Production 검증
- Vercel `--prod` 배포
- 3 시나리오 실제 클릭 확인:
  - Export → classify → cotton t-shirt → HS code 나오고 코드 스니펫 복사 가능
  - Import → calculate → HS Code Calculator 입력 → 총 비용 결과
  - screen-parties → Huawei → sanctions 결과

### Phase 11: Commit
```
feat(cw37-s3): UI renewal to RapidAPI pattern

- Home: 6 personas → 2 (수출/수입) 단순화
- Workspace /workspace/[direction]: 좌측 endpoint sidebar + 중앙 Parameters/Result + 우측 Code Snippet
- HsCodeCalculator embedded mode for all 6 Compute endpoints
- HS Code input field removed from all scenarios
- Endpoint-specific Parameters components (ClassifyEndpoint, CalculateEndpoint, etc.)
- CodeSnippetPanel with 7 language tabs
- Legacy scenario URLs redirect (backward compat)
```

### Phase 12: 문서 동기화

---

## 원칙

- **RapidAPI 패턴 엄수**: 좌측 리스트 + 중앙 Parameters/Result + 우측 Code
- **HsCodeCalculator 전면 embed**: HS Code input 필드 0개
- **Backward compatibility**: 기존 URL redirect
- **모바일 반응형**: sidebar collapsible
- **Legacy 코드 점진 제거**: 삭제보다 deprecation 선호

---

## 완료 기준

- [ ] 홈 6 페르소나 → 2 (수출/수입)
- [ ] `/workspace/[direction]` 페이지 신설
- [ ] 좌측 sidebar + 중앙 Parameters + 우측 Code Snippet
- [ ] HsCodeCalculator embedded=true 모드
- [ ] 8 endpoint 컴포넌트 (6 Compute + 2 Screening)
- [ ] HS Code input 필드 전면 제거
- [ ] 시나리오 관련 legacy redirect
- [ ] Regression 전부 green
- [ ] Production 검증 PASS
- [ ] Commit + push + 문서 동기화

완료 후 CW37-S4 (Screening endpoints) 시작.
