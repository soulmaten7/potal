# Claude Code 명령어: 6자리 정답지 vs 7개국 코드화 매핑 검증

> **날짜**: 2026-03-21 KST
> **목표**: Step 0~3에서 100% 검증된 6자리 코드화 데이터(정답지)와 7개국 codified_national_v5.json(7~10자리)이 정확히 연결되는지 검증
> **원리**: 6자리는 정답이다. 7~10자리 코드의 앞 6자리가 이 정답과 100% 일치해야 한다. 안 맞으면 7~10자리 데이터가 잘못된 거다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 정답지 파일 (Step 0~3, 6자리까지)

이 파일들이 100% 검증된 정답이다:

| 파일 | 경로 | 내용 |
|------|------|------|
| codified-subheadings.ts | `app/lib/cost-engine/gri-classifier/data/codified-subheadings.ts` | **5,621개 HS6 코드** + conditions + keywords |
| codified-headings.ts | `app/lib/cost-engine/gri-classifier/data/codified-headings.ts` | **1,233개 HS4 코드** + keywords |
| codified-rules.ts | `app/lib/cost-engine/gri-classifier/data/codified-rules.ts` | **592개 Section/Chapter Notes 규칙** |
| subheading-descriptions.ts | `app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts` | HS6 WCO 원문 description |
| heading-descriptions.ts | `app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts` | HS4 WCO 원문 description |

## 검증 대상 파일 (7개국 코드화, 7~10자리)

| 파일 | 경로 | 내용 |
|------|------|------|
| US v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/us/codified_national_v5.json` | 28,718행 |
| EU v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/eu/codified_national_v5.json` | 17,278행 |
| GB v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/gb/codified_national_v5.json` | 17,289행 |
| KR v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/kr/codified_national_v5.json` | 6,646행 |
| JP v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/jp/codified_national_v5.json` | 6,633행 |
| AU v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/au/codified_national_v5.json` | 6,652행 |
| CA v5 | `/Volumes/soulmaten/POTAL/hs_national_rules/ca/codified_national_v5.json` | 6,626행 |

---

## Phase 1: HS6 연결 검증

7개국 codified_national_v5.json의 모든 national_code에서 앞 6자리를 뽑고, 그 6자리가 codified-subheadings.ts의 5,621개 안에 있는지 확인.

### 1-1. 정답지(5,621개 HS6) 로드

```python
# codified-subheadings.ts에서 HS6 코드 전체 추출
# 이 파일은 TypeScript이므로 JSON 부분을 파싱
```

### 1-2. 7개국 national_code에서 앞 6자리 추출 + 매칭

```python
for country in ['us', 'eu', 'gb', 'kr', 'jp', 'au', 'ca']:
    # codified_national_v5.json 로드
    # 각 entry의 national_code 앞 6자리 추출
    # 5,621개 정답 HS6 set에 있는지 확인
    # 없으면 → 끊어진 연결 → 기록
```

### 1-3. 결과 기록

```
국가별:
  연결 성공: X / Y (X%)
  연결 실패: Z건 — 어떤 코드가 정답지에 없는지 목록
```

---

## Phase 2: HS4 연결 검증

national_code 앞 4자리가 codified-headings.ts의 1,233개 안에 있는지.

```python
for country in ['us', 'eu', 'gb', 'kr', 'jp', 'au', 'ca']:
    # 각 entry의 national_code 앞 4자리 추출
    # 1,233개 정답 Heading set에 있는지 확인
```

---

## Phase 3: Section/Chapter 일관성 검증

national_code가 올바른 Section/Chapter에 속하는지. codified-rules.ts의 592개 규칙으로 검증.

```python
# HS code → Chapter → Section 매핑
# 예: 610910... → Chapter 61 → Section XI (Textiles)
# codified-rules.ts에서 Chapter 61이 Section XI에 속하는지 확인
# 만약 US 코드 중 Chapter 61인데 Section이 다르게 매핑되면 → 오류
```

---

## Phase 4: description 일관성 검증

7~10자리 description이 6자리 description의 **세분화**인지 확인. 상위 description과 완전히 다른 내용이면 문제.

```python
# subheading-descriptions.ts에서 HS6 description 가져오기
# codified_national_v5의 description과 비교
#
# 예: HS6 610910 = "Of cotton"
#     US 6109100012 = "Other T-shirts, knitted of cotton" → "cotton" 포함 → OK
#
# 예: HS6 691200 = "Ceramic tableware"
#     US 6912003510 = "Plates not over 27.9 cm; teacups..." → "tableware" 관련 → OK
#
# 만약: HS6 691200 = "Ceramic tableware"
#       US 코드 = "Motor vehicle parts" → 완전 다름 → ERROR
```

검증 방법:
1. 6자리 description에서 핵심 키워드 추출 (material, product type)
2. 7~10자리 description에 그 키워드가 포함되는지
3. 포함 안 되면 → MISMATCH 후보 → 수동 확인 필요

---

## Phase 5: 키워드 연결 검증

codified-headings.ts와 codified-subheadings.ts의 keywords가 codified_national_v5의 keywords에 포함되는지.

```python
# codified-headings의 heading 6109 keywords: ['t-shirt', 'singlet', 'vest', 'cotton', ...]
# codified_national_v5 US 610910... keywords: ['t-shirt', 'white', 'hemmed', 'cotton', ...]
#
# heading keywords가 national keywords의 상위 집합이어야 함
# national에만 있는 키워드 = 7~10자리에서 새로 추가된 세분화 키워드 → 정상
# heading에 있는데 national에 없는 키워드 = 누락 가능성 → 확인 필요
```

---

## Phase 6: 전체 체인 연결 테스트 (샘플 50건)

랜덤 50건 뽑아서 전체 체인이 이어지는지 수동 검증:

```
Section → Chapter → Heading(4) → Subheading(6) → National(7~10)

예시:
Section XI (Textiles)
  → Chapter 61 (Articles of apparel, knitted)
    → Heading 6109 (T-shirts, singlets, vests)
      → Subheading 610910 (Of cotton)
        → US 6109100004 (T-shirts, all white, short hemmed)
        → US 6109100012 (Other T-shirts, knitted of cotton)

각 단계에서:
- 코드가 정답지에 있는지 ✅
- description이 상위→하위로 세분화되는지 ✅
- keywords가 이어지는지 ✅
- Section/Chapter이 맞는지 ✅
```

---

## 결과물

### 엑셀: `POTAL_6digit_vs_7Country_Verification.xlsx`

**Sheet 1: Summary**
| 검증 | 결과 |
|------|------|
| HS6 연결 (Phase 1) | X/89,842 연결 성공 (X%) |
| HS4 연결 (Phase 2) | X/89,842 연결 성공 (X%) |
| Section/Chapter 일관성 (Phase 3) | 오류 X건 |
| Description 일관성 (Phase 4) | MISMATCH X건 |
| Keyword 연결 (Phase 5) | 누락 X건 |
| 전체 체인 (Phase 6) | 50건 중 X건 완전 연결 |

**Sheet 2: 연결 실패 목록 (있을 경우)**
- national_code, 앞 6자리, 정답지에 없는 이유

**Sheet 3: Description MISMATCH 목록 (있을 경우)**
- national_code, national_desc, hs6_desc, 불일치 내용

**Sheet 4: 50건 체인 테스트 상세**
- 각 건의 Section → Chapter → Heading → Subheading → National 전체 체인

시트 마감: `=== 작업 종료 === | HS6 연결 X% | HS4 연결 X% | Description 일치 X% | 체인 완전 연결 X/50`

---

## ⚠️ 절대 규칙

1. **정답지(6자리) 파일을 수정하지 않는다** — 읽기만
2. **7개국 v5 파일을 수정하지 않는다** — 읽기만
3. **7개국 전부 검증** — 일부만 하지 않는다
4. **연결 실패 건은 전부 목록으로 기록** — 1건도 빠뜨리지 않는다
5. **description 비교 시 키워드 기반** — 전체 문자열 일치가 아니라 핵심 키워드 포함 여부
6. **엑셀에 검증 결과 전부 기록**
