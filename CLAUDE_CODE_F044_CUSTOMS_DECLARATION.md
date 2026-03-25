# F044 Customs Declaration Form — 프로덕션 강화

> ⚠️ 이 기능(F044)만 작업합니다.

## 현재 파일
- `app/api/v1/compliance/customs-declaration/route.ts` — 통관신고서 생성 API
- `app/lib/compliance/customs-docs.ts` — 서류 생성 로직

## 현재 상태: 80% (관세 금액 0 고정, 필수 필드 누락, 포맷 단일)

## CRITICAL 5개

### C1: duty_amount, tax_amount 하드코딩 0 (route.ts)
통관신고서에 관세/세금 0으로 표시. 실제 신고 시 CBP/세관이 거부하거나 추후 추징.
**수정**: 실제 관세 계산 호출
```typescript
// calculate API 내부 로직 활용
const landedCost = await calculateLandedCost({
  hsCode, originCountry, destinationCountry: 'US',
  declaredValue, currency
});
declaration.duty_amount = landedCost.duties?.total || 0;
declaration.tax_amount = landedCost.taxes?.total || 0;
declaration.mpf_amount = landedCost.fees?.mpf || 0;
declaration.hmf_amount = landedCost.fees?.hmf || 0;
declaration.total_payable = declaration.duty_amount + declaration.tax_amount +
  declaration.mpf_amount + declaration.hmf_amount;
```

### C2: 필수 필드 누락 — 수입자/수출자 정보
CBP 7501 양식: 수입자 EIN/Bond 번호, 중개인 라이선스 번호, 수출자 정보 필수.
**수정**: 필수 필드 추가 + 검증
```typescript
const REQUIRED_FIELDS_US = ['importerName', 'importerEin', 'importerAddress',
  'exporterName', 'exporterAddress', 'portOfEntry', 'entryType',
  'hsCode', 'originCountry', 'declaredValue', 'quantity', 'description'];

const missing = REQUIRED_FIELDS_US.filter(f => !requestBody[f]);
if (missing.length > 0) {
  return apiError(ApiErrorCode.BAD_REQUEST,
    `Missing required fields for US customs declaration: ${missing.join(', ')}`);
}
```

### C3: 국가별 서류 포맷 미지원
현재 US CBP 7501 형식만. EU SAD(Single Administrative Document), UK CDS 등 다름.
**수정**: 국가별 템플릿 분기
```typescript
const DECLARATION_TEMPLATES: Record<string, DeclarationTemplate> = {
  US: { form: 'CBP-7501', name: 'Entry Summary', fields: US_REQUIRED_FIELDS },
  EU: { form: 'SAD', name: 'Single Administrative Document', fields: EU_REQUIRED_FIELDS },
  UK: { form: 'CDS', name: 'Customs Declaration Service', fields: UK_REQUIRED_FIELDS },
  JP: { form: 'NACCS', name: 'Import Declaration', fields: JP_REQUIRED_FIELDS },
  KR: { form: 'UNI-PASS', name: '수입신고서', fields: KR_REQUIRED_FIELDS },
  AU: { form: 'ICS', name: 'Import Declaration N10', fields: AU_REQUIRED_FIELDS },
  CA: { form: 'B3', name: 'Customs Coding Form B3', fields: CA_REQUIRED_FIELDS },
};
const template = DECLARATION_TEMPLATES[destinationCountry] || DECLARATION_TEMPLATES.US;
```

### C4: HS 코드 자릿수 미검증
4자리 HS로도 신고서 생성됨. 대부분 국가에서 최소 6자리(미국은 10자리) 필수.
**수정**: 국가별 최소 자릿수 검증
```typescript
const MIN_HS_DIGITS: Record<string, number> = {
  US: 10, EU: 8, UK: 10, JP: 9, KR: 10, AU: 8, CA: 10, DEFAULT: 6
};
const minDigits = MIN_HS_DIGITS[destinationCountry] || MIN_HS_DIGITS.DEFAULT;
const cleanHs = hsCode.replace(/[^0-9]/g, '');
if (cleanHs.length < minDigits) {
  return apiError(ApiErrorCode.BAD_REQUEST,
    `HS code must be at least ${minDigits} digits for ${destinationCountry}. Provided: ${cleanHs.length} digits.`);
}
```

### C5: PDF/XML 출력 없음
JSON만 반환. 실제 세관 제출은 PDF 또는 EDI/XML 포맷 필요.
**수정**: 포맷 옵션 추가
```typescript
const format = searchParams.get('format') || 'json'; // json | pdf | xml
if (format === 'pdf') {
  const pdfBuffer = await generateDeclarationPdf(declaration, template);
  return new Response(pdfBuffer, {
    headers: { 'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${template.form}_${Date.now()}.pdf"` }
  });
}
if (format === 'xml') {
  const xml = generateDeclarationXml(declaration, template);
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
return NextResponse.json(declaration);
```

## MISSING 2개
M1: 수정 신고(Amendment) 지원 — 기존 신고서 수정 API
M2: 신고서 이력 관리 — verification_logs에 신고서 생성 이력 저장

## 수정 파일: 2개 (customs-docs.ts, customs-declaration/route.ts)
## 테스트 10개
```
1. US 신고서 → duty_amount > 0 (실제 계산값)
2. EU SAD 포맷 → EU 필수 필드 포함
3. HS 4자리 + US → 400 에러 (10자리 필요)
4. 필수 필드 누락 → 400 + missing fields 목록
5. PDF 출력 → Content-Type: application/pdf
6. XML 출력 → Content-Type: application/xml
7. KR 수입신고서 → UNI-PASS 포맷
8. MPF/HMF 계산 → 범위 내 ($31.67~$575.35)
9. 면세 상품 → duty_amount: 0 (계산된 0)
10. CA B3 포맷 → 캐나다 필수 필드 포함
```

## 결과
```
=== F044 Customs Declaration — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 5개 | 테스트: 10개 | 빌드: PASS/FAIL
```
