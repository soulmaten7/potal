# CW38 Ghost Table Fix — Cron↔Engine Disconnect Resolution
# 작업일: 2026-04-17
# 상태: tariff-updater.ts 수정 완료, 빌드 검증 필요

---

## 핵심 문제 (Data Flow Trace에서 발견)

```
update-tariffs cron ──▶ live_duty_rate_cache (❌ 테이블 미존재!)
GlobalCostEngine   ◀── duty_rates_live      (0 rows — 데이터 안 들어옴)
```

Cron이 매일 7개 정부 API에서 관세율을 가져오지만, **존재하지 않는 테이블**에 쓰고 있어서 결과가 전부 버려짐.

---

## 수정 내용

### 1. tariff-updater.ts (완료)
**파일**: `app/lib/cost-engine/updater/tariff-updater.ts` L71-98

변경 사항:
- **테이블명**: `live_duty_rate_cache` → `duty_rates_live`
- **컬럼 매핑**:
  | 기존 (잘못된) | 수정 (올바른) | 설명 |
  |-------------|------------|------|
  | `duty_rate` | `mfn_rate` | GlobalCostEngine이 읽는 필드명 |
  | `source` | `source_api` | 소스 API 식별자 |
  | `updated_at` | `effective_date` | 날짜 형식도 ISO date로 변경 |
  | (없음) | `additional_tariff: 0` | 추가 |
  | (없음) | `anti_dumping_rate: 0` | 추가 |
  | (없음) | `invalidated_at: null` | 추가 |
  | `destination_country` | `destination_country.toUpperCase()` | 대문자 정규화 추가 |

### 2. fta_rates_live (P1 — 보류)
- `getFtaRateFromLiveDb()` — 0 rows라 항상 null 반환, 에러 없이 fallback
- INSERT 경로 없음 → dead code지만 무해
- 향후 FTA live rate 연동 시 활용 가능 → 코드 유지

### 3. fta_country_pairs (정상 — 조치 불필요)
- Migration 014에서 생성 + RCEP 등 데이터 seeding 완료
- Migration 015의 stored procedure에서 사용 중
- **유령 테이블이 아님** — 정상 운영 중

---

## 빌드 검증 (Claude Code 터미널에서 실행)

```bash
# 1. TypeScript 컴파일 검증
npx tsc --noEmit

# 2. 전체 빌드
npm run build

# 3. 수정 확인
grep -n "duty_rates_live\|live_duty_rate_cache" app/lib/cost-engine/updater/tariff-updater.ts
# 기대 결과: duty_rates_live만 나와야 함

# 4. 전체 코드에서 live_duty_rate_cache 잔존 참조 확인
grep -rn "live_duty_rate_cache" app/ --include="*.ts"
# 기대 결과: 0건 (docs/ 에서만 나와야 정상)
```

---

## Supabase 확인 필요 사항

`duty_rates_live` 테이블이 실제로 존재하고 스키마가 맞는지 확인:

```sql
-- 테이블 존재 여부
SELECT count(*) FROM duty_rates_live;

-- 스키마 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'duty_rates_live'
ORDER BY ordinal_position;

-- UNIQUE constraint 확인 (upsert의 onConflict 키)
-- tariff-api-client.ts: onConflict: 'hs_code,destination_country'
-- tariff-updater.ts: REST API Prefer: resolution=merge-duplicates
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'duty_rates_live';
```

**주의**: REST API의 `resolution=merge-duplicates`는 테이블에 UNIQUE constraint가 있어야 동작.
Migration 005에서 `UNIQUE(hs_code, destination_country)` 또는 PRIMARY KEY가 설정되어 있는지 확인 필요.

---

## 수정 후 예상 효과

```
수정 전:
  Cron → live_duty_rate_cache (❌ 미존재) → 결과 버려짐
  Engine → duty_rates_live (0 rows) → Stage 3 static DB fallback

수정 후:
  Cron → duty_rates_live (✅ 연결됨) → 7개국 × 50 HS codes = 350 rows
  Engine → duty_rates_live (350+ rows) → Stage 2 hit → 더 정확한 최신 세율
```

다음 cron 실행(매일 04:00 UTC) 후 `duty_rates_live` 테이블에 데이터가 쌓이기 시작.
