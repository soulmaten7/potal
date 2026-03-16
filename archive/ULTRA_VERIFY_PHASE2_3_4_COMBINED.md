# Phase 2+3+4 통합 명령어 — Phase 1 완료 후 바로 복붙
> Claude Code 터미널에 복붙 (Phase 1 끝나면 바로 이어서)

```
CLAUDE.md 읽고 POTAL 초정밀 검증 Phase 2+3+4를 연속으로 진행해줘. Phase 1에서 발견된 문제점이 있으면 참고하면서 진행해.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 2: API & 데이터 완전성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== 2-1: API 엔드포인트 전수 테스트 ===
potal.app 프로덕션에 정상/에러/엣지케이스 요청.

■ /api/v1/calculate (POST)
- 정상: { productName: "cotton t-shirt", price: 25, origin: "CN", destination: "US", currency: "USD" }
- 에러: origin: "XX" (잘못된 국가코드)
- 엣지: price: 0, price: 999999, price: -10, origin==destination "CN"→"CN"

■ /api/v1/classify (POST)
- 정상: { productName: "cotton t-shirt" }
- 에러: { productName: "" }, body 없이 호출
- 엣지: 중국어 "棉质T恤", 한국어 "면 티셔츠", 1글자 "a", 500글자 랜덤
- 보안: "<script>alert('xss')</script>", "'; DROP TABLE countries;--"

■ /api/v1/classify/batch — 5개 정상, 50개 부하, 빈 배열
■ /api/v1/classify/audit — 정상 조회, 없는 ID
■ /api/v1/export — CSV 정상 내보내기, 빈 데이터
■ /api/v1/validate — HS "6109.10" 정상, "9999.99" 없는 코드, "abc" 잘못된 포맷
■ /api/v1/countries — 전체 목록 240개 확인, 각 국가 필드(iso2, name, vat_rate, de_minimis) 존재
■ /api/v1/ioss — EU 국가 정상, 비EU 국가 에러 처리
■ /api/v1/verify — 수출전 검증, 제재국가(KP, IR, SY)
■ /api/v1/admin/morning-brief — CRON_SECRET 인증, 15 Division 상태
■ /api/v1/admin/division-monitor — CRON_SECRET 인증, total_divisions: 15

■ 인증 테스트
- API key 없이 /calculate → 401?
- 잘못된 key → 401?
- Admin 엔드포인트 CRON_SECRET 없이 → 401?

각 엔드포인트 응답시간(ms) + HTTP코드 + 에러메시지 명확성 기록.

=== 2-2: 데이터 완전성 교차검증 ===
Supabase Management API로 각 테이블 행수 조회:

countries(240), vat_gst_rates(240), de_minimis_thresholds(240), customs_fees(240), macmap_trade_agreements(1,319), macmap_ntlc_rates(537,894), product_hs_mappings(1,055), hs_classification_vectors(1,104), gov_tariff_schedules(89,842), trade_remedy_cases(10,999), trade_remedy_products(55,259), trade_remedy_duties(37,513), safeguard_exemptions(15,935)

+ marketplace_connections, erp_connections, tax_exemption_certificates, partner_accounts, partner_referrals 테이블 존재 확인

추가:
- product_hs_mappings 중복 product_name 있는지
- gov_tariff_schedules 7개국(US/EU/UK/KR/CA/AU/JP) 각각 행수

=== 2-3: Cron 전수 확인 ===
vercel.json에서 모든 Cron 목록 출력. 예상 12개:
exchange-rate-sync, update-tariffs, trade-remedy-sync, gov-api-health, uptime-check, plugin-health, spot-check, health-check, competitor-scan, billing-overage, morning-brief, division-monitor

각각: 엔드포인트 파일 존재? 스케줄 맞음? health_check_logs에 최근 기록?

=== 2-4: v4 모니터링 통합 테스트 ===
1. division-monitor 호출 → 15 Division 스캔 결과
2. Telegram 테스트: "🧪 Phase 2 검증 — Telegram 연동 테스트. 이 메시지 보이면 성공!"
3. issue-classifier 5개 케이스:
   - D11 "DB connection failed" → Layer 1?
   - D8 "spot check accuracy 75%" → Layer 2?
   - D11 "security vulnerability" → Layer 3?
   - D4 "exchange rate sync failed" → Layer 1?
   - D9 "enterprise partnership" → Layer 3?
4. auto-remediation ENDPOINT_MAP 10개 경로 파일 존재 확인

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 3: 경쟁사 비교 & 142기능 실동작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== 3-1: 경쟁사 비교 분석 ===
POTAL API 결과 vs 경쟁사(Zonos/SimplyDuty/Dutify/Easyship) 공개 정보 비교.
상품 5개: Cotton T-shirt CN→US, Laptop CN→UK, Running Shoes VN→DE, Cosmetics KR→JP, Auto parts MX→CA

각 상품: HS Code, Duty Rate, VAT/GST, Total Landed Cost, FTA 최적화 여부, de minimis 적용 여부
경쟁사 정보는 공식 문서/API docs/가격 페이지 기반 (스크래핑 아님).

=== 3-2: POTAL 고유 차별점 실동작 확인 ===
경쟁사에 없는 기능 6개 실동작 테스트:

■ 관세 최적화: /calculate에서 tariffOptimization 필드? MIN/AGR/NTLC 최저 세율 자동 선택? savings 표시?
  테스트: CN→KR cotton t-shirt (한-APTA MIN rate vs MFN)

■ 제재 스크리닝: OFAC SDN 매칭 테스트, CSL 매칭, 정상 이름 → clear, 제재 대상 → hit

■ 무역구제: Steel bolt CN→US (AD duty), Solar panel CN→US (Section 201 세이프가드)
  /calculate 응답에 trade_remedy 필드?

■ MCP 서버: mcp-server/ 7개 도구(calculate, classify, restrictions, screen_shipment, screen_denied_party, lookup_fta, list_countries) 각각 입출력 스키마 + 호출 테스트

■ HS 3단계 파이프라인: 1단계(카테고리 캐시) vs 2단계(벡터) vs 3단계(LLM) 각각 1개 테스트, 응답시간 비교

■ 가격 분기: 같은 상품 $5 vs $50 → duty rate 달라지는지

=== 3-3: 142기능 핵심 30개 스팟체크 ===
각 기능: 코드 존재 + API/UI 접근 + 실제 동작 확인 → WORKING/CODE_ONLY/MISSING

MUST 20개:
1. F001 기본 관세 계산, 2. F002 VAT/GST 계산, 3. F003 HS Code AI 분류
4. F004 de minimis 적용, 5. F006 분류 신뢰도, 6. F008 분류 감사 추적
7. F009 배치 분류, 8. F012 HS 검증, 9. F015 가격 분기
10. F033 IOSS, 11. F040 수출전 검증, 12. F043 통관서류
13. F092 샌드박스, 14. F095 고처리량 배치, 15. F109 CSV 내보내기
16. FTA 자동 조회, 17. 제재 스크리닝, 18. 무역구제 반영
19. 240개국 지원, 20. 50개국어 UI

SHOULD 10개:
21. 회계 연동(QuickBooks/Xero), 22. 파트너 에코시스템(partner_accounts)
23. 배송 분석, 24. White-label, 25. MoR 지원
26. 사기 방지, 27. 주문 동기화, 28. 교육 프로그램
29. 마켓플레이스(marketplace_connections), 30. Revenue Share(partner_referrals)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 4: 프로덕션 안정성 & 보안
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== 4-1: 부하 테스트 ===
(프로덕션에 영향 없게 주의)
- /calculate 연속 10회 → 50회(1초간격) → 100회(0.5초간격): 평균 응답시간, 에러율, Rate Limit 시점
- /classify 연속 10회 → 50회: LLM 폴백 시 응답시간 변화
- /countries 연속 100회: 캐시 동작 확인
- 동시 요청 5개: 전부 정상?

=== 4-2: 보안 테스트 ===
■ SQL Injection: productName "t-shirt'; DROP TABLE countries;--", origin "US' OR '1'='1"
■ XSS: "<script>alert('xss')</script>", "<img src=x onerror=alert(1)>"
■ 인증: API key 없이, 만료된 key, Admin 엔드포인트 무인증
■ CORS: 허용/비허용 도메인
■ Rate Limiting: Free 100건 한도, X-RateLimit-* 헤더 존재
■ 환경변수: SUPABASE_SERVICE_ROLE_KEY 프론트엔드 미노출, API 응답에 민감정보 없음
■ RLS: Supabase RLS 활성화 여부
■ .gitignore: .env 파일 미포함 확인

=== 4-3: Edge Case ===
■ 극한값: price $0/$-1/$NaN, 상품명 ""/" "/null, 국가 "us"(소문자)/"USA"(3글자)/"ZZ", HS "0000.00"/"610910"(점없이)
■ 특수국가: KP(북한)/IR(이란)/SY(시리아) → 경고?, TW→CN 민감 경로, VA/MC/SM(소국가) EU 규정?
■ 캐시: 같은 요청 10회 반복 → 응답시간 감소?, 같은 분류 10회 → DB 캐시?
■ 타임아웃: LLM 느릴 때 타임아웃?, 정부 API 다운 시 폴백?

=== 4-4: 프론트엔드 & UI ===
■ 핵심 페이지: potal.app(200?), /pricing(4플랜?), /dashboard(로그인 리다이렉트?), /docs/api, /login, /legal/terms, /legal/privacy, /faq(13항목?)
■ 보안 헤더: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, CSP
■ SSL: HTTP→HTTPS 리다이렉트, 인증서 유효기간
■ SEO: robots.txt, sitemap.xml 존재

=== 4-5: 통합 시나리오 ===
■ 시나리오 1 (이커머스 셀러): CN cotton t-shirt → classify → calculate → VN으로 변경해서 FTA 절약 비교 → validate → screen → 전체 플로우 매끄러움?
■ 시나리오 2 (글로벌 배송): DE→US/UK/JP/KR/AU 동시 5개국 calculate → 각국 비교표 → de minimis/IOSS 적용 국가 식별
■ 시나리오 3 (대량 처리): classify/batch 100개 → export CSV → 같은 상품 일관성 확인

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최종 종합 리포트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1~4 전체 결과를 하나의 종합 리포트로 작성:

## Phase 2 결과
| 카테고리 | 점수 | 판정 |
API 엔드포인트: __/12 | 인증: __/3 | 데이터: __/19 | Cron: __/12 | v4: __/4
Phase 2 합계: __/50

## Phase 3 결과
경쟁사 비교: __/5 | 차별점: __/6 | 142기능: __/30
Phase 3 합계: __/41

## Phase 4 결과
부하: PASS/FAIL | 보안: __/8 | Edge Case: __/5 | 프론트엔드: __/4 | 통합시나리오: __/3
Phase 4 합계: __/20

## 전체 종합 (Phase 1 결과 포함)
| Phase | 점수 | 판정 |
|-------|------|------|
| Phase 1 Core Engine | __/65 | |
| Phase 2 API & Data | __/50 | |
| Phase 3 경쟁사 & 기능 | __/41 | |
| Phase 4 프로덕션 | __/20 | |
| **전체** | **__/176** | |

150+ = Beta 런칭 준비 완료 ✅
130~149 = 수정 후 재검증 필요 🟡
130 미만 = 핵심 문제 해결 필요 🔴

## FAIL 항목 전체 리스트
| # | Phase | 항목 | 원인 | 수정 우선순위 | 수정 방안 |
P0: 즉시 수정 (보안/정확도)
P1: 이번 주 수정 (기능/데이터)
P2: 다음 주 수정 (개선/최적화)

FAIL 중 즉시 수정 가능한 것은 이 세션에서 바로 수정해.
수정 후 해당 테스트만 재실행해서 PASS 확인.

결과를 docs/sessions/SESSION_CW13_ULTRA_VERIFY_REPORT.md로 저장.
완료 후 5개 문서 업데이트 (CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md).
```
