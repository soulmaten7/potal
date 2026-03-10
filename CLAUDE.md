# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-03-10 (Cowork 세션 3 후반/세션 37 — Overage 빌링 구현, Paddle 버그 픽스, B2C 잔재 완전 정리, i18n 키 교체)

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

## 핵심 수치 (세션 37/Cowork 3 기준)
- 240개국/영토, **30개국어** (세션 34: 7→30 확장), 63개 FTA, 12개국 특수세금
- HS Code: 5,371 (WCO HS 2022 6자리)
- MFN 관세율: WITS+WTO 1,027,674건 186개국 + MacMap NTLC 537,894건 53개국
- MIN 관세율: **~92.3M행/130M 44개국 완료, 9개국 진행중** (macmap_min_rates)
- AGR 관세율: 148M행 대기 (macmap_agr_rates)
- 무역협정: 1,319건 (macmap_trade_agreements)
- 반덤핑/상계관세/세이프가드: 119,706건 (TTBD 36개국 AD + 19개국 CVD + WTO SG)
- 정부 API: USITC, UK Tariff, EU TARIC, Canada CBSA, Australia ABF, Japan Customs, Korea KCS (7개)
- **관세율 자동업데이트**: Vercel Cron 매주 월요일 06:00 UTC (세션 34 설정)

## 절대 규칙
1. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 등. 보존만
2. **npm run build 확인 후 push** — 빌드 깨진 코드 push 금지
7. **터미널/다운로드 작업은 한 번에 하나만** — 동시에 2개 이상 다운로드/임포트 실행 금지. 병렬 실행 시 프로세스가 죽거나 불안정해짐
8. **추가 작업은 메모리 부담 없는 것만** — 다운로드/임포트 진행 중 할 수 있는 건 문서 수정, 코드 리뷰, 설정 변경 등 가벼운 작업에 한함
3. **session-context.md에 없는 숫자 만들기 금지** — "70% 완료" 같은 근거 없는 수치 사용 금지
4. **console.log 금지** — 프로덕션 코드에 남기지 않기
5. **한 번에 하나의 작업만** — 멀티태스킹 금지
6. **Git push는 Mac 터미널에서** — VM/EC2에서 push 불가

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
| macmap_min_rates | ~92.3M/130M (44개국) | 🔄 진행중 (9개국 남음) |
| macmap_agr_rates | 0/148M | ⏳ 대기 |
| trade_remedy_cases | 10,999 | ✅ (세션 33) |
| trade_remedy_products | 55,259 | ✅ (세션 33) |
| trade_remedy_duties | 37,513 | ✅ (세션 33) |
| safeguard_exemptions | 15,935 | ✅ (세션 33) |

## MIN 임포트 재개 방법 (Mac에서, WDC 완료 후)
```bash
# ⚠️ Mac 터미널에서 실행 (VM 아님! WDC 다운로드 완료 후 진행)
# 남은 9개국: SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM
# 스크립트: import_min_remaining.py (5K행/배치, curl 임시파일, ON CONFLICT DO NOTHING)
cd ~/portal
nohup python3 import_min_remaining.py > min_import.log 2>&1 &

# 자동 재시작 래퍼 (프로세스 죽으면 5초 후 재시작)
nohup bash run_min_loop.sh > min_import.log 2>&1 &
```
- 속도: ~2,800행/초
- 완료 국가: 44개국 (AE~SA), 남은 9개국 (~26.8M행)

## WDC 다운로드 (Mac에서 실행)
```bash
# Mac 터미널에서 (VM 아님!)
cd ~/portal && nohup scripts/download_wdc_products.sh /Volumes/soulmaten/POTAL/wdc-products > ~/wdc_download.log 2>&1 &

# 진행 확인
tail -5 ~/wdc_download.log
```
- 총 1,899개 파일 × ~186MB = ~350GB
- 외장하드: /Volumes/soulmaten/POTAL/wdc-products
- 이미 다운로드된 파일 자동 건너뜀 (이어받기 가능)
- **진행률**: 1,778/1,899 (~93.6%, 세션 37 기준)

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
**코드 잔존**: ✅ 완전 정리됨 (lemonsqueezy.ts 삭제, Capacitor stub, i18n 6개 언어 키 교체 완료)
**Overage 빌링**: ✅ 구현 완료 — plan-checker(유료 overage 허용) + middleware(X-Plan-Overage 헤더) + overage.ts(Paddle charge) + billing-overage cron(매월 1일)

## 은태님 스타일 (코딩 초보자)
- 기술 설명은 간결하게, 작업은 직접 해줘야 함
- 정확성 최우선, 추정치보다 실제 데이터
- "빠르게 확인 → 다음 작업" 루프 선호
- 한국어 소통, 코드/기술 용어는 영어 그대로
- 과장 표현 싫어함
