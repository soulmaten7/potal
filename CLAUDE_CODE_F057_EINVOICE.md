# F057 E-Invoice Generation — 프로덕션 강화

> ⚠️ 이 기능(F057)만 작업합니다.

## 현재 파일
- `app/api/v1/compliance/e-invoice/route.ts` — 전자세금계산서 API
- `app/lib/compliance/e-invoice.ts` — 전자세금계산서 생성 로직

## 현재 상태: 50% (JSON만 반환, 실제 포맷 미생성, 국가별 규격 미준수)

## CRITICAL 6개

### C1: 실제 e-Invoice 포맷 미생성 (e-invoice.ts)
JSON 응답만 반환. 실제 전자세금계산서는 XML(UBL/CII), PDF/A-3 등 특정 포맷 필요.
**수정**: 국가별 포맷 생성
```typescript
const INVOICE_FORMATS: Record<string, InvoiceFormat> = {
  EU: { format: 'UBL_2.1', name: 'Peppol BIS 3.0', contentType: 'application/xml' },
  DE: { format: 'ZUGFeRD_2.2', name: 'ZUGFeRD/Factur-X', contentType: 'application/pdf' },
  IT: { format: 'FatturaPA', name: 'FatturaPA XML', contentType: 'application/xml' },
  IN: { format: 'JSON', name: 'GST E-Invoice (IRN)', contentType: 'application/json' },
  KR: { format: 'XML', name: '전자세금계산서 (국세청)', contentType: 'application/xml' },
  SA: { format: 'UBL_2.1', name: 'ZATCA FATOORA', contentType: 'application/xml' },
  BR: { format: 'XML', name: 'NF-e (Nota Fiscal)', contentType: 'application/xml' },
};

function generateUblXml(invoice: InvoiceData): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  <!-- ... full UBL structure ... -->
</Invoice>`;
}
```

### C2: 인보이스 번호 채번 규칙 없음
UUID 사용. 대부분 국가에서 연속 번호(sequential) 필요. 번호 누락 시 세무 감사 문제.
**수정**: 셀러별 연속 번호 생성
```typescript
async function getNextInvoiceNumber(sellerId: string, prefix: string = 'INV'): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase.rpc('increment_invoice_counter', {
    p_seller_id: sellerId, p_year: year
  });
  const seq = String(data).padStart(6, '0');
  return `${prefix}-${year}-${seq}`; // INV-2026-000001
}
// DB function: atomic counter to prevent duplicates
```

### C3: 디지털 서명 없음
이탈리아(SDI), 인도(IRN), 사우디(ZATCA) 등은 디지털 서명 필수.
**수정**: 서명 요구사항 안내 + 기본 해시
```typescript
if (REQUIRES_DIGITAL_SIGNATURE.includes(country)) {
  response.signingRequired = true;
  response.signingInfo = {
    method: country === 'IT' ? 'XAdES-BES' : country === 'SA' ? 'ZATCA CSID' : 'default',
    note: 'Digital signature required by tax authority. Use certified signing service.',
    hash: crypto.createHash('sha256').update(invoiceXml).digest('hex')
  };
}
```

### C4: 필수 필드 국가별 차이 미반영
EU Peppol: Buyer reference 필수. 이탈리아: Codice Destinatario(7자리) 필수. 인도: GSTIN 필수.
**수정**: 국가별 필수 필드 검증
```typescript
const COUNTRY_REQUIRED_FIELDS: Record<string, string[]> = {
  IT: ['codiceDestinatario', 'pecEmail', 'sellerVatNumber'],
  IN: ['buyerGstin', 'sellerGstin', 'supplyType', 'placeOfSupply'],
  SA: ['sellerVatNumber', 'buyerVatNumber', 'invoiceType'],
  KR: ['businessRegistrationNumber', 'taxType'],
  EU: ['buyerReference', 'sellerVatNumber'],
};
const required = COUNTRY_REQUIRED_FIELDS[country] || [];
const missing = required.filter(f => !invoiceData[f]);
if (missing.length > 0) {
  return apiError(ApiErrorCode.BAD_REQUEST,
    `Missing required fields for ${country} e-invoice: ${missing.join(', ')}`);
}
```

### C5: 정부 시스템 전송 안내 없음
이탈리아: SDI 포탈 제출 필수. 인도: NIC 포탈에서 IRN 발급. 한국: 홈택스 전송.
**수정**: 제출 가이드
```typescript
const SUBMISSION_GUIDES: Record<string, SubmissionGuide> = {
  IT: { system: 'SDI (Sistema di Interscambio)', url: 'https://www.fatturapa.gov.it',
    method: 'Upload XML via SDI portal or certified PEC email', deadline: 'Within 12 days of issue' },
  IN: { system: 'NIC (National Informatics Centre)', url: 'https://einvoice1.gst.gov.in',
    method: 'API submission to generate IRN', deadline: 'Before delivery of goods/services' },
  KR: { system: '국세청 홈택스', url: 'https://www.hometax.go.kr',
    method: 'ERP 연동 또는 직접 발행', deadline: '공급일의 다음 달 10일까지' },
  SA: { system: 'ZATCA FATOORA', url: 'https://fatoora.zatca.gov.sa',
    method: 'API integration with ZATCA platform', deadline: 'Real-time for B2B, within 24hrs for B2C' },
};
```

### C6: 크레딧 노트(수정세금계산서) 미지원
반품/취소 시 크레딧 노트 발행 필요. 현재 인보이스만 지원.
**수정**: invoiceType 파라미터 추가
```typescript
type InvoiceType = 'invoice' | 'credit_note' | 'debit_note' | 'corrective';
// credit_note 시: 원본 인보이스 번호 참조 필수
if (invoiceType === 'credit_note' && !originalInvoiceNumber) {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Original invoice number required for credit note');
}
```

## 수정 파일: 2개 (e-invoice.ts, e-invoice/route.ts) + migration (invoice_counter)
## 테스트 10개
```
1. EU UBL 생성 → valid XML with required elements
2. 이탈리아 FatturaPA → codiceDestinatario 필수
3. 인도 GST → GSTIN 검증
4. 연속 번호 → INV-2026-000001 형식
5. 디지털 서명 필요 국가 → signingRequired: true
6. 한국 전자세금계산서 → 사업자등록번호 필수
7. 크레딧 노트 → 원본 참조 필수
8. 필수 필드 누락 → 400 + missing fields
9. 사우디 ZATCA → UBL 2.1 포맷
10. submissionGuide → 제출 URL + 기한 포함
```

## 결과
```
=== F057 E-Invoice — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 6개 | 테스트: 10개 | 빌드: PASS/FAIL
```
