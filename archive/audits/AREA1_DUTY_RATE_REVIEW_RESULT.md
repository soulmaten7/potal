# Area 1: Duty Rate — Deep Review Result
# 2026-03-23 KST

## 검사 항목: 10개
## PASS: 10/10
## FAIL→FIXED: 0개 (이전 세션에서 이미 수정 완료)
## 잔여 이슈: 0개

## 세율 정확도 검증: 10/10 PASS
| # | Route | HS | Rate | Source |
|---|-------|-----|------|--------|
| 1 | CN→US | 610910 | 16.5% | agr |
| 2 | CN→DE(EU) | 610910 | 12.0% | agr |
| 3 | CN→JP | 610910 | 10.9% | agr |
| 4 | CN→KR | 610910 | 5.2% | min |
| 5 | VN→US | 610910 | 16.5% | agr |
| 6 | MX→US | 610910 | 16.5% | agr |
| 7 | DE→US | 870323 | 2.5% | agr |
| 8 | JP→US | 870323 | 2.5% | agr |
| 9 | GB→US | 220830 | 0.0% | agr |
| 10 | CN→US | 950300 | 0.0% | agr |

## 엣지 케이스: 5/5 PASS
| Case | Result |
|------|--------|
| Empty HS | null (no error) ✅ |
| Empty destination | null (no error) ✅ |
| Invalid country "XX" | null (no error) ✅ |
| Lowercase "us"/"cn" | 16.5% (correct) ✅ |
| Dotted "6109.10" | 16.5% (correct) ✅ |

## Section 301/232: 6/6 PASS
- CN/610910 textiles → 25% List 3 ✅
- CN/851762 electronics → 25% List 1 ✅
- VN/610910 non-CN → null (correct) ✅
- CN/720917 steel → 25% ✅
- CN/760120 aluminum → 25% (updated from 10%) ✅
- AU/720917 steel → 25% (exemption revoked) ✅

## 코드 경로 맵
```
POST /api/v1/calculate
  → GlobalCostEngine.calculateGlobalLandedCostAsync()
    → lookupAllDutyRates(dest, origin, hsCode)     [macmap-lookup.ts]
      → Promise.all([lookupAgrAll, lookupMin, lookupNtlc])
      → Sort by rate ASC → return optimal
    → lookupUSAdditionalTariffs(origin, hsCode)     [section301-lookup.ts]
      → checkSection301() + checkSection232()
    → lookupTradeRemedies(dest, origin, hsCode)     [trade-remedy-lookup.ts]
    → Total = MFN/FTA + Section301 + Section232 + AD/CVD
```

## DB 커버리지
- macmap_ntlc_rates: 874,302행, 53개국
- macmap_min_rates: ~105M행, 53개국
- macmap_agr_rates: ~129M행, 53개국
- EU mapping: 27 member states → "EU" ✅

## npm run build: ✅
## Regression 55/55: ✅
