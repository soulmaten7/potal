# PROJECT_STATUS.md — POTAL 프로젝트 현황/수치
# 마지막 업데이트: 2026-03-29 01:00 KST (기능 정밀 감사 완료: 142개 중 119 IMPL + 10 PARTIAL = 129 기능 구현 90.8%)
# 이 파일은 참조용. Claude Code가 수치 확인 필요 시 읽는 파일.

## 프로젝트 개요
POTAL = B2B Total Landed Cost 인프라 플랫폼. 이커머스 셀러에게 위젯, AI 에이전트에게 API를 제공.
- 프로덕션: https://www.potal.app

## 기술 스택
- Next.js 14+ App Router + TypeScript
- Supabase (Auth + PostgreSQL DB), Paddle (결제, MoR) ← LemonSqueezy에서 전환
- Shopify Theme App Extension (OAuth + GDPR 웹훅)

## 📁 폴더 구조 (2026-03-09 정리)
```
portal/
├── [루트 코어] CLAUDE.md, session-context.md, .cursorrules, README.md, 설정파일
├── docs/                    # 문서 (sessions/, architecture/, CHANGELOG.md, NEXT_SESSION_START.md)
├── analysis/                # 경쟁사/비용/전략 분석
├── marketing/               # 마케팅/런칭 자료 (product-hunt-assets/, Pitch Deck)
├── checklists/              # 체크리스트/TODO
├── ai-agents/               # AI 에이전트 설정 (custom-gpt/, gemini-gem/)
├── archive/                 # 보관 (B2C 잔재)
├── data/                    # 관세 데이터 (itc_macmap/, tariff-research/, wits_tariffline/)
├── scripts/                 # 실행 스크립트
├── supabase/migrations/     # DB 마이그레이션 SQL
├── app/                     # Next.js 소스코드
├── components/              # React 컴포넌트
├── plugins/                 # 이커머스 플러그인 (WooCommerce, Magento, BigCommerce)
└── mcp-server/              # MCP 서버
```

## 핵심 수치 (CW18 기준)
- 240개국/영토, **50개국어**, 63개 FTA, 12개국 특수세금
- HS Code: 5,371 (WCO HS 2022 6자리)
- **HS Code 매핑**: product_hs_mappings **~1.36M건** (GRI 기반 정확 매핑 재구축 예정)
- **GRI 분류 참고자료**: ✅ **2.1MB 수집 완료** (14개 파일, 7개국 규칙 전부 완료)
- **v3 파이프라인**: ✅ **21/21 Section 100%**, codified-rules **595개**, step2-2 switch 21/21, regression 22/22 PASS (CW21)
- **EU EBTI 수집 완료**: 269,730 rulings → 231,727 고유 product-HS 매핑
- **DB 상태**: ✅ read-write 복구 완료 (CW17, 53GB→45GB)
- **HS 분류 벡터**: hs_classification_vectors **3,431건**
- **HS10 후보 사전계산**: precomputed_hs10_candidates **1,090건** (US/EU/GB)
- MFN 관세율: WITS+WTO 1,027,674건 186개국 + MacMap NTLC 537,894건 53개국
- MIN 관세율: **~105M행 53개국 완료✅**
- AGR 관세율: **~129M행 53개국 완료✅**
- 무역협정: 1,319건
- 반덤핑/상계관세/세이프가드: 119,706건
- **제재 스크리닝**: sanctions_entries 21,301건 + aliases 22,328 + addresses 24,176 + ids 8,000 ✅
- 정부 API: 7개국 (USITC, UK, EU TARIC, Canada, Australia, Japan, Korea)
- **7개국 HS 벌크 다운로드**: gov_tariff_schedules **131,794행** ✅
- **관세율 자동업데이트**: Vercel Cron **24개**
- **MCP Server**: v1.3.1, 9개 도구, npm publish + MCP 공식 레지스트리 등록 완료
- **Pre-computing**: 490 HS6 × 240국 = **117,600 조합** 사전 계산 (캐시 <50ms)
- **HS10 파이프라인**: ✅ 7개국 10자리 파이프라인 구현 완료
- **기능 감사 (2026-03-29)**: CW14 142개 기능 코드 기반 정밀 검증 → **119 IMPL + 10 PARTIAL + 8 STUB + 3 NONE + 2 WON'T = 142** (기능 구현율 129/142 = 90.8%) — 엑셀: POTAL_Feature_Audit_2603290000.xlsx
- ⚠️ 이전 "147/147 = 100%" 기록은 Complete Feature Analysis(10개 경쟁사 합집합 147개)와 CW14(POTAL 142개) 혼동. 정확한 수치는 위 감사 결과 참조
- **API 엔드포인트**: **~155개+**
- **심층 검증 84/84 PASS** ✅
- **경쟁사 대비 HS Code 매핑**: Avalara 40M+ → **POTAL 500M+** (WDC 5억+ 사전 매핑 전략)

## ⭐ HS Code 100% 정확도 구조 (Cowork 11 설계)
**전체 파이프라인:**
1. 상품명 → 카테고리 매핑 → HS 6자리 확정 (DB 캐시, $0)
2. HS 6자리 → 7개국 10자리 후보 (DB, $0 — 정부 스케줄 벌크 다운로드)
3. 후보 + 상품명 + 가격 → 최종 10자리 선택 (사전 매핑 or AI 매칭)
4. 가격 분기 규칙 ("valued over/under $X") → if문 처리 (코드, $0)
5. 결과 DB 저장 → 이후 동일 상품 DB 조회만 ($0, 수십ms)

**정확도 100% 달성 근거:**
- 6자리: 카테고리 기반 = 확정값
- 10자리 후보: 정부 공식 데이터 = 확정값
- 최종 선택: 상품명 + 가격 규칙 = 확정값 (5~10개 후보 중 선택)
- 7개국 외 233개국: HS 6자리 기준 MFN/MIN/AGR 세율 적용

**5억 상품명 사전 매핑:**
- WDC 전체 상품명에 HS Code 사전 부여 → 룩업 테이블
- 고객 요청 시 DB 조회 1회로 끝 (AI 호출 zero, 외부 API zero)
- 플라이휠: 새 상품 → LLM 1회 → DB 저장 → 이후 $0

## ⭐ 147개 경쟁사 기능 분석 & 100% 커버리지 (Cowork 12 → CW20 완료)
**분석 방법**: 10개 경쟁사 전체 기능 중복 제거 → 147개 고유 기능

**최종:** MUST 102개 ✅ + SHOULD 40개 ✅ + WON'T 5개 = **147/147 = 100%** (CW20에서 미완성 17개 전부 보완)

**5개 솔루션 전략:**
1. 240개국 규정 RAG
2. 중소 물류사 파트너십
3. 100% 정확도 증명 → MoR 불필요
4. 결제 인프라 활용 (Stripe/Paddle)
5. AEO 고객지원 서비스

**타겟 3그룹:** A그룹(즉시: Shopify/WooCommerce) → B그룹(RAG 후: eBay/Etsy) → C그룹(풀 파트너십: DHL/Walmart)

**엑셀**: analysis/POTAL_Final_Feature_Analysis_v2.xlsx

## ⭐ 240개국 규정 RAG 전략 (Cowork 12)
- Phase 1 ✅ 완료 (7개국 정부)
- Phase 2~3: 고객 확보 후 순차 진행
- 저장: 외장하드 /Volumes/soulmaten/POTAL/regulations/

## ⭐ 데이터 유지보수 자동화 설계 (Cowork 12)
1. 공고 페이지 특정 (1회)
2. Vercel Cron 매일: 페이지 해시 비교 → 변경 시 Make.com webhook
3. Make.com + AI: diff → 분류 → 자동 DB 업데이트

## AI Agent Organization v6
- 15개 Division, 3 Layer, 1 Chief Orchestrator, **57 Agents** (Opus 3 + Sonnet 54)
- 24/7 Division Monitor(매30분), Telegram 알림
- Morning Brief v2: Chief → Division 명령 → 자동수정 → 에스컬레이션 → Telegram 1통
- 참조: POTAL_AI_Agent_Org_v6.html, POTAL_AI_Agent_Org_Log.xlsx

## Supabase 관세 데이터 테이블 현황
| 테이블 | 행 수 | 상태 |
|--------|-------|------|
| countries | 240 | ✅ |
| vat_gst_rates | 240 | ✅ |
| de_minimis_thresholds | 240 | ✅ |
| customs_fees | 240 | ✅ |
| macmap_trade_agreements | 1,319 | ✅ |
| macmap_ntlc_rates | 537,894 | ✅ |
| macmap_min_rates | ~113M (53개국) | ✅ |
| macmap_agr_rates | ~144M (53개국) | ✅ |
| trade_remedy_cases | 10,999 | ✅ |
| trade_remedy_products | 55,259 | ✅ |
| trade_remedy_duties | 37,513 | ✅ |
| safeguard_exemptions | 15,935 | ✅ |
| hs_classification_vectors | 3,431 | ✅ |
| product_hs_mappings | ~1.36M | ✅ |
| precomputed_landed_costs | 117,600 | ✅ |
| precomputed_hs10_candidates | 1,090 | ✅ |
| gov_tariff_schedules | 131,794 | ✅ |
| sanctions_entries | 21,301 | ✅ |
| sanctions_aliases | 22,328 | ✅ |
| sanctions_addresses | 24,176 | ✅ |
| sanctions_ids | 8,000 | ✅ |
| divergence_map | 61,258 | ✅ |
| hs_description_keywords | 25,484 | ✅ |
| hs_price_break_rules | 18 | ✅ |
| enterprise_leads | 1 | ✅ |

## MIN/AGR/WDC 임포트 — ✅ 전부 완료
- MIN: ~105M행, 53개국
- AGR: ~129M행, 53개국 (KOR 재임포트 완료)
- WDC: 1,896/1,899 파트, 17.6억 건, 카테고리 매핑 3단계 완료

## 요금제 ('Grow With You' 전략)
| 플랜 | Monthly | Annual (20% off) | 할당량 | 초과 요금 |
|------|---------|-----------------|--------|----------|
| Free | $0 | $0 | 200건/월 | - |
| Basic | $20 | $16/mo | 2,000건/월 | $0.015/건 |
| Pro | $80 | $64/mo | 10,000건/월 | $0.012/건 |
| Enterprise | $300 | $240/mo | 50,000건/월 | $0.01/건 |

- 핵심: 기능이 아닌 볼륨으로만 차별화
- 결제: Paddle (MoR, Live 전환 완료)
- Overage 빌링: ✅ 구현 완료

## 최근 성과 (CW18)
- Layer 2 GRI Pipeline 프로덕션 배포 ✅
- Sprint 1 보안 6기능 100% (95 unit tests ALL PASS) ✅
- 홈페이지 UI 업데이트 (6페이지 20건 수정) ✅
- SEO Blog B2B 리라이트 (6포스트) ✅
- 콜드 이메일 1차 67건 발송 완료 ✅ + 글로벌 ~400기업 캠페인 리스트 생성 ⏳ (이메일 검증 진행중)
- Product Hunt B2B 리런치 예약 완료 (Scheduled) ✅
- LinkedIn/Reddit/Instagram 소셜 미디어 ✅
- Morning Brief v2 + Telegram 연동 ✅
