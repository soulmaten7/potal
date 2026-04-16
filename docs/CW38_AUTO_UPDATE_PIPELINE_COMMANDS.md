# CW38 Phase 2 — 자동 갱신 파이프라인 구축
# 실행: 터미널1 (Opus) 또는 터미널3 (Opus)
# 예상 소요: 2~3시간
# 마지막 업데이트: 2026-04-17

---

## 목적

CW38 Phase 1에서 32개 데이터 소스를 DB로 옮기고 Registry에 등록했지만,
**실제 자동 갱신이 되는 소스는 5개뿐**이다 (exchange-rate, sdn, federal-register, update-tariffs, taric-rss).

나머지 27개 소스 중 갱신이 의미 있는 것들에 대해
"공식 발표 → 감지 → DB 반영" 파이프라인을 구축한다.

---

## 현실적 분류

모든 데이터가 API로 자동 가져올 수 있는 건 아니다.
소스별로 가능한 자동화 수준이 다르다:

### Tier 1: 완전 자동화 가능 (API 존재)
이미 cron 있거나, API가 있어서 cron 추가하면 되는 것들:

| 소스 | 현재 상태 | 필요 작업 |
|------|---------|---------|
| 7개국 관세율 (update-tariffs) | ✅ cron 있음 + CW38에서 DB 연결 수정 | 없음 |
| 환율 (exchange-rate-sync) | ✅ 완전 자동 | 없음 |
| OFAC SDN (sdn-sync) | ✅ 완전 자동 | 없음 |
| Federal Register (federal-register-monitor) | ✅ 감지+자동 import | 없음 |
| EU TARIC RSS (taric-rss-monitor) | ⚠️ 감지만 | **Step 1: 자동 import 추가** |

### Tier 2: 반자동화 가능 (웹 스크래핑 or 공시 페이지 모니터)
API는 없지만 공식 페이지를 주기적으로 체크해서 변경 감지 가능:

| 소스 | 공식 페이지 | 갱신 주기 | 필요 작업 |
|------|-----------|---------|---------|
| VAT/GST 세율 | Tax Foundation 연간 보고서 | 연 1회 (1/1) | **Step 2: 연간 VAT 모니터 cron** |
| De minimis | Global Express Association | 비정기 | **Step 3: de minimis 모니터 cron** |
| ECCN (BIS CCL) | Federal Register BIS 공시 | 비정기 | federal-register-monitor에서 이미 감지 |
| US state sales tax | Tax Foundation 연간 | 연 1회 | **Step 4: US tax 모니터** |

### Tier 3: 수동 유지 (자동화 불가능하거나 비효율)
원본이 PDF/Excel이거나, 갱신 주기가 5년+라서 자동화 의미 없음:

| 소스 | 이유 | 대안 |
|------|------|------|
| MacMap (245M rows) | Python bulk import, 연 1회 | macmap-update-monitor가 변경 감지 → 알림 |
| WCO HS codes | 5년 주기 (다음 2027) | wco-news-monitor가 발표 감지 → 알림 |
| FTA product rules | 협정별 개별 확인 필요 | fta-change-monitor가 변경 감지 → 알림 |
| Customs rulings | CBP 사이트 스크래핑 | rulings-update-monitor가 감지 → 알림 |

---

## Step 1: TARIC RSS 자동 Import 추가

현재 `taric-rss-monitor`는 변경을 감지만 하고 DB에 반영 안 함.
감지된 regulation 변경을 `country_regulatory_notes`에 자동 기록.

### 파일: `app/api/v1/cron/taric-rss-monitor/route.ts`

기존 코드 패턴 확인 후 아래 로직 추가:

```
현재: RSS 새 항목 감지 → health_check_logs에 기록 → 끝
추가: RSS 새 항목 감지 → country_regulatory_notes에 INSERT → savePublicationToDb() 호출
```

```bash
# 현재 코드 확인
cat app/api/v1/cron/taric-rss-monitor/route.ts

# 수정 내용:
# 1. import { logImportResult, isAutoImportEnabled } from '@/app/lib/data-management/import-trigger'
# 2. import { savePublicationToDb } from '@/app/lib/data-management/publication-updater'
# 3. 새 RSS 항목 감지 후:
#    if (isAutoImportEnabled('TARIC_RSS')) {
#      // EU 27개국에 대해 regulatory note 삽입
#      for (const item of newItems) {
#        await supabase.from('country_regulatory_notes').upsert({
#          country_code: 'EU',
#          note_type: 'tariff_change',
#          title: item.title,
#          source_url: item.link,
#          effective_date: item.pubDate,
#          created_at: new Date().toISOString(),
#        }, { onConflict: 'country_code,title' });
#      }
#      await savePublicationToDb('EU TARIC', {
#        publication: `CN 2026 + ${latestItem.title.substring(0, 40)}`,
#        reference: latestItem.title.substring(0, 60),
#      });
#    }
```

---

## Step 2: VAT/GST 연간 모니터 Cron 신설

매년 1월에 각국이 VAT 세율을 변경하는 경우가 있음.
Tax Foundation이 연간 보고서를 발행하고, OECD도 VAT rate 데이터를 공개.

### 새 파일: `app/api/v1/cron/vat-rate-monitor/route.ts`

감지 방식: OECD VAT rate API + Tax Foundation 페이지 변경 감지

```bash
# 기존 모니터 패턴 참조
cat app/api/v1/cron/federal-register-monitor/route.ts | head -30

# 새 cron 생성
# 파일: app/api/v1/cron/vat-rate-monitor/route.ts
```

```typescript
// 구조 설계:
// 1. OECD consumption tax API에서 최신 VAT 세율 fetch
//    https://stats.oecd.org/SDMX-JSON/data/TABLE4.1/...
//    (38개 OECD 국가 VAT 세율 JSON 제공)
//
// 2. 현재 country_profiles의 vat_rate와 비교
//
// 3. 차이 발견 시:
//    a) country_profiles UPDATE (자동)
//    b) health_check_logs에 yellow 기록 (검토 알림)
//    c) savePublicationToDb() 호출
//
// 4. OECD 미포함 국가 (비OECD 200+):
//    → 연 1회 수동 검증 (1월) — 이건 자동화 불가
//
// 스케줄: 매월 1일 09:00 UTC (연간 변경이지만 월간 체크로 빠른 감지)
// vercel.json: { "schedule": "0 9 1 * *" }
```

### vercel.json cron 추가:

```json
{
  "path": "/api/v1/cron/vat-rate-monitor",
  "schedule": "0 9 1 * *"
}
```

---

## Step 3: De Minimis 변경 모니터 Cron 신설

De minimis 변경은 비정기적이지만 영향이 큼 (예: US IEEPA Aug 2025 CN/HK $0).
Federal Register monitor가 US 변경은 이미 감지하지만, 다른 나라는 안 잡힘.

### 새 파일: `app/api/v1/cron/de-minimis-monitor/route.ts`

감지 방식: Global Express Association 페이지 + 주요국 customs 사이트 변경 감지

```typescript
// 구조 설계:
// 1. 주요 10개국 customs 사이트의 de minimis 관련 페이지 HEAD 요청
//    (last-modified 또는 content-length 변경 감지)
//
// 2. 변경 감지 시:
//    a) health_check_logs에 yellow 기록
//    b) 실제 값 파싱은 수동 (사이트마다 구조 다름)
//    c) country_profiles의 de_minimis 필드 업데이트는 확인 후 수동 트리거
//
// 핵심: "감지 + 알림" 자동화. 실제 값 반영은 수동 확인 후.
//
// 스케줄: 매주 월요일 08:00 UTC
// vercel.json: { "schedule": "0 8 * * 1" }
```

---

## Step 4: US State Sales Tax 연간 모니터

각 주가 매년 세율을 변경할 수 있음. Tax Foundation이 연간 보고서 발행.

### 새 파일: `app/api/v1/cron/us-tax-monitor/route.ts`

```typescript
// 구조 설계:
// 1. Tax Foundation sales tax 페이지 변경 감지
//    https://taxfoundation.org/data/all/state/2026-sales-taxes/
//    HEAD 요청 → last-modified 비교
//
// 2. 변경 감지 시:
//    a) health_check_logs에 yellow
//    b) 페이지 내용에서 세율 파싱 시도 (table 구조 안정적)
//    c) us_state_sales_tax 테이블과 비교
//    d) 차이 있으면 자동 UPDATE + alert
//
// 스케줄: 매월 1일 10:00 UTC
// vercel.json: { "schedule": "0 10 1 * *" }
```

---

## Step 5: country_profiles 연쇄 갱신 트리거

VAT, de minimis, 환율 등이 바뀌면 country_profiles도 업데이트되어야 함.
개별 cron이 각자 테이블을 업데이트할 때, country_profiles도 함께 갱신하는 구조.

### 새 파일: `app/lib/data-management/country-profile-sync.ts`

```typescript
// 공통 유틸리티:
//
// export async function syncCountryProfileField(
//   countryCode: string,
//   field: 'vat_rate' | 'de_minimis' | 'de_minimis_usd' | 'avg_duty_rate' | 'currency',
//   newValue: number | string,
//   source: string
// ) {
//   // 1. country_profiles에서 현재 값 조회
//   // 2. 값이 다르면 UPDATE
//   // 3. health_check_logs에 변경 기록
//   // 4. 변경 이력을 별도 country_profile_changes 테이블에 기록 (감사 추적)
// }
//
// 사용 예:
// VAT 모니터가 DE의 VAT 19%→20% 감지 시:
//   await syncCountryProfileField('DE', 'vat_rate', 0.20, 'oecd_api');
//   → country_profiles UPDATE + 변경 로그 기록
```

---

## Step 6: vercel.json cron 등록 + 빌드 검증

```bash
# 현재 vercel.json cron 목록 확인
cat vercel.json | grep -A 2 "schedule"

# 새 cron 3개 추가:
# vat-rate-monitor: "0 9 1 * *" (매월 1일)
# de-minimis-monitor: "0 8 * * 1" (매주 월)
# us-tax-monitor: "0 10 1 * *" (매월 1일)

# 빌드 검증
npm run build
```

---

## Step 7: 자동 갱신 커버리지 최종 현황 업데이트

Step 1~6 완료 후 예상 커버리지:

| 자동화 레벨 | Before (CW38 Phase 1) | After (Phase 2) |
|------------|----------------------|-----------------|
| **auto_cron** (완전 자동) | 5 | 6 (+TARIC auto-import) |
| **auto_monitor + alert** | 10 | 13 (+VAT, de minimis, US tax) |
| **semi_auto** (감지→수동확인) | 2 | 5 (+country_profiles sync trigger) |
| **manual** | 15 | 8 (모니터로 승격된 것들 제외) |

갱신 불가능한 manual 8개:
- MacMap 245M (Python bulk — 모니터는 있지만 자동 import 불가)
- WCO HS codes (5년 주기)
- FTA product rules (협정별 개별)
- Customs rulings (645K — 파이프라인 있지만 수동 트리거)
- Restricted items (비정기)
- ECCN entries (비정기, Federal Register에서 감지)
- Country reference data (거의 안 바뀜)
- Precomputed cache (내부 배치)

---

## 실행 순서 (Claude Code)

1. **Step 1** (TARIC auto-import) — 15분
2. **Step 2** (VAT 모니터 신설) — 30분
3. **Step 3** (de minimis 모니터 신설) — 20분
4. **Step 4** (US tax 모니터 신설) — 20분
5. **Step 5** (country-profile-sync 유틸) — 20분
6. **Step 6** (vercel.json + 빌드) — 10분
7. **Step 7** (문서 업데이트) — 10분
8. `git commit && git push`

---

## 참고: 기존 cron 패턴 요약

모든 새 cron은 기존 패턴을 따름:

```typescript
// 공통 구조:
export async function GET(request: NextRequest) {
  // 1. Auth 검증 (Bearer token)
  // 2. Supabase 초기화
  // 3. 데이터 소스 확인 (HEAD or API query)
  // 4. 변경 감지
  // 5. 변경 있으면 DB upsert
  // 6. health_check_logs에 결과 기록
  // 7. JSON 응답 반환
}
```

참조 파일:
- `app/api/v1/admin/exchange-rate-sync/route.ts` — 완전 자동 패턴
- `app/api/v1/admin/sdn-sync/route.ts` — HEAD + 조건부 fetch 패턴
- `app/api/v1/cron/federal-register-monitor/route.ts` — 날짜 기반 delta 쿼리 패턴
- `app/lib/data-management/import-trigger.ts` — logImportResult(), isAutoImportEnabled()
- `app/lib/data-management/publication-updater.ts` — savePublicationToDb()
