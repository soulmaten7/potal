# F055 VAT Registration Guide — 프로덕션 강화

> ⚠️ 이 기능(F055)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/vat-registration/route.ts` — VAT 등록 가이드 API
- `app/lib/tax/vat-registration.ts` — VAT 등록 로직

## 현재 상태: 75% (VIES 검증 없음, 임계값 구식, 등록 절차 불완전)

## CRITICAL 5개

### C1: VIES VAT 번호 검증 없음 (vat-registration.ts)
EU VAT 번호 형식만 체크. 실제 유효성(등록 여부) 미확인.
**수정**: EU VIES API 연동
```typescript
async function validateVatNumber(vatNumber: string): Promise<ViesResult> {
  const countryCode = vatNumber.substring(0, 2);
  const number = vatNumber.substring(2);

  try {
    // EU VIES SOAP API
    const response = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
        <soapenv:Body><urn:checkVat><urn:countryCode>${countryCode}</urn:countryCode><urn:vatNumber>${number}</urn:vatNumber></urn:checkVat></soapenv:Body>
      </soapenv:Envelope>`,
      signal: AbortSignal.timeout(10000)
    });
    // VIES 응답 파싱
    const xml = await response.text();
    const valid = xml.includes('<valid>true</valid>');
    const name = xml.match(/<name>(.*?)<\/name>/)?.[1] || '';
    return { valid, name, countryCode, vatNumber: number };
  } catch {
    return { valid: null, error: 'VIES service unavailable. Try again later.' };
  }
}
```

### C2: 등록 임계값 구식/불완전
EU: 원래 각국 다른 임계값 → 2025년 7월부터 €10,000 통합 (OSS). 현재 구 임계값 사용.
**수정**: 최신 임계값 + OSS 반영
```typescript
const VAT_THRESHOLDS: Record<string, VatThreshold> = {
  // EU: 2025년 7월 이후 €10,000 교차 국경 매출 (OSS)
  EU_CROSS_BORDER: { threshold: 10000, currency: 'EUR', period: 'annual',
    note: 'EU OSS threshold for cross-border B2C sales. Register in one EU state via OSS.' },
  // 개별국 국내 매출 임계값
  UK: { threshold: 90000, currency: 'GBP', period: 'rolling_12_months',
    note: 'UK VAT registration threshold (April 2024 increase from £85,000)' },
  AU: { threshold: 75000, currency: 'AUD', period: 'annual',
    note: 'GST registration for businesses with AU turnover' },
  JP: { threshold: 10000000, currency: 'JPY', period: 'annual',
    note: 'Consumption tax registration (¥10M/year)' },
  KR: { threshold: 0, currency: 'KRW', period: 'annual',
    note: 'All businesses must register for VAT in Korea' },
  CA: { threshold: 30000, currency: 'CAD', period: 'rolling_4_quarters',
    note: 'GST/HST registration' },
};
```

### C3: 등록 절차 안내 불완전
"Register with tax authority" 한 줄만. 실제 단계별 절차 필요.
**수정**: 국가별 상세 등록 절차
```typescript
const REGISTRATION_STEPS: Record<string, RegistrationStep[]> = {
  UK: [
    { step: 1, action: 'Apply online via HMRC', url: 'https://www.gov.uk/register-for-vat' },
    { step: 2, action: 'Provide business details (UTR, SIC code, bank details)' },
    { step: 3, action: 'Choose VAT scheme (Standard, Flat Rate, Cash)' },
    { step: 4, action: 'Receive VAT certificate (7-30 working days)' },
    { step: 5, action: 'Start charging VAT from effective date' },
  ],
  EU_OSS: [
    { step: 1, action: 'Register for OSS in your EU establishment country' },
    { step: 2, action: 'File quarterly OSS returns (by end of month following quarter)' },
    { step: 3, action: 'Pay VAT for all EU member states in one return' },
  ],
  AU: [
    { step: 1, action: 'Register for ABN (Australian Business Number)', url: 'https://www.abr.gov.au' },
    { step: 2, action: 'Register for GST via ATO', url: 'https://www.ato.gov.au' },
    { step: 3, action: 'Lodge BAS (Business Activity Statement) quarterly or monthly' },
  ],
};
```

### C4: 등록 의무 판정 로직 없음
셀러 매출 데이터 기반으로 "이 국가에서 VAT 등록이 필요한가" 자동 판정 안 함.
**수정**: 매출 기반 자동 판정
```typescript
async function checkRegistrationObligation(
  sellerId: string, country: string
): Promise<RegistrationObligation> {
  // 해당 국가 매출 집계 (최근 12개월)
  const { data } = await supabase.from('verification_logs')
    .select('declared_value')
    .eq('seller_id', sellerId)
    .eq('destination_country', country)
    .gte('created_at', twelveMonthsAgo);

  const totalRevenue = data?.reduce((sum, r) => sum + (r.declared_value || 0), 0) || 0;
  const threshold = VAT_THRESHOLDS[country];

  if (!threshold) return { required: 'unknown', reason: 'Threshold data not available' };

  const percentOfThreshold = (totalRevenue / threshold.threshold) * 100;
  return {
    required: totalRevenue >= threshold.threshold,
    currentRevenue: totalRevenue,
    threshold: threshold.threshold,
    currency: threshold.currency,
    percentOfThreshold: Math.round(percentOfThreshold),
    warning: percentOfThreshold >= 80 ? `Approaching threshold (${percentOfThreshold}%)` : undefined
  };
}
```

### C5: 비EU 국가 VAT 번호 형식 검증 없음
UK VAT: GB + 9자리, AU ABN: 11자리, JP: T + 13자리. 현재 EU만 처리.
**수정**: 국가별 형식 검증
```typescript
const VAT_FORMAT_RULES: Record<string, RegExp> = {
  GB: /^GB\d{9}$/,
  AU: /^\d{11}$/, // ABN
  JP: /^T\d{13}$/,
  KR: /^\d{3}-\d{2}-\d{5}$/, // 사업자등록번호
  CA: /^\d{9}RT\d{4}$/, // GST/HST
  IN: /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z]$/, // GSTIN
  SG: /^[A-Z]\d{8}[A-Z]$/, // GST Reg
};
```

## 수정 파일: 2개 (vat-registration.ts, vat-registration/route.ts)
## 테스트 10개
```
1. EU VAT 번호 → VIES 검증 valid
2. 잘못된 VAT 번호 형식 → 400 에러
3. UK VAT 등록 절차 → 5단계 반환
4. 매출 임계값 초과 → required: true
5. 매출 임계값 80% → warning 포함
6. EU OSS → €10,000 임계값 + OSS 안내
7. AU GST → ABN 형식 검증
8. KR 사업자등록번호 → 형식 검증
9. VIES 서비스 다운 → graceful error
10. 비EU 판매자 EU 등록 → non-EU registration guide
```

## 결과
```
=== F055 VAT Registration — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 5개 | 테스트: 10개 | 빌드: PASS/FAIL
```
