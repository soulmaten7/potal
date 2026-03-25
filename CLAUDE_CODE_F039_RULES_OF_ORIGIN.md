# F039 Rules of Origin (RoO) — 프로덕션 강화

> ⚠️ 이 기능(F039)만 작업합니다.

## 현재 파일
- `app/lib/trade/roo-engine.ts` (109행) — RoO 판정 엔진
- `app/api/v1/fta/eligibility/route.ts` (37행) — FTA 적격성 API

## CRITICAL 5개

### C1: RVC 임계값 하드코딩 (roo-engine.ts:30-33)
```typescript
const RVC_THRESHOLDS = { 'USMCA': 75, 'KORUS': 35, 'CPTPP': 45, 'DEFAULT': 40 };
```
HS 챕터별 예외 없음 (예: USMCA 자동차 75%, 섬유 62.5% 다름).
**수정**: macmap_trade_agreements 테이블에서 RVC 조회
```typescript
const { data: ftaRule } = await supabase.from('macmap_trade_agreements')
  .select('rvc_threshold, rvc_method, chapter_exceptions')
  .eq('agreement_name', ftaName)
  .eq('hs_chapter', hsCode.substring(0,2))
  .single();
const threshold = ftaRule?.rvc_threshold || RVC_THRESHOLDS[ftaName] || 40;
```

### C2: 실질적 변환(Substantial Transformation) 체크 없음 (Lines 63-88)
관세 분류 변경(CTH)만 확인, 변환 충분성 미검증.
**수정**: 부가가치 비율 체크 추가
```typescript
if (tariffShift && materialCostPercentage) {
  const isSubstantial = materialCostPercentage > 0.20; // 원재료비 >20%
  if (!isSubstantial) {
    result.tariffShiftValid = false;
    result.warning = 'Tariff shift detected but transformation may not be "substantial" (material cost <20% of product value)';
  }
}
```

### C3: PE(원산지) 로직 불완전
원산지 재료 사용 시 RVC에 포함해야 하는데, 전체 로컬 컨텐츠만 계산.
**수정**: originatingMaterialValue 파라미터 추가
```typescript
interface RooInput {
  productValue: number;
  localContentValue: number;
  originatingMaterialValue?: number; // FTA 회원국 원산 재료비
  nonOriginatingMaterialValue?: number;
}
// RVC = (productValue - nonOriginatingMaterialValue) / productValue × 100
```

### C4: Cumulation(누적) 로직 없음
RCEP 대각선 누적: 다른 회원국 재료도 원산지로 인정.
**수정**: inputOrigins 파라미터 + FTA 회원국 체크
```typescript
if (ftaName === 'RCEP' && inputOrigins?.length) {
  const rcepMembers = ['AU','BN','KH','CN','ID','JP','KR','LA','MY','MM','NZ','PH','SG','TH','VN'];
  const originatingInputs = inputOrigins.filter(o => rcepMembers.includes(o));
  // originatingInputs의 가치를 RVC 계산에 포함
}
```

### C5: FTA 유효기간 미확인
폐지되었거나 아직 발효 안 된 FTA도 적격으로 판정.
**수정**: agreement 유효기간 체크
```typescript
const { data: fta } = await supabase.from('macmap_trade_agreements')
  .select('effective_date, expiry_date, status')
  .eq('agreement_name', ftaName).single();
if (fta?.status !== 'active' || new Date() < new Date(fta.effective_date)) {
  return { eligible: false, reason: `FTA "${ftaName}" is not currently active` };
}
```

## MISSING 4개
M1: 원산지 증명서 검증 — CoO 번호/형식 validation
M2: De minimis 규칙 — 비원산지 재료 < X% 이면 자동 적격
M3: 면제 목록 — 일부 HS 코드는 RoO에서 제외
M4: 절감액 표시 — FTA 적용 시 vs 미적용 시 관세 차이

## 수정 파일: 2개 (roo-engine.ts, fta/eligibility/route.ts)
## 테스트 10개
```
1. USMCA: US→CA 의류 → RVC 40% 통과 → eligible: true
2. USMCA: 자동차 RVC 74% → eligible: false (75% 미달)
3. CPTPP: JP→AU → RVC 45% 통과 → eligible: true
4. CTH: HS 변경 없음 → tariffShift: false
5. Cumulation: RCEP 회원국 재료 → RVC에 포함
6. 비활성 FTA → eligible: false + 사유
7. De minimis: 비원산 재료 7% → 자동 적격
8. PE 로직: originatingMaterial 포함 RVC 계산
9. 절감액: FTA 적용 시 $50 절감 표시
10. 알 수 없는 FTA → "FTA not found" 에러
```

## 결과
```
=== F039 Rules of Origin — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 5개, MISSING 4개 | 테스트: 10개 | 빌드: PASS/FAIL
```
