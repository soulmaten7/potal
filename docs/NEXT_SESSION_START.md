# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-17 22:00 KST (CW16 Cowork — GRI Agent Team 설계, 7개국 규칙 수집 완료, DB 복구 진행)

---

## 🚀 새 세션 시작 명령어 (복사해서 붙여넣기)

### Cowork 세션용
Cowork에서 새 세션을 시작할 때는 아래 명령어를 그대로 복사해서 첫 메시지로 보내세요:

```
POTAL Chief Orchestrator 세션 시작.

너는 POTAL의 Chief Orchestrator다. 은태 = CEO, 너 = COO.

1단계: 컨텍스트 로딩
- CLAUDE.md 읽어서 프로젝트 전체 맥락 파악
- docs/NEXT_SESSION_START.md 읽어서 현재 진행 상황 + 우선순위 확인

2단계: 백그라운드 작업 확인
- KOR AGR 재임포트: ✅ 완료
- WDC 추출: ✅ 완료 (1,896/1,899 파트)
- WDC Phase 4 v2 매칭: ✅ 완료 (49,265,581건)
- WDC Phase 4 v2 업로드: ❌ 중단 — 36M건은 카테고리 추정 매핑(부정확) → 삭제 결정 → 삭제 진행 후 완료 확인 필요
- DB read-only: ⚠️ 36M건 삭제 + VACUUM FULL 후 복구 확인 필요
- GRI 참고자료 수집: ✅ 완료 (14개 파일, 2.1MB, /Volumes/soulmaten/POTAL/hs_classification_rules/)
- EU EBTI 수집: ✅ 완료 (269,730 rulings, 231,727 매핑)
- 7개국 추가 규칙: ✅ 완료 (US/EU/UK/KR/JP/AU/CA)

3단계: Morning Brief 실행
- Gmail에서 "Morning Brief" 또는 "health-check" 관련 이메일 확인
- contact@potal.app 수신함에서 자동 알림 이메일 확인
- 15개 Division 상태를 Morning Brief 포맷으로 보고:
  🟢 정상 / 🟡 주의 / 🔴 긴급

4단계: 오늘 작업 추천
- NEXT_SESSION_START.md의 우선순위 기반으로 P0부터 추천
- 은태 판단 후 작업 시작

보고는 한국어로, Yellow/Red만 상세히, Green은 개수만.
```

### Claude Code 세션용
Claude Code 터미널에서 새 세션을 시작할 때:

```
POTAL Chief Orchestrator 세션 시작.
1. cat CLAUDE.md | head -200 으로 프로젝트 맥락 파악
2. cat docs/NEXT_SESSION_START.md 로 현재 상태 + 우선순위 확인
3. KOR AGR 확인: curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query -H "Authorization: Bearer ***REDACTED***" -H "Content-Type: application/json" -d '{"query": "SELECT count(*) FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'';"}'
4. Morning Brief: curl -s "https://www.potal.app/api/v1/admin/morning-brief" -H "x-cron-secret: 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297" | python3 -m json.tool
5. 결과 종합해서 Morning Brief 포맷으로 보고
6. 은태 판단 후 P0부터 작업 시작
```

### 간편 명령어 (Cowork 전용)
매일 아침 출근하면 이것만 입력:
```
모닝브리핑
```
→ 모닝브리핑 스킬이 자동으로 Gmail 확인 + 프로젝트 상태 + 추천 작업까지 한번에 처리

---

## 🎯 다음 세션 우선순위

### P0 — 즉시 (DB 복구 + GRI 엔진)
1. **DB read-only 복구 확인** — 36M건 삭제 완료 + VACUUM FULL + read-write 확인 + www.potal.app 정상 동작 확인
2. **판례 → 대립 패턴 규칙화** — CBP CROSS 22만건 + EBTI 27만건을 챕터별로 정리
   - 각 패턴: 대립 후보 + 정답 + 근거 + 탈락이유 + 예외
   - 97 Chapter × 평균 10~20 패턴 = ~1,000~2,000 규칙
3. **GRI Agent Team 구축** — 11단계 코드 체인 + AI 최소 호출
4. **7 Country Agent 구축** — US/EU/UK/KR/JP/AU/CA 각각 전용 프롬프트 + 규칙 파일
5. **CBP 100건 벤치마크 테스트** — 이전 v10(38%) 대비 개선 확인, 목표 89%+

### P1 — 이번 주 (12개 TLC 구조화)
6. **12개 TLC 계산 영역 전체 구조화** — 각 영역의 "사람 프로세스" 역설계 → 코드화
7. **142개 기능 동일 접근** — 각 기능마다 실무자 프로세스 역설계 → 단계별 자동화

### P2 — Beta 출시 준비
8. **Beta 출시** — Pro 모델까지 개방, 핵심 12개 계산 완성 후
9. **파이프라인 확장** — 142개 기능 계속 추가

### ⭐ 핵심 전략 변화 (CW16 Cowork)
- **"시스템을 바꾸지 말고 사람을 대체하라"** — 관세사/세무사의 실무 프로세스를 그대로 자동화
- **"한 마디로 AI한테 시키지 말고, 공식을 찾아서 단계별 코드로 만들고, 판단 필요한 곳만 AI"**
- 이 원칙을 HS Code뿐 아니라 12개 TLC 전체 → 142개 기능 전체에 적용
- GRI Agent Team = 첫 번째 적용 사례, 성공하면 나머지에 동일 패턴 확장

---

## ⚠️ CW9.5 + Cycle 4-5에서 완료된 사항

### Chief Orchestrator 사이클 1~5
- **사이클 1**: 15 Division 전체 순회, Red 1→0, Yellow 5→3, Green 9→12
- **사이클 2**: 제품 완성도 7항목 (위젯, Shopify, 보안, i18n, SEO, 에러핸들링)
- **사이클 3**: Paddle 환불API + CSL 21K건 + UI/UX 6개 개선
- **사이클 4**: 야간 15 Division 전체 정밀 점검 ✅ — ContactForm 수정, 쿠키 배너, .env 보강
- **사이클 5**: D15 Intelligence Dashboard + AI 플랫폼 업데이트 + QA + 문서 동기화
- **사이클 6 (CW10)**: Morning Brief 3섹션 강화 (auto_resolved/needs_attention/all_green) + issue-classifier.ts + auto-remediation.ts

### CW15 Cowork — 홈페이지 UX 동기화 + 프로덕션 안정화 + WDC Phase 4 v2 (2026-03-16 03:00~09:30 KST)
- **B2B 채널 전략 엑셀 ✅**: POTAL_B2B_Channel_Strategy.xlsx (12시트, 10채널, 경쟁사 비교표, 채널별 포스트 초안)
- **홈페이지 UX 동기화 ✅**: ~60파일 수정 (수치 불일치 전부 교정, Claude Code 실행)
- **Vercel 프로덕션 안정화 ✅**: Tariff SSR 전환(빌드 36초), Middleware fail-open(5s), 504 해결
- **Hero 수치 변경 ✅**: "5,371 HS Codes"→"113M+ Tariff Records", "181 Countries"→"50 Languages"
- **WDC Phase 4 v1→v2 전환**: v1 중단(DB 과부하) → v2 로컬 병렬 매칭(14,329/s, 28배 속도, ETA ~4일)
- **product_hs_mappings**: 8,389 → **~1.36M** (v1 결과 포함)
- **Git Commits**: aa02b92(middleware), 0c0a221(tariff SSR), 1864653(hero stats)
- **명령어 파일**: HOMEPAGE_UX_SYNC_COMMAND.md, WDC_PHASE4_V2_COMMAND.md

### CW14 Cowork 후반 — 37개 S+ 업그레이드, 142 Excel, PDF lib, B2B 전략 (2026-03-16 00:00~03:00 KST)
- **37개 기능 S+ 업그레이드 ✅** (Core 16 + Trade 21, 32분 19초): ~45 API Routes + ~25 Library Files + 111 Tests + 1 Migration, TypeScript 0 errors, API 103→~148개
- **142-Feature S+ Master Plan Excel ✅**: analysis/POTAL_142_S_Grade_Complete_Plan.xlsx (15시트, S1/S2/S3)
- **PDF 라이브러리 ✅** (커밋 fc066d0): pdf-lib + pdf-generator.ts + 3개 API 엔드포인트
- **B2B 마케팅 전략 ✅**: 7개 채널 확정 + 핵심 메시지 + 글 작성 예정
- **S_GRADE_VERIFICATION_REPORT.md 생성 ✅**

### CW14 Cowork — Full Audit, 보안 수정, UX 53/53, WDC Phase 4, 규정 Phase 2 (2026-03-15)
- **Full Project Audit ✅**: docs/FULL_PROJECT_AUDIT.md 생성 (59 DB 테이블, 103 API 엔드포인트, product_hs_mappings 8,389, vectors 3,431)
- **보안 수정 ✅** (커밋 701572b): 하드코딩 토큰 19파일 → 환경변수, SERVICE_ROLE_KEY 설정, 임시파일 정리
- **UX Audit 53/53 완료 ✅**: Batch 1(15) + Batch 2(16) + Batch 3(12) + 이미구현5 + 미구현사유5, 빌드 통과
- **WDC Phase 4 ✅**: wdc_phase4_bulk_mapping.py 작성 + 백그라운드 실행중 (5억+ 상품명 사전 매핑)
- **운영 도구 ✅**: POTAL_SESSION_BOOT_SEQUENCE.md (3단 부트), FULL_PROJECT_AUDIT_COMMAND.md (7단계 감사)
- **규정 수집 Phase 2**: WTO(reporters 288, indicators 56, tariff profiles 36국/39MB) + WCO(sections 21, chapters 96). WITS ❌(API 405), OECD ❌(폐지)

### CW13 Cowork 후반 — npm publish, MCP 레지스트리, Custom LLM, B2B 전략 (2026-03-15 00:00~14:00 KST)
- **npm publish ✅**: `potal-mcp-server@1.3.1` npm 공개 패키지 (npmjs.com/package/potal-mcp-server)
- **MCP 공식 레지스트리 ✅**: `io.github.soulmaten7/potal` (registry.modelcontextprotocol.io, status: active)
- **Custom LLM 3종 리라이트 + 수동 배포**: GPT Actions(B2B CTA) → ChatGPT 에디터 복사 ✅, Gemini Gem(정적+CTA) → AI Studio 업데이트 ✅ (설명+요청사항+CSV v2), Meta AI(정적+CTA) → Studio 업데이트 시 적용
- **LLM 수익화 전략**: GPT="쇼룸"(API직접호출, Free200), Gem/Meta="광고판"(정적+CTA), API="공장"(B2B수익)
- **Gemini CSV v2**: country-duty-reference-v2.csv (240국+30개국 상세노트) Gem 지식 업로드 ✅
- **MCP 디렉토리**: mcp.so 제출 ✅(리뷰대기), glama.ai=auto-crawling(제출폼없음), smithery.ai=HTTP필요(스킵)
- **npm 계정**: potal_official (Granular Token, Bypass 2FA)
- **B2B 아웃리치**: 15개 타겟 4티어 + 콜드이메일 3종 (B2B_OUTREACH_TARGETS.md)
- **UCP 발견**: Google+Shopify+Walmart+Target Universal Commerce Protocol — MCP 내장, 관세 없음 = POTAL 기회
- **Pre-computing ✅**: 490 HS6 × 240국 = 117,600 조합 사전 계산 (캐시 <50ms)
- **HS10 파이프라인 ✅**: 7개국 10자리 파이프라인 구현 완료
- **경쟁력 평가**: Data Tier0, Features Tier1, Price Tier0, Architecture Tier1, Validation Tier3(고객 부재)

### CW13 Cowork — UX Audit + 'Grow With You' 요금제 + Paddle 버그 수정 (2026-03-14 15:00~23:30 KST)
- **Enterprise Sales 자동화 ✅**: 12단계 파이프라인 동작 확인 (enterprise_leads + Telegram 알림 + Resend 이메일)
- **Enterprise Inquiry 버그 수정**: Supabase RLS 비활성화 + lazy init(getSupabase()) → "Failed to save lead" 해결
- **UX Audit TOP 10 구현**: 53항목 감사 → Glassmorphism Header, Hero "113M+ Tariff Records", Footer 소셜+Trust Badges
- **'Grow With You' 요금제 전략**: Free 100→200건, Pro 기능 전체 Free/Basic 개방 (Batch API/Webhook/Dashboard)
- **Batch 한도**: Free 50건 / Basic 100건 / Pro 500건 / Enterprise 5,000건
- **수익 시뮬레이션**: 현재 $26,164 vs 'Grow With You' $51,558 = +97.1% (POTAL_Pricing_Strategy_Analysis.xlsx)
- **Paddle 구독 취소 버그**: subscription.cancelled → plan 유지 + current_period_end → 기간 만료 후 Free
- **subscription-cleanup Cron 신규** (14번째): 매일 03:00 UTC 만료 구독 Free 전환
- **Compare Plans 테이블 통일**: Free 10-digit HS ✓, FX ✓, FTA ✓, AD-CVD ✓, 12 Countries, 30+ Languages
- **Seller Profile Auto-Creation**: Dashboard에서 sellers 없으면 자동 생성
- **Git Commits**: fa9e10f, 05b8f0e, 301aa9e, 72ca35d, 85239e5 + Compare Plans
- **파일 생성**: subscription-cleanup/route.ts, POTAL_UX_AUDIT_CW13.md, POTAL_Pricing_Strategy_Analysis.xlsx, CLAUDE_CODE_ENTERPRISE_IMPLEMENTATION.md
- **파일 수정**: vercel.json, webhook/route.ts, middleware.ts, plan-checker.ts, keys.ts, DashboardContent.tsx, pricing/page.tsx, page.tsx, developers/page.tsx, Header.tsx, Footer.tsx

### Cowork 12 후반 — 142/147 기능 전부 구현 + 심층 검증 84/84 PASS (2026-03-14)
- **44/44 MUST 구현 완료** (~45분): P0 12개 + P1 15개 + P2 17개
- **SHOULD 40개 구현 완료** (~10분): 회계연동, 파트너에코, 배송분석, MoR, 사기방지, 주문/재고, 교육, 마켓플레이스 등
- **최종: MUST 102 + SHOULD 40 = 142/147 (96.6%)**, WON'T 5개만 제외
- **심층 검증 84/84 PASS** ✅ (02:30 KST): 81 확실 + 3 수정후확실(F082·F083·F147 DB테이블생성), 코드 변경 0건
- DB 테이블 5개 생성: marketplace_connections, erp_connections, tax_exemption_certificates, partner_accounts, partner_referrals
- 빌드 통과 + git push 완료
- **사조(SAZO) 분석**: 경쟁사 아님, **잠재 고객** (B2C 플랫폼 = POTAL 인프라 소비자)

### 백그라운드 작업 상태
- **WDC Phase 4 v2**: 🔄 실행중 (PID 80966, 2 workers, `nice -n 15`, ETA ~4일)
  - 모니터링: `tail -f /Volumes/soulmaten/POTAL/wdc-products/v2_results/v2.log`
  - 결과 저장: /Volumes/soulmaten/POTAL/wdc-products/v2_results/matched_part_*.csv
  - 완료 후: 결과 합치기 → 중복 제거 → Supabase 벌크 업로드 (500건씩 batch)
- 터미널 2: ✅ CBP CROSS Rulings 수집 완료 (220,114/220,153건, 99.98%) — 규정 Phase 1 전체 완료
- 터미널 3: ✅ WDC 추출 완료 (1,896/1,899 파트, 17.6억 건, 미추출: part_132/404/711.gz 손상)
- WDC Phase 3: ✅ 완료 (product_hs_mappings 3,406, 벡터 3,431, hs10_candidates 1,246, commit dbc5e59 push 완료)
- WDC Phase 4 v1: ✅ 중단 (12M 처리, ~1.34M 삽입 → DB 과부하로 중단, v2로 대체)

### Cowork 12 — 147개 경쟁사 기능 분석 + 240개국 규정 RAG + 데이터 유지보수 (2026-03-13)
- **147개 경쟁사 기능 분석**: 10개 경쟁사 전체 기능 중복 제거 → 147개 고유 기능
- **96.6% 커버리지**: MUST 102개 **전부 구현 완료** ✅ / SHOULD 40 / WON'T 5
- **5개 솔루션 (WON'T 60→5)**: RAG, 물류파트너십, 정확도증명, 결제인프라, AEO지원
- **타겟 거래처 3그룹**: A(Shopify/WooCommerce/국가우편), B(eBay/Etsy), C(DHL/Walmart)
- **범용 HS Code 계산기**: 볼트, DDR5 SDRAM 등 산업부품도 분류 가능 증명
- **240개국 규정 RAG**: 관세법/세법/무역규정 벡터 DB → "관세사/세무사 AI". 수집 진행중
- **데이터 유지보수**: 공고 페이지 해시 비교(Cron) + Make.com AI 변경 해석 + 자동 DB 업데이트
- **시장 평가**: 설계 90점, 가장 빠른 과제는 첫 유료 고객 10개
- **엑셀 4종**: analysis/POTAL_Final_Feature_Analysis_v2.xlsx (최종본)

### Cowork 11 — HS Code 100% 정확도 구조 설계 (2026-03-12)
- **전략 세션**: 은태님과 HS Code 파이프라인 전체 구조 설계
- **WDC 카테고리→HS6 1단계 완료**: 145 카테고리 → 1,017 매핑 (+853), 비용 $0.01
- **7개국 벌크 다운로드 시작**: US/EU/UK/CA/AU/JP/KR HS 8~10자리 전체 스케줄
- **5억 사전 매핑 전략 확정**: 카테고리→6자리→10자리후보→매칭→룩업테이블
- **가격 분기 규칙**: "valued over/under $X" → if문 처리 → 세금 100% 정확
- **플라이휠 캐시**: 새 상품 LLM 1회→DB 저장→이후 $0
- **경쟁사 우위**: "500M+ HS Code Classifications" (vs Avalara 40M+)
- **핵심 인사이트**: 카테고리가 HS 6자리의 핵심, 상품명은 세분화용. 정부 API 후보 5~10개 중 선택은 어렵지 않음

### CW10 — AI Agent Organization Day 1
- **AI Agent Org 정식 운영 개시**: Division 팀장 = if/else 분류 로직 (AI 아님), Layer 1-2 자동 처리, Layer 3만 CEO 판단
- **Morning Brief 강화**: 3섹션 리포트 (자동수정/판단필요/정상) + contact@potal.app 이메일 알림
- **모닝브리핑 스킬**: Cowork에서 "모닝브리핑" 입력 시 Gmail + CLAUDE.md 기반 일일 브리핑 자동 실행
- **자동 수정 시스템**: issue-classifier.ts (15 Division Layer 분류) + auto-remediation.ts (Cron 3x 재시도)
- **이메일 리뷰**: Paddle Live, Khurram Shoaib 보안 리포트 (답장 완료), Shopify, Product Hunt
- **P1 #1 관세최적화**: lookupAllDutyRates() — MIN/AGR/NTLC 병렬 조회, 최저 세율 자동 선택, tariffOptimization 응답
- **P1 #8 기업별 AD 관세**: trade-remedy-lookup.ts firm-specific 강화 + pg_trgm fuzzy search(search_firm_trgm DB함수)
- **P1 #9 heading 세분화**: heading-subdivider.ts 신규 — material/gender/description 3단계 전략, classifier.ts 통합
- **#17 관세율 실시간**: cron 주간→일간(매일 04:00 UTC) + dataFreshness 응답
- **#37 Drawback API**: /api/v1/drawback — 반품 관세 환급 계산 (16개국 규칙)
- **#2 EU VAT 세분화**: eu-vat-rates.ts — EU 12개국 HS 챕터별 reduced VAT rate
- **#40 MCP v1.3**: 7→9 tools (generate_document + compare_countries)
- **#20 Incoterms**: EXW/FOB/CIF/DDP/DDU 5개 조건 + incotermsBreakdown
- 47기능 42개 완료
- **Vector DB 시딩**: product_hs_mappings 164건 → hs_classification_vectors 163건. 파이프라인 정확도 55%→100%
- **Vercel 환경변수 세팅 완료**: RESEND_API_KEY + MORNING_BRIEF_EMAIL_TO + MORNING_BRIEF_EMAIL_FROM

### 데이터 로딩
- **SDN 제재**: 63,004건 (entries+aliases+addresses+IDs) + CSL 6,701건 = **총 21,301건 (19개 소스)**
- **AGR 관세율**: ✅ ~144M행, **53/53국 완료** (KOR 재임포트 별도 진행중)
- **Google Taxonomy**: 164건 HS 매핑 → product_hs_mappings
- **DB 마이그레이션**: sanctions 5테이블 + exchange_rate_history + search_sanctions_fuzzy()

### AI 플랫폼 업데이트 (Cycle 5 → CW13 후반 전면 리라이트)
- Custom GPT: ~~screening, FTA, classify 3개 액션 추가~~ → **전면 리라이트** "Global Landed Cost Infrastructure" + calculateLandedCost/listSupportedCountries/screenDeniedParty/lookupFTA/classifyProduct 5개 액션, B2B CTA, "Powered by POTAL" 푸터
- MCP Server: v1.2→**v1.3.1** (7→9 tools: +generate_document, compare_countries). **npm publish ✅** (`potal-mcp-server@1.3.1`). **MCP 공식 레지스트리 ✅** (`io.github.soulmaten7/potal`)
- Gemini Gem: **전면 리라이트** — 정적 참고 데이터 + potal.app CTA (외부 API 미지원). CSV v2(240국+30국 상세) 업로드 ✅
- Meta AI: **전면 리라이트** — Gemini과 동일 정적데이터+CTA 전략

---

## 현재 진행 중인 백그라운드 작업

### KOR AGR 재임포트 — ✅ 완료
- KOR total 값 불일치 (15,798 vs 1,845,798) → **재임포트 완료 (1,815,798행, 2026-03-13)**
- AGR 53/53국 전체 완료

### WDC 상품 추출 (Mac) — ✅ 완료
- **1,896/1,899 파트 완료 (99.8%)** — 17.6억 건 (1,761,211,362)
- products_detailed.jsonl 324GB + products_summary.csv 204GB
- 미추출 3개: part_132.gz, part_404.gz, part_711.gz (손상, 영향 미미)
- **1단계 카테고리→HS6 매핑 완료** ✅ (145 카테고리 → 1,017 매핑)
- **2단계 카테고리 확장 완료** ✅ (38 신규 카테고리 → 1,055 매핑, 1,104 벡터)
- **3단계 상품명 세분화 완료** ✅ (product_hs_mappings 8,389, 벡터 3,431)

### 7개국 HS 벌크 다운로드 — ✅ 완료
- **gov_tariff_schedules**: US 28,718 + EU 17,278 + UK 17,289 + KR 6,646 + CA 6,626 + AU 6,652 + JP 6,633 = **89,842행**
- US/EU/UK: 정부 REST API (HS 8-10자리) / KR/CA/AU/JP: WTO API (HS 6자리, 정부 API 없음)
- **저장**: 외장하드 /Volumes/soulmaten/POTAL/hs-bulk/ + Supabase DB 직접 임포트

### CBP CROSS Rulings 다운로드 — ✅ 완료
- 220,114/220,153건 수집 (99.98%), 244MB, 37 JSON 파일

### 240개국 규정 데이터 수집 — 🔄 진행중
- Phase 1(7개국): ✅ 완료 (USITC+CBP CROSS+eCFR×2+OFAC SDN)
- Phase 2(국제기구): 🔄 부분 완료 (WTO 36/227국, WCO ✅, WITS ❌, OECD ❌)
- Phase 3(지역+나머지): 대기
- **저장**: 외장하드 /Volumes/soulmaten/POTAL/regulations/
- WTO tariff profiles 재실행 시 기존 36국 skip, 나머지부터 수집 (resume 지원)

### WDC Phase 4 벌크 매핑 — 🔄 실행중
- wdc_phase4_bulk_mapping.py 백그라운드 실행중
- 5억+ 상품명 → HS Code 사전 매핑

---

## 다음 세션 우선순위 (CW13 후반~CW14)

### 🔴 P0 — 즉시
1. **Auth JWT 수정**: Vercel SUPABASE_SERVICE_ROLE_KEY를 JWT 형식(eyJ...)으로 교체 — P1 14개 기능의 Auth 실패 원인
2. ~~**npm publish + MCP 레지스트리**~~ ✅ 완료 (potal-mcp-server@1.3.1 + io.github.soulmaten7/potal)
3. ~~**Custom LLM 3종 리라이트**~~ ✅ 완료 (GPT Actions/Gemini Gem/Meta AI)
4. ~~**Pre-computing**~~ ✅ 완료 (117,600 조합)
5. ~~**HS10 파이프라인**~~ ✅ 완료 (7개국)
6. ~~**WDC Phase 3 상품명 세분화**~~ ✅ 완료 (product_hs_mappings 1,055→3,406, 벡터 3,431, hs10_candidates 1,246)
7. ~~**240개국 규정 수집 Phase 1**~~ ✅ 완료 (5소스: USITC+CBP CROSS 220,114건+eCFR×2+OFAC SDN). Phase 2~3 대기
8. ~~**UX Audit 나머지 43항목**~~ ✅ 완료 (53/53, Batch 1+2+3 전부 구현, 빌드 통과)
9. ~~**GPT Actions 지침 수동 복사**~~ ✅ 완료 (ChatGPT GPT 에디터에 gpt-instructions.md 복사-붙여넣기)
10. ~~**Gemini Gem 지침 수동 복사**~~ ✅ 완료 (Google AI Studio에 설명+요청사항+지식CSV v2 업데이트)
11. ~~**mcp.so 등록**~~ ✅ 제출 완료 (리뷰 대기) | glama.ai = submit 폼 없음(auto-crawling) | smithery.ai = HTTP 필요(stdio 미지원, 스킵)

### 🔴 P1 — 이번 주
1. **B2B 아웃리치 실행**: 15개 타겟 4티어 콜드이메일 발송 시작 (B2B_OUTREACH_TARGETS.md 기반)
2. **UCP 생태계 진입 전략**: Google/Shopify UCP에 POTAL MCP 서버 연동 제안
3. **5억 상품명 사전 매핑 파이프라인**: WDC 전체 상품명 → HS 10자리 룩업 테이블 생성
4. **가격 분기 규칙 테이블**: "valued over/under $X" 조건 코드 추출 → 규칙화
5. **첫 유료 고객 10개 확보 전략 실행**: A그룹(Shopify/WooCommerce) + AI플랫폼 + 크로스보더 플랫폼(사조 등)
6. **API category 필드 강화**: /api/v1/calculate에 category 필수/강력 권장
7. **Dashboard 142개 기능 UI 확장**: 현재 8개 메뉴 → 전체 기능 노출

### 🟡 P2 — 다음 주
1. **데이터 유지보수 Cron 구현**: 240개국별 공고 URL 목록 → Vercel Cron 해시 비교 → Make.com webhook 연동
2. **자체 테스트** — 벌크 다운로드/규정 수집 완료 후 종합 테스트
3. **Keyword 정확도 개선** — 1,055 매핑으로 대폭 개선 예상
4. **A그룹 타겟 거래처 접근 전략** — Shopify 41K+ 스토어 마케팅
5. **Enterprise proposal 스킬 테스트**: enterprise-proposal.skill 실제 발송 테스트

### 🟢 P3 — 런칭 준비
1. **베타 유저 테스트** — 지인 셀러 2~3명
2. **첫 유료 고객 10개** — 시장 평가에서 가장 빠른 과제로 확인
3. **Soft Launch**: Product Hunt — PH 에셋 5개 + 런칭플랜 준비
4. **Public Launch**: 4월 초

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live + Overage 빌링 + 환불 API
- **요금제**: ✅ Free/Basic/Pro/Enterprise 완료
- **제재 스크리닝**: ✅ 21,301건, 19개 소스 (OFAC SDN + CSL)
- **AI Agent Org v4**: ✅ Chief Orchestrator 정식 운영, 15 Division 전체 Green, Division 이름 10개 변경
- **Layer 1**: ✅ Vercel Cron **14개** + auto-remediation (Cron 3x 재시도) + division-monitor 매30분 + enterprise-lead-match 매30분 + subscription-cleanup 매일 03:00 UTC
- **Layer 2**: ✅ Morning Brief 3섹션 + Dashboard + Division Checklists + issue-classifier
- **24/7 Monitor**: ✅ division-monitor API + Telegram 알림 + Make.com/Email 폴백
- **'Grow With You' 요금제**: ✅ Free 200건, 모든 기능 전 플랜 동일, 볼륨+브랜딩만 차별화
- **Paddle 구독 취소**: ✅ 잔여 기간 유지 + subscription-cleanup Cron으로 만료 시 Free 전환
- **Enterprise Sales**: ✅ 폼→API→DB→Resend이메일→Telegram알림 전체 파이프라인 동작
- **모닝브리핑 스킬**: ✅ Cowork 설치 완료 ("모닝브리핑" 트리거)
- **D15**: ✅ Intelligence Dashboard 구축 완료
- **Git push**: Mac 터미널 또는 Claude Code (bypass permissions)
- **AGR**: ✅ 53/53국 완료 (KOR 재임포트 완료 1,815,798행)
- **Resend API Key**: ✅ 발급 + Vercel 환경변수 세팅 완료
- **관세최적화 (#1)**: ✅ lookupAllDutyRates() 구현 완료, tariffOptimization 응답
- **기업별 AD 관세 (#8)**: ✅ firm-specific AD/CVD matching + pg_trgm fuzzy search
- **heading 세분화 (#9)**: ✅ heading-subdivider.ts — material/gender/description 3단계 subheading 선택
- **관세율 실시간 (#17)**: ✅ cron 주간→일간
- **Drawback (#37)**: ✅ /api/v1/drawback — 16개국 관세 환급 API
- **EU VAT 세분화 (#2)**: ✅ 12개국 HS 챕터별 reduced rate
- **MCP v1.3.1**: ✅ 9 tools + npm publish (`potal-mcp-server@1.3.1`) + MCP 공식 레지스트리 (`io.github.soulmaten7/potal`)
- **UCP**: ✅ Universal Commerce Protocol 발견 — Google+Shopify+Walmart+Target, MCP 내장, 관세 없음 = POTAL 기회
- **Pre-computing**: ✅ 490 HS6 × 240국 = 117,600 조합, 캐시 <50ms
- **B2B 아웃리치**: ✅ 15개 타겟 4티어 + 콜드이메일 3종 (ai-agents/B2B_OUTREACH_TARGETS.md)
- **Custom LLM 3종 리라이트**: ✅ GPT Actions(B2B CTA), Gemini Gem(정적+CTA), Meta AI(정적+CTA)
- **Incoterms (#20)**: ✅ EXW/FOB/CIF/DDP/DDU + who-pays-what
- 47기능 42개 완료
- **Vector DB 시딩**: ✅ hs_classification_vectors **3,431건** (CW14: 1,104→3,431), 파이프라인 정확도 100%
- **WDC 카테고리→HS6 1~3단계**: ✅ product_hs_mappings **3,406건** (CW14: 1,055→3,406, Phase 3 상품명 세분화), 벡터 3,431건, hs10_candidates 1,246건
- **7개국 HS 10자리 벌크 다운로드**: ✅ 완료 (gov_tariff_schedules 89,842행)
- **5억 사전 매핑 전략**: ✅ 확정 — 카테고리→HS6→10자리후보→상품명+가격매칭→룩업테이블
- **HS Code 정확도**: ✅ 100% 구조 설계 완료 (6자리: 카테고리확정, 10자리: DB후보+규칙, 가격분기: if문)
- **경쟁사 대비**: Avalara 40M+ → **POTAL 500M+** HS Code Classifications
- **147개 경쟁사 기능 분석 (CW12)**: ✅ 96.6% 커버리지 (102 MUST/40 SHOULD/5 WON'T)
- **240개국 규정 RAG Phase 1**: ✅ 완료 (5소스: USITC 35,733 + CBP CROSS 220,114 + eCFR Title 19/15 + OFAC SDN)
- **규정 RAG Phase 2**: 🔄 부분 완료 (WTO 36/227국+WCO ✅, WITS/OECD ❌)
- **UX Audit**: ✅ 53/53 완료 (Batch 1+2+3, 빌드 통과)
- **Full Project Audit**: ✅ docs/FULL_PROJECT_AUDIT.md (59 DB, 103 API, product_hs_mappings 8,389)
- **보안 수정**: ✅ 하드코딩 토큰 19파일→환경변수 (커밋 701572b)
- **Boot Sequence**: ✅ POTAL_SESSION_BOOT_SEQUENCE.md (3단 부트) + FULL_PROJECT_AUDIT_COMMAND.md (7단계 감사)
- **데이터 유지보수 자동화 (CW12)**: ✅ 설계 완료 (공고 페이지 해시 Cron + Make.com AI + 자동 DB 업데이트)
- **타겟 거래처 (CW12)**: A(Shopify/WooCommerce), B(eBay/Etsy), C(DHL/Walmart)
- **P2 벤치마크**: ✅ AI분류 50상품(Pipeline 90%), Calculate E2E 15/15통과, 부하테스트 100동시(26.9req/s, p95=3.4s, 에러0%)
- **P3 런칭 준비**: ✅ 모바일반응형, JSON-LD 3스키마, 법적통일(Korea), 이메일통일(contact@), 14페이지+API 200 OK
- **플랫폼 최종 점검**: ✅ 42/42기능, 522/522테스트, 12/12DB 수치일치, 27/27페이지+에셋, 11/11 Cron, OG+JSON-LD

---

## Vercel Cron 전체 목록 (21개)

| # | 엔드포인트 | 스케줄 | Division |
|---|-----------|--------|----------|
| 1 | `/admin/update-tariffs` | 매주 월 06:00 UTC | D1 |
| 2 | `/admin/trade-remedy-sync` | 매주 월 06:30 UTC | D1 |
| 3 | `/admin/sdn-sync` | 매일 05:00 UTC | D1 |
| 4 | `/admin/exchange-rate-sync` | 매일 00:30 UTC | D4 |
| 5 | `/admin/gov-api-health` | 매 12시간 | D4 |
| 6 | `/admin/uptime-check` | 매 6시간 | D5 |
| 7 | `/admin/plugin-health` | 매 12시간 | D6 |
| 8 | `/admin/spot-check` | 매일 04:00 UTC | D8 |
| 9 | `/admin/billing-overage` | 매월 1일 07:00 UTC | D10 |
| 10 | `/admin/health-check` | 매 6시간 | D11 |
| 11 | `/admin/competitor-scan` | 매주 월 08:00 UTC | D15 |
| 12 | `/v1/admin/division-monitor` | 매 30분 | 전체 |
| 13 | `/cron/enterprise-lead-match` | 매 30분 | D9 |
| 14 | `/cron/subscription-cleanup` | 매일 03:00 UTC | D10 |
| 15 | `/v1/cron/federal-register-monitor` | 매일 06:00 UTC | D4 |
| 16 | `/v1/cron/taric-rss-monitor` | 매일 07:00 UTC | D4 |
| 17 | `/v1/cron/tariff-change-monitor` | 매주 일 05:00 UTC | D4 |
| 18 | `/v1/cron/classification-ruling-monitor` | 매주 수 06:00 UTC | D3 |
| 19 | `/v1/cron/macmap-update-monitor` | 매월 1일 08:00 UTC | D4 |
| 20 | `/v1/cron/wco-news-monitor` | 매월 15일 08:00 UTC | D4 |
| 21 | `/v1/cron/fta-change-monitor` | 매주 금 06:00 UTC | D1 |
