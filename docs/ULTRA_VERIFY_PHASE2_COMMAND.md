# Phase 2 초정밀 검증 — API & 데이터 완전성
> Phase 1 완료 후 Claude Code 터미널에 복붙

```
CLAUDE.md 읽고 POTAL 초정밀 검증 Phase 2를 시작해줘. API와 데이터의 완전성을 세계 최고 수준으로 검증하는 거야.

=== 검증 2-1: API 엔드포인트 전수 테스트 (D7) ===
potal.app 프로덕션 API에 정상/비정상/엣지케이스 3종 요청을 보내.

■ /api/v1/calculate (POST)
- 정상: { productName: "cotton t-shirt", price: 25, origin: "CN", destination: "US", currency: "USD" }
- 에러: { productName: "", price: 25, origin: "XX", destination: "US" } → 적절한 에러 코드?
- 엣지: price: 0 / price: 999999 / price: -10 / price: 0.001
- 엣지: origin과 destination 같은 국가 (CN→CN)
- 엣지: 존재하지 않는 국가코드 "ZZ"

■ /api/v1/classify (POST)
- 정상: { productName: "cotton t-shirt" }
- 에러: { productName: "" } / body 없이 호출
- 엣지: 중국어 상품명 "棉质T恤" / 일본어 "綿Tシャツ" / 한국어 "면 티셔츠"
- 엣지: 상품명 1글자 "a" / 500글자 랜덤 텍스트
- 엣지: 이모지 포함 "👕 cotton t-shirt 🇺🇸"
- 엣지: HTML 인젝션 시도 "<script>alert('xss')</script>"

■ /api/v1/classify/batch (POST)
- 정상: 5개 상품 동시 분류
- 부하: 50개 상품 동시 분류
- 에러: 빈 배열 [] / 상품명 없는 배열

■ /api/v1/classify/audit (GET)
- 정상: 최근 분류 감사 기록 조회
- 에러: 존재하지 않는 ID

■ /api/v1/export (POST)
- 정상: CSV 내보내기 요청
- 에러: 빈 데이터 내보내기

■ /api/v1/validate (POST)
- 정상: { hsCode: "6109.10", destination: "US" }
- 에러: { hsCode: "9999.99" } → 존재하지 않는 HS코드
- 에러: { hsCode: "abc" } → 잘못된 포맷

■ /api/v1/countries (GET)
- 정상: 전체 국가 목록 → 240개 맞는지 확인
- 각 국가에 iso2, name, vat_rate, de_minimis 필드 있는지

■ /api/v1/ioss (POST)
- 정상: EU 국가 대상 IOSS 확인
- 에러: EU 외 국가 (US, JP 등)

■ /api/v1/verify (POST)
- 정상: 수출전 검증 요청
- 에러: 제재 대상국가 (KP, IR, SY 등)

■ /api/v1/admin/morning-brief (GET, CRON_SECRET 인증)
- 정상 응답에 15 Division 상태 포함?
- Green/Yellow/Red 카운트 정상?

■ /api/v1/admin/division-monitor (GET, CRON_SECRET 인증)
- 정상 응답에 total_divisions: 15?
- auto_resolved, needs_attention 필드 존재?

각 엔드포인트마다:
- 응답 시간 측정 (ms)
- HTTP 상태 코드 확인
- 응답 본문 구조 확인
- 에러 메시지 명확성

■ 인증 테스트
- API key 없이 /calculate 호출 → 401 Unauthorized?
- 잘못된 API key로 호출 → 401?
- Rate limiting: 동일 key로 연속 100회 호출 → 429 Too Many Requests?

=== 검증 2-2: 데이터 완전성 교차검증 (D4) ===
Supabase Management API로 각 테이블 행수 조회 후 CLAUDE.md 수치와 비교.

| 테이블 | CLAUDE.md 예상 | 실제 | 일치? |
|--------|---------------|------|-------|
| countries | 240 | ? | |
| vat_gst_rates | 240 | ? | |
| de_minimis_thresholds | 240 | ? | |
| customs_fees | 240 | ? | |
| macmap_trade_agreements | 1,319 | ? | |
| macmap_ntlc_rates | 537,894 | ? | |
| product_hs_mappings | 1,055 | ? | |
| hs_classification_vectors | 1,104 | ? | |
| gov_tariff_schedules | 89,842 | ? | |
| trade_remedy_cases | 10,999 | ? | |
| trade_remedy_products | 55,259 | ? | |
| trade_remedy_duties | 37,513 | ? | |
| safeguard_exemptions | 15,935 | ? | |
| hs_expansion_rules | ? | ? | |
| marketplace_connections | 존재 | ? | |
| erp_connections | 존재 | ? | |
| tax_exemption_certificates | 존재 | ? | |
| partner_accounts | 존재 | ? | |
| partner_referrals | 존재 | ? | |

추가 검증:
- countries 테이블: ISO 3166-1 alpha-2 전체 포함? 누락 국가 있으면 리스트
- product_hs_mappings: 중복 product_name 있는지 확인
- hs_classification_vectors: product_hs_mappings와 1:1 매핑되는지
- gov_tariff_schedules: 7개국(US/EU/UK/KR/CA/AU/JP) 각각 행수 확인

=== 검증 2-3: Cron 작업 전수 확인 ===
vercel.json에서 등록된 모든 Cron 목록 출력하고, 각각:
1. 엔드포인트 경로가 실제로 존재하는지 (파일 확인)
2. 최근 실행 기록이 health_check_logs에 있는지
3. 스케줄 표현식이 의도와 맞는지

예상 Cron 목록 (12개):
1. exchange-rate-sync (매일)
2. update-tariffs (매주)
3. trade-remedy-sync (매주 월 06:30)
4. gov-api-health (매 12시간)
5. uptime-check (매 6시간)
6. plugin-health (매 12시간)
7. spot-check (매일 04:00)
8. health-check (매 6시간)
9. competitor-scan (매주 월 08:00)
10. billing-overage (매월 1일)
11. morning-brief (매일 09:00 KST)
12. division-monitor (매 30분)

=== 검증 2-4: v4 모니터링 시스템 통합 테스트 ===
1. /api/v1/admin/division-monitor 호출 → 15 Division 전부 스캔되는지
2. Telegram 테스트 알림 발송 → @potal_alert_bot 수신 확인
   메시지: "🧪 Phase 2 검증 — Telegram 연동 테스트. 이 메시지가 보이면 성공!"
3. issue-classifier 테스트 5개:
   - D11 "DB connection failed" → Layer 1?
   - D8 "spot check accuracy dropped to 75%" → Layer 2?
   - D11 "security vulnerability detected in auth" → Layer 3?
   - D4 "exchange rate sync timeout" → Layer 1?
   - D9 "enterprise partnership negotiation" → Layer 3?
4. auto-remediation ENDPOINT_MAP 10개 경로가 실제 파일로 존재하는지 확인

=== 최종 보고 형식 ===

## API 엔드포인트: [N]/12 PASS
| 엔드포인트 | 정상 | 에러처리 | 엣지케이스 | 응답시간 | 판정 |

## 인증 & 보안: [N]/3 PASS
| 테스트 | 결과 | 판정 |

## 데이터 완전성: [N]/19 테이블 일치
| 테이블 | 예상 | 실제 | 판정 |

## Cron 작업: [N]/12 정상
| Cron | 스케줄 | 파일존재 | 최근실행 | 판정 |

## v4 모니터링: [N]/4 PASS
| 테스트 | 결과 | 판정 |

## Phase 2 총 판정
- API: __/12
- 인증: __/3
- 데이터: __/19
- Cron: __/12
- v4: __/4
- 전체: __/50

FAIL 항목은 원인 분석 + 즉시 수정 방안 제시.
전체 45/50 이상이면 Phase 2 PASS.
```
