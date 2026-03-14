# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-03-14 05:00 KST (CW13 — AI Agent Org v4 업데이트, WDC 2단계 38카테고리 추가 1,055매핑/1,104벡터, 24/7 Division Monitor 구현)

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

## 핵심 수치 (CW13 기준)
- 240개국/영토, **50개국어** (세션 34: 7→30, CW9: 30→50 확장), 63개 FTA, 12개국 특수세금
- HS Code: 5,371 (WCO HS 2022 6자리)
- **HS Code 매핑**: product_hs_mappings **1,055건** (CW13: 1,017→1,055, WDC 2단계 +38카테고리)
- **HS 분류 벡터**: hs_classification_vectors **1,104건** (CW13: 1,023→1,104)
- MFN 관세율: WITS+WTO 1,027,674건 186개국 + MacMap NTLC 537,894건 53개국
- MIN 관세율: **~113M행 53개국 완료✅** (macmap_min_rates)
- AGR 관세율: **~144M행 53개국 완료✅** (macmap_agr_rates, KOR 재임포트 완료 1,815,798행)
- 무역협정: 1,319건 (macmap_trade_agreements)
- 반덤핑/상계관세/세이프가드: 119,706건 (TTBD 36개국 AD + 19개국 CVD + WTO SG)
- **제재 스크리닝**: 21,301건 (OFAC SDN 14,600 + CSL 6,701, 19개 소스) ✅
- 정부 API: USITC, UK Tariff, EU TARIC, Canada CBSA, Australia ABF, Japan Customs, Korea KCS (7개)
- **7개국 HS 벌크 다운로드**: ✅ 완료 (gov_tariff_schedules 89,842행: US 28,718 + EU 17,278 + UK 17,289 + KR 6,646 + CA 6,626 + AU 6,652 + JP 6,633)
- **관세율 자동업데이트**: Vercel Cron 12개 (CW13: division-monitor 매30분 추가)
- **D15 Intelligence Dashboard**: `/admin/intelligence` (경쟁사 10사 스캔 이력+변동 감지)
- **MCP Server**: v1.2.0, 7개 도구 (calculate, classify, restrictions, screen_shipment, screen_denied_party, lookup_fta, list_countries)
- **WDC 상품 데이터**: ✅ 다운로드 완료 + 추출 진행중🔄 (~1,807/1,899파트, extract_with_categories.py)
- **WDC 카테고리→HS6 1단계**: ✅ 완료 (10M JSONL → 145 고유 카테고리 → 147 HS6 매핑, 비용 ~$0.01)
- **WDC 2단계**: ✅ 완료 (377M 상품 → 38 신규 카테고리 → 1,729,533 상품 커버, product_hs_mappings 1,055건, 벡터 1,104건)
- **Google Taxonomy HS 매핑**: 164건 product_hs_mappings 로딩 ✅
- **142/147 기능 전부 구현 완료** ✅ (CW12 후반): MUST 102개 + SHOULD 40개 = **142개 구현**, WON'T 5개만 제외 = **96.6% 커버리지**
- **심층 검증 84/84 PASS** ✅ (CW12 후반 02:30 KST): 81 확실 + 3 수정후확실(DB 테이블 생성), 코드 변경 0건, DB 테이블 5개 추가(marketplace_connections, erp_connections, tax_exemption_certificates, partner_accounts, partner_referrals)
- **44개 MUST 신규 구현 (CW12 후반, ~45분)**: Sprint 1(F006 신뢰도·F109 CSV·F008 감사), Sprint 2(F015 가격분기·F092 샌드박스·F009 배치·F095 고처리량), Sprint 3(F012 HS검증·F033 IOSS·F043 통관서류·F040 수출전검증) + P1 15개(URL분류·RoO·원산지예측·RAG·AI상담·White-label·ICS2·Type86·수출통제·ECCN·위험물 등) + P2 17개(US세금·Telecom/Lodging·수출면허·VAT등록·e-Invoice·마켓플레이스·ERP·AEO 등)
- **새 API 엔드포인트 6개+**: /export, /classify/audit, /classify/batch, /validate, /ioss, /verify 외 다수
- **DB 마이그레이션 2개+**: 023_classification_audit.sql, 024_price_break_rules.sql 외 다수
- **경쟁사 대비 HS Code 매핑**: Avalara 40M+ → **POTAL 500M+** (WDC 5억+ 상품명 사전 매핑 전략 확정)
- **SHOULD 40개 기능 구현 완료** ✅ (CW12 후반, ~10분): 회계연동(QuickBooks/Xero), 파트너에코시스템(1400+), 배송분석, 무역데이터인텔리전스, 브랜딩추적, MoR, 사기방지, 주문동기화, 재고/3PL/멀티허브, 교육프로그램, 마켓플레이스노출 등
- **사조(SAZO) 분석**: 23살 유학생 창업 AI 크로스보더 커머스 스타트업(75억 투자) → 경쟁사 아님, **잠재 고객** (B2C 플랫폼 = POTAL 인프라 소비자)
- **경쟁사 기능 분석 (Cowork 12)**: 10개 경쟁사 147개 기능 중복제거 분석 → **MUST 102개 + SHOULD 40개 = 142개 전부 구현** ✅ / WON'T 5개만 제외
- **240개국 규정 RAG (Cowork 12)**: 전 세계 관세법/세법/무역규정 벡터 DB화 → "240개국 관세사/세무사 AI" 전략 확정
- **규정 데이터 수집**: 🔄 진행중 (Claude Code 터미널 2, Phase 1→2→3, 외장하드 /Volumes/soulmaten/POTAL/regulations/)
- **데이터 유지보수 자동화 설계 (Cowork 12)**: 정부 공고 페이지 해시 비교(Vercel Cron) + Make.com AI 변경 해석 + 자동 DB 업데이트

### ⭐ HS Code 100% 정확도 구조 (Cowork 11 설계 — 2026-03-12)
**전체 파이프라인:**
1. 상품명 → 카테고리 매핑 → HS 6자리 확정 (DB 캐시, $0)
2. HS 6자리 → 7개국 10자리 후보 (DB, $0 — 정부 스케줄 벌크 다운로드)
3. 후보 + 상품명 + 가격 → 최종 10자리 선택 (사전 매핑 or AI 매칭)
4. 가격 분기 규칙 ("valued over/under $X") → if문 처리 (코드, $0)
5. 결과 DB 저장 → 이후 동일 상품 DB 조회만 ($0, 수십ms)

**정확도 100% 달성 근거:**
- 6자리: 카테고리 기반 = 확정값 (매핑 테이블)
- 10자리 후보: 정부 공식 데이터 = 확정값
- 최종 선택: 상품명 + 가격 규칙 = 확정값 (5~10개 후보 중 선택)
- 가격 분기: API에 price 필드 포함 = 자동 분기
- 7개국 외 233개국: HS 6자리 기준 MFN/MIN/AGR 세율 적용 (이미 DB에 있음)

**5억 상품명 사전 매핑:**
- WDC 전체 상품명에 HS Code 사전 부여 → 룩업 테이블
- 고객 요청 시 DB 조회 1회로 끝 (AI 호출 zero, 외부 API zero)
- 플라이휠: 새 상품 → LLM 1회 → DB 저장 → 이후 $0

### ⭐ 147개 경쟁사 기능 분석 & 96.6% 커버리지 (Cowork 12 — 2026-03-13)
**분석 방법**: 10개 경쟁사(Avalara, Global-e, Zonos, Easyship, DHL, SimplyDuty, Dutify, Hurricane, TaxJar, Passport) 전체 기능 중복 제거 → 147개 고유 기능 도출

**최종 판정 (5개 솔루션 적용 후):**
- **MUST**: 102개 — **전부 구현 완료** ✅ (기존 58 + CW12 후반 44개 구현)
- **SHOULD**: 40개
- **WON'T**: 5개 (F005 인간전문가검증, F076 국제방문자인사, F077 장바구니이탈방지, F108 Power BI, F139 700+전문가네트워크)
- **커버리지**: 142/147 = **96.6%**

**5개 솔루션 전략 (WON'T 60개→5개 축소):**
1. **240개국 규정 RAG**: 관세법/세법 벡터 DB화 → 규정 기반 기능 자동 커버
2. **중소 물류사 파트너십**: POTAL(엔진) + 물류파트너(배송) = 물류 기능 커버
3. **100% 정확도 증명 → MoR 불필요**: 정확도 완벽 → 고객 직접 수입
4. **결제 인프라 활용**: Stripe/Paddle이 사기방지/환불 처리
5. **AEO 고객지원 서비스**: 인증 대행 아닌 서류/절차 안내 도구

**타겟 거래처 3그룹:**
- **A그룹 (즉시)**: Shopify 41K+, WooCommerce, Royal Mail, Australia Post, Canada Post
- **B그룹 (RAG 후)**: eBay, Etsy, 중형 물류사
- **C그룹 (풀 파트너십)**: DHL, Walmart, Toyota/Samsung

**핵심 인사이트:**
- "결과가 정해져 있는 시장" = 관세사/세무사 지식 전부 디지털화 가능
- 범용 HS Code 계산기 완성 (산업부품 볼트/반도체도 분류 가능)
- POTAL(엔진) + 물류(배송) + 결제(사기/환불) = 경쟁사 전체 커버

**엑셀**: analysis/POTAL_Final_Feature_Analysis_v2.xlsx (최종본, 102/40/5)

### ⭐ 240개국 규정 RAG 전략 (Cowork 12 — 2026-03-13)
**목표**: 전 세계 240개국 관세법/세법/수출입규정/분류결정문/무역협정 원문 → 벡터 DB(RAG) → "240개국 관세사/세무사 AI"

**수집 3단계:**
- **Phase 1**: 7개국 정부 (US, EU, UK, CA, AU, JP, KR) — 관세율표, 분류결정문, 관세법, FTA
- **Phase 2**: 국제기구 (WTO, WITS, MacMap, WCO, OECD)
- **Phase 3**: 지역 (ASEAN/GCC/AfCFTA/Mercosur/CPTPP/RCEP) + 나머지 국가
- **저장**: 외장하드 /Volumes/soulmaten/POTAL/regulations/
- **명령어**: REGULATION_DATA_COLLECTION_COMMAND.md
- **상태**: 🔄 Claude Code 터미널 2에서 수집 진행중

### ⭐ 데이터 유지보수 자동화 설계 (Cowork 12 — 2026-03-13)
**원리**: 정부 규정 변경은 공고 페이지로 사전 공지 (WTO TBT 60일 전 통보). "변경 피드 구독" 방식.

**3단계:**
1. **공고 페이지 특정 (1회)**: 240개국별 관세 변경 공고 URL 확정 (수집 시 함께 기록)
2. **Vercel Cron 매일**: 페이지 해시 비교 → 변경 시 Make.com webhook
3. **Make.com + AI**: diff → "세율변경/새규정/UI변경" 분류 → 세율은 자동 DB 업데이트, 규정은 RAG 추가, UI는 skip

**예외**: URL 자체 변경 시 이메일 알림 (연 1~2회). **비용**: 일일 ~$0

- **AI Agent Organization v4**: 15개 Division, 3 Layer(Automation/Monitor/Active), 1 Chief Orchestrator, Opus 4+에스컬6, 24/7 Division Monitor(매30분), Telegram 알림
- **Chief Orchestrator 정식 운영**: CW9.5 사이클 1~3 → Cycle 4(야간) → Cycle 5(D15+AI플랫폼) → Cycle 6(Morning Brief 강화). 15/15 Division 전체 Green
- **Phase 1 자동화**: Morning Brief 매일 아침 9시 KST 자동 스케줄 (Cowork Scheduled Task) + Layer 1/2/3 분류 + 자동 수정(auto-remediation) + contact@potal.app 이메일 알림 (Resend API, morning-brief-email.ts, ✅ Vercel 환경변수 세팅 완료)
- **Morning Briefing 스킬**: Cowork "모닝브리핑" 명령어 → Gmail 확인 + 프로젝트 상태 + 추천 작업 한번에 보고
- **자동 수정 시스템 (CW10)**: issue-classifier.ts(Layer 분류) + auto-remediation.ts(Layer 1-2 자동 수정) + Morning Brief 강화(3섹션 응답: auto_resolved/needs_attention/all_green)
- **P0 인프라 3개**: #11 벡터DB+3단계분류파이프라인(pgvector), #13 HS10자리확장(정부API 3개국), #15 분류DB규모(product_hs_mappings+pg_trgm)
- **관세최적화 (#1)**: lookupAllDutyRates() — MIN/AGR/NTLC 3테이블 병렬 조회, 최저 세율 자동 선택, tariffOptimization 응답 필드 (savings 포함)
- **Vector DB 시딩**: hs_classification_vectors **1,104건** (CW13: 1,023→1,104). 파이프라인 정확도 55%→100%

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
| macmap_agr_rates | ~144M (53개국) | ✅ 완료 (KOR 재임포트 완료) |
| trade_remedy_cases | 10,999 | ✅ (세션 33) |
| trade_remedy_products | 55,259 | ✅ (세션 33) |
| trade_remedy_duties | 37,513 | ✅ (세션 33) |
| safeguard_exemptions | 15,935 | ✅ (세션 33) |
| hs_classification_vectors | 1,104 | ✅ (CW13: 1,023→1,104, pgvector ivfflat) |
| hs_expansion_rules | - | ✅ (CW9, HS10 캐시) |
| product_hs_mappings | 1,055 | ✅ (CW13: 1,017→1,055, WDC 2단계 +38) |
| gov_tariff_schedules | 89,842 | ✅ (7개국: US 28,718 + EU 17,278 + UK 17,289 + KR/CA/AU/JP ~6,600 each) |
| marketplace_connections | - | ✅ (CW12 심층검증: F082) |
| erp_connections | - | ✅ (CW12 심층검증: F083) |
| tax_exemption_certificates | - | ✅ (CW12 심층검증: F053) |
| partner_accounts | - | ✅ (CW12 심층검증: F147) |
| partner_referrals | - | ✅ (CW12 심층검증: F147) |

## MIN 임포트 — ✅ 완료
- **~113M행, 53개국 전체 완료** (Cowork 5에서 확인)
- 스크립트: import_min_remaining.py + run_min_loop.sh

## AGR 임포트 — ✅ 완료
- **~144M행, 53개국 전체 완료** (2026-03-12 확인)
- 스크립트: import_agr_all.py + run_agr_loop.sh
- **KOR 재임포트 완료** (2026-03-13, 1,815,798행 삽입, import_agr_all.py 타임아웃 핸들링 추가)

## WDC 다운로드 — ✅ 완료 + 카테고리 매핑 1단계 완료
- 외장하드: /Volumes/soulmaten/POTAL/wdc-products (extracted + raw 폴더, 1,903파일)
- **WDC 추출**: Mac에서 `extract_with_categories.py` 실행 중 (~1,029/1,899 파트)
- **1단계 완료 (Cowork 11)**: 10M JSONL → 145 고유 카테고리 → 147 HS6 매핑
  - product_hs_mappings: 164 → 1,017 (+853)
  - hs_classification_vectors: 170 → 1,023 (+853)
  - 키워드 정확도 84% + LLM 폴백 14% = 98%, 비용 ~$0.01
- **2단계 (대기)**: 상품명 세분화 — 카테고리 참조해서 빠르게 매칭, 미매칭만 벡터/LLM
- **최종 목표**: 5억+ 상품명 전부 HS Code 사전 매핑 → 룩업 테이블 완성

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
- **본질(정확도) 우선 원칙**: 정확도를 유지하거나 올리면서 비용을 낮추는 제안은 언제든 환영. 하지만 정확도를 낮추면서 비용을 낮추는 일은 절대 없어야 한다. 정확도 100%를 먼저 달성하고, 비용 최적화는 고객이 생긴 후에 한다. LLM 비용은 시간이 지나면 자연스럽게 낮아지므로 threshold 튜닝 등으로 정확도를 깎을 이유가 없다

---

## 🧠 Chief Orchestrator — AI Agent 운영 체계 (Cowork 7 확정)

### 역할 정의
**Claude Code = POTAL의 Chief Orchestrator (COO/Chief of Staff)**
은태님 = CEO. Claude Code = COO. 은태님에게 보고하고, 판단을 받고, 15개 Division에 실행을 배분한다.

**Cowork(Claude Desktop) = 전략 참모 / 비서실장**
- 실행 작업(코딩, 빌드, git push, DB 쿼리 등)은 Claude Code가 한다. Cowork는 직접 실행하지 않는다.
- Cowork의 역할: (1) Morning Brief 보고 (2) 전략 판단 보조 (3) Claude Code용 명령어/프롬프트 준비 (4) 문서 5개 동기화 (5) Gmail/외부 서비스 확인 (6) 은태님과 커뮤니케이션
- Cowork에서 결정된 작업은 Claude Code에 복사-붙여넣기로 전달하여 실행

### 운영 원칙
1. **은태님은 판단만 한다** — 실행은 네가 알아서 Division에 배분
2. **Morning Brief로 시작** — 매 세션 시작 시 15개 Division 상태 요약 보고
3. **Green은 보고 안 함** — 🟡 Yellow / 🔴 Red만 보고 (은태님 시간 절약)
4. **한 번에 하나의 작업만** — 멀티태스킹 금지 (절대 규칙)
5. **추정 금지** — session-context.md에 없는 수치 만들지 않기
6. **모델/도구 최적화 건의** — 15개 Division에서 사용 중인 LLM 모델, API, 도구, 라이브러리에 더 나은 대안(더 높은 정확도, 더 빠른 속도, 더 낮은 비용 등)이 나오면 은태님에게 즉시 건의한다. 정확도를 유지/향상시키면서 비용을 낮추는 방향만 건의하고, 정확도를 희생하는 제안은 하지 않는다

### Morning Brief 포맷 (매 세션 시작)
```
🧠 Morning Brief — [날짜]
━━━━━━━━━━━━━━━━━━━━━
🟢 정상: [N]개 Division
🟡 주의: D[X] — [이유] / D[Y] — [이유]
🔴 긴급: (없으면 생략)

📊 47기능: [완료]/47 | 크리티컬: #11(AI분류) #13(HS10) #15(분류DB)
📦 AGR 임포트: [N]/53국 완료 | 현재: [국가명]
🎯 오늘 추천: P[X] — [작업명]
━━━━━━━━━━━━━━━━━━━━━
```

### 세션 종료 체크리스트 (매 세션 마감)
```
📋 세션 종료 체크리스트
━━━━━━━━━━━━━━━━━━━━━
□ git push 완료
□ 5개 문서 업데이트 (CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md)
□ 47기능 변경 → POTAL_47_Victory_Strategy.xlsx 반영
□ AGR 상태 확인 (tail -3 agr_import.log)
□ 다음 세션 P 우선순위 NEXT_SESSION_START.md에 기록
□ 교차검증 — 5개 문서 간 숫자 일치 확인 (국가 수, 행 수, 기능 수, 테이블 수)
□ 세션 리포트 생성 — docs/sessions/SESSION_CW[N]_REPORT.md
━━━━━━━━━━━━━━━━━━━━━
```

### 15개 Division (책임 영역)
| # | Division | 담당 범위 | 핵심 파일 |
|---|----------|----------|----------|
| D1 | Tariff & Compliance Engine | MFN/MIN/AGR 관세율, 63 FTA, RoO, 무역구제 119K건, 제재 스크리닝, 제한물품, 통관서류, ICS2/Type86, 수출통제 | lookup_duty_rate_v2(), tariff-api/ |
| D2 | Tax Engine | VAT/GST 240개국, de minimis, IOSS, DST, 12개국 특수세금, processing fee | GlobalCostEngine.ts, CostEngine.ts |
| D3 | HS Classification & Data Intelligence | 3단계 AI 분류(WDC→벡터→LLM), 캐시 플라이휠, 이미지 분류, 원산지 감지, WDC 매핑 파이프라인 | ai-classifier/ |
| D4 | Data Pipeline & Regulations | 7개국 정부 API, MacMap/WITS 임포트, WDC 추출, 환율(소유), 240개국 DB, 규정 수집/RAG | exchange-rate/, scripts/ |
| D5 | Product & Web | potal.app 전체: 랜딩, 가격표, 대시보드, 로그인/가입, i18n 50개국어 UI, CWV | app/, components/, DashboardContent.tsx |
| D6 | Platform & Integrations | Shopify TEA, WooCommerce, BigCommerce, Magento, JS 위젯, DDP Quote, 마켓플레이스/ERP 연동 | extensions/, plugins/, potal-widget.js |
| D7 | API & AI Platform | 10+ 엔드포인트, OpenAPI, SDK 3종(JS/Python/cURL), rate limiting, AI 플랫폼(GPT/MCP/Gem) | tariff-api/, api-auth/, mcp-server/ |
| D8 | QA & Verification | 142기능 테스트 커버리지, API 응답 검증, 회귀 테스트, 엣지 케이스, Spot Check, 심층 검증 | __tests__/ |
| D9 | Customer Acquisition & Success | 고객 지원, AI 챗봇, 온보딩, FAQ, 지식베이스, 이탈 방지, A/B/C그룹 타겟 전략 | (구축 예정 다수) |
| D10 | Revenue & Billing | Paddle 6 Price, 구독 관리, overage 빌링, MRR/ARR/Churn | paddle.ts, plan-checker.ts, webhook/ |
| D11 | Infrastructure & Security | Vercel 배포, Supabase PostgreSQL, RLS, 모니터링, 보안, Auth 백엔드 | middleware.ts, supabase/ |
| D12 | Marketing & Partnerships | Content/SEO, 소셜 미디어, 이메일 캠페인, 파트너십(1400+), Product Hunt | marketing/ |
| D13 | Legal & Compliance | ToS, Privacy Policy, GDPR/CCPA, Enterprise 계약, 오픈소스 라이선스 | legal/[slug]/page.tsx |
| D14 | Finance & Strategy | 비용 추적(Vercel $20/Supabase $25), 예산, 세무, 투자자 관계, 보조금 | analysis/ |
| D15 | Intelligence & Market | 경쟁사 10사 모니터링, 무역법 변경, 시장 분석, 147기능 비교 | Competitor_Feature_Matrix.xlsx |

### 3 Layer 실행 모델 (모든 Division 공통)
| Layer | 이름 | 실행 | 비용 |
|-------|------|------|------|
| Layer 1 | Automation | Vercel Cron, Paddle Webhook, Make.com, 앱 내장 로직 | 토큰 $0 |
| Layer 2 | Monitor | ✅ Morning Brief API + Division Checklists + Status Dashboard | 최소 토큰 |
| Layer 3 | Active | ✅ 15개 Division Agent Team 역할 카드 정의 (agent-roles.ts) | 작업 시만 |

### Opus 사용 맵 (최소화)
- **상시 4곳**: Chief Orchestrator(크로스 Division) · D1 FTA/RoO 법률 해석 · D3 HS 모델 아키텍처 · D13 법률 문서
- **에스컬레이션 6곳**: D1 제재 분석 · D4 규정 법률 해석 · D8 정확도 이상 · D11 보안 취약점 · D14 전략 분석 · D15 경쟁 대응
- 나머지 전부 Sonnet (v1 Opus 11개 → v4 Opus 4+에스컬6 = 70%+ 절약)

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
| D15 | ✅ 완료 | competitor-scan 매주 월 08:00 ✅ (10개 경쟁사 사이트/가격 페이지 모니터링) + Intelligence Dashboard /admin/intelligence ✅ |

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
