# Claude Code 명령어: EU/GB 누락 HS6 수집 + JP 확인 → 7개국 100% 달성

> **날짜**: 2026-03-21 KST
> **목표**: EU/GB에 빠진 ~966개 HS6의 10자리 코드를 수집 + JP 빠진 건 확인 → 7개국 전부 HS6 커버리지 100% → codified_national 재코드화 5회 검수 → 벤치마크 재실행 → 모든 파일 업데이트
> **현재 문제**: EU/GB 4,742 HS6만 커버 (US 5,756, KR/JP/AU/CA ~5,611). 966개 HS6에 EU/GB 10자리 데이터 없음.
> **원칙**: 무조건 찾아낸다. 안 되는 건 없다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

---

## Phase 1: 빠진 HS6 목록 추출

```sql
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres

-- EU에 빠진 HS6 목록 (KR에는 있는데 EU에는 없는 것)
SELECT DISTINCT substring(hs_code,1,6) as hs6
FROM gov_tariff_schedules WHERE country='KR' AND length(hs_code)>6
EXCEPT
SELECT DISTINCT substring(hs_code,1,6)
FROM gov_tariff_schedules WHERE country='EU' AND length(hs_code)>6
ORDER BY hs6;
-- 예상: ~966개

-- JP에 빠진 HS6 (US에는 있는데 JP에는 없는 것)
SELECT DISTINCT substring(hs_code,1,6) as hs6
FROM gov_tariff_schedules WHERE country='US' AND length(hs_code)>6
EXCEPT
SELECT DISTINCT substring(hs_code,1,6)
FROM gov_tariff_schedules WHERE country='JP' AND length(hs_code)>6
ORDER BY hs6;
-- JP에 빠진 건이 99xxxx(특수코드)뿐인지, 진짜 상품 코드도 빠졌는지 확인
```

---

## Phase 2: EU/GB 누락 데이터 수집

### 방법 1: UK Trade Tariff API (최우선)

UK API가 가장 깔끔하고 JSON 반환. EU CN과 UK는 거의 동일한 구조.

```bash
# UK API로 HS6의 10자리 코드 조회
curl -s "https://www.trade-tariff.service.gov.uk/api/v2/commodities/{hs6}0000"

# 응답에서 goods_nomenclature_item_id = 10자리 코드
# 예: 0501000000
```

**966개 HS6 × UK API 호출 → EU/GB 10자리 코드 수집**

```python
import requests, json, time

missing_hs6 = [...]  # Phase 1에서 추출한 966개

results = []
for hs6 in missing_hs6:
    code = hs6 + '0000'  # 10자리로 패딩
    resp = requests.get(f'https://www.trade-tariff.service.gov.uk/api/v2/commodities/{code}', timeout=15)
    if resp.status_code == 200:
        data = resp.json()
        # 10자리 코드 + description 추출
        results.append(...)
    time.sleep(1)  # rate limit
```

### 방법 2: UK API heading 조회 (벌크)

HS6 개별 조회 대신 heading(4자리) 조회로 해당 heading 아래 모든 코드를 한번에 가져오기:

```bash
# heading 단위 조회 — 해당 heading 아래 모든 commodity codes 반환
curl -s "https://www.trade-tariff.service.gov.uk/api/v2/headings/0501"
```

966개 HS6가 속한 heading 수는 966보다 적을 것 → API 호출 횟수 줄일 수 있음

### 방법 3: macmap_ntlc_rates에서 EU 10자리 추출

macmap에 EU 데이터가 10자리로 있을 수 있음:

```sql
SELECT length(hs_code), count(*) FROM macmap_ntlc_rates
WHERE destination_country = 'EU' GROUP BY length(hs_code);

-- 10자리가 있으면 거기서 추출
SELECT hs_code, hs6, mfn_rate FROM macmap_ntlc_rates
WHERE destination_country = 'EU' AND hs6 IN ('050100','051000','081400')
AND length(hs_code) = 10 LIMIT 10;
```

### 방법 4: EU TARIC JSON 다운로드

EU에서 TARIC 전체 데이터를 벌크로 다운로드할 수 있는지:
- https://ec.europa.eu/taxation_customs/dds2/taric/
- Open Data Portal에서 TARIC CSV/XML 다운로드 가능한지 확인

---

## Phase 3: JP 빠진 건 확인

JP에서 빠진 HS6가 99xxxx(특수코드: 면세, 군용, 임시)인지 확인:

```sql
-- JP에 빠진 HS6 중 99로 시작하는 것 vs 일반 상품 코드
SELECT hs6, CASE WHEN hs6 LIKE '99%' THEN 'special' ELSE 'product' END as type, count(*)
FROM (
  SELECT DISTINCT substring(hs_code,1,6) as hs6
  FROM gov_tariff_schedules WHERE country='US' AND length(hs_code)>6
  EXCEPT
  SELECT DISTINCT substring(hs_code,1,6)
  FROM gov_tariff_schedules WHERE country='JP' AND length(hs_code)>6
) t
GROUP BY type;
```

99xxxx만 빠졌으면 → JP는 실질 100% (특수코드는 일반 상품 분류와 무관)
일반 상품 코드도 빠졌으면 → 해당 HS6 수집 필요

---

## Phase 4: DB INSERT + codified_national 재코드화

### 4-1. 수집한 EU/GB 데이터 INSERT

```sql
-- gov_tariff_schedules에 INSERT
-- country='EU' 또는 'GB', hs_code=10자리, description, source='uk_api' 또는 'taric'
```

### 4-2. codified_national_full_final.json 재생성 (7개국 전체)

**이전 125,576행 + 신규 EU/GB 행 = 총 X행**

5회 반복 코드화:
1차: 전체 코드화
2차: 패턴 유형 검증
3차: 숫자 파싱 검증
4차: 키워드 완전성 + 6자리 정답지 연결
5차: 원본 1:1 대조

### 4-3. country-agents/data/ JSON 재생성

eu_codified.json, gb_codified.json 재생성 (HS6 인덱싱)

---

## Phase 5: 벤치마크 재실행

169건 × 7개국 = 1,183건 재벤치마크:

**목표:**
| 국가 | 이전 | 목표 |
|------|------|------|
| US | 100% | 100% |
| EU | 75% | **95%+** |
| GB | 75% | **95%+** |
| KR | 100% | 100% |
| JP | 99% | **100%** (또는 99% 유지 — 특수코드면) |
| AU | 100% | 100% |
| CA | 100% | 100% |

Regression: Clean 20건 20/20 유지

---

## Phase 6: 모든 파일 업데이트

벤치마크 결과 확정 후:
1. CLAUDE.md — gov_tariff_schedules 행수, 벤치마크 수치
2. .cursorrules — 벤치마크 수치
3. session-context.md — 행수
4. CHANGELOG.md — 변경사항
5. POTAL_7Field_Pipeline_v3_Final.html — Step 4 벤치마크 수치, 통계

**모든 파일에서 이전 수치(EU/GB 75%, JP 99%)를 새 수치로 교체.**
**125,576행 → 새 행수로 교체.**

---

## ⚠️ 절대 규칙

1. **EU/GB 966개 HS6 무조건 수집** — 한 방법이 안 되면 다른 방법. 포기 금지
2. **수집 후 5회 코드화 검수 필수**
3. **기존 EU/GB 데이터 삭제 금지** — 추가 INSERT만
4. **벤치마크에서 기존 US/KR/AU/CA 100%가 떨어지면 안 됨**
5. **모든 프로젝트 파일 업데이트 필수** — 수치 불일치 0건
6. **psql**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
7. **UK API rate limit**: 1초 1건
8. **엑셀에 전체 과정 기록**

시트 마감: `=== 작업 종료 === | EU X% → X% | GB X% → X% | JP X% | 총 gov_tariff X행 | 5회 검수 | 벤치마크 7개국 | 파일 5개 업데이트`
