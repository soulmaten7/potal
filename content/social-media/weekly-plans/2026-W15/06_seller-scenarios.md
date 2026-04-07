# W15 셀러 페인포인트 시나리오
> 생성일: 2026-04-05 (sunday-content-prep 자동 생성)
> 데이터 소스: POTAL MCP classify_product + calculate_landed_cost + check_restrictions 실제 API 호출 결과

---

## 시나리오 1: 한국 의류 셀러 → 미국 수출

### 상품
- **상품명**: Men's cotton t-shirt
- **소재**: 95% cotton, 5% elastane (knitted)
- **원산지**: KR (한국)
- **가격**: $24.99

### POTAL MCP 분류 결과
- **HS Code**: 6109.10.00 (T-shirts, singlets, of cotton, knitted or crocheted)
- **Chapter**: 61

### POTAL MCP 비용 계산 결과
| 항목 | 금액 |
|------|------|
| Product Price | $24.99 |
| Shipping | $5.50 |
| Import Duty | $0.00 (Duty-free) |
| Sales Tax (7%) | $2.13 |
| CBP MPF | $2.00 |
| Insurance (1.5% CIF) | $0.46 |
| **Total Landed Cost** | **$35.08** |

### 앵글
"한국산 면 티셔츠 $24.99 → 미국 도착 $35.08. Duty-free 적용. 이 계산을 Avalara에 맡기면 연 $18,000. POTAL에서는 $0."

---

## 시나리오 2: 중국 전자제품 셀러 → 미국 수출 (Section 301)

### 상품
- **상품명**: Wireless Bluetooth earbuds
- **소재**: Plastic
- **원산지**: CN (중국)
- **가격**: $59.99

### POTAL MCP 분류 결과
- **HS Code**: 8518.90 (Microphones, loudspeakers, headphones — parts)
- **Chapter**: 85
- **Restrictions**: 없음 (HS 8518, US)

### POTAL MCP 비용 계산 결과
| 항목 | 금액 |
|------|------|
| Product Price | $59.99 |
| Shipping | $4.99 |
| Base Duty | $0.00 (MFN 0%) |
| **Section 301 List 1** | **$16.25 (+25%, CN origin)** |
| Sales Tax (7%) | $4.55 |
| CBP MPF | $2.00 |
| Insurance (1.5% CIF) | $0.97 |
| **Total Landed Cost** | **$88.75** |

### 앵글
"$59.99 이어버드가 $88.75로. 차이 $28.76의 절반 이상이 Section 301 추가 관세. 중국 셀러가 미국 판매 시 마진을 지키려면 이 숫자를 미리 알아야 한다."

**콘텐츠 활용**: 수요일 메인 토픽

---

## 시나리오 3: 프랑스 뷰티 브랜드 → 미국 수출

### 상품
- **상품명**: Organic face moisturizer cream
- **소재**: Organic compounds
- **원산지**: FR (프랑스)
- **가격**: $35.00

### POTAL MCP 분류 결과
- **HS Code**: 3304.10.00.00 (Lip make-up preparations)
- **Chapter**: 33

### POTAL MCP 비용 계산 결과
| 항목 | 금액 |
|------|------|
| Product Price | $35.00 |
| Shipping | $8.00 |
| Import Duty | $0.00 (Duty-free) |
| Sales Tax (7%) | $3.01 |
| CBP MPF | $2.00 |
| Insurance (1.5% CIF) | $0.65 |
| **Total Landed Cost** | **$48.66** |

### 앵글
"프랑스산 유기농 크림 $35 → 미국 $48.66. Duty-free지만 배송+세금+수수료가 39% 추가. '관세 없으니 싸겠지'는 착각."

---

## 시나리오 4: 독일 완구 제조사 → 일본 수출

### 상품
- **상품명**: Wooden building blocks toy set
- **소재**: Wood
- **원산지**: DE (독일)
- **가격**: $29.99

### POTAL MCP 분류 결과
- **HS Code**: 9503.00.00.00 (Toys)
- **Chapter**: 95

### POTAL MCP 비용 계산 결과
| 항목 | 금액 |
|------|------|
| Product Price | $29.99 |
| Shipping | $12.00 |
| Import Duty | $0.00 (De minimis exempt ≤¥10,000) |
| JCT (10%) | $4.20 |
| Insurance (1.5% CIF) | $0.63 |
| **Total Landed Cost** | **$46.82** |

### 앵글
"독일산 나무 블록 $29.99 → 일본 $46.82. 관세는 면제(de minimis)지만 소비세 10%와 배송비가 56% 추가. 일본 시장 진출 시 de minimis 기준을 아는 게 핵심."

---

## 시나리오 5: 일본 식품 브랜드 → 미국 수출

### 상품
- **상품명**: Green tea matcha powder
- **소재**: Tea leaves
- **원산지**: JP (일본)
- **가격**: $18.00

### POTAL MCP 분류 결과
- **HS Code**: 0902.20.00.00 (Green tea, flavoured)
- **Chapter**: 09

### POTAL MCP 비용 계산 결과
| 항목 | 금액 |
|------|------|
| Product Price | $18.00 |
| Shipping | $6.00 |
| Import Duty (3.2%) | $0.77 |
| Sales Tax (7%) | $1.68 |
| CBP MPF | $2.00 |
| Insurance (1.5% CIF) | $0.36 |
| **Total Landed Cost** | **$28.81** |

### 앵글
"일본산 말차 $18 → 미국 $28.81. 관세 3.2%는 낮지만 배송+세금+MPF로 60% 추가. 식품은 FDA 규제 확인도 필수."

---

## 시나리오 요약 — 콘텐츠용 한눈에 보기

| 시나리오 | 상품가 | Total | 추가 비용 | 핵심 요인 |
|----------|--------|-------|----------|----------|
| KR→US 면 티셔츠 | $24.99 | $35.08 | +40% | Duty-free, MPF+Tax |
| CN→US 이어버드 | $59.99 | $88.75 | +48% | Section 301 +25% |
| FR→US 크림 | $35.00 | $48.66 | +39% | Duty-free, 배송비 높음 |
| DE→JP 완구 | $29.99 | $46.82 | +56% | De minimis 면제, JCT 10% |
| JP→US 말차 | $18.00 | $28.81 | +60% | 관세 3.2%, 식품 규제 |

> 모든 수치는 POTAL MCP API 실제 호출 결과 (2026-04-05 기준). session-context.md에 없는 숫자를 만들지 않음.
