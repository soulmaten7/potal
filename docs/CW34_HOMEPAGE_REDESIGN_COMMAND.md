# CW34 Homepage Redesign — "RapidAPI 스타일 API Playground"

**작성일**: 2026-04-12 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**선행 필독**: `docs/IDENTITY.md` (POTAL 정체성 문서)

---

## 🧭 왜 이 작업을 하는가

POTAL은 관세 계산 API를 제공하는 플랫폼이다.
지금 홈페이지는 Demo(비개발자용) + Developer workflow(개발자용) + API Reference(별도 페이지) 3개가 분리되어 있고, 서로 연결이 안 된다.

문제:
- Developer workflow의 엔드포인트 이름과 API Reference의 엔드포인트 이름이 안 맞음
- `/v1/restrictions` 엔드포인트가 API Reference에 존재하지 않음
- API Reference가 시나리오별 구분 없이 전체를 한 페이지에 보여줌
- Demo는 결과만 보여주고 코드 연결이 안 됨
- 개발자가 코드를 복사해서 그대로 실행할 수 없는 상태

→ 지금 상태는 **상품으로서 작동하지 않는다.**

해결: RapidAPI처럼 **하나의 playground 화면**에서 파라미터 입력 + 실행 + 결과 확인 + 코드 복사를 전부 할 수 있게 만든다. 비개발자는 실행해보면서 이해하고, 개발자는 코드 복사해서 가져간다. Demo와 Developer workflow가 분리될 이유가 없어진다.

---

## 🎯 최종 목표

Online Seller 시나리오를 선택하면 RapidAPI 스타일 playground가 나오고, 거기서:
1. 비개발자가 파라미터 넣고 실행해서 결과를 보면서 "아 이렇게 작동하구나" 이해
2. 개발자가 Code Snippets 탭에서 코드 복사해서 자기 플랫폼에 바로 적용
3. 모든 엔드포인트가 실제로 작동하고 정확한 결과 반환

Online Seller가 완성되면 나머지 5개 시나리오는 같은 패턴으로 확장.

---

## 📐 화면 구조 (확정)

### A. 홈페이지 (`/`) — 시나리오 선택

**레이아웃**: 센터 정렬 (기존 유지)
**구성**:
- 헤더 (아래 정의)
- 간결한 Hero (POTAL 한줄 소개)
- 6개 시나리오 선택 카드: Online Seller / D2C Brand / Importer / Exporter / Forwarder·3PL / CUSTOM
- 카드 클릭 → `/playground/{scenarioId}` 로 이동

**제거할 것**:
- 기존 NonDevPanel + DevPanel 2열 레이아웃
- HeroCalculator
- 기존 ScenarioPanel 내부 구조

### B. Playground (`/playground/seller` 등) — 핵심 화면

**레이아웃**: **full width** (max-w-[1440px] 제거, 화면 전체 사용)
**이유**: API 플랫폼 사용자는 100% 데스크탑. 3단 레이아웃에 충분한 폭 필요.

**3단 구조**:

```
┌──────────────┬─────────────────────────┬──────────────────────────┐
│  왼쪽 사이드바  │     가운데 (파라미터)       │    오른쪽 (코드/결과)        │
│              │                         │                          │
│ ▸ Classify   │  API Key: [입력란]        │  [Code Snippets] [Example│
│   Restrictions│                         │   Responses] [Results]   │
│   Landed Cost│  productName: [____]     │                          │
│              │  price: [____]           │  curl -X POST ...        │
│              │  origin: [KR ▾]          │    -H "X-API-Key: ..."   │
│              │  destination: [US ▾]     │    -d '{"price": 45}'    │
│              │                         │                          │
│              │  [▶ Test Endpoint]       │                          │
│              │                         │                          │
└──────────────┴─────────────────────────┴──────────────────────────┘
```

**왼쪽 사이드바**:
- API Overview 링크 (시나리오 설명)
- 시나리오별 엔드포인트 목록 (카테고리 접기/펼치기)
- 엔드포인트 검색
- 현재 선택된 엔드포인트 하이라이트

**가운데 (파라미터 영역)**:
- API Key 입력란 (로그인 시 자동 채움)
- 탭: Params / Headers / Body
- 해당 엔드포인트의 파라미터 입력 폼
- Required 표시 (빨간 별표)
- [▶ Test Endpoint] 실행 버튼

**오른쪽 (코드/결과 영역)**:
- **Code Snippets 탭**: Target(Shell/Python/Node.js/Go) + Client(cURL/requests/axios/http) 선택, 복사 버튼
- **Example Responses 탭**: 성공/에러 응답 예시
- **Results 탭**: 실제 실행 결과 (Test Endpoint 누른 후)

### C. 헤더 (전역)

**복원**: 기존 Header.tsx 스타일 복원 (홈에서 HeaderMinimal 사용하던 것 → 통일)
**메뉴**: POTAL 로고 + Help + 언어 선택 + Log in / Sign Up
**로그인 후**: POTAL 로고 + Help + 언어 선택 + Dashboard + 사용자 메뉴

**제거하는 메뉴**:
- Features → playground 자체가 기능을 보여줌
- Developers → playground 안에 통합됨
- Pricing → Forever Free. 별도 페이지 불필요. playground 안에 "Forever Free" 뱃지 + Enterprise "Contact Us" 버튼으로 충분
- Community → 현재 비활성, 불필요

### D. Dashboard 정리

**유지 (3개)**:
- `/dashboard/api-keys` — API 키 발급/관리 (핵심)
- `/dashboard/analytics` — 사용량 확인 (핵심)
- `/dashboard/settings` — 기본 설정

**숨김 또는 제거 (17개)**:
audit-log, batch-history, branding, inventory, notifications, onboarding, orders, partner, rate-monitor, reports, sla, status, team, visualization, webhooks, widget, integrations, partners, tax-exemptions

→ 라우트 파일 삭제가 아니라 **Dashboard 메인에서 링크 제거 + 헤더 네비에서 제거**. 코드는 남겨두되 진입점을 숨겨서 나중에 필요하면 복원 가능.

### E. 기존 페이지 정리

**제거하는 페이지** (헤더/네비에서 제거):
- `/features` — playground로 대체
- `/developers/docs` — playground로 대체
- `/pricing` — playground 내 뱃지로 대체

**유지하는 페이지**:
- `/help` — 지원
- `/auth/*` — 인증 플로우
- `/dashboard` — 로그인 후 관리 (3개만)
- `/legal/*` — 법률 (terms, privacy, refund)
- `/api/*` — 실제 API 라우트 (백엔드)

---

## 📋 Online Seller 엔드포인트 정의

### 1. Classify (`POST /api/v1/classify`)

**설명**: 상품명으로 HS code 자동 분류

**파라미터**:
| Field | Type | Required | 설명 |
|---|---|---|---|
| productName | string | ✅ | 상품명 (예: "Handmade leather wallet") |
| origin | string | - | 출발국 ISO code (예: "KR") |
| productCategory | string | - | 카테고리 힌트 (예: "leather-goods") |
| hsCode | string | - | HS code 힌트 (예: "4202") |

**Example Response**:
```json
{
  "success": true,
  "data": {
    "hsCode": "4202210000",
    "description": "Handbags, whether or not with shoulder strap",
    "confidence": 0.92,
    "method": "vector-search"
  }
}
```

### 2. Check Restrictions (`POST /api/v1/restrictions`)

**설명**: 해당 상품/국가 조합의 수입 제한 확인

**파라미터**:
| Field | Type | Required | 설명 |
|---|---|---|---|
| hsCode | string | ✅ | HS code (Classify 결과 사용) |
| from | string | ✅ | 출발국 ISO code |
| to | string | ✅ | 도착국 ISO code |

**Example Response**:
```json
{
  "success": true,
  "data": {
    "prohibited": false,
    "warnings": [],
    "licenses": [],
    "hazmat": false,
    "summary": "No active import restrictions detected for HS 4202210000 → US"
  }
}
```

**⚠️ 중요**: 이 엔드포인트가 현재 API Reference에 없을 수 있음. 없으면 신규 생성 필요. `app/api/v1/restrictions/route.ts` 확인 후 없으면 만들 것.

### 3. Calculate Landed Cost (`POST /api/v1/calculate`)

**설명**: 총 착지 비용 계산

**파라미터**:
| Field | Type | Required | 설명 |
|---|---|---|---|
| productName | string | - | 상품명 (HS 자동 분류용) |
| price | number | ✅ | 상품 가격 (USD) |
| origin | string | - | 출발국 (기본: CN) |
| destinationCountry | string | - | 도착국 (기본: US) |
| shippingPrice | number | - | 배송비 |
| hsCode | string | - | HS code (지정 시 분류 스킵) |
| zipcode | string | - | US 주 세금 계산용 |

**Example Response**:
```json
{
  "success": true,
  "data": {
    "totalLandedCost": 78.61,
    "currency": "USD",
    "breakdown": [
      { "label": "Product Price", "amount": 49.99 },
      { "label": "Shipping", "amount": 8.50 },
      { "label": "Import Duty (12.0%)", "amount": 7.02 },
      { "label": "VAT (20.0%)", "amount": 13.10 }
    ],
    "isDutyFree": false,
    "meta": {
      "hsCode": "6109100000",
      "ftaApplied": false,
      "originCountry": "CN",
      "destinationCountry": "GB"
    }
  }
}
```

---

## 🔧 작업 순서 (한 번에 하나만)

### Phase 1: 기반 구조

**Step 1**: 헤더 통일
- `components/layout/Header.tsx` 수정: 메뉴를 Help + 언어 + 로그인 only로
- `components/layout/ChromeGate.tsx` 수정: 홈에서도 동일 Header 사용 (HeaderMinimal 제거)
- Features, Developers, Pricing, Community 메뉴 링크 제거

**Step 2**: Playground 라우트 생성
- `app/playground/[scenarioId]/page.tsx` 신규 생성
- full width 레이아웃 (max-w 없음)
- 3단 구조 기본 틀 작성

**Step 3**: 홈페이지 수정
- 6개 시나리오 카드 클릭 → `/playground/{scenarioId}` 로 이동하도록 변경
- 기존 ScenarioPanel 내부의 NonDevPanel + DevPanel 2열 구조 제거
- 시나리오 선택까지만 홈에서 담당

### Phase 2: Online Seller Playground

**Step 4**: 왼쪽 사이드바
- `components/playground/Sidebar.tsx` 신규
- Online Seller: Classify / Check Restrictions / Calculate Landed Cost
- 시나리오별 엔드포인트 정의 config 파일 (`lib/playground/scenario-endpoints.ts`)

**Step 5**: 가운데 파라미터 영역
- `components/playground/ParamsPanel.tsx` 신규
- API Key 입력란 (로그인 시 자동)
- 선택된 엔드포인트에 맞는 파라미터 폼 동적 렌더
- Required 필드 표시
- [▶ Test Endpoint] 버튼

**Step 6**: 오른쪽 코드/결과 영역
- `components/playground/CodePanel.tsx` 신규
- Code Snippets 탭: cURL / Python / Node.js / Go 코드 자동 생성 (파라미터 값 반영)
- Example Responses 탭: 해당 엔드포인트의 성공/에러 응답 예시
- Results 탭: 실제 실행 결과 (Test Endpoint 후)
- 복사 버튼

**Step 7**: API 엔드포인트 실제 작동 확인
- `POST /api/v1/classify` — 있는지 확인, 작동 테스트
- `POST /api/v1/restrictions` — 없으면 신규 생성
- `POST /api/v1/calculate` — 있는지 확인, 작동 테스트
- Developer workflow의 코드 스니펫을 복사해서 실제 실행했을 때 동일 결과 나오는지 확인

**Step 8**: 통합 검증
- playground에서 Classify 선택 → 파라미터 입력 → Test → Results에 결과 나오는지
- Code Snippets의 cURL 복사 → 터미널에서 실행 → 동일 결과 나오는지
- 비개발자가 봤을 때 이해 가능한지 (파라미터 설명, 결과 형태)

### Phase 3: Dashboard 정리

**Step 9**: Dashboard 메인에서 불필요 링크 숨김
- api-keys, analytics, settings 3개만 보이도록
- 나머지 17개는 메뉴에서 제거 (코드 삭제 X, 진입점만 숨김)

### Phase 4: 정리

**Step 10**: 기존 페이지 정리
- `/features` 페이지 → 헤더에서 제거 (코드는 유지)
- `/developers/docs` → 헤더에서 제거 (playground로 대체)
- `/pricing` → 헤더에서 제거

**Step 11**: 문서 업데이트
- CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md 날짜+내용
- 커밋: `CW34 feat: RapidAPI-style playground — Online Seller complete`

---

## 🚫 절대 금지

1. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 보존
2. **console.log 금지**
3. **빌드 깨진 상태로 push 금지**
4. **기존 API 라우트 삭제 금지** — 숨기기만. 삭제하면 다른 곳에서 참조 깨짐
5. **Dashboard 페이지 코드 삭제 금지** — 진입점만 숨김
6. **모바일 레이아웃 고려 금지** — playground는 데스크탑 only. 모바일은 "데스크탑에서 접속하세요" 안내
7. **Hero/마케팅 작업 금지** — 기능적 완성만. 예쁘게 꾸미기는 나중
8. **한 번에 여러 Step 동시 진행 금지** — Step 1 완료 → 빌드 확인 → Step 2 순차

---

## 🧠 맥락 (IDENTITY.md 요약)

- POTAL = "내 고객의 landed cost / 내 실제 마진" 두 숫자를 제공하는 API 플랫폼
- 3축 (정확 × 빠름 × 투명) = 동시 필수 조건. 하나라도 빠지면 POTAL이 아님
- "압도적" = 우리 기능이 100% 작동하는 것. 경쟁사 대비 아님
- "비개발자" = 코딩 모르는 대표가 이해 후 개발자/AI에게 전달하는 수준
- playground가 이 "비개발자"와 "개발자" 둘 다 만족시키는 하나의 화면
- Forever Free. 유료 플랜 재도입 금지
- 기능적 완성이 먼저, Hero/마케팅은 그 다음

---

## ✅ 완료 기준

- [ ] 헤더: Help + 언어 + 로그인 only (Features/Developers/Pricing/Community 제거)
- [ ] 홈페이지: 6개 시나리오 카드 → `/playground/{scenarioId}` 이동
- [ ] `/playground/seller`: full width, 3단 레이아웃 작동
- [ ] 왼쪽 사이드바: Classify / Check Restrictions / Calculate Landed Cost
- [ ] 가운데: 파라미터 입력 + Test Endpoint 실행 가능
- [ ] 오른쪽: Code Snippets (4개 언어) + Example Responses + Results 탭
- [ ] `POST /api/v1/classify` 실제 작동 + playground에서 테스트 가능
- [ ] `POST /api/v1/restrictions` 실제 작동 + playground에서 테스트 가능
- [ ] `POST /api/v1/calculate` 실제 작동 + playground에서 테스트 가능
- [ ] Code Snippets의 cURL 복사 → 터미널 실행 → 동일 결과
- [ ] Dashboard: api-keys + analytics + settings 3개만 노출
- [ ] `npm run build` green
- [ ] `verify-cw32` 28/28 + `verify-cw33` 23/23 green 유지
- [ ] 세션 문서 4개 업데이트

---

**시작 명령**: `docs/IDENTITY.md` 읽고 → Step 1부터 순차 진행. 각 Step 완료 후 `npm run build` 확인. 한 번에 하나의 Step만.
