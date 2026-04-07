# MONITOR_AUTO_IMPORT.md — 모니터 감지 → 자동 DB 임포트 파이프라인
# 실행: 터미널 1 (SOURCE_PUBLICATION_TICKER 이후)
# 예상 소요: 40~50분
# 마지막 업데이트: 2026-04-05

---

## 목적
현재 cron 모니터들이 **변경 감지만 하고 알림만 보내는** 구조를
**감지 → 자동 DB 임포트**까지 연결되는 파이프라인으로 업그레이드.

### 현재 구조 (끊어진 파이프라인)
```
cron 모니터 → 변경 감지 → health_check_logs 기록 → 이메일 알림 → (끝)
                                                         ↓
                                                    수동 임포트 (사람이 직접)
```

### 목표 구조 (자동 파이프라인)
```
cron 모니터 → 변경 감지 → 자동 임포트 트리거 → DB 업데이트 → 로그 기록
                              ↓
                         실패 시 알림 (수동 개입 필요)
```

---

## 현재 상태 분석

| 모니터 | 감지 방식 | 현재 상태 | 자동화 난이도 | 우선순위 |
|--------|----------|----------|:---:|:---:|
| **exchange-rate-sync** | ECB API 호출 | ✅ 이미 자동 | 완료 | — |
| **update-tariffs** | 정부 API 호출 | ✅ 이미 자동 | 완료 | — |
| **sdn-sync** | OFAC 파일 HEAD 체크 | ⚠️ 감지만, 임포트는 Python 스크립트 | 중 | P0 |
| **trade-remedy-sync** | DB 행 수 체크만 | ❌ 감지도 불완전 | 높 | P1 |
| **taric-rss-monitor** | RSS 변경 감지 | ❌ 알림만 | 중 | P1 |
| **federal-register-monitor** | FR API 검색 | ❌ 알림만 | 중 | P1 |
| **tariff-change-monitor** | 50개국 해시 비교 | ❌ 알림만 | 높 | P2 |
| **fta-change-monitor** | 8개 포털 해시 비교 | ❌ 알림만 | 높 | P2 |
| **classification-ruling-monitor** | 변경 감지 | ❌ 알림만 | 높 | P2 |
| **macmap-update-monitor** | 월 1회 체크 | ❌ 알림만 | 높 | P2 |

---

## 이번 작업 범위: P0 + P1 (4개 모니터 연결)

P2는 외부 소스의 데이터 포맷이 불규칙해서 자동 파싱이 어려움.
→ P0, P1 먼저 처리하고 P2는 별도 세션에서 진행.

---

## 작업 순서

### Step 1: 공통 인프라 — `import-trigger` 유틸리티

**파일**: `app/lib/data-management/import-trigger.ts`

모니터가 변경을 감지하면 호출하는 공통 함수.

```typescript
import { createClient } from '@supabase/supabase-js';

interface ImportTriggerResult {
  success: boolean;
  source: string;
  recordsUpdated: number;
  error?: string;
  triggeredBy: string;       // 어떤 모니터가 트리거했는지
  triggeredAt: string;       // ISO timestamp
}

// Supabase에 import 로그 기록
export async function logImportResult(result: ImportTriggerResult) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('health_check_logs').insert({
    check_type: `auto_import_${result.source}`,
    status: result.success ? 'success' : 'failure',
    details: JSON.stringify(result),
    created_at: new Date().toISOString(),
  });
}

// Import 실패 시 이메일 알림 (기존 알림 시스템 재사용)
export async function notifyImportFailure(result: ImportTriggerResult) {
  // 기존 health_check_logs에 기록하면
  // morning-brief cron이 다음 날 아침에 잡아냄.
  // 즉시 알림이 필요하면 여기에 이메일/텔레그램 추가.
  await logImportResult(result);
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
```

---

### Step 2: P0 — OFAC SDN 자동 임포트 연결

**현재 문제**: `sdn-sync`가 OFAC 파일 변경을 HEAD 요청으로 감지하지만,
실제 임포트는 `scripts/import_ofac_sdn.py`를 수동으로 실행해야 함.

**수정 파일**: `app/api/v1/admin/sdn-sync/route.ts`

**변경 내용**:
1. HEAD 요청으로 `Last-Modified` 확인 (기존 로직 유지)
2. 변경 감지되면 → OFAC CSV를 직접 다운로드
3. CSV 파싱 → `sanctions_entries` 테이블에 upsert
4. 실패 시 → `notifyImportFailure()` 호출

```typescript
// 기존: HEAD 체크 후 로그만 기록
// 추가할 로직:

async function importSdnData(csvUrl: string): Promise<ImportTriggerResult> {
  try {
    // 1. CSV 다운로드
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`Failed to fetch SDN CSV: ${res.status}`);
    const csvText = await res.text();

    // 2. CSV 파싱 (OFAC SDN 포맷: | 구분자)
    const lines = csvText.split('\n').filter(l => l.trim());
    const entries = lines.map(line => {
      const fields = line.split('|');
      // OFAC SDN 형식: ent_num | SDN_Name | SDN_Type | Program | Title | ...
      return {
        ent_num: fields[0]?.trim(),
        sdn_name: fields[1]?.trim(),
        sdn_type: fields[2]?.trim(),
        program: fields[3]?.trim(),
        // ... 나머지 필드
      };
    }).filter(e => e.ent_num && e.sdn_name);

    // 3. Supabase upsert (배치 처리)
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not available');

    const BATCH_SIZE = 500;
    let totalUpserted = 0;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const { error } = await sb.from('sanctions_entries')
        .upsert(batch, { onConflict: 'ent_num' });
      if (error) throw error;
      totalUpserted += batch.length;
    }

    // 4. sanctions_load_meta 업데이트
    await sb.from('sanctions_load_meta').upsert({
      source: 'OFAC_SDN',
      last_imported: new Date().toISOString(),
      record_count: totalUpserted,
      import_method: 'auto_cron',
    }, { onConflict: 'source' });

    return {
      success: true,
      source: 'ofac_sdn',
      recordsUpdated: totalUpserted,
      triggeredBy: 'sdn-sync-cron',
      triggeredAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      success: false,
      source: 'ofac_sdn',
      recordsUpdated: 0,
      error: err instanceof Error ? err.message : String(err),
      triggeredBy: 'sdn-sync-cron',
      triggeredAt: new Date().toISOString(),
    };
  }
}
```

**핵심**: 기존 HEAD 체크 로직은 유지. 변경이 감지된 경우에만 `importSdnData()` 호출.
→ 매일 실행되지만 OFAC가 실제로 파일을 업데이트한 날에만 임포트 발생.

**주의사항**:
- OFAC SDN CSV는 약 21,000행 → 500개씩 배치 upsert으로 42회 호출
- Vercel Serverless 함수 타임아웃(60초) 내에 처리 가능한지 확인 필요
- 타임아웃 위험 시 → 첫 N개 배치만 처리하고 다음 cron에서 이어서 처리하는 방식

---

### Step 3: P1-A — Trade Remedy 자동 동기화

**현재 문제**: `trade-remedy-sync`가 DB 행 수만 체크할 뿐, 새 데이터를 가져오지 않음.
Trade.gov API에서 새 AD/CVD 판결을 자동으로 가져와야 함.

**수정 파일**: `app/api/v1/admin/trade-remedy-sync/route.ts`

**변경 내용**:
```typescript
// 기존: DB 행 수 체크만
// 추가: Trade.gov Enforcement API에서 최근 판결 조회 → DB upsert

async function syncTradeRemedies(): Promise<ImportTriggerResult> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not available');

  // 1. 마지막 동기화 시점 확인
  const { data: lastSync } = await sb
    .from('health_check_logs')
    .select('created_at')
    .eq('check_type', 'auto_import_trade_remedies')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1);

  const sinceDate = lastSync?.[0]?.created_at || '2025-01-01T00:00:00Z';

  // 2. Trade.gov API 호출 — 최근 변경된 케이스 조회
  //    (실제 API 엔드포인트와 파라미터는 기존 코드 참조)
  const apiUrl = `https://api.trade.gov/gateway/v1/consolidated_screening_list/search`;
  // ... API 호출 로직

  // 3. 새 케이스가 있으면 trade_remedy_cases에 upsert
  // 4. 관련 products, duties 테이블도 업데이트

  return {
    success: true,
    source: 'trade_remedies',
    recordsUpdated: newCases.length,
    triggeredBy: 'trade-remedy-sync-cron',
    triggeredAt: new Date().toISOString(),
  };
}
```

**주의**: Trade.gov API 키가 필요할 수 있음. `docs/CREDENTIALS.md` 확인.

---

### Step 4: P1-B — TARIC RSS → EU 관세율 자동 업데이트

**현재 문제**: `taric-rss-monitor`가 RSS에서 새 항목을 감지하지만 알림만 보냄.

**수정 파일**: `app/api/v1/cron/taric-rss-monitor/route.ts`

**변경 내용**:
RSS에서 관세율 변경이 감지되면 → EU TARIC API를 호출해서 해당 HS 코드의 최신 관세율을 가져와서 DB 업데이트.

```typescript
// 기존 로직 (유지):
// 1. TARIC RSS 피드 fetch
// 2. 24시간 내 새 항목 필터
// 3. 해시 비교로 변경 감지
// 4. health_check_logs에 기록 + 이메일 알림

// 추가할 로직:
// 5. 새 RSS 항목에서 HS 코드 추출 (정규식으로 파싱)
// 6. 추출된 HS 코드별로 TARIC API 호출 → 최신 관세율 조회
// 7. duty_rates_live 또는 precomputed_landed_costs 테이블 업데이트
// 8. logImportResult() 호출

async function autoUpdateTaricRates(newRssItems: RssItem[]): Promise<ImportTriggerResult> {
  // HS 코드 추출 (RSS 본문에서)
  const hsCodePattern = /\b\d{4}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}\b/g;
  const affectedHsCodes = new Set<string>();

  for (const item of newRssItems) {
    const matches = (item.title + ' ' + item.description).match(hsCodePattern);
    if (matches) matches.forEach(m => affectedHsCodes.add(m.replace(/[\s.]/g, '')));
  }

  if (affectedHsCodes.size === 0) {
    // RSS에 구체적 HS 코드 없음 → 일반 공지일 수 있음
    return { success: true, source: 'eu_taric', recordsUpdated: 0,
             triggeredBy: 'taric-rss-monitor', triggeredAt: new Date().toISOString() };
  }

  // 각 HS 코드에 대해 TARIC API 호출
  let updated = 0;
  for (const hs of affectedHsCodes) {
    try {
      // EU TARIC API: https://ec.europa.eu/taxation_customs/dds2/taric/measures.json?lang=EN&code={hs}
      // → 최신 관세율 가져와서 DB 업데이트
      updated++;
    } catch {
      // 개별 실패는 건너뜀
    }
  }

  return {
    success: true, source: 'eu_taric', recordsUpdated: updated,
    triggeredBy: 'taric-rss-monitor', triggeredAt: new Date().toISOString(),
  };
}
```

**핵심**: RSS 항목 모두를 자동 임포트하는 게 아니라, HS 코드가 명시된 항목만 선별 처리.

---

### Step 5: P1-C — Federal Register → Section 301/232 자동 업데이트

**현재 문제**: `federal-register-monitor`가 관세 관련 FR 문서를 감지하지만 알림만 보냄.

**수정 파일**: `app/api/v1/cron/federal-register-monitor/route.ts`

**변경 내용**:
FR API에서 새 관세 규정이 감지되면 → `country_regulatory_notes` 테이블에 자동 추가.

```typescript
// 기존 로직 (유지):
// 1. Federal Register API 검색 (tariff, duty, trade 키워드)
// 2. 24시간 내 새 문서 필터
// 3. health_check_logs 기록 + 이메일 알림

// 추가할 로직:
// 4. Section 301, Section 232 관련 문서인지 분류
// 5. country_regulatory_notes에 자동 추가

async function autoImportFederalRegister(newDocs: FRDocument[]): Promise<ImportTriggerResult> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not available');

  const relevantDocs = newDocs.filter(doc =>
    doc.title.match(/section\s*(301|232)|tariff|duty\s*rate|anti-dumping|countervailing/i)
  );

  if (relevantDocs.length === 0) {
    return { success: true, source: 'federal_register', recordsUpdated: 0,
             triggeredBy: 'federal-register-monitor', triggeredAt: new Date().toISOString() };
  }

  const notes = relevantDocs.map(doc => ({
    country: 'US', // Federal Register는 미국 규정
    category: doc.title.match(/301/i) ? 'section_301' :
              doc.title.match(/232/i) ? 'section_232' : 'trade',
    title: doc.title,
    summary: doc.abstract?.substring(0, 500) || '',
    effective_date: doc.effective_on || null,
    source_url: doc.html_url,
    federal_register_number: doc.document_number,
    created_at: new Date().toISOString(),
  }));

  const { error } = await sb.from('country_regulatory_notes')
    .upsert(notes, { onConflict: 'federal_register_number' });

  if (error) throw error;

  return {
    success: true, source: 'federal_register', recordsUpdated: notes.length,
    triggeredBy: 'federal-register-monitor', triggeredAt: new Date().toISOString(),
  };
}
```

**주의**: `country_regulatory_notes` 테이블에 `federal_register_number` 컬럼이 없을 수 있음.
→ 없으면 Supabase에서 `ALTER TABLE country_regulatory_notes ADD COLUMN federal_register_number TEXT UNIQUE;` 실행 필요.

---

### Step 6: 안전장치 — 자동 임포트 ON/OFF 스위치

모든 자동 임포트에 **킬 스위치** 추가. 문제 발생 시 코드 수정 없이 끌 수 있도록.

**방법**: 환경 변수로 제어

```typescript
// import-trigger.ts에 추가
export function isAutoImportEnabled(source: string): boolean {
  // 전체 끄기
  if (process.env.DISABLE_AUTO_IMPORT === 'true') return false;
  // 개별 끄기 (예: DISABLE_AUTO_IMPORT_OFAC_SDN=true)
  const envKey = `DISABLE_AUTO_IMPORT_${source.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  if (process.env[envKey] === 'true') return false;
  return true;
}
```

각 모니터의 자동 임포트 호출 전에:
```typescript
if (!isAutoImportEnabled('ofac_sdn')) {
  console.log('[sdn-sync] Auto-import disabled via env');
  return; // 알림만 보내는 기존 동작
}
```

→ Vercel Environment Variables에서 `DISABLE_AUTO_IMPORT_OFAC_SDN=true` 설정하면 즉시 OFF.

---

### Step 7: 빌드 & 검증

```bash
npm run build
```

검증 체크리스트:
- [ ] `import-trigger.ts` — 공통 로그/알림 유틸리티 정상 빌드
- [ ] `sdn-sync` — OFAC HEAD 체크 → 변경 시 CSV 다운로드 → upsert 로직
- [ ] `trade-remedy-sync` — Trade.gov API 호출 → 새 케이스 upsert
- [ ] `taric-rss-monitor` — RSS 새 항목 → HS 코드 추출 → TARIC API → DB 업데이트
- [ ] `federal-register-monitor` — FR 새 문서 → 분류 → regulatory_notes upsert
- [ ] 환경 변수 킬 스위치 동작 확인
- [ ] 기존 알림 기능 유지 (자동 임포트가 추가된 것이지, 알림을 대체하는 게 아님)

---

## 결과 비교

### Before (현재)
| 데이터 | 감지 | 임포트 | 결과 |
|--------|:---:|:---:|------|
| Exchange Rates | ✅ 자동 | ✅ 자동 | 항상 최신 |
| Tariff Rates | ✅ 자동 | ✅ 자동 | 항상 최신 |
| OFAC SDN | ✅ 자동 | ❌ 수동 | 수동 실행 전까지 구버전 |
| Trade Remedies | ⚠️ 행 수만 | ❌ 수동 | 수동 임포트 전까지 구버전 |
| EU TARIC 변경 | ✅ RSS 감지 | ❌ 수동 | 알림만, 반영 안 됨 |
| Federal Register | ✅ API 감지 | ❌ 수동 | 알림만, 반영 안 됨 |

### After (이번 작업 후)
| 데이터 | 감지 | 임포트 | 결과 |
|--------|:---:|:---:|------|
| Exchange Rates | ✅ 자동 | ✅ 자동 | 항상 최신 |
| Tariff Rates | ✅ 자동 | ✅ 자동 | 항상 최신 |
| OFAC SDN | ✅ 자동 | ✅ **자동** | OFAC 파일 변경 시 자동 반영 |
| Trade Remedies | ✅ **API 조회** | ✅ **자동** | 새 판결 시 자동 반영 |
| EU TARIC 변경 | ✅ RSS 감지 | ✅ **자동** | HS 코드 변경 시 자동 반영 |
| Federal Register | ✅ API 감지 | ✅ **자동** | Section 301/232 규정 자동 추가 |

→ **자동화 커버리지: 2/12 → 6/12 (50%)**

---

## P2 (다음 세션에서 처리)

나머지 6개는 외부 소스가 API를 제공하지 않거나 데이터 포맷이 불규칙:
- tariff-change-monitor (50개국 페이지 해시 → 스크래핑 필요)
- fta-change-monitor (8개 포털 → 각각 다른 포맷)
- classification-ruling-monitor (비정형 문서)
- macmap-update-monitor (MacMap 대용량 다운로드)
- Canada/Australia/Korea/Japan 개별 관세 API

→ 이것들은 웹 스크래핑 또는 전용 파서가 필요해서 별도 세션에서 처리.

## 수정 파일 요약
| 파일 | 작업 |
|------|------|
| `app/lib/data-management/import-trigger.ts` | 새로 생성 — 공통 로그/알림/킬스위치 |
| `app/api/v1/admin/sdn-sync/route.ts` | 수정 — OFAC CSV 자동 임포트 추가 |
| `app/api/v1/admin/trade-remedy-sync/route.ts` | 수정 — Trade.gov API 자동 조회 + upsert |
| `app/api/v1/cron/taric-rss-monitor/route.ts` | 수정 — RSS → HS 코드 추출 → TARIC API → DB |
| `app/api/v1/cron/federal-register-monitor/route.ts` | 수정 — FR 문서 → regulatory_notes 자동 추가 |
