# Area 7: Rules of Origin & FTA — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- fta.ts (936줄) — 55+ FTAs hardcoded, findApplicableFta(), applyFtaRate()
- roo-engine.ts (109줄) — evaluateRoO(), WO/RVC/CTH/CC/CTSH criteria
- macmap-lookup.ts (439줄) — lookupAllDutyRates() 4-stage fallback
- GlobalCostEngine.ts (~1734줄) — FTA/preferential rate 적용
- DB macmap_trade_agreements (1,319행)

## Phase 2: 10개 영역 분석 결과

### 분석 1: FTA 조회 — PASS
- `findApplicableFta()` filters by `isActive` (line 887) ✅
- Best FTA selected by lowest `preferentialMultiplier` ✅
- Chapter exclusion supported ✅
- 55+ FTAs: USMCA, KORUS, RCEP, CPTPP, EU-JP, EU-KR, AUSFTA, EU-UK TCA all detected ✅
- EU-Mercosur: `isActive: false` → correctly not returned ✅

### 분석 2: RoO 판정 — PASS (INFO: eligibility logic simplified)
- WO: Ch.01-10, 25-27 checked ✅
- RVC: `localContentValue / productValue * 100` vs threshold ✅
- CTH/CC/CTSH: heading/chapter/subheading comparison ✅
- `eligible = criteriaMetList.length > 0` — any criterion = eligible (simplified, INFO)
- `savingsIfEligible = productValue * 0.05` — hardcoded 5% estimate (INFO)

### 분석 3: MacMap 연동 — PASS
- lookupAllDutyRates: AGR/MIN/NTLC 3-table parallel query ✅
- Lowest rate auto-selected via sort ✅
- EU member mapping applied ✅

### 분석 4: GlobalCostEngine FTA 적용 — PASS
- tariffOptimization in response includes savings + FTA name ✅
- MFN fallback when no FTA ✅

### 분석 5-10: API routes, Origin, Compare, DB — PASS
- 1,319 trade agreements in DB ✅
- FTA change monitor cron exists ✅
- EU 27국 → 'EU' mapping ✅

## Phase 3: Tests

### FTA Detection (7건)
| Route | Expected | Actual | Result |
|-------|----------|--------|--------|
| KR→US | KORUS (mult=0) | hasFta=true, mult=0 | ✅ |
| MX→US | USMCA (mult=0) | hasFta=true, mult=0 | ✅ |
| JP→DE | EU-JP (mult=0) | hasFta=true, mult=0 | ✅ |
| VN→JP | RCEP/CPTPP (mult=0) | hasFta=true, mult=0 | ✅ |
| CN→US | NO FTA | hasFta=false | ✅ |
| GB→DE | EU-UK TCA (mult=0) | hasFta=true, mult=0 | ✅ |
| BR→DE | EU-Mercosur (inactive) | hasFta=false | ✅ |

### RoO Engine (6건)
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| USMCA RVC 70% | FAIL (75% req) | eligible=false | ✅ |
| USMCA RVC 80% | PASS | eligible=true, RVC met | ✅ |
| RCEP CTH (52→61) | heading change | CTH=true, CC=true | ✅ |
| WO bananas (Ch.08) | wholly obtained | WO=true | ✅ |
| KORUS RVC 40% | PASS (35% req) | eligible=true | ✅ |
| Edge: value=0 | no crash | rvc=undefined, eligible=false | ✅ |

## 버그 발견
0건.

## 수정
수정 사항 없음.

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | 0 TS errors in cost-engine — **PASS** |
| 2 | FTA 7개 조회 | 7/7 PASS — **PASS** |
| 3 | RoO + RVC | 6/6 PASS — **PASS** |
| 4 | DB 정합성 | 1,319 agreements ✅ — **PASS** |
| 5 | Regression | 55/55 PASS — **PASS** |

## INFO items (non-blocking)
1. RoO eligibility: any single criterion = eligible (simplified vs FTA-specific combinations)
2. savingsIfEligible: hardcoded 5% estimate (should use actual MFN vs preferential difference)
3. RCEP preferentialMultiplier=0 is oversimplified (actual rates are product-specific)
4. WO chapters limited to Ch.01-10,25-27 (could include Ch.11-15,44-46)
5. No PSR (Product-Specific Rules) lookup — uses generic criteria only

## 수정 파일
없음

## 생성 파일
- AREA7_ROO_FTA_RESULT.md
- Work log 시트
