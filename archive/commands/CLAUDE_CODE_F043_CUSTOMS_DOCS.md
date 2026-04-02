# F043 Customs Documents — 프로덕션 강화

> ⚠️ 이 기능(F043)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **구현됨 (CRITICAL 3개 + MISSING 3개)**

## 현재 파일
- `app/api/v1/documents/route.ts` — 문서 생성 엔드포인트
- `app/lib/cost-engine/documents/generate.ts` — 문서 생성 로직
- `app/lib/cost-engine/documents/pdf-generator.ts` — PDF 렌더링
- `app/lib/cost-engine/documents/types.ts` — 타입 정의

## CRITICAL 버그 3개

### C1: HS 자동분류 confidence 0.5 → 너무 낮음 (generate.ts:45-58)
**현재 코드:**
```typescript
if (!hsCode && item.description) {
  const classification = await classifyProductAsync(item.description, item.category, sellerId);
  if (classification.hsCode && classification.confidence >= 0.5) {  // 50% = 동전 던지기
    hsCode = classification.hsCode;
  }
}
```
**문제**: 50% confidence로 통관 서류에 HS 코드 기입 → 틀릴 확률 50%
**수정**:
```typescript
const MIN_DOC_CONFIDENCE = 0.85; // 문서용은 85% 이상만

if (classification.hsCode && classification.confidence >= MIN_DOC_CONFIDENCE) {
  hsCode = classification.hsCode;
  item._classificationSource = 'auto_high_confidence';
} else if (classification.hsCode && classification.confidence >= 0.5) {
  // 저신뢰도: 사용하되 경고 플래그
  hsCode = classification.hsCode;
  item._classificationSource = 'auto_low_confidence';
  warnings.push(`Item "${item.description}": HS code ${hsCode} auto-classified with ${Math.round(classification.confidence * 100)}% confidence. Manual verification recommended.`);
}
```

### C2: HS 코드 누락 시 문서에 빈칸 (generate.ts:35-73)
**현재 코드:**
```typescript
enriched.push({
  description: item.description,
  hsCode,  // undefined 가능!
  quantity: item.quantity,
  ...
});
```
**문제**: hsCode=undefined인 아이템이 PDF에 빈칸으로 출력 → 통관 거부
**수정**:
```typescript
// HS 코드 없는 아이템 수집
const itemsWithoutHs: number[] = [];
if (!hsCode) {
  itemsWithoutHs.push(index);
  hsCode = 'CLASSIFICATION_REQUIRED';  // 명시적 표시
}

// 응답에 경고 포함
response.warnings = [
  ...warnings,
  ...(itemsWithoutHs.length > 0
    ? [`${itemsWithoutHs.length} item(s) missing HS code (indices: ${itemsWithoutHs.join(', ')}). Manual classification required before customs submission.`]
    : [])
];
response.itemsRequiringAttention = itemsWithoutHs;
```

### C3: 서명/인증 필드 없음 (pdf-generator.ts)
**현재**: 서명란 없이 텍스트만 출력
**수정**: PDF에 필수 필드 추가
```typescript
// 모든 통관 문서에 추가:
documentMetadata: {
  documentId: `POTAL-${docType}-${Date.now()}-${randomId}`,
  generatedAt: new Date().toISOString(),
  generatedBy: 'POTAL API v1',
  declarantName: sellerName || '[DECLARANT NAME REQUIRED]',
  signatureField: true,  // PDF에 서명란 렌더링
  disclaimer: 'This document was generated electronically. The declarant is responsible for verifying all information before submission to customs authorities.',
  revision: 1
}
```

## MISSING 기능 3개

### M1: getRequiredDocuments() 미사용 (generate.ts:252-309)
**현재**: 함수는 존재하지만 API에서 호출 안 됨
**수정**: documents/route.ts에 type='required_documents' 추가
```typescript
if (docType === 'required_documents') {
  const required = getRequiredDocuments(hsCode, origin, destination);
  return NextResponse.json({
    requiredDocuments: required,
    // 예: ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'phytosanitary_certificate']
    mandatory: required.filter(d => d.required),
    optional: required.filter(d => !d.required),
    countrySpecific: required.filter(d => d.countrySpecific)
  });
}
```

### M2: 다중 통화 미지원
**수정**: 문서에 `currencyBreakdown` 옵션 추가
```typescript
// 요청에 additionalCurrencies: ['EUR', 'GBP'] 추가 시
// 각 금액 옆에 환산 금액 표시
// 예: "Unit Price: $29.99 (€27.59 / £23.99)"
```

### M3: 문서 번들 (여러 문서 한번에 생성)
**수정**: `app/api/v1/documents/bundle/route.ts` 신규 생성
```typescript
// POST /api/v1/documents/bundle
// { types: ['commercial_invoice', 'packing_list', 'certificate_of_origin'], shipment: {...} }
// 응답: { documents: [{ type, url, warnings }, ...], bundleUrl: '...' }
```

## 수정할 파일 목록
1. `app/lib/cost-engine/documents/generate.ts` — C1(confidence), C2(빈 HS)
2. `app/lib/cost-engine/documents/pdf-generator.ts` — C3(서명 필드)
3. `app/api/v1/documents/route.ts` — M1(required_documents 타입 추가)
4. `app/api/v1/documents/bundle/route.ts` — **신규** (M3 번들)

## 테스트 (12개)
```
1. CI 생성: 정상 데이터 → 유효한 PDF 반환
2. HS 자동분류: confidence 0.90 → HS 코드 자동 입력 (경고 없음)
3. HS 자동분류: confidence 0.60 → HS 코드 입력 + low_confidence 경고
4. HS 자동분류: confidence 0.40 → 'CLASSIFICATION_REQUIRED' + 에러
5. HS 누락: 3개 아이템 중 1개 누락 → itemsRequiringAttention: [1]
6. 서명 필드: PDF에 declarantName + signatureField 포함
7. 문서 ID: documentId 형식 검증 (POTAL-CI-xxxxx)
8. required_documents: HS 07(채소) → phytosanitary_certificate 포함
9. required_documents: HS 61(의류) → certificate_of_origin만
10. 다중 통화: additionalCurrencies=['EUR'] → EUR 환산 포함
11. 번들: 3개 문서 → bundleUrl + documents 배열 반환
12. 빈 아이템: items=[] → 400 에러
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 12개 PASS
3. confidence 0.5 하드코딩 0건 확인
4. PDF 출력에 서명란 + documentId 포함 확인
5. 기존 /documents 엔드포인트 CI/PL 생성 정상
```

## 결과
```
=== F043 Customs Documents — 강화 완료 ===
- 수정 파일: 3개
- 신규 파일: 1개
- CRITICAL 수정: 3개
- MISSING 추가: 3개
- 테스트: 12개
- 빌드: PASS/FAIL
```
