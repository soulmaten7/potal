# POTAL 초정밀 검증 계획 (Ultra Verification)
> 2026-03-14 05:30 KST — 목표: 세계 최고 수준 검증, 경쟁사 압도 확인

## 검증 철학
"되네?" 수준이 아니라 "Avalara(40M+ 매핑), Global-e($1B+), Zonos가 이걸 할 수 있나?" 수준.
각 기능을 실제 경쟁사 결과와 비교하고, 부족하면 즉시 수정.

---

## Phase 1: Core Engine 정확도 (최우선 — 오늘 시작)
> POTAL의 본질. 이게 틀리면 나머지 다 의미없음.

### 1-1. 관세 계산 정확도 (D1+D2)
**실제 케이스 20개로 교차 검증:**
각 케이스마다 POTAL 결과 vs 실제 관세청 데이터 비교

| # | 상품 | 출발국 | 도착국 | 검증 포인트 |
|---|------|--------|--------|------------|
| 1 | Cotton T-shirt $25 | CN | US | MFN duty + Section 301 추가관세 반영? |
| 2 | Cotton T-shirt $25 | CN | UK | UK Global Tariff 적용? Brexit 후 독자 세율? |
| 3 | Cotton T-shirt $25 | CN | DE | EU TARIC 세율? Anti-dumping 해당? |
| 4 | Cotton T-shirt $25 | VN | US | CPTPP/USVN FTA 혜택 적용? |
| 5 | Laptop $999 | CN | US | MFN 0% vs Section 301? HS 8471 확인 |
| 6 | Laptop $999 | CN | BR | Mercosur 고관세 국가 대응? |
| 7 | Running Shoes $120 | VN | JP | RCEP/CPTPP 혜택? 가격 분기("valued over $X")? |
| 8 | Wine bottle $30 | FR | KR | 한-EU FTA 혜택? 주류 특별소비세? |
| 9 | Cosmetics $50 | KR | US | US de minimis $800? HS 3304 확인 |
| 10 | Cosmetics $50 | KR | EU | EU de minimis €150? VAT 즉시 부과? |
| 11 | Steel bolt M10 $2 | CN | US | 반덤핑 관세 확인 (AD duty on fasteners) |
| 12 | Semiconductor chip $500 | TW | US | CHIPS Act 관련? HS 8542 확인 |
| 13 | Organic food $15 | US | JP | 식품 검역 규정? 저가 면세 적용? |
| 14 | Lithium battery $80 | CN | EU | 위험물 규정? UN3481? |
| 15 | Luxury watch $5000 | CH | KR | 고가품 세율? 한-EFTA FTA? |
| 16 | Auto parts $200 | MX | US | USMCA 원산지 규정? |
| 17 | Textile fabric $10/m | BD | EU | GSP/EBA 최빈국 혜택? |
| 18 | Pharmaceutical $300 | IN | US | HS 3004, 0% MFN 확인 |
| 19 | Solar panel $400 | CN | US | Section 201 세이프가드? |
| 20 | Children's toy $8 | CN | AU | AANZFTA? AU de minimis AUD 1000? |

**검증 방법:**
- POTAL /calculate API 호출
- 결과를 각국 관세청 공식 데이터와 비교
- 오차 있으면 원인 분석 + 즉시 수정
- 목표: **20/20 정확** (1개라도 틀리면 FAIL)

### 1-2. HS Code 분류 정확도 (D3)
**상품 30개 분류 테스트:**

| # | 상품명 | 예상 HS6 | 난이도 | 검증 포인트 |
|---|--------|----------|--------|------------|
| 1 | cotton t-shirt | 6109.10 | 쉬움 | 기본 의류 분류 |
| 2 | wireless bluetooth headphones | 8518.30 | 보통 | 전자제품 vs 음향기기 |
| 3 | stainless steel water bottle | 7323.93 | 보통 | 재질 기반 분류 |
| 4 | organic green tea bags | 0902.10 | 보통 | 식품 분류 |
| 5 | leather wallet | 4202.31 | 쉬움 | 가죽 제품 |
| 6 | USB-C charging cable | 8544.42 | 보통 | 케이블 vs 충전기 |
| 7 | yoga mat | 3918.90 or 4016.91 | 어려움 | 재질 모호 (PVC vs 고무) |
| 8 | dog food dry kibble | 2309.10 | 보통 | 동물 사료 |
| 9 | ceramic coffee mug | 6912.00 | 쉬움 | 도자기 |
| 10 | bicycle helmet | 6506.10 | 보통 | 안전모 분류 |
| 11 | M10 hex bolt grade 8.8 | 7318.15 | 어려움 | 산업부품, 규격별 분류 |
| 12 | MOSFET transistor IRF540N | 8541.21 | 어려움 | 반도체 세부 분류 |
| 13 | lithium-ion 18650 battery cell | 8507.60 | 보통 | 배터리 타입별 |
| 14 | infant formula milk powder | 1901.10 | 어려움 | 유아식 vs 유제품 |
| 15 | gaming mechanical keyboard | 8471.60 | 보통 | 컴퓨터 주변기기 |
| 16 | prescription eyeglasses | 9004.10 | 보통 | 의료기기 vs 안경 |
| 17 | electric guitar | 9207.10 | 쉬움 | 악기 |
| 18 | titanium dental implant | 9021.29 | 어려움 | 의료 임플란트 |
| 19 | polyester curtain fabric | 5407.61 | 보통 | 직물 |
| 20 | car brake pad | 6813.81 | 보통 | 자동차 부품 |
| 21 | protein powder supplement | 2106.10 | 어려움 | 식품 vs 건강보조제 |
| 22 | wooden cutting board | 4419.11 | 쉬움 | 목재 주방용품 |
| 23 | smartwatch with GPS | 9102.12 or 8517.62 | 어려움 | 시계 vs 통신기기 |
| 24 | artificial flowers | 6702.90 | 쉬움 | 인조 꽃 |
| 25 | epoxy resin 2-part | 3907.30 | 어려움 | 화학 제품 |
| 26 | fishing rod carbon fiber | 9507.10 | 보통 | 스포츠 용품 |
| 27 | motorcycle helmet DOT | 6506.10 | 보통 | 안전모 (자전거 vs 오토바이) |
| 28 | surgical face mask N95 | 6307.90 or 9020 | 어려움 | 섬유 vs 의료기기 |
| 29 | 3D printer PLA filament | 3916.90 | 어려움 | 플라스틱 반제품 |
| 30 | drone quadcopter DJI | 8806.10 | 보통 | UAV 분류 (2022 신규 HS) |

**검증 방법:**
- POTAL /classify API 호출
- WCO HS 2022 공식 분류와 비교
- 6자리 일치 = PASS, 4자리만 일치 = PARTIAL, 불일치 = FAIL
- 목표: **27/30 이상 PASS** (90%+), 어려움 난이도 8개 중 6개+

### 1-3. 세금 엔진 정확도 (D2)
**VAT/GST 10개국 정밀 테스트:**

| 국가 | 상품 | 가격 | 검증 포인트 |
|------|------|------|------------|
| US (NY) | $50 item | $50 | Sales tax by state (not federal VAT) |
| UK | £200 item | £200 | 20% VAT, £135 de minimis |
| DE | €100 item | €100 | 19% VAT, €150 de minimis, IOSS |
| JP | ¥10,000 | ¥10,000 | 10% 소비세, ¥16,666 면세 |
| KR | ₩150,000 | ₩150,000 | 10% VAT, US$150 면세 |
| AU | AUD 500 | AUD 500 | 10% GST, AUD 1000 de minimis |
| CA | CAD 100 | CAD 100 | 5% GST + 省별 PST/HST |
| BR | BRL 500 | BRL 500 | ICMS+IPI+PIS+COFINS 복합세금 |
| IN | INR 5,000 | INR 5,000 | GST 슬랩(5/12/18/28%) |
| AE | AED 200 | AED 200 | 5% VAT, AED 300 de minimis |

**검증 방법:**
- POTAL /calculate에서 tax 부분만 분리 확인
- 각국 세무청 공식 세율과 비교
- de minimis threshold 정확도 확인
- IOSS/OSS 적용 여부 확인
- 목표: **10/10 정확**

---

## Phase 2: API & 데이터 완전성 (2일차)
> 실제 고객이 API를 쓸 때 경험하는 것 검증

### 2-1. API 엔드포인트 전수 테스트 (D7)
모든 API 엔드포인트에 정상/비정상/엣지케이스 요청:

| 엔드포인트 | 정상 테스트 | 에러 테스트 | 엣지 케이스 |
|-----------|-----------|-----------|------------|
| /calculate | 기본 계산 | 잘못된 국가코드 | 가격 $0, 가격 $1M |
| /classify | 기본 분류 | 빈 상품명 | 중국어 상품명, 이모지 포함 |
| /classify/batch | 5개 동시 | 100개 동시 | 중복 상품명 |
| /classify/audit | 감사 추적 | 없는 ID | - |
| /export | CSV 내보내기 | 빈 데이터 | 10만건 |
| /validate | HS코드 검증 | 잘못된 포맷 | 존재하지 않는 코드 |
| /countries | 국가 목록 | - | 필터링 |
| /ioss | IOSS 확인 | EU 외 국가 | - |
| /verify | 수출전 검증 | - | 제재국가 |
| /restrictions | 제한물품 | - | 위험물 |
| /screen | 제재 스크리닝 | - | SDN 리스트 매칭 |
| /fta | FTA 조회 | - | FTA 없는 국가쌍 |

**검증 기준:**
- 응답 시간: 평균 < 500ms, P99 < 2s
- 에러 응답: 적절한 HTTP 코드 + 명확한 에러 메시지
- Rate limiting: 동작 확인
- 인증: API key 없이 호출 시 401

### 2-2. 데이터 완전성 (D4)
**각 데이터 소스 교차 검증:**

| 데이터 | 예상 행수 | 검증 포인트 |
|--------|----------|------------|
| countries | 240 | ISO 3166 전체? 누락 국가? |
| vat_gst_rates | 240 | 모든 국가 VAT 있음? 0%도 포함? |
| de_minimis_thresholds | 240 | 모든 국가 threshold 있음? |
| macmap_ntlc_rates | 537,894 | MFN 세율 커버리지? |
| macmap_min_rates | ~113M | 53개국 전체? |
| macmap_agr_rates | ~144M | 53개국 전체? KOR 정상? |
| product_hs_mappings | 1,055 | 중복 없음? |
| hs_classification_vectors | 1,104 | 매핑과 일치? |
| gov_tariff_schedules | 89,842 | 7개국 전체? |
| trade_remedy_cases | 10,999 | AD/CVD/SG 포함? |
| trade_remedy_duties | 37,513 | 세율 범위 정상? |
| sanctions_entries | 21,301 | OFAC+CSL 최신? |

### 2-3. 24/7 모니터링 시스템 (v4 신규)
| 테스트 | 내용 |
|--------|------|
| division-monitor 호출 | 15 Division 스캔 결과 확인 |
| Telegram 알림 | 실제 메시지 수신 확인 |
| issue-classifier | 5개 테스트 케이스 분류 정확도 |
| auto-remediation | Layer 1 재시도 동작 |
| Vercel Cron | 12개 Cron 등록 확인 |

---

## Phase 3: 경쟁사 비교 & 갭 분석 (3일차)
> 142개 기능 각각을 경쟁사와 1:1 비교

### 3-1. 동일 상품 경쟁사 비교
**같은 상품을 POTAL과 경쟁사에 동시 입력:**

| 경쟁사 | 무료 테스트 가능? | 비교 방법 |
|--------|-----------------|----------|
| Zonos (landedcost.com) | ✅ 무료 계산기 | 동일 상품 입력 후 결과 비교 |
| SimplyDuty | ✅ 무료 체험 | 동일 상품 입력 후 결과 비교 |
| Dutify | ✅ 무료 계산기 | 동일 상품 입력 후 결과 비교 |
| Easyship | ✅ 무료 가입 | 관세 계산 결과 비교 |

**비교 항목:**
- 관세율 정확도 (누가 더 정확?)
- HS Code 분류 정확도 (누가 더 정확?)
- 응답 속도 (누가 더 빠름?)
- 지원 국가 수 (POTAL 240 vs 경쟁사?)
- FTA 최적화 (자동으로 최저 세율 찾아주는지?)
- de minimis 정확도

### 3-2. 142개 기능 1:1 비교 매트릭스
**POTAL_Final_Feature_Analysis_v2.xlsx 기반:**
- MUST 102개: 각각 "구현됨" → "실제 작동함" → "경쟁사보다 나음" 3단계 확인
- SHOULD 40개: 각각 동일 3단계
- 약점 발견 시 즉시 수정 우선순위 결정

### 3-3. POTAL만의 차별점 확인
경쟁사에 없는 POTAL만의 기능이 실제로 작동하는지:
- [ ] 관세 최적화 (MIN/AGR/NTLC 자동 비교 → 최저 세율)
- [ ] 5억 상품명 사전 매핑 (WDC)
- [ ] 240개국 규정 RAG (구축 중)
- [ ] 24/7 자동 모니터링
- [ ] MCP 서버 (AI Agent 직접 연동)
- [ ] 제재 스크리닝 (OFAC SDN + CSL 21K건)
- [ ] 무역구제 (AD/CVD/SG 119K건)

---

## Phase 4: 프로덕션 안정성 (4일차)
> 실제 트래픽 상황 시뮬레이션

### 4-1. 부하 테스트
- 동시 요청 10/50/100/500 → 응답 시간 + 에러율
- Rate limiting 동작 확인 (플랜별)
- DB 커넥션 풀 한계

### 4-2. 보안 테스트
- SQL Injection 시도
- XSS 시도
- API key 없이 접근
- RLS 우회 시도
- CORS 정책

### 4-3. Edge Case
- 동일 요청 1000번 반복 (캐시 동작?)
- 존재하지 않는 국가 코드
- HS Code 없는 상품
- 가격 0, 음수, 소수점 10자리
- 상품명 1글자, 500글자

---

## 실행 우선순위
1. **오늘**: Phase 1 (Core Engine) — 이게 제일 중요
2. **내일**: Phase 2 (API & 데이터)
3. **모레**: Phase 3 (경쟁사 비교)
4. **4일차**: Phase 4 (프로덕션 안정성)

## 판정 기준
- **PASS**: 경쟁사보다 같거나 우수
- **PARTIAL**: 작동하지만 개선 필요
- **FAIL**: 작동 안 함 or 경쟁사에 뒤처짐 → 즉시 수정

## 최종 목표
142개 기능 전부 PASS → Beta 런칭 준비 완료
