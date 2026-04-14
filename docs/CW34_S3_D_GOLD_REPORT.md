# CW34-S3-D Gold Business Rules Report
**작성일**: 2026-04-14 KST
**상태**: ✅ 완료

## 요약

| 지표 | 값 | 목표 | 달성 |
|------|-----|------|------|
| 입력 (unified Silver) | 572,722 | — | — |
| **출력 (Gold)** | **645,591** | ≥600,000 | ✅ |
| rule_split 추가 rows | 73,084 | — | — |
| 중복 제거 | 13,961 | — | — |
| EBTI enrichment JOIN | 231,703 / 231,727 (99.99%) | — | ✅ |
| CROSS enrichment JOIN | 23,611 / ~23,612 (99.99%) | — | ✅ |
| Confidence 평균 | 0.64 | — | — |
| needs_manual_review | 0 (0%) | ≤1% | ✅ |

## 10 Field 커버리지

| 필드 | 채움 수 | 비율 | 목표 | 달성 |
|------|---------|------|------|------|
| material | 121,191 | **18.8%** | ≥70% | ❌ |
| material_composition | 14,615 | 2.3% | — | — |
| product_form | 58,610 | **9.1%** | ≥35% | ❌ |
| intended_use | 152,626 | **23.6%** | ≥15% | ✅ |

## Status 분포

| Status | 건수 | 비율 |
|--------|------|------|
| active | 341,019 | 52.8% |
| expired | 231,702 | 35.9% |
| historical | 1 | 0.0% |
| revoked | 0 | 0.0% |

## HS Version 분포

| Version | 건수 | 비율 |
|---------|------|------|
| null (날짜 없음) | 317,408 | 49.2% |
| HS2007 이전 | 231,747 | 35.9% |
| HS2012 | 10,241 | 1.6% |
| HS2017 | 8,010 | 1.2% |
| HS2022 | 5,316 | 0.8% |

## Confidence 분포

| 구간 | 건수 | 비율 |
|------|------|------|
| 1.0 | 11,738 | 1.8% |
| 0.9 | 18,627 | 2.9% |
| 0.8 | 46,757 | 7.2% |
| 0.7 | 216,831 | 33.6% |
| 0.6 | 256,319 | 39.7% |
| 0.5 | 95,090 | 14.7% |
| 0.4 | 229 | 0.0% |

## 고신뢰 샘플 (≥0.9)

| ruling_id | source | hs_code | product_name | material | form | use | confidence |
|-----------|--------|---------|-------------|----------|------|-----|------------|
| N354602 | cbp_cross | 0202305025 | Frozen Boneless Beef | — | frozen | food | 0.90 |
| N357452 | cbp_cross | 0202305035 | Frozen Boneless Marinated Beef | — | frozen | food | 0.90 |
| N309844 | cbp_cross | 0203229000 | Frozen Pork Loin Ribs | bone | frozen | food | 0.95 |
| N357487 | cbp_cross | 0202305085 | Frozen Seasoned Beef | — | frozen | food | 0.90 |
| N342847 | cbp_cross | 0202305085 | Frozen Seasoned Boneless Beef | plastic* | ground | clothing* | 1.00 |

*N342847: material=plastic, intended_use=clothing은 오탐 (beef 상품에 "plastic packaging", "clothing" 키워드 매칭). keyword matcher 정확도 개선 CW35 backlog.

## 저신뢰 샘플 (≤0.5)

| ruling_id | source | hs_code | product_name | country | hs_version | confidence |
|-----------|--------|---------|-------------|---------|------------|------------|
| IT-2003-0330M | eu_ebti | 84713000 | Macchina automatica... (IT) | IT | HS2002 | 0.49 |
| IT-2003-0340A | eu_ebti | 22060039 | Bevanda fermentata... (IT) | IT | HS2002 | 0.49 |
| IT-2003-0384C | eu_ebti | 39261000 | Articolo per ufficio... (IT) | IT | HS2002 | 0.49 |
| FI22/301/04 | eu_ebti | 48115900 | Tuote on laminaattia... (FI) | FI | HS2002 | 0.49 |
| FI23/301/04 | eu_ebti | 39219060 | Tuote on laminaattia... (FI) | FI | HS2002 | 0.49 |

저신뢰 패턴: **비영어 EBTI + HS2002 이전 + 10 Field 전부 null**. 이탈리아어/핀란드어 상품 설명에서 영어 키워드 매칭 불가.

## 발견 사항

1. **material 18.8%**: 목표 70% 미달. 원인: (a) EBTI 46% 독일어 — 영어 키워드 매칭 안 됨, (b) unified의 product_name이 짧고 material 정보 적음. **다국어 키워드 사전 필요** (CW35 backlog).

2. **product_form 9.1%**: 목표 35% 미달. 같은 다국어 이슈 + product_name이 "Frozen Beef" 수준으로 짧아서 form 정보 부족.

3. **conditional_rules 1건**: 판례 원문에 "if X% then Y%" 패턴이 거의 없음. 관세 조건부 규칙은 판례가 아니라 tariff schedule에 있음. CEO 결정 2번(duty_rate S3 제외)과 일관.

4. **HS version null 49%**: CROSS search 소스(cbp_cross_search)는 unified에서 ruling_date 없이 들어옴. CROSS batch enrichment JOIN이 ruling_date를 보강하지만 search 소스는 batch에 없음.

5. **rule_split 73K건 추가**: 572K → 645K. 12.8% 증가. full_text에서 다른 hs6 prefix 발견 시 별도 row 생성.

## Gold 경로

```
/Volumes/soulmaten/POTAL/warehouse/gold/
├── customs_rulings.jsonl   (645,591 records)
└── _stats.json
```

## 다음 단계

CW34-S3-E Platinum Supabase Load: Gold JSONL → customs_rulings_staging → 검증 → swap.
