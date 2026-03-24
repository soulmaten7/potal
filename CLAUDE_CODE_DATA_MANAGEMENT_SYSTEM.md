# Claude Code 명령어: 12 TLC 데이터 관리 시스템 구축

> **날짜**: 2026-03-23 KST (초안 — 검수 오류 수정 후 최종본으로 업데이트 예정)
> **목표**: 12개 TLC 기능에 사용되는 모든 데이터 파일의 자동 관리 시스템 구축 (12개 항목)
> **원칙**: 모든 데이터는 출처가 있고, 출처가 바뀌면 자동으로 감지하고, 감지되면 자동으로 업데이트하고, 실패하면 AI Agent가 자동으로 진단한다

---

## ⚠️ 절대 규칙

1. **엑셀 로깅 필수** (CLAUDE.md 절대 규칙 11번) — 시트명 `YYMMDDHHMM`
2. **한 항목씩 순서대로** — 항목 1 완료 후 항목 2로
3. **npm run build 매 수정마다**
4. **기존 코드 수정 금지, 추가만 가능** (v3 파이프라인 절대값 원칙)

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

## 결과 파일

### TypeScript 코드:
```
app/lib/data-management/
├── data-registry.ts          ← 항목 1: 파일 트리 맵 (전체 데이터 레지스트리)
├── update-tracker.ts         ← 항목 2: 최종 업데이트 날짜 추적
├── update-scheduler.ts       ← 항목 3: 업데이트 주기 스케줄러
├── source-verifier.ts        ← 항목 4: 업데이트 검증 소스 + 항목 8: URL/콘텐츠 검증
├── auto-updater.ts           ← 항목 5: 자동 업데이트 실행 코드
├── dependency-chain.ts       ← 항목 6: 의존성 체인
├── validation-rules.ts       ← 항목 7: 검증 규칙
├── error-handler.ts          ← 항목 9: 롤백 + 에러 상세 + AI Agent 자동 진단
├── cost-tracker.ts           ← 항목 10: 비용 추적
├── priority-manager.ts       ← 항목 11: 우선순위 레벨
├── audit-trail.ts            ← 항목 12: 감사 추적
└── index.ts                  ← 통합 export
```

### Vercel Cron:
```
app/api/v1/cron/data-management/route.ts   ← 매일 실행, 12항목 전체 점검
```

### DB 테이블:
```sql
data_management_registry      ← 파일 트리 + 메타데이터
data_update_log               ← 업데이트 이력 (감사 추적)
data_error_log                ← 에러 상세 + AI Agent 진단 결과
```

### 엑셀:
```
POTAL_Data_Management_System.xlsx
├── Sheet 1: Registry           ← 전체 파일 목록 + 12항목 매핑
├── Sheet 2: Update_Schedule    ← 업데이트 주기 + 다음 예정일
├── Sheet 3: Source_URLs        ← 검증 소스 URL + 상태
├── Sheet 4: Dependencies       ← 의존성 체인 다이어그램
├── Sheet 5: Error_History      ← 에러 이력 + 해결 상태
├── Sheet 6: Cost_Summary       ← 업데이트 비용 요약
├── Sheet 7: Audit_Trail        ← 변경 감사 이력
└── Sheet 8: Build_Log          ← 구축 과정 로그
```

---

# ═══════════════════════════════════════════
# 항목 1: 파일 트리 맵 (Data Registry)
# ═══════════════════════════════════════════

## 목표
12개 TLC 기능에 사용되는 **모든 파일**을 트리 형태로 정리. 각 파일의 역할, 데이터 유형, 행 수, 크기를 기록.

## 단계

### Step 1-1: 12개 Area별 파일 목록 추출

각 Area에서 사용하는 파일을 코드에서 import/require 추적하여 완전한 목록 생성:

```
Area 0 (Category):
├── app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts
│   └── MATERIAL_KEYWORDS (79그룹)
├── app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts
│   └── MATERIAL_TO_SECTION (116개), CATEGORY_TO_SECTION (128개)
├── app/lib/cost-engine/gri-classifier/steps/v3/step2-2-section-notes.ts
│   └── codified-rules.ts (592개 규칙)
├── app/lib/cost-engine/gri-classifier/steps/v3/step2-3-chapter-candidate.ts
├── app/lib/cost-engine/gri-classifier/steps/v3/step2-4-chapter-notes.ts
├── app/lib/cost-engine/gri-classifier/steps/v3/step3-heading.ts
│   └── KEYWORD_TO_HEADINGS (400 inline + 13,449 extended JSON)
├── app/lib/cost-engine/gri-classifier/steps/v3/step4-subheading.ts
├── app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3.ts
├── app/lib/cost-engine/gri-classifier/data/codified-rules.ts (592개)
├── app/lib/cost-engine/gri-classifier/data/codified-headings.ts (1,233개)
├── app/lib/cost-engine/gri-classifier/data/codified-subheadings.ts (5,621개)
├── app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts (1,233개)
├── app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts (97개)
└── app/lib/cost-engine/gri-classifier/data/extended-heading-keywords.json (13,449개)

Area 1 (Duty Rate):
├── app/lib/cost-engine/macmap-lookup.ts
├── app/lib/cost-engine/section301-lookup.ts
├── app/lib/cost-engine/trade-remedy-lookup.ts
├── app/lib/cost-engine/duty-rate-lookup.ts
├── app/lib/cost-engine/fta.ts (또는 FTA 관련 파일)
├── app/lib/cost-engine/duty-rates.ts
└── DB: macmap_ntlc_rates, macmap_min_rates, macmap_agr_rates, trade_remedy_cases/products/duties, gov_tariff_schedules

Area 2 (VAT/GST):
├── app/lib/cost-engine/GlobalCostEngine.ts (VAT 섹션)
├── app/lib/cost-engine/eu-vat-rates.ts
├── app/lib/cost-engine/ioss-engine.ts (또는 ioss-oss.ts)
└── DB: vat_gst_rates (240개국)

Area 3 (De Minimis):
├── app/lib/cost-engine/country-data.ts (deMinimis 필드)
└── DB: de_minimis_thresholds (240개국)

Area 4 (Special Tax):
├── app/lib/cost-engine/CostEngine.ts (특수세금 섹션)
├── app/lib/cost-engine/GlobalCostEngine.ts (특수세금 섹션)
└── (12개국 특수세금: CN CBEC/CT, IN IGST, BR IPI, MX IEPS, KR Ed/Local, ID Luxury, TH Excise 등)

Area 5 (Customs Fees):
├── app/lib/cost-engine/CostEngine.ts (MPF/HMF 섹션)
├── app/lib/cost-engine/GlobalCostEngine.ts (customs fees 섹션)
└── DB: customs_fees (240개국)

Area 6 (AD/CVD):
├── app/lib/cost-engine/trade-remedy-lookup.ts
└── DB: trade_remedy_cases, trade_remedy_products, trade_remedy_duties, safeguard_exemptions

Area 7 (RoO):
├── app/lib/trade/roo-engine.ts
├── DB: macmap_trade_agreements (1,319건)
└── (FTA별 PSR 미구현 — 향후 추가)

Area 8 (Currency):
├── app/lib/cost-engine/exchange-rate/exchange-rate-service.ts
└── External: ECB API (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml)

Area 9 (Insurance/Shipping):
├── app/lib/shipping/shipping-calculator.ts
├── app/lib/cost-engine/insurance-calculator.ts
└── (추정치 기반 — 외부 데이터 소스 없음)

Area 10 (Export Controls):
├── app/lib/compliance/export-controls.ts
└── External: BIS CCL (미구현, 9 Chapter 하드코딩만)

Area 11 (Sanctions):
├── app/lib/compliance/fuzzy-screening.ts
├── app/lib/compliance/db-screen.ts
└── DB: sanctions_entries, sanctions_aliases, sanctions_addresses, sanctions_ids
```

### Step 1-2: data-registry.ts 구현

```typescript
// app/lib/data-management/data-registry.ts

interface DataFile {
  path: string;                    // 파일 경로
  area: number;                    // TLC Area (0-11)
  areaName: string;                // Area 이름
  type: 'code' | 'data' | 'db' | 'external'; // 유형
  description: string;             // 역할 설명
  recordCount?: number;            // 행/항목 수
  sizeKB?: number;                 // 파일 크기 (KB)
  lastVerified?: string;           // 마지막 검증 시간 (ISO)
  sourceUrl?: string;              // 원본 데이터 소스 URL
  updateFrequency?: string;        // 업데이트 주기
  dependencies?: string[];         // 의존하는 파일들
  priority: 'P0' | 'P1' | 'P2' | 'P3'; // 우선순위
}

// 전체 레지스트리를 배열로 정의
export const DATA_REGISTRY: DataFile[] = [
  // ... 위 트리의 모든 파일을 배열로
];
```

**모든 파일을 코드에서 import 추적하여 누락 없이 등록한다.**
**DB 테이블도 포함 — 테이블명, 행 수, 마지막 업데이트 시각.**

---

# ═══════════════════════════════════════════
# 항목 2: 최종 업데이트 날짜 추적 (Update Tracker)
# ═══════════════════════════════════════════

## 목표
각 데이터 파일/DB 테이블의 최종 업데이트 날짜를 자동 추적. "이 데이터가 언제 마지막으로 갱신됐는가?"

## 단계

### Step 2-1: update-tracker.ts 구현

```typescript
// app/lib/data-management/update-tracker.ts

interface UpdateRecord {
  fileId: string;          // data-registry의 path 또는 테이블명
  lastUpdated: string;     // ISO timestamp
  updatedBy: string;       // 'cron' | 'manual' | 'migration' | 'script'
  version: string;         // 데이터 버전 (예: '2026-03-23')
  changeType: string;      // 'full_refresh' | 'incremental' | 'fix' | 'add'
  recordsBefore?: number;  // 변경 전 행 수
  recordsAfter?: number;   // 변경 후 행 수
}
```

### Step 2-2: DB 테이블은 pg_stat_user_tables에서 자동 추적

```sql
-- 각 테이블의 마지막 변경 시점
SELECT schemaname, relname, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE relname IN ('macmap_ntlc_rates', 'macmap_min_rates', 'macmap_agr_rates', 'vat_gst_rates', ...);
```

### Step 2-3: 코드 파일은 git log에서 자동 추적

```bash
git log -1 --format="%ai" -- app/lib/cost-engine/section301-lookup.ts
```

---

# ═══════════════════════════════════════════
# 항목 3: 업데이트 주기 스케줄러 (Update Schedule)
# ═══════════════════════════════════════════

## 목표
각 데이터의 "얼마나 자주 바뀌는가" + "얼마나 자주 확인해야 하는가" 정의.

## 단계

### Step 3-1: 데이터별 업데이트 주기 정의

```
실시간 (매일):
- 환율 (ECB daily XML)
- 제재 리스트 (OFAC SDN — 불규칙하지만 매일 확인)

주간:
- 관세율 변경 (48개국 관세청 페이지 해시)
- 분류 결정문 (CBP CROSS, EU EBTI)
- FTA 변경 (WTO RTA-IS)
- 무역구제 (AD/CVD 신규 고시)

월간:
- MacMap/WITS 데이터 갱신
- WCO 뉴스 (HS 개정)
- VAT/GST 세율 변경 (각국 세법 개정 주기)
- De Minimis 기준 변경 (드묾)
- 특수세금 세율 변경 (각국 예산안 시기)

분기:
- 수출통제 리스트 (BIS EAR 업데이트)
- US MPF 상한/하한 (매년 조정, 분기 확인)

연간:
- WCO HS 코드 개정 (5년 주기, 2022→2027)
- Section/Chapter Notes 변경 (HS 개정 시)

변경 없음 (불변):
- 보험/배송 추정 로직 (수식)
- GRI 규칙 (국제법, 거의 안 바뀜)
```

### Step 3-2: update-scheduler.ts 구현

```typescript
// app/lib/data-management/update-scheduler.ts

interface UpdateSchedule {
  fileId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'immutable';
  cronExpression?: string;      // Vercel Cron 표현식
  nextCheck: string;            // 다음 확인 예정 시각
  lastCheck: string;            // 마지막 확인 시각
  checkMethod: string;          // 'api_call' | 'page_hash' | 'rss' | 'manual'
  sourceUrl: string;            // 확인할 소스 URL
}
```

### Step 3-3: 기존 22개 Vercel Cron과 통합

이미 구현된 Cron:
- federal-register-monitor (매일)
- taric-rss-monitor (매일)
- tariff-change-monitor (매주)
- classification-ruling-monitor (매주)
- macmap-update-monitor (매월)
- wco-news-monitor (매월)
- fta-change-monitor (매주)
- exchange-rate-sync (매일)
- 등등

→ 이 Cron들의 결과를 data-management 시스템에 자동 연결.

---

# ═══════════════════════════════════════════
# 항목 4: 업데이트 검증 소스 (Source Verification)
# ═══════════════════════════════════════════

## 목표
각 데이터가 "어디서 왔는가" + "어디서 최신값을 확인할 수 있는가" 명시.

## 단계

### Step 4-1: 소스별 검증 URL 정의

```
Area 1 (Duty Rate):
- MFN: https://wits.worldbank.org/ (WITS API)
- MIN: https://www.macmap.org/ (MacMap)
- AGR: https://www.macmap.org/ (MacMap)
- Section 301: https://ustr.gov/issue-areas/enforcement/section-301-investigations
- Section 232: https://www.federalregister.gov/ (Steel/Aluminum)
- FTA: https://rtais.wto.org/ (WTO RTA)

Area 2 (VAT/GST):
- EU: https://ec.europa.eu/taxation_customs/tedb/ (TEDB)
- 각국: 해당 국가 세무청 웹사이트

Area 3 (De Minimis):
- 각국: https://www.wcoomd.org/ + 각국 관세청

Area 4 (Special Tax):
- Brazil IPI: https://www.gov.br/receitafederal/
- India IGST: https://cbic-gst.gov.in/
- Mexico IEPS: https://www.sat.gob.mx/
- China CBEC: http://www.customs.gov.cn/

Area 5 (Customs Fees):
- US MPF: https://www.cbp.gov/trade/basic-import-export/internet-purchases
- 각국: 해당 관세청

Area 6 (AD/CVD):
- US: https://www.trade.gov/enforcement-and-compliance (TTBD)
- EU: https://tron.trade.ec.europa.eu/

Area 8 (Currency):
- ECB: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml

Area 10 (Export Controls):
- BIS: https://www.bis.doc.gov/index.php/regulations/commerce-control-list-ccl

Area 11 (Sanctions):
- OFAC SDN: https://sanctionslist.ofac.treas.gov/Home/SdnList
- CSL: https://api.trade.gov/consolidated_screening_list/
```

### Step 4-2: source-verifier.ts 구현

항목 8 (콘텐츠 검증)과 통합.

---

# ═══════════════════════════════════════════
# 항목 5: 자동 업데이트 실행 코드 (Auto-Updater)
# ═══════════════════════════════════════════

## 목표
변경 감지 → 자동 다운로드 → 파싱 → DB/파일 업데이트까지 코드화.

## 단계

### Step 5-1: auto-updater.ts 구현

```typescript
// app/lib/data-management/auto-updater.ts

interface UpdateJob {
  fileId: string;
  sourceUrl: string;
  fetchMethod: 'api_json' | 'api_xml' | 'page_scrape' | 'file_download' | 'rss';
  parseMethod: 'json' | 'xml' | 'csv' | 'html_table' | 'custom';
  targetType: 'db_table' | 'ts_file' | 'json_file';
  targetPath: string;            // DB 테이블명 또는 파일 경로
  validationRule: string;        // 항목 7 참조
  rollbackEnabled: boolean;
}

async function executeUpdate(job: UpdateJob): Promise<UpdateResult> {
  // 1. 현재 데이터 백업 (rollback용)
  // 2. 소스에서 데이터 fetch
  // 3. 파싱
  // 4. 검증 (항목 7 규칙 적용)
  // 5. 적용 (DB INSERT/UPDATE 또는 파일 쓰기)
  // 6. 적용 후 검증 (행 수 확인, 샘플 대조)
  // 7. 성공 시 감사 로그, 실패 시 롤백 + 에러 로그
}
```

### Step 5-2: 기존 Cron에 auto-updater 연결

각 Cron이 변경 감지하면 → auto-updater.executeUpdate() 호출 → 결과 data_update_log에 기록.

---

# ═══════════════════════════════════════════
# 항목 6: 의존성 체인 (Dependency Chain)
# ═══════════════════════════════════════════

## 목표
"A 데이터가 바뀌면 B도 업데이트해야 한다" 체인 정의.

## 단계

### Step 6-1: dependency-chain.ts 구현

```typescript
// app/lib/data-management/dependency-chain.ts

// 핵심 의존성 체인:
//
// HS Code 변경 → 관세율 재매핑 → FTA 적용 재계산 → precomputed 캐시 무효화
//
// ECB 환율 변경 → 모든 비USD 계산 재실행
//
// Section 301 변경 → duty-rates.ts 업데이트 → precomputed_landed_costs 갱신
//
// OFAC SDN 변경 → sanctions_entries 업데이트 → fuzzy-screening 재인덱싱
//
// EU VAT 변경 → eu-vat-rates.ts + vat_gst_rates DB

const DEPENDENCY_CHAINS: DependencyChain[] = [
  {
    trigger: 'macmap_ntlc_rates',
    dependents: ['precomputed_landed_costs', 'duty-rate-lookup.ts'],
    action: 'recalculate',
    priority: 'P0'
  },
  {
    trigger: 'exchange-rate-service.ts',
    dependents: ['GlobalCostEngine.ts (all non-USD calculations)'],
    action: 'no_action_needed',  // 실시간 조회라 캐시 없음
    priority: 'P1'
  },
  {
    trigger: 'section301-lookup.ts',
    dependents: ['duty-rates.ts', 'precomputed_landed_costs'],
    action: 'recalculate_us_cn',
    priority: 'P0'
  },
  {
    trigger: 'sanctions_entries',
    dependents: ['fuzzy-screening.ts index', 'db-screen.ts'],
    action: 'rebuild_index',
    priority: 'P0'
  },
  {
    trigger: 'eu-vat-rates.ts',
    dependents: ['GlobalCostEngine.ts (EU VAT section)'],
    action: 'no_action_needed',  // 코드 내장이라 자동 반영
    priority: 'P1'
  },
  {
    trigger: 'gov_tariff_schedules',
    dependents: ['country-agents/data/*.json', 'base-agent.ts'],
    action: 'rebuild_country_agents',
    priority: 'P1'
  },
  // ... 전체 체인 정의
];
```

---

# ═══════════════════════════════════════════
# 항목 7: 검증 규칙 (Validation Rules)
# ═══════════════════════════════════════════

## 목표
업데이트된 데이터가 "올바른가" 자동 검증.

## 단계

### Step 7-1: validation-rules.ts 구현

```typescript
// app/lib/data-management/validation-rules.ts

interface ValidationRule {
  fileId: string;
  rules: {
    // 행 수 검증
    minRows?: number;        // 최소 행 수 (이전보다 크게 줄면 이상)
    maxRowDelta?: number;    // 이전 대비 최대 변동률 (%)

    // 값 범위 검증
    fieldRanges?: {
      field: string;
      min?: number;
      max?: number;
    }[];

    // 필수 값 존재 검증
    requiredValues?: {
      field: string;
      values: string[];      // 이 값들이 반드시 있어야 함
    }[];

    // 교차 검증
    crossCheck?: {
      otherFile: string;
      joinField: string;
      mustMatch: string[];   // 매칭되어야 하는 필드
    };

    // 커스텀 검증 함수
    customValidator?: string; // 함수명
  }[];
}

// 예시:
const VALIDATION_RULES: ValidationRule[] = [
  {
    fileId: 'macmap_ntlc_rates',
    rules: [{
      minRows: 500000,               // 최소 50만행 (현재 537K)
      maxRowDelta: 10,               // 10% 이상 변동 시 경고
      fieldRanges: [
        { field: 'duty_rate', min: 0, max: 300 },  // 관세율 0~300%
        { field: 'hs_code', min: 6 }                 // HS 코드 최소 6자리
      ],
      requiredValues: [
        { field: 'reporter', values: ['USA', 'EU', 'GBR', 'JPN', 'KOR'] }  // 주요국 반드시 존재
      ]
    }]
  },
  {
    fileId: 'vat_gst_rates',
    rules: [{
      minRows: 240,                   // 정확히 240개국
      fieldRanges: [
        { field: 'standard_rate', min: 0, max: 50 }  // VAT 0~50%
      ]
    }]
  },
  {
    fileId: 'sanctions_entries',
    rules: [{
      minRows: 20000,                 // 최소 2만건 (현재 21K)
      maxRowDelta: 5,                 // 5% 이상 변동 시 경고
    }]
  },
  // ... 각 데이터별 정의
];
```

---

# ═══════════════════════════════════════════
# 항목 8: 콘텐츠 검증 + URL 자동 추적 (Content Verification)
# ═══════════════════════════════════════════

## 목표
URL이 HTTP 200을 반환해도, **실제 콘텐츠가 업데이트에 필요한 내용인지** 검증.
콘텐츠가 이동된 경우 자동으로 새 URL을 탐색.

## 핵심 원칙 (은태님 설계):
- HTTP 200 ≠ 정상. URL이 살아있어도 **콘텐츠가 다른 곳으로 이동**했을 수 있다
- **expected_pattern**: 해당 URL에서 반드시 발견되어야 하는 키워드/구조/데이터 형식
- 패턴이 없으면 → URL은 더 이상 유효하지 않음 → 새 URL 탐색 시작

## 단계

### Step 8-1: source-verifier.ts (항목 4와 통합) 구현

```typescript
// app/lib/data-management/source-verifier.ts

interface SourceVerification {
  fileId: string;
  sourceUrl: string;

  // ⭐ 핵심: 콘텐츠 검증 패턴
  expectedPattern: {
    keywords: string[];          // 반드시 포함해야 하는 키워드 (예: ["MFN", "tariff rate", "HS code"])
    dataStructure?: string;      // 예상 데이터 구조 (예: "JSON array", "HTML table", "XML")
    minContentLength?: number;   // 최소 콘텐츠 길이 (바이트)
    sampleValues?: string[];     // 반드시 포함해야 하는 샘플 값 (예: ["8471.30", "0%"])
  };

  // URL 무효화 시 대체 탐색 전략
  fallbackStrategy: {
    searchQueries: string[];     // 구글/DuckDuckGo 검색 쿼리
    knownAlternativeUrls: string[];  // 알려진 대체 URL 목록
    parentPageUrl?: string;      // 상위 페이지에서 새 링크 탐색
  };

  // 검증 이력
  lastVerified: string;
  lastStatus: 'valid' | 'content_moved' | 'url_dead' | 'structure_changed';
  contentHash: string;           // 콘텐츠 해시 (변경 감지용)
}

async function verifySource(source: SourceVerification): Promise<VerificationResult> {
  // 1. HTTP 요청
  const response = await fetch(source.sourceUrl);

  // 2. HTTP 상태 코드 체크 (기본)
  if (response.status !== 200) {
    return { status: 'url_dead', needsNewUrl: true };
  }

  // 3. ⭐ 콘텐츠 패턴 검증 (핵심)
  const content = await response.text();

  // 3a. 키워드 존재 확인
  const keywordsMissing = source.expectedPattern.keywords.filter(
    kw => !content.toLowerCase().includes(kw.toLowerCase())
  );

  if (keywordsMissing.length > source.expectedPattern.keywords.length * 0.5) {
    // 키워드 50% 이상 누락 = 콘텐츠 이동
    return { status: 'content_moved', needsNewUrl: true, missingKeywords: keywordsMissing };
  }

  // 3b. 데이터 구조 확인
  if (source.expectedPattern.dataStructure === 'JSON array') {
    try { JSON.parse(content); } catch { return { status: 'structure_changed' }; }
  }

  // 3c. 최소 길이 확인
  if (source.expectedPattern.minContentLength && content.length < source.expectedPattern.minContentLength) {
    return { status: 'content_moved', reason: 'Content too short' };
  }

  // 4. 콘텐츠 해시 비교 (변경 감지)
  const newHash = computeHash(content);
  if (newHash !== source.contentHash) {
    return { status: 'valid', contentChanged: true, newHash };
  }

  return { status: 'valid', contentChanged: false };
}

async function findNewUrl(source: SourceVerification): Promise<string | null> {
  // 1. 알려진 대체 URL 순차 시도
  for (const altUrl of source.fallbackStrategy.knownAlternativeUrls) {
    const result = await verifySource({ ...source, sourceUrl: altUrl });
    if (result.status === 'valid') return altUrl;
  }

  // 2. 상위 페이지에서 링크 탐색
  if (source.fallbackStrategy.parentPageUrl) {
    const links = await extractLinks(source.fallbackStrategy.parentPageUrl);
    for (const link of links) {
      if (matchesExpectedPattern(link, source.expectedPattern)) return link;
    }
  }

  // 3. 검색 엔진으로 탐색
  for (const query of source.fallbackStrategy.searchQueries) {
    const searchResults = await searchWeb(query);
    for (const result of searchResults) {
      const verified = await verifySource({ ...source, sourceUrl: result.url });
      if (verified.status === 'valid') return result.url;
    }
  }

  // 4. 찾지 못함 → 에러 로그 + AI Agent 진단 요청
  return null;
}
```

---

# ═══════════════════════════════════════════
# 항목 9: 롤백 + 에러 상세 + AI Agent 자동 진단
# ═══════════════════════════════════════════

## 목표
업데이트 실패 시: (1) 롤백, (2) 에러 전체 상세 기록, (3) AI Agent Organization이 자동으로 진단하고 해결.

## 핵심 원칙 (은태님 설계):
- 에러 발생 시 **모든 관련 정보**를 기록: 사용된 파일, 콘텐츠, 출처 URL, 결과, 실패 이유
- AI Agent Organization의 D4 (Data Pipeline)가 에러를 확인 → 원인 파악 → 수정 → 재실행
- 사람 개입 없이 **자동 복구** 가능한 구조

## 단계

### Step 9-1: error-handler.ts 구현

```typescript
// app/lib/data-management/error-handler.ts

interface DataError {
  errorId: string;               // 고유 에러 ID
  timestamp: string;             // 발생 시각
  fileId: string;                // 영향받는 데이터
  area: number;                  // TLC Area

  // ⭐ 에러 상세 (은태님 요구: 모든 관련 정보)
  context: {
    filesUsed: string[];         // 업데이트에 사용된 모든 파일 경로
    contentSnapshot: string;     // 사용된 콘텐츠 (또는 콘텐츠 해시 + 저장 경로)
    sourceUrl: string;           // 출처 URL
    fetchedData: string;         // fetch한 raw 데이터 (저장 경로)
    expectedResult: string;      // 기대 결과
    actualResult: string;        // 실제 결과
    failureReason: string;       // 실패 이유 상세
    stackTrace?: string;         // 에러 스택트레이스
  };

  // 롤백 정보
  rollback: {
    backupPath: string;          // 백업 데이터 위치
    rollbackExecuted: boolean;   // 롤백 실행 여부
    rollbackSuccess: boolean;    // 롤백 성공 여부
  };

  // AI Agent 진단
  aiDiagnosis: {
    diagnosedBy: string;         // 'D4_DataPipeline' 등
    diagnosisTimestamp: string;
    rootCause: string;           // AI가 판단한 근본 원인
    suggestedFix: string;        // AI가 제안한 수정 방법
    autoFixAttempted: boolean;   // 자동 수정 시도 여부
    autoFixSuccess: boolean;     // 자동 수정 성공 여부
    requiresHuman: boolean;      // 사람 개입 필요 여부
  };

  status: 'open' | 'diagnosed' | 'auto_fixed' | 'manual_required' | 'resolved';
}

async function handleUpdateError(error: Partial<DataError>): Promise<void> {
  // 1. 에러 상세 기록 (DB: data_error_log)
  const errorRecord = await logError(error);

  // 2. 롤백 실행
  if (error.rollback?.backupPath) {
    await executeRollback(error.rollback.backupPath, error.fileId);
  }

  // 3. AI Agent Organization D4에 진단 요청
  const diagnosis = await requestAIDiagnosis(errorRecord);

  // 4. 자동 수정 가능하면 실행
  if (diagnosis.autoFixPossible) {
    const fixResult = await executeAutoFix(diagnosis.suggestedFix, error.fileId);
    if (fixResult.success) {
      // 5. 수정 후 재검증
      const revalidation = await revalidateAfterFix(error.fileId);
      if (revalidation.passed) {
        await updateErrorStatus(errorRecord.errorId, 'auto_fixed');
        return;
      }
    }
  }

  // 6. 자동 수정 불가 → manual_required + 알림
  await updateErrorStatus(errorRecord.errorId, 'manual_required');
  await sendAlert({
    channel: 'telegram',  // 또는 email
    message: `🔴 Data update error requires manual intervention\n` +
             `Area: ${error.area}\n` +
             `File: ${error.fileId}\n` +
             `Reason: ${error.context?.failureReason}\n` +
             `AI Diagnosis: ${diagnosis.rootCause}`
  });
}
```

### Step 9-2: AI Agent 자동 진단 로직

```typescript
async function requestAIDiagnosis(error: DataError): Promise<AIDiagnosis> {
  // D4 Data Pipeline Agent가 에러를 분석
  //
  // 진단 가능한 패턴:
  // 1. URL 변경 → 항목 8의 findNewUrl() 실행
  // 2. 데이터 형식 변경 → 파서 업데이트 필요 → 코드 변경 제안
  // 3. API 인증 만료 → 토큰 갱신
  // 4. DB 용량 초과 → 정리 또는 파티셔닝 제안
  // 5. 네트워크 타임아웃 → 재시도
  // 6. 데이터 값 이상 (validation 실패) → 소스 확인 후 판단
  //
  // 자동 수정 가능: 패턴 1(URL), 3(토큰), 5(재시도)
  // 수동 필요: 패턴 2(코드 변경), 4(인프라), 6(데이터 판단)
}
```

---

# ═══════════════════════════════════════════
# 항목 10: 비용 추적 (Cost Tracker)
# ═══════════════════════════════════════════

## 목표
데이터 업데이트에 드는 비용 추적. API 호출 비용, LLM 토큰 비용, 인프라 비용.

## 단계

### Step 10-1: cost-tracker.ts 구현

```typescript
// app/lib/data-management/cost-tracker.ts

interface UpdateCost {
  fileId: string;
  timestamp: string;
  costs: {
    apiCalls: number;           // 외부 API 호출 횟수
    apiCost: number;            // API 호출 비용 ($)
    llmTokens: number;          // LLM 토큰 수
    llmCost: number;            // LLM 비용 ($)
    dbOperations: number;       // DB 쿼리 횟수
    bandwidthMB: number;        // 네트워크 사용량 (MB)
    computeSeconds: number;     // 실행 시간 (초)
  };
  totalCost: number;            // 합계 ($)
}

// 현재 비용 구조 (대부분 $0):
// - 환율: ECB XML = 무료
// - MacMap: 무료 (공개 데이터)
// - WITS: 무료 (World Bank)
// - OFAC SDN: 무료 (정부 데이터)
// - LLM (HS 분류 Layer 2): ~$0.001/건 (GPT-4o-mini)
// - Supabase: $25/월 (고정)
// - Vercel: $20/월 (고정)
```

---

# ═══════════════════════════════════════════
# 항목 11: 우선순위 레벨 (Priority Manager)
# ═══════════════════════════════════════════

## 목표
데이터별 우선순위 정의. 장애 시 어떤 데이터를 먼저 복구할 것인가.

## 단계

### Step 11-1: priority-manager.ts 구현

```typescript
// app/lib/data-management/priority-manager.ts

// P0 (즉시 복구 — 서비스 중단 영향):
// - macmap_ntlc_rates (MFN 관세율 — 핵심 계산)
// - vat_gst_rates (VAT — 핵심 계산)
// - exchange-rate (환율 — 모든 비USD 계산)
// - sanctions_entries (제재 — 법적 의무)
// - de_minimis_thresholds (면세 기준)

// P1 (24시간 내 — 정확도 영향):
// - macmap_min_rates, macmap_agr_rates (최저/농산물 세율)
// - trade_remedy_cases/products/duties (AD/CVD)
// - gov_tariff_schedules (7개국 10자리)
// - eu-vat-rates.ts (EU 경감세율)
// - section301-lookup.ts (US-CN 추가관세)

// P2 (1주일 내 — 기능 확장):
// - product_hs_mappings (HS 분류 캐시)
// - hs_classification_vectors (벡터 검색)
// - precomputed_landed_costs (사전 계산 캐시)
// - customs_fees (통관 수수료)

// P3 (1개월 내 — 보강):
// - country-data.ts (240개국 프로필)
// - roo-engine.ts (RoO — PSR 미구현)
// - export-controls.ts (수출통제 — 9 Chapter만)
// - shipping/insurance (추정치)
```

---

# ═══════════════════════════════════════════
# 항목 12: 감사 추적 (Audit Trail)
# ═══════════════════════════════════════════

## 목표
모든 데이터 변경을 추적. 누가, 언제, 무엇을, 왜 바꿨는지 기록.

## 단계

### Step 12-1: audit-trail.ts 구현

```typescript
// app/lib/data-management/audit-trail.ts

interface AuditEntry {
  auditId: string;
  timestamp: string;
  fileId: string;
  area: number;

  actor: string;                // 'cron:exchange-rate' | 'manual:euntae' | 'auto-fix:d4'
  action: 'create' | 'update' | 'delete' | 'rollback' | 'validate' | 'verify';

  before: {                     // 변경 전
    recordCount?: number;
    sampleData?: string;        // 변경 전 샘플 (최대 5건)
    hash?: string;
  };

  after: {                      // 변경 후
    recordCount?: number;
    sampleData?: string;
    hash?: string;
  };

  reason: string;               // 변경 사유
  sourceUrl?: string;           // 데이터 출처
  validationPassed: boolean;    // 검증 통과 여부

  relatedErrors?: string[];     // 관련 에러 ID (있으면)
}
```

### Step 12-2: DB 테이블 생성

```sql
CREATE TABLE data_update_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT NOT NULL,
  area INTEGER NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  source_url TEXT,
  validation_passed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_error_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT NOT NULL,
  area INTEGER NOT NULL,
  error_context JSONB NOT NULL,
  rollback_info JSONB,
  ai_diagnosis JSONB,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_update_log_file ON data_update_log(file_id);
CREATE INDEX idx_update_log_area ON data_update_log(area);
CREATE INDEX idx_update_log_created ON data_update_log(created_at DESC);
CREATE INDEX idx_error_log_status ON data_error_log(status);
CREATE INDEX idx_error_log_area ON data_error_log(area);
```

---

# ═══════════════════════════════════════════
# 통합 Cron: 매일 12항목 전체 점검
# ═══════════════════════════════════════════

```typescript
// app/api/v1/cron/data-management/route.ts
// Vercel Cron: 매일 02:00 UTC

export async function GET(request: Request) {
  // 1. 항목 1: 레지스트리 정합성 확인 (파일 존재 여부)
  // 2. 항목 2: 업데이트 날짜 체크 (오래된 데이터 경고)
  // 3. 항목 3: 스케줄 확인 (오늘 업데이트 예정인 데이터)
  // 4. 항목 4+8: 소스 URL 검증 (콘텐츠 패턴 확인)
  // 5. 항목 5: 예정된 자동 업데이트 실행
  // 6. 항목 6: 의존성 체인 확인 (cascade 필요 여부)
  // 7. 항목 7: 검증 규칙 실행 (값 범위, 행 수)
  // 8. 항목 9: 미해결 에러 확인 + AI 재진단
  // 9. 항목 10: 비용 집계
  // 10. 항목 11: 우선순위별 상태 요약
  // 11. 항목 12: 감사 로그 정리 (30일 이전 아카이브)
  // 12. Morning Brief에 결과 포함
}
```

---

# ═══════════════════════════════════════════
# 실행 순서
# ═══════════════════════════════════════════

```
Phase 1: 기반 구축
├── Step A: DB 테이블 생성 (data_update_log, data_error_log)
├── Step B: data-registry.ts (항목 1 — 전체 파일 목록)
├── Step C: update-tracker.ts (항목 2 — 날짜 추적)
└── Step D: priority-manager.ts (항목 11 — 우선순위)

Phase 2: 검증 체계
├── Step E: source-verifier.ts (항목 4+8 — 소스 + 콘텐츠 검증)
├── Step F: validation-rules.ts (항목 7 — 검증 규칙)
├── Step G: dependency-chain.ts (항목 6 — 의존성)
└── Step H: audit-trail.ts (항목 12 — 감사 추적)

Phase 3: 자동화
├── Step I: auto-updater.ts (항목 5 — 자동 업데이트)
├── Step J: update-scheduler.ts (항목 3 — 스케줄)
├── Step K: error-handler.ts (항목 9 — 에러 + AI 진단)
└── Step L: cost-tracker.ts (항목 10 — 비용)

Phase 4: 통합
├── Step M: index.ts (통합 export)
├── Step N: Cron route (매일 점검)
├── Step O: 기존 22개 Cron에 연결
└── Step P: 엑셀 생성 + npm run build 확인

Phase 5: 검증
├── Step Q: 12항목 전체 동작 테스트
├── Step R: 에러 시나리오 테스트 (URL 죽음, 콘텐츠 이동, DB 오류)
├── Step S: AI Agent 자동 진단 테스트
└── Step T: Morning Brief에 데이터 관리 상태 추가
```

---

> ⚠️ **이 파일은 초안입니다.**
> 검수에서 발견된 46건 오류 수정 후, 수정된 파일/값에 맞게 항목 1(파일 트리)과 항목 7(검증 규칙)을 업데이트할 예정입니다.
> 최종본은 은태님 확인 후 확정됩니다.
