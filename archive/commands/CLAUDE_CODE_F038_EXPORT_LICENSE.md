# F038 Export License Management — 프로덕션 강화

> ⚠️ 이 기능(F038)만 작업합니다.

## 현재 파일
- `app/api/v1/compliance/export-license/route.ts` — 수출면허 API
- `app/lib/compliance/export-license.ts` — 수출면허 판정 로직

## 현재 상태: 50% (엠바고 리스트 구식, ECCN→면허 바이너리)

## CRITICAL 6개

### C1: 엠바고/제재국 리스트 하드코딩 + 구식 (export-license.ts)
['CU','IR','KP','SY','RU'] 고정. 실제 OFAC SDN은 수시 변경, 부분 제재도 있음.
**수정**: sanctions_entries DB 조회 + 부분 제재 구분
```typescript
// DB에서 실시간 제재 정보 조회
const { data: sanctions } = await supabase.from('sanctions_entries')
  .select('program, entry_type, sdn_type')
  .eq('country', destinationCountry)
  .limit(10);

const sanctionPrograms = sanctions?.map(s => s.program) || [];
const isFullEmbargo = FULL_EMBARGO_COUNTRIES.includes(destinationCountry);
const isPartialSanction = sanctionPrograms.length > 0 && !isFullEmbargo;

if (isFullEmbargo) {
  return { licenseRequired: true, type: 'COMPREHENSIVE_EMBARGO',
    action: 'Export prohibited without OFAC specific license. Denial policy applies.' };
}
if (isPartialSanction) {
  return { licenseRequired: 'depends', programs: sanctionPrograms,
    action: 'Partial sanctions in effect. Check specific OFAC programs.' };
}
```

### C2: ECCN→라이선스 판정이 바이너리
ECCN 있음 = license_required, 없음 = NLR. 실제로는 ECCN + 목적지 + 용도 조합으로 판정.
**수정**: Commerce Country Chart 매칭
```typescript
interface LicenseDetermination {
  eccn: string;
  destination: string;
  controlReasons: string[]; // NS, AT, NP 등
  licenseRequired: boolean;
  availableExceptions: string[];
  chartReference: string;
}

async function determineLicense(eccn: string, destination: string): Promise<LicenseDetermination> {
  const controlReasons = getControlReasons(eccn);
  const countryChart = await lookupCommerceCountryChart(destination, controlReasons);
  const licenseRequired = countryChart.some(c => c.restricted);
  const exceptions = licenseRequired ? await getAvailableExceptions(eccn, destination) : [];
  return { eccn, destination, controlReasons, licenseRequired, availableExceptions: exceptions,
    chartReference: `EAR Part 738, Supplement No. 1` };
}
```

### C3: License Exception 조건 미검증
LVS, TMP, TSR, ENC 등 각 예외마다 세부 조건 있음. 현재 예외 가능 여부만 true/false.
**수정**: 각 예외별 조건 체크
```typescript
const LICENSE_EXCEPTION_CHECKS: Record<string, (ctx: ExportContext) => ExceptionResult> = {
  LVS: (ctx) => {
    const thresholds: Record<string, number> = { '3A': 5000, '4A': 5000, DEFAULT: 2500 };
    const limit = thresholds[ctx.eccnCategory] || thresholds.DEFAULT;
    return { eligible: ctx.value <= limit, reason: ctx.value > limit ?
      `Value $${ctx.value} exceeds LVS limit $${limit}` : 'Within LVS threshold' };
  },
  TMP: (ctx) => ({
    eligible: ctx.isTemporary && ctx.returnDays <= 365,
    reason: !ctx.isTemporary ? 'Not a temporary export' : 'TMP requires return within 12 months'
  }),
  TSR: (ctx) => ({
    eligible: ctx.itemType === 'software' && ctx.eccnCategory === '5D',
    reason: 'TSR only for software under 5D'
  }),
  ENC: (ctx) => ({
    eligible: ctx.isEncryption && !['CU','IR','KP','SY'].includes(ctx.destination),
    reason: 'ENC for mass-market encryption, not available for E:1 countries'
  }),
};
```

### C4: 신청 양식/문서 생성 없음
license_required 판정만 하고 BIS Form BIS-748P 작성 안내 없음.
**수정**: 면허 신청 가이드 + 필요 정보 체크리스트
```typescript
if (licenseRequired && !exceptionAvailable) {
  response.applicationGuide = {
    form: 'BIS-748P (Multipurpose Application)',
    url: 'https://www.bis.doc.gov/index.php/licensing/forms-documents',
    requiredInfo: [
      'Applicant information (name, address, EIN)',
      'End-user name and address',
      'Item description and ECCN',
      'End-use statement',
      'Value and quantity',
      'Country of ultimate destination',
    ],
    processingTime: '30-90 days (average)',
    expeditedOption: 'Emergency processing available for certain items'
  };
}
```

### C5: Re-export 통제 없음
미국산 부품 25%+ 포함 제품 → 미국 수출통제 적용. 현재 직접 수출만 체크.
**수정**: de minimis rule 체크
```typescript
if (usOriginContentPercent !== undefined) {
  const DE_MINIMIS_THRESHOLD = ['CU','IR','KP','SY'].includes(destination) ? 10 : 25;
  if (usOriginContentPercent >= DE_MINIMIS_THRESHOLD) {
    response.reexportControl = {
      applicable: true,
      usContent: usOriginContentPercent,
      threshold: DE_MINIMIS_THRESHOLD,
      note: `US-origin content (${usOriginContentPercent}%) meets de minimis threshold (${DE_MINIMIS_THRESHOLD}%). EAR applies to re-export.`
    };
  }
}
```

### C6: 이력/상태 추적 없음
면허 신청 후 상태 추적(pending/approved/denied/returned) 없음.
**수정**: export_license_applications 테이블 활용
```typescript
// POST: 면허 신청 기록
await supabase.from('export_license_applications').insert({
  seller_id: sellerId, eccn, destination,
  status: 'pending', applied_at: new Date().toISOString(),
  reference_number: generateRefNumber()
});
// GET: 기존 면허 조회
const { data: existing } = await supabase.from('export_license_applications')
  .select('*').eq('seller_id', sellerId).eq('eccn', eccn)
  .eq('destination', destination).eq('status', 'approved').single();
if (existing) return { licenseRequired: true, existingLicense: existing };
```

## 수정 파일: 2개 (export-license.ts, export-license/route.ts) + migration
## 테스트 10개
```
1. EAR99 → NLR (면허 불필요)
2. 5A002 → CN → license_required + exceptions 체크
3. 전면 엠바고 (KP) → COMPREHENSIVE_EMBARGO
4. 부분 제재 (RU) → depends + programs
5. LVS: $6000 3A → 초과 → LVS 불가
6. ENC: mass-market → eligible
7. Re-export: US content 30% → EAR 적용
8. 면허 신청 기록 → DB 저장 확인
9. 기존 승인된 면허 → existingLicense 반환
10. applicationGuide → 필수 정보 체크리스트 포함
```

## 결과
```
=== F038 Export License — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 6개 | 테스트: 10개 | 빌드: PASS/FAIL
```
