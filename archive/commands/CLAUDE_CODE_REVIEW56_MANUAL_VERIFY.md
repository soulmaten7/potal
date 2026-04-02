# Claude Code 명령어: REVIEW 56건 수동 검증 — HTS description vs 상품 대조

> **날짜**: 2026-03-21 KST
> **목표**: US HS10 벤치마크에서 REVIEW 판정 56건을 하나씩 검증. 각 상품의 10자리 코드가 정확한지, 더 정확한 코드가 있는지 확인.
> **방법**: 각 상품의 final_hs_code를 gov_tariff_schedules에서 해당 HS6 아래 모든 10자리 후보를 조회하고, 상품에 가장 맞는 코드가 어느 건지 판단.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 검증 방법

REVIEW 56건 각각에 대해:

### Step 1: 해당 HS6 아래 US 10자리 후보 전부 조회

```sql
SELECT hs_code, description FROM gov_tariff_schedules
WHERE country = 'US' AND hs_code LIKE '{hs6}%'
ORDER BY hs_code;
```

### Step 2: 상품 정보 vs 모든 후보 description 대조

예시:
```
상품: "vancasso 16 oz Coffee Mugs Set of 6"
material: Ceramic
파이프라인 결과: 6912003510
HS6 아래 US 후보:
  6912001000 — Bone chinaware
  6912002000 — Non-bone chinaware
  6912003510 — Plates not over 27.9 cm; teacups and saucers
  6912003520 — Mugs and other drinkware
  6912003550 — Other articles for food/drink service
  6912004510 — Articles for food/drink service valued over $8
```

→ 정답은 **6912003520 (Mugs and other drinkware)**인데 파이프라인이 **6912003510 (Plates; teacups)**을 골랐다면 → **WRONG_SUBCODE** (HS6는 맞지만 10자리 세부 선택이 틀림)

### Step 3: 판정

각 상품에 대해 5가지 판정 중 하나:

| 판정 | 의미 |
|------|------|
| **CORRECT** | 파이프라인이 고른 10자리가 정확함 |
| **ACCEPTABLE** | 파이프라인 코드가 포괄 코드("Other" 등)인데, 더 구체적인 코드가 있었음. 틀린 건 아니지만 최적은 아님 |
| **WRONG_SUBCODE** | HS6는 맞지만 10자리 세부 코드가 다른 상품에 해당 |
| **WRONG_HS6** | HS6 자체가 틀림 (이건 Step 3 문제) |
| **NO_BETTER_OPTION** | 후보 중에 상품에 딱 맞는 코드가 없어서 파이프라인 선택이 최선 |

---

## 검증 대상 56건

POTAL_V3_US_HS10_Verification.xlsx의 "REVIEW Details" 시트에서 56건을 읽어온다.

각 건마다:
1. product_name, material, category 확인
2. HS6 추출 (final_hs_code 앞 6자리)
3. gov_tariff_schedules에서 해당 HS6 아래 US 10자리 후보 전부 조회
4. 후보 description과 상품 대조
5. 파이프라인이 고른 코드가 맞는지 판정
6. 더 정확한 코드가 있으면 기록

---

## 결과물

### 엑셀: `POTAL_V3_REVIEW56_Verification.xlsx`

**Sheet 1: Summary**

| 판정 | 건수 | 비율 |
|------|------|------|
| CORRECT | X | X% |
| ACCEPTABLE | X | X% |
| WRONG_SUBCODE | X | X% |
| WRONG_HS6 | X | X% |
| NO_BETTER_OPTION | X | X% |

**Sheet 2: All 56 Items Detail**

각 건마다:
- product_name
- material
- category
- 파이프라인 final_hs_code
- 파이프라인 HTS description
- HS6 아래 전체 후보 목록 (hs_code + description, 전부)
- 정답 코드 (판단 결과)
- 판정 (CORRECT / ACCEPTABLE / WRONG_SUBCODE / WRONG_HS6 / NO_BETTER_OPTION)
- 근거 (왜 이 판정인지)

**Sheet 3: WRONG_SUBCODE 상세 (있을 경우)**

- 파이프라인이 고른 코드 vs 정답 코드
- 왜 파이프라인이 잘못 골랐는지 원인 분석
- Step 4 Country Router의 keyword scoring이 어떤 키워드로 매칭했는지

---

## 최종 분석

56건 검증 후 **169건 전체 US HS10 정확도 최종 산출**:

```
기존 MATCH 81건 + 기존 PARTIAL 17건 + REVIEW에서 CORRECT/ACCEPTABLE X건
= 총 CORRECT 건수 / 154건 (확장된 것) = 최종 10자리 정확도 X%

+ NO_EXPANSION 15건은 별도 (gov_tariff_schedules 커버리지 문제)
+ WRONG_SUBCODE X건은 → Step 4 keyword scoring 개선 필요
+ WRONG_HS6 X건은 → Step 3 문제
```

---

## ⚠️ 절대 규칙

1. **56건 전부 검증** — 일부만 하지 않는다
2. **gov_tariff_schedules에서 실제 후보를 전부 조회** — 추측으로 판정하지 않는다
3. **psql 직접 연결**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
4. **판정 근거를 반드시 기록** — "왜 CORRECT인지" "왜 WRONG_SUBCODE인지"
5. **엑셀에 후보 목록 전부 기록** — 나중에 재검토 가능하게

시트 마감: `=== 작업 종료 === | CORRECT X건 | ACCEPTABLE X건 | WRONG_SUBCODE X건 | WRONG_HS6 X건 | 최종 10자리 정확도 X%`
