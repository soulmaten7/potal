# Area 6: Special Tax (12개국 특수세금) — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- CostEngine.ts (592줄) — BR/IN/CN/MX 특수세금 계산 + US/AU/NZ/CA/JP/KR processing fees
- GlobalCostEngine.ts (~1734줄) — TLC 합산, 12개국 processing fee switch/case
- eu-vat-rates.ts (337줄) — EU 27국 경감세율
- country-data.ts (1605줄) — US de minimis + 240국 프로필
- DB vat_gst_rates (240행), customs_fees (240행)

## Phase 2: 12개 영역 분석 결과

### 분석 1: Brazil 캐스케이딩 — PASS (1 BUG FIXED)
- BRAZIL_IPI_BY_CHAPTER: 95 chapter (Ch.61=0%, Ch.87=25%, Ch.24=300%) ✅
- **BUG**: `calculateBrazilImportTaxes()` used `BRAZIL_IPI_DEFAULT=0.10` always, ignoring chapter-specific rates
- **FIX**: Added optional `ipiRate` parameter + GlobalCostEngine passes `getBrazilIpiRate()` result
- PIS 2.1% + COFINS 9.65% = 11.75% ✅
- ICMS por dentro formula: `base / (1 - rate) * rate` ✅
- 27 states + DF hardcoded ✅

### 분석 2: India IGST — PASS
- Ch.71 = 3% (CW18 fix confirmed) ✅, Ch.01=5%, Ch.87=28%, fallback 18% ✅
- SWS = 10% of BCD ✅
- IGST base = CIF + BCD + SWS ✅
- Math: $10K gold → SWS=$125, IGST=$341.25, total=$466.25 ✅

### 분석 3: China CBEC — PASS
- CBEC threshold: $700 (~¥5,000) ✅
- CBEC discount: 70% of VAT+CT ✅
- CT: cosmetics 15%, jewelry 10%, vehicles 9%, watches 20% ✅
- Math: $100 cosmetics CBEC → VAT=$10.17, CT=$11.73, total=$21.90 ✅

### 분석 4: Mexico IEPS — PASS
- HS 2208 spirits = 53% ✅ (CW18 fix confirmed)
- HS 2203 beer = 26.5%, Ch.24 tobacco = 160% ✅
- IVA 16% on (CIF + duty + IEPS) cascading ✅
- Math: $100 spirits → IEPS=$63.60, IVA=$29.38, total=$92.98 ✅

### 분석 5-12: Processing Fees + EU VAT + IOSS + US tax — PASS
- All 13 countries verified (same as Area 4 검수)
- EU 27국 confirmed (same as Area 2 검수)
- US de minimis CN/HK $0 confirmed (same as Area 3 검수)

## Phase 3: Bug Fix

**1건 수정**: Brazil IPI chapter-specific rate not passed to calculation function

변경 전 (GlobalCostEngine.ts line 652):
```typescript
const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate);
```

변경 후:
```typescript
const brHsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
const brIpiRate = brHsChapter ? getBrazilIpiRate(brHsChapter + '0000') : undefined;
const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate, brIpiRate);
```

Also added `ipiRate?: number` optional parameter to `calculateBrazilImportTaxes()`.

## CW18 5차 수정 재확인

| 항목 | 예상 | 실제 | 확인 |
|------|------|------|------|
| India Ch.71 IGST | 0.03 | 0.03 | ✅ |
| Mexico 2208 IEPS | 0.53 | 0.53 | ✅ |
| EU VAT 27국 | 27국 | 27국 | ✅ |
| US MPF 전체 원산지 | 전체 | 전체 | ✅ |
| US de minimis CN | $0 | $0 | ✅ |
| Brazil IPI chapter별 | 15+ ch | 95 ch | ✅ |

## 검수 결과

| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ✓ Compiled, 0 TS errors in cost-engine — **PASS** |
| 2 | 캐스케이딩 수학 검증 | 7/8 PASS (BR IPI fixed, all others correct) — **PASS** |
| 3 | CW18 5차 수정 재확인 | 6/6 ✅ — **PASS** |
| 4 | 12국 Processing Fee | 13/13 ✅ (same as Area 4) — **PASS** |
| 5 | Regression | 55/55 PASS (100%) — **PASS** |

## 최종
- 총 버그: 1건 (Brazil IPI chapter rate not passed to calculator)
- 수정: 1건 (CostEngine.ts + GlobalCostEngine.ts)
- 잔여: 0건

## 수정 파일
- CostEngine.ts — `calculateBrazilImportTaxes()` optional `ipiRate` parameter added
- GlobalCostEngine.ts — `getBrazilIpiRate()` import + async path passes chapter-specific rate

## 생성 파일
- AREA6_SPECIAL_TAX_RESULT.md
- Work log 시트
