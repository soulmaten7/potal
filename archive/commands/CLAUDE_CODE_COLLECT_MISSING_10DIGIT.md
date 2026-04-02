# Claude Code 명령어: KR/JP/AU/CA 10자리 관세율표 수집 + US 누락분 보충

> **날짜**: 2026-03-21 KST
> **목표**: KR/JP/AU/CA 4개국의 10자리 관세율표를 각 나라 세관에서 다운로드 + US 원본(35,733행)에서 gov_tariff_schedules(28,718행) 누락분 7,000행 보충
> **현재 문제**: KR/JP/AU/CA는 gov_tariff_schedules에 6자리만 있음. 7~10자리 코드가 0건. Step 4 Country Router가 이 나라들에서 10자리 확장을 전혀 못함.
> **원칙**: 각 나라 세관 공식 소스에서 10자리 원본을 직접 다운로드. 어떤 방법을 써서든 반드시 가져온다. 포기 금지.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 현재 상태 (문제)

```
gov_tariff_schedules:
  US: 28,718행 (4~10자리 혼합) — 원본 35,733행에서 ~7,000행 누락
  EU: 17,278행 (전부 10자리) ✅
  GB: 17,289행 (전부 10자리) ✅
  KR: 6,646행 (전부 6자리) ❌ — 10자리 0건
  JP: 6,633행 (전부 6자리) ❌ — 10자리 0건
  AU: 6,652행 (전부 6자리) ❌ — 8자리 0건 (AU는 8자리 체계)
  CA: 6,626행 (전부 6자리) ❌ — 10자리 0건
```

---

## Part 1: US 누락분 보충

### 1-1. US 원본에서 누락 행 찾기

US HTS 원본이 이미 있다: `/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json` (15MB, 35,733행)

```python
import json

# 원본 로드
with open('/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json') as f:
    original = json.load(f)

# 원본의 hs_code 전부 추출
original_codes = set()
# (JSON 구조에 따라 추출 방법 다름 — 먼저 구조 파악 후 추출)

# gov_tariff_schedules US 코드 전부 추출 (DB에서)
# SELECT hs_code FROM gov_tariff_schedules WHERE country = 'US';

# 차이 = 원본에 있는데 DB에 없는 코드
missing = original_codes - db_codes
print(f'누락: {len(missing)}건')
```

### 1-2. 누락 행 DB INSERT

```sql
-- psql로 직접 INSERT
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres

-- CSV로 변환 후 \copy
\copy gov_tariff_schedules(country, hs_code, description, indent, source, created_at) FROM '/tmp/us_missing.csv' WITH CSV HEADER;
```

---

## Part 2: KR (한국) 10자리 관세율표 수집

### 2-1. 소스 확인

**한국 관세청 UNI-PASS:**
- https://unipass.customs.go.kr/
- 관세율표 조회/다운로드 가능

**관세법령정보포털:**
- https://law.customs.go.kr/
- HSK 10자리 전체 관세율표

**WTO API (대안):**
```bash
# WTO에서 한국 전체 tariff line 데이터
curl -s "https://api.wto.org/timeseries/v1/data?i=HS_A_0040&r=410&ps=2024&pc=HS6&fmt=json&lang=1&max=50000" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d"
```

**정부 API (있으면):**
```bash
# 관세청 OpenAPI
curl -s "https://unipass.customs.go.kr/openapi/..."
```

### 2-2. 수집 방법 (순서대로 시도)

```
방법 1: 관세청 UNI-PASS에서 HSK 전체 엑셀/CSV 다운로드
방법 2: 관세법령정보포털에서 관세율표 벌크 다운로드
방법 3: WTO API로 한국 HS tariff line 전체 수집
방법 4: 한국 관세청 OpenAPI (있으면)
방법 5: 이미 수집된 데이터에서 10자리 정보 추출
  → /Volumes/soulmaten/POTAL/regulations/ 에 한국 관련 데이터 확인
  → macmap_ntlc_rates에 KR 데이터가 10자리로 있는지 확인
```

```sql
-- macmap에 KR 10자리 데이터가 있는지 먼저 확인
SELECT length(hs_code), count(*) FROM macmap_ntlc_rates
WHERE destination_country = 'KR' GROUP BY length(hs_code);
```

### 2-3. DB INSERT

수집 후 gov_tariff_schedules에 INSERT:
```sql
-- country='KR', hs_code=10자리, description, source='kcs_hsk'
```

---

## Part 3: JP (일본) 9자리 관세율표 수집

### 3-1. 소스 확인

**日本税関:**
- https://www.customs.go.jp/tariff/
- 実行関税率表 (엑셀 다운로드 가능)
- 統計品目表 (CSV 다운로드 가능)

```bash
# 일본 세관 관세율표 다운로드 페이지
curl -s "https://www.customs.go.jp/tariff/2024_4/index.htm"
# 엑셀 파일 직접 다운로드
```

### 3-2. 수집 방법

```
방법 1: customs.go.jp에서 実行関税率表 엑셀 다운로드 (Chapter별)
방법 2: 統計品目表 CSV 다운로드
방법 3: WTO API
방법 4: 기존 수집 데이터 확인
```

---

## Part 4: AU (호주) 8자리 관세율표 수집

### 4-1. 소스 확인

**Australian Border Force:**
- https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification
- Working Tariff (PDF 또는 데이터)

**FTA Portal:**
- https://ftaportal.dfat.gov.au/

```bash
# ABF Working Tariff 다운로드
curl -s "https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff"
```

### 4-2. 수집 방법

```
방법 1: ABF Working Tariff 벌크 다운로드
방법 2: FTA Portal에서 8자리 코드 수집
방법 3: WTO API
방법 4: 기존 수집 데이터 확인
```

---

## Part 5: CA (캐나다) 10자리 관세율표 수집

### 5-1. 소스 확인

**CBSA Customs Tariff:**
- https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/
- Customs Tariff 벌크 다운로드

```bash
# CBSA 관세율표 다운로드
curl -s "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2024/html/tblmod-1.html"
```

### 5-2. 수집 방법

```
방법 1: CBSA 사이트에서 Customs Tariff 벌크 다운로드 (HTML/PDF → 파싱)
방법 2: Canada Open Data Portal
방법 3: WTO API
방법 4: 기존 수집 데이터 확인
```

---

## Part 6: 모든 방법이 안 될 경우 공통 대안

### 6-1. 정부 API 대신 WITS/WTO 벌크

```bash
# WTO tariff line download — 각 나라별 전체 tariff line
curl -s "https://api.wto.org/timeseries/v1/data?i=HS_A_0040&r={country_code}&ps=2024,2023&pc=HS6&fmt=json&lang=1&max=50000" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d"
```

### 6-2. 기존 DB에서 10자리 추출

```sql
-- macmap_ntlc_rates에 10자리 hs_code가 있는지 국가별 확인
SELECT destination_country, length(hs_code) as len, count(*)
FROM macmap_ntlc_rates
WHERE destination_country IN ('KR', 'JP', 'AU', 'CA')
GROUP BY destination_country, length(hs_code)
ORDER BY destination_country, len;

-- macmap_min_rates도 확인
SELECT reporter_iso2, length(hs_code) as len, count(*)
FROM macmap_min_rates
WHERE reporter_iso2 IN ('KR', 'JP', 'AU', 'CA')
GROUP BY reporter_iso2, length(hs_code)
ORDER BY reporter_iso2, len;
```

### 6-3. EU TARIC API 패턴 활용

EU/GB는 이미 10자리가 있다. EU TARIC API처럼 KR/JP/AU/CA도 정부 API가 있을 수 있다:
- KR: 관세청 OpenAPI (https://unipass.customs.go.kr/openapi/)
- JP: NACCS (https://www.naccs.jp/)
- AU: ABF API
- CA: CBSA API

---

## 수집 후 처리

### 7-1. 수집한 데이터를 gov_tariff_schedules에 INSERT

```sql
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres

-- 기존 6자리 행은 유지 (description 참고용)
-- 새로 수집한 7~10자리 행을 추가 INSERT
-- country, hs_code, description, indent(있으면), source, created_at
```

### 7-2. 수집 후 검증

```sql
-- 국가별 코드 길이 분포 재확인
SELECT country, length(hs_code) as code_length, count(*)
FROM gov_tariff_schedules
GROUP BY country, length(hs_code)
ORDER BY country, code_length;
```

### 7-3. codified_national_v5.json 재생성

새 데이터가 추가되면 codified_national_v5.json도 다시 만들어야 한다.
→ 이건 별도 명령어에서 진행 (이 명령어에서는 수집 + DB INSERT만)

---

## Part 7: 관련 테이블 데이터 상태 점검 + 보충

"기존에 있다"고 스킵했을 수 있는 다른 테이블도 전부 확인.

### 7-1. 빈 테이블 / 불완전 테이블 확인

아래 테이블이 제대로 채워져 있는지, 7개국 데이터가 있는지 점검:

```sql
-- hs_expansion_rules: 0건 — 완전히 비어있음
SELECT * FROM hs_expansion_rules LIMIT 5;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hs_expansion_rules' ORDER BY ordinal_position;

-- precomputed_hs10_candidates: 1,246건 — 7개국 커버하는지
SELECT * FROM precomputed_hs10_candidates LIMIT 5;
SELECT column_name FROM information_schema.columns WHERE table_name = 'precomputed_hs10_candidates' ORDER BY ordinal_position;

-- duty_rates: 168건 — 8개국밖에 없음
SELECT DISTINCT destination_country FROM duty_rates;
SELECT * FROM duty_rates LIMIT 5;

-- additional_tariffs: 12건 — 이게 뭔지
SELECT * FROM additional_tariffs;

-- country_profiles: 137건 — 240개국 중 137개만
SELECT count(*) as total, count(CASE WHEN iso_code_2 IS NOT NULL THEN 1 END) as has_iso FROM country_profiles;

-- country_regulatory_notes: 30건 — 어떤 나라
SELECT * FROM country_regulatory_notes LIMIT 10;

-- hs_description_keywords: 25,484건 — 어떤 데이터
SELECT * FROM hs_description_keywords LIMIT 5;
```

### 7-2. 각 테이블이 Step 4~6에서 쓰이는지 확인

코드에서 이 테이블들을 참조하는지 grep:
```bash
grep -r "hs_expansion_rules\|precomputed_hs10\|duty_rates\|additional_tariffs\|country_profiles\|country_regulatory_notes\|hs_description_keywords" app/lib/cost-engine/ --include="*.ts" -l
```

### 7-3. 비어있거나 불완전한 테이블 → 데이터 채우기

- `hs_expansion_rules` (0건): 이 테이블의 목적 파악 → 필요하면 데이터 생성
- `precomputed_hs10_candidates` (1,246건): 7개국 전부 있는지, 추가 필요한지
- `duty_rates` (168건): macmap과 중복? 별도 용도?
- `country_profiles` (137건): 나머지 103개국 프로필 필요한지
- `additional_tariffs` (12건): Section 301/232 등 추가 관세 — 최신 데이터인지

---

## 최종 목표

```
수집 후 gov_tariff_schedules:
  US: 28,718 → ~35,000행 (10자리 보충)
  EU: 17,278행 ✅ (변경 없음)
  GB: 17,289행 ✅ (변경 없음)
  KR: 6,646 → X행 (10자리 추가)
  JP: 6,633 → X행 (9자리 추가)
  AU: 6,652 → X행 (8자리 추가)
  CA: 6,626 → X행 (10자리 추가)

모든 7개국에서 Step 4 Country Router가 10자리(또는 8/9자리) 확장 가능
```

---

## ⚠️ 절대 규칙

1. **각 나라 세관 공식 소스에서 직접 다운로드** — 제3자 사이트 금지
2. **한 방법이 안 되면 다음 방법 시도. 포기 금지.**
3. **기존 6자리 데이터 삭제 금지** — 새 10자리 데이터를 추가 INSERT만
4. **4개국 전부 수집** — 일부만 하지 않는다
5. **수집 후 반드시 code_length 분포 확인** — 10자리가 실제로 들어갔는지
6. **psql 직접 연결**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
7. **WTO API Key**: `e6b00ecdb5b34e09aabe15e68ab71d1d`
8. **API rate limit 준수** — 1초 1건
9. **엑셀에 수집 과정 전부 기록** — 어떤 소스에서, 몇 건, 어떤 형식으로

시트 마감: `=== 작업 종료 === | US +X행 | KR +X행 | JP +X행 | AU +X행 | CA +X행 | 총 gov_tariff_schedules X행`
