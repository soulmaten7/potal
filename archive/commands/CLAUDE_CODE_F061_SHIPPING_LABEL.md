# F061 Shipping Label Generation — 프로덕션 강화

> ⚠️ 이 기능(F061)만 작업합니다.

## 현재 파일
- `app/api/v1/shipping/labels/route.ts` — 배송 라벨 생성 API

## CRITICAL 3개

### C1: 라벨 PDF 생성 없음
JSON 메타데이터만 반환. 실제 인쇄 가능한 PDF 라벨 없음.
**수정**: 기본 라벨 PDF 생성 (pdfkit 또는 jspdf)
```typescript
if (format === 'pdf') {
  const labelPdf = generateShippingLabelPdf({
    from: senderAddress, to: recipientAddress,
    carrier, trackingNumber, barcode: generateBarcode(trackingNumber),
    weight, dimensions, hsCode, declaredValue, customsInfo
  });
  return new Response(labelPdf, { headers: { 'Content-Type': 'application/pdf' } });
}
```

### C2: 통관 서류 미포함
국제 배송 시 Commercial Invoice, Packing List 등 첨부 필요.
**수정**: 통관 서류 번들 옵션
```typescript
if (international) {
  response.customsDocuments = {
    commercialInvoice: generateCommercialInvoice(shipmentData),
    packingList: generatePackingList(items),
    certificateOfOrigin: originCountry ? generateCoO(originCountry, items) : null,
    requiredByDestination: getRequiredDocuments(destinationCountry)
  };
}
```

### C3: 추적번호 검증 없음
가짜/잘못된 형식의 추적번호도 수용.
**수정**: 캐리어별 추적번호 형식 검증
```typescript
const TRACKING_FORMATS: Record<string, RegExp> = {
  ups: /^1Z[A-Z0-9]{16}$/,
  fedex: /^\d{12,22}$/,
  dhl: /^\d{10,11}$/,
  usps: /^\d{20,22}$|^[A-Z]{2}\d{9}[A-Z]{2}$/,
};
```

## 테스트 6개
```
1. PDF 라벨 생성 → Content-Type: application/pdf
2. 국제 배송 → customsDocuments 포함
3. 추적번호 형식 오류 → 400
4. 필수 주소 누락 → 400 + missing fields
5. 바코드 생성 → 유효한 바코드 데이터
6. ZPL 포맷 요청 → ZPL 문자열 반환
```
