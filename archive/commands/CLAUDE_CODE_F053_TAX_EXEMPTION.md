# F053 Tax Exemption Certificates — 프로덕션 강화

> ⚠️ 이 기능(F053)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/exemption/route.ts` — 면세 인증서 관리 API
- DB: `tax_exemption_certificates` 테이블

## 현재 상태: 85% (검증 최소, 만료 체크 없음, 주별 양식 미지원)

## CRITICAL 4개

### C1: 인증서 검증 로직 최소 (route.ts)
certificate_number 존재 여부만 체크. 형식, 발급기관, 유효성 미검증.
**수정**: 인증서 유형별 검증
```typescript
const CERT_VALIDATORS: Record<string, (certNum: string) => boolean> = {
  resale: (num) => /^[A-Z]{2}-\d{6,12}$/.test(num), // 주약어-숫자
  exempt_org: (num) => /^[0-9]{2}-[0-9]{7}$/.test(num), // EIN 형식
  diplomatic: (num) => /^[A-Z]{1,3}\d{4,8}$/.test(num),
  agricultural: (num) => num.length >= 6,
  manufacturing: (num) => num.length >= 6,
};

const validator = CERT_VALIDATORS[exemptionType];
if (validator && !validator(certificateNumber)) {
  return apiError(ApiErrorCode.BAD_REQUEST,
    `Invalid certificate format for ${exemptionType}. Expected format: ${getExpectedFormat(exemptionType)}`);
}
```

### C2: 만료 체크 없음
인증서에 expiration_date 필드 있지만 조회 시 만료 여부 확인 안 함.
**수정**: 유효기간 검증 + 갱신 알림
```typescript
// 조회 시 만료 체크
if (cert.expiration_date) {
  const expiresAt = new Date(cert.expiration_date);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { ...cert, status: 'expired', valid: false,
      action: 'Certificate has expired. Renew before applying exemption.' };
  }
  if (daysUntilExpiry <= 30) {
    cert.warning = `Certificate expires in ${daysUntilExpiry} days. Consider renewal.`;
  }
}
```

### C3: 주별 면세 양식 미지원
미국: 주마다 면세 인증서 양식 다름. MTC(Multistate Tax Commission) 통일 양식도 일부 주만 인정.
**수정**: 주별 양식 정보 + MTC 지원 여부
```typescript
const STATE_EXEMPTION_FORMS: Record<string, ExemptionForm> = {
  TX: { form: '01-339', name: 'Texas Sales and Use Tax Exemption Certification', mtcAccepted: true },
  CA: { form: 'CDTFA-230', name: 'General Resale Certificate', mtcAccepted: false },
  NY: { form: 'ST-120', name: 'Resale Certificate', mtcAccepted: true },
  FL: { form: 'DR-13', name: 'Annual Resale Certificate for Sales Tax', mtcAccepted: false },
  // ... 45+ 주
};

// API 응답에 필요한 양식 안내
if (state && STATE_EXEMPTION_FORMS[state]) {
  response.requiredForm = STATE_EXEMPTION_FORMS[state];
  response.mtcUniform = STATE_EXEMPTION_FORMS[state].mtcAccepted ?
    'MTC Uniform Sales & Use Tax Exemption Certificate accepted' :
    'State-specific form required';
}
```

### C4: 면세 적용 시 감사 로깅 없음
어떤 거래에 면세가 적용되었는지 추적 불가. IRS 감사 시 증빙 불가.
**수정**: 면세 적용 이력 로깅
```typescript
// 면세 적용 시
await supabase.from('tax_exemption_usage_log').insert({
  certificate_id: cert.id,
  seller_id: sellerId,
  buyer_id: buyerId,
  transaction_id: transactionId,
  exempted_amount: taxAmount,
  applied_at: new Date().toISOString(),
  state: state
});

// 감사 로그
await logAudit({
  actor: sellerId, action: 'apply_exemption', area: 2, // D2 Tax
  reason: `Tax exemption ${cert.certificate_number} applied to transaction ${transactionId}`,
  validationPassed: true
});
```

## MISSING 2개
M1: 인증서 파일 업로드 — PDF/이미지 저장 (Supabase Storage)
M2: 대량 인증서 관리 — CSV 일괄 업로드/내보내기

## 수정 파일: 1개 (tax/exemption/route.ts) + migration (usage_log 테이블)
## 테스트 8개
```
1. 유효한 resale 인증서 → valid: true
2. 형식 오류 인증서 → 400 에러 + expected format
3. 만료된 인증서 → status: expired, valid: false
4. 30일 이내 만료 → warning 포함
5. TX 주 → form: 01-339, mtcAccepted: true
6. CA 주 → mtcAccepted: false
7. 면세 적용 → usage_log에 기록
8. 감사 로그 → data_update_log에 기록
```

## 결과
```
=== F053 Tax Exemption — 강화 완료 ===
- 수정 파일: 1개+ | CRITICAL 4개 | 테스트: 8개 | 빌드: PASS/FAIL
```
