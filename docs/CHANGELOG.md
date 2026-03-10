# POTAL Development Changelog

## [2026-03-10] Cowork 세션 4 — 구 요금제 잔재 전면 정리, WDC 추출 스크립트, MIN 임포트 실행

### 🔧 구 요금제 잔재 전면 정리 (6개 파일)
- `app/developers/docs/page.tsx` — Starter $9/Growth $29 → Free/Basic $20/Pro $80/Enterprise $300
- `app/terms/page.tsx` — Free 500→100, Starter→Basic, Growth→Pro, 초과요금 안내 추가
- `app/help/page.tsx` — FAQ 2건 업데이트 (Starter/Growth 삭제, 신 요금제 반영)
- `app/page.tsx` (랜딩) — Free 500→100, Growth $29→Pro $80, Enterprise Custom→$300
- `app/api/v1/sellers/me/route.ts` — planLimits: free 500→100, starter→basic 2K, growth→pro 10K, enterprise unlimited→50K
- `app/legal/[slug]/page.tsx` — Terms 요금제 조항 전면 수정

### 📊 WDC 상품 데이터 추출 스크립트
- `scripts/extract_with_categories.py` (NEW) — 카테고리 포함 추출, 진행 상태 저장/재시작, category_stats.json 출력

### 🧪 lookup_duty_rate_v2() 테스트 쿼리
- `scripts/test_lookup_duty_rate.sql` (NEW) — MIN 상태, 4단계 폴백, 주요 무역 시나리오 테스트

### 🔄 기타
- `app/api/v1/docs/openapi.ts` — "Stripe checkout session" → "Paddle checkout session"
- MIN 임포트 Mac 백그라운드 실행 시작 (9개국, ~26.9M행)
- WDC 다운로드 완료 확인 (1,895/1,899)

---

## [2026-03-10] Cowork 세션 3 후반 (세션 37 계속) — Overage 빌링 구현, Paddle 버그 픽스, B2C 잔재 완전 정리

### 💰 Overage 빌링 구현
- `app/lib/billing/overage.ts` — 초과 사용량 계산 + Paddle One-time Charge API 연동
- `app/api/v1/admin/billing-overage/route.ts` — Cron 엔드포인트 (매월 1일 07:00 UTC)
- `app/lib/api-auth/plan-checker.ts` — 유료 플랜 overage 허용 (Free만 hard-block)
- `app/lib/api-auth/middleware.ts` — X-Plan-Usage/X-Plan-Limit/X-Plan-Overage 헤더 추가
- `app/api/v1/sellers/usage/route.ts` — 구버전 요금제 숫자 수정 (free:500→100, starter→basic 등) + overage 정보 추가
- `vercel.json` — billing-overage cron 추가 ("0 7 1 * *")
- Overage rates: Basic $0.015/건, Pro $0.012/건, Enterprise $0.01/건

---

### 🔧 빌드 수정 (Capacitor 제거 후속)
- `app/lib/native-auth.ts` — @capacitor/core 임포트 제거, stub 함수로 대체 (isNativePlatform→false 등)
- `@lemonsqueezy/lemonsqueezy.js` npm uninstall + `app/lib/billing/lemonsqueezy.ts` 삭제

### 🌐 i18n 번역 키 업데이트 (6개 언어)
- `app/i18n/translations/{en,ko,ja,zh,es,de}.ts` — 구버전 키 전면 교체
  - pricing.starter → pricing.free (Free $0, 100건/월)
  - pricing.growth → pricing.basic ($20, 2,000건) + pricing.pro ($80, 10,000건)
  - pricing.scale → pricing.enterprise ($300, 50,000건)
  - pricing.annual 키 추가 ("Save 20% with annual billing")
  - FAQ: Stripe→Paddle, Starter→Free, 초과요금 안내 추가
  - ja.ts hero.title: "Stripe" → "インフラ"

### 🐛 Paddle 결제 버그 3건 수정
- `app/api/billing/portal/route.ts` — `url` 필드 추가 (대시보드 호환)
- `app/api/billing/checkout/route.ts` — billing_customer_id 재사용 (기존 고객 중복 생성 방지) + billingCycle 파라미터 전달
- `app/dashboard/DashboardContent.tsx` — Monthly/Annual 토글 UI 추가, billingCycle state 관리, PLANS 배열 업데이트

### 🗑️ Vercel B2C 환경변수 15개 삭제
- 삭제: ALIEXPRESS_*, AMAZON_*, EBAY_*, RAPIDAPI_*, APIFY_*, TEMU_* (15개)
- Vercel 환경변수: 36개 → 21개
- AI_CLASSIFIER_* + OPENAI_API_KEY는 B2B에서 사용 중 → KEEP

### 📊 Git Push (3회)
- **1차** (10 files, +280/-1,260): Capacitor stub + lemonsqueezy 삭제 + i18n 업데이트
- **2차** (8a6b0a0): Paddle 버그 픽스 + Annual 토글 + 문서 업데이트 + .gitignore (secrets masking)
- **3차** (a80737e): Overage 빌링 + plan-checker + middleware + usage route + vercel.json cron

---

## [2026-03-10] Cowork 세션 3 (세션 37) — Enterprise 요금제+Annual 확정, Paddle 프로덕션 배포, Vercel 환경변수 자동화

### 💰 Enterprise 요금제 + Annual/Overage 확정
- **Annual 요금 20% 할인**: Basic $16/mo ($192/yr), Pro $64/mo ($768/yr), Enterprise $240/mo ($2,880/yr)
- **Overage 초과 요금**: Basic $0.015/건, Pro $0.012/건, Enterprise $0.01/건
- **Volume Commit**: 100K+/월 → $0.008/건 (Enterprise 협상)
- Paddle 수수료 분석: 5% + $0.50/건 → 마진 Basic 82.5%, Pro 81.9%, Enterprise 78.2%

### 🏗️ Paddle Billing 프로덕션 배포 (세션 36에서 코드 작성 → 세션 37에서 완료)
- **Paddle Sandbox 6개 Price 생성**: Basic/Pro/Enterprise × Monthly/Annual
- **코드 업데이트 완료**:
  - `app/lib/billing/paddle.ts` — priceAnnual, overageRate, paddlePriceIdMonthly/Annual 추가
  - `app/pricing/page.tsx` — Annual 토글 UI, 초과요금 안내, FAQ 추가
  - `app/api/billing/checkout/route.ts` — billingCycle 파라미터 지원
  - `app/dashboard/DashboardContent.tsx` — 플랜명 수정 (growth→pro, starter→basic)
- **npm run build 통과** + git push + Vercel 프로덕션 배포 성공

### 🔧 Vercel 환경변수 자동화 (Vercel API 활용)
- **Vercel API Token 발급**: Full Account, Never expires
- **Paddle 환경변수 9개 자동 추가** (Vercel REST API POST):
  - PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, PADDLE_ENVIRONMENT
  - PADDLE_PRICE_BASIC_MONTHLY, PADDLE_PRICE_BASIC_ANNUAL
  - PADDLE_PRICE_PRO_MONTHLY, PADDLE_PRICE_PRO_ANNUAL
  - PADDLE_PRICE_ENTERPRISE_MONTHLY, PADDLE_PRICE_ENTERPRISE_ANNUAL
- **Stripe 환경변수 3개 삭제**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_GROWTH
- **AI_CLASSIFIER 확인**: `app/lib/cost-engine/ai-classifier/claude-classifier.ts`에서 사용중 → KEEP
- **Vercel Redeploy 트리거**: API로 자동 재배포

### 📦 B2C 잔재 백업
- `archive/vercel_env_backup_2026-03-10.txt` 생성 — RapidAPI, Affiliate, Stripe 키 백업
- Vercel 환경변수 총 30→36개 (9 추가, 3 삭제)

### 📝 문서 업데이트
- session-context.md — 세션 37 전체 반영 (요금제, Paddle, Vercel, WDC 진행률)
- .cursorrules — Paddle 전환 완료 반영, 코드 상태 업데이트
- CLAUDE.md — 핵심 수치, 요금제 테이블, 인증정보 업데이트
- CHANGELOG.md — 이 엔트리
- NEXT_SESSION_START.md — 전면 재작성
- POTAL_B2B_Checklist.xlsx — 완료/신규 태스크 반영

### 🚀 Paddle Sandbox → Live 전환
- **Live API Key 발급**: `pdl_live_apikey_01kkaxcqb7nak8dyrsm3ktxgjj_...`
- **Live Products/Prices 6개 생성**: POTAL 제품 1개 + Basic/Pro/Enterprise × Monthly/Annual
- **Live Webhook 설정**: `https://www.potal.app/api/billing/webhook` (전체 이벤트)
- **Vercel 환경변수 9개 Live로 교체** + Redeploy
- **.env.local Live로 수정**

### ⏳ 백그라운드
- WDC 다운로드 진행: 1,778/1,899 (~93.6%)

---

## [2026-03-09] Cowork 세션 2 (세션 36) — B2C 잔재 삭제 + 파일 정리 2차 + 요금제 검증

### 🗑️ B2C 잔재 삭제
- `ios/` 폴더 전체 삭제 (Capacitor iOS 프로젝트, B2C 모바일 앱)
- `capacitor.config.ts` 삭제
- `POTAL_Distribution.mobileprovision` 삭제 (iOS 배포 인증서)
- `marketing/app-store-metadata.md` 삭제 (Apple App Store 메타데이터, B2C)
- `docs/architecture/SEARCH_LOGIC_ANALYSIS.md` 삭제 (B2C 검색 로직, 2/23)
- `docs/architecture/SPECS.md` 삭제 (B2C Mall Classification, 2/23)
- `docs/architecture/POTAL_MASTER_ARCHITECTURE.md` 삭제 (B2C 마스터 아키텍처, 2/23)
- `docs/architecture/POTAL_AI_EVOLUTION_ROADMAP.docx` 삭제 (B2C AI 로드맵, 2/23)
- **B2C 백업**: `potal-b2c-snapshot` 브랜치에 보존 (remote push 완료)

### 🗑️ 중복/대체 파일 삭제
- `analysis/POTAL_vs_Competitors_Analysis.md` (v2.xlsx로 대체)
- `analysis/COMPETITOR-ANALYSIS.md` (v2.xlsx에 최신 내용)
- `checklists/POTAL_Checklist_20260309.xlsx` (B2B_Checklist.xlsx가 마스터)
- `checklists/MORNING-TODO.md` (세션 30 아침 TODO, 완료됨)
- `docs/architecture/INDEX.md` (README.md와 중복)

### 📁 파일 이동/정리
- `data/south_africa_tariff_schedule_s1p1.pdf` → `data/tariff-research/`
- `data/south_africa_tariff_schedule_s1p2a.pdf` → `data/tariff-research/`
- `data/` 루트 파일 14개 → `data/tariff-research/` (수집 스크립트 2개, 메타/리포트 5개, 데이터 원본 7개)
- `SESSION_TEMPLATES.md` → `archive/`
- `marketing/POTAL_Agent_Dashboard.html` → `archive/`
- `analysis/POTAL_API_Strategy_Analysis.xlsx` → `archive/`
- `.DS_Store` 7개 삭제, `data/collection.log` 삭제

### 🔍 요금제 검증
- 세션 트랜스크립트 29MB (3,175줄) 전수 분석하여 요금제 논의 이력 복기
- **구 요금제** (코드에 남아있음): Free 500/Starter $9/Growth $29/Enterprise custom
- **신 요금제** (세션 28 확정): Free $0/100건, Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
- Paddle Sandbox에 구 요금제(Starter $9)로 제품 생성됨 → 신 요금제로 재생성 필요

### 📝 문서 업데이트
- `CLAUDE.md` — 폴더 구조 맵 업데이트, 세션 번호 반영
- `.cursorrules` — Paddle 전환 반영, MIN 수치 업데이트 (5.4M→92.3M), 30개국어, 파일 경로 수정
- `session-context.md` — 작업 로그 세션 36 추가
- `docs/CHANGELOG.md` — 이 엔트리
- `docs/NEXT_SESSION_START.md` — 전면 재작성

### ⏳ 참고 — 나중에 Mac에서
- `package.json`에 Capacitor 패키지 7개 남아있음 (`@capacitor/app`, `browser`, `cli`, `core`, `ios`, `splash-screen`, `status-bar`) → `npm uninstall` 필요

---

## [2026-03-07] 세션 31 — EC2 WDC 다운로드 수정 + ITC MacMap 53개국 MFN 관세율 수집 완료

### 🔧 EC2 WDC 다운로드 문제 진단 + 수정
- S3 버킷 `potal-wdc-920263653804` 비어있음 확인 → user-data 스크립트가 실행되지 않은 것으로 판명
- EC2 Instance ID 오류 수정: `i-0c114c6176439b9cb` (세션 30에서 `i-0c114c6176439b9cb`로 오기록)
- Security Group `sg-0ffd851660edd6415`에 SSH (port 22) 규칙 추가 → EC2 Instance Connect로 SSH 접속
- 잘못된 WDC URL로 HTML 페이지 다운로드하던 v1 스크립트 중단 + S3 정리
- 올바른 WDC URL 확인: `data.dws.informatik.uni-mannheim.de/structureddata/2022-12/quads/classspecific/Product/`
- **WDC 데이터 정보 수정**: 1,899파일이 아닌 **179파일** (part_0.gz~part_178.gz, 총 257GB, 17.88B quads)
- `download_wdc_v2.sh` 작성 + `nohup` 실행 → 정상 다운로드 진행 확인

### 🔄 관세 데이터 자동 수집 시도 (실패)
- **WITS API 자동화**: EC2에서 50개국 벌크 다운로드 시도 → 전부 FAILED (API가 스크립트 접근 차단)
- **정부 직접 다운로드**: US HTS, EU TARIC, UK Trade Tariff 등 직접 wget → 대부분 0바이트 (JavaScript 렌더링 필요 or wget 차단)
- **결론**: MacMap 웹사이트 수동 다운로드가 현실적 대안

### 📦 ITC MacMap 53개국 MFN 관세율 수집 완료
- MacMap 벌크 다운로드 설정: TARIFF → APPLIED TARIFFS → MFN → NTLC (National Tariff Line Code)
- **53개국**: ARE, ARG, AUS, BGD, BHR, BRA, CAN, CHE, CHL, CHN, COL, CRI, DOM, DZA, ECU, EGY, EUR, GBR, GHA, HKG, IDN, IND, ISR, JOR, JPN, KAZ, KEN, KOR, KWT, LKA, MAR, MEX, MYS, NGA, NOR, NZL, OMN, PAK, PER, PHL, PRY, QAT, RUS, SAU, SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM
- **73개 데이터 파일, 721,582건 관세율, 191MB** (NTLC 8-12자리 수준)
- 데이터 형식: Tab-separated .txt (Revision, ReportingCountry, Year, ProductCode, Nav_flag, AvDuty, NavDuty, Source)

### 📁 파일 정리
- `data/itc_macmap/by_country/{ISO3}/` 구조로 53개국 폴더 정리 완료
- BulkDownloadResult 폴더 4개 삭제 (369246~369249)
- zip 파일 6개 삭제 (369246~369251)
- 개별 CSV/폴더/임시 파일 삭제: Algeria_ntlc.csv, japan_ntlc.csv, .DS_Store, API_NOTES.md, COUNTRY_CODES.txt, INDEX.md, QUERY_GUIDE.md, README.md 등

### ⏳ 대기 항목
- WDC 다운로드 진행 중 (EC2 nohup, 마지막 확인 시 ~55/179)
- Supabase Pro 전환 대기 (결제 완료, 플랜 미활성화 → support 요청)
- MacMap 반덤핑/세이프가드 데이터 별도 수집 필요

---

## [2026-03-07] 세션 30 — HS Code 분류 DB 전략 수립 + WDC 5.95억 상품 파이프라인 + AWS EC2 자동 실행

### 🧪 AI HS Code 분류 테스트 (6종)
- **Test 1 — Enrichment Pipeline** (3종):
  - Method A: Raw Llama 70B = 50% 6-digit, 80% 4-digit (최고 성능)
  - Method B: Generic Enrichment → 70B = 50% 6-digit, 50% 4-digit (오히려 하락)
  - Method C: Generic Enrichment → 8B = 30% 6-digit, 30% 4-digit
- **Test 2 — HS-Aware Enrichment** (3종):
  - Method D: HS-Aware Single 70B = 40%/70%/90%
  - Method E: 2-Step HS = 30%/40%/50%
  - Method F: CoT + HS Hints = 20%/20%/40%
- **핵심 발견**: AI 분류 최대 60% 정확도 한계 → 모델의 HS 법적 지식 부족이 병목
- **결론**: AI 실시간 분류 전략 포기 → 대량 상품명 수집 + 룩업 전략으로 전환

### 🔄 전략 전환: "HS Code = 결국 상품명"
- Avalara 3,000만+ = 상품명 3,000만 매핑 DB → 우리도 동일 전략
- **4단계 전략 확정**:
  1. 전 세계 HS 코드 확보 (6~12자리, 약 50만~80만개)
  2. 코드 변경 자동 업데이트 체계
  3. 온라인 상품명 50~80억 건 대량 수집
  4. 상품명 → HS 코드 매핑 (세관 공개데이터 + AI 배치)
- RapidAPI 벌크 스크래핑 불가 확인 → Tier 1 무료 데이터셋 우선 전략

### 📦 WDC (Web Data Commons) 5.95억 상품 데이터
- 1,899개 파트 파일 × 186MB = ~350GB (Common Crawl schema.org/Product)
- part_0 검증: 238,249 고유 상품명 추출 성공
- 추출 정보: name, category, brand, material, GTIN, SKU, source URL
- Google Taxonomy 5,596 카테고리 다운로드 완료

### ☁️ AWS 인프라 구축
- **AWS 계정**: POTAL (920263653804), us-east-1, Free Tier $100 크레딧
- **S3 버킷**: potal-wdc-920263653804
- **IAM Role**: potal-ec2-role (S3FullAccess)
- **EC2 Instance**: i-0c114c6176439b9cb (m7i-flex.large, 2 vCPU, 8GB RAM)
- **자동 파이프라인**: User-data 스크립트로 다운로드→추출→중복제거→S3 업로드→자동종료
- 예상 소요: 8~16시간, 비용 ~$1 (Free Tier 내)

### 📁 신규 파일
- `scripts/download_wdc_products.sh` — WDC 전체 파일 다운로드 스크립트
- `scripts/extract_products_detailed.py` — 상품 정보 상세 추출기 (JSONL + CSV)
- `scripts/setup_wdc_download.sh` — 외장하드 다운로드 셋업 스크립트

### ⏳ 대기 항목
- EC2 결과물 확인: `aws s3 ls s3://potal-wdc-920263653804/unique_product_names.txt`
- Supabase Pro 전환 + 008 마이그레이션 (세션 29 대기)
- Stanford Amazon 9.4M + MAVE 2.2M 추가 데이터 병합

---

## [2026-03-07] 세션 29 — 관세 데이터 벌크 수집 (WITS+WTO 1,027,674건 186개국, TFAD 137개국)

### 📦 HS Code & 관세 데이터 대량 수집
- HS Code DB: 443→5,371 코드 (WCO HS 2022 전체 6자리 서브헤딩 기반)
- WITS (World Bank) 벌크 다운로드: 175개국, 962,729건 MFN 관세율 (SDMX XML API, 무인증)
- WTO Timeseries API 벌크 다운로드: 114개국, 618,016건 (API 키 인증, 22개 실패 분석)
- WITS+WTO 통합: **1,027,674건, 186개국, 6,350 HS코드** (WTO 우선, 교차검증 95-98.5%)
- EU 멤버 27개국 관세율 자동 복제 포함
- Spot Check 9/9 통과: US T-shirt 16.5%, JP salmon 3.5%, KR T-shirt 13%, DE laptop 0% 등

### 🏛 TFAD 통관절차 데이터
- 137개국 Trade Facilitation Agreement 이행 데이터 (tfadatabase.org 웹 스크래핑)
- 비준일, 이행률, 관련 조항, 카테고리 구분 (A/B/C) 수집

### 🔍 WTO API 전수 테스트 (4개)
- Timeseries API ✅ (114개국 벌크 다운로드 완료)
- ePing API ⚠️ (members 엔드포인트만 작동, SearchNotifications 404)
- QR API ❌ (403 Forbidden — CloudFront 차단, WTO 인프라 문제)
- TFAD API ❌ (모든 엔드포인트 404 → 웹 스크래핑으로 전환)

### 📁 프로젝트 적용 파일
- `data/duty_rates_merged.csv` (54MB) — 1,027,674건 통합 MFN 관세율
- `supabase/migrations/008_merged_duty_rates.sql` (81MB) — Supabase INSERT
- `data/tfad_members.json` (60KB) — 137개국 통관절차 데이터
- `data/merge_summary.json` — 데이터 통합 요약

### ⏳ 대기 항목
- ITC MacMap: 계정 활성화 에러 → ITC 이메일 문의 중 (반덤핑/세이프가드 데이터)
- WTO QR API: 403 차단 (제한 물품 데이터)

## [2026-03-06] 세션 28 — 경쟁사 비교 분석 + 요금제 전략 재설계 + "33개 기능 업계 최고" 전략 확정

### 📊 경쟁사 비교 분석 4종 엑셀 생성
- `POTAL_vs_Competitors_v2.xlsx` — 5시트 (종합 비교, 가격 시뮬레이션, 강점약점 매트릭스, 성장 추적, 전략 인사이트)
- `Competitor_Feature_Matrix.xlsx` — 3시트 (9카테고리×45기능×10경쟁사 체크리스트, 가격별 기능, 할당량별 실비용)
- `Competitor_Pricing_Analysis.xlsx` — 4시트 (25개 요금제 상세, 건당 단가, 할당량 비교, POTAL 문제점 7개)
- `POTAL_Cost_Analysis_45Features.xlsx` — 3시트 (47기능별 원가, 요금제별 손익, 티어별 기능 배분)
- 경쟁사 10곳: Avalara, Global-e, Zonos, Hurricane, DHL, Easyship, SimplyDuty, Dutify, TaxJar

### 💰 요금제 전략 재설계 (Alex Hormozi 전략 적용)
- "극소수에게 비싸게 팔거나, 모두에게 싸게 팔아라. 중간은 죽음이다."
- 구: Free $0/500, Starter $9/5K, Growth $29/25K, Enterprise custom → **폐기**
- 신: Free $0/100, Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
- 근거: SMB 셀러 실제 API 사용량 데이터 분석 (Hobby 8-24건, Small 120-300건, Medium 675-1,800건)
- AI 원가: 건당 $0.001 (GPT-4o-mini) + 캐시 히트 70-90% → 실질 $0.0003
- Basic $20/2K: 97% 마진 (AI 비용 ~$0.60)

### 🎯 "33개 기능 업계 최고" 전략 확정
- 47개 경쟁사 기능 전수 분석 → 33개 POTAL 스코프, 14개 스코프 밖
- 33개 모두 경쟁사 최고 수준 이상으로 구현 목표
- 스코프 OUT (14개): 배송/물류 5개, 현지결제수단, VAT 신고, Landed Cost 보증, 전담매니저, 사기방지, 3PL, BNPL
- Golden Circle: WHY(LLM이 쇼핑 장악) → HOW(LLM에 디테일 제공) → WHAT(POTAL이 모든 부품 제공)

### 🔍 45기능 원가 분석 결론
- A(AI/코드) 22개: 건당 $0 추가 — AI 호출에 이미 포함
- B(DB/캐시) 12개: 건당 $0 — 자체 DB 조회
- C(외부API) 5개: 건당 $0.0005 — 환율/정부 API
- D(인프라) 4개: 월 고정비 $50-100
- E(인력/보증) 3개: Enterprise 전용 (Basic/Pro 미포함)
- F(물류/외부) 5개: 스코프 밖
- **결론: 33개 기능 전부 넣어도 건당 $0.008 이하. $20/2K 유지 가능**

### 📋 Phase 6 태스크 17개 추가 (B2B Checklist)
- HS Code DB 50만+ 확대, 이미지 분류, 반덤핑 DB, 제한물품 검사, 통관서류 생성
- DDP 체크아웃, 다중통화, WooCommerce, BigCommerce
- 원산지 자동감지, 관세변동알림, AI 에이전트 SDK
- 요금제 코드 업데이트, Supabase Pro 전환

---

## [2026-03-06] 세션 26 — Shopify App Bridge + 181개국 통합 업데이트 + Product Hunt 에셋

### 🔧 Shopify App Bridge 임베디드 확인
- potal-test-store.myshopify.com에 POTAL 앱 설치 확인
- App Bridge 4.x CDN script (`layout.tsx`에 추가) + `ShopifyAppBridge.tsx` 컴포넌트 push
- `app/api/shopify/session/route.ts` 세션 토큰 인증 API push
- 임베디드 앱 확인 대기 중 (자동 확인, 최대 2시간)

### 🌍 GPT/Gemini/MCP 181개국 업데이트
- Custom GPT OpenAPI schema: `custom-gpt/openapi-gpt-actions.json` 139→181개국, `"schemas": {}` 추가 (ChatGPT 검증 에러 해결)
- Root `openapi-gpt-actions.json` 동기화 (139→181)
- Gemini Gem CSV: `gemini-gem/country-duty-reference.csv` 44→181개국 재생성 (country-data.ts 기반)
- MCP 서버: `mcp-server/build/index.js` tsc 재빌드
- `public/manifest.json`: 139→181개국
- `public/widget/potal-widget.js`: 139→181개국

### 🚀 Product Hunt 에셋 제작
- `product-hunt-assets/` 디렉토리 생성
- gallery-1-hero.png (1270x760) — API 데모
- gallery-2-dashboard.png (1270x760) — 셀러 대시보드
- gallery-3-integrations.png (1270x760) — 통합 + 경쟁사 비교
- gallery-4-pricing.png (1270x760) — 요금제 + PH 프로모
- thumbnail-240x240.png — POTAL 로고
- `PRODUCT_HUNT_LAUNCH_PLAN.md` 에셋 상태 ⏳→✅

### ⚠️ Stripe 계정 정지
- Stripe 계정 suspended 확인
- Paddle / LemonSqueezy (MoR 모델, ITIN 불필요) 대안 확정

### ✅ 기타
- Supabase 마이그레이션 정상 확인 (Table Editor + SQL Editor)
- npm run build 통과 ✅

---

## [2026-03-06] 세션 25 — Cost Engine 대규모 업그레이드

### 🌐 4개 신규 관세 API Provider
- Canada CBSA, Australia ABF, Japan Customs, Korea KCS → 총 7개 정부 API
- `app/lib/cost-engine/tariff-api/` 하위 4개 파일 추가

### 📊 데이터 확장
- country-data.ts: 137→181개국 (Oceania, Americas, Africa, Europe, Middle East, Asia 전역)
- duty-rates.ts: 56→97 HS 챕터 (29개국×97챕터 = 2,813개 관세율)
- fta.ts: 27→63 FTA 협정
- HS Code DB: 409→443개 (세션 24에서 확장)

### 🇮🇳 India/Brazil 특수 세금
- India: BCD + SWS(10%) + IGST(5-28%) 캐스케이딩
- Section 301 tariffs 2025/2026 업데이트 (List 1-4A + 2024 USTR 확장)
- 8개국 processing fees 추가 (US MPF, AU IPC, NZ Biosecurity 등)

### ⚡ 성능
- Batch calculation Promise.allSettled 병렬화
- Frontend/docs/i18n country count 139→181 업데이트 (50+파일)

---

## [2026-03-06] 세션 22~24 — B2C→B2B 전환 완료 + API 문서 + HS Code 확장

### 세션 24 — Swagger UI + PH 런치 + HS Code
- `/developers/docs` Swagger UI 스타일 재구축 (6개 엔드포인트, Try it, cURL/JS/Python)
- `PRODUCT_HUNT_LAUNCH_PLAN.md` 생성
- HS Code DB 409→443개 (+34개 이커머스 핵심)
- OpenAPI URL 수정 (potal.io→potal.app)

### 세션 23 — layout.tsx B2C Context 정리
- WishlistProvider/UserPreferenceProvider 제거
- Footer/sw.js/MobileBottomNav B2B 확인 완료

### 세션 22 — B2C→B2B 사이트 전환
- 가격 불일치 수정 4파일, 코드 정리 8파일
- B2C→B2B 페이지 전환 20+파일
- SEO/manifest/legal 전체 B2B 전환
- 위젯/API 프로덕션 검증 완료

---

## [2026-02-25] iOS 앱 빌드 (Capacitor) — 진행 중

### 📱 Xcode 설치 및 프로젝트 설정
- Xcode 전체 앱 설치 (기존 Command Line Tools만 있었음)
- iOS 26.2 Simulator + Predictive Code Completion Model 다운로드
- `open ~/portal/ios/App/App.xcodeproj`로 Xcode에서 프로젝트 열기 성공
- Signing & Capabilities: Team(EUNTAE JANG), Bundle ID(com.potal.app), Auto Signing 설정 완료
- iPhone 17 Pro 시뮬레이터로 빌드 시작 → "Installing App" 단계까지 확인

### ⏳ 다음 세션에서 이어서 할 것
- 시뮬레이터 테스트 (potal.app 로드 확인)
- General 탭 설정 (Display Name, Deployment Target 16.0, App Category)
- 앱 아이콘 (1024x1024) 생성
- App Store Connect 등록 및 심사 제출
- Capacitor 파일 커밋 + push

---

## [2026-02-24] Serper 제거 + 음성 검색 + Capacitor 초기 설정 + Rakuten/RapidAPI 환불

### 🎤 음성 검색 (Voice Search) 기능 추가
- **`useVoiceSearch.ts`** 커스텀 훅 생성 — Web Speech API 기반, 비용 $0
- **SearchWidget.tsx** (홈) + **StickyHeader.tsx** (검색결과) 양쪽에 마이크 아이콘 추가
- 모바일 + 데스크톱 모두 적용
- 마이크 클릭 → 빨간색 펄스 → 음성 인식 → 검색창 텍스트 자동 입력
- Chrome/Edge 완벽 지원, Safari 기본, Firefox 미지원 (버튼 숨김)
- `icons.tsx`에 `Microphone` SVG 아이콘 추가

### 🗑️ Serper Google Shopping 17개 Provider 제거
- Coordinator.ts에서 Serper 관련 코드 전부 제거
- 5개 RapidAPI provider만 유지 (Amazon, Walmart, eBay, Target, AliExpress)
- 이유: Serper Shopping API가 Google 리다이렉트 URL만 반환 → 실제 상품 페이지 연결 불가
- 코드 파일은 `providers/` 폴더에 보존 (향후 직접 API 확보 시 참고)

### 💰 RapidAPI 환불 요청
- Best Buy API (bestbuy-usa.p.rapidapi.com) — 500 에러, 환불 요청 메일 발송
- Shein API (unofficial-shein.p.rapidapi.com) — 500 에러, 환불 요청 메일 발송

### 🏪 Rakuten Publisher 이슈
- "Complete company details" 미완료 상태 — 시크릿 모드에서도 동일
- Case #390705 스크린샷 첨부 답장 완료

### 📱 Capacitor iOS 초기 설정
- `capacitor.config.ts` 생성 — WebView 방식 (server.url: https://potal.app)
- 패키지 설치: @capacitor/core, @capacitor/cli, @capacitor/ios, @capacitor/splash-screen, @capacitor/status-bar
- `npx cap add ios` + `npx cap sync` → ios/ 폴더 생성
- package.json에 cap:sync, cap:open:ios 스크립트 추가

---

## [2026-02-24] (이전 세션) Serper Google Shopping 17개 Provider 추가 + 상품 링크 문제 대응

### 🛒 Serper Google Shopping Provider 확장
- **SerperShoppingProvider 베이스 클래스** 생성 — 17개 provider가 상속하는 공통 추상 클래스
- **16개 신규 Provider 추가**: Best Buy, Home Depot, Lowe's, Nordstrom, IKEA, Wayfair, Newegg, Sephora, Etsy, Mercari, iHerb, Shein, ASOS, Farfetch, YesStyle, MyTheresa
- **기존 Temu Provider** SerperShoppingProvider 기반으로 리팩토링
- Coordinator.ts에 22개 provider 등록 (RapidAPI 5개 + Serper 17개)

### 🔗 상품 링크(URL) 문제 대응 시도
Serper Shopping API가 Google 리다이렉트 URL을 반환하는 근본 문제에 대해 아래 해결책 시도:
1. **2단계 Web Search** (site: 검색으로 실제 URL 찾기) — 부분 성공, 해석률 낮음
2. **RequestThrottler** (5/sec + early release) — rate limit 해결
3. **429 자동 재시도** (1회, 500ms) — 재시도 로직
4. **시간 예산 (10s deadline)** — timeout 방지
5. **directUrlLimit=2 + products=limit** — fallback URL 제거, 상품 수 제한
6. **5분 in-memory 캐시** — 크레딧 절약
7. **카테고리 기반 사전 필터링** — 쿼리 분류 → 관련 provider만 호출

### ❌ 근본 문제 미해결 & 전략 전환 결정
- **Serper 2단계 방식의 한계 인정**: URL 해석률 낮고, 크레딧 과다 소모
- **Temu는 한 번도 제대로 작동한 적 없음** — 가장 처음 추가하려던 provider
- **전략 전환**: Serper 의존 탈피, 각 쇼핑몰별 직접 API (RapidAPI/자체 API) 방식으로 전환
- **다음 단계**: RapidAPI Temu Shopping API 테스트 후 Serper→RapidAPI 전환 시작

### ❌ Temu API 시도 — 전부 실패 (다시 시도하지 말 것)
- **Apify Actor** (`amit123/temu-products-scraper`) — 유일하게 잠깐 동작 후 403 차단 (2026-02-18~)
- **RapidAPI Temu Shopping API** — 호출 자체 안 됨
- **Apify Temu Listings Scraper** — 호출 안 됨
- **Scrapeless** (scraper.temu, webunlocker) — 호출 안 됨
- **Serper organic search** (`site:temu.com`) — 가격 데이터 미포함
- **Serper Shopping** (`query + "temu"`) — URL이 Google 리다이렉트
- **Google &btnI 리다이렉트** — 서버사이드 302 안 됨
- directUrlLimit 5개 이상 — 65 web searches → timeout

---

## [2026-02-23] MVP Final Audit + Live QA Bug Fixes + Phase 1 Learning System

### 🔍 MVP 최종 검수 (2라운드)
- **TypeScript 컴파일**: 0 에러 확인
- **Dead Code 삭제**: amazonApi.ts, MockProvider.ts, debug/route.ts, mockData.ts, page.tsx.bak, SESSION-CONTEXT.md (6개 파일)
- **Console.log 전량 제거**: 13개 파일에서 41개 제거
- **불필요한 `as any` 캐스트 제거**: search/page.tsx
- **QueryAgent.ts 빈 if블록 제거**
- **.gitignore 중복 엔트리 정리**

### 🛡️ Security Hardening
- **Auth Callback**: Open Redirect 방어 강화 (URL 인코딩 우회 + 백슬래시 방어)
- **AI API**: 프롬프트 인젝션 방어 (따옴표 변형 제거, injection 키워드 제거)
- **Error Boundary**: app/error.tsx 앱 전체 크래시 방어 추가

### 🧪 AI Quality Test
- 90개 테스트 케이스 작성 (6개 테스트 스위트)
- isQuestionQuery, analyzeQueryDeterministic, shouldUseAIAnalysis, IntentRouter fallback, FraudFilter, parseOutput
- **100% (90/90) 통과**
- 수정: `which X is best` 패턴, 'buds' 카테고리, comparison 우선순위, `X or Y` 패턴

### 🧠 Phase 1 학습 시스템 구현
- `SearchLogger.ts` — fire-and-forget 비동기 로깅 (검색 블로킹 없음)
- `search_logs` 테이블 (18 컬럼) + `search_signals` 테이블 (7 컬럼) — Supabase
- RLS 활성화 + anon insert 정책
- `signals/route.ts` — 클라이언트 시그널 수집 API
- Coordinator.ts + search/page.tsx에 로깅 연동

### 🐛 Live QA 버그 수정 (3건)
1. **로딩 텍스트 색상**: 데스크톱(#f1f2f8 밝은 배경)에서 텍스트 안 보임 → 반응형 색상 처리 (데스크톱 진한색, 모바일 흰색)
2. **필터 체크박스 겹침**: 긴 텍스트가 체크박스와 겹침 → `min-w-0` + `truncate` + 간격/폰트 축소
3. **가격 오타 인식**: "100dollors", "50bucks", "200dollers" 등 → 자동 정규화 ($100, $50, $200)
   - QueryAgent: priceNormalized + standalonePrice + cleanQuery에서 통화 오타 제거
   - Intent Router: PRICE_PATTERN + fallback 가격 추출에 오타 패턴 추가

### 📄 문서
- `POTAL_AI_EVOLUTION_ROADMAP.docx` — AI 자가 학습 로드맵 (Phase 1-6)
- POST_MVP_CHECKLIST 전면 업데이트
- .cursorrules AI 파이프라인 매핑 추가

---

## [2026-02-04] POTAL 2.0 Home Page Finalization & Strategy Shift

### ⏱️ Timeline & Action Log (1-min granularity)
- **19:50** | **UI/UX Hotfix**: 검색 버튼 컬러 수정. 기존 `#C5A028`(Muddy Gold) 폐기하고 `#F59E0B`(Vivid Amber) + `drop-shadow-md` 적용. 텍스트는 `text-white` 유지하되 `font-extrabold`로 가독성 강화.
- **20:05** | **Content Overhaul**: 가치 제안(Value Props) 텍스트 전면 교체. "Global Comparison", "Total Landed Cost" 개념 명확화.
- **20:10** | **Button Logic**: 검색 버튼 'Always On' 결정. 입력값(`!query`) 여부와 관계없이 시각적으로 항상 활성화 상태 유지 (사용자 유도).
- **20:25** | **Feature Integ**: Shipping Guide FAQ 섹션에 실제 배송 데이터(Amazon Prime, Ali Choice 등)를 2단 그리드(`grid-cols-2`)로 통합. 텍스트 컬러는 `#02122c`(Navy)로 통일하여 이질감 제거.
- **20:30** | **Branding Pivot**: 서비스 주체 변경. "AI"라는 단어를 "POTAL" 또는 "POTAL Agent"로 교체하여 서비스 자체를 의인화/브랜딩화. (Slogan: "POTAL Verified. No Hidden Costs.")
- **20:55** | **UX Decision**: Zipcode 입력 방식 변경. '주소 검색/자동완성' 기능 폐기(MVP 단계 리스크 제거)하고, '정직한 숫자 5자리 입력' 방식으로 회귀.
- **21:05** | **UI Polish**: Market Scope 드롭다운 디자인 변경. 컬러 이모지 제거하고 'Lucide Monochrome Icons' 적용. "Only" 텍스트 삭제로 미니멀리즘 구현.
- **21:15** | **No Fake Policy**: 검색어 추천 기능(Related Suggestions)의 가짜 데이터 로직 전면 삭제. '최근 검색어(Recent Searches)'만 `localStorage` 기반으로 리얼 구현 결정.
- **21:40** | **Privacy Logic**: 검색 기록 저장소 분리. 로그인(`potal_user_recents`)과 비로그인(`potal_guest_recents`) 키값 분리하여 프라이버시 보호 로직 추가.
- **22:00** | **Phase 2 Plan**: 검색 결과 페이지(`/search`) 뼈대 및 Sticky Header 설계 시작.
- **22:20** | **Dev Strategy**: **"PC First"** 원칙 확정. 모바일 반응형(Responsive) 작업을 병행하지 않고, PC 버전(1200px 기준)을 기능적으로 완벽히 끝낸 후 모바일 CSS를 일괄 작업하기로 합의.

### 🧬 Technical Specs (Code & Logic)
- **Color System**:
  - Primary Action (Search Button): `bg-[#F59E0B]` (Tailwind Amber-500).
  - Text Body: `text-[#02122c]` (Deep Navy) & `text-slate-600`.
- **Search Logic**:
  - **Recent History**: Uses `localStorage`.
    - Key (Guest): `potal_guest_recents`
    - Key (User): `potal_user_recents`
  - **Routing**: `router.push("/search?q=...&zip=...&market=...")` via query params.
- **UI Components**:
  - **Market Dropdown**: Custom `div` based dropdown (removed `<select>`). Icons: `Globe`, `Flag`, `Plane` (Slate-500).
  - **Zip Input**: `input[type="text"]`, `maxLength={5}`, numeric only. No auto-complete.
- **Shipping Data (Hardcoded for MVP)**:
  - **Domestic**: Amazon (Prime 2-day), Walmart (W+), Target, Best Buy, iHerb(Expedited).
  - **Global**: AliExpress (Choice 5-7d), Temu (Std 7-15d).

### 🧠 Philosophy & Principles
- **No Fake Data**: MVP라도 '그럴싸한 가짜'는 허용하지 않는다. 기능이 적더라도 100% 리얼 데이터/로직만 보여준다.
- **POTAL is the Agent**: "AI가 했다"고 하지 않고 "POTAL이 검증했다"고 표현하여 브랜드 신뢰도를 높인다.
- **PC First**: 완성도 높은 로직 검증을 위해 PC 버전을 우선 완성하고, 모바일 UX는 후순위로 미룬다. (동시 작업 시 효율 저하 방지).

**⚠️ Development Principle:** All functional updates (Logic, UI features) must be applied to **BOTH PC and Mobile** environments simultaneously. *(One Logic, Multi-Device).*

---

### 📋 UX Consistency & Header Policy
- **Universal Copywriting:** PC와 모바일 간의 문구 일관성(Consistency)을 100% 유지함. 플랫폼에 따라 텍스트를 임의로 축약하거나 변경하지 않음.
- **State-Based Branding:** 로그인 상태에 따라 홈 화면의 메시지를 명확히 분리함.
  - **Logged-in:** `✨ Personalized Picks for You` (관심사 기반)
  - **Guest:** `🔥 Global Trending Picks` (트렌드 기반)
- **Zero Hallucination:** 게스트에게 'Personalized' 문구를 노출하는 오류를 수정하여 서비스 신뢰성 확보.
- **Implementation:** 단일 소스 `homeHeaderText`를 사용하여 모바일 헤더·PC 컬럼 부제에 동일 문구 출력. 상단 레이아웃 수직 압축(로고–검색 간격 축소, 검색–문구–리스트 여백 최소화)으로 포털 대시보드 완성.

---

## [2026-02-04] The "Skyscanner" Pivot (POTAL 2.0)

### 🚨 Strategic Pivot: From Marketplace to Search Engine
- **Context:** 기존 홈 화면의 '추천 상품(Trending)' 나열 방식은 사용자의 검색 목적을 방해하고, 단순 쇼핑몰(Marketplace)로 오인하게 만듦.
- **Decision:** **"Change Everything."** (이건희 회장 인용). 마누라와 자식(핵심 데이터) 빼고 다 바꾼다.
- **New Philosophy:**
  1.  **Zero Noise:** 홈 화면에서 모든 추천 상품 삭제. 오직 '검색창'과 '설정'만 남긴다. (Google/Skyscanner Style)
  2.  **Context-Aware:** [검색어] + [도착지(Zipcode)] + [필터] 3요소만 받는다.
  3.  **Agent Detail:** 클릭 시 바로 이동하지 않고, '가격 변동', '배송 시뮬레이션'을 보여주는 상세 리포트 페이지를 거친다.

### 🛠️ Planned Spec (v2.0 Blueprint)
1.  **Home:**
    - Search Box Only.
    - Destination Input (Shipping Calculation Key).
    - Scope Selector (All / Domestic / Global).
2.  **Mobile Nav:** [Search] - [Wishlist] - [Profile] (Simple 3-Tab). No 'Categories'.
3.  **Search Result:**
    - Sticky Filter Bar (Filter, Sort, Scope).
    - Sort Tabs: Recommended / Fastest / Cheapest.
4.  **Product Detail:**
    - Internal Agent Page before external link.
    - "Export Wishlist" feature added.

---

## [2026-02-03] (Previous) MVP v1.0 Stabilization
### 1. ⚡️ Performance & UX Fixes
- **AI Timeout:** `gpt-4o-mini` 호출 시 2초(2000ms) 타임아웃 적용. 초과 시 원본 반환하여 무한 로딩 방지.
- **Input Sync:** `useRef`를 도입하여 타이핑 중 URL 동기화로 인한 입력 끊김(Input Lock) 현상 해결.
- **Stale Data:** 검색 실행 시 `setList([])`를 선행하여 이전 검색 결과(잔상)가 남는 버그 수정.
- **Visual Distinction:** 모바일 리스트에서 International 상품에 오렌지색 테두리(`border-l-amber-400`) 적용.

---

## [2026-02-02] PC/Mobile Login Path Unification & Sign-In Page Layout
### 🔗 PC Header Login Path
- **Unified Entry:** PC 헤더의 "Sign In" 버튼을 `signInWithOAuth` 직접 호출에서 **`/auth/signin` 링크**로 변경함.
- **Result:** PC에서도 모바일과 동일하게 이메일+구글+X 버튼이 있는 로그인 페이지로 이동하며, 이메일(매직 링크) 로그인 가능.

### 🖥️ Sign-In Page Responsive Layout
- **PC:** `max-w-md mx-auto` + 카드 형태(`md:bg-white md:rounded-2xl md:shadow-sm md:border md:p-8`)로 화면 중앙에 정리.
- **X (닫기) 버튼:** 헤더 왼쪽 상단에 고정, PC/모바일 모두 동일하게 노출.

### 📝 Development Principle Documented
- CHANGELOG 상단에 **"One Logic, Multi-Device"** 원칙을 굵게 추가함.

## [2026-02-02] Mobile Home: Real-Time Comparison Portal (Home-Integrated Zipper)
### 🚀 Features & Fixes
- **Home-Integrated Zipper:** On mobile home (`isHomeMode === true`), Domestic and Global are no longer separate sections. `displayedDomestic` and `displayedInternational` are **interleaved 1:1** into a single list so the 2-column grid shows [left: Amazon/Walmart (Fast), right: AliExpress/Temu (Cheap)] side-by-side for direct comparison.
- **Unified Header:** Home screen uses a single compact line: **"Personalized Picks for You"** (no "Domestic (Fast)" / "Global (Cheap)" section titles). Vertical spacing between search bar and product list reduced for a tighter dashboard feel.
- **Home Entry:** `resetToHome` (hard reload to `/`) ensures the integrated curation view loads immediately with `isHomeMode === true`.

### 📐 UX
- **Goal:** User opens the app and sees a "US vs Global" best-products comparison dashboard in 2 columns without scrolling past section headers.

---

## [2026-02-01] Major UI/UX Overhaul & Logic Stabilization
### 🚀 Features & Fixes
- **Mall Classification:** Moved **eBay** and **iHerb** to **Domestic** (Corrected categorization error).
- **Zipper Ranking:** Implemented 'Interleave' sorting (Amazon #1 -> Walmart #1...) within tabs.
- **Delivery Badges:** Standardized 8 major malls (Amazon=Blue, Ali=Orange, etc.) & removed cluttered tooltips.
- **Pagi items limit" bug. Re-implemented "Show More" button.

### ❌ Rejected / Zombie Ideas (Do Not Resurrect)
- **LLM-based Brand Filter:** Attempted to use AI to infer brands (e.g., AirPods -> Apple) but rejected due to **cost & hallucination**. Switched to **Data-Driven** (API response analysis).
- **4-Column Grid (PC):** Attempted `grid-cols-4` but rejected. Images were too s- **4-Column Grid (PC):** Attempted `grid-cols-4` but rejected. Images were too s- **4-Column Grid (PC):** Attemptedixes
- **Search Logic:** Refactored to `SearchProvider` pattern.
- **Mobile UX:** Changed 'X' button in search bar to Mobile Only (`md:hidden`).
- **Saved Page:** Fixed freezing issue by removing modal overlay and using full page structure.
- **Header:** Changed to `fixed top-0 z-[9999]` to fix touch issues on mobile.

### ❌ Rejected / Zombie Ideas
- **Voice Search:** Rejected for MVP phase.
- **LLM for Search Briefing:** Rejected due to cost/latency. Switched to **Rule-Based** Logic.

---

## [2026-01-30] UI Framework & AI Brain Transplant (Phase 1)
### 🚀 Features & Fixes
- **Layout:** Expanded main container to `max-w-[1800px]` for Amazon-like density.
- **Vertical Grid:** Switched from Horizontalt to Vertical Grid cards.
- **Smart Filters:** Implemented Context-Aware filters (e.g., Gaming Chair -> shows material/features).
- **Security:** Separated LocalStorage keys for User vs Guest search history.

### ❌ Rejected / Zombie Ideas
- **Horizontal List View:** Rejected. "Hard to compare". Switched to **Vertical Grid**.
- **Number Badges:** Removed ranking numbers (1, 2, 3...) as they looked "cheap/flyer-like".

---

## [2026-01-29] Login, Wishlist & Business Model
### 🚀 Features & Fixes
- **Wishlist:** Implemented `localStorage` based wishlist (no login required initially).
- **Monetization:** Implemented "5 Frearches" limit for guests.
- **Design:** Switched from "Coupang Blue" to **"Obsidian & Light"** theme (Deep Indigo/Slate).
- **Discovery:** Added "Zero Query Search" (Recommendations appear before typing).

### ❌ Rejected / Zombie Ideas
- **Heart Icon:** Rejected as "childish". Switched to **Bookmark** icon.
- **Coupang Blue Color:** Rejected. "Not tech enough".

---

## [2026-01-28] Backend Overhaul & Mobile Pivot
### 🚀 Features & Fixes
- **Parallel Fetcher:** Built backend engine to call Amazon/Walmart/Temu APIs simultaneously.
- **Filter Engine:** Implemented Price Slider & Site Checkbox logic.
- **Emergency Mock:** Created fallback data generator for when API keys hit limits.

### ❌ Rejected / Zombie Ideas
- **Mobile First Development:** Attempted to port PC view to Mobile btopped**. Decided to perfect PC view first ("Comparison needs screen space").

---

## [2026-01-27] The "White Screen" Crisis & Rebirth
### 🚀 Features & Fixes
- **Pivot:** Abandoned initial codebase due to unresolvable errors. Re-initialized project with `create-next-app`.
- **First Success:** Successfully displayed "Lego" search results splitting Amazon (US) and Temu (Global).
- **Layout:** Established 60(Domestic) : 40(Global) split layout.

---

## [2026-01-26] Affiliate Strategy & API Keys
### 🚀 Features & Fixes
- **AliExpress:** Obtained App Key (525832).
- **Stra:** Decided to start MVP with Amazon & AliExpress only.
- **Partnerships:** Applied for CJ Affiliate (iHerb, Wayfair) & Awin (Shein).

---

## [2026-01-25] Project Kickoff & Approvals
### 🚀 Features & Fixes
- Milestones:** Awin Approved (19:23), CJ Affiliate Active (21:02), iHerb Applied (21:57).
- **Targeting:** Shifted from Costco (Rejected) to **iHerb** as primary nutrient supplier.
- **Concept:** Defined POTAL as "Decision Tool" (Domestic vs Global Comparison).
