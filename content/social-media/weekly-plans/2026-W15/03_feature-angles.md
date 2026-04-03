# 2026-W15 기능 딥다이브 소재
> 자동 생성: 2026-04-02 (sunday-content-prep)
> 소스: app/features/features-guides.ts (140개 기능)

---

## 이번 주 딥다이브 기능: Total Landed Cost Calculator (수요일)

### 기능 상세
- **기능 ID**: F002
- **카테고리**: Core Engine
- **슬러그**: /features/total-landed-cost-calculator

### 핵심 앵글
**"가격표에 적힌 $24.99가 끝이 아니다. 관세, 세금, 수수료 합치면 $38.34. 이 차이를 모르면 마진이 사라진다."**

### 구체적 소재

**무엇을 하는가:**
- 상품 가격 + 관세(duty) + VAT/GST + 배송비 + 보험 + 수수료 = 최종 소비자 지불 가격
- 240개국 간 모든 루트 계산 가능
- HS Code 자동 분류 → 관세율 적용 → 세금 적용 → 수수료 적용

**왜 중요한가:**
- De Minimis 폐지 후 모든 소포에 관세 발생 → TLC 없이는 마진 계산 불가
- Reciprocal Tariff로 관세율 급변 → 실시간 계산 필수
- 셀러가 가장 자주 실수하는 것: "상품 가격 = 고객 지불 가격" 착각

**경쟁사 비교:**
- Avalara TLC: $1,500+/월 (Cross-Border 모듈 별도)
- Zonos: 주문당 $2 + GMV 10% (비용 예측 불가)
- POTAL: $0. API 호출로 즉시 계산.

**API 예시:**
```bash
curl -X POST https://potal.app/api/v1/calculate-landed-cost \
  -H "Authorization: Bearer sk_live_..." \
  -d '{
    "productName": "Men'\''s cotton t-shirt",
    "material": "cotton",
    "price": 24.99,
    "origin": "KR",
    "destinationCountry": "US",
    "shippingPrice": 8.50
  }'
```

**실제 계산 결과 (POTAL MCP 2026-04-02):**
- 상품가: $24.99 → Total: $38.34 (53% 증가)
- 관세: $0 (KORUS FTA 혜택), Sales Tax: $2.34 (7%), MPF: $2.00

### 핵심 숫자
- 240개국 지원
- 12개국 특수 세금 계산 (중국 CBEC, 멕시코 IEPS, 브라질 cascading, 인도 IGST 등)
- 7개국 정부 API 연동
- 실시간 환율 적용

---

## 보충 기능 소재 (이번 주 다른 요일에 활용)

### 목요일 개발자용 — POTAL API + MCP 연동
- **F007 REST API** + **F031 Claude MCP** + **F029 Custom GPT**
- 앵글: "AI 에이전트가 관세를 계산하는 시대. 3줄 코드면 충분하다."
- MCP: `npx -y potal-mcp-server` → classify_product, calculate_landed_cost
- GPT Actions: OpenAPI spec으로 바로 연동

### 토요일 데이터/인사이트 — 국가별 관세 비교
- **F003 Duty Rates Database** + **F012 Country Comparison**
- 앵글: "240개국 중 관세가 가장 높은 나라. Reciprocal Tariff 후 판이 바뀌었다."
- compare_countries API로 실제 비교 데이터 제공

---

## 아직 안 다룬 기능 (W16 이후 후보)

| 기능 | 앵글 | 우선순위 |
|------|------|---------|
| F004 FTA Lookup | "FTA를 쓰면 관세 0%. 문제는 어떤 FTA가 적용되는지 모른다는 것" | 높음 |
| F005 Confidence Score | "AI가 분류한 HS Code를 얼마나 믿을 수 있나? POTAL은 신뢰도 점수를 준다" | 중간 |
| F008 Denied Party Screening | "수출금지 대상에게 물건을 팔면? 벌금 $1M+" | 높음 |
| F010 De Minimis Check | "면세 한도가 나라마다 다르다. 이걸 자동으로 체크하는 기능" | 높음 |
| F015 Multi-currency | "환율은 매일 바뀐다. 관세 계산에 어제 환율을 쓰면 마진이 틀어진다" | 중간 |
| F022 Sandbox Mode | "프로덕션 API 키 없이 테스트. 개발자 온보딩 30초" | 중간 |
