# Claude Code 명령어 (터미널 1): 240개국 MFN 세율 전체 수집

> **날짜**: 2026-03-21 KST
> **목표**: macmap에 없는 160개국의 MFN 세율을 WTO API에서 수집하여 macmap_ntlc_rates에 INSERT. 240개국 100% 세율 커버리지 달성.
> **원칙**: 포기 금지. WTO 안 되면 WITS, WITS 안 되면 다른 방법. 240개국 전부 채운다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 사전 조사 완료 (Cowork에서 확인)

### WTO API 작동 확인:
```
엔드포인트: https://api.wto.org/timeseries/v1/data
인디케이터: HS_A_0010 (HS MFN - Simple average ad valorem duty)
API Key: e6b00ecdb5b34e09aabe15e68ab71d1d (Header: Ocp-Apim-Subscription-Key)

테스트 결과:
  EU(918) 610910 = 12.0% ✅ (macmap과 일치)
  KR(410) 610910 = 13.0% ✅ (macmap과 일치)
  ZA(710) = 16,611건, 5,757 HS6, 3년치 한번에

단위: Value = 퍼센트 (12.0 = 12%). 변환 불필요.
1 API 호출로 국가 1개의 전체 HS6 세율 (~5,700건) 가져옴.
```

### WTO reporter 코드:
```
WTO는 3자리 숫자 코드 사용 (ISO3N). 예: US=842, KR=410, JP=392, ZA=710, EU=918
API에서 reporters 목록 제공: https://api.wto.org/timeseries/v1/reporters
iso3A 필드 = ISO 3자리 알파벳 (USA, KOR 등)
```

### 현재 상태:
```
macmap_ntlc_rates: 53개국 (destination_country = ISO2)
EU 코드 매핑: 27개국 (duty-rate-lookup.ts에서 처리)
→ 커버: 80/240 (33%)
→ 부족: 160개국
```

---

## Phase 1: ISO2 → WTO 코드 매핑 테이블 생성

### 1-1. WTO reporters 목록 다운로드

```bash
curl -s "https://api.wto.org/timeseries/v1/reporters?fmt=json&lang=1&max=500" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d" > /tmp/wto_reporters.json
```

### 1-2. countries 테이블의 ISO2와 WTO code 매핑

```sql
-- POTAL countries 240개국의 iso_code_2 목록
SELECT iso_code_2, name FROM countries ORDER BY iso_code_2;
```

WTO reporters에서 `iso3A`를 통해 ISO2로 변환:
- WTO reporters의 `iso3A` (예: USA) → ISO2 (예: US) 변환은 표준 매핑
- 또는 WTO reporters의 `code` (예: 842) 직접 사용

### 1-3. macmap에 없는 160개국의 WTO code 확인

```sql
SELECT c.iso_code_2, c.name FROM countries c
WHERE c.iso_code_2 NOT IN (SELECT DISTINCT destination_country FROM macmap_ntlc_rates)
  AND c.iso_code_2 NOT IN ('AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE')
ORDER BY c.iso_code_2;
```

이 목록에서 각 국가의 WTO reporter code를 매핑.

---

## Phase 2: WTO API 벌크 수집

### 2-1. 수집 스크립트 작성 (Python)

```python
import requests
import json
import time

WTO_KEY = 'e6b00ecdb5b34e09aabe15e68ab71d1d'
BASE_URL = 'https://api.wto.org/timeseries/v1/data'
HEADERS = {'Ocp-Apim-Subscription-Key': WTO_KEY}

def fetch_mfn_rates(wto_code: str, years: str = '2024,2023,2022,2021') -> list:
    """국가 1개의 전체 HS6 MFN 세율 가져오기"""
    params = {
        'i': 'HS_A_0010',  # HS MFN simple avg ad valorem
        'r': wto_code,
        'ps': years,
        'pc': 'HS6',
        'fmt': 'json',
        'lang': '1',
        'max': '50000',
    }
    resp = requests.get(BASE_URL, headers=HEADERS, params=params, timeout=30)
    if resp.status_code == 204:
        return []  # No data
    data = resp.json()
    return data.get('Dataset', [])

# 160개국 순차 수집
# country_map = { 'ZA': '710', 'NG': '566', ... }
# 각 국가별 1초 sleep (rate limit)
```

### 2-2. 수집 흐름

```
1. WTO reporters 목록에서 ISO2 → WTO code 매핑 생성
2. 160개국 리스트에서 WTO code가 있는 국가 추출
3. 각 국가별 API 호출 (HS_A_0010, HS6 레벨, 최근 4년)
4. 최신 연도 데이터 우선 사용 (2024 → 2023 → 2022 → 2021)
5. 결과를 macmap_ntlc_rates 형식으로 변환:
   - destination_country = ISO2
   - hs_code = HS6 코드 (WTO에서 6자리로 옴)
   - hs6 = HS6 코드 (동일)
   - mfn_rate = Value / 100 (WTO는 %, macmap은 비율)
       ⚠️ WTO Value=12.0 → macmap mfn_rate=0.12
   - rate_type = 'ad_valorem'
   - source = 'wto_api'
6. psql로 macmap_ntlc_rates에 INSERT
```

### 2-3. 단위 변환 주의!

```
WTO API:   Value = 12.0 (퍼센트, PCT)
macmap DB: mfn_rate = 0.12 (비율)

변환: mfn_rate = WTO Value / 100
```

duty-rate-lookup.ts는 이미 `mfn_rate × 100` 변환 로직이 있음 (Line 63: `Math.round(mfnRate * 10000) / 100`).
WTO 데이터를 macmap과 같은 비율 형식으로 넣어야 기존 코드가 정상 작동.

### 2-4. psql 벌크 INSERT

```bash
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres

# CSV로 저장 후 \copy
\copy macmap_ntlc_rates(destination_country, hs_code, hs6, mfn_rate, rate_type, source) FROM '/tmp/wto_mfn_rates.csv' WITH CSV HEADER;
```

---

## Phase 3: WTO에 없는 국가 처리

WTO가 204 No Content 반환하는 국가 = 데이터 없음.
주로 소규모 영토/비WTO 회원국.

### 3-1. WITS 대안

```bash
# World Bank WITS API
curl -s "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/XXX/year/2023/partner/000/product/610910/indicator/MFN-WGHTD-AVRG?format=JSON"
```

### 3-2. 최종 수단 — vat_gst_rates 테이블의 국가별 디폴트 세율

240개국 중 WTO/WITS에도 없는 소규모 영토(예: 버뮤다, 팔라우)는:
- 해당 국가가 속한 관세동맹의 세율 적용 (예: 버뮤다 → UK 세율)
- 또는 "데이터 없음" 그대로 남기고, duty-rate-lookup.ts가 null 반환

### 3-3. 실패 국가 리스트 기록

수집 못한 국가는 엑셀에 명확히 기록:
- 국가명, ISO2, 실패 사유 (WTO 없음/WITS 없음/비WTO/영토)

---

## Phase 4: 검증

### 4-1. 커버리지 확인

```sql
-- 수집 후 macmap_ntlc_rates 국가 수
SELECT count(DISTINCT destination_country) FROM macmap_ntlc_rates;

-- countries 240개 중 커버되는 국가
SELECT count(*) FROM countries
WHERE iso_code_2 IN (SELECT DISTINCT destination_country FROM macmap_ntlc_rates)
   OR iso_code_2 IN ('AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE');
```

### 4-2. 세율 정확도 교차 검증

기존 macmap 53개국 세율 vs WTO 세율 비교 (같은 국가/HS6):

```sql
-- macmap 기존 데이터와 WTO 신규 데이터가 같은 국가에서 다르지 않은지
-- (기존 53개국은 macmap 유지, 신규 160개국만 WTO로 추가하므로 충돌 없어야 함)
SELECT destination_country, hs6, mfn_rate, source
FROM macmap_ntlc_rates
WHERE source = 'wto_api'
ORDER BY destination_country, hs6
LIMIT 20;
```

### 4-3. 파이프라인 테스트 (10개 상품)

```typescript
// 기존 7개 (이미 PASS된 것)
Cotton → US, Cotton → EU, Cotton → DE, Steel → KR, Cotton → BR, Cotton → TH, Ceramic → US

// 신규 3개 (WTO에서 수집한 국가)
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'ZA', category: 'clothing', price: 15 }  // 남아공
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'KE', category: 'clothing', price: 15 }  // 케냐 (macmap에 이미 있음 — 대조용)
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'GE', category: 'clothing', price: 15 }  // 조지아 (WTO에서 새로 수집)
```

---

## Phase 5: npm run build + 최종 보고

```bash
npm run build  # 0 errors 확인
```

### 엑셀 최종 요약:

| 항목 | Before | After |
|------|--------|-------|
| macmap 국가 수 | 53 | 53 + X (WTO 수집) |
| EU 코드 매핑 | 27 | 27 |
| 총 세율 커버리지 | 80/240 (33%) | ?/240 |
| WTO 수집 성공 | 0 | X개국 |
| WTO 수집 실패 | 0 | Y개국 (리스트 기록) |
| 신규 INSERT 행 수 | 0 | 약 X × 5,700 |
| 테스트 | 10/10 | X/13 PASS |

시트 마감: `=== 작업 종료 === | 소요시간 | 국가 수집 X/160 | INSERT 행수 | 테스트 결과`

---

## ⚠️ 절대 규칙

1. **기존 macmap 53개국 데이터 건드리지 않는다** — INSERT만, UPDATE/DELETE 금지
2. **WTO 세율 단위 변환**: Value(%) → mfn_rate(비율) = Value / 100
3. **API rate limit**: 호출 간 1초 sleep
4. **한 방법 실패 → 다음 방법. 포기 금지**
5. **psql 직접 연결**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
6. **Step 0~3 코드 절대 수정 금지**
7. **duty-rate-lookup.ts는 이미 정상 작동 중 — 수정 최소화. 신규 데이터가 기존 형식과 동일하면 코드 수정 불필요**
