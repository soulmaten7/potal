# F008 Audit Trail — 프로덕션 강화 (40% → 100%)

> ⚠️ 이 기능(F008)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **40% 구현** — write만 있고 query/filter/export 없음

## 현재 구현 분석
- `app/lib/data-management/audit-trail.ts` (57행): AuditEntry 인터페이스 + logAudit() + getRecentAudits()
- `app/api/v1/cron/data-management/route.ts` (79행): 최근 감사 5건 카운트만 로깅
- getRecentAudits()는 최근 20건만 반환, 필터 없음

## CRITICAL 이슈 4개

### C1: 쿼리/필터 API 없음 (audit-trail.ts:45-56)
**현재**: `getRecentAudits(limit=20)` — 최근 N건만 반환, 필터 불가
**수정**: 아래 함수들 추가
```typescript
export async function queryAudits(filters: {
  actor?: string;
  action?: AuditEntry['action'];
  area?: number;
  dateFrom?: string;
  dateTo?: string;
  validationPassed?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ data: AuditEntry[]; total: number; page: number; pages: number }> {
  // Supabase query builder로 동적 필터 구축
  // 페이지네이션 필수 (기본 page=1, pageSize=50)
}
```

### C2: 검색 API 엔드포인트 없음
**수정**: `app/api/v1/audit/route.ts` 신규 생성
```typescript
// GET /api/v1/audit?actor=system&action=update&dateFrom=2026-03-01&page=1
// 응답: { data: [...], pagination: { total, page, pages } }

// GET /api/v1/audit/export?format=csv&dateFrom=2026-03-01
// 응답: Content-Type: text/csv (감사 보고서)
```

### C3: 보존 정책 없음 — 무한 증가
**수정**: audit-trail.ts에 보존 로직 추가
```typescript
export async function cleanupOldAudits(retentionDays: number = 365): Promise<number> {
  // 1년 이상 된 감사 로그 → archive_audit_logs 테이블로 이동
  // 원본 삭제 (아카이브 확인 후)
  // 반환: 이동된 건수
}
```
+ data-management cron에 월 1회 cleanup 호출 추가

### C4: 감사 로그 변경 방지 없음 (Immutability)
**수정**: DB migration 추가
```sql
-- 046_audit_trail_enhancements.sql
-- 1. UPDATE/DELETE 방지 트리거
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable_trigger
BEFORE UPDATE OR DELETE ON data_update_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 2. 아카이브 테이블
CREATE TABLE IF NOT EXISTS archive_audit_logs (
  LIKE data_update_log INCLUDING ALL
);

-- 3. 인덱스 추가 (쿼리 성능)
CREATE INDEX IF NOT EXISTS idx_audit_actor ON data_update_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_action ON data_update_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON data_update_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_area ON data_update_log(area);
```

## MISSING 기능 3개

### M1: Actor 검증 없음
**수정**: logAudit()에 actor 검증 추가
```typescript
const VALID_ACTORS = ['system', 'cron', 'admin', 'api', 'user'] as const;
// actor가 이 목록에 없으면 'unknown' + 경고 로그
```

### M2: 내보내기 기능 없음
**수정**: /api/v1/audit/export 엔드포인트 추가 (위 C2에 포함)
- CSV, JSON 형식 지원
- 날짜 범위 필터
- 컴플라이언스 보고서용 헤더 포함

### M3: 감사 대시보드 데이터 없음
**수정**: /api/v1/audit/stats 엔드포인트 추가
```typescript
// GET /api/v1/audit/stats?period=30d
// 응답: {
//   totalEntries: 1234,
//   byAction: { create: 500, update: 400, delete: 100, ... },
//   byActor: { system: 800, cron: 300, api: 134 },
//   failedValidations: 12,
//   avgEntriesPerDay: 41
// }
```

## 수정할 파일 목록
1. `app/lib/data-management/audit-trail.ts` — queryAudits, cleanupOldAudits, actor 검증 추가
2. `app/api/v1/audit/route.ts` — **신규** (검색 + 필터 API)
3. `app/api/v1/audit/export/route.ts` — **신규** (CSV/JSON 내보내기)
4. `app/api/v1/audit/stats/route.ts` — **신규** (통계 API)
5. `app/api/v1/cron/data-management/route.ts` — cleanup 호출 추가
6. `supabase/migrations/046_audit_trail_enhancements.sql` — **신규**

## 테스트 (10개)
```
1. logAudit(): 유효한 AuditEntry → data_update_log에 삽입 성공
2. logAudit(): 잘못된 actor → 'unknown'으로 대체 + 경고
3. queryAudits(): actor='system' 필터 → 시스템 감사만 반환
4. queryAudits(): dateFrom/dateTo 범위 → 해당 기간만 반환
5. queryAudits(): 페이지네이션 → page=2, pageSize=10 → 11~20번째 결과
6. GET /audit → 기본 최근 50건 반환
7. GET /audit?action=delete → delete 감사만 반환
8. GET /audit/export?format=csv → Content-Type: text/csv
9. GET /audit/stats?period=30d → 통계 JSON 반환
10. Immutability: data_update_log UPDATE 시도 → 에러 (트리거 작동)
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 10개 PASS
3. curl로 /api/v1/audit 엔드포인트 테스트
4. migration SQL 문법 확인
5. 기존 data-management cron 정상 작동 확인
```

## 결과
```
=== F008 Audit Trail — 40% → 100% 완료 ===
- 신규 파일: 4개
- 수정 파일: 2개
- 마이그레이션: 1개
- 테스트: 10개
- 빌드: PASS/FAIL
```
