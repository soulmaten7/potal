# Claude Code 명령어 (터미널 1): 세율 단위 검증 + 189개국 MFN 세율 수집 + 전체 테스트

> **날짜**: 2026-03-21 KST
> **목표**: (1) duty-rate-lookup.ts 단위 변환 정확성 검증 (2) macmap에 없는 189개국 MFN 세율 수집 (3) 전체 테스트
> **원칙**: 나중은 없다. 지금 다 끝낸다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **디테일**: 명령어 그대로, 결과 전체, DB 쿼리→쿼리문+행수+샘플5건, 수정→변경전/후
- **시트 마감**: `=== 작업 종료 ===`

---

## 현재 상황

### duty-rate-lookup.ts (Line 58):
```typescript
duty_rate_pct: Math.round(mfnRate * 1000) / 10, // 0.120000 → 12.0
```

macmap_ntlc_rates의 `mfn_rate` 실제 값:
```
US 610910: 0.165000  → 기대 결과: 16.5%
EU 610910: 0.120000  → 기대 결과: 12.0%
KR 610910: 0.130000  → 기대 결과: 13.0%
```

`0.165000 × 1000 / 10 = 16.5` ← 맞는 것 같지만 **모든 케이스에서 정확한지 검증 필요**.
특히 `0.165000 × 1000 = 165.0`, `165.0 / 10 = 16.5` — 이건 `× 100`이랑 같은데 부동소수점 오차 방지를 위한 코드.

### 국가 커버리지:
- macmap_ntlc_rates: **53개국** (AE, AR, AU, BD, BH, BR, CA, CH, CL, CN, CO, CR, DO, DZ, EC, EG, EU, GB, GH, HK, ID, IL, IN, JO, JP, KE, KR, KW, KZ, LK, MA, MX, MY, NG, NO, NZ, OM, PE, PH, PK, PY, QA, RU, SA, SG, TH, TN, TR, TW, UA, US, UY, VN)
- POTAL countries: **240개국**
- **부족: 189개국** (EU 회원국 27개는 EU로 커버되므로 실질 ~162개국)

---

## Phase 1: 단위 변환 정밀 검증

### 1-1. mfn_rate 값 분포 확인

```sql
-- 전체 mfn_rate 범위 확인 (0~1 사이? 0~100 사이?)
SELECT
  min(mfn_rate) as min_rate,
  max(mfn_rate) as max_rate,
  avg(mfn_rate) as avg_rate,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY mfn_rate) as median_rate
FROM macmap_ntlc_rates
WHERE mfn_rate IS NOT NULL AND mfn_rate > 0;

-- 비정상 값 확인 (1 이상이면 퍼센트 단위일 수 있음)
SELECT mfn_rate, count(*) FROM macmap_ntlc_rates
WHERE mfn_rate > 1
GROUP BY mfn_rate ORDER BY mfn_rate DESC LIMIT 10;

-- 0~1 범위 확인
SELECT
  count(CASE WHEN mfn_rate >= 0 AND mfn_rate <= 1 THEN 1 END) as between_0_1,
  count(CASE WHEN mfn_rate > 1 THEN 1 END) as above_1,
  count(*) as total
FROM macmap_ntlc_rates WHERE mfn_rate IS NOT NULL;
```

**이 결과에 따라 변환 로직 결정:**
- 전부 0~1 사이면: `mfn_rate × 100 = 퍼센트` (현재 코드 맞음)
- 일부 1 이상이면: 이미 퍼센트인 행이 섞여있으므로 조건 분기 필요
- 전부 1 이상이면: `mfn_rate` 자체가 퍼센트 → `× 100` 하면 안 됨

### 1-2. 구체적 상품 검증 (ground truth 대조)

실제 세율을 알고 있는 상품으로 검증:

```sql
-- Cotton T-Shirt (HS 610910)
-- 실제: US=16.5%, EU=12%, KR=13%, JP=10.9%, AU=5%, CA=17%
SELECT destination_country, mfn_rate, rate_type
FROM macmap_ntlc_rates
WHERE hs6 = '610910'
ORDER BY destination_country;
```

각 나라별로 `mfn_rate × 100`이 실제 세율과 일치하는지 확인.

### 1-3. duty-rate-lookup.ts 수정 (필요시)

Phase 1-1, 1-2 결과에 따라:

**현재 코드 (Line 58):**
```typescript
duty_rate_pct: Math.round(mfnRate * 1000) / 10, // 0.120000 → 12.0
```

**검증 후 정확한 변환으로 수정.** 예를 들어:
- `mfn_rate`가 전부 비율이면: `Math.round(mfnRate * 10000) / 100` (소수점 2자리)
- `mfn_rate`가 퍼센트면: `Math.round(mfnRate * 100) / 100` (변환 없이 반올림만)

---

## Phase 2: 189개국 MFN 세율 수집

### 2-1. 부족한 국가 목록 추출

```sql
-- macmap에 없는 189개국 코드 목록
SELECT iso_code_2, name FROM countries
WHERE iso_code_2 NOT IN (SELECT DISTINCT destination_country FROM macmap_ntlc_rates)
ORDER BY iso_code_2;
```

### 2-2. EU 회원국 처리

EU 27개국은 macmap에 'EU'로 존재. 개별 국가코드(DE, FR, IT 등)가 없을 뿐.
실제로는 EU 세율 = 독일/프랑스/이탈리아... 전부 동일.

```sql
-- EU 회원국 목록 확인 (countries 테이블에 eu_member 같은 필드 있는지)
SELECT * FROM countries WHERE iso_code_2 IN ('DE','FR','IT','ES','NL','BE','SE','PL','AT','DK','FI','IE','PT','CZ','RO','HU','SK','BG','HR','LT','SI','LV','EE','CY','LU','MT') LIMIT 5;
```

**해결 방법 A**: duty-rate-lookup.ts에서 EU 회원국 코드 → 'EU'로 매핑
**해결 방법 B**: macmap_ntlc_rates에 EU 회원국 27개 행을 EU 세율 복사하여 INSERT

→ **방법 A가 코드 수정만으로 해결되므로 우선.** 방법 B는 데이터 중복.

### 2-3. WTO API로 나머지 국가 MFN 세율 수집

WTO Tariff Download Facility API:
```
Base URL: https://api.wto.org/tariff/v1/
API Key: e6b00ecdb5b34e09aabe15e68ab71d1d
Header: Ocp-Apim-Subscription-Key
```

**⚠️ WTO API는 국가코드가 3자리 ISO (USA, GBR, KOR 등).** 변환 필요.

```bash
# WTO API 테스트 — 나이지리아(NG→NGA)의 610910 MFN 세율
curl -s "https://api.wto.org/timeseries/v1/data?i=HS_M_0020&r=566&p=000&pc=AG6-610910&ps=2024&fmt=json" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d" | head -200

# 또는 Tariff API
curl -s "https://api.wto.org/tariff/v1/data?reporter=NGA&product=610910&year=2024&format=json" \
  -H "Ocp-Apim-Subscription-Key: e6b00ecdb5b34e09aabe15e68ab71d1d" | head -200
```

### 2-4. WITS API 대안

WTO가 안 되면 World Bank WITS:
```bash
curl -s "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/566/year/2024/partner/000/product/610910/indicator/MFN-WGHTD-AVRG?format=JSON"
```

### 2-5. 수집 전략

```
1. EU 회원국 27개 → duty-rate-lookup.ts에서 'EU'로 매핑 (코드만, DB 변경 없음)
2. 그 외 162개국 → WTO API로 MFN 세율 수집
3. WTO API 실패한 국가 → WITS API 시도
4. 둘 다 실패 → 리스트로 남겨두고 보고

수집한 데이터 저장:
- macmap_ntlc_rates 테이블에 INSERT (기존 구조 동일: destination_country, hs_code, hs6, mfn_rate, rate_type, source='wto')
- 또는 별도 테이블에 저장 후 duty-rate-lookup.ts에서 폴백 조회

psql 직접 연결 사용:
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
```

### 2-6. 수집 범위 결정

189개국 × 5,371 HS6 코드 = **~100만 조합**. 전부 수집하면 시간이 오래 걸림.

**현실적 접근:**
- **방법 A (최소)**: 189개국 × 상위 100 HS6 코드 = ~19,000건 (주요 교역 상품만)
- **방법 B (중간)**: 189개국 × 상위 500 HS6 코드 = ~95,000건
- **방법 C (전체)**: WTO에서 국가별 전체 MFN 스케줄 벌크 다운로드

**WTO API rate limit 확인 후 결정.** 초당 1건이면 ~100만건은 12일.

**대안: WTO 벌크 다운로드**
- WTO Tariff Data Portal에서 국가별 전체 MFN 관세율표를 CSV로 다운 가능
- https://tao.wto.org/ 에서 벌크 다운로드 가능한지 확인
- 이미 DB에 있는 macmap_min_rates (~105M행)에서 189개국 데이터가 있을 수도 있음

```sql
-- macmap_min_rates에 189개국 데이터가 있는지 먼저 확인!
-- (min_rates는 105M행이라 많은 국가가 있을 수 있음)
SELECT count(DISTINCT reporter) FROM macmap_min_rates;

-- 189개국 중 macmap_min_rates에 있는 나라 수
-- ⚠️ macmap_min_rates의 국가 코드 컬럼명이 reporter인지 destination_country인지 확인 필요
SELECT column_name FROM information_schema.columns WHERE table_name = 'macmap_min_rates' ORDER BY ordinal_position;
```

**macmap_min_rates에 이미 있으면 WTO API 호출 불필요 — DB JOIN으로 해결!**

---

## Phase 3: duty-rate-lookup.ts 업데이트

Phase 1~2 결과를 반영하여 코드 수정.

### 3-1. EU 회원국 매핑 추가

```typescript
const EU_MEMBERS = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
  'PL','PT','RO','SK','SI','ES','SE'
]);

// lookupDutyRate 함수 내:
let lookupCountry = country;
if (EU_MEMBERS.has(country)) {
  lookupCountry = 'EU';  // EU 회원국 → 'EU'로 조회
}
```

### 3-2. 폴백 체인 (ntlc → min → agr)

```typescript
// 1차: macmap_ntlc_rates (MFN)
let result = await queryNtlc(supabase, lookupCountry, hs6);

// 2차: ntlc에 없으면 macmap_min_rates
if (!result) {
  result = await queryMinRates(supabase, lookupCountry, hs6);
}

// 3차: 그래도 없으면 macmap_agr_rates
if (!result) {
  result = await queryAgrRates(supabase, lookupCountry, hs6);
}
```

### 3-3. 단위 변환 확정

Phase 1 결과에 따라 정확한 변환 적용.

---

## Phase 4: 전체 테스트

### 4-1. 기존 5개 + 새 테스트 5개

```typescript
// 기존 5개 (7개국 테스트)
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'US', category: 'clothing', price: 15 }
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'EU', category: 'clothing', price: 15 }
{ product_name: 'Steel Water Bottle', material: 'stainless steel', origin_country: 'CN', destination_country: 'KR', category: 'kitchen', price: 12 }
{ product_name: 'Leather Watch Strap', material: 'leather', origin_country: 'IT', category: 'watches' }
{ product_name: 'Ceramic Tableware Set', material: 'ceramic', origin_country: 'CN', destination_country: 'US', category: 'tableware', price: 200 }

// EU 회원국 테스트 (DE → EU로 매핑되는지)
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'DE', category: 'clothing', price: 15 }

// 53개국 중 비주요국 (BR, TH, MX)
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'BR', category: 'clothing', price: 15 }
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'TH', category: 'clothing', price: 15 }

// macmap에 없었던 국가 (189개국 수집 후 — 예: ZA 남아공)
{ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN', destination_country: 'ZA', category: 'clothing', price: 15 }

// dest 없음 (세율 N/A 확인)
{ product_name: 'Frozen Shrimp', material: 'shrimp', origin_country: 'TH', category: 'seafood', price: 8 }
```

### 4-2. 검증 기준

각 테스트에서:
1. `final_hs_code` — HS6 이상 (7개국은 8~10자리)
2. `country_specific.duty_rate` — 숫자가 나오는지 (null/undefined 아닌지)
3. **duty_rate 값이 실제 세율과 맞는지** — US Cotton T-Shirt = 16.5%, EU = 12% 등
4. EU 회원국(DE) → EU 세율과 동일한지
5. macmap에 없던 국가(ZA) → WTO/WITS 데이터에서 세율 나오는지

### 4-3. npm run build

```bash
npm run build  # 0 errors 확인
```

---

## Phase 5: 최종 커버리지 보고

```sql
-- 수집 후 macmap_ntlc_rates 국가 수
SELECT count(DISTINCT destination_country) FROM macmap_ntlc_rates;

-- countries 240개 중 세율 조회 가능한 국가 수
-- (macmap + EU 매핑 + 신규 수집 포함)
```

### 엑셀 최종 요약:

| 항목 | Before | After |
|------|--------|-------|
| macmap 국가 수 | 53 | ? |
| EU 매핑 (코드) | 0 | 27 |
| 신규 수집 (WTO/WITS) | 0 | ? |
| 총 커버리지 | 53/240 (22%) | ?/240 |
| 단위 변환 검증 | 미확인 | ✅ |
| 10개 상품 테스트 | - | X/10 PASS |

시트 마감: `=== 작업 종료 === | 소요시간 | 빌드 결과 | 테스트 X/10 PASS | 국가 커버리지 X/240 | 수집 행수`

---

## ⚠️ 절대 규칙

1. **Step 0~3 코드 절대 수정 금지**
2. **macmap_min_rates에 이미 189개국 데이터가 있는지 먼저 확인** — 있으면 WTO API 안 써도 됨
3. **API rate limit 준수** — WTO/WITS 호출 시 1초 1건 이하
4. **한 방법이 실패하면 다음 방법 시도. 포기 금지**
5. **단위 변환은 Phase 1 결과 확인 후 수정. 추측으로 코드 쓰지 않는다**
6. **psql 직접 연결**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`
7. **WTO API Key**: `e6b00ecdb5b34e09aabe15e68ab71d1d` (Header: `Ocp-Apim-Subscription-Key`)
