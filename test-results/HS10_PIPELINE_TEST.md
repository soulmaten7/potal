# HS10 Pipeline Verification Test Report
## Date: 2026-03-14T13:33:53.244Z
## Result: 20/20 PASSED

| # | Test | Result | Details |
|---|------|--------|---------|
| T01 | US Cotton T-Shirt HS10 | ✅ PASS | code=61051000, precision=HS10, method=divergence_rule, desc="Of cotton" |
| T02 | EU Leather Shoes HS10 | ✅ PASS | code=6403911800, precision=HS10, method=divergence_rule |
| T03 | GB Ceramic Mug | ✅ PASS | code=691110, precision=HS6, method=hs6_fallback |
| T04 | KR Stainless Steel Pan | ✅ PASS | code=732393, precision=HS6, method=hs6_fallback |
| T05 | CA Plastic Container | ✅ PASS | code=392410, precision=HS6, method=hs6_fallback |
| T06 | AU Cotton Fabric | ✅ PASS | code=520812, precision=HS6, method=hs6_fallback |
| T07 | JP IC Processor | ✅ PASS | code=854231, precision=HS6, method=hs6_fallback |
| T08 | FR→EU Cotton Polo | ✅ PASS | code=6105100000, precision=HS10, method=first_candidate |
| T09 | Price Break — Over Threshold | ✅ PASS | hs6=900640, country=US, price=20, code=9006409000, method=price_break |
| T10 | Price Break — Under Threshold | ✅ PASS | hs6=900640, country=US, price=0, code=9006404000, method=first_candidate |
| T11 | Divergent HS6 — US vs GB | ✅ PASS | hs6=010121, US=01012100(first_candidate), GB=0101210000(first_candidate) |
| T12 | Standard HS6 — Consistent | ✅ PASS | hs6=010130, code=0101300000, method=first_candidate |
| T13 | BR HS6 Fallback | ✅ PASS | code=610510, precision=HS6 |
| T14 | IN HS6 Fallback | ✅ PASS | code=854231, precision=HS6 |
| T15 | ZA HS6 Fallback | ✅ PASS | code=640391, precision=HS6 |
| T16 | Cache Hit Verification | ✅ PASS | 1st=divergence_rule, 2nd=cache_hit |
| T17 | Keywords Table Populated | ✅ PASS | count=25484 |
| T18 | Divergence Map Populated | ✅ PASS | count=61258 |
| T19 | Product HS Mappings Expanded | ✅ PASS | count=8389 |
| T20 | Gov Tariff Schedules Multi-Country | ✅ PASS | countries=[AU,CA,EU,GB,JP,KR,US], total=7 |

## Pipeline Components Verified
- HS10 Resolver: Cache → Price Break → Divergence → Keyword → First Candidate → HS6 Fallback
- 7 HS10 Countries: US, EU(27), GB, KR, CA, AU, JP
- 233 HS6 Countries: Fallback with MFN/MIN/AGR rates
- DB Tables: gov_tariff_schedules, divergence_map, hs_description_keywords, hs_price_break_rules, product_hs_mappings

## DB Statistics
- divergence_map: 61,258 rows
- hs_description_keywords: 25,484 rows
- hs_price_break_rules: 17 rows
- product_hs_mappings: 8,389 rows (expanded from 1,017)
- gov_tariff_schedules: 89,842 rows (7 countries)
