# Claude Code 명령어: EU/GB 세율 데이터 수집 + gov_tariff_schedules UPDATE

> **날짜**: 2026-03-21 KST
> **목표**: EU 17,278행 + GB 17,289행의 duty_rate_pct가 전부 NULL → 인터넷에서 세율 데이터를 찾아서 채운다
> **제약**: 어떤 방법을 써서든 반드시 찾아온다. 한 방법이 안 되면 다른 방법을 시도한다. 포기 금지.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **디테일**: 명령어 그대로, 결과 전체, DB 쿼리는 쿼리문+행수+샘플5건, 수정은 변경전/후
- **시트 마감**: `=== 작업 종료 ===`

---

## 현재 상태

```
gov_tariff_schedules:
  EU: 17,278행 — hs_code + description 있음, duty_rate_text = '', duty_rate_pct = NULL (전부)
  GB: 17,289행 — hs_code + description 있음, duty_rate_text = '', duty_rate_pct = NULL (전부)
```

HS code와 상품 설명은 이미 DB에 있다. **세율(duty_rate_pct)만 채우면 된다.**

---

## 수집 전략: 여러 방법을 순서대로 시도. 하나가 안 되면 다음으로.

### 방법 1: EU TARIC API (공식 REST API)

EU 관세율 공식 API. 무료, 인증 불필요.

```bash
# EU TARIC 세율 조회 — HS code로 MFN 세율 확인
# 예시: 6109100000 (Cotton T-shirts)
curl -s "https://ec.europa.eu/taxation_customs/dds2/taric/measures.js?lang=en&GoodsCode=6109100000&SimDate=20260321" | head -200

# 또는
curl -s "https://www.trade-tariff.service.gov.uk/api/v2/commodities/6109100000" | python3 -m json.tool | head -50
```

**실행 방법:**
1. DB에서 EU의 모든 고유 hs_code 추출
2. 각 hs_code에 대해 TARIC API 호출
3. MFN(Most Favoured Nation) 세율 추출
4. duty_rate_pct UPDATE

```sql
-- EU hs_code 목록 추출
SELECT DISTINCT hs_code FROM gov_tariff_schedules WHERE country = 'EU' ORDER BY hs_code;
```

### 방법 2: UK Trade Tariff API (공식 REST API)

UK 관세율 공식 API. 무료, 인증 불필요.

```bash
# UK 세율 조회
curl -s "https://www.trade-tariff.service.gov.uk/api/v2/commodities/6109100000" | python3 -m json.tool | head -100

# 응답에서 import_measures → duty_expression → base 필드에 세율 있음
```

**실행 방법:**
1. DB에서 GB의 모든 고유 hs_code 추출
2. 각 hs_code에 대해 UK API 호출
3. MFN import duty rate 추출
4. duty_rate_pct UPDATE

### 방법 3: WTO Tariff Download Facility

WTO에서 MFN 세율 벌크 다운로드 가능.

```bash
# WTO API
curl -s "https://api.wto.org/tariff/v1/data?reporter=EU&product=610910&year=2025&format=json" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d"

# GB (영국)
curl -s "https://api.wto.org/tariff/v1/data?reporter=GB&product=610910&year=2025&format=json" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d"
```

WTO API Key: `e6b00ecdb5b34e09aabe15e68ab71d1d` (이미 보유)

### 방법 4: MacMap NTLC (이미 DB에 있는 데이터 활용)

DB에 `macmap_ntlc_rates` 테이블이 537,894행 있음 (MFN 009 세율). EU/GB 세율이 여기에 있을 수 있음.

```sql
-- EU MFN 세율이 macmap_ntlc_rates에 있는지 확인
SELECT hs_code, rate_pct FROM macmap_ntlc_rates
WHERE reporter = 'EU' AND hs_code LIKE '6109%' AND tariff_type = '009'
LIMIT 10;

-- GB
SELECT hs_code, rate_pct FROM macmap_ntlc_rates
WHERE reporter = 'GB' AND hs_code LIKE '6109%' AND tariff_type = '009'
LIMIT 10;
```

**이 방법이 가장 빠를 수 있음** — 이미 DB에 있는 데이터에서 JOIN으로 UPDATE 가능.

### 방법 5: WITS (World Bank) Tariff Data

```bash
# WITS API — EU MFN 세율
curl -s "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/EUN/year/2024/partner/000/product/610910/indicator/MFN-WGHTD-AVRG?format=JSON"
```

### 방법 6: psql 직접 연결로 벌크 UPDATE

MacMap 데이터가 있으면 psql로 직접 UPDATE:

```sql
-- macmap_ntlc_rates에서 EU 세율을 gov_tariff_schedules에 매핑
UPDATE gov_tariff_schedules g
SET duty_rate_pct = m.rate_pct,
    duty_rate_text = m.rate_pct || '%'
FROM macmap_ntlc_rates m
WHERE g.country = 'EU'
  AND m.reporter = 'EU'
  AND m.tariff_type = '009'
  AND g.hs_code LIKE m.hs_code || '%';

-- GB도 동일하게
UPDATE gov_tariff_schedules g
SET duty_rate_pct = m.rate_pct,
    duty_rate_text = m.rate_pct || '%'
FROM macmap_ntlc_rates m
WHERE g.country = 'GB'
  AND m.reporter = 'GB'
  AND m.tariff_type = '009'
  AND g.hs_code LIKE m.hs_code || '%';
```

---

## 실행 순서

```
1. 방법 4 먼저 (MacMap DB JOIN) — 이미 있는 데이터가 가장 빠르다
   → macmap_ntlc_rates에 EU/GB 세율이 있는지 확인
   → 있으면 JOIN UPDATE 실행
   → 커버리지 확인 (몇 % 채워졌는지)

2. 커버리지 부족하면 방법 1 (EU TARIC API) + 방법 2 (UK API)
   → 남은 NULL 행의 hs_code로 API 호출
   → 세율 추출 → UPDATE

3. 그래도 부족하면 방법 3 (WTO API)
   → WTO API Key 사용하여 벌크 조회

4. 최후 수단: 방법 5 (WITS)

5. 각 단계마다 커버리지 체크:
   SELECT country, count(*), count(duty_rate_pct),
     round(count(duty_rate_pct)::numeric / count(*) * 100, 1) as pct
   FROM gov_tariff_schedules WHERE country IN ('EU', 'GB') GROUP BY country;
```

---

## ⚠️ 절대 규칙

1. **한 방법이 실패하면 반드시 다음 방법을 시도한다. 포기 금지.**
2. **API rate limit 주의** — 1초에 1건 이상 호출하지 않는다 (sleep 1)
3. **기존 hs_code, description 수정 금지** — duty_rate_pct와 duty_rate_text만 UPDATE
4. **진행 상황을 엑셀에 실시간 기록** — 어떤 방법을 시도했고, 몇 건 성공했고, 몇 건 실패했는지
5. **psql 직접 연결 사용 가능**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
6. **Management API도 사용 가능**: Bearer token = `sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a`

---

## 최종 목표

```
수집 전:
  EU: 17,278행 중 0행 세율 있음 (0%)
  GB: 17,289행 중 0행 세율 있음 (0%)

수집 후 (목표):
  EU: 17,278행 중 최대한 많은 행에 세율 채움 (목표 80%+)
  GB: 17,289행 중 최대한 많은 행에 세율 채움 (목표 80%+)
```

**100%가 안 되는 건 괜찮다** — 종량세, 복합세 등 숫자 하나로 표현 못하는 세율이 있을 수 있음. 하지만 "XX%" 형식의 종가세는 반드시 전부 채운다.

엑셀 시트 마감: `=== 작업 종료 === | 소요시간 | EU 커버리지 X% | GB 커버리지 X% | UPDATE 행수 | 사용한 방법`
