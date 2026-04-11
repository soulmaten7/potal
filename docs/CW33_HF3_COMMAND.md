# CW33-HF3 — 홈페이지 Input Correctness & HS Classifier Hint Forwarding

> 작성: 2026-04-11 KST
> 전제: CW33 + HF1 + HF2 진짜 완료 상태 (Chrome MCP 9/9 green)
> 실행 터미널: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
> 예상 소요: 3~4 시간 (코드 1~2h + 빌드/검증 1~2h)

---

## 배경

CW33-HF2 검증 후 홈페이지 UI 에서 3가지 신규 이슈 발견. 그 중 2가지 (Issue 1 + Issue 3-A/B) 를 HF3 범위로 즉시 처리. Issue 2 (multi-currency) 는 영향 범위가 UI + API schema + engine convert 로직 3층이므로 CW34 Sprint 1 로 분리.

### 발견된 버그

1. **Issue 1 — Declared value input 숫자/USD 라벨 겹침** (🔴 P0)
   - 현상: 홈페이지 데모의 모든 숫자 입력 필드에서 사용자가 입력한 값이 우측의 unit 라벨 (`USD`/`units`) 과 시각적으로 겹침
   - 원인: `components/home/NonDevPanel.tsx:282-298` — input 의 `className="... px-3 ..."` 이 좌우 패딩 12px 동일. 그런데 unit span 이 `absolute right-3` 에 떠 있어서 숫자 자리와 라벨 자리가 충돌
   - 영향: seller / d2c / importer / exporter / forwarder **5개 시나리오 전체** (declared value / unit value / quantity / shipment value / value per shipment)

2. **Issue 3-A — HS 분류기 입력 단일 텍스트 의존** (🔴 P0)
   - 현상: 분류기 체인 (deterministicOverride → vectorSearch → keyword → AI) 전체가 `productName` 자유 텍스트 1개에만 의존
   - 엔진은 이미 `productCategory` / `hsCode` / `weight_kg` / `firmName` / `shippingTerms` 5개 시그널을 받을 수 있게 설계됨 (`app/lib/cost-engine/GlobalCostEngine.ts:95-117`)
   - 데모 UI (`components/home/NonDevPanel.tsx:60-110`) 의 `SCENARIO_FIELDS` 가 `product` (text) 만 전달하고 추가 힌트를 받지 않음
   - 결과: leather wallet (4202.21/4202.31 재료 구분 불가), cotton T-shirt (knit/woven 구분 불가), centrifugal pump (mechanism 구분 불가) 등 유사 HS 코드 간 오분류 리스크 상존

3. **Issue 3-B — demo route 가 힌트 forwarding 안 함** (🔴 P0)
   - 현상: `app/api/demo/scenario/route.ts:105-127` `buildEngineInput()` 이 `productCategory` / `hsCode` 필드를 `GlobalCostInput` 에 넣지 않음
   - 엔진 쪽 호출부 (`GlobalCostEngine.ts:320-321`) 는 이미 `classifyWithOverride(productName, hsCode, productCategory)` 로 3 파라미터 다 받음

---

## 스코프 (정확히 이것만)

### S1. Input 겹침 핫픽스 — 5분

**파일**: `components/home/NonDevPanel.tsx`

**위치**: 282번 라인의 `<input ... />` 요소

**변경**:
```diff
- className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
+ className="w-full pl-3 pr-14 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
```

**이유**: `px-3` 을 `pl-3 pr-14` 로 분리. 좌측 12px 유지, 우측 56px 확보. `absolute right-3` 의 unit span 과 충돌 해소.

**주의**: `f.unit` 이 없는 (text 입력) 경우에도 동일 클래스가 적용되지만 `pr-14` 의 여유 공간은 시각적으로 허용 가능. 조건부 클래스로 분기할 필요 없음.

---

### S2. UI 에 HS 힌트 필드 추가 — 1~1.5h

**파일**: `components/home/NonDevPanel.tsx`

#### S2.1. `FieldDef` 인터페이스 확장

현재 `type` 이 `'text' | 'number' | 'select' | 'multiselect'` 인데, advanced 섹션에 넣을 optional 필드는 기본 type 재활용하고 별도 `optional: true` flag 만 추가:

```diff
 interface FieldDef {
   key: string;
   label: string;
   type: 'text' | 'number' | 'select' | 'multiselect';
   placeholder?: string;
   defaultValue?: string | number;
   options?: Array<{ value: string; label: string }>;
   unit?: string;
   /** CW31-HF1: cap for multiselect fields */
   max?: number;
+  /** CW33-HF3: advanced optional field — rendered inside collapsed section */
+  optional?: boolean;
+  /** CW33-HF3: helper text under the label */
+  helper?: string;
 }
```

#### S2.2. 카테고리 옵션 상수 신설

`COUNTRY_OPTIONS_WITH_PLACEHOLDER` 정의 아래에 추가:

```ts
// CW33-HF3: HS classification category hints. These map to WCO 22 sections
// but we keep the label friendly. The engine passes `productCategory` to
// the classifier which uses it as a disambiguation tie-breaker.
const CATEGORY_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'apparel-knit', label: 'Apparel — knitted' },
  { value: 'apparel-woven', label: 'Apparel — woven' },
  { value: 'leather-goods', label: 'Leather goods / bags / wallets' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'electronics-consumer', label: 'Consumer electronics' },
  { value: 'electronics-battery', label: 'Batteries & cells' },
  { value: 'machinery-pumps', label: 'Machinery — pumps' },
  { value: 'machinery-general', label: 'Machinery — general' },
  { value: 'food-beverage', label: 'Food & beverage' },
  { value: 'cosmetics', label: 'Cosmetics / personal care' },
  { value: 'toys-games', label: 'Toys & games' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'chemicals', label: 'Chemicals / industrial' },
  { value: 'auto-parts', label: 'Auto parts' },
  { value: 'other', label: 'Other' },
];
```

#### S2.3. 모든 시나리오에 힌트 필드 추가

`SCENARIO_FIELDS` 의 5개 시나리오 (seller/d2c/importer/exporter/forwarder) 각각 마지막에 다음 2개 필드 append:

```ts
{ key: 'category', label: 'Category (optional)', type: 'select', options: CATEGORY_OPTIONS, optional: true, helper: 'Helps the classifier pick between similar HS codes.' },
{ key: 'hsHint', label: 'HS code (optional)', type: 'text', placeholder: 'e.g. 4202.21 or 610910', optional: true, helper: 'If you already know the HS, we skip classification.' },
```

#### S2.4. Advanced 섹션 렌더링 분기

현재 모든 필드를 `{fields.map(f => ...)}` 한 덩어리로 렌더. 이걸 두 덩어리로 분리:

```tsx
// Inputs
<div className="px-6 py-5 space-y-3">
  {fields.filter(f => !f.optional).map(f => (
    // 기존 렌더링 로직 그대로
  ))}

  {/* Advanced (HS hints) — CW33-HF3 */}
  {fields.some(f => f.optional) && (
    <details className="pt-2 border-t border-slate-100">
      <summary className="text-[11px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer py-2 hover:text-slate-700">
        Advanced — HS classification hints
      </summary>
      <div className="space-y-3 pt-2">
        {fields.filter(f => f.optional).map(f => (
          // 동일 렌더링 로직 (키 prefix 충돌 없도록 주의)
        ))}
      </div>
    </details>
  )}

  {/* Calculate button — 기존 로직 그대로 */}
</div>
```

**중요**: Calculate 버튼의 `allFilled` 체크는 `fields.filter(f => !f.optional)` 로 제한. Optional 필드가 비어 있어도 버튼은 활성화.

#### S2.5. 렌더 루프 중복 제거

힌트 필드 렌더 블록을 `renderField(f)` 함수로 뽑아서 `fields.filter(f => !f.optional).map(renderField)` + `fields.filter(f => f.optional).map(renderField)` 둘 다 재사용. 코드 중복 방지.

#### S2.6. CopyBadge 힌트 필드에서도 동작 유지

기존처럼 `openCopyModal('input', f.key, display)` 호출. 힌트 필드도 코드 스니펫에 포함되도록.

---

### S3. demo route 에서 힌트 forwarding — 20분

**파일**: `app/api/demo/scenario/route.ts`

#### S3.1. `buildEngineInput()` 확장

```diff
 function buildEngineInput(
   inputs: Record<string, string | number | string[] | undefined>
 ): GlobalCostInput | null {
   const product = toStr(inputs.product);
   const from = toStr(inputs.from);
   const to = toStr(inputs.to);
   const unitValue = toNumber(inputs.value);
   const quantity = toNumber(inputs.quantity, 1);
+  const category = toStr(inputs.category);
+  const hsHint = toStr(inputs.hsHint);

   if (!from || !to || unitValue <= 0) return null;

   const totalValue = unitValue * quantity;

   return {
     price: totalValue,
     shippingPrice: 0,
     origin: from.toUpperCase(),
     destinationCountry: to.toUpperCase(),
     productName: product,
     quantity,
     shippingType: 'international',
+    productCategory: category || undefined,
+    hsCode: hsHint ? hsHint.replace(/[^0-9]/g, '').slice(0, 10) : undefined,
   };
 }
```

**정규화 규칙**:
- `category`: 문자열 그대로 (빈 문자열이면 undefined)
- `hsHint`: 숫자만 남기고 최대 10 자리로 자름. "4202.21" / "4202 21" / "420221" 전부 `420221` 로 통일

#### S3.2. `buildForwarderInputs()` 도 동일하게

forwarder 도 같은 파라미터 받도록 동일 변경. 각 destination 순회 시 `productCategory` / `hsCode` 가 모든 destination 에 동일하게 전달.

#### S3.3. DevPanel 코드 스니펫

`components/home/DevPanel.tsx` 가 `inputs` 를 그대로 받아서 `renderWorkflowCode(scenarioId, lang, inputs)` 를 호출할 것. `category` / `hsHint` 값이 있으면 스니펫의 JSON body 에도 반영되도록 확인. (기존 lifted state 가 자동으로 흘러 들어가므로 손댈 필요 없을 가능성 높음 — 빌드 후 실제 복사본 확인)

---

## 실행 절차 (Polaris)

### Step 0. 브랜치
현재 main 에서 바로 작업. HF 이므로 별도 브랜치 불필요 (CW33-HF1/HF2 와 동일 패턴).

### Step 1. S1 핫픽스
1. `components/home/NonDevPanel.tsx:292` 한 줄 수정
2. `npm run build` — 빌드 green 확인
3. `npm run dev` 로컬에서 숫자 입력 → USD 라벨과 겹치지 않는지 눈으로 확인

### Step 2. S2 UI 확장
1. `FieldDef` 인터페이스 확장
2. `CATEGORY_OPTIONS` 상수 추가
3. `SCENARIO_FIELDS` 5개 시나리오에 힌트 필드 2개씩 append
4. `renderField(f)` 함수 추출
5. advanced `<details>` 섹션 분기 렌더링
6. Calculate 버튼의 `allFilled` 체크를 non-optional 필드로 제한
7. `npm run build` green 확인
8. `npm run dev` 로컬에서 5개 시나리오 전부 진입 → Advanced 접기/펼치기 동작 + optional 비어도 Calculate 활성 확인

### Step 3. S3 라우트 forwarding
1. `buildEngineInput()` 에 `category` / `hsHint` 추출 + 정규화 + 엔진 입력에 주입
2. `buildForwarderInputs()` 동일 변경
3. `npm run build` green
4. 로컬 curl 로 API 호출 테스트:
   ```bash
   curl -s -X POST http://localhost:3000/api/demo/scenario \
     -H "Content-Type: application/json" \
     -d '{"scenarioId":"seller","inputs":{"product":"wallet","from":"KR","to":"US","value":45,"category":"leather-goods"}}' | jq .
   ```
5. DevPanel 코드 스니펫이 `category`/`hsHint` 를 포함하는지 로컬에서 시각 확인

### Step 4. 프로덕션 배포 + Chrome MCP 재검증 (Cowork 에서 실행)
다음 8 케이스를 프로덕션 www.potal.app 에서 검증. 모두 `source=live` + 정확한 HS 코드 + `X-Engine-Status: ok` 필요.

| # | 시나리오 | 상품 | from→to | hint | 기대 HS | 기대 동작 |
|---|---------|------|---------|------|---------|----------|
| 1 | seller | Handmade leather wallet | KR→US | category=leather-goods | 4202.21.xx | 정확한 분류 |
| 2 | seller | Cotton knit T-shirt | KR→US | category=apparel-knit | 6109.10 | 정확한 분류 |
| 3 | seller | Woven cotton shirt | KR→US | category=apparel-woven | 6205.20 | (대안) 6109 대신 6205 쪽 |
| 4 | d2c | Leather handbag | IT→US | hsHint=420221 | 4202.21 | hint 직통 사용 |
| 5 | importer | Industrial centrifugal pump | VN→KR | category=machinery-pumps | 8413.70 | 정확한 분류 |
| 6 | exporter | Lithium-ion battery cells | KR→US | category=electronics-battery | 8507.60 | HAZMAT 보존 |
| 7 | exporter | CR2032 primary cells | KR→US | category=electronics-battery | 8506.50 | HAZMAT 보존 (primary) |
| 8 | forwarder | Cotton T-shirts | KR→[US,DE,JP] | category=apparel-knit | 6109.10 | 모든 dest 동일 HS |

**UI 체크**:
- 모든 숫자 필드가 값 입력 시 USD/units 라벨과 겹치지 않음
- Advanced 섹션 접기/펼치기 동작
- Category 미입력 시에도 Calculate 버튼 active
- hsHint 입력 시 `420221` / `4202.21` / `4202 21` 모두 동일 결과

### Step 5. 문서 업데이트
- `CLAUDE.md` 헤더 날짜 + CW33-HF3 한 줄
- `docs/CHANGELOG.md` 최상단에 CW33-HF3 블록 추가
- `session-context.md` 헤더 + TODO 체크오프
- `docs/NEXT_SESSION_START.md` 다음 우선순위를 CW34 Sprint 1 (multi-currency) 로 교체

### Step 6. 커밋 + push
```bash
git add components/home/NonDevPanel.tsx \
        app/api/demo/scenario/route.ts \
        CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md \
        docs/CW33_HF3_COMMAND.md
git commit -m "CW33-HF3: input overlap fix + HS classifier hint forwarding

- components/home/NonDevPanel.tsx: pl-3 pr-14 (숫자/USD 라벨 겹침 해소)
- components/home/NonDevPanel.tsx: 5 시나리오에 optional category + hsHint 필드
  (advanced 접기 섹션, Calculate 버튼 required-only 기준)
- app/api/demo/scenario/route.ts: buildEngineInput/buildForwarderInputs 에
  productCategory + hsCode (정규화: 숫자만, 10자리) forwarding
- 프로덕션 8 케이스 Chrome MCP 재검증: leather wallet / knit vs woven
  cotton / pump mechanism / Li-ion vs CR2032 HAZMAT / forwarder multi-dest
  전부 정확 분류 확인"
git push origin main
```

---

## 금지 사항

- **Issue 2 (currency 드롭다운) 는 건드리지 않는다.** 범위가 UI + API + engine 3층이라 CW34 정식 스프린트로 분리. HF3 에서 같이 하면 blast radius 관리 불가.
- **weight_kg / shippingTerms / firmName / buyerVatNumber 같은 나머지 advanced 필드도 이번엔 추가하지 않는다.** 카테고리 + HS hint 2개만.
- **분류기 코드 수정 금지**. `ai-classifier-wrapper.ts` / `classifier.ts` 는 이미 `category` 파라미터를 받게 되어 있으므로 UI + route 만 뚫으면 바로 동작.
- **기존 시나리오 기본값 (`SCENARIO_DEFAULTS`) 변경 금지.** 첫 진입 시 Calculate 버튼 active 유지를 위해 CW32 에서 이미 설정됨.
- **B2C 코드 금지** (CLAUDE.md 절대 규칙 #1).

---

## 완료 판정 기준

- [ ] `npm run build` green (Terminal1)
- [ ] 로컬 `npm run dev` 5개 시나리오 모두 숫자 필드 겹침 없음
- [ ] 로컬 advanced 섹션 접기/펼치기 정상, optional 비어도 Calculate 활성
- [ ] 로컬 curl 로 category/hsHint 전달 시 HS 결과 반영 확인
- [ ] 프로덕션 www.potal.app 에서 Chrome MCP 8/8 케이스 green
- [ ] 4개 문서 (CLAUDE/CHANGELOG/session-context/NEXT_SESSION_START) 날짜 동기화
- [ ] git commit + push 완료
- [ ] Notion Session Log 에 CW33-HF3 블록 추가

---

**실행 지시자**: 은태님
**작성**: Cowork 세션 2026-04-11 (CW33-HF2 검증 직후)
**다음 단계**: CW33-HF3 완료 후 → CW34 Sprint 1 (multi-currency) 정식 스코프 문서 작성
