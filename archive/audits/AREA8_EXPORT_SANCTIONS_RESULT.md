# Area 8: Export Controls + Sanctions Screening — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- export-controls.ts (112줄) — ECCN classification, deterministic license exceptions
- fuzzy-screening.ts (~126줄) — Levenshtein + Soundex + token matching
- db-screen.ts (~307줄) — DB sanctions screening with alias/address/id JOINs
- DB: sanctions_entries (21,301), sanctions_aliases (22,328), sanctions_addresses (24,176), sanctions_ids (8,000)

## Phase 2: 10개 영역 분석 결과

### 분석 1: ECCN 분류 — PASS
- 8 HS chapters mapped to ECCN categories ✅
- Ch.87 (vehicles) correctly NOT mapped (EAR99) ✅
- CW18 fix: `determineLicenseExceptions()` replaces Math.random() ✅
- LVS/GBS (cat 1-9), TSR (cat 3-5), TMP/RPL (all) ✅

### 분석 2: 퍼지 매칭 — PASS
- fuzzy-screening.ts: Levenshtein + Soundex + token overlap ✅
- CW18 fix: table name `sanctions_sdn`→`sanctions_entries` ✅
- CW18 fix: SQL wildcard escape (`%` → `\%`) ✅
- Default threshold: 0.85 (reasonable for sanctions) ✅

### 분석 3: DB 스크리닝 — PASS
- db-screen.ts: exact → ilike → pg_trgm fuzzy → alias JOIN ✅
- Graceful fallback to in-memory on DB failure ✅
- `SANCTIONED_COUNTRIES`: CU, IR, KP, SY, RU, BY (Belarus added CW18) ✅

### 분석 4: Product Restrictions — PASS (INFO)
- Basic country+product restriction checking exists
- No detailed HS-level restriction database — uses generic rules

### 분석 5-10: APIs, GlobalCostEngine, DB integrity — PASS
- 8 API endpoints covering export controls / sanctions / restrictions / verify ✅
- DB: 0 orphan records across all 3 FK relationships ✅
- 12 sources (OFAC_SDN 14,600 = 68.5% of total) ✅

## CW18 수정 재확인

| 항목 | 예상 | 실제 | 확인 |
|------|------|------|------|
| Math.random() 제거 | deterministic | `determineLicenseExceptions()` function ✅ | ✅ |
| 10회 반복 동일 결과 | 전부 동일 | "LVS,GBS,TMP,RPL" × 10 | ✅ |
| Ch.87 ECCN 제거 | EAR99 | not in HS_TO_ECCN_MAP | ✅ |
| sanctions_entries table | correct name | `sanctions_entries` in fuzzy-screening.ts | ✅ |
| SQL wildcard escape | escaped | `.replace(/%/g, '\\%')` | ✅ |
| Belarus sanctioned | BY in set | `SANCTIONED_COUNTRIES` has BY | ✅ |

## Phase 3: Tests

### Export Controls (5건)
| TC | Description | Expected | Actual | Result |
|----|------------|----------|--------|--------|
| 01 | laptop→IR | controlled + license | ECCN=2B, license=true, exception=false | ✅ |
| 02 | t-shirt→IR | EAR99 but sanctions block | ear99=true, license=true (comprehensive) | ✅ |
| 03 | electronics→CN | controlled + Tier B | ECCN=3A, license=true, LVS exception | ✅ |
| 04 | laptop→CA | no license (ally) | license=false | ✅ |
| 05 | ammunition | always controlled | ECCN=0A, Ch.93 mapped | ✅ |

### DB Integrity (3건)
| TC | Description | Expected | Actual | Result |
|----|------------|----------|--------|--------|
| 27 | Orphan aliases | 0 | 0 | ✅ |
| 28 | Orphan addresses | 0 | 0 | ✅ |
| 29 | Orphan ids | 0 | 0 | ✅ |

### Source Distribution
| Source | Count | % |
|--------|-------|---|
| OFAC_SDN | 14,600 | 68.5% |
| BIS_ENTITY | 3,420 | 16.1% |
| BIS_DPL | 1,596 | 7.5% |
| STATE_DTC | 787 | 3.7% |
| Others (8) | 898 | 4.2% |
| **Total** | **21,301** | **100%** |

## 버그 발견
0건.

## 수정
수정 사항 없음.

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | 0 TS errors in compliance/ — **PASS** |
| 2 | Export Controls | 5/5 PASS + CW18 10회 deterministic — **PASS** |
| 3 | Sanctions DB | 21,301 entries, 12 sources, 0 orphans — **PASS** |
| 4 | DB integrity | 3/3 FK checks PASS — **PASS** |
| 5 | Regression | 55/55 PASS (100%) — **PASS** |

## INFO items
1. ECCN mapping only 8 chapters (simplified — real CCL has 2,500+ entries)
2. Product restrictions are generic (no detailed HS-level database)
3. fuzzy-screening.ts and db-screen.ts are parallel implementations — db-screen preferred
4. EAR99 items still blocked for CONTROLLED_DESTINATIONS (correct per OFAC comprehensive sanctions)

## 수정 파일
없음

## 생성 파일
- AREA8_EXPORT_SANCTIONS_RESULT.md
- Work log 시트
