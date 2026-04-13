# POTAL 실데이터 — 2026-W16
> 생성일: 2026-04-12 (sunday-content-prep 자동 실행)

## MCP 호출 결과

### 시나리오 1 — Li-ion Battery Pack (KR→DE) ✅ Live MCP Call
```
Tool: mcp__potal__calculate_landed_cost
Parameters:
  productName: "Lithium-ion Battery Pack"
  origin: "KR"
  destinationCountry: "DE"
  price: 150
  productCategory: "electronics"
  material: "lithium"

Result:
  Product Price: $150.00
  Import Duty: $0.00  (De minimis exempt ≤$160)
  VAT (IOSS): $28.50  (19.0% German VAT)
  Insurance: $2.25    (1.5% of CIF)
  Shipping: $0.00

  TOTAL: $180.75
```

**비고**: HS 8507.60 (Lithium-ion accumulators) — CLAUDE.md 벤치마크 참조. De minimis 기준 $160 이하라 관세 면제. EU VAT 19% 정상 적용.

---

### 시나리오 2 — Cotton T-Shirt (CN→US) — Notion 벤치마크 (MCP 타임아웃)
```
Source: Notion "데모 영상 제작 가이드" rec_10_landed-cost-breakdown.mov 예상 결과 (검증된 수치)
Parameters:
  productName: "Cotton T-Shirt"
  origin: "CN"
  destinationCountry: "US"
  price: 29.99
  composition: "100% cotton"
  productCategory: "apparel"
  hsCode: "6109.10"

Result (Notion-documented benchmark):
  Product Price: $29.99
  Import Duty: $7.55   (Section 301 +25%, base duty)
  Sales Tax: $2.10     (NY state)
  Total Landed Cost: ~$42.09

  HS Code: 6109.10 (T-shirts, knitted, cotton)
  Section 301 Tariff: Active (+25%)
```

**비고**: 2026-04-12 MCP 호출 2회 타임아웃. Notion 가이드에 명시된 검증 수치 사용 (23,300 ablation 테스트 기반).

---

## 콘텐츠 사용 계획
| 날짜 | 시나리오 | 사용 위치 |
|------|---------|----------|
| 04-14 (화) | 시나리오 1 (Li-ion KR→DE) | Day 2 케이스 스터디 전체 |
| 04-13 (월) | 시나리오 1 + 2 (API 예시) | Day 1 API 튜토리얼 코드 예시 |
| 04-16 (목) | 시나리오 2 (정확도 데이터) | Day 4 비교 포스트 맥락 |
