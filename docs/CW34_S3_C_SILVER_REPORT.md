# CW34-S3-C Silver Normalization Report
**작성일**: 2026-04-14 KST
**상태**: ✅ 완료

## 요약

| 파일 | Records | Skipped | 비고 |
|------|---------|---------|------|
| `unified.jsonl` | 572,722 | 2,450 | hs6 invalid (5자리 미만) skip |
| `ebti_enrichment.jsonl` | 269,730 | 0 | papaparse 269,730 rows parsed |
| `cross_enrichment.jsonl` | 39,430 | 0 | 8 batch files |
| **합계** | **881,882** | **2,450** | |

## 품질 지표

### Unified (572,722건)
- HS6 길이 분포: **100% 6자리** (572,722/572,722)
- HS code non-digit: **0건**
- Mojibake: **0건**

### EBTI Enrichment (269,730건)
- Bad dates (non-ISO): **0건**
- valid_from 채움률: **100%** (269,730/269,730)
- keywords 채움률: **97.6%** (263,226/269,730)
- language 채움률: **100%**
- Status: 전부 `invalid` (EBTI raw의 STATUS 필드 기준)

**국가 분포 (Top 10)**:
| 국가 | 건수 | 비율 |
|------|------|------|
| DE | 120,132 | 44.5% |
| GB | 47,035 | 17.4% |
| FR | 34,669 | 12.9% |
| NL | 21,074 | 7.8% |
| IE | 7,736 | 2.9% |
| PL | 6,719 | 2.5% |
| AT | 4,826 | 1.8% |
| CZ | 4,772 | 1.8% |
| ES | 3,317 | 1.2% |
| BE | 2,901 | 1.1% |

**언어 분포**: de 46.3%, en 20.3%, fr 13.0%, nl 8.7%, pl 2.5%, cs 1.8%, es 1.2%, sv 1.0%

### CROSS Enrichment (39,430건)
- full_text 채움률: **100%** (39,430/39,430)
- tariffs 채움률: **80.0%** (31,553/39,430)
- ruling_date 채움률: **100%**
- USMCA: 540건
- Categories: Classification 78.0%, Carriers 11.4%, Origin 4.0%

### Mojibake
- **0건** (모든 Silver 파일)

## 발견 사항

1. **EBTI status 전부 "invalid"**: EBTI raw CSV의 STATUS 컬럼이 대부분 빈값이거나 "INVALID". 실측에서 확인된 대로 STATUS 필드가 신뢰할 수 없음 → Gold에서 valid_to 날짜 기준으로 active/expired 재판정 필요.

2. **EBTI row 수 증가**: S2.5에서 `grep -c 'eu_ebti'`로 231,727건 추정했으나, papaparse 멀티라인 파싱 결과 **269,730건**. for_db 버전(231K)보다 raw(269K)가 더 많음 — for_db가 일부 필터링된 subset이었음 확인.

3. **CROSS tariffs 80% 채움**: S2.5 실측(batch_001 기준 10%)보다 훨씬 높음. batch_001이 Carriers 카테고리 집중이라 tariffs가 적었던 것. 전체 평균 80%.

4. **Unified skip 2,450건**: hs6가 5자리 미만이거나 non-numeric. 전체의 0.4% — 허용 범위.

## Silver 경로

```
/Volumes/soulmaten/POTAL/warehouse/silver/
├── unified.jsonl           (572,722 records)
├── ebti_enrichment.jsonl   (269,730 records)
├── cross_enrichment.jsonl  (39,430 records)
└── _stats.json
```

## 다음 단계

CW34-S3-D Gold Business Rules: unified + ebti_enrichment + cross_enrichment JOIN → customs_rulings.jsonl
