# TICKER_FALLBACK_AUTO.md — 티커 Fallback 자동 갱신
# 실행: 터미널 1
# 예상 소요: 10~15분
# 마지막 업데이트: 2026-04-05

---

## 목적
Vercel 배포(빌드) 시마다 Supabase에서 최신 타임스탬프를 가져와서
`DataSourceTicker.tsx`의 `FALLBACK_SOURCES`를 자동 갱신.
→ API 실패 시에도 최소한 **마지막 배포 시점의 실제 데이터**가 표시됨.

---

## 현재 문제
- `FALLBACK_SOURCES`가 하드코딩 (`hoursAgo: 2, 4, 6...` 등 고정값)
- API 실패 시 이 고정값이 표시 → 시간이 지나면 실제와 괴리
- `isLive: false`로 되어 있어서 라이브 데이터인지 구분도 안 됨

---

## 해결 구조

```
빌드 시: prebuild 스크립트 실행
  ↓
Supabase에서 12개 소스의 최신 updated_at 조회
  ↓
data/ticker-fallback.json 파일로 저장
  ↓
DataSourceTicker.tsx가 이 JSON을 import해서 FALLBACK_SOURCES로 사용
  ↓
next build 진행
```

---

## 작업 순서

### Step 1: prebuild 스크립트 생성

**파일**: `scripts/update-ticker-fallback.mjs` (ESM, Node.js에서 직접 실행)

```javascript
// scripts/update-ticker-fallback.mjs
// 빌드 전에 실행하여 Supabase에서 최신 ticker fallback 데이터를 가져옴

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'data', 'ticker-fallback.json');

// SOURCE_QUERIES는 app/api/v1/data-freshness/route.ts와 동일하게 유지
const SOURCE_QUERIES = [
  { name: 'USITC', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'US' } },
  { name: 'UK Trade Tariff', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'GB' } },
  { name: 'EU TARIC', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'DE' } },
  { name: 'Canada CBSA', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'CA' } },
  { name: 'Australia ABF', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'AU' } },
  { name: 'Korea KCS', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'KR' } },
  { name: 'Japan Customs', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'JP' } },
  { name: 'MacMap MFN', table: 'precomputed_landed_costs', column: 'last_updated' },
  { name: 'Exchange Rates', table: 'exchange_rate_history', column: 'created_at' },
  { name: 'Section 301/232', table: 'country_regulatory_notes', column: 'created_at', filter: { column: 'category', op: 'neq', value: '__shannon_probe__' } },
  { name: 'Trade Remedies', table: 'country_regulatory_notes', column: 'created_at', filter: { column: 'category', op: 'eq', value: 'trade' } },
  { name: 'FTA Agreements', table: 'fta_agreements', column: 'updated_at' },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('[ticker-fallback] Supabase 환경변수 없음 — 기존 fallback 유지');
    process.exit(0); // 실패해도 빌드 중단하지 않음
  }

  const sb = createClient(url, key);
  const results = [];

  for (const src of SOURCE_QUERIES) {
    try {
      let query = sb.from(src.table).select(src.column).order(src.column, { ascending: false }).limit(1);

      if (src.filter) {
        if (src.filter.op === 'eq') query = query.eq(src.filter.column, src.filter.value);
        else if (src.filter.op === 'ilike') query = query.ilike(src.filter.column, src.filter.value);
        else if (src.filter.op === 'neq') query = query.neq(src.filter.column, src.filter.value);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        results.push({ name: src.name, lastUpdated: null });
      } else {
        results.push({ name: src.name, lastUpdated: data[0][src.column] || null });
      }
    } catch {
      results.push({ name: src.name, lastUpdated: null });
    }
  }

  // data/ 디렉토리 없으면 생성
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    sources: results,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`[ticker-fallback] ${results.filter(r => r.lastUpdated).length}/${results.length}개 소스 업데이트됨 → ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[ticker-fallback] 에러 (빌드 계속 진행):', err.message);
  process.exit(0); // 실패해도 빌드 중단하지 않음
});
```

**핵심**: `process.exit(0)` — Supabase 연결 실패해도 빌드를 절대 막지 않음. 기존 JSON 파일 그대로 사용.

---

### Step 2: data/ticker-fallback.json 초기 파일 생성

**파일**: `data/ticker-fallback.json`

```json
{
  "generatedAt": "2026-04-05T03:00:00.000Z",
  "sources": [
    { "name": "USITC", "lastUpdated": null },
    { "name": "UK Trade Tariff", "lastUpdated": null },
    { "name": "EU TARIC", "lastUpdated": null },
    { "name": "Canada CBSA", "lastUpdated": null },
    { "name": "Australia ABF", "lastUpdated": null },
    { "name": "Korea KCS", "lastUpdated": null },
    { "name": "Japan Customs", "lastUpdated": null },
    { "name": "MacMap MFN", "lastUpdated": null },
    { "name": "Exchange Rates", "lastUpdated": null },
    { "name": "Section 301/232", "lastUpdated": null },
    { "name": "Trade Remedies", "lastUpdated": null },
    { "name": "FTA Agreements", "lastUpdated": null }
  ]
}
```

> 첫 빌드 때 스크립트가 실행되면 실제 값으로 덮어씀.

---

### Step 3: DataSourceTicker.tsx 수정

**변경 내용**: 하드코딩 `FALLBACK_SOURCES` 삭제 → JSON import로 교체

```typescript
// 기존 하드코딩 삭제:
// const FALLBACK_SOURCES: DataSource[] = [ ... ];

// 새로 추가:
import fallbackData from '@/data/ticker-fallback.json';

const FALLBACK_SOURCES: DataSource[] = fallbackData.sources.map((src) => ({
  name: src.name,
  hoursAgo: isoToHoursAgo(src.lastUpdated),
  isLive: false,
}));
```

**주의**: `isoToHoursAgo`는 이미 존재하는 함수. fallback JSON의 `lastUpdated`가 ISO 문자열이므로 그대로 사용 가능.

---

### Step 4: package.json build 스크립트 수정

```json
// 기존:
"build": "next build"

// 변경:
"build": "node scripts/update-ticker-fallback.mjs && next build"
```

이렇게 하면 **Vercel 배포 시 자동으로**:
1. `update-ticker-fallback.mjs` 실행 → Supabase 조회 → JSON 갱신
2. `next build` 실행 → 갱신된 JSON을 DataSourceTicker가 import

---

### Step 5: .gitignore 확인

`data/ticker-fallback.json`은 **git에 포함**시켜야 함.
→ 로컬에서 빌드 안 하고 바로 push하는 경우에도 최소한 마지막 커밋 시점의 fallback이 있어야 하기 때문.

`.gitignore`에 `data/` 가 없는지 확인. 있으면 제외:
```
# 아래 줄이 있으면 삭제하거나 수정
# data/
```

---

### Step 6: TypeScript — JSON import 설정 확인

`tsconfig.json`에 `resolveJsonModule: true`가 있는지 확인.
없으면 추가:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

Next.js는 기본적으로 이 옵션이 켜져 있지만, 확인 필수.

또한 `@/data/` 경로가 동작하려면 `tsconfig.json`의 `paths`에 `@/*`이 `["./*"]`로 설정되어 있어야 함 (Next.js 기본값).

---

### Step 7: 빌드 & 검증

```bash
# 1. 스크립트 단독 실행 테스트
node scripts/update-ticker-fallback.mjs

# 2. data/ticker-fallback.json 내용 확인
cat data/ticker-fallback.json

# 3. 빌드
npm run build

# 4. 확인 사항:
#    - prebuild 스크립트 로그에 "12/12개 소스 업데이트됨" 표시
#    - ticker-fallback.json에 실제 ISO 타임스탬프 있음
#    - 빌드 성공
```

---

## 결과

| 상태 | Fallback 데이터 |
|------|----------------|
| **배포 전** | 하드코딩 고정값 (실제와 괴리) |
| **배포 후** | 배포 시점의 실제 Supabase 타임스탬프 |
| **API 정상** | 실시간 Supabase 데이터 (5분 갱신) |
| **API 실패** | 마지막 배포 시점의 Supabase 데이터 |
| **Supabase 다운** | 마지막 성공 빌드의 데이터 (JSON 유지) |

## 수정 파일 요약
| 파일 | 작업 |
|------|------|
| `scripts/update-ticker-fallback.mjs` | 새로 생성 |
| `data/ticker-fallback.json` | 새로 생성 (빌드 시 자동 갱신) |
| `components/home/DataSourceTicker.tsx` | FALLBACK_SOURCES를 JSON import로 교체 |
| `package.json` | build 스크립트에 prebuild 추가 |
