# F007 ECCN Classification — 프로덕션 강화

> ⚠️ 이 기능(F007)만 작업합니다.

## 현재 파일
- `app/api/v1/classify/eccn/route.ts` — ECCN 분류 엔드포인트
- `app/api/v1/export-controls/classify/route.ts` — 관련 엔드포인트

## CRITICAL 8개

### C1: HS→ECCN 매핑 챕터 수준만 (Lines 33-59)
HS 84 전체 → 2B. 하지만 HS 8419(살균기)=EAR99, HS 8419(핵처리장비)=2B001.
**수정**: HS6 수준 매핑 또는 "범위 불확실" 표시
```typescript
// HS6 레벨 매핑 우선 시도
const { data: hs6Match } = await supabase.from('eccn_hs_mapping')
  .select('eccn, control_reason').eq('hs_code', hsCode.substring(0,6)).single();
if (hs6Match) return hs6Match;
// HS4 레벨
const { data: hs4Match } = await supabase.from('eccn_hs_mapping')
  .select('eccn, control_reason').eq('hs_code', hsCode.substring(0,4)).single();
if (hs4Match) return { ...hs4Match, precision: 'chapter_level', warning: 'Multiple ECCNs possible for this HS heading. Verify specific item.' };
// 매핑 없음
return { eccn: 'UNKNOWN', status: 'classification_required' };
```

### C2: 기술 스펙 키워드 매칭 약함 (Lines 141-148)
/encrypt|aes/ → 출발/목적지/최종사용자 무시. 미국인→미국인 암호화는 NLR.
**수정**: 암호화 통제는 별도 로직
```typescript
if (isEncryptionDetected) {
  // EAR Part 740.17 (ENC) 예외 확인
  if (destinationCountry && !['CU','IR','KP','SY'].includes(destinationCountry)) {
    return { eccn: '5A002', licenseException: 'ENC', eligible: true, note: 'Mass-market encryption eligible for License Exception ENC' };
  }
}
```

### C3: Schedule B 유도 공식 부정확 (Lines 79-85)
HS6 + 0000 패딩. 실제 Schedule B는 Census Bureau 공식 스케줄과 다름.
**수정**: 정확한 Schedule B 반환 불가 명시
```typescript
scheduleBCode: hsCode.length >= 6 ? hsCode.padEnd(10, '0') : null,
scheduleBNote: 'Schedule B code is estimated from HS code. Verify with Census Bureau Schedule B Search (https://headcount.census.gov) for official code.',
scheduleBConfidence: 'low' // HS 패딩이므로 저신뢰도
```

### C4: Control Reasons 12개만 (Lines 62-76)
50+ 통제 사유 중 12개만. CW, BW, AS 등 누락 → null 표시.
**수정**: 전체 통제 사유 추가
```typescript
const CONTROL_REASONS: Record<string, string> = {
  NS: 'National Security', NP: 'Nuclear Nonproliferation', MT: 'Missile Technology',
  CB: 'Chemical & Biological', RS: 'Regional Stability', FC: 'Firearms Convention',
  CC: 'Crime Control', AT: 'Anti-Terrorism', EI: 'Encryption Items',
  UN: 'United Nations', SI: 'Surreptitious Listening', SL: 'Significant Items',
  SS: 'Short Supply', CW: 'Chemical Weapons', BW: 'Biological Weapons',
  AS: 'Anti-Satellite', HRS: 'Human Rights', XP: 'Computers'
};
```

### C5: 목적지별 라이선스 판정 없음 (Line 188)
ECCN만 반환. 같은 ECCN도 국가별 NLR/License Required 다름.
**수정**: destinationCountry 파라미터 추가
```typescript
if (destinationCountry) {
  const licenseRequired = checkCommerceCountryChart(eccn, destinationCountry);
  response.destinationAnalysis = {
    country: destinationCountry,
    licenseRequired,
    reason: licenseRequired ? `${eccn} requires license for export to ${destinationCountry}` : 'No license required (NLR)',
    applicableExceptions: getAvailableExceptions(eccn, destinationCountry)
  };
}
```

### C6: HS 코드 형식 미검증 (Lines 97-98)
"HS610910", "61.09.10", "6109-10" 등 다양한 형식 → .replace('.','')만 적용.
**수정**: 정규화 + 검증
```typescript
function normalizeHsCode(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (cleaned.length < 4 || cleaned.length > 10) return null;
  return cleaned;
}
const hsCode = normalizeHsCode(rawHsCode);
if (!hsCode) return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid HS code format. Provide 4-10 digits.');
```

### C7: AI 분류 실패 시 조용한 에러 (Lines 108-113)
classifyProductAsync 실패 → catch → 무시. hsCode: null 반환.
**수정**: 에러 원인 명시
```typescript
try {
  const result = await classifyProductAsync(productName, category, sellerId);
  hsCode = result.hsCode;
} catch (err) {
  response.classificationError = {
    message: 'AI classification failed',
    reason: err instanceof Error ? err.message : 'Unknown error',
    suggestion: 'Provide HS code directly or try a more specific product description'
  };
}
```

### C8: ITAR 키워드 오탐 (Lines 134-138)
"defense" 단독 → itar_possible 100%. "military green" 색상도 트리거.
**수정**: 복합 매칭 + confidence 도입
```typescript
const itarScore = calculateItarConfidence(productName);
// "missile guidance" = 0.95, "defense contractor" = 0.60, "military green" = 0.15
if (itarScore >= 0.70) {
  response.exportControlStatus = 'itar_possible';
  response.itarConfidence = itarScore;
} else if (itarScore >= 0.30) {
  response.exportControlStatus = 'review_recommended';
}
```

## 수정 파일: 1개 (classify/eccn/route.ts)
## 테스트 10개
```
1. 일반 소비재 HS → EAR99 + NLR
2. 통제 품목 HS → 정확한 ECCN + 통제 사유
3. 암호화 상품 → 5A002 + ENC 예외 가능
4. 알 수 없는 HS → UNKNOWN + classification_required
5. 목적지 CN → license_required 분석
6. 목적지 CA → NLR 분석
7. 잘못된 HS 형식 → 400 에러
8. AI 분류 실패 → classificationError 포함
9. "missile guidance" → itar_possible (0.95)
10. "military green jacket" → review_recommended (0.30 미만은 무시)
```

## 결과
```
=== F007 ECCN Classification — 강화 완료 ===
- 수정 파일: 1개 | CRITICAL 8개 | 테스트: 10개 | 빌드: PASS/FAIL
```
