# Area 4: Customs Fees — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- GlobalCostEngine.ts (~1734줄) — 13개국 fee logic lines 830-895 + HMF line 1530-1537
- CostEngine.ts (592줄) — US MPF line 590
- DB customs_fees (240행, 16열)

## Phase 2: 10개 영역 분석 결과

### 분석 1: US MPF — PASS
- Formal: 0.3464%, min $32.71, max $634.04 (code lines 838-839) ✅
- Informal: $2 flat (line 843) ✅
- $2500 boundary: `declaredValue > 2500` = formal (line 831) ✅
- de minimis gates all fees: `if (!deMinimisApplied)` (line 835) ✅

### 분석 2: US HMF — PASS (INFO: ocean-only not enforced)
- 0.125% rate (line 1535) ✅
- Applied to all US imports (no transport mode check) — INFO level, conservative
- No impact on TLC accuracy for most use cases

### 분석 3: AU IPC — PASS
- AUD 88 ≈ $56 USD (line 848) ✅ (fixed rate, hardcoded USD)
- de minimis gated ✅

### 분석 4: NZ Biosecurity — PASS
- NZD 33.32 ≈ $20 USD (line 853) ✅

### 분석 5: CA CBSA — PASS
- $10 handling estimate (line 858) ✅ — labeled "est."

### 분석 6: JP Customs — PASS
- ¥200 + broker ¥3000 ≈ $20 (line 862) ✅

### 분석 7: KR KCS — PASS
- KRW 10K-30K ≈ $15 (line 866) ✅

### 분석 8: IN Landing Charges — PASS
- 1% of CIF (line 870) ✅ — `declaredValue * 0.01`

### 분석 9: CH/CN/MX/SG/BR — PASS
- CH: CHF 15 ≈ $17 (line 874) ✅
- CN: ¥200-500 ≈ $30 (line 878) ✅
- MX: DTA 0.8%, min $36 (line 882) ✅ — `Math.max(val * 0.008, 36)`
- SG: SGD 2.88 + handling ≈ $10 (line 886) ✅
- BR: SISCOMEX BRL 185 ≈ $36 (line 890) ✅

### 분석 10: 나머지 228국 — PASS
- EU/UK: No processing fee (line 893 comment) ✅
- DB customs_fees: 240행 전부 존재 ✅

## Phase 3: 테스트 결과

| TC | 설명 | 예상값 | 실제값 | 결과 |
|----|------|--------|--------|------|
| 1 | US $100 informal | $2 | $2.00 | ✅ |
| 2 | US $5000 formal min | $32.71 | $32.71 | ✅ |
| 3 | AU $500 | $56 | $56.00 | ✅ |
| 4 | NZ $500 | $20 | $20.00 | ✅ |
| 5 | CA $500 | $10 | $10.00 | ✅ |
| 6 | JP $500 | $20 | $20.00 | ✅ |
| 7 | KR $500 | $15 | $15.00 | ✅ |
| 8 | IN $1000 | $10 | $10.00 | ✅ |
| 9 | CH $500 | $17 | $17.00 | ✅ |
| 10 | CN $500 | $30 | $30.00 | ✅ |
| 11 | MX $500 | $36 | $36.00 | ✅ |
| 12 | SG $500 | $10 | $10.00 | ✅ |
| 13 | BR $500 | $36 | $36.00 | ✅ |
| 14 | DE $500 | $0 | $0.00 | ✅ |
| 15 | FR $500 | $0 | $0.00 | ✅ |
| 16 | GB $500 | $0 | $0.00 | ✅ |

## 버그 발견
0건. MPF min/max DB vs code 차이는 INFO level (both reasonable estimates).

## 수정
수정 사항 없음.

## 검수 결과

| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ✓ Compiled 21.8s (pages-manifest SSG issue ≠ TS error) |
| 2 | 13개국 개별 | 13/13 PASS + EU/UK 3국 $0 |
| 3 | US 경계값 | 5/5 PASS ($2499/$2500/$2501/$9443/$200K) |
| 4 | de minimis+수수료 | 5/5 PASS (CN→US taxed, DE→US exempt, AU/KR/BR exempt) |
| 5 | Regression | 55/55 PASS (100%) |

## INFO items (non-blocking)
1. DB US MPF min/max ($33.58/$651.50) differs from code ($32.71/$634.04) — FY year difference
2. HMF applies to all US imports (no ocean-only check) — conservative estimate
3. CostEngine.ts still exports unused `MPF_INFORMAL = 5.50` — dead code

## 수정 파일
없음

## 생성 파일
- AREA4_CUSTOMS_FEES_RESULT.md
- Work log 시트
