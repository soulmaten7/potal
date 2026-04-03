# 2026-W15 셀러 시나리오
> 자동 생성: 2026-04-02 (sunday-content-prep)
> 소스: POTAL MCP (classify_product + calculate_landed_cost 실제 호출 결과)

---

## 시나리오 1: 한국 의류 셀러 → 미국 수출

**배경**: K-fashion 셀러가 미국 소비자에게 면 티셔츠 판매

| 항목 | 데이터 |
|------|--------|
| 상품 | Men's cotton t-shirt (95% cotton, 5% elastane, knitted) |
| HS Code | 6109.10 (POTAL MCP classify_product 결과) |
| 원산지 | 한국 (KR) |
| 목적지 | 미국 (US) |
| 상품가 | $24.99 |
| 배송비 | $8.50 |

**POTAL MCP calculate_landed_cost 결과:**
- Import Duty: **$0.00** (KORUS FTA 혜택으로 면세)
- Sales Tax: $2.34 (7.0%)
- MPF: $2.00 (CBP 처리 수수료)
- Insurance: $0.50
- **Total Landed Cost: $38.34**

**앵글**: "한국 셀러의 강점 — KORUS FTA로 의류 관세 0%. $24.99 티셔츠의 실제 소비자 지불가는 $38.34. 이 계산, POTAL에서 1초."

---

## 시나리오 2: 중국 전자제품 셀러 → 미국 수출 (Section 301 관세)

**배경**: 중국 제조업체가 미국에 블루투스 이어버드 판매

| 항목 | 데이터 |
|------|--------|
| 상품 | Wireless Bluetooth earbuds |
| HS Code | 8518.90 (POTAL MCP classify_product 결과) |
| 원산지 | 중국 (CN) |
| 목적지 | 미국 (US) |
| 상품가 | $59.99 |
| 배송비 | $5.00 |

**POTAL MCP calculate_landed_cost 결과:**
- Base Duty: $0.00 (HS 8518.90 기본 세율 0%)
- **Section 301 추가 관세: $16.25 (25.0%, 중국 원산지)**
- Sales Tax: $4.55 (7.0%)
- MPF: $2.00
- Insurance: $0.97
- **Total Landed Cost: $88.76**

**앵글**: "기본 관세는 0%인데, Section 301으로 25% 추가. $59.99 이어버드가 $88.76이 된다. 중국 셀러는 이 숨은 비용을 반드시 알아야 한다."

---

## 시나리오 3: 한국 화장품 셀러 → 독일 수출

**배경**: K-beauty 브랜드가 EU (독일)에 진출

| 항목 | 데이터 |
|------|--------|
| 상품 | Organic face cream moisturizer |
| HS Code | 3304.10 (POTAL MCP classify_product 결과) |
| 원산지 | 한국 (KR) |
| 목적지 | 독일 (DE) |
| 상품가 | $35.00 |
| 배송비 | $12.00 |

**POTAL MCP calculate_landed_cost 결과:**
- Import Duty: **$0.00** (De minimis 면세, ≤€160)
- VAT (IOSS): $8.93 (19.0%)
- Insurance: $0.71
- **Total Landed Cost: $56.64**

**앵글**: "K-beauty의 EU 진출. 관세는 면세(€160 이하)지만 VAT 19%는 피할 수 없다. $35 크림의 실제 비용 $56.64. 7월부터 EU 면세 폐지되면 이 숫자가 더 올라간다."

---

## 시나리오 4: 일본 식품 셀러 → 미국 수출

**배경**: 일본 말차 브랜드가 미국 시장 진출

| 항목 | 데이터 |
|------|--------|
| 상품 | Green tea matcha powder |
| HS Code | 0902.10 (POTAL MCP classify_product 결과) |
| 원산지 | 일본 (JP) |
| 목적지 | 미국 (US) |
| 상품가 | $28.00 |
| 배송비 | $7.00 |

**POTAL MCP calculate_landed_cost 결과:**
- Import Duty: $1.12 (3.2%)
- Sales Tax: $2.45 (7.0%)
- MPF: $2.00
- Insurance: $0.53
- **Total Landed Cost: $41.10**

**앵글**: "일본산 말차 미국 수출, 관세 3.2%로 비교적 낮다. 하지만 Reciprocal Tariff(~24%) 발효 후 이 숫자가 급변할 수 있다. 실시간 계산이 필수인 이유."

---

## 시나리오 5: 중국 완구 셀러 → 영국 수출

**배경**: 중국 제조 아동용 나무 블록을 UK에 판매

| 항목 | 데이터 |
|------|--------|
| 상품 | Wooden educational building blocks for children |
| HS Code | 9503.00 (POTAL MCP classify_product 결과) |
| 원산지 | 중국 (CN) |
| 목적지 | 영국 (GB) |
| 상품가 | $18.99 |
| 배송비 | $9.00 |

**POTAL MCP calculate_landed_cost 결과:**
- Import Duty: **$0.00** (De minimis 면세, ≤£170)
- VAT: $5.60 (20.0%, seller-collected)
- Insurance: $0.42
- **Total Landed Cost: $34.01**

**앵글**: "£170 이하 면세, 하지만 VAT 20%는 셀러가 직접 징수해야 한다. 이걸 모르면 영국 세관에서 막힌다."

---

## 시나리오 활용 매핑

| 시나리오 | 활용 요일 | 활용 방식 |
|---------|----------|----------|
| 1 (한국→미국 의류) | 수 (TLC 딥다이브) | 실제 계산 예시 |
| 2 (중국→미국 전자) | 월 (Reciprocal Tariff) | Section 301 + 추가 관세 영향 |
| 3 (한국→독일 화장품) | 토 (데이터) | EU VAT + 7월 면세 폐지 미리보기 |
| 4 (일본→미국 식품) | 목 (개발자) | API 호출 예시 |
| 5 (중국→영국 완구) | 화 (경쟁 비교) | "이 계산 Avalara $1,500, POTAL $0" |
