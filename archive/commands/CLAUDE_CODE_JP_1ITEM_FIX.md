# Claude Code 명령어: JP 99% → 100% — 확장 안 된 1건 찾아서 해결

> **날짜**: 2026-03-21 KST
> **목표**: 169건 벤치마크에서 JP만 99%(168/169)인 1건을 찾아서 해결. JP 9자리 코드를 확보하여 100% 달성.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

---

## Phase 1: 확장 안 된 1건 찾기

169건을 dest=JP로 돌렸을 때 final_hs_code가 HS6(6자리)로 남은 1건이 어떤 상품인지 찾는다.

```typescript
// 169건 중 JP에서 hs_code_precision이 'HS6'인 건 찾기
// product_name, material, hs6, final_hs_code 출력
```

이 상품의 HS6가 정확히 뭔지 확인한다.

---

## Phase 2: 해당 HS6가 JP gov_tariff_schedules에 왜 없는지 확인

```sql
-- 해당 HS6로 JP 데이터 조회
SELECT * FROM gov_tariff_schedules
WHERE country = 'JP' AND hs_code LIKE '{해당HS6}%';

-- 같은 HS6로 다른 나라에는 있는지
SELECT country, hs_code, description FROM gov_tariff_schedules
WHERE hs_code LIKE '{해당HS6}%'
ORDER BY country;

-- macmap에 JP 데이터가 있는지
SELECT * FROM macmap_ntlc_rates
WHERE destination_country = 'JP' AND hs6 = '{해당HS6}';
```

---

## Phase 3: JP 9자리 코드 수집

### 방법 1: 일본 세관 공식 데이터에서 찾기

```bash
# 일본 세관 관세율표
curl -s "https://www.customs.go.jp/tariff/2024_4/data/e_{chapter}.htm"
# chapter = 해당 HS6의 앞 2자리
```

### 방법 2: WTO API

```bash
curl -s "https://api.wto.org/timeseries/v1/data?i=HS_A_0010&r=392&ps=2024,2023&pc={해당HS6}&fmt=json&lang=1&max=10" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d"
```

### 방법 3: codified_national에서 JP 인접 HS6 패턴 참고

같은 Heading(4자리) 내에서 JP가 어떤 패턴으로 9자리를 부여하는지 확인:

```sql
-- 같은 Heading의 다른 HS6에 JP 데이터가 있는지
SELECT hs_code, description FROM gov_tariff_schedules
WHERE country = 'JP' AND hs_code LIKE '{해당HS4}%' AND length(hs_code) > 6
ORDER BY hs_code;
```

---

## Phase 4: DB INSERT + 코드화 + 벤치마크

1. 찾은 JP 9자리 코드를 gov_tariff_schedules에 INSERT
2. codified_national_full_final.json JP 업데이트 (해당 HS6 entry 추가)
3. country-agents/data/jp_codified.json 재생성
4. 169건 JP 벤치마크 재실행 → 169/169 (100%) 확인

---

## Phase 5: 모든 파일 업데이트

JP 100% 달성 후:
- CLAUDE.md: JP 99% → 100%
- .cursorrules: JP 99% → 100%
- POTAL_7Field_Pipeline_v3_Final.html: JP 99% → 100%
- session-context.md
- CHANGELOG.md
- gov_tariff_schedules 행수 업데이트 (131,794 → +1)

---

## ⚠️ 절대 규칙

1. **1건만 찾으면 된다** — 169건 중 JP에서 확장 안 된 정확히 1건
2. **무조건 찾는다** — 일본 세관/WTO/macmap 어디서든
3. **찾은 후 5회 검증까지는 불필요** — 1건이므로 수동 확인으로 충분
4. **모든 프로젝트 파일 수치 업데이트 필수**

시트 마감: `=== 작업 종료 === | JP 1건 HS6={코드} | 원인 | 해결 | JP 100% | 파일 업데이트`
