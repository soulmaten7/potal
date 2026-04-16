# DATA SOURCE AUDIT — POTAL 전체 데이터 소스 감사
# 실행: Claude Code 터미널 (Opus)
# 예상 소요: 30~45분
# 출력: docs/DATA_SOURCE_AUDIT_REPORT.md

---

## 목적
POTAL이 사용하는 **모든 외부 데이터**를 빠짐없이 파악하고, 각 소스별로:
1. 현재 상태 (있는지, 갱신되고 있는지)
2. 있어야 하는 상태 (갱신 주기, 자동화 여부)
3. 갭 (빠진 것, 부실한 것, 안 돌아가는 것)
을 정리하는 **완전한 감사 보고서**를 생성한다.

---

## 지침

### 감사 원칙
- **코드가 근거**: 추측 금지. 실제 파일, 실제 테이블, 실제 cron 설정을 확인
- **빠짐없이**: grep, glob으로 전체 코드베이스를 탐색. 알려진 12개 소스만 보지 말 것
- **갭 식별**: "있는데 안 돌아간다", "있어야 하는데 없다", "있는데 부실하다"를 구분
- **전문가 판단**: 국제무역/관세 분야 전문가 관점에서 "이 데이터가 없으면 계산이 틀릴 수 있다"를 판단

### 출력 포맷
최종 결과를 `docs/DATA_SOURCE_AUDIT_REPORT.md` 파일로 생성.
아래 카테고리별로 모든 소스를 정리하되, 각 소스는 반드시 아래 필드를 포함:

```
### [소스명]
- **카테고리**: (Tariff / Sanctions / FTA / Exchange Rate / Tax / Classification / Regulatory / Logistics / 기타)
- **원본 URL**: (정부/기관 공식 사이트)
- **공지/변경 발표 페이지**: (업데이트가 공지되는 곳 — 없으면 "없음 ← 갭" 표시)
- **POTAL 진입 경로**: (cron route / 수동 스크립트 / 하드코딩 / 외장하드 파일)
- **코드 파일**: (실제 파일 경로)
- **Supabase 테이블**: (저장되는 테이블명)
- **갱신 주기**: (실시간 / 매일 / 매주 / 매월 / 매분기 / 연 1회 / 수시 / 수동)
- **자동화 상태**: (✅ cron 자동 / ⚠️ 수동 스크립트 / ❌ 없음)
- **마지막 갱신 확인**: (Supabase 쿼리로 실제 확인한 날짜/시간)
- **현재 문제**: (정상 / 정체 / 데이터 없음 / 모니터 미연결 / 기타)
- **필요한 조치**: (없음 / cron 연결 / 모니터 추가 / 데이터 import / 공지 페이지 추가)
```

---

## 감사 절차 (순서대로 수행)

### Phase 1: 코드베이스 전체 탐색 — 외부 데이터 소스 식별

아래 패턴으로 전체 코드베이스를 검색하여 **모든 외부 데이터 참조**를 찾는다.

```bash
# 1-1. 외부 API URL 전체 추출
grep -rn "https://" app/lib/ app/api/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" | grep -v node_modules | grep -v ".next" | grep -v "localhost" | grep -v "supabase.co" | sort -u > /tmp/audit_external_urls.txt

# 1-2. Supabase 테이블 참조 전체 추출
grep -rn "\.from(" app/lib/ app/api/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" | grep -v node_modules | grep -v ".next" | sed "s/.*\.from('\([^']*\)'.*/\1/" | sort -u > /tmp/audit_supabase_tables.txt

# 1-3. data/ 디렉토리 JSON 파일 목록
ls -la data/*.json 2>/dev/null > /tmp/audit_data_files.txt

# 1-4. scripts/ 디렉토리 import/sync 스크립트 목록
ls -la scripts/*.py scripts/*.mjs scripts/*.ts 2>/dev/null > /tmp/audit_scripts.txt

# 1-5. cron 설정 (vercel.json)
cat vercel.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); (d.crons||[]).forEach(c=>console.log(c.schedule, c.path))" > /tmp/audit_crons.txt

# 1-6. 외장하드 파일 목록 (docs에서)
cat docs/EXTERNAL_DRIVE_FILES.md > /tmp/audit_external_drive.txt 2>/dev/null

# 1-7. tariff-api provider 파일들 (국가별 관세 API)
ls -la app/lib/cost-engine/tariff-api/ > /tmp/audit_tariff_providers.txt

# 1-8. 환경변수에서 외부 서비스 키 확인
grep -E "^[A-Z_]+=\S" .env.local 2>/dev/null | sed 's/=.*//' > /tmp/audit_env_keys.txt
```

위 결과를 모두 읽고, **각 외부 데이터 소스를 하나의 항목으로 식별**한다.
같은 소스가 여러 파일에서 참조되면 하나로 합친다.

### Phase 2: 카테고리별 상세 감사

각 카테고리별로 아래 세부 검사를 수행한다.

#### 2-A. Tariff & Duty Rates (관세율)

**검사 대상**:
- `app/lib/cost-engine/tariff-api/` 내 모든 provider 파일
- `app/api/v1/admin/update-tariffs/route.ts`
- `scripts/` 내 tariff import 스크립트
- Supabase: `duty_rates_live`, `live_duty_rate_cache`, `precomputed_landed_costs`, `macmap_ntlc_rates`, `macmap_agr_rates`, `macmap_min_rates`, `merged_duty_rates`

**확인 사항**:
- 각 국가별 관세 provider가 있는지 (US, EU, UK, CA, AU, KR, JP, CN, ASEAN, IN, TR, MX, BR 등)
- 각 provider의 데이터 소스 URL이 정확한지
- `live_duty_rate_cache` vs `precomputed_landed_costs` 갱신 경로 차이
- MacMap 데이터 빈티지(년도)가 최신인지
- **갭 판단**: POTAL이 지원하는 국가 목록(`list_supported_countries`) 대비 tariff provider가 없는 국가 식별

```bash
# 지원 국가 목록 확인
grep -rn "supportedCountries\|SUPPORTED_COUNTRIES\|country.*code" app/lib/cost-engine/ --include="*.ts" -l
# tariff provider 파일별 실제 소스 URL 확인
grep -n "https://" app/lib/cost-engine/tariff-api/*.ts
# Supabase에서 각 테이블의 최신 데이터 확인
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const tables = [
    { name: 'live_duty_rate_cache', col: 'updated_at' },
    { name: 'duty_rates_live', col: 'updated_at' },
    { name: 'precomputed_landed_costs', col: 'last_updated' },
    { name: 'macmap_ntlc_rates', col: 'created_at' },
  ];
  for (const t of tables) {
    const { data, error, count } = await sb.from(t.name).select(t.col, { count: 'exact' }).order(t.col, { ascending: false }).limit(1);
    if (error) { console.log('❌', t.name, error.message); continue; }
    const row = data?.[0];
    console.log(row ? '✅' : '⚠️', t.name, 'rows:', count, 'latest:', row?.[t.col] || 'N/A');
  }
})();
"
```

#### 2-B. Sanctions & Denied Party Screening (제재/거부자 심사)

**검사 대상**:
- `scripts/import_ofac_sdn.py`, `import_global_sanctions.py`, `import_csl.py`
- `app/api/v1/admin/sdn-sync/route.ts`
- `app/lib/cost-engine/screening/` 또는 `app/lib/compliance/`
- Supabase: `sanctioned_entities`, `sanctions_entries`, `sanctions_aliases`, `sanctions_ids`, `sanctions_addresses`, `sanctions_load_meta`, `screening_logs`

**확인 사항**:
- OFAC SDN: 자동 갱신 cron 실제 동작 여부 (health_check_logs 확인)
- EU/UK/UN 제재 리스트: import 스크립트 존재 여부, 자동화 여부
- US CSL (Consolidated Screening List): import 경로 확인
- 각 리스트의 마지막 import 날짜 (sanctions_load_meta 확인)
- **갭 판단**: 주요 제재 리스트(OFAC, EU, UK, UN, US CSL) 중 누락된 것, 캐나다(SEMA)/호주(DFAT) 리스트 유무

```bash
# 제재 관련 테이블 상태
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // sanctioned_entities 전체 수
  const { count: entCount } = await sb.from('sanctioned_entities').select('*', { count: 'exact', head: true });
  console.log('sanctioned_entities:', entCount, 'rows');
  // sanctions_load_meta 마지막 로드
  const { data: meta } = await sb.from('sanctions_load_meta').select('*').order('loaded_at', { ascending: false }).limit(5);
  if (meta) meta.forEach(m => console.log('  Load:', m.source_name || m.list_name, m.loaded_at, m.record_count, 'records'));
  // screening_logs 최근
  const { data: logs } = await sb.from('screening_logs').select('created_at').order('created_at', { ascending: false }).limit(1);
  console.log('Last screening:', logs?.[0]?.created_at || 'NONE');
})();
"
```

#### 2-C. Free Trade Agreements (FTA)

**검사 대상**:
- `app/lib/cost-engine/db/fta-db.ts`, `app/lib/cost-engine/hs-code/fta.ts`
- `app/lib/trade/roo-engine.ts`
- `app/api/v1/cron/fta-change-monitor/route.ts`
- Supabase: `fta_agreements`, `fta_members`, `fta_country_pairs`, `fta_rates_live`, `fta_product_rules`

**확인 사항**:
- 총 FTA 수 (현재 1,319개로 알려짐)
- 주요 FTA(USMCA, RCEP, CPTPP, KORUS, EU-UK TCA 등) 데이터 존재 확인
- RoO(원산지 규정) 데이터 범위 — 어떤 FTA까지 커버하는지
- FTA change monitor cron 동작 여부
- **갭 판단**: FTA rate 데이터가 있는 협정 vs 메타데이터만 있는 협정

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count: ftaCount } = await sb.from('fta_agreements').select('*', { count: 'exact', head: true });
  console.log('fta_agreements:', ftaCount);
  const { count: pairCount } = await sb.from('fta_country_pairs').select('*', { count: 'exact', head: true });
  console.log('fta_country_pairs:', pairCount);
  const { count: ruleCount } = await sb.from('fta_product_rules').select('*', { count: 'exact', head: true });
  console.log('fta_product_rules:', ruleCount);
  const { count: rateCount } = await sb.from('fta_rates_live').select('*', { count: 'exact', head: true });
  console.log('fta_rates_live:', rateCount);
  // Latest update
  const { data: latest } = await sb.from('fta_agreements').select('updated_at').order('updated_at', { ascending: false }).limit(1);
  console.log('Latest fta update:', latest?.[0]?.updated_at);
})();
"
```

#### 2-D. Exchange Rates (환율)

**검사 대상**:
- `app/lib/cost-engine/exchange-rate/exchange-rate-service.ts`
- `app/api/v1/admin/exchange-rate-sync/route.ts`
- Supabase: `exchange_rate_history`, `exchange_rate_cache`

**확인 사항**:
- Primary API (ExchangeRate-API) 동작 여부
- Fallback API (Fawaz Ahmed CDN) 동작 여부
- ECB daily sync cron 동작 여부
- 하드코딩 fallback rates 최신성 (currencies 목록, 환율 값이 현실적인지)
- **갭 판단**: API 무료 한도(1500 req/month) 대비 현재 사용량

```bash
# exchange rate 관련 코드 확인
grep -n "https://.*exchange\|https://.*currency\|https://.*er-api\|https://.*fawaz" app/lib/cost-engine/exchange-rate/*.ts
# DB 상태
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, count } = await sb.from('exchange_rate_history').select('created_at, base_currency', { count: 'exact' }).order('created_at', { ascending: false }).limit(3);
  console.log('exchange_rate_history:', count, 'rows');
  data?.forEach(r => console.log('  ', r.created_at, r.base_currency));
})();
"
```

#### 2-E. VAT/GST & Tax (부가세/소비세)

**검사 대상**:
- `app/lib/cost-engine/db/country-data-db.ts`
- `app/api/v1/vat/validate/route.ts` (EU VIES)
- Supabase: `vat_gst_rates`, `eu_reduced_vat_rates`, `vat_product_rates`, `us_state_sales_tax`, `us_state_tax_rates`, `de_minimis_thresholds`, `digital_services_tax`, `sub_national_taxes`, `special_tax_rules`

**확인 사항**:
- 각 국가별 VAT/GST 표준세율이 DB에 있는지
- EU 회원국별 reduced rate 데이터 유무
- US 주별 sales tax 데이터 유무
- de minimis 임계값 데이터 범위 (몇 개국 커버)
- EU VIES API 연동 상태
- **갭 판단**: 2025~2026에 VAT 세율이 변경된 국가(예: 에스토니아 22%→24% 등)가 반영되었는지

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const tables = ['vat_gst_rates','eu_reduced_vat_rates','us_state_sales_tax','de_minimis_thresholds','digital_services_tax','sub_national_taxes','special_tax_rules'];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    console.log(error ? '❌' : '✅', t, count || 0, 'rows');
  }
})();
"
```

#### 2-F. Trade Remedies (무역구제 — AD/CVD/Safeguard)

**검사 대상**:
- `app/lib/cost-engine/trade-remedy-lookup.ts`
- `app/api/v1/admin/trade-remedy-sync/route.ts`
- Supabase: `trade_remedies`, `country_regulatory_notes`

**확인 사항**:
- 현재 AD/CVD 케이스 수
- Section 301/232 추가관세 데이터 유무
- country_regulatory_notes 데이터 존재 여부 (진단에서 NULL이었음)
- trade-remedy-sync cron 동작 여부
- **갭 판단**: US 외 다른 국가(EU, Canada, Australia)의 trade remedy 데이터 유무

#### 2-G. HS Classification & Nomenclature (분류체계)

**검사 대상**:
- `app/lib/cost-engine/hs-code/hs-database.ts`
- `app/lib/cost-engine/gri-classifier/` 전체
- `app/lib/cost-engine/gri-classifier/data/` 내 데이터 파일들
- 외장하드: `hs_national_rules/` 디렉토리

**확인 사항**:
- HS 2022 기준인지 (WCO는 5년마다 개정, 다음은 2027)
- 국가별 national rules 파일 존재 여부 및 크기
- keyword_index.json 등 분류 보조 데이터 유무
- chapter-notes.ts, subheading-notes.ts 등 WCO Explanatory Notes 범위
- vector embedding 데이터 최신성 (regulation_vectors 테이블)
- **갭 판단**: HS2022 기준이 맞는지, national rules가 2026년 기준인지

```bash
# HS database 크기 및 구조
wc -l app/lib/cost-engine/hs-code/hs-database.ts
# GRI classifier 데이터 파일 목록
ls -la app/lib/cost-engine/gri-classifier/data/
# 외장하드 national rules 존재 여부
ls -la /Volumes/soulmaten/POTAL/hs_national_rules/ 2>/dev/null || echo "외장하드 미연결"
```

#### 2-H. Restrictions & Export Controls (수출입 규제)

**검사 대상**:
- `app/lib/cost-engine/restrictions/`
- `app/api/v1/export-controls/`
- Supabase: `restricted_items`, `dangerous_goods`, `embargo_programs`, `export_control_chart`

**확인 사항**:
- restricted_items 데이터 범위 (몇 개국, 몇 개 항목)
- ECCN 분류 데이터 존재 여부
- 수출 통제 차트(US BIS) 데이터 유무
- **갭 판단**: EU dual-use regulation (2021/821) 데이터 유무

#### 2-I. Regulatory Monitoring (규제 모니터링)

**검사 대상**:
- `app/api/v1/cron/federal-register-monitor/route.ts`
- `app/api/v1/cron/taric-rss-monitor/route.ts`
- `app/api/v1/cron/tariff-change-monitor/route.ts`
- `app/api/v1/cron/classification-ruling-monitor/route.ts`
- `app/api/v1/cron/macmap-update-monitor/route.ts`
- `app/api/v1/cron/wco-news-monitor/route.ts`
- `app/api/v1/cron/fta-change-monitor/route.ts`

**확인 사항**:
- 각 모니터가 실제로 어떤 URL을 감시하는지
- health_check_logs에서 각 모니터의 마지막 실행 시각과 상태
- 감지 후 자동 조치가 연결되어 있는지 (DB import, 알림 등)
- **갭 판단**: 감시해야 하는데 모니터가 없는 소스 (예: Australia/Canada/Japan 규제 변경)

```bash
# 각 monitor의 감시 대상 URL 추출
for f in app/api/v1/cron/*/route.ts; do echo "=== $f ==="; grep -n "https://" "$f" | head -5; done
# health_check_logs에서 cron 실행 기록
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('health_check_logs').select('overall_status, checked_at, checks').order('checked_at', { ascending: false }).limit(30);
  if (!data) { console.log('NO LOGS'); return; }
  data.forEach(row => {
    const age = Math.round((Date.now() - new Date(row.checked_at).getTime()) / (1000*60*60));
    const checks = typeof row.checks === 'string' ? JSON.parse(row.checks) : row.checks;
    const names = Array.isArray(checks) ? checks.map(c => c.name || c.label || '').filter(Boolean).join(', ') : '';
    console.log(row.overall_status, age + 'h ago', names.substring(0, 100));
  });
})();
"
```

#### 2-J. Country Metadata & Thresholds (국가 메타데이터)

**검사 대상**:
- `app/lib/cost-engine/db/country-data-db.ts`
- Supabase: `countries`, `country_profiles`, `customs_fees`
- `data/us-nexus-thresholds.json`

**확인 사항**:
- 지원 국가 수 및 목록
- 각 국가별 필수 메타데이터 완성도 (ISO code, currency, VAT rate, de minimis, region)
- customs_fees 데이터 범위
- **갭 판단**: country_profiles에 빈 필드가 많은 국가 식별

#### 2-K. Shipping & Logistics (물류)

**검사 대상**:
- `app/lib/utils/DeliveryStandard.ts`
- Supabase: `carrier_rate_cache`, `insurance_rate_tables`

**확인 사항**:
- 어떤 캐리어 데이터가 있는지
- 보험료 데이터 유무
- **갭 판단**: 실제 API 연동인지, 정적 데이터인지

#### 2-L. External Drive Files (외장하드 데이터)

**검사 대상**:
- `docs/EXTERNAL_DRIVE_FILES.md`
- `/Volumes/soulmaten/POTAL/` (연결 시)

**확인 사항**:
- 외장하드에 있지만 프로젝트에 미연결된 데이터
- Supabase에 import되어야 하는데 안 된 파일
- **갭 판단**: 외장하드 데이터 중 프로덕션에 필수인데 빠진 것

### Phase 3: 갭 분석 종합

Phase 2의 결과를 종합하여 아래 3개 테이블 생성:

#### 테이블 1: 정상 동작 중인 소스
| 소스 | 카테고리 | 갱신 주기 | 자동화 | 마지막 갱신 |
이 테이블에는 문제 없는 소스만 포함.

#### 테이블 2: 문제 있는 소스 (있는데 부실)
| 소스 | 문제 | 원인 | 필요 조치 | 우선순위 |
있지만 갱신 안 되거나, 데이터가 불완전하거나, 자동화가 빠진 것.

#### 테이블 3: 필요한데 없는 소스 (갭)
| 필요한 소스 | 이유 | 출처 | 권장 갱신 주기 | 우선순위 |
국제무역/관세 전문가 관점에서 POTAL에 있어야 하는데 없는 데이터.
예시 후보 (존재 여부 확인 후 판단):
- 캐나다 SEMA 제재 리스트
- 호주 DFAT 제재 리스트
- EU dual-use regulation 품목 리스트
- Incoterms 2020 규칙 데이터
- 각국 customs broker 수수료 데이터
- HS2022 → HS2027 전환 매핑 (아직 발표 안 됐을 수 있음)
- 각국 공휴일/세관 운영일 데이터

### Phase 4: 갱신 주기 분류표

모든 소스를 갱신 주기별로 최종 분류:

```
## 실시간 / 매일 (자동)
- Exchange Rates (ECB daily, live API fallback)
- OFAC SDN (daily check)
- ...

## 매주 (자동 모니터)
- FTA change monitor (Friday)
- Trade remedy sync (Monday)
- ...

## 매월 / 매분기 (모니터 + 수동 확인)
- MacMap update monitor (monthly 1st)
- WCO news monitor (monthly 15th)
- ...

## 연 1회 (수동 import — 1월/4월)
- Korea KCS tariff (Jan 1)
- Japan Customs tariff (Apr 1)
- ...

## 수시 (공지 기반)
- Section 301/232 (Executive Order 발표 시)
- EU regulation amendments (OJ 발표 시)
- ...

## 거의 안 바뀜 (등록만)
- WCO HS nomenclature (5년 주기, 다음 2027)
- Incoterms (10년 주기, 현재 2020)
- ...
```

### Phase 5: 권장 사항

감사 결과를 바탕으로:
1. **즉시 조치 필요** (데이터 정확성에 영향) — 우선순위 P0
2. **단기 개선** (1~2주 내) — 우선순위 P1
3. **중기 개선** (로드맵) — 우선순위 P2
4. **장기 고려** (nice-to-have) — 우선순위 P3

각 권장 사항에 구체적 이유와 예상 작업량 포함.

---

## 최종 출력

위 모든 내용을 `docs/DATA_SOURCE_AUDIT_REPORT.md`에 정리.
파일 구조:

```markdown
# POTAL Data Source Audit Report
# 감사 일시: [오늘 날짜 KST]
# 감사자: Claude Code (Opus)

## Executive Summary
- 총 소스 수: X개
- 정상: X개 / 문제: X개 / 갭: X개
- 즉시 조치 필요: X건

## Phase 1: 소스 목록 (전체)
## Phase 2: 카테고리별 상세
### 2-A. Tariff & Duty Rates
### 2-B. Sanctions & Screening
### ... (각 카테고리)
## Phase 3: 갭 분석
### 테이블 1: 정상
### 테이블 2: 문제
### 테이블 3: 갭
## Phase 4: 갱신 주기 분류
## Phase 5: 권장 사항
```

---

## 주의사항
- Supabase 쿼리 실행 시 `.env.local` 환경변수 사용
- 외장하드(`/Volumes/soulmaten/POTAL/`)는 연결 안 되어 있을 수 있음 — `docs/EXTERNAL_DRIVE_FILES.md`로 대체
- 테이블이 존재하지 않을 수 있음 — 에러 처리 필수
- **모든 판단에 근거 명시** — "이 소스가 필요하다"고 쓸 때 왜 필요한지 반드시 이유 작성
- 보고서는 한글로 작성, 기술 용어는 영어 그대로
