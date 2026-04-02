# F040 Pre-Shipment Verification — 프로덕션 강화

> ⚠️ 이 기능(F040)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **구현됨 (CRITICAL 4개 + MISSING 2개)**

## 현재 파일
- `app/api/v1/verify/route.ts` — 종합 검증 (9개 체크)
- `app/api/v1/verify/pre-shipment/route.ts` — 사전 출하 검증 (8개 체크)
- `app/lib/cost-engine/restrictions/check.ts` — 제한 물품 체크
- `app/lib/cost-engine/restrictions/rules.ts` — 제한 규칙

## CRITICAL 버그 4개

### C1: 두 개의 verify 엔드포인트 — 서로 다른 체크 항목
**현재**:
- `/verify` → HS분류, HS검증, 관세계산, IOSS, 무역구제, FTA, 원산지, 제한, 제재 (9개)
- `/verify/pre-shipment` → HS유효성, 제한, 제재, 금수, 수출통제, de minimis, 서류, 가치합리성 (8개)
**문제**: 사용자가 어떤 걸 호출해야 할지 모름. 체크 항목이 다름.
**수정**:
```typescript
// /verify/route.ts를 마스터 엔드포인트로 통합
// mode 파라미터 추가:
// mode='quick' → 핵심 5개 체크 (HS, 제재, 제한, 금수, 수출통제) ~200ms
// mode='standard' → 현재 /verify 9개 체크 ~500ms (기본값)
// mode='comprehensive' → 9개 + pre-shipment 8개 = 중복 제거 15개 체크 ~1000ms

// /verify/pre-shipment은 deprecated 표시 + /verify?mode=comprehensive로 리다이렉트 안내
```

### C2: HS 코드 유효성 — 4자리만 검사 (pre-shipment/route.ts:43-54)
**현재 코드:**
```typescript
const { data } = await sb.from('product_hs_mappings')
  .select('id')
  .like('hs_code', `${hsCode.substring(0, 4)}%`)  // 4자리만!
  .limit(1);
```
**문제**: 6112.34 → 6112% 매칭 → 존재하면 PASS. 하지만 6112.99는 없을 수 있음.
**수정**:
```typescript
// 정확한 6자리 검증
const hs6 = hsCode.substring(0, 6);
const { data } = await sb.from('product_hs_mappings')
  .select('id')
  .eq('hs_code', hs6)
  .limit(1);

// 추가: gov_tariff_schedules에서도 검증 (7개국 10자리)
if (targetCountry) {
  const { data: govData } = await sb.from('gov_tariff_schedules')
    .select('id')
    .eq('country_code', targetCountry)
    .like('hs_code', `${hsCode}%`)
    .limit(1);
}
```

### C3: 금수(embargo) 체크 — 존재하지 않는 테이블 쿼리 (pre-shipment/route.ts:87-113)
**현재 코드:**
```typescript
const { data: embargoes } = await sb.from('embargo_programs')
  .select('program_type, program_name, sectors, description')
  .eq('country_code', destination);
```
**문제**: `embargo_programs` 테이블 미존재 → 항상 null → 금수 체크 스킵
**수정**: sanctions_entries 테이블 활용 (이미 21,301건 있음)
```typescript
// 방법 1: sanctions_entries에서 국가 수준 제재 조회
const { data: sanctions } = await sb.from('sanctions_entries')
  .select('source, entity_type, program, name')
  .eq('entity_type', 'country')
  .ilike('name', `%${destinationName}%`)
  .limit(5);

// 방법 2: 하드코딩 금수 국가 리스트 (OFAC 기준)
const EMBARGOED_COUNTRIES = ['CU', 'IR', 'KP', 'SY', 'RU']; // Cuba, Iran, N.Korea, Syria, Russia(일부)
if (EMBARGOED_COUNTRIES.includes(destination)) {
  checklist.push({
    item: 'Embargo Check',
    status: 'FAIL',
    detail: `${destination} is subject to comprehensive US sanctions. Shipment prohibited without OFAC license.`
  });
}
```

### C4: 리스크 점수 — FAIL이 있어도 MEDIUM 판정 (pre-shipment/route.ts:188-194)
**현재 코드:**
```typescript
riskScore = Math.min(riskScore, 100);
const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
```
**문제**: FAIL 1개(40점) + WARNING 1개(15점) = 55점 = MEDIUM. 하지만 FAIL은 출하 불가!
**수정**:
```typescript
const failCount = checklist.filter(c => c.status === 'FAIL').length;
const riskLevel = failCount > 0 ? 'BLOCKED' : riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
const shipmentAllowed = failCount === 0;

// 응답에 추가:
return {
  riskLevel,
  riskScore,
  shipmentAllowed,  // FAIL이 하나라도 있으면 false
  blockedReasons: checklist.filter(c => c.status === 'FAIL').map(c => c.detail),
  ...
};
```

## MISSING 기능 2개

### M1: 수입자/구매자 제재 스크리닝
**수정**: verify에 buyerName/buyerCountry 파라미터 추가
```typescript
// 요청에 buyer 정보 추가
interface VerifyRequest {
  ...existing,
  buyerName?: string;
  buyerCountry?: string;
  buyerAddress?: string;
}

// sanctions 스크리닝 체크 추가
if (buyerName) {
  const screenResult = await screenDeniedParty(buyerName, buyerCountry);
  if (screenResult.matchFound) {
    checklist.push({
      item: 'Buyer Sanctions Screening',
      status: 'FAIL',
      detail: `Buyer "${buyerName}" matches denied party: ${screenResult.matchDetails}`
    });
  }
}
```

### M2: 검증 결과 저장 + 이력 조회
**수정**: 검증 결과를 DB에 저장
```typescript
// verification_logs 테이블에 저장
await sb.from('verification_logs').insert({
  seller_id: sellerId,
  shipment_ref: shipmentRef,
  risk_level: riskLevel,
  risk_score: riskScore,
  shipment_allowed: shipmentAllowed,
  checklist: JSON.stringify(checklist),
  created_at: new Date().toISOString()
});

// GET /api/v1/verify/history?sellerId=xxx → 과거 검증 결과 조회
```

## 수정할 파일 목록
1. `app/api/v1/verify/route.ts` — C1(통합), C4(리스크), M1(구매자), M2(저장)
2. `app/api/v1/verify/pre-shipment/route.ts` — C2(HS검증), C3(금수), deprecated 표시
3. `app/api/v1/verify/history/route.ts` — **신규** (검증 이력)
4. `supabase/migrations/047_verification_logs.sql` — **신규**

## 마이그레이션 (047)
```sql
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  shipment_ref TEXT,
  hs_code TEXT,
  origin TEXT,
  destination TEXT,
  risk_level TEXT NOT NULL,
  risk_score INT,
  shipment_allowed BOOLEAN NOT NULL,
  checklist JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_seller ON verification_logs(seller_id, created_at DESC);
```

## 테스트 (14개)
```
1. mode='quick': 5개 체크만 실행, <300ms
2. mode='standard': 9개 체크 실행 (기본값)
3. mode='comprehensive': 15개 체크 실행
4. HS 검증: 유효한 6자리 → PASS
5. HS 검증: 잘못된 6자리 → FAIL
6. 금수 체크: destination='KP' → FAIL (North Korea)
7. 금수 체크: destination='US' → PASS
8. 리스크: FAIL 1개 → riskLevel='BLOCKED', shipmentAllowed=false
9. 리스크: WARNING만 → riskLevel='MEDIUM', shipmentAllowed=true
10. 구매자 스크리닝: 제재 대상 이름 → FAIL
11. 구매자 스크리닝: 정상 이름 → PASS
12. 이력 저장: 검증 후 verification_logs에 기록
13. 이력 조회: GET /verify/history → 최근 검증 목록
14. deprecated: /verify/pre-shipment 호출 시 deprecated 경고 헤더
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 14개 PASS
3. embargo_programs 참조 0건 확인 (sanctions_entries로 대체됨)
4. FAIL → BLOCKED 매핑 확인
5. 기존 /verify 엔드포인트 호환성 (mode 미지정 시 standard)
```

## 결과
```
=== F040 Pre-Shipment Verification — 강화 완료 ===
- 수정 파일: 2개
- 신규 파일: 2개 (history/route.ts, migration)
- CRITICAL 수정: 4개
- MISSING 추가: 2개
- 테스트: 14개
- 빌드: PASS/FAIL
```
