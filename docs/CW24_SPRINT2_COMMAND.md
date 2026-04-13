# CW24 Sprint 2 — 시나리오 상세 패널 구현 명령어

> 용도: 다음 세션 시작 시 Claude Code 터미널에 이 문서 경로를 알려주고 "이거대로 진행해줘"라고 하면 됩니다.
> 작성: 2026-04-10 KST (CW23-S1b 종료 시점)
> 선행 조건: CW23 Sprint 1 + S1b 완료 (HeaderMinimal / LiveTicker / ScenarioSelector 프로덕션 배포됨)

---

## 📋 복사해서 Claude Code에 바로 붙여넣기

```
CW24 Sprint 2를 진행해줘. 먼저 docs/HOMEPAGE_REDESIGN_SPEC.md 의 Sprint 2 섹션(685-697행)과 결정 4 (좌우 2분할 시나리오 페이지) 섹션을 읽고, 그 다음 docs/CW24_SPRINT2_COMMAND.md 의 작업 지시를 순서대로 실행해. 절대 규칙 #1 (B2C 코드 수정 금지), #2 (build 확인 후 push), #4 (console.log 금지) 반드시 준수. 완료되면 4개 문서(CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md) 날짜 동기화하고 git push까지 해줘.
```

---

## 🎯 Sprint 2 목표

CW23 Sprint 1 에서 만든 `ScenarioSelector` 가 버튼 선택만 하고 그 아래 placeholder 만 뜨는 상태를
**"버튼 선택 → 좌우 2분할 인터랙티브 패널 + 실제 워크플로우 코드 예제"** 까지 완성하는 것.

---

## 📐 구현 파일 목록

### 신규 생성 (5개)

1. **`components/home/ScenarioPanel.tsx`**
   - 좌우 2분할 컨테이너 (NonDevPanel 50% + DevPanel 50%)
   - `max-w-[1440px] mx-auto px-8 py-12`
   - props: `{ scenarioId: ScenarioId }`
   - 선택된 시나리오에 따라 NonDevPanel + DevPanel 에 데이터 주입
   - 5개 시나리오(`online_seller`, `d2c_brand`, `importer`, `exporter`, `forwarder`)는 각자 다른 워크플로우
   - `custom` 시나리오는 ScenarioPanel 대신 Sprint 3 에서 만들 `CustomBuilder` 플레이스홀더 렌더
   - `aria-live="polite"` 유지

2. **`components/home/NonDevPanel.tsx`** (왼쪽 50%)
   - 시나리오별 인터랙티브 데모
   - 상단 타이틀 + 서브타이틀 (시나리오 질문 노출)
   - 입력 필드 3~4개(Product / From / To / Value 등 시나리오마다 다름)
   - [Calculate] 버튼 → 실제 API 호출 (아래 API 섹션 참조)
   - 결과 카드 표시 (HS Code, Landed Cost, Restriction Status 등)
   - 각 필드/결과 오른쪽에 `[📋]` 버튼 → 클릭 시 `CodeCopyModal` 오픈
   - 상태 관리: `useState` 로 inputs, loading, result, error
   - 에러 처리: fallback to mock data (API 실패 시에도 UI 가 깨지지 않도록)
   - **로그인 게이트는 Sprint 5 (CW27)** — 이번 Sprint 에서는 [📋] 눌러도 모달만 뜨고 OK

3. **`components/home/DevPanel.tsx`** (오른쪽 50%)
   - 조합된 워크플로우 전체 코드 표시
   - 언어 탭: `cURL` / `Python` / `Node` / `Go` (4개)
   - `lib/scenarios/workflow-examples.ts` 에서 시나리오별 코드 불러오기
   - 코드 블록: `<pre><code>` + syntax highlighting 은 가벼운 수동 색상 (Prism/Shiki 도입 금지 — 빌드 무거워짐)
   - 상단에 [📋 Copy code] 버튼 + [API 문서 전체 보기 →] 링크
   - 클릭 시 `navigator.clipboard.writeText()` + toast "Copied!"

4. **`components/home/CodeCopyModal.tsx`**
   - 3가지 옵션 탭: 🧩 Embed (iframe) / 💻 API (cURL/Python/Node) / 🔗 Link (URL)
   - props: `{ open, onClose, scenarioId, fieldType: 'input' | 'result', fieldKey: string }`
   - Embed 탭: `<iframe src="https://widget.potal.app/{scenarioId}?prefill=..." />` 한 줄
   - API 탭: 언어 탭 + cURL/Python/Node 코드 블록 + 복사 버튼
   - Link 탭: `https://potal.app/demo/{scenarioId}?hs=...&from=...&to=...` URL 생성 + 복사 버튼
   - 배경: `fixed inset-0 bg-black/50` + 중앙 카드 `max-w-[720px]`
   - 닫기: ESC 키 + 바깥 클릭 + X 버튼
   - **접근성**: `role="dialog"` `aria-modal="true"` `aria-labelledby`

5. **`lib/scenarios/workflow-examples.ts`**
   - 5개 시나리오별 워크플로우 코드 데이터
   - 타입 정의:
     ```ts
     export type Language = 'curl' | 'python' | 'node' | 'go';
     export interface WorkflowExample {
       scenarioId: string;
       title: string;
       description: string;
       steps: string[];  // 단계 설명 (ex: "1. Classify HS", "2. Check restrictions", "3. Calculate landed cost")
       code: Record<Language, string>;
     }
     export const WORKFLOW_EXAMPLES: Record<string, WorkflowExample> = { ... };
     ```
   - 각 시나리오는 아래 "시나리오 5개 콘텐츠" 참조

### 수정 (2개)

6. **`components/home/ScenarioSelector.tsx`**
   - 현재 선택 시 placeholder 만 띄우는 영역을 `<ScenarioPanel scenarioId={selected} />` 로 교체
   - placeholder 코드 제거
   - import 추가

7. **`app/page.tsx`**
   - 변경 없음 (ScenarioSelector 가 그대로 ScenarioPanel 을 렌더하므로)
   - 단, `Suspense fallback={null}` 그대로 유지

---

## 🧪 시나리오 5개 콘텐츠 명세

### 1. Online Seller (Etsy, Shopify, Amazon 소규모)

**Non-Dev 데모 필드**:
- Product name: `"Handmade leather wallet"`
- From country: `Korea (KR)`
- To country: `United States (US)`
- Declared value: `$45 USD`

**API 체인**: `classify_product → check_restrictions → calculate_landed_cost`

**Dev 코드 예제 (cURL)**:
```bash
# Step 1: Classify HS
HS=$(curl -s -X POST https://api.potal.app/v1/classify \
  -H "Authorization: Bearer $POTAL_API_KEY" \
  -d '{"description":"Handmade leather wallet"}' | jq -r .hs_code)

# Step 2: Check restrictions
curl -X POST https://api.potal.app/v1/restrictions \
  -H "Authorization: Bearer $POTAL_API_KEY" \
  -d "{\"hs\":\"$HS\",\"from\":\"KR\",\"to\":\"US\"}"

# Step 3: Landed cost
curl -X POST https://api.potal.app/v1/landed-cost \
  -H "Authorization: Bearer $POTAL_API_KEY" \
  -d "{\"hs\":\"$HS\",\"from\":\"KR\",\"to\":\"US\",\"value\":45}"
```

**Dev 코드 (Python)**:
```python
from potal import Potal

potal = Potal(api_key=os.environ["POTAL_API_KEY"])

# Step 1
hs = potal.classify(description="Handmade leather wallet").hs_code

# Step 2
restrictions = potal.check_restrictions(hs=hs, from_="KR", to="US")
if restrictions.blocked:
    raise Exception(restrictions.reason)

# Step 3
cost = potal.landed_cost(hs=hs, from_="KR", to="US", value=45)
print(f"Landed cost: ${cost.total_usd}")
```

**Dev 코드 (Node)**:
```js
import { Potal } from '@potal/sdk';

const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });

const { hs_code } = await potal.classify({ description: 'Handmade leather wallet' });
const restrictions = await potal.checkRestrictions({ hs: hs_code, from: 'KR', to: 'US' });
if (restrictions.blocked) throw new Error(restrictions.reason);

const cost = await potal.landedCost({ hs: hs_code, from: 'KR', to: 'US', value: 45 });
console.log(`Landed cost: $${cost.total_usd}`);
```

**Dev 코드 (Go)**: 동일 구조, `github.com/potal/potal-go` SDK

---

### 2. D2C Brand (자체 쇼핑몰, 정기 수출)

**Non-Dev 데모 필드**:
- Product: `"Organic cotton T-shirt"`
- From: `Korea (KR)`
- To: `Germany (DE)`
- Value: `$28 USD`
- Quantity: `500`

**API 체인**: `classify_product → lookup_fta → calculate_landed_cost → generate_document(commercial_invoice)`

**왜 FTA**: 한-EU FTA 활용하여 관세 0% 혜택 시연

---

### 3. Importer (B2B 컨테이너 수입)

**Non-Dev 데모 필드**:
- Product: `"Industrial pumps"`
- From: `Germany (DE)`
- To: `Korea (KR)`
- Value: `$85,000 USD`
- Container: `40ft`

**API 체인**: `classify_product → check_us_nexus (N/A) → calculate_landed_cost → screen_shipment (denied party)`

---

### 4. Exporter (견적/계약 기반 대량 수출)

**Non-Dev 데모 필드**:
- Product: `"Lithium-ion battery cells"`
- From: `Korea (KR)`
- To: `United States (US)`
- Value: `$250,000 USD`

**API 체인**: `classify_product → check_restrictions (dangerous goods) → screen_denied_party → generate_document(export_declaration)`

**Why**: 위험물 + ECCN 통제 시나리오 시연

---

### 5. Forwarder / 3PL (소규모 물류)

**Non-Dev 데모 필드**:
- Shipments: `3 parcels`
- Origins: `KR → US/DE/JP (mixed)`
- Mode: `Air express`

**API 체인**: `screen_shipment (bulk) → calculate_landed_cost (batch) → compare_countries`

---

### 6. Custom (⚙️)

Sprint 2 범위 아님. ScenarioPanel 에서 `custom` 이 선택되면 다음 UI만 렌더:
```
┌────────────────────────────────────┐
│  ⚙️  CUSTOM Builder                │
│                                    │
│  Coming soon in Sprint 3 (CW25)    │
│  — 140 features, live assembly     │
└────────────────────────────────────┘
```

---

## 🔌 API 호출 처리

**문제**: NonDevPanel 에서 실제 POTAL API 호출하려면 API key 필요 + Rate limit 이슈.

**Sprint 2 해결책** (MVP):
1. **데모 전용 Next.js API Route** 신규 생성: `app/api/demo/scenario/route.ts`
   - 입력: `{ scenarioId, inputs }`
   - 내부에서 기존 `lib/classifier/`, `lib/cost-engine/`, `lib/restrictions/` 직접 호출
   - 인증 없음 (데모 전용, IP 기반 간단 쓰로틀만)
   - 응답: `{ hs_code, restrictions, landed_cost }` 합쳐서 한 번에
2. 내부 함수가 실패하면 **mock fallback** — `lib/scenarios/mock-results.ts` 에 시나리오별 가짜 결과 저장
3. NonDevPanel 은 이 demo API 만 호출 → 복잡도 낮음

**주의**: 이 demo API 는 공개 API 아님. 홈페이지 전용. `Cache-Control: no-store`.

---

## 🎨 스타일 가이드 (Sprint 1 과 일관성 유지)

- 색상: 선택 상태 `#02122c` (짙은 네이비), 하이라이트 `#F59E0B` (앰버), 보더 `slate-200`
- 폰트: body `text-[14px]`, 헤딩 `text-[24px]` ~ `text-[32px]` font-bold
- 여백: 섹션 간 `py-12`, 카드 내부 `p-8`
- 반응형: `max-w-[1440px] mx-auto px-8` (Sprint 1 과 동일)
- Border radius: `rounded-2xl` (큰 컨테이너), `rounded-xl` (버튼/카드)
- Shadow: `shadow-sm` (기본), `shadow-lg` (선택 상태)

---

## ✅ 완료 검증 체크리스트

Claude Code 가 반드시 통과해야 할 것:

- [ ] `npm run build` 성공 (로컬 `build-workdir` 사용해서 473+ pages 통과)
- [ ] TypeScript 타입 에러 없음
- [ ] 프로덕션 코드에 `console.log` 없음
- [ ] 5개 시나리오 버튼 모두 클릭했을 때 ScenarioPanel 이 정상 렌더
- [ ] `custom` 버튼 클릭 시 "Coming soon" 플레이스홀더만 뜸
- [ ] CodeCopyModal 이 ESC + 바깥 클릭 + X 로 모두 닫힘
- [ ] 언어 탭 4개 (curl/python/node/go) 전환 동작
- [ ] NonDevPanel 의 Calculate 버튼 클릭 시 로딩 → 결과 or mock fallback
- [ ] B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`) 수정 안 됨
- [ ] 4개 문서 헤더 날짜가 작업일 KST 로 일치
- [ ] `docs/CHANGELOG.md` 최상단에 CW24-S2 블록 추가됨
- [ ] git commit 메시지: `feat(CW24-S2): scenario panel + workflow examples`
- [ ] git push 완료 후 Vercel 배포 ID 확인 (www.potal.app 에서 `dpl_*` 검증)
- [ ] Notion Session Log DB 에 세션 기록 추가 (Cowork 에서)

---

## 🚨 절대 하지 말 것

1. ❌ 로그인 게이트 구현 (Sprint 5 에서) — 이번에는 [📋] 클릭 시 모달만 뜨면 OK
2. ❌ CustomBuilder 실제 구현 (Sprint 3) — `custom` 선택 시 플레이스홀더만
3. ❌ Supabase `user_combos` 테이블 건드리기 (Sprint 4)
4. ❌ Prism/Shiki/highlight.js 같은 syntax highlighter 라이브러리 추가
5. ❌ B2C 검색 코드 수정
6. ❌ `app/features/`, `app/developers/`, `app/pricing/` 페이지 수정
7. ❌ 기존 Header/Footer 수정 (ChromeGate 구조 유지)

---

## 📊 예상 작업량

| 작업 | 예상 시간 |
|------|----------|
| ScenarioPanel + NonDevPanel + DevPanel 골격 | 30분 |
| CodeCopyModal | 20분 |
| workflow-examples.ts 5개 시나리오 × 4언어 | 40분 |
| demo API route + mock fallback | 20분 |
| ScenarioSelector 통합 + 빌드 통과 | 15분 |
| 문서 업데이트 + git push | 15분 |
| **합계** | **약 2시간 20분** |

터미널 2개 병렬 사용 가능 시 1시간 30분으로 단축 가능.

---

## 🔗 참고

- 스펙 원본: `docs/HOMEPAGE_REDESIGN_SPEC.md` (특히 233~280행 결정 4)
- Sprint 1 구현체: `components/home/ScenarioSelector.tsx`, `lib/scenarios/scenario-config.ts`
- CW23-S1/S1b 커밋: `c626a05`, `4a656b8`
- 다음 Sprint (CW25 Sprint 3): CUSTOM Builder 140 features
