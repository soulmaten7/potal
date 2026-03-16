# Phase 1 초정밀 검증 명령어 — Core Engine 정확도
> Claude Code 터미널에 복붙

## 명령어 (한번에 실행)

```
CLAUDE.md 읽고 POTAL 초정밀 검증 Phase 1을 시작해줘. 세계 최고 수준의 검증이야. "되네?"가 아니라 "Avalara, Zonos를 이기는지" 확인하는 거야.

=== 검증 1: 관세 계산 정확도 (20개 케이스) ===
potal.app 프로덕션 /api/v1/calculate 엔드포인트에 아래 20개 케이스를 실제로 호출해.
각 결과를 공식 데이터(WTO Tariff, 각국 관세청)와 비교해서 맞는지 판정해.

케이스 목록:
1. Cotton T-shirt $25, CN→US (HS 6109.10, MFN duty + Section 301?)
2. Cotton T-shirt $25, CN→UK (UK Global Tariff?)
3. Cotton T-shirt $25, CN→DE (EU TARIC, anti-dumping?)
4. Cotton T-shirt $25, VN→US (CPTPP 혜택?)
5. Laptop $999, CN→US (HS 8471, MFN 0% vs Section 301?)
6. Laptop $999, CN→BR (Mercosur 고관세?)
7. Running Shoes $120, VN→JP (RCEP/CPTPP?)
8. Wine bottle $30, FR→KR (한-EU FTA, 주류세?)
9. Cosmetics $50, KR→US (de minimis $800?)
10. Cosmetics $50, KR→EU (de minimis €150, VAT?)
11. Steel bolt M10 $2, CN→US (반덤핑 AD duty on fasteners?)
12. Semiconductor chip $500, TW→US (HS 8542?)
13. Organic food $15, US→JP (식품 검역?)
14. Lithium battery $80, CN→EU (위험물?)
15. Luxury watch $5000, CH→KR (한-EFTA FTA?)
16. Auto parts $200, MX→US (USMCA?)
17. Textile fabric $10, BD→EU (EBA 최빈국 혜택?)
18. Pharmaceutical $300, IN→US (HS 3004, 0%?)
19. Solar panel $400, CN→US (Section 201 세이프가드?)
20. Children's toy $8, CN→AU (de minimis AUD 1000?)

각 케이스마다:
- POTAL 응답 (duty rate, tax, total landed cost)
- 예상 정답 (공식 데이터 기준)
- 판정: PASS/PARTIAL/FAIL
- FAIL이면 원인 분석

=== 검증 2: HS Code 분류 정확도 (30개 상품) ===
/api/v1/classify 엔드포인트에 아래 30개 상품명을 실제로 호출해.

쉬움(10):
1. cotton t-shirt → 6109.10
2. leather wallet → 4202.31
3. ceramic coffee mug → 6912.00
4. electric guitar → 9207.10
5. wooden cutting board → 4419.11
6. artificial flowers → 6702.90
7. dog food dry kibble → 2309.10
8. bicycle helmet → 6506.10
9. polyester curtain fabric → 5407.61
10. fishing rod carbon fiber → 9507.10

보통(10):
11. wireless bluetooth headphones → 8518.30
12. stainless steel water bottle → 7323.93
13. organic green tea bags → 0902.10
14. USB-C charging cable → 8544.42
15. gaming mechanical keyboard → 8471.60
16. prescription eyeglasses → 9004.10
17. car brake pad → 6813.81
18. motorcycle helmet DOT → 6506.10
19. lithium-ion 18650 battery cell → 8507.60
20. drone quadcopter DJI → 8806.10

어려움(10):
21. yoga mat → 3918.90 or 4016.91
22. M10 hex bolt grade 8.8 → 7318.15
23. MOSFET transistor IRF540N → 8541.21
24. infant formula milk powder → 1901.10
25. smartwatch with GPS → 9102.12 or 8517.62
26. protein powder supplement → 2106.10
27. surgical face mask N95 → 6307.90
28. 3D printer PLA filament → 3916.90
29. epoxy resin 2-part → 3907.30
30. titanium dental implant → 9021.29

각 상품마다:
- POTAL 응답 HS Code + confidence
- 정답 HS Code (WCO 기준)
- 판정: PASS(6자리 일치)/PARTIAL(4자리 일치)/FAIL
- 분류 경로: 캐시 히트 vs 벡터 매칭 vs LLM 폴백

=== 검증 3: 세금 엔진 정확도 (10개국) ===
/api/v1/calculate로 동일 상품($100 cotton t-shirt, CN 출발)을 10개 도착국에 보내서 세금 부분만 검증.

1. US (New York) → Sales tax? 연방 VAT 없음 확인
2. UK → 20% VAT, £135 de minimis
3. DE → 19% VAT, €150 de minimis, IOSS
4. JP → 10% 소비세, ¥16,666 면세
5. KR → 10% VAT, $150 면세
6. AU → 10% GST, AUD 1000 de minimis
7. CA → 5% GST + 주별 PST
8. BR → ICMS+IPI+PIS+COFINS
9. IN → GST 슬랩(5/12/18/28%)
10. AE → 5% VAT, AED 300 de minimis

=== 검증 4: v4 모니터링 시스템 ===
4-1. /api/v1/admin/division-monitor 직접 호출 (CRON_SECRET 인증)
4-2. Telegram 테스트 알림 발송 → @potal_alert_bot 수신 확인
4-3. issue-classifier 5개 테스트 케이스:
   - D11 "DB connection failed" → Layer 1?
   - D8 "spot check accuracy 75%" → Layer 2?
   - D11 "security vulnerability" → Layer 3?
   - D4 "exchange rate sync failed" → Layer 1?
   - D9 "enterprise partnership" → Layer 3?
4-4. vercel.json Cron 목록 출력 (12개 확인)
4-5. DB 행수 교차검증 (CLAUDE.md 수치 vs 실제)

=== 최종 보고 형식 ===
표로 정리:

## 관세 계산: [N]/20 PASS
| # | 상품 | 경로 | POTAL | 정답 | 판정 | 비고 |

## HS 분류: [N]/30 PASS
| # | 상품명 | POTAL HS | 정답 HS | 판정 | 경로 |
쉬움: [N]/10 | 보통: [N]/10 | 어려움: [N]/10

## 세금 엔진: [N]/10 PASS
| # | 국가 | POTAL 세금 | 정답 세금 | 판정 |

## v4 모니터링: [N]/5 PASS
| # | 테스트 | 결과 | 판정 |

## 총 판정
- 관세: __/20
- HS분류: __/30
- 세금: __/10
- 모니터링: __/5
- 전체: __/65

FAIL이 있으면 각각 원인 분석 + 수정 방안 제시.
전체 60/65 이상이면 Phase 1 PASS.
```
