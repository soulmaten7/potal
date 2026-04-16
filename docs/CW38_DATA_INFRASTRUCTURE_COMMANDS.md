# CW38 Data Infrastructure — Claude Code 실행 명령어
# 실행: 터미널1 (Opus) 또는 터미널3 (Opus)
# 예상 소요: 30~45분
# 마지막 업데이트: 2026-04-17

---

## 사전 완료 사항 (Cowork에서 완료)

### ✅ Priority 2: Cron↔Engine 단절 수정
- `app/lib/cost-engine/updater/tariff-updater.ts` L78: `live_duty_rate_cache` → `duty_rates_live`
- 컬럼 매핑도 정렬 (`duty_rate` → `mfn_rate`, `source` → `source_api` 등)
- 상세: `docs/CW38_GHOST_TABLE_FIX.md` 참조

### ✅ Priority 3: country_profiles 240개국 전체 시드 SQL
- `supabase/migrations/070_cw38_country_profiles_full_seed.sql` 생성 (240 INSERT, 4,000+ lines)
- 출처: `app/lib/cost-engine/country-data.ts` 240개국 데이터 → ON CONFLICT DO UPDATE

### ✅ Priority 4+5: Master Data Registry 생성
- `app/lib/data-management/master-data-registry.ts` 생성
- 32개 데이터 소스 등록 (출처 URL, 공지 페이지, 갱신 주기, 자동화 레벨)
- data-freshness API와 /data-sources 페이지의 데이터 근간

---

## Step 1: 코드 변경 빌드 검증

```bash
# TypeScript 컴파일 검증 (기존 테스트 파일 에러는 무시)
npx tsc --noEmit 2>&1 | grep -v "test" | grep "error TS" | head -10

# tariff-updater.ts 수정 확인
grep -n "duty_rates_live\|live_duty_rate_cache" app/lib/cost-engine/updater/tariff-updater.ts
# 기대: duty_rates_live만 나와야 함

# master-data-registry.ts 존재 확인
ls -la app/lib/data-management/master-data-registry.ts

# 전체 빌드
npm run build
```

---

## Step 2: Supabase DB 상태 확인

Supabase SQL Editor 또는 아래 Node 스크립트로 확인:

```bash
# .env.local에서 환경변수 로드
source .env.local 2>/dev/null || true
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# 2-A: duty_rates_live 테이블 스키마 확인
node -e "
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
fetch(url + '/rest/v1/duty_rates_live?select=*&limit=0', {
  headers: { apikey: key, Authorization: 'Bearer ' + key }
}).then(r => {
  console.log('Status:', r.status);
  console.log('Content-Range:', r.headers.get('content-range'));
}).catch(e => console.error(e));
"

# 2-B: country_profiles 현재 row count
node -e "
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
fetch(url + '/rest/v1/country_profiles?select=count', {
  headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact' }
}).then(r => {
  console.log('Status:', r.status);
  console.log('Content-Range:', r.headers.get('content-range'));
}).catch(e => console.error(e));
"

# 2-C: duty_rates_live UNIQUE constraint 확인
# (tariff-updater.ts의 REST API upsert가 동작하려면 UNIQUE 필요)
# Supabase SQL Editor에서 직접 실행:
# SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
# WHERE table_name = 'duty_rates_live';
```

---

## Step 3: country_profiles Migration 실행

**주의**: 이 SQL은 240개국을 INSERT + ON CONFLICT DO UPDATE. 기존 53개국은 최신 데이터로 업데이트되고 나머지 187개국이 새로 추가됨.

```bash
# 방법 A: Supabase SQL Editor에서 직접 실행
# supabase/migrations/070_cw38_country_profiles_full_seed.sql 내용을 복사해서 실행

# 방법 B: Supabase CLI (로컬에 설치된 경우)
# supabase db push

# 방법 C: Node.js REST API로 실행 (개별 INSERT)
node -e "
const fs = require('fs');
const sql = fs.readFileSync('supabase/migrations/070_cw38_country_profiles_full_seed.sql', 'utf-8');
const statements = sql.split(';').filter(s => s.trim().startsWith('INSERT'));
console.log('Total statements:', statements.length);
console.log('First 3:', statements.slice(0,3).map(s => s.substring(0, 80) + '...'));
"
```

실행 후 확인:

```bash
# country_profiles 총 row count 확인 (240이어야 함)
node -e "
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
fetch(url + '/rest/v1/country_profiles?select=count', {
  headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact' }
}).then(r => {
  console.log('country_profiles count:', r.headers.get('content-range'));
}).catch(e => console.error(e));
"
```

---

## Step 4: data-freshness API 리팩토링

현재 `/api/v1/data-freshness/route.ts`는 12개 소스를 하드코딩해서 Supabase에서 최신 날짜를 가져옴.

리팩토링 방향:
1. `master-data-registry.ts`에서 auto_cron 소스 목록을 가져옴
2. 각 소스의 tables에서 `MAX(updated_at)` 또는 관련 타임스탬프를 조회
3. health_check_logs에서 해당 cron의 마지막 성공 시간도 함께 반환

```bash
# 현재 data-freshness API 코드 확인
cat app/api/v1/data-freshness/route.ts
```

수정할 내용:
- `import { MASTER_DATA_REGISTRY, getAutoCronSources } from '@/app/lib/data-management/master-data-registry'`
- 기존 하드코딩 소스 목록 제거 → Registry에서 동적 로딩
- 응답에 `source.sourceUrl`, `source.announcementUrl`, `source.updateFrequency` 포함

**이건 코드 수정 작업이므로 Claude Code에서 직접 수행:**

```
다음 파일을 수정해줘:
app/api/v1/data-freshness/route.ts

변경사항:
1. master-data-registry.ts에서 MASTER_DATA_REGISTRY import
2. auto_cron과 auto_monitor 소스 목록을 Registry에서 동적으로 가져오기
3. 각 소스의 메타데이터(sourceUrl, announcementUrl, updateFrequency)를 응답에 포함
4. 기존 하드코딩된 12개 소스 배열 제거
```

---

## Step 5: LiveTicker 업데이트 (Priority 7)

현재 LiveTicker는 data-freshness API 응답을 사용. API가 리팩토링되면:

```bash
# LiveTicker 관련 파일 확인
cat lib/ticker/live-status.ts
cat components/ticker/LiveTicker.tsx
```

수정할 내용:
- `SOURCE_META` → master-data-registry의 데이터와 동기화
- 신규 필드 (sourceUrl, updateFrequency) 표시 여부 결정
- null lastUpdatedAt → "Pending" 대신 updateFrequency 기반 메시지 ("Annual update", "Daily cron" 등)

---

## Step 6: /data-sources 페이지 생성 (Priority 7)

POTAL 사용자가 모든 데이터 소스를 한눈에 볼 수 있는 페이지.

```bash
# 기존 관련 페이지 확인
ls app/data-sources/ 2>/dev/null || echo "페이지 없음 — 새로 생성 필요"
ls app/about/ 2>/dev/null || echo "about 페이지 없음"
```

생성할 파일: `app/data-sources/page.tsx`

페이지 구조:
```
/data-sources
├─ 제목: "Data Sources & Freshness"
├─ 요약 통계: 32 sources, ~246M rows, 11 categories
├─ 카테고리별 테이블:
│  ├─ Tariff & Duty Rates (10 sources)
│  ├─ Sanctions & Screening (3 sources)
│  ├─ Free Trade Agreements (1 source)
│  ├─ Exchange Rates (1 source)
│  ├─ VAT/GST & Tax (5 sources)
│  ├─ Trade Remedies (2 sources)
│  ├─ HS Classification (3 sources)
│  ├─ Restrictions (1 source)
│  ├─ Country Metadata (1 source)
│  └─ Regulatory Monitoring (5 sources)
├─ 각 소스별: name, publisher, coverage, updateFrequency, automationLevel, sourceUrl
└─ 하단: "Last verified: {날짜}" + 데이터 신뢰도 배지
```

**데이터**: `master-data-registry.ts`에서 import하여 렌더링.

```
새 페이지를 생성해줘: app/data-sources/page.tsx

master-data-registry.ts에서 MASTER_DATA_REGISTRY를 import하고,
카테고리별로 그룹화해서 테이블 형태로 보여줘.
각 소스마다 이름, 출처, 커버리지, 갱신 주기, 자동화 레벨, 공식 URL 링크를 표시.
상단에 총 소스 수, 총 rows, 카테고리 수 요약 통계.
POTAL 디자인 시스템 따라서 (dark theme, border-white/10, text-white).
```

---

## Step 7: 외장하드 데이터 확인

외장하드 연결 시 확인할 항목:

```bash
# 외장하드 파일 리스트 문서 확인
cat docs/EXTERNAL_DRIVE_FILES.md

# 외장하드 실제 연결 확인
ls /Volumes/soulmaten/POTAL/ 2>/dev/null || echo "외장하드 미연결"

# 외장하드에 있는 데이터 중 DB에 미반영된 것 확인
# - keyword_index.json → v3 subheading scoring용 (연결 여부 확인)
# - master_classification_engine.json → GRI classifier 연결 여부
# - MacMap 원본 CSV → 마지막 import 날짜
```

---

## Step 8: 전체 문서 업데이트

### 코드 문서 (Claude Code에서 직접 수정):

```bash
# CLAUDE.md 날짜 업데이트
sed -i '' 's/# 마지막 업데이트: 2026-04-16/# 마지막 업데이트: 2026-04-17/' CLAUDE.md

# CHANGELOG.md 에 CW38 작업 추가 (맨 위에)
# 내용:
# ## 2026-04-17 — CW38: Data Infrastructure & Ghost Table Fix
# - HF19: Footer 4-column restructure (Brand|Resources|Legal|Connect)
# - HF20: LiveTicker connected to real /api/v1/data-freshness API
# - FIX: tariff-updater.ts Cron↔Engine disconnect (live_duty_rate_cache → duty_rates_live)
# - ADD: 070_cw38_country_profiles_full_seed.sql (53 → 240 countries)
# - ADD: master-data-registry.ts (32 sources, update URLs, frequencies)
# - ADD: DATA_SOURCE_AUDIT_REPORT.md (42 sources analyzed)
# - ADD: DATA_FLOW_TRACE_REPORT.md (5 API flow + ghost table analysis)
# - ADD: CW38_GHOST_TABLE_FIX.md (fix documentation)

# session-context.md 업데이트
# CW38 완료 블록 추가

# docs/NEXT_SESSION_START.md 갱신
```

### Notion 업데이트 (Cowork에서):
- Session Log에 세션 기록
- Task Board: CW38 → Done
- 해당 시: PROJECT_STATUS.md 수치 업데이트 (42 sources, 240 countries)

---

## 수정/생성 파일 요약

| 파일 | 작업 | 실행 위치 |
|------|------|---------|
| `app/lib/cost-engine/updater/tariff-updater.ts` | ✅ 수정 완료 | Cowork |
| `supabase/migrations/070_cw38_country_profiles_full_seed.sql` | ✅ 생성 완료 | Cowork |
| `app/lib/data-management/master-data-registry.ts` | ✅ 생성 완료 | Cowork |
| `docs/CW38_GHOST_TABLE_FIX.md` | ✅ 생성 완료 | Cowork |
| `docs/CW38_DATA_INFRASTRUCTURE_COMMANDS.md` | ✅ 이 파일 | Cowork |
| `app/api/v1/data-freshness/route.ts` | 리팩토링 필요 | Claude Code |
| `app/data-sources/page.tsx` | 새로 생성 필요 | Claude Code |
| `lib/ticker/live-status.ts` | 수정 필요 | Claude Code |
| `CLAUDE.md` | 날짜 업데이트 | Claude Code |
| `CHANGELOG.md` | CW38 기록 추가 | Claude Code |
| `session-context.md` | CW38 완료 블록 | Claude Code |

---

## 실행 순서 (Claude Code)

1. Step 1 (빌드 검증) — 5분
2. Step 2 (Supabase 확인) — 5분
3. Step 3 (country_profiles migration) — 10분
4. Step 4 (data-freshness API 리팩토링) — 15분
5. Step 5 (LiveTicker 업데이트) — 10분
6. Step 6 (/data-sources 페이지) — 15분
7. Step 7 (외장하드 — 연결 시만) — 5분
8. Step 8 (문서 업데이트) — 10분
9. `npm run build` 최종 검증
10. `git add . && git commit && git push`
