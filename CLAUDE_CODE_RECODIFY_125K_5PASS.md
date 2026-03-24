# Claude Code 명령어: 125,576행 전체 재코드화 + 5회 반복 검수

> **날짜**: 2026-03-21 KST
> **목표**: gov_tariff_schedules 125,576행 전체 (기존 89,842 + 신규 35,734)를 코드화하고 5회 반복 검수로 오류 0건 확인
> **배경**: 이전 codified_national_v5.json은 89,842행 기준. 새로 추가된 KR 10자리(11,293), JP 9자리(9,443), AU 8자리(6,806), CA 8자리(7,103), US 누락(1,089) = 35,734행이 코드화 안 됨.
> **방법**: 1차 코드화 → 2차~5차 각각 다른 관점으로 검수 → 최종 오류 0건

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 데이터 소스

gov_tariff_schedules에서 국가별 전체 추출 (125,576행):

```sql
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres

-- 국가별 현재 상태 확인
SELECT country, length(hs_code) as len, count(*) FROM gov_tariff_schedules
GROUP BY country, length(hs_code) ORDER BY country, len;

-- 국가별 CSV 추출 (코드화 입력용)
\copy (SELECT * FROM gov_tariff_schedules WHERE country='US' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/us/tariff_schedule_full.csv' WITH CSV HEADER;
\copy (SELECT * FROM gov_tariff_schedules WHERE country='EU' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/eu/tariff_schedule_full.csv' WITH CSV HEADER;
\copy (SELECT * FROM gov_tariff_schedules WHERE country='GB' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/gb/tariff_schedule_full.csv' WITH CSV HEADER;
\copy (SELECT * FROM gov_tariff_schedules WHERE country='KR' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/kr/tariff_schedule_full.csv' WITH CSV HEADER;
\copy (SELECT * FROM gov_tariff_schedules WHERE country='JP' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/jp/tariff_schedule_full.csv' WITH CSV HEADER;
\copy (SELECT * FROM gov_tariff_schedules WHERE country='AU' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/au/tariff_schedule_full.csv' WITH CSV HEADER;
\copy (SELECT * FROM gov_tariff_schedules WHERE country='CA' ORDER BY hs_code) TO '/Volumes/soulmaten/POTAL/hs_national_rules/ca/tariff_schedule_full.csv' WITH CSV HEADER;
```

---

## 1차: 전체 코드화 (125,576행)

이전 codify_national_tariffs.py 스크립트와 동일한 방식으로 전체 125,576행 코드화.

### 패턴 유형 (11종):
```
PRICE_THRESHOLD: "valued not over $X" → {threshold, condition, currency}
MATERIAL_DETAIL: "of cotton", "of stainless steel" → {material}
PROCESSING: "knitted or crocheted", "woven" → {processing}
GENDER: "men's or boys'" → {gender}
COMPOSITION_PCT: "containing 85 percent" → {min_pct, material}
SIZE_THRESHOLD: "not over 27.9 cm" → {max_cm}
WEIGHT_THRESHOLD: "weighing not more than X kg" → {max_kg}
END_USE: "for food contact" → {end_use}
CATCH_ALL: "other", "n.e.c." → {is_catch_all}
INDENT_PARENT: US only, 계층 부모 → {is_parent, children}
GENERAL: 기타 → {pattern: 'GENERAL'}
```

### 각 entry의 코드화 구조:
```json
{
  "country": "KR",
  "national_code": "6109100000",
  "description": "Of cotton",
  "hs6": "610910",
  "hs4": "6109",
  "indent": 0,
  "pattern_type": "MATERIAL_DETAIL",
  "conditions": {
    "material": "cotton"
  },
  "keywords": ["cotton", "t-shirt", "knitted"],
  "parent_code": null
}
```

### 저장:
```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── us/codified_national_full_v1.json   (29,807행)
├── eu/codified_national_full_v1.json   (17,278행)
├── gb/codified_national_full_v1.json   (17,289행)
├── kr/codified_national_full_v1.json   (17,939행)
├── jp/codified_national_full_v1.json   (16,076행)
├── au/codified_national_full_v1.json   (13,458행)
└── ca/codified_national_full_v1.json   (13,729행)
```

---

## 2차 검수: 패턴 유형 정확성

1차 코드화 결과에서 패턴 유형이 정확한지 검증.

**방법:**
- 각 패턴 유형별 100건 랜덤 샘플링
- description 원문 → pattern_type이 맞는지 대조
- 잘못 분류된 것 수정

**신규 데이터 특별 확인:**
- KR 10자리 11,293건: macmap에서 온 description이 패턴 추출에 적합한지
- JP 9자리 9,443건: 일본어 description이 있는지, 영어만 있는지
- AU 8자리 6,806건: description 형식
- CA 8자리 7,103건: description 형식

**엑셀 기록**: 패턴별 100건 × 11패턴 = 1,100건 샘플 검증 결과

---

## 3차 검수: 숫자 파싱 정확성

PRICE_THRESHOLD, SIZE_THRESHOLD, WEIGHT_THRESHOLD, COMPOSITION_PCT의 숫자 추출이 정확한지.

**방법:**
- 해당 패턴 전부 재파싱
- 1차 결과와 대조
- 불일치 수정

```python
import re
for entry in codified:
    if entry['pattern_type'] == 'PRICE_THRESHOLD':
        desc = entry['description']
        # 원본 description에서 숫자 재추출
        nums = re.findall(r'\$[\d,.]+', desc)
        parsed = entry['conditions'].get('threshold')
        # 대조
```

**엑셀 기록**: 숫자 파싱 오류 건수 + 수정 내역

---

## 4차 검수: 키워드 완전성 + 6자리 정답지 연결

**키워드 완전성:**
- 각 entry의 keywords가 description의 핵심 단어를 전부 포함하는지
- description에서 stopwords 제외 후 의미 있는 단어 추출 → keywords에 없으면 추가

**6자리 정답지 연결:**
- 각 entry의 hs6 (앞 6자리)가 codified-subheadings.ts의 5,621개 안에 있는지
- hs4 (앞 4자리)가 codified-headings.ts의 1,233개 안에 있는지
- Section/Chapter 일관성 확인 (codified-rules.ts 592개 규칙 대조)

**엑셀 기록**: 키워드 추가 건수 + 연결 실패 건수

---

## 5차 검수: 원본 1:1 대조 + 전체 체인 50건

**원본 1:1 대조:**
- 7개국 codified JSON의 national_code가 tariff_schedule_full.csv와 1:1 매칭
- 누락 0건, 추가 0건, description 불일치 0건 확인

**전체 체인 50건 테스트:**
- 랜덤 50건: Section → Chapter → Heading → Subheading → National code 전체 체인 확인
- 7개국에서 각 ~7건씩 균등 분배

**최종 목표: 누락 0건, 불일치 0건, 오류 0건**

**엑셀 기록**: 국가별 1:1 대조 결과 + 50건 체인 테스트 상세

---

## 최종 저장

5회 검수 완료 후:

```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── us/codified_national_full_final.json   (29,807행)
├── eu/codified_national_full_final.json   (17,278행)
├── gb/codified_national_full_final.json   (17,289행)
├── kr/codified_national_full_final.json   (17,939행)
├── jp/codified_national_full_final.json   (16,076행)
├── au/codified_national_full_final.json   (13,458행)
└── ca/codified_national_full_final.json   (13,729행)
총: 125,576행 코드화 완료
```

---

## 결과물

### 엑셀: `POTAL_125K_Codification_Final.xlsx`

**Sheet 1: 5회 검수 요약**
| 회차 | 대상 | 발견 오류 | 수정 | 추가 키워드 |
|------|------|---------|------|-----------|
| 1차 | 전체 코드화 | - | - | - |
| 2차 | 패턴 유형 | X건 | X건 | 0 |
| 3차 | 숫자 파싱 | X건 | X건 | 0 |
| 4차 | 키워드+연결 | X건 | X건 | X개 |
| 5차 | 원본 대조+체인 | X건 | X건 | 0 |

**Sheet 2: 국가별 코드화 결과**
| 국가 | 행 수 | 패턴 분포 | JSON 크기 |

**Sheet 3: v5(89,842) vs final(125,576) 비교**
| 항목 | v5 | final | 차이 |

**Sheet 4: 6자리 정답지 연결 결과**
| 국가 | HS6 연결 | HS4 연결 | Section 오류 |

**Sheet 5: 50건 체인 테스트**

시트 마감: `=== 작업 종료 === | 125,576행 코드화 | 5회 검수 | 최종 오류 0건 | 키워드 X개 추가`

---

## ⚠️ 절대 규칙

1. **125,576행 전부 코드화** — 일부만 하지 않는다
2. **5회 전부 진행** — 중간에 멈추지 않는다
3. **각 회차마다 다른 관점** — 같은 검증 반복 금지
4. **신규 35,734행 특별 확인** — macmap에서 온 데이터라 기존과 형식 다를 수 있음
5. **6자리 정답지(codified-subheadings 5,621개)와 연결 확인 필수**
6. **원본 CSV와 1:1 대조 필수** — 5차에서 반드시
7. **최종 파일은 _full_final.json** — 이전 v5와 별도
8. **엑셀에 각 회차 결과 전부 기록**
9. **psql**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
