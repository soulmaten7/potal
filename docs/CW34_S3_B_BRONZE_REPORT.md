# CW34-S3-B Bronze Ingestion Report
**작성일**: 2026-04-14 KST
**상태**: ✅ 완료

## 요약

| 지표 | 값 |
|------|-----|
| 소스 수 | 3 (ebti_raw, cross_batch, unified) |
| 파일 수 | 10 |
| 총 라인/아이템 수 | 3,257,528 |
| 총 크기 | 681.7 MB |
| Idempotency | ✅ 재실행 시 10/10 skip |
| Hash 검증 | ✅ 원본 = Bronze 복사본 |

## 소스별 상세

| Source | Files | Rows | Size (MB) | 비고 |
|--------|-------|------|-----------|------|
| ebti_raw | 1 | 2,642,926 lines | 247.8 | multiline CSV → 실 레코드 ~231K |
| cross_batch | 8 | 39,430 items | 190.5 | JSON array, 19 keys, full text 포함 |
| unified | 1 | 575,172 records | 243.5 | JSONL, Silver 직행 베이스 |
| **TOTAL** | **10** | **3,257,528** | **681.7** | |

## Bronze 경로

```
/Volumes/soulmaten/POTAL/warehouse/bronze/
├── ebti/2026-04-14/ebti_rulings.csv          (247.8MB)
├── cross/2026-04-14/batch_001..008.json      (190.5MB)
├── unified/2026-04-14/unified_rulings.jsonl  (243.5MB)
└── _manifest.jsonl                           (10 entries)
```

## SHA256 검증

| 파일 | SHA256 | 원본=복사본 |
|------|--------|-----------|
| ebti_rulings.csv | `62db4cd3...8a8914` | ✅ |
| unified_rulings.jsonl | `dc5b2b60...734f0c` | ✅ |
| batch_001..008.json | manifest 기록 | ✅ (idempotency 통과) |

## Platinum 예상 row 수 (중복 제거 전)

- unified 베이스: 575,172
- EBTI raw 보강: +0 (JOIN, 신규 row 없음)
- CROSS batch 보강: +0 (JOIN, 신규 row 없음)
- rule_split 증가분: +5~10%
- **예상 Platinum: ~600,000-650,000 rows**

## 다음 단계

CW34-S3-C Silver Normalization: unified JSONL → 정규화 + EBTI raw/CROSS batch에서 보강 필드 JOIN.
