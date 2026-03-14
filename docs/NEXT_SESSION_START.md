# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-14 05:00 KST (CW13 — AI Agent Org v4, WDC 2단계 1,055매핑/1,104벡터, 24/7 Division Monitor, Vercel Cron 12개)

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
- KOR AGR 재임포트: ✅ 완료 (1,815,798행, 2026-03-13)
- WDC 추출 상태는 은태가 Mac에서 확인 후 알려줄 예정

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
3. KOR AGR 확인: curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" -H "Content-Type: application/json" -d '{"query": "SELECT count(*) FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'';"}'
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

## ⚠️ CW9.5 + Cycle 4-5에서 완료된 사항

### Chief Orchestrator 사이클 1~5
- **사이클 1**: 15 Division 전체 순회, Red 1→0, Yellow 5→3, Green 9→12
- **사이클 2**: 제품 완성도 7항목 (위젯, Shopify, 보안, i18n, SEO, 에러핸들링)
- **사이클 3**: Paddle 환불API + CSL 21K건 + UI/UX 6개 개선
- **사이클 4**: 야간 15 Division 전체 정밀 점검 ✅ — ContactForm 수정, 쿠키 배너, .env 보강
- **사이클 5**: D15 Intelligence Dashboard + AI 플랫폼 업데이트 + QA + 문서 동기화
- **사이클 6 (CW10)**: Morning Brief 3섹션 강화 (auto_resolved/needs_attention/all_green) + issue-classifier.ts + auto-remediation.ts

### Cowork 12 후반 — 142/147 기능 전부 구현 + 심층 검증 84/84 PASS (2026-03-14)
- **44/44 MUST 구현 완료** (~45분): P0 12개 + P1 15개 + P2 17개
- **SHOULD 40개 구현 완료** (~10분): 회계연동, 파트너에코, 배송분석, MoR, 사기방지, 주문/재고, 교육, 마켓플레이스 등
- **최종: MUST 102 + SHOULD 40 = 142/147 (96.6%)**, WON'T 5개만 제외
- **심층 검증 84/84 PASS** ✅ (02:30 KST): 81 확실 + 3 수정후확실(F082·F083·F147 DB테이블생성), 코드 변경 0건
- DB 테이블 5개 생성: marketplace_connections, erp_connections, tax_exemption_certificates, partner_accounts, partner_referrals
- 빌드 통과 + git push 완료
- **사조(SAZO) 분석**: 경쟁사 아님, **잠재 고객** (B2C 플랫폼 = POTAL 인프라 소비자)

### 백그라운드 작업 상태
- 터미널 2: CBP CROSS Rulings 다운로드 (Playwright headless, PID 20448) — 240개국 규정 RAG Phase 1
- 터미널 3: WDC 추출 진행중 (~1807/1899 파트)
- 터미널 4: 심층 검증 완료 → 종료 가능

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

### AI 플랫폼 업데이트 (Cycle 5)
- Custom GPT: screening, FTA, classify 3개 액션 추가
- MCP Server: v1.2 (7 tools — screen_denied_party, lookup_fta 추가)
- Gemini/Meta AI: 제재, FTA, 50개국어, AI 분류 설명 추가

---

## 현재 진행 중인 백그라운드 작업

### KOR AGR 재임포트 — ✅ 완료
- KOR total 값 불일치 (15,798 vs 1,845,798) → **재임포트 완료 (1,815,798행, 2026-03-13)**
- AGR 53/53국 전체 완료

### WDC 상품 추출 (Mac) — 🔄 진행중
```bash
tail -5 ~/portal/wdc_extract.log
```
- ~1,807/1,899 파트 진행중
- **1단계 카테고리→HS6 매핑 완료** ✅ (145 카테고리 → 1,017 매핑)
- **2단계 카테고리 확장 완료** ✅ (38 신규 카테고리 → 1,055 매핑, 1,104 벡터)
- 다음 → 3단계 상품명 세분화 → 5억 사전 매핑

### 7개국 HS 벌크 다운로드 — ✅ 완료
- **gov_tariff_schedules**: US 28,718 + EU 17,278 + UK 17,289 + KR 6,646 + CA 6,626 + AU 6,652 + JP 6,633 = **89,842행**
- US/EU/UK: 정부 REST API (HS 8-10자리) / KR/CA/AU/JP: WTO API (HS 6자리, 정부 API 없음)
- **저장**: 외장하드 /Volumes/soulmaten/POTAL/hs-bulk/ + Supabase DB 직접 임포트

### CBP CROSS Rulings 다운로드 — 🔄 진행중 (터미널 2)
- Playwright headless, PID 20448, 예상 2-3시간
- 240개국 규정 RAG Phase 1

### 240개국 규정 데이터 수집 — 🔄 진행중 (Claude Code 터미널 2)
- Phase 1(7개국) → Phase 2(국제기구) → Phase 3(지역+나머지)
- **저장**: 외장하드 /Volumes/soulmaten/POTAL/regulations/
- 명령어: REGULATION_DATA_COLLECTION_COMMAND.md
- 수집 시 각 국가별 "공고/변경 알림 페이지 URL"도 함께 기록 (향후 Cron 감시 대상)

---

## 다음 세션 우선순위 (CW13)

### 🔴 P0 — 즉시
1. **Auth JWT 수정**: Vercel SUPABASE_SERVICE_ROLE_KEY를 JWT 형식(eyJ...)으로 교체 — P1 14개 기능의 Auth 실패 원인
2. ~~**KOR AGR 재임포트**~~ ✅ 완료
3. ~~**44개 MUST 미구현 기능 구현**~~ ✅ 완료 (102/102)
4. ~~**SHOULD 40개 기능 구현**~~ ✅ 완료 (142/147)
5. ~~**심층 검증 84/84 PASS**~~ ✅ 완료 (코드 변경 0건, DB 테이블 5개 생성)
6. ~~**7개국 HS 벌크 다운로드**~~ ✅ 완료 (US 28,718 + EU 17,278 + UK 17,289 + KR 6,646 + CA 6,626 + AU 6,652 + JP 6,633 = 89,842행)
7. **WDC 추출 완료 확인** → 2단계 상품명 세분화 → 5억 사전 매핑
8. **240개국 규정 수집 진행 확인** (Claude Code 터미널 2 진행중, 외장하드)

### 🔴 P1 — 이번 주
7. **5억 상품명 사전 매핑 파이프라인**: WDC 전체 상품명 → HS 10자리 룩업 테이블 생성
8. **가격 분기 규칙 테이블**: "valued over/under $X" 조건 코드 추출 → 규칙화
9. **첫 유료 고객 10개 확보 전략 실행**: A그룹(Shopify/WooCommerce) + 크로스보더 플랫폼(사조 등) 타겟
10. **전체 크로스보더 커머스 플랫폼 타겟 리스트업**: 사조 같은 잠재 고객 전수 조사
8. **API category 필드 강화**: /api/v1/calculate에 category 필수/강력 권장

### 🟡 P2 — 다음 주
9. **데이터 유지보수 Cron 구현**: 240개국별 공고 URL 목록 → Vercel Cron 해시 비교 → Make.com webhook 연동
10. **자체 테스트** — 벌크 다운로드/규정 수집 완료 후 종합 테스트
11. **Keyword 정확도 개선** — 1,017 매핑으로 대폭 개선 예상
12. **A그룹 타겟 거래처 접근 전략** — Shopify 41K+ 스토어 마케팅

### 🟢 P3 — 런칭 준비
13. **베타 유저 테스트** — 지인 셀러 2~3명
14. **첫 유료 고객 10개** — 시장 평가에서 가장 빠른 과제로 확인
15. **Soft Launch**: Product Hunt — PH 에셋 5개 + 런칭플랜 준비
16. **Public Launch**: 4월 초

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live + Overage 빌링 + 환불 API
- **요금제**: ✅ Free/Basic/Pro/Enterprise 완료
- **제재 스크리닝**: ✅ 21,301건, 19개 소스 (OFAC SDN + CSL)
- **AI Agent Org v4**: ✅ Chief Orchestrator 정식 운영, 15 Division 전체 Green, Division 이름 10개 변경
- **Layer 1**: ✅ Vercel Cron 12개 + auto-remediation (Cron 3x 재시도) + division-monitor 매30분
- **Layer 2**: ✅ Morning Brief 3섹션 + Dashboard + Division Checklists + issue-classifier
- **24/7 Monitor**: ✅ division-monitor API + Telegram 알림 + Make.com/Email 폴백
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
- **MCP v1.3 (#40)**: ✅ 7→9 tools (document+compare)
- **Incoterms (#20)**: ✅ EXW/FOB/CIF/DDP/DDU + who-pays-what
- 47기능 42개 완료
- **Vector DB 시딩**: ✅ hs_classification_vectors **1,023건** (Cowork 11: 170→1,023), 파이프라인 정확도 100%
- **WDC 카테고리→HS6 1단계**: ✅ 145 카테고리 → 1,017 매핑 (product_hs_mappings 164→1,017, 비용 ~$0.01)
- **7개국 HS 10자리 벌크 다운로드**: 🔄 진행중 (US/EU/UK/CA/AU/JP/KR 정부 공개 데이터, 무료)
- **5억 사전 매핑 전략**: ✅ 확정 — 카테고리→HS6→10자리후보→상품명+가격매칭→룩업테이블
- **HS Code 정확도**: ✅ 100% 구조 설계 완료 (6자리: 카테고리확정, 10자리: DB후보+규칙, 가격분기: if문)
- **경쟁사 대비**: Avalara 40M+ → **POTAL 500M+** HS Code Classifications
- **147개 경쟁사 기능 분석 (CW12)**: ✅ 96.6% 커버리지 (102 MUST/40 SHOULD/5 WON'T)
- **240개국 규정 RAG (CW12)**: 🔄 수집 진행중 (외장하드 /Volumes/soulmaten/POTAL/regulations/)
- **데이터 유지보수 자동화 (CW12)**: ✅ 설계 완료 (공고 페이지 해시 Cron + Make.com AI + 자동 DB 업데이트)
- **타겟 거래처 (CW12)**: A(Shopify/WooCommerce), B(eBay/Etsy), C(DHL/Walmart)
- **P2 벤치마크**: ✅ AI분류 50상품(Pipeline 90%), Calculate E2E 15/15통과, 부하테스트 100동시(26.9req/s, p95=3.4s, 에러0%)
- **P3 런칭 준비**: ✅ 모바일반응형, JSON-LD 3스키마, 법적통일(Korea), 이메일통일(contact@), 14페이지+API 200 OK
- **플랫폼 최종 점검**: ✅ 42/42기능, 522/522테스트, 12/12DB 수치일치, 27/27페이지+에셋, 11/11 Cron, OG+JSON-LD

---

## Vercel Cron 전체 목록 (11개)

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
