# Claude Code 명령어: 12개 TLC 영역 코드 레벨 심층 검수

> **날짜**: 2026-03-23 KST
> **목표**: 12개 TLC 영역의 실제 코드를 한 줄 한 줄 읽고, 각 영역별 5회 독립 검증 수행
> **방법**: 각 영역마다 (1) 코드 전체 읽기 (2) 계산 로직 수동 추적 (3) 실제 DB 데이터 대조 (4) 테스트 케이스 실행 (5) 엣지케이스 실행
> **원칙**: 코드에 있는 모든 숫자, 모든 조건문, 모든 fallback을 검증한다

---

## ⚠️ 절대 규칙

1. **엑셀 로깅 필수** (CLAUDE.md 절대 규칙 11번) — 시트명 `YYMMDDHHMM`
2. **한 영역씩 순서대로** — 영역 0 완료 후 영역 1로
3. **각 영역 5회 검증**: Pass 1(코드 읽기) → Pass 2(수동 계산) → Pass 3(DB 대조) → Pass 4(API 테스트) → Pass 5(엣지케이스)
4. **발견된 문제는 즉시 기록** — 수정은 5회 검증 전부 끝난 후 일괄
5. **npm run build 매 수정마다**

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### psql:
```bash
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
```

---

## 검수 결과 엑셀: `POTAL_12Area_Code_Audit.xlsx`

각 영역별 시트:
```
[AreaName]_Pass1_CodeRead — 코드 읽기 결과 (함수별 로직, 하드코딩 값, 조건문)
[AreaName]_Pass2_ManualCalc — 수동 계산 대조 (5건 × 수동 계산 vs 코드 결과)
[AreaName]_Pass3_DBCheck — DB 데이터 정합성 (SQL 쿼리 + 결과 샘플)
[AreaName]_Pass4_APITest — 실제 API 호출 테스트 (5건 입출력 전체)
[AreaName]_Pass5_EdgeCase — 엣지케이스 테스트 (5건 경계값/극단)
[AreaName]_Issues — 발견된 문제 목록
```

최종 시트: `AUDIT_SUMMARY` — 12개 영역 종합

---

# ═══════════════════════════════════════════
# 영역 0: Category Upgrade (HS Code Section/Chapter 매핑)
# ═══════════════════════════════════════════

> **검수 대상 파일** (전체 읽기):
> - `app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts`
> - `app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts`

## Pass 1: 코드 전체 읽기

```
1-1. step2-1-section-candidate.ts 전체 읽기 (처음부터 끝까지)
   검수 항목:
   □ MATERIAL_TO_SECTION — 모든 키-값 쌍이 WCO 21 Section과 일치하는가?
     - 각 material이 올바른 Section에 매핑되는가? (예: "cotton" → Section XI(11), "steel" → Section XV(15))
     - 누락된 material이 있는가?
   □ CATEGORY_TO_SECTION — 128개 키워드 각각이 올바른 Section인가?
     - "jewelry" → Section 14 맞는가? (WCO: Section XIV = Ch.71 Natural/cultured pearls, precious stones...)
     - "watch" → Section 18 맞는가? (WCO: Section XVIII = Ch.90-92, BUT watches = Ch.91 ∈ Section XVIII ✅)
     - "toy" → Section 20 맞는가? (WCO: Section XX = Ch.94-96, toys = Ch.95 ∈ Section XX ✅)
   □ CHAPTER_KEYWORDS (WCO 업그레이드) — 97개 Chapter에서 추출된 키워드 정확성
   □ PASSIVE_ACCESSORY_WORDS — stand/holder/mount 등이 electronics Section 스킵하는 로직
   □ jewelry category override 로직
   □ matchCategoryToChapter() 함수 — WCO 매칭 → CHAPTER_TO_SECTION → Section 확정 흐름

1-2. chapter-descriptions.ts 전체 읽기
   검수 항목:
   □ 97개 Chapter 설명이 WCO 공식 텍스트와 일치하는가? (랜덤 10개 대조)
   □ CHAPTER_TO_SECTION 매핑 97개 전부 정확한가?
     - Ch.01~05 → Section I (동물/동물성 생산품)
     - Ch.06~14 → Section II (식물성 생산품)
     - Ch.15 → Section III (유지)
     - Ch.16~24 → Section IV (조제식료품)
     - Ch.25~27 → Section V (광물)
     - Ch.28~38 → Section VI (화학)
     - Ch.39~40 → Section VII (플라스틱/고무)
     - Ch.41~43 → Section VIII (가죽/모피)
     - Ch.44~46 → Section IX (목재)
     - Ch.47~49 → Section X (펄프/종이)
     - Ch.50~63 → Section XI (섬유)
     - Ch.64~67 → Section XII (신발/모자/우산)
     - Ch.68~70 → Section XIII (석재/도자기/유리)
     - Ch.71 → Section XIV (보석/귀금속)
     - Ch.72~83 → Section XV (비금속)
     - Ch.84~85 → Section XVI (기계/전기)
     - Ch.86~89 → Section XVII (차량/항공기/선박)
     - Ch.90~92 → Section XVIII (광학/의료/시계/악기)
     - Ch.93 → Section XIX (무기)
     - Ch.94~96 → Section XX (잡품)
     - Ch.97 → Section XXI (예술품)
```

## Pass 2: 수동 계산 대조 (5건)

```
5개 상품을 손으로 Section/Chapter 결정하고, 코드 결과와 대조:

2-1. "Cotton T-shirt, material=cotton, category=clothing"
   수동: cotton → Section XI, clothing → Ch.61(knitted) or Ch.62(woven)
   코드: MATERIAL_TO_SECTION["cotton"] = ? → Section ? → Chapter ?

2-2. "Stainless steel bolt, material=stainless steel, category=fastener"
   수동: stainless steel → Section XV(15), fastener → Ch.73(steel articles)
   코드: MATERIAL_TO_SECTION["stainless steel"] = ? → Section ? → Chapter ?

2-3. "Gold necklace, material=gold, category=jewelry"
   수동: gold → Section XIV(14), jewelry → Ch.71
   코드: jewelry override → Section 14 → Chapter 71?

2-4. "Rubber tire, material=rubber, category=automotive parts"
   수동: rubber → Section VII(7), automotive → Ch.40(rubber articles)
   코드: MATERIAL_TO_SECTION["rubber"] = ? → Section ?

2-5. "Wooden furniture, material=wood, category=furniture"
   수동: wood → Section IX(9), furniture → Ch.94 ∈ Section XX(20)
   코드: category "furniture" → Section 20이 material "wood" → Section 9보다 우선하는가?
```

## Pass 3: DB 대조

```
3-1. product_hs_mappings에서 랜덤 10건 조회 → Section/Chapter 코드로 역추적 → 매핑 일치 확인
3-2. hs_classification_vectors에서 랜덤 5건 → 벡터 검색 결과와 코드 결과 비교
```

## Pass 4: 실제 파이프라인 테스트 (5건)

```
pipeline-v3.ts를 직접 호출하여 5건 분류 실행:
4-1. Cotton T-shirt (9-field 완벽) → HS6 정확한가?
4-2. Laptop computer (9-field 완벽) → HS6 정확한가?
4-3. Gold ring (9-field 완벽) → HS6 정확한가?
4-4. Steel pipe (9-field 완벽) → HS6 정확한가?
4-5. Yoga mat (9-field 완벽) → HS6 정확한가?
```

## Pass 5: 엣지케이스 (5건)

```
5-1. material과 category가 다른 Section인 경우: "leather watch strap" (leather→S8, watch→S18)
5-2. PASSIVE_ACCESSORY: "phone stand" (electronics 아닌 잡품)
5-3. 동일 키워드 다중 Section: "glass bottle" (glass→S13, bottle→S15 or S20)
5-4. WCO 설명에 없는 신소재: "carbon fiber drone"
5-5. 복합소재: "cotton-polyester blend t-shirt"
```

---

# ═══════════════════════════════════════════
# 영역 1: Duty Rate (관세율)
# ═══════════════════════════════════════════

> **검수 대상 파일** (전체 읽기):
> - `app/lib/cost-engine/macmap-lookup.ts` (334줄) — ⭐ 핵심
> - `app/lib/cost-engine/section301-lookup.ts` (177줄)
> - `app/lib/cost-engine/trade-remedy-lookup.ts` (160줄)
> - `app/lib/cost-engine/db/duty-rates-db.ts`
> - `app/lib/cost-engine/hs-code/duty-rates.ts` (1,141줄) — 하드코딩 fallback
> - `app/lib/cost-engine/db/fta-db.ts`
> - `app/lib/cost-engine/hs-code/fta.ts` (935줄) — FTA 하드코딩

## Pass 1: 코드 전체 읽기

```
1-1. macmap-lookup.ts 전체 (334줄)
   □ lookupMacMapDutyRate() 함수:
     - 4단계 fallback 순서: AGR → MIN → NTLC → MFN 하드코딩
     - 각 단계 SQL 쿼리 정확성 (테이블명, 컬럼명, WHERE 조건)
     - EU_MEMBERS Set: 27개국 전부 있는가? (AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE)
     - mapCountryForDb(): EU 매핑, US 매핑 정확한가?
     - 에러 핸들링: DB 타임아웃, null 결과, 빈 배열
     - 신뢰도 점수: AGR=1.0, MIN=0.9, NTLC=0.8, MFN=0.7 — 정확한가?
   □ lookupAllDutyRates() 함수:
     - TariffOptimization 객체 구조
     - savings 계산 (mfnRate - bestRate) × value

1-2. section301-lookup.ts 전체 (177줄)
   □ Section 301 List 1~4A:
     - List 1 HS Chapter 목록 정확한가? (Ch.84,85,88,90 = 산업기계/전자/항공/정밀기기)
     - List 2 HS Chapter 목록? (Ch.28,29,38,39,72,73 = 화학/플라스틱/철강)
     - List 3 HS Chapter 목록? (Ch.94,61-64,42,03-08 = 소비재 대거)
     - List 4A HS Chapter 목록? (Ch.95,65-67,96 = 완구/모자/잡화)
     - 세율: L1=25%, L2=25%, L3=25%, L4A=7.5% — 2026년 현재 유효한가?
   □ Section 232:
     - Steel Chapters: 72-73, 세율 25%
     - Aluminum Chapter: 76, 세율 10%
     - Exempt countries: AU,AR,BR,KR — 현재도 면제인가?
   □ 중복 적용 방지: 301+232 동시 해당 시 어떻게 처리?

1-3. trade-remedy-lookup.ts 전체 (160줄)
   □ HS hierarchical matching: 6자리 → 4자리 → 2자리 fallback 정확한가?
   □ firm-specific matching: 회사명 매칭 로직 (exact → contains → "All Others")
   □ AD + CVD 합산 로직: 각각 조회 → 합산인가, 아니면 동시 조회?
   □ safeguard_exemptions 테이블 조회 조건

1-4. duty-rates.ts 하드코딩 (1,141줄)
   □ 랜덤 10개국 × 랜덤 10개 HS Chapter — DB(macmap_ntlc_rates)와 일치하는가?
   □ 하드코딩 업데이트 날짜 확인 (언제 기준 데이터인가?)

1-5. fta.ts 하드코딩 (935줄)
   □ 63개 FTA 목록 정확한가? (주요 10개 검증: USMCA, KORUS, RCEP, CPTPP, EU-UK TCA, EU-KR, AANZFTA, CAFTA-DR, EFTA, EU-JP EPA)
   □ 각 FTA의 참여국 목록 정확한가?
   □ preferentialMultiplier 값이 실제 FTA 양허표와 일치하는가?
```

## Pass 2: 수동 계산 대조 (5건)

```
각 건마다 수동으로 세율 조회 후 코드 결과와 대조:

2-1. Cotton T-shirt, HS:610910, CN→US
   수동: USITC HTS 6109.10 → General Rate 16.5% (또는 32%)
   코드 결과: macmap_ntlc_rates 조회 → ?%

2-2. Laptop, HS:847130, CN→DE(EU)
   수동: EU TARIC 8471.30 → 0% (ITA)
   코드 결과: macmap_ntlc_rates(reporter='EU') → ?%

2-3. Wine, HS:220421, FR→KR
   수동: KR FTA with EU → 관세 인하 (KORUS 아님, EU-KR FTA)
   코드 결과: macmap_agr_rates 또는 macmap_min_rates → ?%

2-4. Steel, HS:720917, CN→US
   수동: USITC HTS 7209.17 → MFN 0% + Section 301 25% + Section 232 25% + AD/CVD
   코드 결과: macmap + section301 + section232 + trade-remedy → ?%

2-5. Electronics, HS:851762, KR→US
   수동: KORUS FTA → 0% or MFN 0% (ITA)
   코드 결과: macmap_min_rates(KR→US) → ?%
```

## Pass 3: DB 데이터 대조

```sql
-- 3-1. macmap_ntlc_rates 행 수 + 국가 수
SELECT reporter, COUNT(*) FROM macmap_ntlc_rates GROUP BY reporter ORDER BY COUNT(*) DESC LIMIT 20;

-- 3-2. macmap_agr_rates 행 수 확인
SELECT COUNT(*) FROM macmap_agr_rates;

-- 3-3. macmap_min_rates 행 수 확인
SELECT COUNT(*) FROM macmap_min_rates;

-- 3-4. 특정 HS Code(610910) 세율 확인 — CN→US
SELECT * FROM macmap_ntlc_rates WHERE reporter='US' AND hs_code LIKE '6109%' LIMIT 5;
SELECT * FROM macmap_min_rates WHERE reporter='US' AND partner='CN' AND hs_code LIKE '6109%' LIMIT 5;
SELECT * FROM macmap_agr_rates WHERE reporter='US' AND partner='CN' AND hs_code LIKE '6109%' LIMIT 5;

-- 3-5. EU 데이터 확인 — reporter='EU'로 저장되어 있는가?
SELECT DISTINCT reporter FROM macmap_ntlc_rates WHERE reporter IN ('EU','DE','FR','IT') LIMIT 10;

-- 3-6. trade_remedy_cases 활성 건수
SELECT measure_type, COUNT(*) FROM trade_remedy_cases WHERE status='active' GROUP BY measure_type;

-- 3-7. trade_remedy_duties 샘플
SELECT * FROM trade_remedy_duties WHERE hs_code LIKE '7209%' LIMIT 5;
```

## Pass 4: API 테스트 (5건)

```
TypeScript로 직접 함수 호출하여 결과 확인:

const result1 = await lookupMacMapDutyRate('610910', 'CN', 'US');  // Cotton T-shirt
const result2 = await lookupMacMapDutyRate('847130', 'CN', 'DE');  // Laptop→EU
const result3 = await lookupMacMapDutyRate('220421', 'FR', 'KR');  // Wine FTA
const result4 = await lookupUSAdditionalTariffs('720917', 'CN');   // Steel 301+232
const result5 = await lookupTradeRemedies('720917', 'CN', 'US');   // Steel AD/CVD

각 결과의 모든 필드 기록: rate, source, confidence, matchType 등
```

## Pass 5: 엣지케이스 (5건)

```
5-1. 존재하지 않는 HS Code: '999999', CN→US → 에러 핸들링 확인
5-2. DB 타임아웃 시뮬레이션 → 하드코딩 fallback 동작 확인
5-3. EU 회원국 직접 입력: HS:610910, CN→'DE' → 'EU'로 매핑되는가?
5-4. Section 301 + 232 동시 해당: Steel(Ch.72) from CN → 둘 다 적용?
5-5. FTA 없는 경로: CN→US → AGR 없음 → MIN? → NTLC 확인
```

---

# ═══════════════════════════════════════════
# 영역 2: VAT/GST (부가가치세)
# ═══════════════════════════════════════════

> **검수 대상 파일** (전체 읽기):
> - `app/lib/cost-engine/GlobalCostEngine.ts` (1,734줄) — VAT 계산 부분만
> - `app/lib/cost-engine/CostEngine.ts` (592줄) — US Sales Tax, 특수국가
> - `app/lib/cost-engine/eu-vat-rates.ts` (234줄)
> - `app/lib/cost-engine/ioss-oss.ts` (313줄)
> - `app/lib/tax/ioss-engine.ts`

## Pass 1: 코드 전체 읽기

```
1-1. GlobalCostEngine.ts에서 VAT 관련 코드만 추출:
   □ vatRate 조회 경로: DB(vat_gst_rates) → 하드코딩(country-data.ts) fallback
   □ VAT 과세표준 공식: baseForVat = CIF + importDuty + customsFees인가?
   □ EU 경감세율 호출: getEuReducedVatRate(country, hsCode) 호출 위치와 조건
   □ IOSS 적용 조건: value ≤ €150 AND ioss=true → VAT 0?
   □ GCC 국가 처리: SA,AE,BH,OM,KW,QA → VAT 5%
   □ 면세 판정: de minimis 이하일 때 VAT도 면제인지?

1-2. CostEngine.ts에서 세금 관련 코드:
   □ US STATE_TAX_RATES — 50개 주 세율 정확성
     - CA 7.25%, NY 4%, TX 6.25%, FL 6%, OR 0%, NH 0%, MT 0%, DE 0%, AK 0%
     - 실제 2026년 세율과 맞는가?
   □ CANADA_PROVINCE_TAX_RATES — HST vs GST+PST
     - ON 13%, BC 5%+7%, QC 5%+9.975%, AB 5%, SK 5%+6%
   □ Brazil ICMS 주별 세율 (SP 18%, RJ 20%, MG 18%, RS 17%)
   □ China CBEC 세율 (cross-border e-commerce)
   □ India IGST (5%/12%/18%/28%)
   □ Mexico IVA 16%

1-3. eu-vat-rates.ts 전체 (234줄):
   □ 12개국 각각의 경감세율이 정확한가?
     - DE: 식품 7%, 도서 7%, 표준 19% — 맞는가?
     - FR: 식품 5.5%, 의약품 2.1%, 도서 5.5%, 표준 20%
     - IT: 식품 4%, 표준 22%
     - ES: 식품 4%/10%, 표준 21%
     - 각국 2026년 현재 세율 확인
   □ HS Chapter → 세율 매핑 정확성
     - Ch.01-21 (식품) → 경감 맞는가?
     - Ch.30 (의약품) → 0% 또는 경감?
     - Ch.49 (도서) → 경감?
   □ 누락된 EU 15개국은 어떻게 처리? (표준세율만 적용?)

1-4. ioss-oss.ts 전체 (313줄):
   □ IOSS 조건: value ≤ €150, EU 외부 → EU 내부, 셀러 IOSS 등록
   □ OSS 조건: EU 내부 → EU 내부 (distance selling), €10K threshold
   □ 27개국 VAT율 테이블: 각국 표준세율 정확한가?
```

## Pass 2: 수동 계산 대조 (5건)

```
2-1. Electronics $500, CN→DE, HS:852872
   수동: CIF=$500+shipping, Duty=0%(ITA), VAT base=$500+0+fees, VAT=19%
   코드 결과: ?

2-2. Food $100, CN→FR, HS:190590
   수동: Duty=?%, VAT base=CIF+duty, VAT=5.5%(경감) or 20%(표준)?
   코드 결과: ?

2-3. Books $30, US→IT, HS:490199
   수동: Duty=0%, VAT=4%(super-reduced)
   코드 결과: ?

2-4. Goods $100, CN→US(TX), no HS
   수동: No federal VAT, State tax TX=6.25%
   코드 결과: ?

2-5. IOSS parcel €80, CN→NL
   수동: ≤€150 + IOSS → import VAT 0%, VAT collected at sale
   코드 결과: ?
```

## Pass 3: DB 데이터 대조

```sql
-- 3-1. vat_gst_rates 전체 행수 + 샘플
SELECT COUNT(*) FROM vat_gst_rates;
SELECT country_code, country_name, vat_rate FROM vat_gst_rates WHERE country_code IN ('DE','FR','IT','GB','US','JP','KR','AU','CA','BR','IN','CN') ORDER BY country_code;

-- 3-2. 240개국 전부 있는지
SELECT COUNT(DISTINCT country_code) FROM vat_gst_rates;

-- 3-3. 세율 범위 확인 (이상치)
SELECT country_code, vat_rate FROM vat_gst_rates WHERE vat_rate > 30 OR vat_rate < 0;

-- 3-4. NULL 세율
SELECT country_code FROM vat_gst_rates WHERE vat_rate IS NULL;
```

## Pass 4: API 테스트 (5건)

```
GlobalCostEngine.calculateGlobalLandedCostAsync() 호출:
- {price:500, origin:'CN', destinationCountry:'DE', hsCode:'852872'} → VAT 금액 확인
- {price:100, origin:'CN', destinationCountry:'FR', hsCode:'190590'} → 경감세율 확인
- {price:30, origin:'US', destinationCountry:'IT', hsCode:'490199'} → 4% 확인
- {price:100, origin:'CN', destinationCountry:'US', hsCode:'392690', state:'TX'} → 6.25%
- {price:80, origin:'CN', destinationCountry:'NL', hsCode:'950300', ioss:true} → VAT 0
```

## Pass 5: 엣지케이스 (5건)

```
5-1. VAT 0% 국가: CN→HK (홍콩 0%) → salesTax=0 확인
5-2. 최고 VAT 국가: CN→HU (헝가리 27%) → 정확한 금액?
5-3. Brazil 복합세금: CN→BR(SP) → ICMS 18% + IPI + PIS/COFINS 합산
5-4. India GST 슬래브: DE→IN, HS:330300 (향수) → IGST 28%?
5-5. Canada 주 미지정: CN→CA → GST 5% only? or HST?
```

---

# ═══════════════════════════════════════════
# 영역 3: De Minimis (면세 기준)
# ═══════════════════════════════════════════

> **검수 대상 파일**:
> - `app/lib/cost-engine/GlobalCostEngine.ts` — de minimis 판정 위치
> - `app/lib/cost-engine/CostEngine.ts` — US $800/$0 로직
> - `app/lib/cost-engine/country-data.ts` (1,605줄) — 하드코딩 국가별 기준

## Pass 1: 코드 전체 읽기

```
1-1. de minimis 판정 코드 위치 찾기 (GlobalCostEngine.ts + CostEngine.ts):
   □ isDutyFree 판정 조건: value < de_minimis_threshold?
   □ duty와 VAT 각각 별도 de minimis가 있는가?
   □ CIF 기준인가 FOB 기준인가?
   □ 환율 변환이 필요한 경우 (USD→현지통화) 어디서 하는가?

1-2. CostEngine.ts US 특수 처리:
   □ $800 de minimis 코드 — 2025-08 이후 CN/HK $0 반영 여부
   □ CHINA_IMPORT_DUTY_RATE = 20% — 정확한 세율인가?
   □ Section 321 면세 로직

1-3. country-data.ts 하드코딩:
   □ 240개국 de minimis 값 존재 확인
   □ 랜덤 10개국 대조:
     - US: $800 (but $0 for CN)
     - EU: €150 (duty only, VAT always applies since 2021)
     - UK: £135
     - AU: A$1,000
     - CA: C$20
     - JP: ¥10,000
     - KR: $150
     - CN: ¥50
     - BR: $0 (no de minimis)
     - IN: INR 5,000
```

## Pass 2~5: 동일 패턴 (수동 계산 5건, DB 대조, API 5건, 엣지케이스 5건)

```
수동 계산:
- $790 CN→US (under $800 but CN exclusion?)
- €140 CN→DE (under €150 → duty free, VAT still applies)
- A$999 CN→AU (under A$1,000 → duty free, GST still applies?)
- C$15 CN→CA (under C$20 → duty+tax free)
- $0.01 CN→BR (Brazil $0 de minimis → 항상 과세)

DB:
SELECT country_code, de_minimis_value, de_minimis_currency FROM de_minimis_thresholds WHERE country_code IN ('US','DE','GB','AU','CA','JP','KR','CN','BR','IN');
```

---

# ═══════════════════════════════════════════
# 영역 4: Special Tax (특별소비세)
# ═══════════════════════════════════════════

> **검수 대상 파일**:
> - `app/lib/cost-engine/CostEngine.ts` — Brazil/India/China/Mexico 특수 세금
> - `app/lib/cost-engine/GlobalCostEngine.ts` — 12개국 분기 처리

## Pass 1: 코드 전체 읽기

```
1-1. CostEngine.ts에서 특수세금 관련 코드 전부:
   □ Brazil 계산 공식:
     - II (import duty) → IPI (10%?) → PIS (2.1%) → COFINS (9.65%) → ICMS (주별)
     - 이 순서가 맞는가? (cascading: 각 세금이 이전 세금 포함 기준?)
     - ICMS 주별 세율 하드코딩 정확성 (SP 18%, RJ 20% 등)
   □ India 계산 공식:
     - BCD (Basic Customs Duty) → SWS (10% of BCD) → IGST (5/12/18/28%)
     - Social Welfare Surcharge 10% 맞는가?
     - IGST 슬래브 매핑: HS → IGST율 (어떻게 결정?)
   □ Mexico 계산:
     - IVA 16% (표준) — 맞는가?
     - IEPS (특별소비세): 주류 53%? 에너지음료? 설탕음료?
     - DTA (0.8% customs processing)
   □ China 계산:
     - Consumption Tax: 화장품 15%, 보석 10%, 자동차 3-40%, 주류 20%
     - CBEC (Cross-border e-commerce): 소포 기준, 연간 한도
   □ 8개국 추가 (Turkey, Korea, Japan, Thailand, Philippines, Indonesia, Egypt, Nigeria) — 코드에 있는가?
```

## Pass 2~5: 동일 패턴

---

# ═══════════════════════════════════════════
# 영역 5: Customs Fees (통관 수수료)
# ═══════════════════════════════════════════

> **검수 대상 파일**:
> - `app/lib/cost-engine/CostEngine.ts` — MPF, HMF
> - `app/lib/cost-engine/country-data.ts` — 국가별 customs_fees
> - `app/lib/cost-engine/GlobalCostEngine.ts`

## Pass 1: 코드 전체 읽기

```
1-1. US MPF (Merchandise Processing Fee):
   □ 세율: 0.3464% — 맞는가?
   □ 최소: $2.69 (informal $2.69, formal $31.67) — 코드에서 어떤 값 사용?
   □ 최대: $538.40 — cap 적용 코드 있는가?
   □ HMF (Harbor Maintenance Fee): 0.125% — 맞는가?

1-2. country-data.ts customs_fees:
   □ 240개국 전부 값이 있는가?
   □ 주요 10개국 수수료 정확성 대조
```

## Pass 2~5: 동일 패턴

---

# ═══════════════════════════════════════════
# 영역 6: AD/CVD (반덤핑/상계관세)
# ═══════════════════════════════════════════

> **검수 대상 파일**: `trade-remedy-lookup.ts` (160줄)

## Pass 1: 코드 전체 읽기

```
□ lookupTradeRemedies() 함수:
  - 입력: hs_code, origin, destination
  - DB 쿼리: trade_remedy_cases JOIN trade_remedy_duties ON case_id
  - HS hierarchical matching: 6→4→2 fallback
  - firm-specific: company_name 매칭 → "All Others" fallback
  - AD + CVD 합산 로직
  - safeguard_exemptions 체크
□ 에러 핸들링: DB 실패 시 빈 결과 반환?
```

## Pass 3: DB 대조

```sql
SELECT measure_type, COUNT(*) FROM trade_remedy_cases GROUP BY measure_type;
SELECT tc.measure_type, tc.imposing_country, td.duty_rate
FROM trade_remedy_cases tc JOIN trade_remedy_duties td ON tc.id = td.case_id
WHERE tc.status='active' AND td.hs_code LIKE '7209%' LIMIT 10;
```

---

# ═══════════════════════════════════════════
# 영역 7: Rules of Origin (원산지 규정)
# ═══════════════════════════════════════════

> **검수 대상 파일**:
> - `app/lib/trade/roo-engine.ts` (109줄)
> - `app/lib/cost-engine/db/fta-db.ts`
> - `app/lib/cost-engine/hs-code/fta.ts` (935줄)

## Pass 1: 코드 전체 읽기

```
1-1. roo-engine.ts:
   □ evaluateRoO() 함수:
     - WO 판정: agriculture/mineral (Ch.01-10, 25-27) → 정확한 Chapter 범위?
     - RVC 계산: (totalValue - nonOriginMaterials) / totalValue × 100
     - RVC 기준값: USMCA 75%, KORUS 35%, CPTPP 45%, RCEP 40% — 정확?
     - CTH/CC/CTSH 판정 로직
   □ savingsIfEligible 계산

1-2. fta-db.ts:
   □ findApplicableFtaFromDb(): macmap_trade_agreements 조회 조건
   □ preferentialMultiplier 의미: MFN × multiplier = FTA rate?
   □ chapter_exclusions 처리

1-3. fta.ts 하드코딩 (935줄):
   □ 63개 FTA 이름 + 참여국 정확성
   □ 랜덤 5개 FTA 상세 검증
```

---

# ═══════════════════════════════════════════
# 영역 8: Currency (환율)
# ═══════════════════════════════════════════

> **검수 대상 파일**: `exchange-rate-service.ts` (338줄)

## Pass 1: 코드 전체 읽기

```
□ getExchangeRates(): ECB API URL + 파싱 로직
□ 캐시 TTL: 1시간? 맞는가?
□ convertCurrency(): amount × rate 공식
□ usdToLocal() / localToUsd(): 방향 정확한가?
□ 소수점 처리: 몇 자리까지?
□ ECB API 실패 시 fallback: 있는가?
□ ECB는 EUR 기준 — USD 변환 시 EUR/USD로 나누는 로직 정확한가?
```

## Pass 4: API 테스트

```
실시간 ECB 환율 조회:
- USD→EUR: 코드 결과 vs ECB 공식 사이트 비교
- USD→JPY: 코드 결과 vs ECB
- USD→KRW: 코드 결과 vs ECB
- USD→GBP: 코드 결과 vs ECB
- USD→CNY: 코드 결과 vs ECB
```

---

# ═══════════════════════════════════════════
# 영역 9: Insurance/Shipping (보험/운송)
# ═══════════════════════════════════════════

> **검수 대상 파일**:
> - `app/lib/cost-engine/insurance-calculator.ts` (62줄)
> - `app/lib/shipping/shipping-calculator.ts` (120줄)

## Pass 1: 코드 전체 읽기

```
1-1. insurance-calculator.ts:
   □ 카테고리별 base rate: electronics 1.5%, textiles 0.8%, hazmat 3%, fragile 2%, general 1%, luxury 2.5%, food 1.2%
   □ surcharge 조건: sea freight, high-risk route (NG,SO,YE 등), value tier
   □ mandatory insurance 국가: BR,AR,EG,NG,IN — 맞는가?
   □ 최종 보험료 = CIF × rate

1-2. shipping-calculator.ts:
   □ 지역 분류: NA, EU, ASIA — 기준은?
   □ 티어별 운송비: express/standard/economy per kg
   □ dimensional weight: L×W×H÷5000 공식
   □ fuel surcharge 15% — 현재 유효한가?
   □ remote area surcharge: IS,GL,FO,FK,GU,AS — 맞는가?
   □ overweight (>30kg) 처리
```

---

# ═══════════════════════════════════════════
# 영역 10: Export Controls (수출 통제)
# ═══════════════════════════════════════════

> **검수 대상 파일**: `app/lib/compliance/export-controls.ts` (88줄)

## Pass 1: 코드 전체 읽기

```
□ classifyECCN() 함수:
  - HS → ECCN 카테고리 매핑:
    - Category 0 (Nuclear): Ch.87,93 — 87은 차량인데 Nuclear? 확인 필요
    - Category 1 (Materials): Ch.28,29,38 — 화학 맞음
    - Category 2 (Processing): Ch.84 — 기계 맞음
    - Category 3 (Electronics): Ch.85 — 전자 맞음
    - Category 6 (Sensors): Ch.90 — 광학/의료 맞음
    - Category 9 (Aerospace): Ch.88 — 항공 맞음
  - ⚠️ Ch.87 = 차량/자동차인데 Category 0(Nuclear)에 있는 건 의심. Nuclear = Ch.84(원자로)?
□ controlledDestinations: CU,IR,KP,SY,RU,BY — 2026년 현재 맞는가? (MM 추가?)
□ checkLicenseRequirement(): license exception 로직
□ EAR99 판정: 통제 대상 아닌 모든 상품 → EAR99
```

---

# ═══════════════════════════════════════════
# 영역 11: Sanctions (제재 스크리닝)
# ═══════════════════════════════════════════

> **검수 대상 파일**:
> - `app/lib/compliance/fuzzy-screening.ts` (126줄)
> - `app/lib/cost-engine/screening/screen.ts` (216줄)
> - `app/lib/cost-engine/screening/db-screen.ts` (307줄)

## Pass 1: 코드 전체 읽기

```
1-1. fuzzy-screening.ts:
   □ Levenshtein distance 구현 정확성
   □ Soundex 알고리즘 정확성
   □ Token-based matching 로직
   □ threshold: 0.85 기본값 — 적절한가?
   □ risk score 분류: low/medium/high/critical 경계값

1-2. screen.ts (in-memory):
   □ 21,301건 하드코딩? or DB 로드?
   □ 검색 알고리즘: 순차 비교? 인덱싱?

1-3. db-screen.ts:
   □ sanctions_entries 쿼리 조건
   □ sanctions_aliases JOIN 조건
   □ 배치 스크리닝 성능 (1000건 배치 → 몇 초?)
```

## Pass 3: DB 대조

```sql
SELECT COUNT(*) FROM sanctions_entries;
SELECT COUNT(*) FROM sanctions_aliases;
SELECT COUNT(*) FROM sanctions_addresses;
SELECT COUNT(*) FROM sanctions_ids;

-- 샘플 확인
SELECT name, source, entry_type FROM sanctions_entries LIMIT 10;

-- 특정 엔티티 검색
SELECT * FROM sanctions_entries WHERE name ILIKE '%huawei%';
```

## Pass 4: 스크리닝 테스트

```
- "Huawei Technologies" → critical match 기대
- "Samsung Electronics" → no match 기대 (제재 대상 아님)
- "Huawey Technologees" (오타) → fuzzy match 기대
- "Kim Jong Un" → OFAC SDN match 기대
- "John Smith" → false positive 최소화 확인
```

---

# ═══════════════════════════════════════════
# 전체 검수 완료 후 결과 정리
# ═══════════════════════════════════════════

## POTAL_12Area_Code_Audit.xlsx 최종 구조

```
12개 영역 × 6시트 = 72시트:
Area0_Pass1_CodeRead ~ Area0_Pass5_EdgeCase + Area0_Issues
Area1_Pass1_CodeRead ~ Area1_Pass5_EdgeCase + Area1_Issues
...
Area11_Pass1_CodeRead ~ Area11_Pass5_EdgeCase + Area11_Issues
AUDIT_SUMMARY — 12개 영역 종합
```

## AUDIT_SUMMARY 시트 구조

```
| Area | 파일 수 | 코드 줄 | Pass1 | Pass2 | Pass3 | Pass4 | Pass5 | Issues | Critical |
|------|---------|---------|-------|-------|-------|-------|-------|--------|----------|
| 0 Category | 2 | ~500 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | N건 | N건 |
| 1 Duty Rate | 7 | ~3,300 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | N건 | N건 |
| 2 VAT/GST | 5 | ~2,900 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | N건 | N건 |
| ... |
| 11 Sanctions | 3 | ~650 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | N건 | N건 |
| TOTAL | ~30 | ~10K | | | | | | N건 | N건 |
```

## Issue 분류

```
CRITICAL — 계산 결과가 틀리는 것 (즉시 수정)
HIGH — 엣지케이스에서 오동작 (수정 필요)
MEDIUM — 하드코딩 데이터 outdated (업데이트 필요)
LOW — 코드 품질/구조 (나중에)
INFO — 참고 사항 (수정 불필요)
```

## 수정 후 검증

```
모든 수정 완료 후:
1. npm run build — TypeScript 에러 0개
2. 기존 55건 Duty Rate regression — 55/55 PASS 유지
3. 수정된 영역 재검증 — Pass 4 전체 재실행
```
