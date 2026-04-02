# Claude Code 명령어: 나머지 35건 이슈 완전 수정 (터미널 1)

> **날짜**: 2026-03-23 KST
> **목표**: P3 3건 + MEDIUM 20건 + LOW 3건 + EU VAT 15국 = 35건 전부 수정. 하나도 남기지 않는다.
> **원칙**: (1) 파일별로 묶어서 수정 (2) 각 수정마다 npm run build (3) 수정 전/후 코드 전부 엑셀 기록 (4) 모든 수치는 공식 출처 기반
> **⚠️ 중요**: 각 이슈의 정확한 수치를 웹에서 확인 후 적용. 추정치 사용 금지.

---

## ⚠️ 절대 규칙

1. **엑셀 로깅 필수** (CLAUDE.md 절대 규칙 11번) — 시트명 `YYMMDDHHMM`
2. **파일별로 묶어서 수정** — 같은 파일 여러 번 안 건드림
3. **수정 후 npm run build** — 빌드 깨지면 즉시 롤백
4. **수치 출처 명시** — 모든 세율/금액에 출처 URL 주석으로 기록
5. **v3 파이프라인(Area 0) 수정 금지**

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

## 결과 엑셀: `POTAL_35Issue_Complete_Fix.xlsx`
```
시트 1: FIX_SUMMARY — 35건 전체 수정 상태
시트 2: FILE_CHANGES — 파일별 변경 전/후 전체 코드
시트 3: REGRESSION_TEST — 회귀 테스트 결과
시트 4: BUILD_LOG — npm run build 전체 로그
시트 5: SOURCE_REFERENCES — 모든 수치의 공식 출처 URL
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 1: CostEngine.ts — 8건 수정
# (이슈 #11 Brazil IPI, #12 India IGST, #13 Mexico IEPS,
#  #14 MPF CN-only, #15 MPF 불일치, #33 China CBEC USD, #34 China CT)
# ═══════════════════════════════════════════════════════════════

## 수정 1-A: Brazil IPI Chapter별 세율 (이슈 #11, P3)

**현재 코드** (CostEngine.ts ~라인 125):
```typescript
const BRAZIL_IPI_DEFAULT = 0.10; // 일괄 10% — 이것이 문제
```

**수정 코드**:
```typescript
// Brazil IPI rates by NCM chapter (simplified from TIPI table)
// Source: Receita Federal do Brasil TIPI (Tabela de Incidência do IPI)
// URL: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/tipi
const BRAZIL_IPI_BY_CHAPTER: Record<string, number> = {
  // Chapter: Rate — 0% (essential/exempt)
  '01': 0, '02': 0, '03': 0, '04': 0, '05': 0,   // Live animals, meat, fish, dairy
  '06': 0, '07': 0, '08': 0, '09': 0, '10': 0,   // Plants, vegetables, fruits, cereals
  '11': 0, '12': 0, '13': 0, '14': 0, '15': 0,   // Flour, oilseeds, gums, fats
  '16': 0, '17': 0, '18': 0, '19': 0, '20': 0,   // Preparations, sugar, cocoa, bakery, preserved
  '21': 0, '23': 0,                                 // Extracts, animal feed
  '25': 0, '26': 0, '27': 0,                       // Salt, ores, mineral fuels
  '30': 0,                                           // Pharmaceuticals (exempt)
  '31': 0,                                           // Fertilizers
  '41': 0, '43': 0,                                 // Raw hides, furskins
  '44': 0, '45': 0, '46': 0, '47': 0, '48': 0, '49': 0, // Wood, cork, pulp, paper, printed
  '50': 0, '51': 0, '52': 0, '53': 0,             // Silk, wool, cotton, other fibers
  '54': 0, '55': 0, '56': 0, '57': 0, '58': 0, '59': 0, '60': 0, // Synthetic, special fabrics
  '61': 0, '62': 0, '63': 0,                       // Apparel (knit, woven, other textile)
  // Chapter: Rate — 5%
  '34': 0.05, '35': 0.05,                          // Soaps, albuminoids
  '39': 0.05,                                        // Plastics (avg 5%, range 0-20%)
  '40': 0.05,                                        // Rubber
  '64': 0.05,                                        // Footwear (range 0-10%)
  '68': 0.05, '69': 0.05, '70': 0.05,             // Stone, ceramics, glass
  '73': 0.05, '74': 0.05, '76': 0.05,             // Iron/steel articles, copper, aluminum articles
  '82': 0.05, '83': 0.05,                          // Tools, misc metal
  '94': 0.05,                                        // Furniture
  '96': 0.05,                                        // Miscellaneous manufactured
  // Chapter: Rate — 10%
  '28': 0.10, '29': 0.10,                          // Inorganic/organic chemicals
  '32': 0.10, '36': 0.10, '37': 0.10, '38': 0.10, // Tanning, explosives, photo, misc chemical
  '65': 0.10, '66': 0.10, '67': 0.10,             // Headgear, umbrellas, feathers
  '71': 0.12,                                        // Jewelry 12%
  '84': 0.10,                                        // Machinery (avg 10%, range 0-20%)
  '86': 0.10,                                        // Railway
  '90': 0.10, '91': 0.10, '92': 0.10,             // Optical, clocks, musical
  '97': 0.10,                                        // Works of art
  // Chapter: Rate — 15~20%
  '33': 0.22,                                        // Perfumes/cosmetics 22%
  '85': 0.15,                                        // Electronics (avg 15%, range 0-20%)
  '87': 0.25,                                        // Vehicles — passenger cars 25% (range 7-25%)
  '89': 0.10,                                        // Ships
  '93': 0.15,                                        // Arms 15%
  '95': 0.20,                                        // Toys 20%
  // Chapter: Rate — Extreme
  '22': 0.20,                                        // Beverages (beer 6%, wine 10%, spirits 20%)
  '24': 3.00,                                        // Tobacco products 300%
};

function getBrazilIpiRate(hsCode: string): number {
  const ch = hsCode.substring(0, 2);
  return BRAZIL_IPI_BY_CHAPTER[ch] ?? 0.10; // fallback 10% if unknown chapter
}
```

**적용**: `calculateBrazilImportTaxes()` 함수에서:
```typescript
// 변경 전:
const ipiRate = BRAZIL_IPI_DEFAULT; // 0.10

// 변경 후:
const ipiRate = getBrazilIpiRate(hsCode);
// ⚠️ hsCode 파라미터를 함수 시그니처에 추가해야 할 수 있음
```

### 검증:
```
CN→BR, HS 6109 (티셔츠) → IPI 0% (의류 면세) ✅
CN→BR, HS 8517 (스마트폰) → IPI 15% (전자) ✅
CN→BR, HS 8703 (승용차) → IPI 25% ✅
CN→BR, HS 2402 (시가) → IPI 300% ✅
CN→BR, HS 3304 (화장품) → IPI 22% ✅
CN→BR, HS 9503 (장난감) → IPI 20% ✅
CN→BR, HS 0201 (쇠고기) → IPI 0% ✅
```

---

## 수정 1-B: India IGST 97 Chapter 전체 매핑 (이슈 #12, P3)

**현재 코드** (CostEngine.ts ~라인 200-220, 약 47개 Chapter만 매핑):
```typescript
// 현재 부분적 매핑만 있음. 아래로 전체 교체
```

**수정 코드**:
```typescript
// India IGST rates by HS chapter (97 chapters complete)
// Source: CBIC GST Rate Schedule
// URL: https://cbic-gst.gov.in/gst-goods-services-rates.html
// 4-tier structure: 0%, 5%, 12%, 18%, 28% + Compensation Cess
const INDIA_IGST_BY_CHAPTER: Record<string, number> = {
  // ══ 0% (Essential goods) ══
  // Fresh food, unprocessed: salt, live animals, human blood, etc.
  // (Most 0% items are domestic supplies, imports usually 5%+)

  // ══ 5% (Necessities) ══
  '01': 0.05,  // Live animals
  '02': 0.05,  // Meat (frozen: 12%, processed: 12%)
  '03': 0.05,  // Fish (frozen/dried: 5%, processed: 12%)
  '04': 0.05,  // Dairy, eggs, honey
  '05': 0.05,  // Animal origin products
  '07': 0.05,  // Vegetables (fresh: 0% domestic, import: 5%)
  '08': 0.05,  // Fruits and nuts
  '09': 0.05,  // Coffee, tea, spices
  '10': 0.05,  // Cereals
  '11': 0.05,  // Milling products, starches
  '12': 0.05,  // Oil seeds
  '13': 0.05,  // Lac, gums, resins
  '14': 0.05,  // Vegetable plaiting materials
  '15': 0.05,  // Animal/vegetable fats
  '17': 0.05,  // Sugars (refined: 18%)
  '19': 0.05,  // Cereal preparations
  '23': 0.05,  // Residues (animal feed)
  '25': 0.05,  // Salt, sulphur, earth, stone
  '49': 0.05,  // Books, newspapers (5%), printed matter (12%)
  '50': 0.05,  // Silk
  '51': 0.05,  // Wool
  '52': 0.05,  // Cotton (yarn/fabric: 5%, garments below Rs.1000: 5%)
  '53': 0.05,  // Other vegetable textile fibers

  // ══ 12% (Standard necessities) ══
  '06': 0.12,  // Live plants, flowers
  '16': 0.12,  // Preparations of meat/fish
  '18': 0.12,  // Cocoa, chocolate
  '20': 0.12,  // Preparations of vegetables/fruits
  '21': 0.12,  // Miscellaneous edible preparations
  '22': 0.12,  // Beverages (non-alcoholic: 12%, aerated: 28%+cess)
  '30': 0.12,  // Pharmaceuticals (bulk: 5%, formulations: 12%)
  '34': 0.12,  // Soap, detergent
  '48': 0.12,  // Paper (notebooks/exercise books: 12%)
  '61': 0.12,  // Knitted apparel (above Rs.1000: 12%)
  '62': 0.12,  // Woven apparel (above Rs.1000: 12%)
  '63': 0.12,  // Other made-up textile articles
  '64': 0.12,  // Footwear (below Rs.1000: 5%, above: 18%)

  // ══ 18% (Standard rate — most goods) ══
  '26': 0.18,  // Ores, slag, ash
  '27': 0.18,  // Mineral fuels, oils (crude: 5%, refined: 18%)
  '28': 0.18,  // Inorganic chemicals
  '29': 0.18,  // Organic chemicals
  '31': 0.18,  // Fertilizers (some 5%)
  '32': 0.18,  // Tanning, dyeing
  '33': 0.18,  // Essential oils, perfumery, cosmetics
  '35': 0.18,  // Albuminoidal substances, glues
  '36': 0.18,  // Explosives
  '37': 0.18,  // Photographic
  '38': 0.18,  // Miscellaneous chemical products
  '39': 0.18,  // Plastics
  '40': 0.18,  // Rubber
  '41': 0.18,  // Raw hides, skins
  '42': 0.18,  // Leather articles
  '43': 0.18,  // Furskins
  '44': 0.18,  // Wood (some 5-12%)
  '45': 0.18,  // Cork
  '46': 0.18,  // Straw, basketware
  '47': 0.18,  // Pulp
  '54': 0.18,  // Man-made filaments
  '55': 0.18,  // Man-made staple fibers
  '56': 0.18,  // Wadding, felt
  '57': 0.18,  // Carpets
  '58': 0.18,  // Special woven fabrics
  '59': 0.18,  // Impregnated textiles
  '60': 0.18,  // Knitted fabrics
  '65': 0.18,  // Headgear
  '66': 0.18,  // Umbrellas
  '67': 0.18,  // Prepared feathers
  '68': 0.18,  // Stone, plaster, cement
  '69': 0.18,  // Ceramic products
  '70': 0.18,  // Glass
  '72': 0.18,  // Iron and steel
  '73': 0.18,  // Iron/steel articles
  '74': 0.18,  // Copper
  '75': 0.18,  // Nickel
  '76': 0.18,  // Aluminum
  '78': 0.18,  // Lead
  '79': 0.18,  // Zinc
  '80': 0.18,  // Tin
  '81': 0.18,  // Other base metals
  '82': 0.18,  // Tools
  '83': 0.18,  // Miscellaneous metal
  '84': 0.18,  // Machinery (some: nuclear reactors=0%, sewing machines=12%)
  '85': 0.18,  // Electronics (phones=18%, solar panels=5%)
  '86': 0.18,  // Railway
  '88': 0.18,  // Aircraft (most: 5% or exempt for airlines)
  '89': 0.18,  // Ships (most: 5%)
  '90': 0.18,  // Optical, medical, measuring
  '91': 0.18,  // Clocks, watches
  '92': 0.18,  // Musical instruments
  '94': 0.18,  // Furniture
  '95': 0.18,  // Toys, games (video games: 28%)
  '96': 0.18,  // Miscellaneous manufactured
  '97': 0.12,  // Works of art (12%)

  // ══ 3% (Precious metals — SPECIAL) ══
  '71': 0.03,  // ⭐ Gold, silver, precious stones = 3% IGST
  // Note: Gold bars/coins 3%, jewelry 3%, cut diamonds 0.25%

  // ══ 28% (Luxury/demerit goods) ══
  '24': 0.28,  // Tobacco (28% + compensation cess up to 290%)
  '87': 0.28,  // Motor vehicles (28% + compensation cess 1-22%)
  '93': 0.28,  // Arms & ammunition
};

// Compensation Cess (additional to IGST) for demerit goods
const INDIA_CESS_RATES: Record<string, number> = {
  '24': 0.61,  // Tobacco: cess varies 5% to 290% of RSP-Excise, simplified to avg ~61%
  '87.02': 0.15, // Buses: 15% cess
  '87.03': 0.22, // Cars: cess 1%(small)~22%(luxury/SUV)
  '22.02': 0.12, // Aerated drinks: 12% cess
};

function getIndiaIgstRate(hsCode: string): number {
  const ch = hsCode.substring(0, 2);
  return INDIA_IGST_BY_CHAPTER[ch] ?? 0.18; // fallback 18%
}

function getIndiaCessRate(hsCode: string): number {
  // Check 4-digit first, then 2-digit
  const h4 = hsCode.substring(0, 5); // e.g. "87.03"
  if (INDIA_CESS_RATES[h4]) return INDIA_CESS_RATES[h4];
  const ch = hsCode.substring(0, 2);
  return INDIA_CESS_RATES[ch] ?? 0;
}
```

**적용**: `calculateIndiaImportTaxes()` 함수에서:
```typescript
// 변경 전:
const igstRate = INDIA_IGST_STANDARD; // 0.18 for all

// 변경 후:
const igstRate = getIndiaIgstRate(hsCode);
const cessRate = getIndiaCessRate(hsCode);
// Assessable Value = CIF + BCD (Basic Customs Duty)
// SWS = 10% of BCD
// IGST = igstRate × (CIF + BCD + SWS)
// Cess = cessRate × (CIF + BCD + SWS) — only for demerit goods
```

### 검증:
```
CN→IN, HS 7108 (금 바) → IGST 3% + Cess 0% ✅ (기존 28% 오류 수정!)
CN→IN, HS 8703 (승용차) → IGST 28% + Cess 22% ✅
CN→IN, HS 6109 (티셔츠) → IGST 12% ✅ (기존 18%)
CN→IN, HS 2402 (시가) → IGST 28% + Cess ~61% ✅
CN→IN, HS 0201 (쇠고기) → IGST 5% ✅ (기존 18%)
CN→IN, HS 8517 (스마트폰) → IGST 18% ✅
CN→IN, HS 3004 (의약품) → IGST 12% ✅
CN→IN, HS 4901 (서적) → IGST 5% ✅
```

---

## 수정 1-C: Mexico IEPS 주류 세분화 (이슈 #13, MEDIUM)

**현재 코드** (CostEngine.ts ~라인 350):
```typescript
// 현재: '22' 전체에 26.5% (맥주 세율만)
```

**수정 코드**:
```typescript
// Mexico IEPS by specific product type
// Source: SAT Mexico — Ley del IEPS
// URL: https://www.sat.gob.mx/normatividad/17498/ley-del-impuesto-especial-sobre-produccion-y-servicios
const MEXICO_IEPS_RATES: Record<string, number> = {
  // Alcoholic beverages (Art. 2, Fracción I, inciso A)
  '2203': 0.265,   // Beer 26.5%
  '2204': 0.265,   // Wine (up to 14% ABV: 26.5%)
  '2205': 0.265,   // Vermouth 26.5%
  '2206': 0.265,   // Other fermented beverages 26.5%
  '2207': 0.53,    // Undenatured ethyl alcohol 53%
  '2208': 0.53,    // ⭐ Spirits/liqueurs 53% (tequila, whisky, vodka, rum)
  // Non-alcoholic sugary beverages (Art. 2, Fracción I, inciso G)
  '2202': 0.08,    // Sugary drinks: MXN $1.4872/liter (≈8% effective)
  // Tobacco (Art. 2, Fracción I, inciso C)
  '2402': 1.60,    // Cigars/cigarettes 160%
  '2403': 1.60,    // Other tobacco 160%
  // Energy drinks
  '2106.90': 0.25, // Energy drinks 25%
  // Fuel (simplified — Art. 2, Fracción I, inciso D)
  '2710': 0.1675,  // Gasoline/diesel (variable quota, ~16.75% effective avg)
  // Pesticides (Art. 2, Fracción I, inciso I)
  '3808': 0.09,    // Pesticides 6-9% (Cat 1-3)
  // Junk food (Art. 2, Fracción I, inciso J)
  '1704': 0.08,    // Confectionery 8%
  '1806': 0.08,    // Chocolate preparations 8% (>275 kcal/100g)
  '1905': 0.08,    // Baked goods 8% (>275 kcal/100g)
  '2005.20': 0.08, // Chips (potato) 8%
};

function getMexicoIepsRate(hsCode: string): number {
  // Try 7-digit, then 4-digit, then 2-digit
  const h7 = hsCode.substring(0, 7);
  if (MEXICO_IEPS_RATES[h7]) return MEXICO_IEPS_RATES[h7];
  const h4 = hsCode.substring(0, 4);
  if (MEXICO_IEPS_RATES[h4]) return MEXICO_IEPS_RATES[h4];
  return 0; // No IEPS for most goods
}
```

**적용**: `calculateMexicoImportTaxes()` 함수에서:
```typescript
// 변경 전:
if (chapter === '22') iepsRate = 0.265; // All beverages 26.5%

// 변경 후:
const iepsRate = getMexicoIepsRate(hsCode);
```

### 검증:
```
US→MX, HS 2208 (위스키) → IEPS 53% ✅ (기존 26.5% 오류 수정!)
US→MX, HS 2203 (맥주) → IEPS 26.5% ✅ (동일)
US→MX, HS 2402 (담배) → IEPS 160% ✅
US→MX, HS 2202 (콜라) → IEPS ~8% ✅
US→MX, HS 8517 (스마트폰) → IEPS 0% ✅ (적용 안 됨)
```

---

## 수정 1-D: China CBEC 하드코딩 USD → CNY + 환율 (이슈 #33, MEDIUM)

**현재 코드** (CostEngine.ts ~라인 265-270):
```typescript
const CBEC_SINGLE_LIMIT = 700;  // USD
const CBEC_ANNUAL_LIMIT = 3660; // USD
```

**수정 코드**:
```typescript
// China CBEC limits in CNY (official values)
// Source: General Administration of Customs, China
// URL: http://www.customs.gov.cn/
// Regulation: 关于跨境电子商务零售进口税收政策的通知 (2018年第486号)
const CBEC_SINGLE_LIMIT_CNY = 5000;    // ¥5,000 per transaction
const CBEC_ANNUAL_LIMIT_CNY = 26000;   // ¥26,000 per person per year

function getCbecLimitsUsd(exchangeRate: number): { singleLimit: number; annualLimit: number } {
  // exchangeRate = 1 USD = X CNY (e.g., 7.25)
  const rate = exchangeRate || 7.25; // fallback to approximate rate
  return {
    singleLimit: Math.round(CBEC_SINGLE_LIMIT_CNY / rate),  // ~$690
    annualLimit: Math.round(CBEC_ANNUAL_LIMIT_CNY / rate),   // ~$3,586
  };
}
```

**적용**: CBEC 계산 함수에서 환율 파라미터 받아서 동적 계산.

---

## 수정 1-E: China 소비세 Chapter 확장 (이슈 #34, MEDIUM)

**현재 코드**: 6개 Chapter만 매핑

**수정 코드**:
```typescript
// China Consumption Tax by category
// Source: 中华人民共和国消费税暂行条例
// URL: http://www.chinatax.gov.cn/
const CHINA_CONSUMPTION_TAX: Record<string, { rate: number; description: string }> = {
  '22.03': { rate: 0.00, description: 'Beer — specific duty per ton' },
  '22.04': { rate: 0.10, description: 'Wine 10%' },
  '22.08': { rate: 0.20, description: 'Spirits 20% (baijiu etc.)' },
  '24.02': { rate: 0.56, description: 'Cigarettes 56% (Class A)' },
  '24.03': { rate: 0.36, description: 'Other tobacco 36%' },
  '27.10': { rate: 0.0012, description: 'Gasoline ¥1.52/L (specific)' },
  '33.03': { rate: 0.15, description: 'Perfume/cosmetics 15%' },
  '33.04': { rate: 0.15, description: 'Cosmetics 15%' },
  '36.04': { rate: 0.15, description: 'Fireworks 15%' },
  '71.13': { rate: 0.10, description: 'Precious jewelry 10%' },
  '71.14': { rate: 0.10, description: 'Gold/silver ware 10%' },
  '71.16': { rate: 0.10, description: 'Imitation jewelry 10%' },
  '87.02': { rate: 0.05, description: 'Buses (displacement based) 1-12%' },
  '87.03': { rate: 0.09, description: 'Passenger cars 3-40% (avg ~9% for 1.5-3.0L)' },
  '87.11': { rate: 0.03, description: 'Motorcycles 3% (≤250cc) / 10% (>250cc)' },
  '89.03': { rate: 0.10, description: 'Yachts 10%' },
  '91.01': { rate: 0.20, description: 'Luxury watches (>¥10,000) 20%' },
  '93.02': { rate: 0.00, description: 'Firearms (not consumer)' },
  '42.02': { rate: 0.00, description: 'Golf bags (no longer taxed since 2006 reform)' },
  // Battery, paint, etc. added in 2015 reform
  '85.07': { rate: 0.04, description: 'Batteries 4%' },
  '32.08': { rate: 0.04, description: 'Paint/coating 4%' },
  '38.14': { rate: 0.04, description: 'Organic solvents 4%' },
};

function getChinaConsumptionTax(hsCode: string): number {
  const h5 = hsCode.substring(0, 5); // e.g. "87.03"
  if (CHINA_CONSUMPTION_TAX[h5]) return CHINA_CONSUMPTION_TAX[h5].rate;
  const h4 = hsCode.substring(0, 4);
  const key = h4.substring(0, 2) + '.' + h4.substring(2);
  if (CHINA_CONSUMPTION_TAX[key]) return CHINA_CONSUMPTION_TAX[key].rate;
  return 0; // No consumption tax for most goods
}
```

---

## 수정 1-F: MPF CN-origin only → 모든 원산지 (이슈 #14, P2 잔여)

**현재 코드** (CostEngine.ts 라인 ~36-41):
```typescript
// MPF 계산이 CN origin일 때만 작동하는 조건 찾기
if (origin === 'CN') {
  mpf = MPF_INFORMAL; // $5.50
}
```

**수정 코드**:
```typescript
// US MPF applies to ALL origins (19 CFR 24.23)
// Source: https://www.cbp.gov/trade/basic-import-export/merchandise-processing-fee
// Formal entry: 0.3464% of declared value, min $32.71, max $634.04
// Informal entry: flat $2.00
if (destination === 'US') {
  if (declaredValue <= 2500) {
    mpf = 2.00;  // Informal entry
  } else {
    mpf = Math.min(Math.max(declaredValue * 0.003464, 32.71), 634.04);
  }
}
```

### ⚠️ CostEngine.ts vs GlobalCostEngine.ts MPF 통일 (이슈 #15, #17):
- GlobalCostEngine.ts는 이미 P2에서 수정됨 ($32.71/$634.04)
- CostEngine.ts도 동일한 값으로 맞춤
- 중복 코드 블록이 있으면 하나로 통합하거나, CostEngine에서 GlobalCostEngine을 호출

---

# ═══════════════════════════════════════════════════════════════
# FILE 2: eu-vat-rates.ts — EU 15개국 추가 + 독일 Ch.22 수정 (3건)
# (이슈 #8 EU reduced VAT 15국, #9 프랑스 해외영토, #31 독일 알코올)
# ═══════════════════════════════════════════════════════════════

## 수정 2-A: EU 15개국 경감세율 추가 (이슈 #8, HIGH→P2 잔여)

**현재**: DE, FR, IT, ES, NL, BE, AT, PL, SE, PT, IE, GR (12개국)
**추가**: FI, DK, CZ, RO, HU, BG, HR, SK, SI, LT, LV, EE, LU, CY, MT (15개국)
**출처**: EU TEDB (https://ec.europa.eu/taxation_customs/tedb/)

**⚠️ 중요**: 아래 세율은 2025년 기준. 반드시 TEDB에서 최신값 확인 후 적용할 것.

기존 구조(country → chapter → rate)와 동일한 형식으로 15개국 추가:

```typescript
// ══ Finland (FI) ══
// Standard: 25.5%, Reduced: 14%, Super-reduced: 10%
// Source: https://www.vero.fi/en/
FI: {
  // Food & agricultural (14%)
  '01': 0.14, '02': 0.14, '03': 0.14, '04': 0.14, '05': 0.14,
  '06': 0.14, '07': 0.14, '08': 0.14, '09': 0.14, '10': 0.14,
  '11': 0.14, '12': 0.14, '13': 0.14, '14': 0.14, '15': 0.14,
  '16': 0.14, '17': 0.14, '18': 0.14, '19': 0.14, '20': 0.14,
  '21': 0.14, '22': 0.14, // Note: alcohol at standard 25.5% — see heading check
  // Books/newspapers (10%)
  '49': 0.10,
  // Pharmaceuticals (10%)
  '30': 0.10,
},

// ══ Denmark (DK) ══
// Standard: 25%, NO reduced rate
// Denmark is the only EU country with NO reduced VAT
DK: {},  // Empty — all goods at standard 25%

// ══ Czech Republic (CZ) ══
// Standard: 21%, Reduced: 12%
CZ: {
  '01': 0.12, '02': 0.12, '03': 0.12, '04': 0.12, '05': 0.12,
  '07': 0.12, '08': 0.12, '09': 0.12, '10': 0.12, '11': 0.12,
  '15': 0.12, '16': 0.12, '17': 0.12, '18': 0.12, '19': 0.12,
  '20': 0.12, '21': 0.12,
  '30': 0.12,  // Pharmaceuticals
  '49': 0.12,  // Books
  '94.01': 0.12,  // Child car seats
},

// ══ Romania (RO) ══
// Standard: 19%, Reduced: 9%, Super-reduced: 5%
RO: {
  '01': 0.09, '02': 0.09, '03': 0.09, '04': 0.09, '07': 0.09,
  '08': 0.09, '09': 0.09, '10': 0.09, '11': 0.09, '15': 0.09,
  '16': 0.09, '17': 0.09, '19': 0.09, '20': 0.09, '21': 0.09,
  '30': 0.09,  // Pharmaceuticals
  '49': 0.05,  // Books 5%
},

// ══ Hungary (HU) ══
// Standard: 27% (EU highest!), Reduced: 18%, Super-reduced: 5%
HU: {
  '01': 0.18, '02': 0.18, '03': 0.18, '04': 0.18, '07': 0.18,
  '08': 0.18, '09': 0.18, '10': 0.18, '11': 0.18, '16': 0.18,
  '17': 0.18, '18': 0.18, '19': 0.18, '20': 0.18, '21': 0.18,
  '30': 0.05,  // Pharmaceuticals 5%
  '49': 0.05,  // Books 5%
},

// ══ Bulgaria (BG) ══
// Standard: 20%, Reduced: 9%
BG: {
  '01': 0.09, '02': 0.09, '03': 0.09, '04': 0.09, '07': 0.09,
  '08': 0.09, '10': 0.09, '11': 0.09, '16': 0.09, '19': 0.09,
  '49': 0.09,  // Books
},

// ══ Croatia (HR) ══
// Standard: 25%, Reduced: 13%, Super-reduced: 5%
HR: {
  '01': 0.13, '02': 0.13, '03': 0.13, '04': 0.13, '07': 0.05,
  '08': 0.05, '10': 0.05, '11': 0.05,
  '30': 0.05,  // Pharmaceuticals 5%
  '49': 0.05,  // Books 5%
},

// ══ Slovakia (SK) ══
// Standard: 23%, Reduced: 10%, Super-reduced: 5%
SK: {
  '01': 0.10, '02': 0.10, '03': 0.10, '04': 0.10, '07': 0.10,
  '08': 0.10, '10': 0.10, '16': 0.10,
  '30': 0.10,  // Pharmaceuticals
  '49': 0.05,  // Books 5%
},

// ══ Slovenia (SI) ══
// Standard: 22%, Reduced: 9.5%, Super-reduced: 5%
SI: {
  '01': 0.095, '02': 0.095, '03': 0.095, '04': 0.095, '07': 0.095,
  '08': 0.095, '10': 0.095, '16': 0.095,
  '30': 0.095, // Pharmaceuticals
  '49': 0.05,  // Books 5%
},

// ══ Lithuania (LT) ══
// Standard: 21%, Reduced: 9%, Super-reduced: 5%
LT: {
  '01': 0.09, '02': 0.09, '03': 0.09, '04': 0.09, '07': 0.09,
  '08': 0.09, '10': 0.09,
  '30': 0.05,  // Pharmaceuticals 5%
  '49': 0.09,  // Books 9%
},

// ══ Latvia (LV) ══
// Standard: 21%, Reduced: 12%, Super-reduced: 5%
LV: {
  '01': 0.12, '02': 0.12, '03': 0.12, '04': 0.12, '07': 0.12,
  '08': 0.12, '10': 0.12,
  '30': 0.12,  // Pharmaceuticals
  '49': 0.05,  // Books 5%
},

// ══ Estonia (EE) ══
// Standard: 22%, Reduced: 9%
EE: {
  '01': 0.09, '02': 0.09, '03': 0.09, '04': 0.09, '07': 0.09,
  '08': 0.09, '10': 0.09,
  '30': 0.09,  // Pharmaceuticals
  '49': 0.09,  // Books
},

// ══ Luxembourg (LU) ══
// Standard: 17% (EU lowest!), Reduced: 8%, Super-reduced: 3%
LU: {
  '01': 0.03, '02': 0.03, '03': 0.03, '04': 0.03, '07': 0.03,
  '08': 0.03, '10': 0.03, '11': 0.03,
  '30': 0.03,  // Pharmaceuticals 3%
  '49': 0.03,  // Books 3%
},

// ══ Cyprus (CY) ══
// Standard: 19%, Reduced: 9%, Super-reduced: 5%
CY: {
  '01': 0.05, '02': 0.05, '03': 0.05, '04': 0.05, '07': 0.05,
  '08': 0.05, '10': 0.05,
  '30': 0.05,  // Pharmaceuticals
  '49': 0.05,  // Books
},

// ══ Malta (MT) ══
// Standard: 18%, Reduced: 7%, Super-reduced: 5%
MT: {
  '01': 0.05, '02': 0.05, '03': 0.05, '04': 0.05, '07': 0.05,
  '08': 0.05,
  '30': 0.05,  // Pharmaceuticals
  '49': 0.05,  // Books
},
```

## 수정 2-B: 독일 Ch.22 알코올 표준세율 (이슈 #31, MEDIUM)

**현재 코드** (DE 항목):
```typescript
'22': 0.07,  // ← 전체 Ch.22에 경감 7% — 알코올도 7%로 잘못 적용
```

**수정 코드**:
```typescript
// Ch.22 split: non-alcoholic 7%, alcoholic 19%
// HS 2201-2202: Water, non-alcoholic beverages → 7%
// HS 2203-2208: Beer, wine, spirits → 19% (standard)
// HS 2209: Vinegar → 7%
'22.01': 0.07, '22.02': 0.07,  // Water, soft drinks → 7%
// '22.03'~'22.08' 누락 = 표준세율 19% 자동 적용
'22.09': 0.07,  // Vinegar → 7%
```

**⚠️**: getEuReducedVatRate() 함수에서 4자리(heading) 레벨 매칭도 지원하도록 수정:
```typescript
function getEuReducedVatRate(countryCode: string, hsCode: string, standardRate: number): number {
  const countryRates = EU_REDUCED_VAT[countryCode];
  if (!countryRates) return standardRate;

  // Try 5-char key first (e.g., "22.01"), then 2-char chapter
  const heading = hsCode.substring(0, 2) + '.' + hsCode.substring(2, 4);
  if (countryRates[heading] !== undefined) return countryRates[heading];

  const chapter = hsCode.substring(0, 2);
  if (countryRates[chapter] !== undefined) return countryRates[chapter];

  return standardRate;
}
```

## 수정 2-C: 프랑스 해외영토 VAT 8.5% (이슈 #9, HIGH 잔여)

**파일**: `app/lib/cost-engine/ioss-oss.ts` + GlobalCostEngine.ts
**문제**: Guadeloupe(GP), Martinique(MQ), Réunion(RE) 본토 20%→8.5%

**수정 코드** (ioss-oss.ts 또는 GlobalCostEngine.ts에서 VAT 계산 시):
```typescript
// French overseas departments (DOM) with reduced VAT
// Source: Article 294 du Code général des impôts
// GP (Guadeloupe), MQ (Martinique), RE (Réunion) = 8.5% VAT
// GF (Guyane), YT (Mayotte) = 0% VAT (VAT-free territories)
const FRENCH_DOM_VAT: Record<string, number> = {
  'GP': 0.085, // Guadeloupe
  'MQ': 0.085, // Martinique
  'RE': 0.085, // Réunion
  'GF': 0.00,  // Guyane (exempt)
  'YT': 0.00,  // Mayotte (exempt)
};

// In VAT calculation, check if destination is a French DOM:
// if (destination starts with FR- or is GP/MQ/RE/GF/YT territory code)
//   use FRENCH_DOM_VAT[territory] instead of FR standard 20%
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 3: roo-engine.ts — 적격성 로직 전면 수정 (3건)
# (이슈 #18 적격성, #19 savings 5%, #20 WO 범위)
# ═══════════════════════════════════════════════════════════════

## 수정 3-A: FTA별 조합 조건 (이슈 #18, P3)

**현재 코드** (roo-engine.ts ~라인 95-100):
```typescript
// 현재: 하나만 충족하면 eligible
const eligible = criteria.wo || criteria.rvcMet || criteria.cthMet || criteria.ccMet || criteria.ctshMet;
```

**수정 코드**:
```typescript
// FTA-specific eligibility combinations
// Source: Each FTA's Rules of Origin chapter
const FTA_ROO_REQUIREMENTS: Record<string, string[][]> = {
  // USMCA (Ch. 4): RVC AND (CTH or CC) — both required
  'USMCA': [['rvcMet', 'cthMet'], ['rvcMet', 'ccMet']],
  // KORUS (Ch. 6): RVC OR CTH — either sufficient
  'KORUS': [['rvcMet'], ['cthMet']],
  // EU-Korea: RVC OR CC
  'EU-KR': [['rvcMet'], ['ccMet']],
  // CPTPP (Ch. 3): WO OR (RVC AND CC)
  'CPTPP': [['wo'], ['rvcMet', 'ccMet']],
  // RCEP (Ch. 3): WO OR RVC OR CTH
  'RCEP': [['wo'], ['rvcMet'], ['cthMet']],
  // EU-UK TCA: Product-specific (simplified: CTH AND RVC)
  'EU-UK TCA': [['cthMet', 'rvcMet']],
  // EU-Japan EPA: CTH OR RVC
  'EU-JP': [['cthMet'], ['rvcMet']],
  // Default for unknown FTAs: any single criterion
  'default': [['wo'], ['rvcMet'], ['cthMet'], ['ccMet'], ['ctshMet']],
};

function checkEligibility(ftaName: string, criteria: Record<string, boolean>): boolean {
  const requirements = FTA_ROO_REQUIREMENTS[ftaName] || FTA_ROO_REQUIREMENTS['default'];
  // At least one combination must have ALL its criteria met
  return requirements.some(combo =>
    combo.every(criterion => criteria[criterion] === true)
  );
}

// Replace the old single-line check:
const eligible = checkEligibility(fta.name, {
  wo: criteria.wo,
  rvcMet: criteria.rvcMet,
  cthMet: criteria.cthMet,
  ccMet: criteria.ccMet,
  ctshMet: criteria.ctshMet,
});
```

## 수정 3-B: savings 5% → 실제 차이 (이슈 #19, HIGH 잔여)

```typescript
// 변경 전:
savingsIfEligible: 5, // hardcoded 5%

// 변경 후:
// Calculate actual savings = MFN rate - preferential rate
// If we know the MFN rate and preferential rate:
savingsIfEligible: mfnDutyRate && preferentialRate !== undefined
  ? Math.round((mfnDutyRate - preferentialRate) * 100) / 100
  : null,  // null = unknown (display "potential savings available" to user)
```

## 수정 3-C: WO(Wholly Obtained) 범위 확대 (이슈 #20, HIGH 잔여)

**현재**: Ch.01-10, 25-27만 WO 가능

**수정**:
```typescript
// WO-eligible HS chapters
// Source: WCO Revised Kyoto Convention, Specific Annex K
// WO = products entirely obtained in one country:
// - Natural products: minerals, agriculture, fishery, forestry
// - Live animals born & raised in the country
// - Products of the sea taken from ships flagged in the country
const WO_ELIGIBLE_CHAPTERS = new Set([
  '01', '02', '03', '04', '05',     // Animals & animal products
  '06', '07', '08', '09', '10',     // Vegetables, fruits, cereals
  '11', '12', '13', '14', '15',     // Flour, oilseeds, gums, fats
  '23',                               // Animal feed residues
  '25', '26', '27',                  // Minerals, ores, fuels
  '31',                               // Fertilizers (natural)
  '44', '45', '46',                  // Wood, cork, straw (unprocessed)
  '47',                               // Pulp (from domestic wood)
  '50',                               // Silk (raw)
  '51', '52', '53',                  // Wool, cotton, fibers (raw/unprocessed)
]);
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 4: section301-lookup.ts — Section 301 2024 확장 (2건)
# (이슈 #27 2024 확장 누락, #7 데이터 중복)
# ═══════════════════════════════════════════════════════════════

## 수정 4-A: 2024 USTR Section 301 확장 추가 (이슈 #27, MEDIUM)

**현재**: List 1-4A만 있음
**추가**: 2024년 5월 USTR 발표 추가 관세 인상

```typescript
// 2024 USTR Section 301 Tariff Increases (effective dates vary)
// Source: https://ustr.gov/issue-areas/enforcement/section-301-investigations/tariff-actions
// "Modification of Section 301 Tariff Actions: China's Acts, Policies, and Practices
//  Related to Technology Transfer, Intellectual Property, and Innovation"
const SECTION_301_2024_INCREASES: Record<string, { rate: number; effective: string }> = {
  // EVs: 100% (effective 2024-09-27)
  '8703.60': { rate: 1.00, effective: '2024-09-27' },
  '8703.70': { rate: 1.00, effective: '2024-09-27' },
  '8703.80': { rate: 1.00, effective: '2024-09-27' },
  // Solar cells: 50% (effective 2024-09-27)
  '8541.40': { rate: 0.50, effective: '2024-09-27' },
  // Steel & aluminum products: 25% (already covered by 232)
  // Semiconductors: 50% (effective 2025-01-01)
  '8541': { rate: 0.50, effective: '2025-01-01' },
  '8542': { rate: 0.50, effective: '2025-01-01' },
  // Lithium-ion batteries (EV): 25% (effective 2024-09-27)
  '8507.60': { rate: 0.25, effective: '2024-09-27' },
  // Non-EV batteries: 25% (effective 2026-01-01)
  // Critical minerals: 25% (effective 2024-09-27)
  '2602': { rate: 0.25, effective: '2024-09-27' }, // Manganese ores
  '2611': { rate: 0.25, effective: '2024-09-27' }, // Tungsten ores
  // Medical products: 50% (effective 2024-09-27)
  '6210.10': { rate: 0.50, effective: '2024-09-27' }, // PPE
  '9018': { rate: 0.50, effective: '2024-09-27' },    // Medical instruments
  '9019': { rate: 0.50, effective: '2024-09-27' },    // Medical devices
  // Ship-to-shore cranes: 25% (effective 2024-09-27)
  '8426.19': { rate: 0.25, effective: '2024-09-27' },
  // Natural graphite: 25% (effective 2026-01-01)
  // Permanent magnets: 25% (effective 2026-01-01)
};
```

**적용**: getSection301Rate() 함수에서 2024 인상분도 체크:
```typescript
// After checking List 1-4A, also check 2024 increases:
const hs4 = hsCode.substring(0, 4);
const hs6 = hsCode.substring(0, 6);
const hs7 = hsCode.substring(0, 7);
for (const prefix of [hs7, hs6, hs4]) {
  if (SECTION_301_2024_INCREASES[prefix]) {
    return Math.max(baseRate, SECTION_301_2024_INCREASES[prefix].rate);
  }
}
```

## 수정 4-B: duty-rates.ts 중복 정리 (이슈 #7, #29, MEDIUM)

**확인**: duty-rates.ts 파일이 존재하지 않는 것으로 확인됨 → 이 이슈는 **해당 없음(N/A)**. Section 301 데이터는 section301-lookup.ts에만 존재. dead code 없음.

---

# ═══════════════════════════════════════════════════════════════
# FILE 5: exchange-rate-service.ts — Fallback 업데이트 (2건)
# (이슈 #39 fallback rates, #40 unknown currency)
# ═══════════════════════════════════════════════════════════════

## 수정 5-A: Fallback rates 2025-01-01 → 2026-03-01 (이슈 #39, MEDIUM)

**현재**: 라인 168-208, 50+ 통화가 2025-01-01 기준

**수정**: 2026-03-01 기준값으로 업데이트. 특히 고변동 통화:
```typescript
// 아래 통화들은 2025→2026 사이 크게 변동 — 반드시 최신값 확인
// Source: ECB Reference Rates (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml)
// ⚠️ 실행 시점의 실제 ECB 환율을 가져와서 업데이트할 것

// 특히 주의할 통화:
// TRY (Turkish Lira) — 2025 ~36 → 2026 ~40+ (연간 20%+ 절하)
// ARS (Argentine Peso) — 2025 ~1050 → 2026 ~1200+ (연간 20%+ 절하)
// EGP (Egyptian Pound) — 2025 ~51 → 2026 ~52+
// NGN (Nigerian Naira) — 2025 ~1600 → 2026 ~1700+

// 자동 업데이트 방법:
// 1. ECB XML 파싱해서 현재 환율 가져오기
// 2. fallback 객체에 대입
// 3. timestamp를 현재 날짜로 변경
```

**구현**:
```typescript
// exchange-rate-service.ts에서 getFallbackRates() 또는 FALLBACK_RATES 상수를:
// "실행 시점의 ECB 데이터로 자동 초기화" 하는 스크립트 작성
// 또는 수동으로 현재 시점 환율로 업데이트

// 최소한 timestamp 변경:
// source: 'hardcoded-fallback', timestamp: '2025-01-01'
// → source: 'hardcoded-fallback', timestamp: '2026-03-23'
```

## 수정 5-B: Unknown currency rate 1.0 → null + 에러 (이슈 #40, MEDIUM)

```typescript
// 변경 전:
return { rate: 1.0, source: 'fallback' }; // Silent default

// 변경 후:
console.error(`[ExchangeRate] Unknown currency: ${currency}. No rate available.`);
return { rate: null, source: 'unknown', error: `No exchange rate for ${currency}` };
// 호출측에서 null 처리 필요 — null이면 USD 기준으로 계산하거나 에러 반환
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 6: shipping-calculator.ts — 지역 분류 수정 (2건)
# (이슈 #41 GB→EU, #42 AU/NZ→ASIA)
# ═══════════════════════════════════════════════════════════════

## 수정 6-A: GB를 EU에서 분리 (이슈 #41, MEDIUM)

**현재 코드** (라인 44):
```typescript
const EU_SET = new Set(['DE','FR','IT','ES','NL','BE','AT','PL','SE','PT','IE','GR',
  'FI','DK','CZ','RO','HU','BG','HR','SK','SI','LT','LV','EE','LU','CY','MT','GB']);
```

**수정 코드**:
```typescript
const EU_SET = new Set(['DE','FR','IT','ES','NL','BE','AT','PL','SE','PT','IE','GR',
  'FI','DK','CZ','RO','HU','BG','HR','SK','SI','LT','LV','EE','LU','CY','MT']);
// GB removed from EU (post-Brexit, 2021-01-01)
// GB gets its own region or treated as EU-adjacent with slightly different rates
const GB_SET = new Set(['GB']);
```

## 수정 6-B: AU/NZ를 ASIA에서 분리 (이슈 #42, MEDIUM)

**현재 코드** (라인 45):
```typescript
const ASIA_SET = new Set(['CN','JP','KR','TW','HK','SG','TH','VN','MY','ID','PH','IN','BD','PK','AU','NZ']);
```

**수정 코드**:
```typescript
const ASIA_SET = new Set(['CN','JP','KR','TW','HK','SG','TH','VN','MY','ID','PH','IN','BD','PK']);
const OCEANIA_SET = new Set(['AU','NZ','FJ','PG']);
```

**지역 판별 함수 수정**:
```typescript
function getRegion(countryCode: string): string {
  if (NA_SET.has(countryCode)) return 'NA';
  if (EU_SET.has(countryCode)) return 'EU';
  if (GB_SET.has(countryCode)) return 'GB';         // NEW
  if (OCEANIA_SET.has(countryCode)) return 'OCEANIA'; // NEW
  if (ASIA_SET.has(countryCode)) return 'ASIA';
  return 'OTHER';
}
```

**배송비 매트릭스에 GB/OCEANIA 추가**:
```typescript
// GB: EU와 거의 유사하지만 약간 높음 (통관 추가)
// OCEANIA: ASIA보다 약간 낮음 (선진 물류 인프라)
const REGIONAL_RATES = {
  'NA-GB': { express: 13, standard: 7, economy: 4 },      // EU+$1 (통관)
  'NA-OCEANIA': { express: 14, standard: 8, economy: 5 },  // ASIA-$1
  'EU-GB': { express: 8, standard: 5, economy: 3 },        // 가까움
  'EU-OCEANIA': { express: 15, standard: 9, economy: 6 },
  'ASIA-GB': { express: 14, standard: 8, economy: 5 },
  'ASIA-OCEANIA': { express: 10, standard: 6, economy: 4 }, // 근거리
  // ... 기존 매트릭스도 유지
};
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 7: macmap-lookup.ts — Origin EU 매핑 + ORDER BY (3건)
# (이슈 #25 origin EU 매핑, #44 ORDER BY, #45 error logging)
# ═══════════════════════════════════════════════════════════════

## 수정 7-A: Origin도 EU 매핑 (이슈 #25, MEDIUM)

**현재**: destination EU 매핑만 있음 (라인 66-77)

**수정**: origin도 같은 매핑 적용
```typescript
// 기존 코드: reporter(destination) EU 매핑만
// 추가: partner(origin)도 EU 매핑
const originForQuery = EU_MEMBERS.has(origin) ? 'EU' : origin;
// macmap DB에서 EU를 reporter로 쿼리할 때 사용
```

## 수정 7-B: rows[0] ORDER BY 추가 (이슈 #44, LOW)

```typescript
// 변경 전:
.limit(1); // 첫 번째 행 (비결정적)

// 변경 후:
.order('duty_rate', { ascending: true })
.limit(1); // 가장 낮은 세율
```

## 수정 7-C: Silent catch → error logging (이슈 #45, LOW)

```typescript
// 변경 전:
} catch (e) { /* silent */ }

// 변경 후:
} catch (e) {
  console.error(`[MacMap] Lookup failed for HS ${hsCode}, ${origin}→${destination}:`, e);
}
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 8: GlobalCostEngine.ts — HMF 해운 한정 (1건)
# (이슈 #35)
# ═══════════════════════════════════════════════════════════════

## 수정 8-A: HMF 해운만 적용 (이슈 #35, MEDIUM)

**현재**: 모든 미국 수입에 HMF 0.125% 적용
**실제**: Harbor Maintenance Fee는 **해상 운송(ocean/waterborne)**만 적용

```typescript
// 변경 전:
const hmf = declaredValue * 0.00125; // All imports

// 변경 후:
// HMF applies only to waterborne imports (ocean freight)
// Source: 19 USC § 58c(a), 26 USC § 4461
// Air freight, truck (land), rail = no HMF
let hmf = 0;
if (transportMode === 'ocean' || transportMode === 'sea' || !transportMode) {
  // Default to ocean if transport mode not specified (conservative)
  hmf = declaredValue * 0.00125;
}
```

**⚠️**: `transportMode` 파라미터가 함수에 없으면 optional 파라미터로 추가:
```typescript
interface CalculationParams {
  // ... existing params
  transportMode?: 'air' | 'ocean' | 'sea' | 'land' | 'rail';
}
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 9: trade-remedy-lookup.ts — HS prefix + threshold (2건)
# (이슈 #36, #37)
# ═══════════════════════════════════════════════════════════════

## 수정 9-A: 2-digit HS prefix fallback (이슈 #36, MEDIUM)

**현재**: HS6→HS4 fallback만

**수정**: HS6→HS4→HS2 fallback 체인
```typescript
// 변경 전:
if (!result) result = await queryByHs(hsCode.substring(0, 4)); // 4-digit fallback

// 변경 후:
if (!result) result = await queryByHs(hsCode.substring(0, 4)); // 4-digit
if (!result) result = await queryByHs(hsCode.substring(0, 2)); // 2-digit (chapter level)
```

## 수정 9-B: Fuzzy threshold 통일 (이슈 #37, MEDIUM)

```typescript
// trade-remedy: 코드 내 0.7 + DB pg_trgm 0.3 → 격차
// 수정: 코드 내 threshold를 0.8으로 올리고, 2단계 검색:
// Stage 1: >= 0.8 (높은 신뢰)
// Stage 2: >= 0.6 (넓은 검색, 결과에 confidence 표시)
const FIRM_MATCH_HIGH = 0.8;
const FIRM_MATCH_LOW = 0.6;
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 10: export-controls.ts — ECCN 커버리지 확장 (1건)
# (이슈 #22)
# ═══════════════════════════════════════════════════════════════

## 수정 10-A: HS→ECCN 매핑 9→30+ Chapter (이슈 #22, HIGH 잔여)

**현재**: 9개 Chapter만 매핑 (84, 85, 88, 90, 28, 29, 38, 27)

**수정**: 주요 듀얼유스 Chapter 추가
```typescript
const HS_TO_ECCN: Record<string, { eccn: string; category: string; categoryName: string }> = {
  // Category 0: Nuclear
  '28.44': { eccn: '0C', category: '0', categoryName: 'Nuclear Materials' }, // Radioactive chemicals

  // Category 1: Special Materials
  '28': { eccn: '1C', category: '1', categoryName: 'Special Materials' },
  '29': { eccn: '1C', category: '1', categoryName: 'Special Materials' },
  '38': { eccn: '1C', category: '1', categoryName: 'Special Materials' },
  '71': { eccn: '1C', category: '1', categoryName: 'Special Materials' }, // Precious metals (certain alloys)
  '72': { eccn: '1C', category: '1', categoryName: 'Special Materials' }, // Special steels
  '74': { eccn: '1C', category: '1', categoryName: 'Special Materials' }, // Copper alloys
  '76': { eccn: '1C', category: '1', categoryName: 'Special Materials' }, // Aluminum alloys
  '81': { eccn: '1C', category: '1', categoryName: 'Special Materials' }, // Tungsten, molybdenum

  // Category 2: Materials Processing
  '84': { eccn: '2B', category: '2', categoryName: 'Materials Processing' }, // Machine tools, CNC
  '82': { eccn: '2B', category: '2', categoryName: 'Materials Processing' }, // Cutting tools

  // Category 3: Electronics
  '85': { eccn: '3A', category: '3', categoryName: 'Electronics' },
  '90.13': { eccn: '3A', category: '3', categoryName: 'Electronics' }, // Lasers

  // Category 4: Computers
  // (Covered by 85 above)

  // Category 5: Telecommunications
  '85.17': { eccn: '5A', category: '5', categoryName: 'Telecommunications' }, // Telecom equipment
  '85.25': { eccn: '5A', category: '5', categoryName: 'Telecommunications' }, // Transmission apparatus

  // Category 6: Sensors
  '90': { eccn: '6A', category: '6', categoryName: 'Sensors & Lasers' },
  '90.05': { eccn: '6A', category: '6', categoryName: 'Sensors & Lasers' }, // Optics

  // Category 7: Navigation
  '90.14': { eccn: '7A', category: '7', categoryName: 'Navigation & Avionics' },

  // Category 8: Marine
  '89': { eccn: '8A', category: '8', categoryName: 'Marine' },

  // Category 9: Aerospace
  '88': { eccn: '9A', category: '9', categoryName: 'Aerospace & Propulsion' },
  '27.10': { eccn: '1C', category: '1', categoryName: 'Special Materials' }, // Aviation fuel

  // NOT controlled (EAR99):
  // '87': vehicles → EAR99 (already fixed in P0-2)
  // '61'-'63': textiles → EAR99
  // '94'-'96': furniture/toys → EAR99
};
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 11: duty-rates.ts — getEffectiveDutyRate 수정 (1건)
# (이슈 #30)
# ═══════════════════════════════════════════════════════════════

**확인**: duty-rates.ts 파일이 존재하지 않음 → **N/A**. 이 기능이 다른 파일에 있다면 해당 파일에서 수정.

만약 macmap-lookup.ts 또는 GlobalCostEngine.ts에 유사 함수가 있다면:
```typescript
// 변경 전:
return 0; // unknown product → 0% duty (과소 청구)

// 변경 후:
return null; // unknown → null → 호출측에서 "세율 확인 불가" 표시
// 또는 conservative fallback:
return { rate: null, message: 'Duty rate not found. Manual verification required.' };
```

---

# ═══════════════════════════════════════════════════════════════
# FILE 12: macmap-lookup.ts — 이슈 #26, #28 (2건)
# ═══════════════════════════════════════════════════════════════

## 수정 12-A: lookupMacMapDutyRate AGR first hit (이슈 #26, MEDIUM)

**확인**: lookupAllDutyRates()에서는 이미 3개 테이블 병렬 조회 후 최저 선택.
lookupMacMapDutyRate()는 단순 조회용 — 주석으로 한계 명시:

```typescript
// lookupMacMapDutyRate — single-table fallback chain (AGR→MIN→NTLC)
// Note: For tariff optimization (lowest rate), use lookupAllDutyRates() instead.
// This function returns the first match found, not necessarily the lowest rate.
```

## 수정 12-B: RCEP 0.5 multiplier (이슈 #28, MEDIUM)

```typescript
// 현재: RCEP에 단순 0.5 multiplier
// 수정: 주석으로 한계 명시 + TODO
// RCEP uses product-specific schedules that differ by country pair.
// Current 0.5 multiplier is a rough approximation.
// TODO: Implement RCEP Annex I tariff reduction schedules per member pair.
// This requires ~7,800 product-specific rules per country pair.
```

---

# ═══════════════════════════════════════════════════════════════
# 실행 순서 요약
# ═══════════════════════════════════════════════════════════════

```
Phase 1: CostEngine.ts (8건)
├── 1-A: Brazil IPI Chapter별 세율 테이블 (95개 Chapter)
├── 1-B: India IGST 97 Chapter 전체 매핑 + Cess
├── 1-C: Mexico IEPS 주류 세분화 (26.5%/53%/160%)
├── 1-D: China CBEC CNY 기준 + 환율
├── 1-E: China 소비세 12+ Chapter → 21개 항목
├── 1-F: MPF 모든 원산지 + CostEngine/GlobalCostEngine 통일
├── npm run build ✅
└── 테스트 30건

Phase 2: eu-vat-rates.ts (3건)
├── 2-A: EU 15개국 경감세율 추가 (27/27 완성)
├── 2-B: 독일 Ch.22 알코올 표준세율 분리
├── 2-C: 프랑스 해외영토 8.5% + Guyane/Mayotte 0%
├── npm run build ✅
└── 테스트 15건

Phase 3: roo-engine.ts (3건)
├── 3-A: FTA별 조합 조건 (7개 FTA)
├── 3-B: savings 실제 차이 계산
├── 3-C: WO 범위 확대 (30+ Chapter)
├── npm run build ✅
└── 테스트 10건

Phase 4: section301-lookup.ts (2건)
├── 4-A: 2024 USTR 확장 추가 (EV 100%, Solar 50%, Semi 50%)
├── 4-B: duty-rates.ts 중복 확인 → N/A
├── npm run build ✅
└── 테스트 8건

Phase 5: exchange-rate-service.ts (2건)
├── 5-A: Fallback 환율 2026-03 기준으로 업데이트
├── 5-B: Unknown currency null + error log
├── npm run build ✅
└── 테스트 5건

Phase 6: shipping-calculator.ts (2건)
├── 6-A: GB EU에서 분리
├── 6-B: AU/NZ OCEANIA 별도 지역
├── npm run build ✅
└── 테스트 6건

Phase 7: macmap-lookup.ts (3건)
├── 7-A: Origin EU 매핑
├── 7-B: ORDER BY duty_rate ASC
├── 7-C: Error logging 추가
├── npm run build ✅
└── 테스트 5건

Phase 8: 나머지 파일 (4건)
├── 8-A: GlobalCostEngine.ts — HMF 해운만 (+ transportMode 파라미터)
├── 9-A: trade-remedy-lookup.ts — HS2 fallback
├── 9-B: trade-remedy-lookup.ts — Fuzzy threshold 통일
├── 10-A: export-controls.ts — ECCN 30+ Chapter
├── npm run build ✅
└── 테스트 10건

Phase 9: 최종 회귀 테스트
├── 기존 Duty Rate 55/55 재실행
├── 12개 Area별 대표 5건씩 = 60건 계산 정합성 검증
├── 빌드 최종 확인
├── 엑셀 최종 정리 (5시트)
└── FIX_SUMMARY에 35건 전체 수정 상태 기록
```

---

## 검증 총 테스트 수: ~149건
- Phase 1: 30건 (Brazil 7 + India 8 + Mexico 5 + China 5 + MPF 5)
- Phase 2: 15건 (EU VAT 15국 × 1건)
- Phase 3: 10건 (RoO USMCA/KORUS/CPTPP/RCEP/EU-UK × 2건)
- Phase 4: 8건 (Section 301 2024)
- Phase 5: 5건 (환율)
- Phase 6: 6건 (GB/OCEANIA)
- Phase 7: 5건 (macmap)
- Phase 8: 10건 (HMF/trade-remedy/ECCN)
- Phase 9: 60건 (회귀)

---

> **완료 후**: 35건 전체 수정 + 빌드 성공 + 149건 테스트 PASS 시
> → POTAL_35Issue_Complete_Fix.xlsx 생성
> → CLAUDE.md/session-context.md 업데이트: "46건 전체 수정 완료"
> → 데이터 관리 시스템 명령어 파일 최종 수정 (항목 1 파일 트리, 항목 7 검증 규칙에 새 데이터 반영)
