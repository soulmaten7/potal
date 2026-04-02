# Claude Code 명령어: 7개국 관세율표 5회 반복 코드화 + US Additional Notes 확인

> **날짜**: 2026-03-21 KST
> **목표**: (1) US 원본 hts_2026_rev4.json에서 Additional U.S. Notes 존재 여부 확인 + 있으면 코드화 (2) 이전 1차 코드화 결과(codified_national.json 7개)를 5회 반복 재코드화하여 누락/오류 0으로 만든다
> **방법**: Step 0~3에서 592개 Notes를 5회 반복 추출하여 정확도 100% 달성한 것과 동일한 방식

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## Part A: US Additional Notes 확인 + 코드화

### A-1. hts_2026_rev4.json 구조 확인

```python
import json

with open('/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json') as f:
    data = json.load(f)

# 전체 구조 파악
print(f'Type: {type(data)}')
if isinstance(data, dict):
    print(f'Top-level keys: {list(data.keys())}')
elif isinstance(data, list):
    print(f'Length: {len(data)}')
    print(f'First item keys: {list(data[0].keys()) if data else "empty"}')

# "notes", "additional", "general" 관련 필드 검색
def find_keys(obj, target_keys, depth=0, path=''):
    if depth > 5: return
    if isinstance(obj, dict):
        for k, v in obj.items():
            if any(t in k.lower() for t in target_keys):
                print(f'  Found: {path}.{k} = {str(v)[:200]}')
            find_keys(v, target_keys, depth+1, f'{path}.{k}')
    elif isinstance(obj, list) and len(obj) > 0:
        find_keys(obj[0], target_keys, depth+1, f'{path}[0]')

find_keys(data, ['note', 'additional', 'general', 'statistical'])
```

### A-2. Additional U.S. Notes 텍스트 추출

hts_2026_rev4.json에서 Additional Notes가 있으면:
- Chapter별로 추출
- 텍스트를 `/Volumes/soulmaten/POTAL/hs_national_rules/us/additional_notes/` 에 저장

없으면:
- USITC 웹사이트에서 다운로드 시도
- `curl "https://hts.usitc.gov/reststop/getChapter?chapter=61"` 등

### A-3. Additional Notes 코드화 (있으면)

Step 0~3에서 Section/Chapter Notes를 코드화한 것과 동일한 방식:
- 규칙 유형 분류: exclusion, inclusion, numeric_threshold, material_condition, definition
- JSON 변환: 조건 + 키워드 + 타겟 코드
- 5회 반복 (Part B에서 함께 진행)

---

## Part B: 7개국 codified_national.json 5회 반복 재코드화

### 입력 파일 (1차 코드화 결과):
```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── us/codified_national.json   (28,718행, 9.9MB)
├── eu/codified_national.json   (17,278행, 5.8MB)
├── gb/codified_national.json   (17,289행, 5.9MB)
├── kr/codified_national.json   (6,646행, 2.2MB)
├── jp/codified_national.json   (6,633행, 2.2MB)
├── au/codified_national.json   (6,652행, 2.2MB)
└── ca/codified_national.json   (6,626행, 2.2MB)
```

### 원본 소스 (대조용):
```
/Volumes/soulmaten/POTAL/hs_national_rules/{country}/tariff_schedule.csv
/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json (US 원본 15MB)
```

---

### 5회 반복 코드화 방법

**각 회차마다 다른 관점으로 코드화를 검증/보완. 같은 데이터를 5번 봐야 누락이 없어진다.**

---

### 1차: 패턴 유형 재검증

1차 코드화에서 분류한 패턴 유형이 정확한지 확인:

```
PRICE_THRESHOLD: "valued not over $X" → {threshold: X, condition: 'not_over'}
MATERIAL_DETAIL: "of cotton" → {material: 'cotton'}
SIZE_THRESHOLD: "not over 27.9 cm" → {max_cm: 27.9}
WEIGHT_THRESHOLD: "weighing not more than X kg" → {max_kg: X}
GENDER: "men's or boys'" → {gender: 'male'}
PROCESSING: "knitted or crocheted" → {processing: 'knitted'}
COMPOSITION_PCT: "containing 85 percent or more" → {min_pct: 85, material: 'cotton'}
END_USE: "for food contact" → {end_use: 'food_contact'}
CATCH_ALL: "other" → {is_catch_all: true}
INDENT_PARENT: US only, indent < max → {is_parent: true, children: [...]}
GENERAL: 분류 불가 → {pattern: 'GENERAL'}
```

**검증 방법:**
- 각 패턴 유형별 100건 랜덤 샘플링
- description 원문과 코드화 결과 대조
- 잘못 분류된 것 찾기 + 수정

**엑셀 기록**: 패턴별 샘플 100건 검증 결과 (정확/오류/수정)

---

### 2차: 숫자 파싱 정확도 검증

1차에서 추출한 숫자값(가격, 크기, 무게, 성분비)이 정확한지:

```python
# 예: PRICE_THRESHOLD 3,985건의 threshold 값 검증
for entry in codified:
    if entry['pattern_type'] == 'PRICE_THRESHOLD':
        desc = entry['description']
        parsed_value = entry['conditions'].get('threshold')
        # description에서 실제 숫자 재추출
        import re
        nums = re.findall(r'\$[\d,.]+|\d+\.?\d*', desc)
        # parsed_value와 대조
```

**검증 항목:**
- PRICE_THRESHOLD: $ 금액 파싱 (3,985건)
- SIZE_THRESHOLD: cm/inch 파싱 (367건)
- WEIGHT_THRESHOLD: kg/g 파싱 (441건)
- COMPOSITION_PCT: % 파싱 (2,414건)

**엑셀 기록**: 숫자 파싱 오류 건수 + 수정 내역

---

### 3차: 키워드 완전성 검증

각 entry의 keywords 배열이 description의 핵심 단어를 전부 포함하는지:

```python
# description에서 명사/형용사 추출 → keywords에 있는지 확인
import re

for entry in codified:
    desc = entry['description'].lower()
    keywords = set(entry.get('keywords', []))

    # description에서 의미 있는 단어 추출 (stopwords 제외)
    words = re.findall(r'\b[a-z]{3,}\b', desc)
    stopwords = {'the', 'and', 'for', 'not', 'with', 'over', 'than', 'more', 'other', 'each'}
    meaningful = [w for w in words if w not in stopwords]

    # keywords에 없는 의미 있는 단어 찾기
    missing = [w for w in meaningful if w not in keywords]
    if missing:
        # 누락 키워드 → 추가
```

**엑셀 기록**: 키워드 누락 발견 건수 + 추가된 키워드 목록

---

### 4차: 계층 구조 검증 (US indent + 전체 코드 계층)

**US:**
- indent 0~11 계층이 정확한 parent-child 관계를 형성하는지
- 모든 10자리 코드가 상위 8자리, 6자리와 올바르게 연결되는지
- INDENT_PARENT 14,689건의 children 목록이 정확한지

**전체 7개국:**
- HS code 자릿수 계층: 6자리 → 8자리 → 10자리
- 8자리 코드가 해당 6자리 아래에 있는지 (`startsWith`)
- 10자리 코드가 해당 8자리 아래에 있는지

```python
# 계층 검증
for entry in codified:
    code = entry['national_code']
    parent = entry.get('parent_code', '')
    if parent and not code.startswith(parent):
        print(f'ERROR: {code} parent={parent} — not a prefix match')
```

**엑셀 기록**: 계층 오류 건수 + 수정 내역

---

### 5차: 원본 CSV와 최종 대조 (1:1 매칭)

5회차 코드화 결과와 원본 tariff_schedule.csv를 1:1 대조:

```python
import csv

# 원본 CSV 로드
with open(f'/Volumes/soulmaten/POTAL/hs_national_rules/{country}/tariff_schedule.csv') as f:
    reader = csv.DictReader(f)
    original = {row['hs_code']: row for row in reader}

# 코드화 결과 로드
with open(f'/Volumes/soulmaten/POTAL/hs_national_rules/{country}/codified_national.json') as f:
    codified = json.load(f)
codified_map = {e['national_code']: e for e in codified}

# 대조
missing_in_codified = set(original.keys()) - set(codified_map.keys())
extra_in_codified = set(codified_map.keys()) - set(original.keys())
print(f'원본에만 있음 (누락): {len(missing_in_codified)}')
print(f'코드화에만 있음 (추가): {len(extra_in_codified)}')

# description 일치 확인
mismatch = 0
for code in set(original.keys()) & set(codified_map.keys()):
    orig_desc = original[code].get('description', '')
    codi_desc = codified_map[code].get('description', '')
    if orig_desc != codi_desc:
        mismatch += 1
print(f'Description 불일치: {mismatch}')
```

**최종 목표: 누락 0건, 불일치 0건, 오류 0건**

**엑셀 기록**: 국가별 1:1 대조 결과 (누락/추가/불일치)

---

## 5회 반복 후 최종 저장

### 최종 codified JSON (v5):

```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── us/codified_national_v5.json    ← 5회 검증 완료
├── eu/codified_national_v5.json
├── gb/codified_national_v5.json
├── kr/codified_national_v5.json
├── jp/codified_national_v5.json
├── au/codified_national_v5.json
└── ca/codified_national_v5.json
```

### US Additional Notes (있으면):
```
/Volumes/soulmaten/POTAL/hs_national_rules/us/additional_notes/
├── chapter_01.txt ~ chapter_97.txt
└── codified_additional_notes.json   ← 코드화
```

---

## 결과물

### 엑셀: `POTAL_7Country_Codification_v5.xlsx`

**Sheet 1: 5회차 요약**
| 회차 | 검증 대상 | 발견 오류 | 수정 건수 | 추가 키워드 |
|------|----------|---------|---------|-----------|
| 1차 | 패턴 유형 | X건 | X건 | 0 |
| 2차 | 숫자 파싱 | X건 | X건 | 0 |
| 3차 | 키워드 완전성 | X건 | X건 | X개 |
| 4차 | 계층 구조 | X건 | X건 | 0 |
| 5차 | 원본 1:1 대조 | X건 | X건 | 0 |

**Sheet 2: v1 vs v5 비교**
| 항목 | v1 (1차) | v5 (5차) | 변화 |
|------|---------|---------|------|
| 패턴 오류 | X건 | 0건 | |
| 숫자 파싱 오류 | X건 | 0건 | |
| 키워드 누락 | X건 | 0건 | |
| 계층 오류 | X건 | 0건 | |
| 원본 불일치 | X건 | 0건 | |

**Sheet 3: US Additional Notes (있으면)**
- Chapter별 Notes 존재 여부 + 코드화 건수

**Sheet 4: 패턴별 최종 건수**
| 패턴 | US | EU | GB | KR | JP | AU | CA | 총 |

**Sheet 5: 수정 이력**
- 각 회차에서 수정한 항목 전부 (before/after)

### 엑셀 로그

시트 마감: `=== 작업 종료 === | 5회 검증 완료 | 총 수정 X건 | 최종 오류 0건 | US Additional Notes X개`

---

## ⚠️ 절대 규칙

1. **5회 전부 진행** — 중간에 멈추지 않는다
2. **각 회차마다 다른 관점으로 검증** — 같은 검증 반복 금지
3. **수정할 때 기존 정확한 데이터를 건드리지 않는다** — 오류만 수정, 정확한 것은 유지
4. **원본 CSV와 1:1 대조 필수** — 5차에서 반드시 원본과 완전 일치 확인
5. **US hts_2026_rev4.json 반드시 확인** — Additional Notes 유무가 핵심
6. **엑셀에 각 회차 결과 전부 기록** — 발견 오류, 수정 내역, before/after
7. **최종 파일은 v5로 저장** — v1(기존)과 별도, 나중에 비교 가능하게
