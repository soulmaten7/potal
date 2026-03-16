# Phase 3 초정밀 검증 — 경쟁사 비교 & 142기능 실동작 확인
> Phase 2 완료 후 Claude Code 터미널에 복붙

```
CLAUDE.md 읽고 POTAL 초정밀 검증 Phase 3를 시작해줘. 경쟁사 대비 우위를 검증하는 단계야. "구현했다"가 아니라 "실제로 경쟁사를 이기는지" 확인하는 거야.

=== 검증 3-1: 경쟁사 무료 계산기 비교 ===
아래 5개 상품을 POTAL API로 계산한 결과와, 경쟁사 웹사이트 계산기 결과를 비교해.
경쟁사 결과는 웹 스크래핑이 아니라, 각 경쟁사가 공개한 API 문서/계산기 사양 기준으로 비교해.

■ 비교 상품 5개:
1. Cotton T-shirt $25, CN→US
2. Laptop $999, CN→UK
3. Running Shoes $120, VN→DE
4. Cosmetics $50, KR→JP
5. Auto parts $200, MX→CA

■ 비교 대상 경쟁사 4개:
- Zonos (landedcost.com): 240개국, HS 분류 + 관세 + 세금
- SimplyDuty: 180개국, HS 분류 + duty rate
- Dutify: 주요국, HS 분류 + 관세
- Easyship: 배송 + 관세 통합

■ 비교 항목 (각 상품 x 각 경쟁사):
| 항목 | POTAL | Zonos | SimplyDuty | Dutify | Easyship |
|------|-------|-------|------------|--------|----------|
| HS Code 분류 | ? | ? | ? | ? | ? |
| Import Duty Rate | ? | ? | ? | ? | ? |
| VAT/GST | ? | ? | ? | ? | ? |
| Total Landed Cost | ? | ? | ? | ? | ? |
| FTA 최적화 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| de minimis 적용 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| 응답 시간 | ?ms | ? | ? | ? | ? |

경쟁사 정보는 각 회사 공식 문서, API docs, 가격 페이지에서 확인 가능한 것만 사용해.
스크래핑 대신 공개 정보 기반으로 비교 분석해.

=== 검증 3-2: POTAL 고유 차별점 실동작 확인 ===
경쟁사에 없거나 약한 기능이 POTAL에서 실제로 작동하는지 확인:

■ 관세 최적화 (Tariff Optimization)
- /calculate에서 tariffOptimization 필드가 응답에 포함되는지
- MIN/AGR/NTLC 3테이블 중 최저 세율을 자동 선택하는지
- savings 필드에 절약액이 표시되는지
- 테스트: CN→KR cotton t-shirt (한-APTA MIN rate가 MFN보다 낮을 때)

■ 제재 스크리닝 (Sanctions Screening)
- /api/v1/screen 또는 screen_shipment 기능 동작 확인
- OFAC SDN 리스트 매칭 테스트 (공개된 테스트용 이름 사용)
- CSL 리스트 매칭 테스트
- 정상 이름 → "clear" 응답
- 제재 대상 → "hit" 응답 + 상세 정보

■ 무역구제 (Trade Remedies)
- 반덤핑 관세 적용 확인: Steel bolt CN→US (AD duty on steel fasteners)
- 상계관세 확인: CN→US 관련 상품
- 세이프가드 확인: Solar panel CN→US (Section 201)
- /calculate 응답에 trade_remedy 필드 포함?

■ MCP 서버
- mcp-server/ 디렉토리의 7개 도구 각각 테스트:
  1. calculate — 관세 계산
  2. classify — HS 분류
  3. restrictions — 제한물품 조회
  4. screen_shipment — 수출입 심사
  5. screen_denied_party — 거부 당사자 심사
  6. lookup_fta — FTA 조회
  7. list_countries — 국가 목록
- 각 도구의 입력/출력 스키마 확인
- 실제 호출 시 정상 응답하는지

■ HS Code 3단계 파이프라인
- 1단계(카테고리 매칭): product_hs_mappings에서 키워드로 바로 찾는 경우 → 응답시간 측정
- 2단계(벡터 매칭): hs_classification_vectors에서 유사도 검색 → 응답시간 측정
- 3단계(LLM 폴백): 위 2개 실패 시 AI 모델 호출 → 응답시간 측정
- 3개 단계별로 각각 1개씩 테스트 상품 선택해서 분류 경로 확인

■ 가격 분기 규칙 (Price Break)
- "valued over $X" 규칙이 있는 HS Code에 대해 가격 변경 시 다른 세율 적용되는지
- 예: 같은 상품 $5 vs $50 → duty rate 달라지는지

=== 검증 3-3: 142개 기능 실동작 스팟체크 ===
MUST 102개 + SHOULD 40개 중 핵심 기능 30개를 선별해서 실제 동작 확인.
(전체 142개를 하나하나 하기엔 시간이 부족하므로, 가장 중요한 30개만 집중 검증)

■ MUST 핵심 20개:
1. F001 — 기본 관세 계산 (calculate API 정상?)
2. F002 — VAT/GST 계산 (세금 정확도?)
3. F003 — HS Code AI 분류 (classify API 정상?)
4. F004 — de minimis 자동 적용 (임계값 작동?)
5. F006 — 분류 신뢰도 점수 (confidence 필드?)
6. F008 — 분류 감사 추적 (audit 엔드포인트?)
7. F009 — 배치 분류 (batch 엔드포인트?)
8. F012 — HS 코드 검증 (validate 엔드포인트?)
9. F015 — 가격 분기 규칙 (price break?)
10. F033 — IOSS 지원 (ioss 엔드포인트?)
11. F040 — 수출전 검증 (verify 엔드포인트?)
12. F043 — 통관서류 생성 (문서 생성?)
13. F092 — 샌드박스 모드 (테스트 환경?)
14. F095 — 고처리량 배치 (대량 요청?)
15. F109 — CSV 내보내기 (export 엔드포인트?)
16. FTA 자동 조회 (lookup_fta?)
17. 제재 스크리닝 (screen_shipment?)
18. 무역구제 반영 (trade_remedy?)
19. 240개국 지원 (countries API 240개?)
20. 50개국어 UI (i18n 키 존재?)

■ SHOULD 핵심 10개:
21. 회계 연동 (QuickBooks/Xero 연동 코드?)
22. 파트너 에코시스템 (partner_accounts 테이블?)
23. 배송 분석 (shipping 관련 로직?)
24. 브랜딩/White-label (커스터마이징?)
25. MoR 지원 (Merchant of Record 로직?)
26. 사기 방지 (fraud detection?)
27. 주문 동기화 (order sync?)
28. 교육 프로그램 (training content?)
29. 마켓플레이스 노출 (marketplace_connections?)
30. Revenue Share 파트너 (partner_referrals?)

각 기능마다:
- 코드 존재 확인 (파일/함수 위치)
- API 또는 UI에서 접근 가능한지
- 실제 데이터로 동작하는지
- 판정: WORKING / CODE_ONLY(코드는 있으나 미동작) / MISSING

=== 최종 보고 형식 ===

## 경쟁사 비교: POTAL 우위 [N]/5 상품
| 상품 | POTAL 정확? | Zonos 대비 | SimplyDuty 대비 | 판정 |

## 고유 차별점: [N]/6 동작 확인
| 기능 | 동작여부 | 상세 | 판정 |

## 142기능 스팟체크: [N]/30 WORKING
| # | 기능 | 코드 | 동작 | 판정 |

## Phase 3 총 판정
- 경쟁사 비교: __/5
- 차별점: __/6
- 142기능: __/30 (WORKING/CODE_ONLY/MISSING 각 카운트)
- 전체: __/41

FAIL이나 CODE_ONLY 항목은 원인 분석 + 수정 우선순위 결정.
MISSING 항목은 구현 필요 여부 판단.
전체 35/41 이상이면 Phase 3 PASS.
```
