# PUBLICATION_AUTO_SYNC.md — 원본 발표일 JSON 자동 갱신
# 실행: 터미널 1 또는 2
# 예상 소요: 15~20분
# 마지막 업데이트: 2026-04-05

---

## 목적
모니터 cron이 새 규정/데이터를 감지했을 때,
DB 임포트와 함께 `data/source-publications.json`도 자동 갱신.
→ 2줄 티커(원본 발표일)가 수동 업데이트 없이 항상 최신 유지.

---

## 현재 문제
- `source-publications.json`은 정적 파일 → 사람이 직접 수정해야 함
- 모니터가 새 규정을 감지해도 DB만 업데이트하고 JSON은 그대로
- 2줄 티커에 구버전 발표일이 계속 표시됨

---

## 해결 구조

```
모니터 cron이 변경 감지
  ↓
DB 자동 임포트 (MONITOR_AUTO_IMPORT에서 이미 구현)
  ↓ + 동시에
source-publications.json 해당 소스 항목 갱신 (이번 작업)
  ↓
다음 Vercel 배포 시 갱신된 JSON이 반영
```

---

## 작업 순서

### Step 1: 공통 유틸리티 — `updateSourcePublication()`

**파일**: `app/lib/data-management/publication-updater.ts` (새로 생성)

```typescript
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SourcePublication {
  name: string;
  publication: string;
  effectiveDate: string | null;
  reference: string;
  sourceUrl: string;
  shortLabel: string;
}

interface PublicationData {
  lastManualUpdate: string;
  lastAutoUpdate?: string;
  sources: SourcePublication[];
}

const JSON_PATH = join(process.cwd(), 'data', 'source-publications.json');

/**
 * 모니터가 새 규정을 감지했을 때 호출.
 * source-publications.json의 해당 소스 항목을 업데이트.
 */
export function updateSourcePublication(
  sourceName: string,
  updates: Partial<Pick<SourcePublication, 'publication' | 'effectiveDate' | 'reference' | 'shortLabel'>>
): boolean {
  try {
    const raw = readFileSync(JSON_PATH, 'utf-8');
    const data: PublicationData = JSON.parse(raw);

    const sourceIndex = data.sources.findIndex(s => s.name === sourceName);
    if (sourceIndex === -1) {
      console.log(`[publication-updater] Source "${sourceName}" not found in JSON`);
      return false;
    }

    // 변경된 필드만 업데이트
    const source = data.sources[sourceIndex];
    if (updates.publication) source.publication = updates.publication;
    if (updates.effectiveDate) source.effectiveDate = updates.effectiveDate;
    if (updates.reference) source.reference = updates.reference;
    if (updates.shortLabel) source.shortLabel = updates.shortLabel;

    data.lastAutoUpdate = new Date().toISOString();

    writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    console.log(`[publication-updater] Updated "${sourceName}" → ${updates.shortLabel || updates.reference}`);
    return true;
  } catch (err) {
    console.error(`[publication-updater] Failed to update:`, err);
    return false;
  }
}

/**
 * Serverless 환경(Vercel)에서는 파일 시스템 쓰기가 안 되므로,
 * Supabase에 메타데이터를 저장하고 prebuild에서 JSON으로 변환.
 */
export async function savePublicationToDb(
  sourceName: string,
  updates: {
    publication?: string;
    effectiveDate?: string;
    reference?: string;
    shortLabel?: string;
  }
) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return false;

    const sb = createClient(url, key);

    await sb.from('source_publications').upsert({
      source_name: sourceName,
      publication: updates.publication,
      effective_date: updates.effectiveDate,
      reference: updates.reference,
      short_label: updates.shortLabel,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_name' });

    console.log(`[publication-updater] Saved to DB: "${sourceName}"`);
    return true;
  } catch (err) {
    console.error(`[publication-updater] DB save failed:`, err);
    return false;
  }
}
```

**핵심**: 두 가지 방식 제공
1. `updateSourcePublication()` — 로컬 JSON 직접 수정 (빌드 스크립트에서 사용)
2. `savePublicationToDb()` — Supabase에 저장 (Vercel cron에서 사용, 파일 시스템 못 쓰니까)

---

### Step 2: Supabase 테이블 생성

**SQL** (Supabase SQL Editor에서 실행):

```sql
CREATE TABLE IF NOT EXISTS source_publications (
  source_name TEXT PRIMARY KEY,
  publication TEXT,
  effective_date DATE,
  reference TEXT,
  short_label TEXT,
  source_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 삽입 (source-publications.json과 동일)
INSERT INTO source_publications (source_name, publication, effective_date, reference, short_label, source_url) VALUES
  ('USITC', 'HTS 2026 Edition', '2026-01-01', 'USITC Pub. 5765', 'HTS 2026 — Eff. Jan 1', 'https://hts.usitc.gov/'),
  ('UK Trade Tariff', 'UK Global Tariff 2026', '2026-01-01', 'UK Trade Tariff', 'UKGT 2026 — Eff. Jan 1', 'https://www.trade-tariff.service.gov.uk/'),
  ('EU TARIC', 'Combined Nomenclature 2026', '2026-01-01', 'OJ L 2025/2782', 'CN 2026 — Eff. Jan 1', 'https://ec.europa.eu/taxation_customs/dds2/taric/'),
  ('Canada CBSA', 'Customs Tariff Schedule 2026', '2026-01-01', 'CBSA D-Memoranda', 'Customs Tariff 2026 — Eff. Jan 1', 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/'),
  ('Australia ABF', 'Customs Tariff 2026', '2026-01-01', 'Schedule 3', 'AU Tariff 2026 — Eff. Jan 1', 'https://www.abf.gov.au/'),
  ('Korea KCS', '관세율표 2026', '2026-01-01', 'KCS Tariff Schedule', 'KR Tariff 2026 — Eff. Jan 1', 'https://www.customs.go.kr/'),
  ('Japan Customs', 'Customs Tariff Schedule 2026', '2026-04-01', 'MOF Notification', 'JP Tariff FY2026 — Eff. Apr 1', 'https://www.customs.go.jp/english/tariff/'),
  ('MacMap MFN', 'ITC MacMap MFN Rates', '2023-01-01', 'HS2017 (H6 Revision)', 'MacMap 2023 — HS2017 Rev.', 'https://www.macmap.org/'),
  ('Exchange Rates', 'ECB Euro Foreign Exchange Reference Rates', NULL, 'Daily Publication', 'ECB — Daily Reference', 'https://www.ecb.europa.eu/stats/eurofxref/'),
  ('Section 301/232', 'Executive Order — 25% Steel & Aluminum', '2025-03-12', 'EO 14307', 'EO 14307 — Mar 12, 2025', 'https://www.federalregister.gov/'),
  ('Trade Remedies', 'AD/CVD Orders & Safeguards', NULL, '10,999 active cases', '10,999 Active Cases', 'https://www.trade.gov/enforcement-and-compliance'),
  ('FTA Agreements', 'Free Trade Agreements Registry', NULL, '1,319 agreements (WTO RTA-IS)', '1,319 FTAs — WTO Registry', 'https://rtais.wto.org/')
ON CONFLICT (source_name) DO NOTHING;
```

---

### Step 3: 각 모니터에 `savePublicationToDb()` 호출 추가

#### 3-A: federal-register-monitor (Section 301/232)

**파일**: `app/api/v1/cron/federal-register-monitor/route.ts`

기존 `autoImportFederalRegister()` 함수 끝에 추가:

```typescript
import { savePublicationToDb } from '@/app/lib/data-management/publication-updater';

// autoImportFederalRegister() 내부, DB upsert 성공 후:
if (relevantDocs.length > 0) {
  const latestDoc = relevantDocs[0]; // 가장 최근 문서
  const category = latestDoc.title.match(/301/i) ? 'Section 301' :
                   latestDoc.title.match(/232/i) ? 'Section 232' : 'Trade';

  await savePublicationToDb('Section 301/232', {
    publication: `${category} — ${latestDoc.title.substring(0, 60)}`,
    effectiveDate: latestDoc.effective_on || undefined,
    reference: latestDoc.document_number,
    shortLabel: `${latestDoc.document_number} — ${latestDoc.effective_on || 'Pending'}`,
  });
}
```

#### 3-B: taric-rss-monitor (EU TARIC)

**파일**: `app/api/v1/cron/taric-rss-monitor/route.ts`

RSS 새 항목 감지 후:

```typescript
import { savePublicationToDb } from '@/app/lib/data-management/publication-updater';

// 새 RSS 항목이 regulation 변경인 경우:
if (newRssItems.length > 0) {
  const latest = newRssItems[0];
  // RSS 항목에서 regulation 번호 추출 시도
  const regMatch = latest.title.match(/(?:Regulation|OJ\s*L)\s*[\d/]+/i);

  await savePublicationToDb('EU TARIC', {
    publication: `CN 2026 + ${regMatch?.[0] || 'Amendment'}`,
    reference: regMatch?.[0] || latest.title.substring(0, 40),
    shortLabel: `CN 2026 + ${regMatch?.[0] || 'Recent Amendment'}`,
  });
}
```

#### 3-C: sdn-sync (OFAC SDN → Trade Remedies에도 영향)

**파일**: `app/api/v1/admin/sdn-sync/route.ts`

자동 임포트 성공 후:

```typescript
import { savePublicationToDb } from '@/app/lib/data-management/publication-updater';

// importSdnData() 성공 후:
if (result.success && result.recordsUpdated > 0) {
  await savePublicationToDb('Trade Remedies', {
    reference: `${result.recordsUpdated.toLocaleString()} active entries`,
    shortLabel: `${result.recordsUpdated.toLocaleString()} Active Entries`,
  });
}
```

#### 3-D: trade-remedy-sync

**파일**: `app/api/v1/admin/trade-remedy-sync/route.ts`

새 케이스 감지 후:

```typescript
import { savePublicationToDb } from '@/app/lib/data-management/publication-updater';

// syncTradeRemedies() 성공 후:
if (result.success && result.recordsUpdated > 0) {
  await savePublicationToDb('Trade Remedies', {
    publication: 'AD/CVD Orders & Safeguards',
    reference: `${totalCases.toLocaleString()} active cases`,
    shortLabel: `${totalCases.toLocaleString()} Active Cases`,
  });
}
```

---

### Step 4: prebuild 스크립트에서 DB → JSON 동기화

**파일**: `scripts/update-ticker-fallback.mjs` (기존 파일에 추가)

기존 ticker-fallback 로직 뒤에 source-publications 동기화 추가:

```javascript
// === 기존: ticker-fallback.json 갱신 ===
// ... (이미 있는 코드)

// === 새로 추가: source-publications.json 갱신 ===
async function syncPublications(sb) {
  const PUB_PATH = join(__dirname, '..', 'data', 'source-publications.json');

  try {
    const { data, error } = await sb
      .from('source_publications')
      .select('*')
      .order('source_name');

    if (error || !data || data.length === 0) {
      console.log('[source-publications] No DB data — keeping existing JSON');
      return;
    }

    // 기존 JSON 읽기
    let existing;
    try {
      existing = JSON.parse(readFileSync(PUB_PATH, 'utf-8'));
    } catch {
      existing = { lastManualUpdate: new Date().toISOString().split('T')[0], sources: [] };
    }

    // DB 데이터로 해당 소스만 업데이트 (DB에 있는 것만)
    for (const dbRow of data) {
      const idx = existing.sources.findIndex(s => s.name === dbRow.source_name);
      if (idx !== -1) {
        // DB 값이 있으면 덮어쓰기
        if (dbRow.publication) existing.sources[idx].publication = dbRow.publication;
        if (dbRow.effective_date) existing.sources[idx].effectiveDate = dbRow.effective_date;
        if (dbRow.reference) existing.sources[idx].reference = dbRow.reference;
        if (dbRow.short_label) existing.sources[idx].shortLabel = dbRow.short_label;
        if (dbRow.source_url) existing.sources[idx].sourceUrl = dbRow.source_url;
      }
    }

    existing.lastAutoUpdate = new Date().toISOString();
    writeFileSync(PUB_PATH, JSON.stringify(existing, null, 2));
    console.log(`[source-publications] ${data.length} sources synced from DB`);
  } catch (err) {
    console.log('[source-publications] Sync failed (keeping existing):', err.message);
  }
}

// main() 함수 끝에 추가:
await syncPublications(sb);
```

---

### Step 5: 전체 흐름 확인

```
1. 모니터 cron 실행 (매일/매주)
   ↓
2. 변경 감지 → DB 임포트 (MONITOR_AUTO_IMPORT)
   ↓ + 동시에
3. savePublicationToDb() → source_publications 테이블 업데이트
   ↓
4. 다음 Vercel 배포 시 prebuild 스크립트 실행
   ↓
5. source_publications 테이블 → source-publications.json 동기화
   ↓
6. DataSourceTicker.tsx가 갱신된 JSON import → 2줄 티커 최신 표시
```

---

### Step 6: 빌드 & 검증

```bash
npm run build
```

확인 사항:
- [ ] `publication-updater.ts` 빌드 에러 없음
- [ ] 기존 모니터 코드에 import 추가 후 빌드 정상
- [ ] prebuild 스크립트에서 `[source-publications] N sources synced` 로그 출력
- [ ] source-publications.json이 정상적으로 갱신됨

---

## 수정 파일 요약

| 파일 | 작업 |
|------|------|
| `app/lib/data-management/publication-updater.ts` | 새로 생성 — 공통 업데이트 유틸 |
| `app/api/v1/cron/federal-register-monitor/route.ts` | savePublicationToDb() 호출 추가 |
| `app/api/v1/cron/taric-rss-monitor/route.ts` | savePublicationToDb() 호출 추가 |
| `app/api/v1/admin/sdn-sync/route.ts` | savePublicationToDb() 호출 추가 |
| `app/api/v1/admin/trade-remedy-sync/route.ts` | savePublicationToDb() 호출 추가 |
| `scripts/update-ticker-fallback.mjs` | source-publications DB→JSON 동기화 추가 |
| **Supabase** | `source_publications` 테이블 생성 + 초기 데이터 |
