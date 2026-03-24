# Claude Code 명령어: Duty Rate 검증용 데이터 완전성 감사 + 누락 데이터 수집

> **날짜**: 2026-03-23 KST
> **목표**: Duty Rate 검증(Round 1에서 9/20 = 45% PASS)에서 NO_DATA 5건 + RATE_MISMATCH 6건이 나왔다. 데이터가 정말 다 있는지 portal 폴더 + 외장하드 전체를 점검하고, 없으면 수집해온다.
> **배경**: 이전에 "2번에 걸쳐 완벽하게 다 모았다"고 했지만, Round 1 결과 NO_DATA가 5건이나 나왔다. 데이터 자체가 없는 건지, 있는데 코드가 못 찾는 건지 구분해야 한다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## Phase 1: 현재 데이터 인벤토리 — portal 폴더 전체 점검

Duty Rate 계산에 관련된 모든 파일을 찾는다.

### 1-1. Supabase DB 테이블 점검

```sql
-- 각 테이블의 행 수 + 샘플 데이터 확인
-- 반드시 실제 쿼리를 실행해서 결과를 엑셀에 기록

-- MFN 관세율 (NTLC)
SELECT count(*) FROM macmap_ntlc_rates;
SELECT DISTINCT reporter_iso2 FROM macmap_ntlc_rates ORDER BY 1;  -- 어떤 나라가 있는지
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 = 'USA' LIMIT 5;  -- US 데이터 샘플
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 = 'EU' LIMIT 5;   -- EU 데이터 있는지?
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 = 'DEU' LIMIT 5;  -- DE(독일) 데이터 있는지?

-- MIN 관세율 (FTA/특혜)
SELECT count(*) FROM macmap_min_rates;
SELECT DISTINCT reporter_iso2 FROM macmap_min_rates ORDER BY 1;

-- AGR 관세율
SELECT count(*) FROM macmap_agr_rates;
SELECT DISTINCT reporter_iso2 FROM macmap_agr_rates ORDER BY 1;

-- 무역구제 (AD/CVD)
SELECT count(*) FROM trade_remedy_cases;
SELECT count(*) FROM trade_remedy_products;
SELECT count(*) FROM trade_remedy_duties;

-- 7개국 관세율표
SELECT count(*) FROM gov_tariff_schedules;
SELECT destination_country, count(*) FROM gov_tariff_schedules GROUP BY 1 ORDER BY 2 DESC;

-- 무역협정
SELECT count(*) FROM macmap_trade_agreements;

-- 제재
SELECT count(*) FROM sanctions_entries;

-- Section 301/232 등 특별관세 데이터가 DB에 있는지 확인
-- (테이블 이름이 뭔지 모르면 전체 테이블 목록 조회)
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### 1-2. Round 1 NO_DATA 5건의 정확한 원인 추적

각 NO_DATA 건에 대해 DB를 직접 쿼리해서 데이터가 진짜 없는지 확인:

```sql
-- TC-02: Laptop CN→DE, HS:847130
-- 문제: DE(독일)로 쿼리하면 데이터 없음. EU로 쿼리해야 하는가?
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 IN ('DEU', 'DE', 'EU', 'EUR') AND hs_code LIKE '8471%' LIMIT 10;
SELECT * FROM macmap_min_rates WHERE reporter_iso2 IN ('DEU', 'DE', 'EU', 'EUR') AND hs_code LIKE '8471%' LIMIT 10;

-- TC-03: Auto parts JP→US, HS:681310
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 IN ('USA', 'US') AND hs_code LIKE '6813%' LIMIT 10;

-- TC-06: Leather shoes VN→DE(EU), HS:640399
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 IN ('DEU', 'DE', 'EU', 'EUR') AND hs_code LIKE '6403%' LIMIT 10;

-- TC-11: Solar panels CN→US, HS:854140
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 IN ('USA', 'US') AND hs_code LIKE '8541%' LIMIT 10;

-- TC-12: Steel rebar CN→DE(EU), HS:721420
SELECT * FROM macmap_ntlc_rates WHERE reporter_iso2 IN ('DEU', 'DE', 'EU', 'EUR') AND hs_code LIKE '7214%' LIMIT 10;
```

### 1-3. macmap-lookup.ts 코드에서 국가 코드 매핑 확인

```bash
# macmap-lookup.ts에서 EU 회원국 → EU 매핑 로직이 있는지 확인
grep -n "EU\|DEU\|FRA\|ITA\|member" app/lib/cost-engine/macmap-lookup.ts | head -30

# duty-rate-lookup.ts에는 EU 매핑이 있다고 했으니 비교
grep -n "EU\|DEU\|FRA\|ITA\|member" app/lib/cost-engine/gri-classifier/steps/v3/duty-rate-lookup.ts | head -30

# GlobalCostEngine.ts에서 국가 코드 어떻게 처리하는지
grep -n "destination\|reporter\|country_code\|iso2" app/lib/cost-engine/GlobalCostEngine.ts | head -30
```

---

## Phase 2: 외장하드 데이터 점검

### 2-1. 외장하드 Duty Rate 관련 파일 전체 목록

```bash
# /Volumes/soulmaten/POTAL/ 전체에서 duty, tariff, rate, macmap, wto 관련 파일 찾기
find /Volumes/soulmaten/POTAL/ -type f \( -name "*duty*" -o -name "*tariff*" -o -name "*rate*" -o -name "*macmap*" -o -name "*wto*" -o -name "*mfn*" -o -name "*fta*" -o -name "*ntlc*" -o -name "*min_rate*" -o -name "*agr_rate*" \) 2>/dev/null | sort

# 외장하드 전체 폴더 구조 확인
ls -la /Volumes/soulmaten/POTAL/
ls -la /Volumes/soulmaten/POTAL/data/ 2>/dev/null
ls -la /Volumes/soulmaten/POTAL/regulations/ 2>/dev/null
ls -la /Volumes/soulmaten/POTAL/tlc_data/ 2>/dev/null
```

### 2-2. 각 파일의 데이터 존재 확인 (비어있지 않은지)

```bash
# 찾은 파일들 각각 크기 + 첫 5줄 확인
# (Phase 2-1에서 나온 파일 목록을 순회)
for f in $(find /Volumes/soulmaten/POTAL/ -type f -name "*tariff*" -o -name "*duty*" -o -name "*rate*" 2>/dev/null); do
    echo "=== $f ==="
    ls -lh "$f"
    head -3 "$f" 2>/dev/null || echo "(binary file)"
    echo ""
done
```

### 2-3. portal/data/ 폴더 확인

```bash
ls -la portal/data/
ls -la portal/data/itc_macmap/ 2>/dev/null
ls -la portal/data/tariff-research/ 2>/dev/null
ls -la portal/data/wits_tariffline/ 2>/dev/null
```

---

## Phase 3: 코드 경로 추적 — 데이터가 있는데 못 찾는 건지 확인

### 3-1. macmap-lookup.ts의 DB 쿼리 로직 전체 읽기

```bash
cat app/lib/cost-engine/macmap-lookup.ts
```

확인할 것:
- `reporter_iso2` 컬럼에 어떤 값으로 쿼리하는지 (ISO2? ISO3? 국가명?)
- EU 회원국 → "EU" 매핑이 있는지
- HS Code 매칭 방식 (정확 매칭? LIKE? 6자리? 10자리?)
- fallback 체인 (AGR→MIN→NTLC→MFN) 순서

### 3-2. duty-rate-lookup.ts 전체 읽기 (7개국 10자리용)

```bash
cat app/lib/cost-engine/gri-classifier/steps/v3/duty-rate-lookup.ts
```

확인할 것:
- EU 매핑이 여기에는 있다고 했으니 → 어떤 로직인지 확인
- macmap-lookup.ts와 duty-rate-lookup.ts 중 어디가 실제로 호출되는지

### 3-3. GlobalCostEngine.ts에서 duty rate 계산 경로

```bash
# duty rate 관련 함수 호출 흐름 확인
grep -n "duty\|rate\|macmap\|lookupDuty\|getDutyRate\|calculateDuty" app/lib/cost-engine/GlobalCostEngine.ts | head -40
```

---

## Phase 4: GAP 진단 결과 정리

Phase 1~3 결과를 종합해서 NO_DATA 5건 + RATE_MISMATCH 6건 각각의 원인을 확정한다.

```
| TC | 문제 | 원인 (확정) | 분류 |
|-----|------|-----------|------|
| TC-02 | CN→DE NO_DATA | ? | DATA_MISSING / CODE_BUG / MAPPING_BUG |
| TC-03 | JP→US NO_DATA | ? | DATA_MISSING / CODE_BUG / MAPPING_BUG |
| TC-06 | VN→DE NO_DATA | ? | DATA_MISSING / CODE_BUG / MAPPING_BUG |
| TC-11 | CN→US solar NO_DATA | ? | DATA_MISSING / CODE_BUG / MAPPING_BUG |
| TC-12 | CN→DE steel NO_DATA | ? | DATA_MISSING / CODE_BUG / MAPPING_BUG |
| TC-05 | KR→US 5%→0% | ? | RATE_LOGIC / DATA_WRONG / CODE_BUG |
| TC-09 | BD→CA 12%→0% | ? | RATE_LOGIC / DATA_WRONG / CODE_BUG |
| TC-10 | MX→US 11.1%→5% | ? | RATE_LOGIC / DATA_WRONG / CODE_BUG |
| TC-13 | IT→US 8%→16% | ? | RATE_LOGIC / DATA_WRONG / CODE_BUG |
| TC-19 | KP→US 90%→16.5% | ? | FEATURE_MISSING (Column 2) |
| TC-20 | BR→US 33.9%→0% | ? | FEATURE_MISSING (TRQ) |
```

분류 기준:
- **DATA_MISSING**: DB에 진짜 해당 데이터가 없음 → 데이터 수집 필요
- **CODE_BUG**: 데이터는 있는데 코드가 못 찾음 (국가 코드 매핑, HS 매칭 등) → 코드 수정
- **MAPPING_BUG**: EU 회원국→EU 같은 매핑 누락 → 매핑 추가
- **RATE_LOGIC**: MFN vs FTA 혼동, 종량세→종가세 변환 등 → 로직 수정
- **DATA_WRONG**: DB에 틀린 세율이 들어가 있음 → 데이터 교정
- **FEATURE_MISSING**: Column 2, TRQ 등 미구현 기능 → 신규 구현

---

## Phase 5: 누락 데이터 수집

Phase 4에서 DATA_MISSING으로 분류된 것들을 수집한다.

### 5-1. EU 관세율 데이터 확인/수집

만약 macmap에 EU 데이터가 "EU"로 저장되어 있고 코드가 "DE"로 쿼리해서 못 찾는 거면:
- → 코드 수정 (EU 매핑 추가). 데이터 수집 불필요.

만약 macmap에 EU 데이터 자체가 없으면:
- → EU TARIC에서 MFN 세율 수집 필요
- 소스: https://ec.europa.eu/taxation_customs/dds2/taric/
- 또는 WTO Tariff Download Facility

### 5-2. 특정 HS-국가 조합 누락 데이터

TC-03 (JP→US, 681310), TC-11 (CN→US, 854140) 등:
- macmap에 해당 HS 6자리가 없으면 → USITC HTS에서 직접 확인
- USITC API: https://hts.usitc.gov/api/search
- 또는 gov_tariff_schedules에서 확인

### 5-3. Section 301/232 데이터

Round 1에서 Section 301/232 테스트가 포함되었는데:
- DB에 Section 301/232 데이터가 있는지 확인
- 없으면: USTR 공식 목록에서 수집 (HS Code별 추가관세율)

### 5-4. Column 2 세율 (DPRK 등 제재국)

- US Column 2 세율: Smoot-Hawley 세율 (1930년대 기준, 매우 높음)
- USITC HTS "General" vs "Special" vs "Column 2" 구분
- 소스: hts.usitc.gov에서 Column 2 세율 다운로드

### 5-5. TRQ (Tariff Rate Quota)

- 설탕, 유제품 등 쿼터 기반 관세
- 소스: USITC HTS Additional U.S. Notes, EU TARIC TRQ

---

## Phase 6: 수집한 데이터 DB 적재

Phase 5에서 수집한 데이터를 적절한 DB 테이블에 넣는다.

```
적재 방법:
- psql \copy (가장 빠름)
- Management API curl (소량)

적재 후 확인:
- SELECT count(*) 재확인
- Round 1 실패 건 직접 쿼리해서 데이터 나오는지 확인
```

---

## Phase 7: 결과물

### 엑셀: `POTAL_DutyRate_Data_Audit.xlsx`

**Sheet 1: DB 인벤토리** — 테이블별 행 수, 국가 수, 커버리지
**Sheet 2: 외장하드 파일 목록** — 경로, 크기, 내용 요약
**Sheet 3: NO_DATA 원인 분석** — 11건 각각의 원인 확정 (DATA_MISSING / CODE_BUG / MAPPING_BUG 등)
**Sheet 4: 코드 경로 분석** — macmap-lookup.ts vs duty-rate-lookup.ts 비교
**Sheet 5: 수집 필요 목록** — 누락 데이터별 소스 URL, 수집 방법, 예상 건수
**Sheet 6: 수집/적재 결과** — 수집한 데이터, 적재한 건수, 검증 쿼리 결과

### Work Log 기록 (절대 규칙 11번)

---

## ⚠️ 절대 규칙

1. **DB 쿼리는 반드시 실행해서 실제 결과를 기록** — "있을 것이다" 추정 금지
2. **파일 존재 여부도 실제 확인** — ls/find로 직접 확인
3. **비어있는 파일 주의** — 파일이 있어도 데이터가 0건이면 DATA_MISSING
4. **코드 경로와 DB 데이터 양쪽 다 확인** — 한쪽만 보면 원인 오진단
5. **수집한 데이터는 적재 후 반드시 검증 쿼리** — INSERT만 하고 확인 안 하면 안 됨
6. **엑셀 로깅 필수** (절대 규칙 11번)

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### psql 직접 연결:
```bash
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
```
