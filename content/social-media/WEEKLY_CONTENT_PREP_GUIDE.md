# 일요일 콘텐츠 소재 준비 가이드
> 매주 일요일에 한 주간 콘텐츠에 필요한 모든 재료를 미리 준비해두는 작업 가이드

## 개요

매일 아침 7시에 `daily-content-posting` Scheduled Task가 자동으로 글을 생성한다.
하지만 **재료가 없으면 매일 비슷한 글만 나온다.**
일요일에 한 주간의 재료를 채워놓으면, 월~토 콘텐츠가 풍성하고 다양해진다.

---

## 준비물 체크리스트 (매주 일요일)

### 1. 주간 토픽 플랜 (필수)
**파일**: `content/social-media/weekly-plans/YYYY-WNN_topics.md`
**담당**: Claude (자동 생성) + 은태님 (확인/수정)

이번 주 월~토 6일간 어떤 토픽을 다룰지 미리 정한다.
7가지 카테고리에서 골고루 배분:

| 요일 | 카테고리 | 예시 토픽 |
|------|---------|----------|
| 월 | 기능 딥다이브 | "HS Code 분류가 $0인 이유 — 595 GRI 규칙" |
| 화 | 경쟁 비교 | "Avalara vs POTAL: 31기능 $1,500 vs 140기능 $0" |
| 수 | 사용 사례 | "일본 셀러가 미국에 전자제품 보낼 때" |
| 목 | 개발자용 | "POTAL API로 관세 계산 3줄 코드" |
| 금 | 빌딩 저니 | "보안 감사에서 RLS 90개 테이블 하루 만에 고친 이야기" |
| 토 | 데이터/인사이트 | "240개국 중 관세가 가장 높은 나라 TOP 10" |

**작업 방법**:
1. Claude에게 "이번 주 토픽 플랜 짜줘" 명령
2. Claude가 지난주 포스팅 확인 + 카테고리 로테이션으로 6개 토픽 제안
3. 은태님이 확인/수정 → 확정

---

### 2. 업계 뉴스 & 규제 변화 수집 (필수)
**파일**: `content/social-media/weekly-plans/YYYY-WNN_news.md`
**데이터 소스**: Division 연동 (자동)

이미 세팅된 Division 구조에서 가져오는 것:

| 소스 | Division | 수집 내용 | 방법 |
|------|----------|----------|------|
| D15 Intelligence | 매주 월 경쟁사 스캔 | Avalara/Zonos/Global-e 새 기능, 가격 변동, 뉴스 | `competitor-scan` Cron 결과 확인 |
| D4 Data Pipeline | 정부 API 변화 | De Minimis 폐지 일정, EU €150 면세 변경, 관세율 변동 | `gov-api-health` 결과 + 웹 검색 |
| D1 Tariff Engine | FTA/무역구제 변화 | 새 FTA 발효, 반덤핑 관세 변경 | trade-remedy-sync 결과 |
| Make.com | D12 자동화 | 가입자 트렌드, 웰컴 이메일 반응 | Make.com 대시보드 |
| 웹 검색 | — | cross-border commerce 업계 뉴스 | Claude 웹 검색 |

**작업 방법**:
1. Claude에게 "이번 주 업계 뉴스 수집해줘" 명령
2. D15 경쟁사 스캔 결과 + D4 규제 변화 + 웹 검색 종합
3. 콘텐츠 소재로 쓸 수 있는 뉴스 3~5개 정리
4. 각 뉴스가 POTAL과 어떻게 연결되는지 한 줄 앵글 작성

---

### 3. 기능 딥다이브 소재 (필수)
**파일**: `content/social-media/weekly-plans/YYYY-WNN_feature-angles.md`
**데이터 소스**: `app/features/features-guides.ts` (140개 기능)

이번 주에 다룰 기능의 구체적 앵글을 미리 뽑아둔다.

**작업 방법**:
1. 주간 토픽 플랜에서 기능 딥다이브 토픽 확인
2. `features-guides.ts`에서 해당 기능의 상세 설명, API 예시, curl 명령어 추출
3. 각 기능의 "왜 이게 중요한지" 한 줄 앵글 작성:
   - 경쟁사에 없는 것인가?
   - 얼마나 비용을 절약해주는가?
   - 어떤 고객 페인포인트를 해결하는가?

**예시**:
```
기능: HS Code Classification (F001)
앵글: "경쟁사는 AI로 분류해서 건당 $0.02. POTAL은 595개 규칙으로 $0. 정확도는 더 높음."
API 예시: POST /api/v1/classify {"productName": "Men's cotton t-shirt", "material": "cotton", "category": "apparel", ...}
핵심 숫자: 595 GRI 규칙, 21 Section, 10-field 입력 (Confidence N/10), <50ms
Dashboard: 10-field 입력 + 240국 CountrySelect 드롭다운으로 시연 가능
```

---

### 4. 경쟁사 비교 데이터 (필수)
**파일**: `content/social-media/weekly-plans/YYYY-WNN_competitor-data.md`
**데이터 소스**: D15 + `archive/benchmarks/` + Competitor_Feature_Matrix.xlsx

이번 주 경쟁 비교 포스트에 쓸 구체적 데이터 포인트:

| 경쟁사 | 확인 항목 | 소스 |
|--------|----------|------|
| Avalara | 최신 가격, 기능 수, 새 기능 | D15 스캔 + avalara.com |
| Zonos | 최신 가격, 수수료 구조 | D15 스캔 + zonos.com |
| Global-e | GMV 수수료, 새 파트너십 | D15 스캔 + 뉴스 |
| Easyship | 가격 변동, 기능 업데이트 | D15 스캔 |
| SimplyDuty | 가격, 국가 수 | D15 스캔 |
| DHL | 가격, API 제한 | D15 스캔 |

**작업 방법**:
1. D15 주간 경쟁사 스캔 결과에서 변동 사항 확인
2. 비교 포인트 업데이트 (가격 변동, 새 기능 출시 등)
3. POTAL과의 차이를 숫자로 정리

---

### 5. 비주얼 소재 제작 (필수)
**폴더**: `content/thumbnails/weekly/YYYY-WNN/`
**담당**: 은태님 (Canva/Figma) + Claude (템플릿 제안)

한 주간 필요한 이미지/영상 소재를 일요일에 미리 만들어둔다.

#### 이미지 (매주 4~6장)
| 용도 | 규격 | 설명 |
|------|------|------|
| LinkedIn 캐러셀 | 1080x1350px (PDF) | 6~9 슬라이드. 비교 차트, 숫자 강조 |
| DEV.to 커버 | 1000x420px | 기술적 느낌. 코드+데이터 비주얼 |
| Medium 헤더 | 자유 | 깔끔한 에세이용 |
| 브랜드 채널용 (선택) | 1080x1080px | Instagram/X/디스콰이어트에 올릴 때 필요하면 제작 |

#### 이미지 소재 유형 (반복 사용 가능)
- **가격 비교 바 차트**: POTAL $0 vs 경쟁사 $1,500~$4,000 (홈 화면 차트 스크린샷 활용)
- **기능 수 비교**: 140 vs 31 (파이 차트 or 바 차트)
- **스크린샷**: Dashboard (10-field HS Classification + CountrySelect 드롭다운), Features 페이지, API 응답, HeroCalculator, Tools Hub (34개 도구 카드)
- **코드 스니펫**: curl 명령어, API 응답 JSON (DEV.to/개발자용)
- **국가 지도**: 240개국 커버리지 시각화
- **플로우 차트**: 셀러가 POTAL을 쓰는 과정
- **Tools Hub**: 34개 도구를 카테고리별로 탐색하는 화면 (CW22-S3 신규)

#### 영상 클립 (필요 시)
기능별 녹화 클립을 미리 찍어두고, 브랜드 채널(Instagram/X)에 올릴 때 꺼내 쓰기.
| 용도 | 길이 | 설명 |
|------|------|------|
| 기능 데모 클립 | 30~90초 | Dashboard, API 응답, 기능 시연 |
| 스크린 녹화 | 1~3분 | Cmd+Shift+5로 빠르게 녹화 |

**작업 방법**:
1. Claude가 주간 토픽 기반으로 필요한 이미지 목록 제안
2. 은태님이 Canva에서 제작 (POTAL 브랜드: 깔끔, 여백, 미니멀, 프리미엄)
3. 완성된 이미지를 `content/thumbnails/weekly/YYYY-WNN/`에 저장
4. 데모 영상 스크립트는 `content/demo-scripts/`에 있는 기존 18개 메뉴 스크립트 활용

---

### 6. 셀러 페인포인트 시나리오 (자동)
**파일**: `content/social-media/weekly-plans/YYYY-WNN_scenarios.md`
**데이터 소스**: POTAL MCP (실제 API 호출) + D9 고객 문의 (Gmail MCP) + 커뮤니티 답변 활동
**담당**: Claude 자동 생성

POTAL MCP로 실제 데이터를 뽑아서 구체적 시나리오를 만든다.

**자동 생성 프로세스**:
1. POTAL MCP `classify_product`로 일반적인 상품 5개 분류 (의류, 전자제품, 화장품, 식품, 완구)
2. POTAL MCP `calculate_landed_cost`로 주요 국가 루트별 실제 관세/세금 계산
3. POTAL MCP `check_restrictions`로 규제 확인
4. Gmail MCP로 D9 고객 문의 중 자주 나오는 질문/상황 추출
5. 결과를 시나리오 형식으로 조합

**출력 예시**:
```
시나리오: 한국 의류 셀러 → 미국 수출
- 상품: 면 티셔츠 (95% cotton, 5% elastane)
- HS Code: 6109.10 (POTAL MCP classify_product 결과)
- 관세: 16.5% MFN (POTAL MCP calculate_landed_cost 결과)
- Total Landed Cost: $24.99 → $31.47 (관세+배송+수수료 포함)
- 경쟁사 비용: Avalara $1,500/월 vs POTAL $0
- 앵글: "이 셀러가 Avalara 쓰면 년 $18,000. POTAL 쓰면 $0."
```

---

### 7. 빌딩 저니 에피소드 (자동)
**파일**: `content/social-media/weekly-plans/YYYY-WNN_episodes.md`
**데이터 소스**: session-context.md, CHANGELOG.md
**담당**: Claude 자동 추출

session-context.md와 CHANGELOG.md에 모든 빌딩 히스토리가 기록되어 있다.
Claude가 자동으로 에피소드를 추출하고, 최근에 다루지 않은 것을 선택한다.

**자동 생성 프로세스**:
1. session-context.md의 CW22 세션별 완료 항목 전체 스캔
2. CHANGELOG.md에서 주요 변경 이력 추출
3. 최근 2주간 daily-posts/에서 사용된 에피소드 제외
4. 3~5개 에피소드를 구체적 숫자와 디테일 포함하여 정리

**자동 추출 가능한 에피소드 예시**:
```
- "RLS 90개 테이블을 하루 만에 전부 활성화한 날" (CW22-N)
- "코딩 모르는데 Claude로 140개 기능 만든 첫 달" (프로젝트 시작)
- "Shopify 심사 제출하고 기다리는 중 — 앱스토어의 현실" (CW22-D)
- "경쟁사가 $4,000 받는 걸 왜 $0에 주기로 했는지" (CW22 전략 피벗)
- "MCP 서버 npm에 배포한 날 — 3줄 코드로 AI가 관세를 계산하다" (CW22-D)
- "보안 감사 — Rahul한테 연락받고 90개 테이블 고친 이야기" (CW22-N)
- "Product Hunt 두 번째 런칭을 준비하는 이유" (CW22-O)
- "140개 Features 가이드를 하루 만에 전부 완성한 이야기" (CW22-M)
- "5개 언어로 커뮤니티 답변하는 시스템을 만든 날" (CW22-O)
```

---

## 일요일 작업 순서 (시간 가이드)

| 순서 | 작업 | 예상 시간 | 담당 |
|------|------|----------|------|
| 1 | 주간 토픽 플랜 | 자동 | Claude (sunday-content-prep Task) |
| 2 | 업계 뉴스 수집 | 자동 | Claude (D15+D4+웹 검색) |
| 3 | 기능 딥다이브 소재 | 자동 | Claude (features-guides.ts에서 추출) |
| 4 | 경쟁사 비교 데이터 | 자동 | Claude (D15 스캔 + 웹 검색) |
| 5 | 셀러 시나리오 | 자동 | Claude (POTAL MCP + Gmail MCP) |
| 6 | 빌딩 에피소드 | 자동 | Claude (session-context.md + CHANGELOG.md) |
| 7 | 비주얼 소재 목록 | 자동 | Claude (컨셉+규격 제안) |
| 8 | 브랜드 채널 아이디어 3개 | 자동 | Claude (X/Threads/Instagram/디스콰이어트 포스팅 힌트) |
| 9 | 비주얼 소재 제작 | 30~60분 | 은태님 Canva 작업 (유일한 수동 작업) |

**은태님 실제 작업 시간**: Canva 이미지 제작만 (30분~1시간)
**Claude 자동 작업**: 1~8번 전부 (sunday-content-prep Scheduled Task, 매주 일요일 8AM)

---

## 폴더 구조

```
content/social-media/
├── daily-posts/              ← 매일 자동 생성되는 콘텐츠 (Scheduled Task)
│   ├── 2026-04-07_cat1_hs-code-deepdive.md
│   ├── 2026-04-08_cat2_avalara-comparison.md
│   └── ...
├── weekly-plans/             ← 매주 일요일 준비하는 소재 뱅크
│   ├── 2026-W15_topics.md
│   ├── 2026-W15_news.md
│   ├── 2026-W15_feature-angles.md
│   ├── 2026-W15_competitor-data.md
│   ├── 2026-W15_scenarios.md
│   ├── 2026-W15_episodes.md
│   └── 2026-W15_brand-channel-ideas.md
├── community-prompts/        ← Gemini 커뮤니티 답변 프롬프트 (기존)
├── POTAL_Posting_Guide.xlsx  ← 플랫폼별 가이드 (기존)
├── VIRAL_LAUNCH_POST_DRAFT_v1.md  ← 바이럴 포스트 참조 (기존)
└── WEEKLY_CONTENT_PREP_GUIDE.md   ← 이 파일
```

```
content/thumbnails/
├── weekly/
│   ├── 2026-W15/
│   │   ├── linkedin-carousel-avalara-vs-potal.pdf
│   │   ├── devto-cover-hs-code.png
│   │   ├── medium-header-insight.png
│   │   └── brand-channel-visual.png (선택)
│   └── 2026-W16/
└── (기존 thumbnails)
```

---

## Division 연동 요약

| 일요일 작업 | 연동 Division | 데이터 흐름 |
|------------|--------------|-----------|
| 업계 뉴스 수집 | D15 (Intelligence) | 경쟁사 스캔 결과 → 뉴스 파일 |
| 규제 변화 | D4 (Data Pipeline) + D1 (Tariff) | 정부 API 변화 + FTA/무역구제 → 뉴스 파일 |
| 경쟁사 데이터 | D15 (Intelligence) | Competitor_Feature_Matrix → 비교 데이터 |
| 고객 시나리오 | D9 (Customer) + D16 (Secretary) | 문의 내용 + Gemini 답변 → 시나리오 |
| 기능 소재 | D7 (API) + D3 (HS Classification) | features-guides.ts → 앵글 |
| 가입자 트렌드 | D12 (Marketing) | Make.com 데이터 → 콘텐츠 앵글 |

---

## 자동화 로드맵

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | daily-content-posting Scheduled Task | ✅ 완료 (매일 7AM, 3개 플랫폼) |
| 2 | 일요일 소재 준비 가이드 | ✅ 이 파일 |
| 3 | sunday-content-prep Scheduled Task | ✅ 완료 (일요일 8AM, 소재 7개 + 브랜드 아이디어) |
| 4 | Notion Daily Content Calendar 연동 | ✅ 완료 (자동 기록 + 캘린더/보드 뷰) |
| 5 | 플랫폼 구조 확정 | ✅ 완료 (자동 3개 + 브랜드 4개) |
| 6 | Canva MCP 연동 (이미지 자동 생성) | ⏳ Canva MCP 세팅 후 |
| 7 | Make.com → weekly-plans 자동 데이터 수집 | ⏳ Make 시나리오 추가 |
