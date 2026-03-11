# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-03-11 15:30 KST (Cowork 8 — Layer 2/3 구현 + D14 완료 + 절대 규칙 10번 추가 → Division 15/15)

## 프로젝트 개요
POTAL = B2B Total Landed Cost 인프라 플랫폼. 이커머스 셀러에게 위젯, AI 에이전트에게 API를 제공.

## 반드시 먼저 읽을 파일
1. `session-context.md` — 프로젝트 전체 맥락 (히스토리, TODO, 완료 내역, 인증정보)
2. `.cursorrules` — 코딩 표준, 파일 매핑, 프로덕션 환경

## 📁 폴더 구조 (2026-03-09 정리)
```
portal/
├── [루트 코어] CLAUDE.md, session-context.md, .cursorrules, README.md, 설정파일
│
├── docs/                    # 문서
│   ├── sessions/            # 세션별 리포트 (SESSION_30~37 등)
│   ├── architecture/        # 아키텍처, 설계 문서 (DESIGN_AGR_IMPORT, DESIGN_WDC_HS_MAPPING)
│   ├── CHANGELOG.md         # 개발 변경 이력
│   └── NEXT_SESSION_START.md # 다음 세션 시작 가이드
│
├── analysis/                # 경쟁사/비용/전략 분석
│   ├── Competitor_*.xlsx    # 경쟁사 비교 매트릭스
│   ├── POTAL_Cost_*.xlsx    # 비용/기능 분석
│   └── POTAL-B2B-Strategy-Roadmap.docx
│
├── marketing/               # 마케팅/런칭 자료
│   ├── product-hunt-assets/ # PH 이미지
│   ├── POTAL_Pitch_Deck.pptx
│   └── Facebook_Group_Posts.md
│
├── checklists/              # 체크리스트/TODO
│   ├── POTAL_B2B_Checklist.xlsx  # 마스터 체크리스트
│   └── POTAL_NEXT_CHECKLIST.md
│
├── ai-agents/               # AI 에이전트 설정
│   ├── custom-gpt/          # ChatGPT Actions
│   ├── gemini-gem/          # Google Gemini
│   └── meta-ai/             # Meta AI
│
├── archive/                 # 현재 안쓰지만 보관 (B2C 잔재, 참고용)
│
├── data/                    # 관세 데이터
│   ├── itc_macmap/          # MacMap 실제 관세 데이터 (53개국)
│   ├── tariff-research/     # 국가별 리서치 findings JSON/CSV + 수집 스크립트/메타/원본
│   └── wits_tariffline/     # WITS tariff line 데이터
│
├── scripts/                 # 실행 스크립트
│   ├── docs/                # 스크립트 사용법 문서
│   └── (import_*, download_* 등 실행 파일)
│
├── supabase/migrations/     # DB 마이그레이션 SQL
├── app/                     # Next.js 소스코드
├── components/              # React 컴포넌트
├── plugins/                 # 이커머스 플러그인 (WooCommerce, Magento, BigCommerce)
└── mcp-server/              # MCP 서버
```

## 기술 스택
- Next.js 14+ App Router + TypeScript
- Supabase (Auth + PostgreSQL DB), Paddle (결제, MoR) ← LemonSqueezy에서 전환
- Shopify Theme App Extension (OAuth + GDPR 웹훅)
- 프로덕션: https://www.potal.app

## 핵심 수치 (Cowork 6 기준)
- 240개국/영토, **30개국어** (세션 34: 7→30 확장), 63개 FTA, 12개국 특수세금
- HS Code: 5,371 (WCO HS 2022 6자리)
- MFN 관세율: WITS+WTO 1,027,674건 186개국 + MacMap NTLC 537,894건 53개국
- MIN 관세율: **~113M행 53개국 완료✅** (macmap_min_rates)
- AGR 관세율: **~144M행 53개국 진행중🔄** (macmap_agr_rates, Mac 백그라운드)
- 무역협정: 1,319건 (macmap_trade_agreements)
- 반덤핑/상계관세/세이프가드: 119,706건 (TTBD 36개국 AD + 19개국 CVD + WTO SG)
- 정부 API: USITC, UK Tariff, EU TARIC, Canada CBSA, Australia ABF, Japan Customs, Korea KCS (7개)
- **관세율 자동업데이트**: Vercel Cron 매주 월요일 06:00 UTC (세션 34 설정)
- **WDC 상품 데이터**: ✅ 다운로드 완료 (1,903파일, 외장하드), 상품명→HS 매핑 추출 대기
- **33개 기능**: 전부 ✅ 구현 완료 (DDP Quote, WooCommerce, BigCommerce, Magento 포함)
- **AI Agent Organization v3**: 15개 Division, 3 Layer(Automation/Monitor/Active), 1 Chief Orchestrator, Opus 4+에스컬5
- **47기능 완전정복 전략**: 경쟁사 42기능 비교 (16✅/13⚠️/6🔴), 5단계 로드맵

## 절대 규칙
1. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 등. 보존만
2. **npm run build 확인 후 push** — 빌드 깨진 코드 push 금지
7. **터미널/다운로드 작업은 한 번에 하나만** — 동시에 2개 이상 다운로드/임포트 실행 금지. 병렬 실행 시 프로세스가 죽거나 불안정해짐
8. **추가 작업은 메모리 부담 없는 것만** — 다운로드/임포트 진행 중 할 수 있는 건 문서 수정, 코드 리뷰, 설정 변경 등 가벼운 작업에 한함
3. **session-context.md에 없는 숫자 만들기 금지** — "70% 완료" 같은 근거 없는 수치 사용 금지
4. **console.log 금지** — 프로덕션 코드에 남기지 않기
5. **한 번에 하나의 작업만** — 멀티태스킹 금지
6. **Git push는 Mac 터미널에서** — VM/EC2에서 push 불가
9. **문서 업데이트 시 날짜+시간(KST) 기록 필수** — 예: 2026-03-11 14:30 KST. session-context.md, .cursorrules, CLAUDE.md, CHANGELOG.md, NEXT_SESSION_START.md 헤더에 마지막 업데이트 시간 포함
10. **Cowork 작업도 5개 문서 동기화 필수** — Cowork(은태님+Claude Cowork)에서 진행한 작업도 반드시 동일하게 5개 문서(CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md)에 업데이트해야 함. Cowork 작업은 Claude Code가 모르므로, 은태님이 알려주면 즉시 반영할 것

## Supabase 연결 방법 (세션 32 확인)
- **직접 PostgreSQL**: ❌ 포트 5432 차단 (VM/EC2에서)
- **REST API (PostgREST)**: ✅ CRUD 가능, DDL 불가
- **Pooler**: ❌ 비밀번호 인증 실패 (원인 미확인)
- **Management API**: ✅ SQL 실행 가능 (curl만, urllib은 Cloudflare 차단)
  ```bash
  curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
    -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
    -H "Content-Type: application/json" \
    -d '{"query": "SELECT count(*) FROM macmap_min_rates;"}'
  ```

## Supabase 관세 데이터 테이블 현황
| 테이블 | 행 수 | 상태 |
|--------|-------|------|
| countries | 240 | ✅ |
| vat_gst_rates | 240 | ✅ |
| de_minimis_thresholds | 240 | ✅ |
| customs_fees | 240 | ✅ |
| macmap_trade_agreements | 1,319 | ✅ |
| macmap_ntlc_rates | 537,894 | ✅ (MFN 009) |
| macmap_min_rates | ~113M (53개국) | ✅ 완료 |
| macmap_agr_rates | 진행중/~144M (53개국) | 🔄 Mac 백그라운드 |
| trade_remedy_cases | 10,999 | ✅ (세션 33) |
| trade_remedy_products | 55,259 | ✅ (세션 33) |
| trade_remedy_duties | 37,513 | ✅ (세션 33) |
| safeguard_exemptions | 15,935 | ✅ (세션 33) |

## MIN 임포트 — ✅ 완료
- **~113M행, 53개국 전체 완료** (Cowork 5에서 확인)
- 스크립트: import_min_remaining.py + run_min_loop.sh

## AGR 임포트 (Mac에서 실행 중)
```bash
# 진행 확인
tail -5 ~/portal/agr_import.log
cat ~/portal/agr_import_progress.json
```
- 총 ~144M행, 53개국
- 스크립트: import_agr_all.py + run_agr_loop.sh
- **현재**: 28/53 국가 완료, KOR 진행중 (2026-03-11 기준)
- ⚠️ 완료 전까지 다른 대량 작업 금지

## WDC 다운로드 — ✅ 완료
- 외장하드: /Volumes/soulmaten/POTAL/wdc-products (extracted + raw 폴더, 1,903파일)
- **다음 단계**: AGR 완료 후 → `extract_with_categories.py` 실행 → 상품명→HS 매핑

## 주요 인증 정보
| 항목 | 값 |
|------|-----|
| Supabase Project ID | zyurflkhiregundhisky |
| Supabase DB Password | PotalReview2026! |
| Supabase Secret Key | sb_secret_***REDACTED*** |
| Management API Token | sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a |
| WTO API Key | e6b00ecdb5b34e09aabe15e68ab71d1d |
| Groq API Key | gsk_***REDACTED*** |
| AWS Account | 920263653804 |
| EC2 Instance | i-0c114c6176439b9cb (현재 중지됨) |
| CRON_SECRET | 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297 |
| Vercel API Token | vcp_***REDACTED*** (Full Account, Never expires) |

## ⚠️ 요금제 (세션 28 확정, 세션 37 Annual/Overage 추가 — 반드시 숙지)

**현재 유효한 요금제 (신 — 세션 37 확정):**
| 플랜 | Monthly | Annual (20% off) | 할당량 | 초과 요금 |
|------|---------|-----------------|--------|----------|
| Free | $0 | $0 | 100건/월 | - |
| Basic | $20 | $16/mo ($192/yr) | 2,000건/월 | $0.015/건 |
| Pro | $80 | $64/mo ($768/yr) | 10,000건/월 | $0.012/건 |
| Enterprise | $300 | $240/mo ($2,880/yr) | 50,000건/월 | $0.01/건 |

**Volume Commit**: 100K+/월 → $0.008/건 (Enterprise 협상)

**폐기된 요금제 (구):**
Free 500건 / Starter $9 / Growth $29 / Enterprise custom → 세션 28에서 전면 폐기

**결제 시스템**: ✅ Paddle (MoR 모델, 5%+$0.50/transaction). **Live 전환 완료** — Live API Key + 6개 Live Price + Webhook + Vercel 배포
**코드 잔존**: ✅ 완전 정리됨 (lemonsqueezy.ts 삭제, Capacitor stub, i18n 6개 언어 키 교체, 구 요금제 6개 파일 정리 완료)
**Overage 빌링**: ✅ 구현 완료 — plan-checker(유료 overage 허용) + middleware(X-Plan-Overage 헤더) + overage.ts(Paddle charge) + billing-overage cron(매월 1일)

## 은태님 스타일 (코딩 초보자)
- 기술 설명은 간결하게, 작업은 직접 해줘야 함
- 정확성 최우선, 추정치보다 실제 데이터
- "빠르게 확인 → 다음 작업" 루프 선호
- 한국어 소통, 코드/기술 용어는 영어 그대로
- 과장 표현 싫어함

---

## 🧠 Chief Orchestrator — AI Agent 운영 체계 (Cowork 7 확정)

### 역할 정의
**너(Claude Code)는 POTAL의 Chief Orchestrator다.**
은태님 = CEO. 너 = COO/Chief of Staff.
은태님에게 보고하고, 판단을 받고, 15개 Division에 실행을 배분한다.

### 운영 원칙
1. **은태님은 판단만 한다** — 실행은 네가 알아서 Division에 배분
2. **Morning Brief로 시작** — 매 세션 시작 시 15개 Division 상태 요약 보고
3. **Green은 보고 안 함** — 🟡 Yellow / 🔴 Red만 보고 (은태님 시간 절약)
4. **한 번에 하나의 작업만** — 멀티태스킹 금지 (절대 규칙)
5. **추정 금지** — session-context.md에 없는 수치 만들지 않기

### Morning Brief 포맷 (매 세션 시작)
```
🧠 Morning Brief — [날짜]
━━━━━━━━━━━━━━━━━━━━━
🟢 정상: [N]개 Division
🟡 주의: D[X] — [이유] / D[Y] — [이유]
🔴 긴급: (없으면 생략)

📋 추천 작업: D[X] [프로젝트명] — [이유]
━━━━━━━━━━━━━━━━━━━━━
```

### 15개 Division (책임 영역)
| # | Division | 담당 범위 | 핵심 파일 |
|---|----------|----------|----------|
| D1 | Tariff & Trade Rules | MFN/MIN/AGR 관세율, 63 FTA, RoO, 무역구제 119K건, 제재 스크리닝, 제한물품, 통관서류 | lookup_duty_rate_v2(), tariff-api/ |
| D2 | Tax Engine | VAT/GST 240개국, de minimis, IOSS, DST, 12개국 특수세금, processing fee | GlobalCostEngine.ts, CostEngine.ts |
| D3 | HS Classification | 3단계 AI 분류(WDC→벡터→LLM), 캐시 플라이휠, 이미지 분류, 원산지 감지 | ai-classifier/ |
| D4 | Data Pipeline | 7개국 정부 API, MacMap/WITS 임포트, WDC 추출, 환율(소유), 240개국 DB | exchange-rate/, scripts/ |
| D5 | Product & Web | potal.app 전체: 랜딩, 가격표, 대시보드, 로그인/가입, i18n 30개국어 UI, CWV | app/, components/, DashboardContent.tsx |
| D6 | Platform & Plugins | Shopify TEA, WooCommerce, BigCommerce, Magento, JS 위젯, DDP Quote | extensions/, plugins/, potal-widget.js |
| D7 | API & Developer | 7개 엔드포인트, OpenAPI, SDK 3종, rate limiting, AI 플랫폼(GPT/MCP/Gem) | tariff-api/, api-auth/, mcp-server/ |
| D8 | QA & Accuracy | 계산 정확도 검증, API 응답 검증, 회귀 테스트, 엣지 케이스, Spot Check | __tests__/, 448건 테스트 |
| D9 | Customer Success | 고객 지원, AI 챗봇, 온보딩, FAQ, 지식베이스, 이탈 방지 | (구축 예정 다수) |
| D10 | Revenue & Billing | Paddle 6 Price, 구독 관리, overage 빌링, MRR/ARR/Churn | paddle.ts, plan-checker.ts, webhook/ |
| D11 | Infrastructure & Security | Vercel 배포, Supabase PostgreSQL, RLS, 모니터링, 보안, Auth 백엔드 | middleware.ts, supabase/ |
| D12 | Marketing & Growth | Content/SEO, 소셜 미디어, 이메일 캠페인, 파트너십, Product Hunt | marketing/ |
| D13 | Legal & Compliance | ToS, Privacy Policy, GDPR/CCPA, Enterprise 계약, 오픈소스 라이선스 | legal/[slug]/page.tsx |
| D14 | Finance | 비용 추적(Vercel $20/Supabase $25), 예산, 세무, 투자자 관계, 보조금 | analysis/ |
| D15 | Intelligence | 경쟁사 10사 모니터링, 무역법 변경, 시장 분석, 47기능 비교 | Competitor_Feature_Matrix.xlsx |

### 3 Layer 실행 모델 (모든 Division 공통)
| Layer | 이름 | 실행 | 비용 |
|-------|------|------|------|
| Layer 1 | Automation | Vercel Cron, Paddle Webhook, Make.com, 앱 내장 로직 | 토큰 $0 |
| Layer 2 | Monitor | ✅ Morning Brief API + Division Checklists + Status Dashboard | 최소 토큰 |
| Layer 3 | Active | ✅ 15개 Division Agent Team 역할 카드 정의 (agent-roles.ts) | 작업 시만 |

### Opus 사용 맵 (최소화)
- **상시 4곳**: Chief Orchestrator(크로스 Division) · D1 FTA/RoO 법률 해석 · D3 HS 모델 아키텍처 · D13 법률 문서
- **에스컬레이션 5곳**: D1 제재 분석 · D8 정확도 이상 · D11 보안 취약점 · D14 전략 분석 · D15 경쟁 대응
- 나머지 전부 Sonnet (v1 Opus 11개 → v3 Opus 4+에스컬5 = 70%+ 절약)

### Escalation Flow
Layer 1 자동실행 → 🟡 Layer 2 팀장 체크 → 🟣 Layer 3 Agent Teams → 🧠 Chief → 👤 은태님
- 🟢 95% 자동 처리 (보고 안 함)
- 🟡 4% Sonnet→Opus 에스컬레이션 (Morning Brief에 포함)
- 🔴 1% 즉시 알림 (은태님 판단)

### 일일 운영 사이클
| Phase | 시점 | 내용 | 실행 주체 |
|-------|------|------|----------|
| Phase 0 | 새벽 (자동) | Layer 1: 환율, 관세 업데이트, webhook, health check | Vercel Cron 등 |
| Phase 1 | 아침 5분 | Morning Brief — Yellow/Red만 보고, 은태님 판단 | Chief → 은태님 |
| Phase 2 | 오전 | Agent Teams 세션 A — Division 선택 후 프로젝트 실행 | 은태님 지시 → Chief 배분 |
| Phase 3 | 오후 | 로테이션 or 심화 — 다른 Division or 계속 | 은태님 판단 |
| Phase 4 | 마감 10분 | git push, session-context 업데이트, 야간 체크 세팅 | 은태님 + Chief |

### 주간/월간
- **매주 월**: D4 관세율 업데이트(Cron) · D14 KPI 리뷰 · D15 경쟁사 스캔 · D9 고객 피드백 · D13 규정 체크
- **매월 1일**: D10 Overage 정산 · D14 로드맵 진행률 · D8 월간 정확도 · D11 인프라 비용 · Chief 전체 평가

### Division 세팅 현황 (Layer 1 자동화 기준)
| Division | Layer 1 상태 | 비고 |
|----------|-------------|------|
| D1 | ✅ 완료 | Vercel Cron 관세 동기화 ✅ + trade-remedy-sync 매주 월 06:30 ✅ (6테이블 행수 검증) |
| D2 | ✅ 완료 | 앱 내장 로직 (GlobalCostEngine) 자동 실행 |
| D3 | ✅ 완료 | 앱 내장 로직 (ai-classifier) 자동 실행 |
| D4 | ✅ 완료 | 환율 Cron ✅ + gov-api-health 매12시간 ✅ (7개국 정부 API 가용성 체크) |
| D5 | ✅ 완료 | Vercel 자동 배포 ✅ + uptime-check 매6시간 ✅ (6개 핵심 페이지/API) |
| D6 | ✅ 완료 | Shopify Webhook ✅ + plugin-health 매12시간 ✅ (위젯/웹훅 엔드포인트 체크) |
| D7 | ✅ 완료 | plan-checker, rate-limiter 앱 내장 |
| D8 | ✅ 완료 | CI 테스트 ✅ + spot-check 매일 04:00 ✅ (8개 계산 케이스 자동 검증) |
| D9 | ✅ 완료 | FAQ 13개 항목 ✅ + Google Rich Snippets ✅ + Crisp 채팅 위젯 준비 ✅ (env: NEXT_PUBLIC_CRISP_WEBSITE_ID) |
| D10 | ✅ 완료 | Paddle Webhook + Overage Cron + plan-checker |
| D11 | ✅ 완료 | Vercel CI/CD ✅ + health-check 매6시간 ✅ (DB/API/Auth/데이터 모니터링) |
| D12 | ✅ 완료 | Make.com Welcome Email + LinkedIn 소셜공유 시나리오 ✅ |
| D13 | ✅ 완료 | Google Calendar 법률 리뷰 3개 반복일정 ✅ |
| D14 | ✅ 완료 | POTAL_D14_Finance_Tracker.xlsx (Monthly Costs + Revenue + Division Log 3시트) ✅ |
| D15 | ✅ 완료 | competitor-scan 매주 월 08:00 ✅ (10개 경쟁사 사이트/가격 페이지 모니터링) |

### Layer 2 Monitor 구현 (Cowork 8)
- **Morning Brief API**: `/api/v1/admin/morning-brief` — health_check_logs에서 15개 Division 상태 Green/Yellow/Red 요약
- **Division Checklists**: `app/lib/monitoring/division-checklists.ts` — 15개 Division 각각 체크 항목 정의 (5개 source 타입)
- **Division Status Dashboard**: `/admin/division-status` — 관리자 전용 15개 Division 현황 페이지 (CRON_SECRET 인증)

### Layer 3 Active 구조 정의 (Cowork 8)
- **Agent Roles**: `app/lib/monitoring/agent-roles.ts` — 15개 Division Agent Team 역할 카드
- Division별 구성: 팀장(Sonnet 1명) + 멤버(2~3명) + 에스컬레이션 조건
- Opus 상시: D1(FTA/RoO), D3(ML Architect), D13(Legal Analyst) — 3개 Division
- Opus 에스컬레이션: D1(제재), D8(정확도), D11(보안), D14(전략), D15(경쟁) — 5개 Division
- 전체: 15 팀장 + 32 멤버 = 47 Agent (Opus 4 + Sonnet 43)

### 확장 패턴
Division 신설 → Sonnet 팀장 배치 → Layer 1 (자동화) → Layer 2 (체크 항목) → Layer 3 (역할 카드)
축소: 팀장 해제 → Automation만 유지 or 다른 Division에 흡수

### 참조 문서
- 전체 조직도 시각화: `POTAL_AI_Agent_Org.html` (v3, 15 Division, 3 Layer)
- 세션 히스토리: `session-context.md`
- 코딩 표준/파일 매핑: `.cursorrules`
