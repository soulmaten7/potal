# POTAL Homepage Redesign Spec v1
> 작성일: 2026-04-10 KST (CW22-S7)
> 작성자: Jang Eun (CEO) + Claude (Cowork Opus)
> 상태: 확정 — Phase 1 구현 준비 완료
> 참고: 본 문서는 CW23+ 세션에서 Claude Code가 이 문서 하나만 읽고 바로 구현 착수할 수 있도록 설계됨

---

## 📌 문서 목적

현재 POTAL 홈페이지(`app/page.tsx`)가 주는 **"어렵다, 복잡하다"** 느낌을 해소하고, **"들어오자마자 바로 사용 가능한 도구"** 로 전면 개편하기 위한 설계 문서.

본 문서는 CEO와 Cowork 전략 세션(2026-04-10) 에서 확정된 12가지 결정 사항을 상세 명세로 정리한 것이며, **설계 철학 → 레이아웃 → 각 영역별 상세 명세 → 기술 전제 → 구현 우선순위 → 결정 근거** 순으로 구성된다.

---

## 🎯 설계 철학 (Design Principles)

### 1. 질문 하나로 시작 (One-Question Entry)
홈페이지 방문자에게 **"당신의 수출입 방식은?"** 이라는 단 하나의 질문만 물어본다. 기능 나열, 숫자 자랑, 긴 설명 전부 제거. Stripe / Linear / Vercel 스타일.

### 2. Zero-friction Onboarding
회원가입 → 온보딩 → 첫 사용의 전통적 6단계 여정을 **랜딩 → 유형 선택 → 즉시 사용** 3단계로 압축. 회원가입은 "조합 저장하고 싶을 때"만 자연스럽게 등장.

### 3. Zero-explanation Platform
"우리가 뭘 하는지 설명하는 공간"이 아니라 **"사용자가 바로 작업하는 공간"**. 사용 행위 자체가 설명이 된다. 튜토리얼, 가이드, 긴 Feature 페이지 불필요.

### 4. Conversion이 아닌 Habit
전환율이 아닌 **습관 형성**을 목표로 한다. "HS 코드 필요할 때 → 자동으로 POTAL 열기"가 사용자 루틴이 되면 전환율은 따라온다.

### 5. Trust via Authority Transfer
POTAL의 핵심 자산은 **정부/국제기구 공식 데이터 기반 정확성**. Robert Cialdini의 Authority Principle + Harvard의 Operational Transparency 이론을 UX에 그대로 구현 — 라이브 인디케이터, 업데이트 시각, 기관 풀네임 병기.

### 6. 중립적 계산 인프라 (Not a Marketplace)
POTAL은 관세를 **"계산"** 만 한다. 운송 중개, 배송 예약, 견적 비교는 POTAL의 영역이 아니다. 계산 결과의 연장으로 배송사 "바로가기 링크" 만 제공 → Phase 2 광고 슬롯.

### 7. Desktop-First (No Mobile)
POTAL은 개발자/셀러/수출입 담당자가 **책상 앞에서 진지하게 사용하는 프로 도구**. 모바일은 지원하지 않고, 모바일 접속 시 "데스크톱에서 접속해주세요" 안내 페이지만 제공.

---

## 🏗️ 전체 레이아웃 다이어그램

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                       [ POTAL 로고 크게 가운데 ]                    ║
║                                                                   ║
║  Community  Help                              🌐 EN  Log in        ║
╠═══════════════════════════════════════════════════════════════════╣
║  ● Live · USITC Tariff Database (U.S. ITC)    Updated 14 min ago  ║  ← 티커 1
║  ● Live · EU TARIC (European Commission)      Updated 8 min ago   ║
╠═══════════════════════════════════════════════════════════════════╣
║  ● Live · UK Trade Tariff (HM Revenue)        Updated 23 min ago  ║  ← 티커 2
║  ● Live · OFAC SDN List (U.S. Treasury)       Updated 2 hrs ago   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║                   당신의 수출입 방식은?                             ║
║                                                                   ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐                         ║
║  │ 온라인 셀러│  │ D2C 브랜드 │  │  수입업자 │                         ║
║  │  (Etsy,  │  │   (자체   │  │   (B2B   │                         ║
║  │  Shopify)│  │  쇼핑몰)  │  │ 컨테이너)│                         ║
║  └──────────┘  └──────────┘  └──────────┘                         ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐                         ║
║  │ 수출업자  │  │ 포워더/3PL│  │  CUSTOM  │                         ║
║  │  (견적/   │  │  (소규모  │  │   ⚙️      │                         ║
║  │  계약)   │  │  물류)   │  │  조립형   │                         ║
║  └──────────┘  └──────────┘  └──────────┘                         ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  [선택된 유형에 따라 이 영역이 동적으로 변경됨]                      ║
║                                                                   ║
║  ┌─ 비개발자 영역 ─────────┐ ┌─ 개발자 영역 ─────────────┐          ║
║  │                        │ │                          │          ║
║  │ 📊 인터랙티브 데모       │ │ 💻 조합된 워크플로우 예제   │          ║
║  │                        │ │                          │          ║
║  │ [상품 선택]       [📋]  │ │ curl POST /api/workflow  │          ║
║  │ [국가 선택]       [📋]  │ │   -H "Authorization..."  │          ║
║  │ [계산 결과]       [📋]  │ │   -d '{"hs":"...",}'     │          ║
║  │                        │ │                          │          ║
║  │ → 계정 만들기 (저장용)   │ │ → Python / Node / Go 예제 │          ║
║  │                        │ │ → API 문서 전체 보기       │          ║
║  └────────────────────────┘ └──────────────────────────┘          ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  [CUSTOM 선택 시에만 표시되는 영역 — 다른 5개 시나리오 페이지에     ║
║   는 절대 적용 금지. 아래 섹션 6 "CUSTOM 영역 전용 기능" 참조]     ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  [계산 결과 하단 — Phase 2 광고 슬롯 예약 영역]                     ║
║                                                                   ║
║  ┌─ 이 화물 보낼 수 있는 곳 ──────────┐                              ║
║  │ 🚚 DHL eCommerce       [바로가기→] │                              ║
║  │ 📦 FedEx Priority      [바로가기→] │                              ║
║  │ 🚛 EMS                 [바로가기→] │                              ║
║  │ 🏢 CJ 대한통운          [바로가기→] │                              ║
║  │                                  │                              ║
║  │ Sponsored                        │                              ║
║  └──────────────────────────────────┘                              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

                              [ 푸터 ]
```

---

## 📋 12가지 확정 결정 사항 (상세 명세)

### 결정 1. 헤더 구조 (미니멀 2줄)

**레이아웃**:
- **1줄**: POTAL 로고 (가운데, 큰 크기. 기존 대비 약 1.5~2배)
- **2줄**:
  - 좌측: `Community` | `Help`
  - 우측: `🌐 EN` (언어 드롭다운) | `Log in`

**제거된 메뉴**: `Features`, `Developers`, `Pricing`, `Dashboard`, `Sign up` 버튼 전부 제거.

**"Help" vs "Support" 결정**:
- **Help 채택** — 학습·탐색적 뉘앙스, 긍정적 호기심과 연결
- Support는 사후 대응적 뉘앙스(부정적 감정)로 POTAL의 셀프서비스 중심 철학과 불일치
- Help 하위 구조: FAQ / 가이드 / API 문서 / Contact Support (맨 아래)

**"Sign up" 제거 이유**:
- POTAL은 Forever Free → Sign up과 Log in 구분 불필요
- Log in 버튼 클릭 시 로그인 화면에 "처음이세요? 계정 만들기" 링크 제공
- Linear / Vercel / Notion 스타일

**"Dashboard" 제거 이유**:
- Dashboard는 로그인 후에만 필요 → 비로그인 사용자에게는 의미 없음
- Log in 버튼 → 로그인 → Dashboard 자동 리다이렉트

**언어 드롭다운 (헤더 고정)**:
- 51개 언어 지원 (POTAL `app/i18n/translations/` 기준)
- 브라우저 언어 자동 감지 + 수동 전환 버튼 병행
- 헤더에서 절대 빠지면 안 됨 — 글로벌 크로스보더 사용자가 첫 접속 3초 안에 전환 가능해야 함

**구현 파일**:
- `components/layout/HeaderMinimal.tsx` (신규)
- `components/layout/Header.tsx` (기존) → 유지하되 사용 안 함 (다른 페이지용)

---

### 결정 2. 티커 2줄 (Live Indicator + Authority Transfer)

**목적**: "정부/국제기구 공식 데이터를 실시간으로 가져오는 플랫폼"이라는 신뢰 신호.

**표시 형식**:
```
● Live · {기관 약자} {기관 풀네임} · Updated {상대 시간}
```

**예시**:
- `● Live · USITC Tariff Database (U.S. International Trade Commission) · Updated 14 min ago`
- `● Live · EU TARIC (European Commission) · Updated 8 min ago`
- `● Live · UK Trade Tariff (HM Revenue & Customs) · Updated 23 min ago`
- `● Live · OFAC SDN List (U.S. Department of the Treasury) · Updated 2 hours ago`
- `● Live · Korea KCS (관세청) · Updated 31 min ago`
- `● Live · Japan Customs (日本税関) · Updated 1 hour ago`
- `● Live · Canada CBSA (Canada Border Services Agency) · Updated 45 min ago`
- `● Live · Australia ABF (Australian Border Force) · Updated 1 hour ago`

**심리학 근거**:
1. **Authority Transfer (Cialdini)**: "믿을 만한 출처" 이름이 POTAL의 신뢰로 전이
2. **Expertise Halo Effect**: 이해하지 못하는 전문성이 오히려 신뢰 증폭
3. **Operational Transparency (Buell, HBS)**: 실시간 업데이트 표시는 "뒤에서 뭔가 살아있다"는 증거 → 신뢰 2.3배 상승
4. **Recency Cue**: "14 min ago" 상대 시간은 금융 플랫폼(Bloomberg, Reuters) 기법

**규칙**:
- 약자만 쓰지 말 것 — 반드시 **풀네임 병기**
- ● 초록 점은 CSS 애니메이션(pulse)으로 "살아있는" 느낌
- 실제 업데이트 시각은 `lib/ticker/live-status.ts`에서 관리
- 각 기관당 최소 1시간 1회 이상 자동 갱신 (크론 또는 Supabase Edge Function)

**구현 파일**:
- `components/ticker/LiveTicker.tsx` (신규)
- `lib/ticker/live-status.ts` (신규)
- 기존 티커 파일(있다면) 대체

---

### 결정 3. 5+1 유형 선택 (Scenario Selector)

**목적**: "기능 나열" → "사용자 유형 기반 진입"으로 홈페이지 첫 화면 전환.

**상단 질문**: **"당신의 수출입 방식은?"**

**6개 버튼**:

| # | 버튼 이름 | 부제 | 본질 질문 | 기본 기능 |
|---|----------|------|---------|----------|
| 1 | 온라인 셀러 | Etsy, Shopify, eBay | "내 마진 얼마 남아?" | HS + Landed Cost |
| 2 | D2C 브랜드 | 자체 쇼핑몰 | "어느 나라가 좋아?" | Country Comparison + Landed Cost + FTA |
| 3 | 수입업자 | B2B 컨테이너 | "컨테이너 원가 얼마?" | HS(정밀) + FTA + Landed Cost + Restriction |
| 4 | 수출업자 | 견적/계약 | "고객이 얼마 내?" | Landed Cost + Document + FTA |
| 5 | 포워더/3PL | 소규모 물류 | "고객사 대신 계산" | 전 기능 API 자동화 |
| 6 | **CUSTOM ⚙️** | 조립형 | "내가 직접 조립" | 140개 체크박스 |

**설계 원칙**:
- 기능 이름(Landed Cost Calculator 등) 대신 **사용자 본질 질문** 으로 표현
- 소상공인 입장에서 "Landed Cost"는 어렵지만 "내 마진 얼마 남아?"는 누구나 이해
- 6번째 CUSTOM은 **Escape Hatch** — 5개 유형에 안 맞는 사용자를 위한 탈출구

**엔터프라이즈 처리**:
- 엔터프라이즈는 별도 6번째 카테고리 아님 — 5개 유형의 **대규모 버전**으로 자연 흡수
- 예: Samsung이 Amazon에 파는 것 = "온라인 셀러" 카테고리 + API/Enterprise 통합
- 5개에 안 맞는 엣지 케이스(제조사 공급망, 방산 수출 통제 등)는 Help > Contact Support로 유도

**버튼 클릭 동작**:
- 클릭 시 페이지 이동 없이 아래 "시나리오 상세 영역"이 동적으로 교체됨 (React State)
- URL은 `/?type=seller` 같은 쿼리 파라미터로 관리 (북마크/공유 가능)

**기본값**: `seller` (CW30 hotfix 1, 2026-04-10). 홈에 `?type=` 쿼리 없이 진입하면 seller 박스가 자동 선택되어 POTAL for seller 시나리오 패널이 첫 화면부터 표시된다. URL은 `/` 깨끗 유지 (기본 상태 rewrite 없음).

**구현 파일**:
- `components/home/ScenarioSelector.tsx` (신규)
- `lib/scenarios/scenario-config.ts` (신규) — 6개 유형 정의

---

### 결정 4. 시나리오 페이지 좌우 2분할 (비개발자 / 개발자)

**적용 대상**: 결정 3의 1~5번 시나리오 버튼 (CUSTOM 제외)

**레이아웃**:

```
┌─────── {시나리오명}을 위한 POTAL ───────┐
│                                       │
│  ┌ 비개발자 영역 ───┐ ┌ 개발자 영역 ───┐ │
│  │ (50%)          │ │ (50%)         │ │
│  │                │ │               │ │
│  │ 📊 인터랙티브   │ │ 💻 조합된      │ │
│  │    데모        │ │    워크플로우  │ │
│  │                │ │    예제       │ │
│  │ [상품 선택][📋]│ │               │ │
│  │ [국가 선택][📋]│ │ curl POST...  │ │
│  │ [계산 결과][📋]│ │ Python/Node/Go│ │
│  │                │ │ → API 문서     │ │
│  │ → 계정 만들기   │ │               │ │
│  └────────────────┘ └───────────────┘ │
└───────────────────────────────────────┘
```

**왼쪽 (비개발자 영역, 50%)**:
- 시나리오별 인터랙티브 데모 (실제 계산 가능)
- **각 입력/결과 필드 옆에 `[📋 코드 복사]` 버튼** — 은태님 핵심 아이디어
- 버튼 클릭 시 팝업으로 3가지 옵션 제공:
  1. **🧩 내 쇼핑몰 (Embed 코드)**: `<iframe>` 또는 `<script>` 한 줄
  2. **💻 내 서버/앱 (API 코드)**: Python / Node / cURL
  3. **🔗 링크로 공유 (URL)**: 개발자한테 카톡/이메일로 전달
- 비로그인 사용자도 **데모 실행은 무제한 가능**
- **[📋 코드 복사] 버튼은 로그인 필요** → 클릭 시 "로그인하면 코드 복사가 가능해요" 모달

**오른쪽 (개발자 영역, 50%)**:
- 해당 시나리오의 **조합된 워크플로우 전체 예제** (기능 하나가 아니라 여러 기능 체이닝)
- 예: 온라인 셀러 → `classify() → restriction_check() → landed_cost()` 체인 예제
- cURL / Python / Node / Go 탭 전환
- "API 문서 전체 보기" 링크 → 전체 레퍼런스로 이동
- **코드 복사 버튼은 로그인 필요**

**3층 사용자 구조 해결**:
- **유형 A (순수 비개발자, 20%)**: 왼쪽 데모만 사용, 결과 확인 후 이탈 — 만족
- **유형 B (쇼핑몰 사장님, 60%)**: 왼쪽 [📋] → 3가지 옵션 중 "Embed 코드" 선택 → `<iframe>` 한 줄 복사 → 자기 쇼핑몰에 붙임
- **유형 C (개발자/의사결정자, 20%)**: 오른쪽 개발자 영역에서 조합된 예제 복사 → 자기 서버에 통합

**Self-segmentation 심리 효과**:
- 좌우 동시 노출 → "둘 다 지원한다"는 즉각적 인식
- 주변 시야로 "아 이 플랫폼은 개발자용도 있네"를 무의식 인지
- B2B 구매 결정권자한테 강력한 시그널 — "우리는 비개발자도 개발자도 다 지원"

**구현 파일**:
- `components/home/ScenarioPanel.tsx` (신규)
- `components/home/NonDevPanel.tsx` (신규)
- `components/home/DevPanel.tsx` (신규)
- `components/home/CodeCopyModal.tsx` (신규) — 3가지 옵션 팝업
- `lib/scenarios/workflow-examples.ts` (신규) — 시나리오별 조합 코드

---

### 결정 5+6. CUSTOM 영역 전용 기능 (절대 다른 시나리오에 적용 금지)

> ⚠️ **구현 주의**: 이 섹션 전체는 **CUSTOM 페이지에만 존재**. 5개 시나리오 페이지(온라인 셀러/D2C/수입업자/수출업자/포워더)에는 **절대 적용하지 말 것**. Claude Code가 이 문서 읽을 때 반드시 이 경고를 확인할 것.

#### 5-1. 상단: 조립 인터페이스 (좌우 2분할)

**레이아웃**:
```
┌─────── CUSTOM — 내 업무에 맞게 조립 ───────┐
│                                          │
│  ┌ 기능 선택 ────┐  ┌ 선택한 기능의 코드 ─┐ │
│  │ (50%)        │  │ (50%)              │ │
│  │              │  │                    │ │
│  │ ☑ HS Classifier│ │ // 선택한 기능만    │ │
│  │ ☑ Landed Cost│  │ // 실시간 조립 코드 │ │
│  │ ☐ FTA Lookup │  │                    │ │
│  │ ☑ Restriction│  │ const result =     │ │
│  │ ☐ Denied Pty │  │   await potal      │ │
│  │ ☐ Country C. │  │     .classify(...)│ │
│  │ ☐ Doc Gen    │  │     .then(hs =>    │ │
│  │ ...          │  │       potal.landed()│ │
│  │ (140개 전부) │  │     )              │ │
│  │              │  │                    │ │
│  └──────────────┘  └────────────────────┘ │
│                                          │
│  [이 조합 저장하기] ← 로그인 필요            │
│  ↑ 클릭 시 이름 입력 모달                   │
└──────────────────────────────────────────┘
```

**왼쪽 (기능 선택 영역)**:
- **140개 기능 전부 체크박스로 표시** (숨김/접기 없음)
- 카테고리 헤더로 그룹핑 (관세 계산 / 분류 / 규제 / 문서 / 세금 / 통관 / 기타 등)
- 검색창 상단에 배치 — 140개 중 빠르게 찾기
- 기능명 옆에 작은 ℹ️ 아이콘 → 호버 시 설명 툴팁

**오른쪽 (실시간 코드 조립)**:
- 왼쪽 체크박스 선택/해제할 때마다 **즉시** 오른쪽 코드 업데이트
- 기술: React `useState` + 템플릿 문자열 조합 (드래그 앤 드롭 없음)
- 언어 탭: cURL / Python / Node / Go
- [복사] 버튼 (로그인 필요) + [다운로드 .js / .py] 버튼
- **Direct Manipulation 효과** — 사용자가 "조립 중"이라는 쾌감 (Notion/Retool 스타일)

**구현 난이도**: 드래그 앤 드롭보다 훨씬 낮음. Next.js + React 1~2일 MVP.

**구현 파일**:
- `components/custom/CustomBuilder.tsx` (신규)
- `components/custom/FeatureCheckbox.tsx` (신규)
- `components/custom/LiveCodeAssembler.tsx` (신규)
- `lib/custom/code-templates.ts` (신규) — 140개 기능별 코드 템플릿

#### 5-2. 하단: 내 조합 리스트 (CUSTOM 페이지에만)

**목적**: 사용자가 자주 쓰는 조합을 저장 → 재사용 → 공유 → 바이럴.

**레이아웃** (카드 아닌 1줄 리스트):

```
┌────── 📚 내 조합 (My Saved Combinations) ──────┐
│                                                │
│  🔍 [검색...]      [최근순 ▾]      [+ 새 조합]  │
│                                                │
│  ⭐ Etsy 수출 세팅    3일 전   12번 사용          │
│     HS + Cost + Doc    [공유][복제][삭제][···]   │
│                                                │
│  ⭐ 독일 B2B 검토     1주 전    3번 사용          │
│     FTA + Cost + Comp  [공유][복제][삭제][···]   │
│                                                │
│  ⭐ 미국 대량 수출    2주 전    8번 사용          │
│     HS + Restr + Doc   [공유][복제][삭제][···]   │
│                                                │
│  [+ 더 보기 (32개)]                             │
└────────────────────────────────────────────────┘
```

**필드**:
- ⭐ 즐겨찾기 토글 (클릭 시 상단 고정)
- 조합 이름 (클릭 시 **위쪽 CUSTOM 영역에 즉시 로드**)
- 생성/수정 날짜 (상대 시간)
- 사용 횟수 (게임화 효과)
- 액션 버튼: [공유][복제][삭제][···]
  - 공유: URL 생성 (`potal.com/combos/{combo-id}`) → 클립보드 복사
  - 복제: 같은 조합을 "복사본"으로 새로 만듦
  - 삭제: 확인 모달
  - [···]: 이름 바꾸기 / 내보내기(JSON) / Make 자동화 연결 / 팀 공유

**검색/정렬**:
- 검색창: 조합 이름 + 포함된 기능 이름으로 필터링
- 정렬 옵션: 최근순 / 사용 많은 순 / 이름순 / 즐겨찾기 우선

**Empty State (조합 0개 신규 사용자)**:
- "📚 내 조합" 섹션 대신 **"💡 추천 템플릿"** 을 크게 표시
- POTAL 큐레이션 템플릿: "Etsy 셀러 기본 세트", "독일 수출 스타터", "미국 B2B 대량" 등
- 템플릿 클릭 → 위쪽 CUSTOM에 로드 → "이 조합 저장하기"로 자기 것으로 만듦

**Active State (조합 1개 이상)**:
- "내 조합" 리스트가 주인공
- "추천 템플릿"은 위에 작은 배너로 축소 (1줄 가로 스크롤)

**공유 URL 바이럴 루프**:
- 사용자 A가 조합 저장 → "Etsy 수출 세팅" → 공유 버튼 → `potal.com/combos/etsy-korea-export`
- 사용자 A가 블로그/유튜브에 URL 공유
- 사용자 B가 클릭 → POTAL 방문 → 같은 조합 자동 로드
- 사용자 B가 "이 조합 저장하기" 클릭 → 신규 사용자 획득
- **Figma Community, Notion Templates 성장 모델**

**심리학 근거**:
1. **Endowment Effect (Thaler)**: "내 이름 붙은 조합" → 애착 → Lock-in
2. **Recent Projects 패턴**: Notion/Figma/Retool 재방문 트리거
3. **Gamification**: 사용 횟수 표시 → 자주 쓰게 되는 동기

**구현 파일**:
- `components/custom/MySavedCombos.tsx` (신규)
- `components/custom/ComboListItem.tsx` (신규)
- `components/custom/RecommendedTemplates.tsx` (신규)
- `lib/custom/combo-storage.ts` (신규) — Supabase 연동
- `app/api/combos/route.ts` (신규) — CRUD API
- `app/api/combos/[id]/share/route.ts` (신규) — 공유 URL 생성

**Supabase 스키마**:
```sql
CREATE TABLE user_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selected_features JSONB NOT NULL,  -- ["hs_classifier", "landed_cost", ...]
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  share_slug TEXT UNIQUE,  -- potal.com/combos/{slug}
  is_public BOOLEAN DEFAULT FALSE,  -- 공유 URL 접근 가능 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_combos_user_id ON user_combos(user_id);
CREATE INDEX idx_user_combos_share_slug ON user_combos(share_slug) WHERE share_slug IS NOT NULL;

-- RLS
ALTER TABLE user_combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own combos" ON user_combos
  USING (user_id = auth.uid());
CREATE POLICY "Public combos readable" ON user_combos FOR SELECT
  USING (is_public = TRUE);
```

---

### 결정 7. 로그인 기반 기능 차단 (Rate Limit 폐기)

**원칙**: 데모는 무제한 무료, 가치 있는 기능만 로그인 필요.

**비로그인 상태에서 가능한 것**:
- ✅ 홈페이지 접근, 유형 선택
- ✅ 5개 시나리오 데모 실행 (무제한)
- ✅ CUSTOM 영역의 기능 체크박스 선택 (실시간 코드 조립 결과 볼 수 있음)
- ✅ 개발자 영역의 코드 예제 **보기**
- ✅ 티커, 추천 템플릿 둘러보기

**로그인 필요**:
- 🔒 [📋 코드 복사] 버튼 (Embed / API / Link 3가지 옵션 전부)
- 🔒 CUSTOM 영역의 "이 조합 저장하기"
- 🔒 "내 조합" 리스트 접근
- 🔒 조합 공유 URL 생성
- 🔒 개발자 영역의 코드 복사 버튼
- 🔒 Dashboard

**비로그인 사용자가 차단된 기능 클릭 시**:
- 즉시 모달 팝업: "로그인하면 코드 복사가 가능해요" + [Log in] 버튼
- 강요하지 않음 — 사용자는 계속 데모를 써볼 수 있음

**왜 Rate Limit이 아닌 기능 차단인가**:
- Rate Limit은 "이유 없는 제한" → 불신 유발
- 기능 차단은 "명확한 가치 교환" → 회원가입 전환율 상승
- 심리학: "내 쇼핑몰에 붙이고 싶다"는 의도를 만난 순간에 로그인 요구 → 전환율 극대화
- 구현도 훨씬 쉬움 (프론트에서 `disabled` + 모달)

**구현 파일**:
- `lib/auth/feature-gate.ts` (신규) — `requireLogin()` 훅
- `components/modals/LoginRequiredModal.tsx` (신규)

---

### 결정 8. 데스크톱 전용 (모바일 미지원)

**지원 범위**:

| 화면 크기 | 대응 |
|---|---|
| **1200px 이상** | 풀 데스크톱 레이아웃 (좌우 2분할, CUSTOM, 개발자 영역 전부) |
| **768~1199px** | 데스크톱 레이아웃 유지 (폰트/여백 자동 축소) |
| **767px 이하** | **미지원** — "데스크톱에서 접속해주세요" 안내 페이지만 |

**모바일 접속 시 안내 페이지**:
```
┌─────────────────────────┐
│                         │
│    [POTAL 로고]          │
│                         │
│   POTAL은 데스크톱 전용   │
│   도구입니다             │
│                         │
│   컴퓨터/노트북에서       │
│   접속해주세요            │
│                         │
│  📧 링크 이메일로 보내기   │
│  [이메일]  [보내기]       │
│                         │
└─────────────────────────┘
```

**안내 페이지 기능**:
- 현재 URL을 이메일로 보내기 기능 (SendGrid 또는 Supabase Auth 이메일)
- "나중에 데스크톱에서 열어볼게" 시나리오 대응

**왜 모바일 미지원인가**:
1. **POTAL 직접 사용자는 거의 100% 데스크톱** — 개발자, 셀러 본인, 수출입 담당자
2. **모바일 POTAL 사용자는 "간접 사용자"** — 그들은 POTAL을 임베드한 다른 회사 앱을 씀 → POTAL 홈페이지와 무관
3. **태블릿 사용자도 데스크톱처럼 씀** (iPad + 키보드, Surface Pro) — 별도 태블릿 모드 불필요
4. **개발 공수 30% 절감** — 반응형/터치/모바일 레이아웃 작업 제거
5. **프로 도구 포지셔닝** — Stripe Dashboard, Vercel, Linear 전부 데스크톱 중심

**2층 사용자 구조 (참고)**:
- **1층 (Direct Users)**: POTAL 홈페이지에 직접 접속 → 전부 데스크톱
- **2층 (Indirect Users)**: POTAL API를 임베드한 타사 앱 사용자 (창고 작업자, 영업사원 등) → POTAL 책임 아님
- POTAL은 1층만 책임지고, 2층용 모바일 경험은 API를 쓰는 각 회사가 알아서 구현

**구현 파일**:
- `components/layout/DesktopOnlyGuard.tsx` (신규) — 화면 폭 감지 + 라우팅
- `app/mobile-notice/page.tsx` (신규) — 모바일 안내 페이지

---

### 결정 9. 제거 항목

**헤더에서 제거**:
- ❌ `Features` 메뉴 → CUSTOM 위젯이 대체
- ❌ `Developers` 메뉴 → 각 시나리오 페이지 우측 개발자 영역으로 분산
- ❌ `Pricing` 메뉴 → Forever Free, Enterprise는 Help > Contact
- ❌ `Dashboard` 메뉴 → 로그인 후 자동 리다이렉트
- ❌ `Sign up` 버튼 → Log in 안에 통합

**홈페이지 본문에서 제거**:
- ❌ "140 Features" 숫자 강조 → 사용자 공포 유발
- ❌ 복잡한 10필드 데모 폼 (Processing, Composition 등 어려운 용어)
- ❌ "Built on official data from" 에이전시 로고 배지 (티커로 대체)
- ❌ 기능 나열 섹션 전체

**파일/페이지 처리**:
- `app/features/page.tsx` → 유지하되 헤더 링크 제거 (딥링크 접근만)
- `app/developers/page.tsx` → 유지하되 헤더 링크 제거
- `app/pricing/page.tsx` → 유지하되 헤더 링크 제거
- `app/dashboard/page.tsx` → 유지, 로그인 후 접근

---

### 결정 10. 수익화 제외 (직접 광고 X)

**배제된 것**:
- ❌ 디스플레이 광고 (배너, 사이드바, 팝업)
- ❌ POTAL이 직접 운영하는 운송 견적 중개 (Embedded Quote 모델)
- ❌ POTAL이 직접 관여하는 배송 예약 (Direct Referral 중개)
- ❌ White-label 라이센스 복잡화

**이유**:
1. 광고는 POTAL의 "중립적 정부 데이터 플랫폼" 신뢰를 훼손
2. Enterprise 영업 방해 (법무팀이 광고 플랫폼 승인 거부)
3. UX 오염 — "5개 시나리오 + CUSTOM" 깨끗한 UI 무너짐
4. POTAL의 본질은 **정확한 관세 계산 엔진** → 수익 모델 복잡화 시 본질 흐림

**대체 수익 방향 (결정 12에서 상세)**:
- 배송사 "바로가기 링크 슬롯" 광고 (Phase 2)
- Enterprise Pilot / 교육 / 데이터 리포트 (추후 별도 세션)

---

### 결정 11. CUSTOM 140개 전부 표시 (숨김/접기 없음)

**확정**: 140개 기능 전부 체크박스로 즉시 표시.

**처음 고려했던 안 (기각)**:
- ~~기본값은 7개 핵심만 표시 + "134개 더 보기"~~
- 기각 이유: 체크박스 UI는 원래 **필요한 것만 선택**하는 구조 → 140개 있어도 사용자 부담 없음. 오히려 "7개만 보이고 나머지 숨김"이 불필요한 복잡성.

**UX 설계**:
- 카테고리별 섹션 헤더 (관세 계산 / HS 분류 / FTA / 규제 / 문서 / 세금 / 통관 / 기타)
- 각 섹션 접기/펼치기 가능 (선택 사항)
- 상단에 검색창 — "landed" 입력 → 관련 기능만 필터링
- 기능명 옆 ℹ️ 호버 설명

**140개 기능 소스**:
- `app/features/features-guides.ts` — 기존 기능 가이드 데이터
- `lib/features/feature-catalog.ts` (신규) — 140개 카탈로그 정의

---

### 결정 12. 배송사 링크 슬롯 광고 (Phase 2 예약)

**핵심 철학**: POTAL = **"계산 엔진"**, 배송 = **"실행 파트너"**. 경쟁이 아닌 공생.

**구조**:

```
┌─ 이 화물 보낼 수 있는 곳 ──────┐
│ 🚚 DHL eCommerce   [바로가기→] │  ← 광고비 받고 슬롯 임대
│ 📦 FedEx Priority  [바로가기→] │  ← 광고비 받고 슬롯 임대
│ 🚛 EMS            [바로가기→]  │  ← 광고비 받고 슬롯 임대
│ 🏢 CJ 대한통운     [바로가기→]  │  ← 광고비 받고 슬롯 임대
│                               │
│ Sponsored                     │
└───────────────────────────────┘
```

**운영 원칙**:
1. **바로가기 링크만 제공** — 견적/가격/비교 시스템 X
2. **"Sponsored" 표기 필수** — 투명성, 신뢰 유지
3. **슬롯 임대 방식** — 클릭 당 과금 X, 월정액 (광고주 입장에서 예측 가능)
4. **광고주 한정** — 배송/물류 회사로만 (POTAL 본질과 무관한 광고 거부)
5. **계산 결과의 자연스러운 연장**으로만 노출 — 배너/팝업/사이드바 광고 절대 금지

**Phase 구분**:
- **Phase 1 (CW23~CW30, 홈페이지 리디자인 구현)**:
  - UI 영역만 예약, "Coming Soon" 또는 "Partner slot available" 표시
  - 실제 광고주 모집 X
  - 구조만 미리 잡아두어 나중에 레이아웃 재설계 불필요
- **Phase 2 (트래픽 1만+ 쌓인 이후)**:
  - 배송사 영업 시작 (DHL, FedEx, EMS, CJ대한통운, 쿠팡풀필먼트)
  - "월 X만 원에 슬롯 임대" 표준 계약서
  - Sponsored 표기 + 링크만 제공

**수익 계산 예시**:
- 월 1만 방문자 → 슬롯당 월 10만 원 × 3~4 = **월 30~40만 원**
- 월 10만 방문자 → 슬롯당 월 100만 원 × 3~4 = **월 300~400만 원**
- 월 100만 방문자 → 슬롯당 월 1000만 원 × 3~4 = **월 3000~4000만 원**

**왜 단순 링크 슬롯인가**:
1. **본질 유지** — POTAL은 계산만, 배송 중개 안 함
2. **복잡도 제로** — API 연동/수수료 정산/법적 책임 전부 없음
3. **책임 분리** — 사용자가 DHL 클릭 → DHL 사용자로 전환, POTAL 책임 종료
4. **트래픽 = 가치** — Exit 전략은 트래픽 극대화이지 수익 극대화가 아님
5. **광고주 모집 단순** — 표준 계약서 하나, 영업 속도 10배 빠름

**Exit 전략 관점**:
- 트래픽 자체가 기업 가치의 핵심
- 광고 단가 상승 → 단일 수익원
- 인수합병 타겟 (Flexport, DHL, Maersk, 쿠팡) → 고객 확보 비용 절감
- 데이터 가치 (글로벌 무역 트렌드) → Bloomberg/Reuters/McKinsey 판매

**구현 파일** (Phase 1에서 UI만):
- `components/home/PartnerLinkSlot.tsx` (신규)
- `lib/partners/partner-config.ts` (신규) — Phase 2에서 활성화

**Supabase 스키마** (Phase 2에서 사용):
```sql
CREATE TABLE partner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,  -- "DHL eCommerce"
  partner_logo_url TEXT,
  click_url TEXT NOT NULL,
  contract_start DATE,
  contract_end DATE,
  monthly_fee INTEGER,  -- 광고비 (원)
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  scenario_filter TEXT[],  -- ['seller', 'd2c'] 특정 시나리오만 노출
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 기술 전제 조건

### 전제 1: 로그인 없는 데모 무제한 실행
- 데모 API 엔드포인트는 비로그인 허용
- 차단은 "복사/저장" 기능에서만
- Rate Limit 구현 불필요

### 전제 2: 데모 응답 속도 < 2초
- POTAL 백엔드 최적화 필수
- Supabase 쿼리 인덱스 점검
- Vercel Edge Function + Redis/Upstash 캐시 레이어 검토
- 관세 DB 쿼리가 복잡하면 프리컴퓨트(pre-computed) 테이블 고려

### 전제 3: 51개 언어 자동 감지 + 수동 전환
- 기존 `app/i18n/translations/` 활용
- `accept-language` 헤더 기반 자동 감지
- 쿠키에 사용자 선택 저장

### 전제 4: Supabase RLS 정책
- `user_combos` 테이블에 RLS 필수
- 공유 URL은 `is_public = TRUE`인 경우만 읽기 허용

### 전제 5: Forever Free 유지 (절대 규칙 #9)
- 유료 플랜 재도입 금지
- 로그인 = 추가 기능 해제, 결제 X

---

## 📐 구현 우선순위 (Phase 1 — CW23~CW30)

### Sprint 1 (CW23): 기반
- [ ] `components/layout/HeaderMinimal.tsx` 구현
- [ ] `components/ticker/LiveTicker.tsx` 구현 + `lib/ticker/live-status.ts`
- [ ] `components/home/ScenarioSelector.tsx` 구현 (6개 버튼)
- [ ] `lib/scenarios/scenario-config.ts` 정의
- [ ] `components/layout/DesktopOnlyGuard.tsx` + `app/mobile-notice/page.tsx`

### Sprint 2 (CW24): 시나리오 페이지
- [ ] `components/home/ScenarioPanel.tsx` (좌우 2분할 컨테이너)
- [ ] `components/home/NonDevPanel.tsx` (인터랙티브 데모)
- [ ] `components/home/DevPanel.tsx` (조합된 워크플로우 예제)
- [ ] `components/home/CodeCopyModal.tsx` (Embed/API/Link 3옵션)
- [ ] `lib/scenarios/workflow-examples.ts` 시나리오 5개 예제

### Sprint 3 (CW25): CUSTOM 빌더
- [ ] `components/custom/CustomBuilder.tsx`
- [ ] `components/custom/FeatureCheckbox.tsx` (140개 전체)
- [ ] `components/custom/LiveCodeAssembler.tsx` (실시간 조립)
- [ ] `lib/custom/code-templates.ts` 140개 템플릿
- [ ] `lib/features/feature-catalog.ts` 카탈로그

### Sprint 4 (CW26): 내 조합 + 공유
- [ ] Supabase `user_combos` 테이블 + RLS 마이그레이션
- [ ] `components/custom/MySavedCombos.tsx`
- [ ] `components/custom/ComboListItem.tsx`
- [ ] `components/custom/RecommendedTemplates.tsx`
- [ ] `app/api/combos/route.ts` CRUD
- [ ] `app/api/combos/[id]/share/route.ts` 공유 URL 생성
- [ ] `app/combos/[slug]/page.tsx` 공유 URL 접근 페이지

### Sprint 5 (CW27): 로그인 게이트 + 기능 차단
- [ ] `lib/auth/feature-gate.ts`
- [ ] `components/modals/LoginRequiredModal.tsx`
- [ ] 전체 코드 복사 버튼에 게이트 적용

### Sprint 6 (CW28): Phase 2 슬롯 UI
- [ ] `components/home/PartnerLinkSlot.tsx` (UI만, "Coming Soon")
- [ ] `lib/partners/partner-config.ts` 정의만
- [ ] 계산 결과 하단 레이아웃에 슬롯 영역 예약

### Sprint 7 (CW29): 최적화 + 성능
- [ ] 데모 API 응답 속도 측정 + 2초 이내 최적화
- [ ] Redis/Upstash 캐시 레이어 검토
- [ ] Supabase 쿼리 인덱스 점검
- [ ] 51개 언어 자동 감지 검증

### Sprint 8 (CW30): 검증 + 배포
- [ ] 전체 플로우 E2E 테스트
- [ ] 비로그인 사용자 경로 검증
- [ ] 모바일 안내 페이지 검증
- [ ] 프로덕션 배포

---

## 🧠 결정 근거 (왜 이렇게 설계했는가)

### 왜 "카드"가 아니라 "리스트"인가 (내 조합)
- 카드는 면적 낭비 → 50개 조합 저장 시 스크롤 지옥
- 북마크의 본질은 "빠르게 찾아 클릭"이지 "예쁘게 전시"가 아님
- 검색/필터링이 리스트에서 자연스러움
- Notion, Figma 모두 조합/템플릿을 리스트로 표시

### 왜 "3분할 탭"이 아니라 "좌우 2분할 + 버튼 내부 옵션"인가
- 3분할(Try/Embed/Integrate)은 화면이 좁아짐
- 좌우 2분할 + 각 기능 옆 [📋] 버튼 안에 3옵션 팝업이 훨씬 직관적
- "맥락 안에서의 코드 복사" — 사용자가 기능을 체험한 그 자리에서 바로 복사
- Moment of Intent를 놓치지 않음
- 구현 공수도 1/5

### 왜 "Rate Limit"이 아니라 "기능 차단"인가
- Rate Limit = "이유 없는 제한" → 불신
- 기능 차단 = "명확한 가치 교환" → 가입
- "내 쇼핑몰에 붙이고 싶다"는 의도를 만난 순간 로그인 유도 → 전환율 극대화
- 구현 훨씬 쉬움

### 왜 "모바일 미지원"인가
- POTAL 직접 사용자 100%가 데스크톱 환경
- 모바일 간접 사용자는 POTAL을 인식하지 않음 (타사 앱 사용자)
- 태블릿 사용자도 "데스크톱처럼" 씀
- 프로 도구 포지셔닝 (Stripe Dashboard, Vercel, Linear)
- 개발 공수 30% 절감

### 왜 "수익 모델 복잡화" 대신 "단순 링크 슬롯"인가
- POTAL 본질 = 계산 엔진, 운송 중개 아님
- Embedded Quote/Direct Referral은 API 연동/수수료 정산/법적 책임 폭발
- "트래픽 = 자산" — Exit 전략은 트래픽 극대화
- 단순 링크는 표준 광고 계약서, 영업 속도 10배
- 광고주(DHL/FedEx)가 POTAL의 경쟁사가 아닌 파트너가 됨

### 왜 "140개 전부 표시"인가 (CUSTOM)
- 체크박스 UI는 원래 "필요한 것만 선택"
- 숨기면 오히려 복잡성 추가
- "POTAL은 다 있다"는 강점을 CUSTOM에서 증명
- 파워 유저가 특이 기능 찾기 쉬움 (ECCN, US State Tax 등)

### 왜 "기관 티커"를 제거하지 않고 오히려 강화하는가
- Authority Transfer (Cialdini): 권위 전이
- Expertise Halo Effect: 이해 못 해도 신뢰 증폭
- Operational Transparency (HBS Buell): 라이브 인디케이터 → 신뢰 2.3배
- Bloomberg/Reuters 기법
- 소상공인도 엔터프라이즈도 똑같이 신뢰함

### 왜 "Help"이고 "Support"가 아닌가
- Help = 학습·탐색 (긍정)
- Support = 사후 대응 (부정)
- POTAL은 셀프서비스 중심 현대 SaaS (Stripe, GitHub, Notion 모델)
- AWS, Oracle, SAP 모델(Support)과는 다름

---

## ⚠️ Claude Code 구현 시 반드시 지킬 사항

1. **POTAL 절대 규칙 #9 (Forever Free)** 유지 — 유료 플랜 재도입 금지
2. **절대 규칙 #1 (B2C 코드 수정 금지)** — `lib/search/`, `lib/agent/`, `components/search/` 손대지 말 것
3. **절대 규칙 #2 (npm run build 확인)** — 빌드 깨진 코드 push 금지
4. **절대 규칙 #4 (console.log 금지)** — 프로덕션 코드 금지
5. **"내 조합" 기능은 CUSTOM 페이지에만** — 5개 시나리오 페이지에 적용 금지 (결정 5+6 참조)
6. **코드 복사 버튼은 전부 로그인 게이트** — `lib/auth/feature-gate.ts` 통과 필수
7. **티커는 풀네임 병기** — 약자만 쓰지 말 것
8. **모바일 접속은 `DesktopOnlyGuard`로 차단** — 반응형 시도하지 말 것
9. **140개 기능은 전부 표시** — 숨김/접기 옵션 추가 금지
10. **Phase 2 파트너 슬롯은 UI 자리만 예약** — 실제 광고주 연동 X

---

## 📚 참고 자료

### 심리학/UX 이론
- Robert Cialdini, *Influence* (Authority Principle)
- Richard Thaler, *Nudge* (Endowment Effect)
- Ryan Buell (HBS), *Operational Transparency*
- Daniel Kahneman, *Thinking, Fast and Slow* (System 1/2)

### 벤치마크 SaaS
- **Stripe** — 결제 인프라, 데스크톱 중심, 중립성
- **Linear** — 미니멀 헤더, 프로 도구 포지셔닝
- **Vercel** — 개발자 중심, Forever Free + Enterprise
- **Notion** — 조립형 워크스페이스, Template 공유 바이럴
- **Figma** — Community 템플릿 바이럴 루프
- **Retool** — Direct Manipulation 코드 빌더

### POTAL 내부 참조 파일
- `app/features/features-guides.ts` — 140개 기능 가이드
- `app/i18n/translations/` — 51개 언어
- `lib/cost-engine/` — Landed Cost 계산 엔진
- `lib/classifier/` — HS Classifier
- `session-context.md` — 프로젝트 전체 맥락
- `docs/DIVISION_STATUS.md` — 16개 Division 상태
- `docs/PROJECT_STATUS.md` — 수치 현황
- `archive/benchmarks/POTAL_Ablation_V2.xlsx` — 벤치마크 (HS Code 벤치마크 오류 시 대조 필수)

---

## 🎬 다음 세션 (CW23) 시작 가이드

### CW23 세션 첫 명령
1. 이 문서(`docs/HOMEPAGE_REDESIGN_SPEC.md`)를 **첫 번째로** 읽기
2. `session-context.md` 현재 상태 확인
3. `CLAUDE.md` 절대 규칙 재확인
4. **Sprint 1 (CW23)** 부터 순차 진행

### CW23 우선 작업
- [ ] `components/layout/HeaderMinimal.tsx` 구현
- [ ] `components/ticker/LiveTicker.tsx` 구현
- [ ] `components/home/ScenarioSelector.tsx` 기초 구조
- [ ] 기존 `app/page.tsx`에 신규 컴포넌트 통합 (기존 컴포넌트는 주석 처리하고 유지)

### 검증 체크리스트
- [ ] `npm run build` 성공
- [ ] 신규 컴포넌트에 console.log 없음
- [ ] TypeScript 타입 에러 없음
- [ ] 51개 언어 전환 동작
- [ ] 모바일(767px 이하) 접속 시 안내 페이지 표시

---

## 📝 문서 이력

- **2026-04-10 KST (CW22-S7)**: v1 최초 작성 — CEO 전략 세션 기반 12가지 결정 확정
