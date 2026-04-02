# Claude Code 명령어: 46건 검수 이슈 수정 (터미널 1)

> **날짜**: 2026-03-23 KST
> **목표**: POTAL_12Area_Code_Audit.xlsx에서 발견된 46건 이슈를 P0→P3 우선순위 순서로 수정
> **원칙**: (1) 각 수정마다 npm run build 확인 (2) 기존 정상 기능 깨뜨리지 않기 (3) 엑셀 로깅 필수

---

## ⚠️ 절대 규칙

1. **엑셀 로깅 필수** (CLAUDE.md 절대 규칙 11번) — 시트명 `YYMMDDHHMM`, 모든 수정의 변경 전/후 코드 기록
2. **한 이슈씩 순서대로** — P0 전부 완료 → P1 → P2 → P3
3. **각 수정 후 npm run build** — 빌드 깨지면 즉시 롤백
4. **v3 파이프라인(Area 0) 수정 금지** — 절대값 원칙. Area 0 이슈 #24는 이미 수정 완료됨
5. **수정 전후 비교 테스트** — 수정 전 특정 입력의 결과 기록 → 수정 후 동일 입력 재실행 → 결과 비교

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

## 결과 엑셀: `POTAL_46Issue_Fix_Log.xlsx`

시트 구조:
```
시트 1: FIX_SUMMARY — 46건 전체 수정 상태 (이슈#, 심각도, 파일, 수정전, 수정후, 빌드결과, 테스트결과)
시트 2: P0_CRITICAL — P0 2건 상세 (변경 전/후 전체 코드 + 테스트)
시트 3: P1_URGENT — P1 6건 상세
시트 4: P2_IMPORTANT — P2 3건 상세
시트 5: P3_ENHANCE — P3 3건 상세
시트 6: REMAINING — 나머지 32건 (MEDIUM 20 + LOW 3 + 이미수정 1 + HIGH 8건 P1~P3에 포함)
시트 7: REGRESSION_TEST — 수정 후 회귀 테스트 (기존 기능 깨지지 않았는지)
시트 8: BUILD_LOG — npm run build 전체 로그
```

---

# ═══════════════════════════════════════════════════
# P0: CRITICAL — 즉시 수정 (2건)
# ═══════════════════════════════════════════════════

## P0-1: US De Minimis $0 버그 (이슈 #1)
**파일**: `app/lib/cost-engine/country-data.ts`
**문제**: US deMinimis가 0으로 설정되어 **모든 원산지**에 대해 면세 미적용. 실제로는 중국 원산지만 $0 (2025 IEEPA), 나머지는 $800.
**영향**: 미국으로 들어오는 $800 이하 수입품 전부에 불필요한 관세 부과

### 수정 방법:

**현재 코드** (country-data.ts, US 항목):
```typescript
US: {
  code: 'US', name: 'United States', region: 'North America',
  vatRate: 0, vatLabel: 'Sales Tax', avgDutyRate: 0.05,
  deMinimis: 0, deMinimsCurrency: 'USD', deMinimisUsd: 0,
  currency: 'USD', hasFtaWithChina: false,
  notes: 'State sales tax varies 0-10.25%. China de minimis eliminated Aug 2025.'
},
```

**수정 코드**:
```typescript
US: {
  code: 'US', name: 'United States', region: 'North America',
  vatRate: 0, vatLabel: 'Sales Tax', avgDutyRate: 0.05,
  deMinimis: 800, deMinimsCurrency: 'USD', deMinimisUsd: 800,
  deMinimisExceptions: { CN: 0, HK: 0 },  // IEEPA Aug 2025: China & HK de minimis eliminated
  currency: 'USD', hasFtaWithChina: false,
  notes: 'State sales tax varies 0-10.25%. De minimis $800 except China/HK origin ($0 per IEEPA Aug 2025).'
},
```

**⚠️ 추가 수정 필요**: `deMinimisExceptions` 필드를 사용하는 코드가 GlobalCostEngine.ts 또는 CostEngine.ts에 있는지 확인. 없으면 de minimis 체크 로직에 origin 분기 추가:

```typescript
// GlobalCostEngine.ts의 de minimis 체크 부분 찾아서:
// 기존: if (declaredValue <= countryData.deMinimis) { ... duty exempt ... }
// 수정:
function getEffectiveDeMinimis(destinationCountry: string, originCountry: string): number {
  const countryData = COUNTRY_DATA[destinationCountry];
  if (!countryData) return 0;

  // Origin-specific exceptions (e.g., US $0 for CN/HK per IEEPA)
  if (countryData.deMinimisExceptions && countryData.deMinimisExceptions[originCountry] !== undefined) {
    return countryData.deMinimisExceptions[originCountry];
  }

  return countryData.deMinimisUsd || countryData.deMinimis || 0;
}
```

### 검증 테스트:
```
테스트 1: CN→US, $500 상품 → de minimis 0 → 관세 부과됨 ✅ (중국은 $0)
테스트 2: DE→US, $500 상품 → de minimis 800 → 면세 ✅ (독일은 $800)
테스트 3: JP→US, $900 상품 → de minimis 800 → 관세 부과됨 ✅ ($800 초과)
테스트 4: HK→US, $100 상품 → de minimis 0 → 관세 부과됨 ✅ (홍콩도 $0)
테스트 5: KR→US, $799 상품 → de minimis 800 → 면세 ✅
```

---

## P0-2: Math.random() in Export Controls (이슈 #2)
**파일**: `app/lib/compliance/export-controls.ts`
**문제**: 라인 56에서 `Math.random()`으로 라이선스 예외 결정 — 비결정적 컴플라이언스 결과
**영향**: 동일 상품 2번 조회 시 다른 결과 → 법적 신뢰성 제로

### 수정 방법:

**현재 코드** (export-controls.ts 라인 56):
```typescript
licenseExceptions: ['LVS', 'GBS', 'TSR'].filter(() => Math.random() > 0.3), // Simplified
```

**수정 코드**:
```typescript
licenseExceptions: determineLicenseExceptions(mapping.eccn, mapping.category, params.hsCode),
```

**새 함수 추가** (export-controls.ts에 추가):
```typescript
/**
 * Deterministic license exception lookup based on ECCN category and HS code.
 * Reference: 15 CFR § 740 (License Exceptions)
 *
 * LVS (Low Value Shipments): Category 1-9, value under threshold
 * GBS (Governments, International Orgs): Category 1-9, government end-users
 * TSR (Technology & Software Under Restriction): Category 1-9 technology/software
 * TMP (Temporary Exports): Category 0-9, temporary use
 * RPL (Servicing & Replacement): Category 0-9, replacement parts
 * GOV (Governments & International Orgs): Government end-use
 * CIV (Civil End-Users): Category 3-5, civilian end-users
 */
function determineLicenseExceptions(eccn: string, category: string, hsCode: string): string[] {
  const exceptions: string[] = [];
  const cat = parseInt(category);

  // LVS — most common, applicable to most controlled items with value limits
  // Categories 1-9 (not 0=Nuclear), most product types
  if (cat >= 1 && cat <= 9) {
    exceptions.push('LVS');
  }

  // GBS — Government/International Organization end-users
  // Available for most categories when destined for government use
  if (cat >= 1 && cat <= 9) {
    exceptions.push('GBS');
  }

  // TSR — Technology and Software Restriction
  // Only for technology (subcategory E) and software (subcategory D)
  // We can't determine sub-category from HS alone, so include if likely tech
  if (['3', '4', '5'].includes(category)) {
    exceptions.push('TSR');
  }

  // TMP — Temporary exports (exhibitions, demos, testing)
  // Available for most categories
  if (cat >= 0 && cat <= 9) {
    exceptions.push('TMP');
  }

  // RPL — Replacement/servicing parts
  // Available for most categories
  if (cat >= 0 && cat <= 9) {
    exceptions.push('RPL');
  }

  return exceptions;
}
```

### 검증 테스트:
```
테스트 1: HS 84 (기계) → ECCN 2B → exceptions: ['LVS','GBS','TMP','RPL'] (매번 동일)
테스트 2: HS 84 (기계) 10회 반복 → 10회 전부 동일 결과 ✅ (비결정성 제거)
테스트 3: HS 93 (무기) → ECCN 0A → exceptions: ['TMP','RPL'] (Category 0이므로 LVS/GBS 없음)
테스트 4: HS 90 (센서) → ECCN 6A → exceptions: ['LVS','GBS','TMP','RPL']
```

---

# ═══════════════════════════════════════════════════
# P1: URGENT — 긴급 수정 (6건)
# ═══════════════════════════════════════════════════

## P1-1: Section 232 알루미늄 10%→25% (이슈 #3)
**파일**: `app/lib/cost-engine/section301-lookup.ts`
**문제**: Section 232 알루미늄 관세 10% — 2025년 3월 12일 대통령 행정명령으로 25%로 인상됨
**참고**: https://www.federalregister.gov/documents/2025/02/11/2025-02666/adjusting-imports-of-aluminum-into-the-united-states

### 수정:
```typescript
// 변경 전:
{ chapters: ['76'], rate: 0.10, description: 'Section 232: Aluminum 10%' }

// 변경 후:
{ chapters: ['76'], rate: 0.25, description: 'Section 232: Aluminum 25% (increased March 12, 2025)' }
```

### 검증:
```
HS 7601 (aluminum ingot), CN→US → 추가관세 25% (기존 10%)
HS 7604 (aluminum bars), VN→US → 추가관세 25%
```

---

## P1-2: Section 232 면제국 전면 철회 (이슈 #4)
**파일**: `app/lib/cost-engine/section301-lookup.ts`
**문제**: 면제국 리스트에 AU, AR, BR, KR이 남아있으나 2025년 3월 12일 행정명령으로 전면 철회
**참고**: 같은 행정명령 — 모든 국가에 동일 세율 적용

### 수정:
```typescript
// 변경 전:
const SECTION_232_EXEMPT = new Set(['AU', 'AR', 'BR', 'KR']);
// 또는 유사한 면제국 리스트

// 변경 후:
const SECTION_232_EXEMPT = new Set<string>([]); // All exemptions revoked per Executive Order, March 12, 2025
```

### 검증:
```
HS 7206 (steel), AU→US → 추가관세 25% 적용 (면제 안 됨)
HS 7601 (aluminum), KR→US → 추가관세 25% 적용 (면제 안 됨)
```

---

## P1-3: EU-Mercosur FTA isActive false로 변경 (이슈 #5)
**파일**: `app/lib/cost-engine/fta.ts` (또는 FTA 정의 파일)
**문제**: EU-Mercosur FTA가 active로 표시되어 있으나, 아직 비준 안 됨 (2024년 12월 정치적 합의만 됨). 이 상태로 특혜관세를 적용하면 잘못된 관세율 제공.

### 수정:
fta.ts에서 EU-Mercosur 항목을 찾아서:
```typescript
// 변경 전:
{ name: 'EU-Mercosur', ..., isActive: true, ... }

// 변경 후:
{ name: 'EU-Mercosur', ..., isActive: false, notes: 'Political agreement Dec 2024. Not ratified as of March 2026. Do NOT apply preferential rates.' }
```

### 검증:
```
BR→EU, HS 0201 (쇠고기) → FTA 적용 안 됨 → MFN 세율 적용 ✅
AR→DE, HS 2204 (와인) → FTA 적용 안 됨 → MFN 세율 적용 ✅
```

---

## P1-4: EU-UK TCA 추가 (이슈 #6)
**파일**: `app/lib/cost-engine/fta.ts`
**문제**: EU-UK Trade and Cooperation Agreement (2021년 1월 1일 발효)가 FTA DB에 없음 — EU-UK 무역은 세계 최대 교역 통로 중 하나

### 수정:
fta.ts의 FTA 배열에 추가:
```typescript
{
  name: 'EU-UK TCA',
  fullName: 'EU-UK Trade and Cooperation Agreement',
  parties: {
    side1: ['GB'],
    side2: EU_MEMBERS,  // 27개국
  },
  isActive: true,
  effectiveDate: '2021-01-01',
  preferentialRate: 0,   // 0% (duty-free for originating goods)
  excludedChapters: [],  // TCA covers virtually all goods
  rooType: 'product-specific',
  notes: 'Full FTA with product-specific Rules of Origin. Covers all goods with PSR annex.',
}
```

### 검증:
```
GB→DE, HS 8471 (컴퓨터) → EU-UK TCA 적용 → 0% ✅
FR→GB, HS 6109 (티셔츠) → EU-UK TCA 적용 → 0% ✅
GB→FR, HS 2204 (와인) → EU-UK TCA 적용 → 0% ✅
```

---

## P1-5: Ch.87 ECCN 매핑 수정 (이슈 #21)
**파일**: `app/lib/compliance/export-controls.ts`
**문제**: HS Chapter 87(자동차/차량)이 ECCN Category 0(Nuclear & Miscellaneous)로 매핑됨. 차량은 Category 0이 아님.

### 수정:
```typescript
// 변경 전:
'87': { eccn: '0A', category: '0', categoryName: 'Nuclear & Miscellaneous', reasons: ['NS'] },

// 변경 후:
'87': { eccn: 'EAR99', category: 'N/A', categoryName: 'Vehicles — generally not controlled', reasons: [] },
// Note: Most consumer vehicles are EAR99. Military vehicles would be USML Category VII, not EAR.
// Specific vehicle parts (armored plating etc.) may be ECCN 0A018 but that requires product-level analysis.
```

### 검증:
```
HS 8703 (승용차) → EAR99 → 라이선스 불필요 ✅ (Nuclear이 아님)
HS 8711 (오토바이) → EAR99 → 라이선스 불필요 ✅
```

---

## P1-6: fuzzy-screening.ts 테이블명 수정 (이슈 #23)
**파일**: `app/lib/compliance/fuzzy-screening.ts`
**문제**: 라인 78-81에서 `sanctions_sdn`과 `denied_parties` 테이블 참조 — 실제 DB에는 `sanctions_entries`와 `sanctions_aliases` 테이블이 있음

### 수정 전에 먼저 확인:
```sql
-- 실제 DB 테이블 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'sanctions%';
-- 예상 결과: sanctions_entries, sanctions_aliases, sanctions_addresses, sanctions_ids
```

### 수정:
```typescript
// 변경 전 (라인 78-81):
const tables = [
  { table: 'sanctions_sdn', nameField: 'name', sourceField: 'source', typeField: 'sdn_type' },
  { table: 'denied_parties', nameField: 'name', sourceField: 'source', typeField: 'entity_type' },
];

// 변경 후:
const tables = [
  { table: 'sanctions_entries', nameField: 'name', sourceField: 'source', typeField: 'entity_type' },
];
// Note: sanctions_aliases도 검색에 포함해야 하지만, 별도 조인으로 처리
// aliases 테이블에서도 검색:
// SELECT se.* FROM sanctions_entries se
// JOIN sanctions_aliases sa ON se.id = sa.entry_id
// WHERE sa.alias_name ILIKE '%query%'
```

**⚠️ 추가**: sanctions_aliases도 검색하도록 로직 추가:
```typescript
// sanctions_entries 검색 후, aliases에서도 검색:
const { data: aliasHits } = await sb
  .from('sanctions_aliases')
  .select('entry_id, alias_name')
  .ilike('alias_name', `%${queryNorm}%`)
  .limit(20);

if (aliasHits && aliasHits.length > 0) {
  const entryIds = aliasHits.map(a => a.entry_id);
  const { data: entries } = await sb
    .from('sanctions_entries')
    .select('name, source, entity_type')
    .in('id', entryIds);
  // ... 결과를 results에 추가
}
```

### SQL injection 수정 (이슈 #43도 함께):
```typescript
// 변경 전 (라인 90):
.ilike(nameField, `%${queryNorm}%`)

// 변경 후 (와일드카드 이스케이프):
.ilike(nameField, `%${queryNorm.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`)
```

### 검증:
```
테스트 1: fuzzyMatch("Bank of Iran") → sanctions_entries에서 결과 반환 ✅ (테이블 에러 없음)
테스트 2: fuzzyMatch("Kim Jong") → 결과 반환 + aliases에서도 검색 ✅
테스트 3: fuzzyMatch("test%injection_attempt") → SQL injection 없이 정상 검색 ✅
```

---

# ═══════════════════════════════════════════════════
# P2: IMPORTANT — 중요 수정 (3건)
# ═══════════════════════════════════════════════════

## P2-1: EU 10개국 De Minimis 0→150 수정 (이슈 #10)
**파일**: `app/lib/cost-engine/country-data.ts`
**문제**: BG, HR, SK, SI, LT, LV, EE, LU 등 EU 회원국의 deMinimis가 0 — 실제는 EU 공통 €150

### 수정:
각 국가 항목에서:
```typescript
// 변경 전:
BG: { ..., deMinimis: 0, deMinimsCurrency: 'BGN', deMinimisUsd: 0, ... },
HR: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },
SK: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },
SI: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },
LT: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },
LV: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },
EE: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },
LU: { ..., deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0, ... },

// 변경 후: (모든 EU 회원국 동일)
BG: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
HR: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
SK: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
SI: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
LT: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
LV: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
EE: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
LU: { ..., deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160, ... },
```

**⚠️ 주의**: BG는 BGN(불가리아 레프) 사용국이지만 EU de minimis €150 동일 적용. BGN 환산 시 ~294 BGN.
```typescript
BG: { ..., deMinimis: 294, deMinimsCurrency: 'BGN', deMinimisUsd: 160, ... },
```

### 아이슬란드 수정 (이슈 #32):
```typescript
// 변경 전:
IS: { ..., deMinimis: 0, deMinimsCurrency: 'ISK', deMinimisUsd: 0, ... },

// 변경 후:
IS: { ..., deMinimis: 10000, deMinimsCurrency: 'ISK', deMinimisUsd: 71, notes: 'De minimis ISK 10,000 (~$71 USD)' },
```

### 검증:
```
CN→BG, $100 상품 → de minimis 150 EUR → 면세 ✅
CN→LU, $200 상품 → de minimis 150 EUR → 관세 부과 ✅
CN→IS, $50 상품 → de minimis ISK 10,000 → 면세 ✅
CN→IS, $80 상품 → de minimis ISK 10,000 → 관세 부과 ✅
```

---

## P2-2: EU Reduced VAT 14개국 추가 (이슈 #8)
**파일**: `app/lib/cost-engine/eu-vat-rates.ts`
**문제**: 현재 12개국(DE,FR,IT,ES,NL,BE,AT,PL,SE,PT,IE,GR)만 — 나머지 15개국(FI,DK,CZ,RO,HU,BG,HR,SK,SI,LT,LV,EE,LU,CY,MT) 경감세율 누락

### 수정:
eu-vat-rates.ts의 매핑 객체에 15개국 추가. 각 국가의 실제 경감세율 참고:
- **출처**: https://ec.europa.eu/taxation_customs/tedb/ (TEDB — Tax European Database)

```typescript
// 추가할 15개국 경감세율 (핵심 HS Chapter만):
// ⚠️ 아래는 대표 패턴. 실제 구현 시 TEDB에서 각국별 정확한 Chapter 매핑 확인 필요

FI: {  // Finland: Standard 25.5%, Reduced 14%, Super-reduced 10%
  '01-05': 0.14,   // Foodstuffs (reduced)
  '06-14': 0.14,   // Agricultural (reduced)
  '15-24': 0.14,   // Food/Beverages (reduced, except alcohol)
  '30': 0.10,      // Pharmaceuticals (super-reduced)
  '49': 0.10,      // Books/Newspapers (super-reduced)
},
DK: {  // Denmark: Standard 25%, NO reduced rate (Denmark has no reduced VAT)
  // Denmark는 경감세율이 없음 — 전부 25%
},
CZ: {  // Czech Republic: Standard 21%, Reduced 12%
  '01-05': 0.12, '06-14': 0.12, '15-24': 0.12,
  '30': 0.12, '49': 0.12,
},
RO: {  // Romania: Standard 19%, Reduced 9%, Super-reduced 5%
  '01-05': 0.09, '06-14': 0.09, '15-24': 0.09,
  '30': 0.09, '49': 0.05,
},
HU: {  // Hungary: Standard 27%, Reduced 18%, Super-reduced 5%
  '01-05': 0.18, '06-14': 0.18, '15-24': 0.18,
  '30': 0.05, '49': 0.05,
},
BG: {  // Bulgaria: Standard 20%, Reduced 9%
  '01-05': 0.09, '06-14': 0.09, '49': 0.09,
},
HR: {  // Croatia: Standard 25%, Reduced 13%, Super-reduced 5%
  '01-05': 0.13, '06-14': 0.05, '30': 0.05, '49': 0.05,
},
SK: {  // Slovakia: Standard 23%, Reduced 10%, Super-reduced 5%
  '01-05': 0.10, '30': 0.10, '49': 0.05,
},
SI: {  // Slovenia: Standard 22%, Reduced 9.5%, Super-reduced 5%
  '01-05': 0.095, '30': 0.095, '49': 0.05,
},
LT: {  // Lithuania: Standard 21%, Reduced 9%, Super-reduced 5%
  '01-05': 0.09, '30': 0.05, '49': 0.09,
},
LV: {  // Latvia: Standard 21%, Reduced 12%, Super-reduced 5%
  '01-05': 0.12, '30': 0.12, '49': 0.05,
},
EE: {  // Estonia: Standard 22%, Reduced 9%
  '01-05': 0.09, '30': 0.09, '49': 0.09,
},
LU: {  // Luxembourg: Standard 17%, Reduced 8%, Super-reduced 3%
  '01-05': 0.03, '30': 0.03, '49': 0.03,
},
CY: {  // Cyprus: Standard 19%, Reduced 9%, Super-reduced 5%
  '01-05': 0.05, '30': 0.05, '49': 0.05,
},
MT: {  // Malta: Standard 18%, Reduced 7%, Super-reduced 5%
  '01-05': 0.05, '30': 0.05, '49': 0.05,
},
```

**⚠️ 중요**: 위 수치는 근사값. 구현 시 반드시 TEDB에서 최신값 확인하고 정확한 HS Chapter 매핑으로 구현할 것. 특히:
- 독일 Ch.22 알코올 문제 (이슈 #31): Ch.22 중 알코올(HS 2203-2208)은 경감세율 적용 안 됨 → 표준 19% 적용

```typescript
// 독일 Ch.22 수정 (이슈 #31):
DE: {
  // 변경 전: '22': 0.07  (Ch.22 전체 7%)
  // 변경 후:
  '2201-2202': 0.07,  // 물, 음료수 → 7%
  '2203-2208': 0.19,  // 맥주, 와인, 증류주 → 19% (표준)
  '2209': 0.07,       // 식초 → 7%
}
```

### 검증:
```
CN→FI, HS 0201 (쇠고기) → VAT 14% (경감) ✅ (기존: 25.5% 과다청구)
CN→LU, HS 3004 (의약품) → VAT 3% (초저) ✅ (기존: 17% 과다청구)
CN→DK, HS 0201 → VAT 25% ✅ (덴마크는 경감세율 없음)
CN→DE, HS 2204 (와인) → VAT 19% ✅ (알코올은 표준)
CN→DE, HS 2201 (물) → VAT 7% ✅ (식음료는 경감)
```

---

## P2-3: US MPF 상한/하한 업데이트 (이슈 #16)
**파일**: `app/lib/cost-engine/GlobalCostEngine.ts`
**문제**: MPF 상한/하한이 2023년 값 — 현재 값으로 업데이트 필요
**참고**: https://www.cbp.gov/trade/basic-import-export/merchandise-processing-fee

### 수정:
GlobalCostEngine.ts에서 MPF 관련 상수 찾아서:
```typescript
// 변경 전:
// US formal MPF: 0.3464%, min $31.67, max $614.35 (또는 $538.40)

// 변경 후 (2025/2026 fiscal year):
// US formal MPF: 0.3464%, min $32.71, max $634.04
const US_MPF_RATE = 0.003464;
const US_MPF_MIN = 32.71;
const US_MPF_MAX = 634.04;
const US_MPF_INFORMAL = 2.00;  // flat fee for informal entries
```

**CostEngine.ts MPF도 동기화** (이슈 #14, #15):
```typescript
// CostEngine.ts에서:
// 변경 전: MPF_INFORMAL = 5.50, CN-origin only
// 변경 후: MPF_INFORMAL = 2.00 (informal, all origins), MPF_FORMAL 동일 계산
// ⚠️ MPF는 모든 원산지에 적용 (CN만이 아님)
```

### 검증:
```
CN→US, $100,000 상품 → MPF = $346.40 (0.3464%) ✅
CN→US, $5,000 상품 → MPF = $32.71 (min cap) ✅
CN→US, $200,000 상품 → MPF = $634.04 (max cap) ✅
DE→US, $50,000 상품 → MPF = $173.20 ✅ (모든 원산지)
```

---

# ═══════════════════════════════════════════════════
# P3: ENHANCE — 중기 개선 (3건)
# ═══════════════════════════════════════════════════

## P3-1: Brazil IPI Chapter별 세율 (이슈 #11)
**파일**: `app/lib/cost-engine/CostEngine.ts`
**문제**: Brazil IPI 일괄 10% — 실제는 NCM(HS) 코드별 0~300% (TIPI 테이블)

### 수정:
IPI 주요 Chapter별 대표 세율 테이블 추가:
```typescript
const BRAZIL_IPI_RATES: Record<string, number> = {
  '22': 0.00,    // Beverages (most exempt, alcohol separately taxed)
  '24': 3.00,    // Tobacco (300%)
  '33': 0.22,    // Perfumes/cosmetics (22%)
  '34': 0.05,    // Soaps (5%)
  '39': 0.10,    // Plastics (10%)
  '61': 0.00,    // Knitted apparel (exempt)
  '62': 0.00,    // Woven apparel (exempt)
  '64': 0.10,    // Footwear (10%)
  '71': 0.12,    // Jewelry (12%)
  '84': 0.10,    // Machinery (5-15%, avg 10%)
  '85': 0.15,    // Electrical/Electronics (10-20%, avg 15%)
  '87': 0.25,    // Vehicles (7-25%, avg for passenger cars)
  '94': 0.05,    // Furniture (5%)
  '95': 0.20,    // Toys (20%)
  'default': 0.10,  // Default when chapter not mapped
};
```

**⚠️ 이것은 대표값**. 정확한 NCM별 세율은 Receita Federal TIPI 테이블(~14,000행) 필요 — DB 적재는 별도 작업.

### 검증:
```
CN→BR, HS 8517 (스마트폰) → IPI 15% (Ch.85) ✅ (기존 10%)
CN→BR, HS 6109 (티셔츠) → IPI 0% (Ch.61 의류 면세) ✅ (기존 10%)
CN→BR, HS 8703 (승용차) → IPI 25% (Ch.87) ✅ (기존 10%)
```

---

## P3-2: India IGST 97 Chapter 확장 (이슈 #12)
**파일**: `app/lib/cost-engine/CostEngine.ts`
**문제**: ~47/97 Chapter만 매핑, Ch.71 보석류 28%→3%(금) 오류

### 수정:
IGST 주요 세율 테이블 확장 (인도 GST 4단계: 5%, 12%, 18%, 28%):
```typescript
const INDIA_IGST_RATES: Record<string, number> = {
  // 5% (필수품)
  '01': 0.05, '02': 0.05, '03': 0.05, '04': 0.05, '05': 0.05,
  '07': 0.05, '08': 0.05, '09': 0.05, '10': 0.05, '11': 0.05,
  '12': 0.05, '15': 0.05, '17': 0.05, '19': 0.05,
  '49': 0.05,  // Books/printed matter
  // 12%
  '06': 0.12, '16': 0.12, '20': 0.12, '21': 0.12,
  '34': 0.12, '48': 0.12, '63': 0.12,
  // 18% (대부분)
  '22': 0.18, '25': 0.18, '27': 0.18, '28': 0.18, '29': 0.18,
  '30': 0.12, // Pharmaceuticals — 12% (most), some 5%
  '32': 0.18, '33': 0.18, '35': 0.18, '36': 0.18, '37': 0.18,
  '38': 0.18, '39': 0.18, '40': 0.18, '41': 0.18, '42': 0.18,
  '43': 0.18, '44': 0.18, '45': 0.18, '46': 0.18, '47': 0.18,
  '50': 0.05, '51': 0.05, '52': 0.05, '53': 0.05, '54': 0.18,
  '55': 0.18, '56': 0.18, '57': 0.18, '58': 0.18, '59': 0.18,
  '60': 0.18, '61': 0.12, '62': 0.12, // Apparel 12%
  '64': 0.18, '65': 0.18, '66': 0.18, '67': 0.18, '68': 0.18,
  '69': 0.18, '70': 0.18,
  '71': 0.03,  // ⭐ Precious metals/jewelry: 3% (gold/silver), NOT 28%
  '72': 0.18, '73': 0.18, '74': 0.18, '75': 0.18, '76': 0.18,
  '78': 0.18, '79': 0.18, '80': 0.18, '81': 0.18, '82': 0.18,
  '83': 0.18, '84': 0.18, '85': 0.18, '86': 0.18, '87': 0.28,
  '88': 0.18, '89': 0.18, '90': 0.18, '91': 0.18, '92': 0.18,
  '93': 0.18, '94': 0.18, '95': 0.18, '96': 0.18, '97': 0.18,
  // 28% (사치품)
  '24': 0.28,  // Tobacco
  // Ch.87 vehicles: 28% + Compensation Cess
  'default': 0.18,
};
```

### 검증:
```
CN→IN, HS 7108 (금) → IGST 3% ✅ (기존 28% 오류 수정)
CN→IN, HS 8703 (승용차) → IGST 28% + Cess ✅
CN→IN, HS 6109 (티셔츠) → IGST 12% ✅ (기존 18%)
CN→IN, HS 0201 (쇠고기) → IGST 5% ✅ (필수 식품)
```

---

## P3-3: RoO 적격성 로직 개선 (이슈 #18)
**파일**: `app/lib/trade/roo-engine.ts`
**문제**: 하나의 기준만 충족해도 적격 판정 — 실제는 FTA별 조합 조건 필요

### 수정:
```typescript
// 변경 전 (의사코드):
// if (WO || RVC || CTH || CC) return eligible

// 변경 후:
// FTA별 필수 조합 정의:
const FTA_ROO_REQUIREMENTS: Record<string, string[][]> = {
  'USMCA': [['RVC', 'CTH']],           // RVC AND CTH 둘 다 필요
  'KORUS': [['RVC'], ['CTH']],         // RVC OR CTH (하나만 OK)
  'CPTPP': [['RVC', 'CC'], ['WO']],    // (RVC AND CC) OR WO
  'RCEP':  [['RVC'], ['CTH'], ['WO']], // RVC OR CTH OR WO
  'EU-UK TCA': [['CTH', 'RVC']],       // CTH AND RVC
  'default': [['RVC'], ['CTH'], ['WO']], // 기본: OR 조건
};

function checkRoOEligibility(fta: string, criteria: Record<string, boolean>): boolean {
  const requirements = FTA_ROO_REQUIREMENTS[fta] || FTA_ROO_REQUIREMENTS['default'];
  // 하나의 조합이라도 전부 충족하면 적격
  return requirements.some(combo => combo.every(criterion => criteria[criterion]));
}
```

**savingsIfEligible 5% 하드코딩 수정** (이슈 #19):
```typescript
// 변경 전:
savingsIfEligible: 5  // hardcoded

// 변경 후:
savingsIfEligible: mfnRate - preferentialRate  // 실제 MFN vs 특혜 차이
// 또는 FTA 데이터에서 가져오기:
// const fta = findApplicableFta(origin, destination);
// savingsIfEligible: fta ? mfnRate * (1 - fta.preferentialRate) : 0
```

### 검증:
```
USMCA: RVC=true, CTH=true → eligible ✅
USMCA: RVC=true, CTH=false → NOT eligible ✅ (둘 다 필요)
KORUS: RVC=false, CTH=true → eligible ✅ (하나만 OK)
```

---

# ═══════════════════════════════════════════════════
# MEDIUM/LOW 이슈 (32건) — 함께 수정
# ═══════════════════════════════════════════════════

아래 이슈들은 P0~P3 수정 중에 해당 파일을 건드릴 때 함께 수정:

### Section 301 관련 (파일: section301-lookup.ts, duty-rates.ts)
- **#27**: Section 301 리스트에 2024 USTR 확장 항목 누락 → USTR 사이트에서 최신 리스트 확인 후 추가
- **#29**: duty-rates.ts의 Section 301 subheading entries가 dead code → 삭제 또는 활성화
- **#7**: Section 301 데이터 두 파일에 중복 → section301-lookup.ts를 single source of truth로 통일

### Duty Rate 관련 (파일: macmap-lookup.ts, duty-rates.ts)
- **#25**: Origin EU 매핑 누락 → macmap-lookup.ts에 origin도 EU 매핑 추가
- **#26**: lookupMacMapDutyRate가 AGR first hit 반환 (MIN이 더 낮을 수 있음) → lookupAllDutyRates 사용 확인
- **#28**: RCEP 0.5 multiplier → 실제 product-specific schedules 사용은 향후 과제 (주석으로 한계 명시)
- **#30**: getEffectiveDutyRate가 unknown에 0 반환 → null 반환 + 호출측에서 처리
- **#44**: rows[0] ORDER BY 없음 → `ORDER BY duty_rate ASC` 추가
- **#45**: Silent catch → console.error 또는 에러 로그 추가

### VAT 관련 (파일: eu-vat-rates.ts, ioss-oss.ts)
- **#9**: 프랑스 해외영토(GP,MQ,RE) 20%→8.5% → ioss-oss.ts에서 territory 분기 추가
- **#31**: 독일 Ch.22 알코올 → P2-2에서 함께 수정

### Special Tax 관련 (파일: CostEngine.ts)
- **#13**: 멕시코 IEPS 주류 26.5%→53% (증류주) → IEPS 세율 테이블에 주류 세분화
- **#33**: 중국 CBEC USD 하드코딩 → CNY 기준 + 환율 변환
- **#34**: 중국 소비세 6/12+ chapters → 추가 Chapter 매핑

### Customs Fees 관련 (파일: GlobalCostEngine.ts, CostEngine.ts)
- **#14, #15, #17**: CostEngine vs GlobalCostEngine MPF 불일치 → P2-3에서 통일
- **#35**: HMF 해운만 적용 → transport mode 파라미터 확인 후 조건 분기

### AD/CVD 관련 (파일: trade-remedy-lookup.ts)
- **#36**: 2-digit fallback → HS 코드 앞 2자리로 fallback 검색 추가
- **#37**: Fuzzy threshold 0.7 vs pg_trgm 0.3 → 0.5로 통일하거나 2단계 검색

### RoO 관련 (파일: roo-engine.ts)
- **#20**: WO 범위 확대 → Ch.25-27, 44-46 등 자연자원/농업 추가
- **#38**: PSR lookup 미구현 → 주석으로 한계 명시 + TODO

### Currency 관련 (파일: exchange-rate-service.ts)
- **#39**: Fallback rates 2025-01-01 → 2026-03-01로 업데이트 (현재 근사값)
- **#40**: Unknown currency rate 1.0 → null 반환 + 에러 로그

### Shipping/Insurance (파일: shipping-calculator.ts)
- **#41**: GB→EU 분류 수정 → GB를 별도 region으로
- **#42**: AU/NZ→ASIA 수정 → OCEANIA 별도 region 추가

### Sanctions (파일: db-screen.ts)
- **#46**: SANCTIONED_COUNTRIES에 BY(벨라루스) 추가

---

# ═══════════════════════════════════════════════════
# 실행 순서 요약
# ═══════════════════════════════════════════════════

```
Phase 1: P0 CRITICAL (2건)
├── P0-1: country-data.ts — US de minimis origin 분기 ($800/$0)
├── P0-2: export-controls.ts — Math.random() 제거 + deterministic 함수
├── npm run build ✅
└── 테스트 9건 실행

Phase 2: P1 URGENT (6건)
├── P1-1: section301-lookup.ts — aluminum 10%→25%
├── P1-2: section301-lookup.ts — 면제국 전면 철회
├── P1-3: fta.ts — EU-Mercosur isActive=false
├── P1-4: fta.ts — EU-UK TCA 추가
├── P1-5: export-controls.ts — Ch.87 ECCN 수정
├── P1-6: fuzzy-screening.ts — 테이블명 + SQL injection
├── npm run build ✅
└── 테스트 15건 실행

Phase 3: P2 IMPORTANT (3건)
├── P2-1: country-data.ts — EU 10개국 + Iceland de minimis
├── P2-2: eu-vat-rates.ts — 15개국 추가 + DE Ch.22 알코올
├── P2-3: GlobalCostEngine.ts + CostEngine.ts — MPF 통일
├── npm run build ✅
└── 테스트 16건 실행

Phase 4: P3 ENHANCE (3건)
├── P3-1: CostEngine.ts — Brazil IPI Chapter별
├── P3-2: CostEngine.ts — India IGST 97 Chapter
├── P3-3: roo-engine.ts — 적격성 로직 + savings 계산
├── npm run build ✅
└── 테스트 12건 실행

Phase 5: MEDIUM/LOW (32건)
├── 파일별 묶어서 수정 (section301, macmap, vat, special tax, fees, currency, shipping, sanctions)
├── npm run build ✅
└── 테스트 30건 실행

Phase 6: 회귀 테스트
├── 기존 TLC 33,015건 테스트 중 대표 50건 재실행
├── 모든 결과가 기존보다 정확하거나 동일한지 확인
├── 엑셀 최종 정리 (FIX_SUMMARY, REGRESSION_TEST)
└── npm run build 최종 ✅
```

---

## ⚠️ 수정 시 주의사항

1. **country-data.ts는 1,605줄** — deMinimisExceptions 필드를 타입에 추가해야 함 (interface 수정)
2. **fta.ts는 936줄** — EU-UK TCA 추가 시 EU_MEMBERS 배열 참조 확인
3. **GlobalCostEngine.ts는 1,734줄** — MPF 관련 코드가 여러 곳에 산재 → 검색으로 전부 찾기
4. **CostEngine.ts는 592줄** — Brazil/India/Mexico 섹션이 각각 독립적 → 하나씩 수정
5. **eu-vat-rates.ts는 234줄** — 15개국 추가하면 ~400줄로 증가 예상
6. **수정 후 import 경로 확인** — 새 타입/함수 추가 시 export 확인
7. **DB 테이블 확인 후 fuzzy-screening.ts 수정** — psql로 실제 테이블 구조 먼저 확인

---

> **이 파일의 수정 지시를 전부 완료하면:**
> 1. POTAL_46Issue_Fix_Log.xlsx 생성 (8시트)
> 2. CLAUDE.md, session-context.md 업데이트 (검수 완료 + 수정 완료 기록)
> 3. git add + commit (수정된 파일들)
> 4. 은태님에게 결과 보고
