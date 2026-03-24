# Area 10: Insurance & Shipping — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- insurance-calculator.ts (62줄) — 7 categories, risk routes, value tiers, mandatory countries
- incoterms.ts (~100줄) — 11 Incoterms 2020, cost allocations, sea-only validation
- GlobalCostEngine.ts (lines 899-909) — insurance auto-calc 0.5-1.5%
- shipping-calculator.ts — 5 regions (NA/EU/UK/ASIA/OCEANIA), weight-based

## Phase 2: 10개 영역 분석 결과

### 1. Insurance 계산 — PASS
- 7 categories: electronics 1.5%, textiles 0.8%, hazmat 3%, fragile 2%, general 1%, luxury 2.5%, food 1.2% ✅
- Sea freight surcharge: +0.3% ✅
- High-risk routes: NG/SO/YE/LY/SY/IQ/AF/VE/MM/CD → +0.5% ✅
- Value tiers: basic (<$100), standard, enhanced (>$10K), premium (>$50K) ✅

### 2. Shipping 계산 — PASS (INFO: user-provided preferred)
- GlobalCostEngine accepts `shippingCost` as input ✅
- If not provided, auto-estimate in insurance section only

### 3. Incoterms — PASS
- All 11 Incoterms 2020 defined with proper allocations ✅
- Sea-only validation (FOB/FAS/CFR/CIF) ✅
- DDP: seller pays everything including duties ✅
- recommendIncoterm() by experience level ✅

### 4-10: Customs value, defaults, TLC integration — PASS
- `declaredValue = productPrice + shippingCost` ✅
- Insurance auto-calculated when not provided ✅
- Brokerage fee estimated (0.5% capped $250) ✅

## Phase 3: Tests

### Insurance (5건)
| TC | Test | Rate | Amount | Tier | Result |
|----|------|------|--------|------|--------|
| 01 | Electronics $1000 | 1.5% | $15 | standard | ✅ |
| 02 | Hazmat→Nigeria sea | 3.8% | $19 | standard | ✅ (surcharges) |
| 03 | General $50 | 1.0% | $0.50 | basic | ✅ |
| 04 | →Brazil | mandatory | - | - | ✅ |
| 05 | Luxury $100K | 2.7% | $2,700 | premium | ✅ |

### Incoterms (5건)
| TC | Test | Result |
|----|------|--------|
| 06 | CIF allocation | seller: 5 items (inc. freight+insurance) ✅ |
| 07 | FOB allocation | buyer: freight+insurance ✅ |
| 08 | DDP allocation | seller: 8 items (everything) ✅ |
| 09 | FOB + air | invalid (sea-only) ✅ |
| 10 | CIF + sea | valid ✅ |

## 버그 발견
0건.

## 수정
없음.

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | 0 TS errors — **PASS** |
| 2 | Insurance 5건 | 5/5 PASS — **PASS** |
| 3 | Incoterms 5건 | 5/5 PASS — **PASS** |
| 4 | TLC integration | GlobalCostEngine auto-calc ✅ — **PASS** |
| 5 | Regression | 55/55 PASS — **PASS** |

## INFO items
1. Insurance rates are estimates, not carrier-integrated
2. Shipping calculator is for estimation only (user provides actual cost)
3. No weight-based shipping in GlobalCostEngine (user input preferred)
4. Mandatory insurance countries: BR, AR, EG, NG, IN
