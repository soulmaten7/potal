# F097 AI Consultation — 프로덕션 강화

> ⚠️ 이 기능(F097)만 작업합니다.

## 현재 파일
- `app/api/v1/consult/route.ts` (253행) — AI 상담 엔드포인트

## CRITICAL 5개

### C1: 토픽 패턴 매칭 너무 넓음 (Lines 51-66)
"duty of care" → tariff 토픽으로 잡힘. "sanctions against my ex" → 제재 토픽.
**수정**: 단어 경계 추가
```typescript
{ topic: 'tariff', patterns: [/\b(tariff|import duty|duties|duty rate|import tax|customs duty)\b/i] },
{ topic: 'sanctions', patterns: [/\b(trade sanctions|ofac|sdn list|embargoed|sanctioned entity)\b/i] },
```

### C2: 영어만 지원 (Lines 103-117)
topicGuidance가 영어 하드코딩. 50개국어 API인데 consult는 영어만.
**수정**: Accept-Language 헤더 감지 + 기본 가이던스 다국어화
```typescript
const lang = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
const guidance = getLocalizedGuidance(topic, lang);
```

### C3: RAG 빈 테이블 처리 없음 (Lines 169-186)
regulations 테이블 비어있으면 빈 응답. 사용자는 왜 답이 없는지 모름.
**수정**: 테이블 상태 체크 + 안내 메시지
```typescript
const ragResult = await searchRegulations({ query, country });
if (ragResult.meta?.tableEmpty || ragResult.results.length === 0) {
  response.regulationNote = `Regulation data for ${country} is being loaded. For immediate assistance, visit the country's official customs website.`;
}
```

### C4: 자동분류 실패 시 무시 (Lines 188-219)
분류 실패하면 관세 계산 건너뜀 → 부분적 답변.
**수정**: 분류 상태를 응답에 명시
```typescript
response.classification = {
  status: hsCode ? 'success' : 'failed',
  hsCode: hsCode || null,
  reason: hsCode ? undefined : 'Could not classify product. Provide a more specific product name or HS code directly.'
};
```

### C5: 부분 컨텍스트 처리 없음 (Line 201)
origin+destination+value 전부 있어야만 TLC 계산. "UK 수입 관세 알려줘"에 답 못 함.
**수정**: placeholder 값으로 예시 계산
```typescript
const estimateValue = value || 100; // 기본 $100
const estimateOrigin = origin || 'CN'; // 기본 중국
if (!value) response.note = 'Using $100 as example value. Provide actual value for precise calculation.';
```

## MISSING 4개
M1: 대화 히스토리 → sessionId로 이전 질문 참조
M2: 팔로업 추천 → "Did you also want to know about FTA savings?"
M3: 관련 문서 링크 → 답변에 통관 서류 생성 API 링크 포함
M4: 피드백 수집 → "Was this helpful?" + rating

## 수정 파일: 1개 (consult/route.ts)
## 테스트 8개
```
1. "What's the tariff on cotton shirts to UK?" → tariff 토픽 + TLC 계산
2. "duty of care" → tariff 토픽 아님 (false positive 방지)
3. RAG 빈 테이블 → regulationNote 포함
4. value 미제공 → $100 기본값 + 안내
5. origin 미제공 → CN 기본값 + 안내
6. 분류 실패 → classification.status: 'failed' + 이유
7. 한국어 질문 → Accept-Language: ko → 한국어 가이던스
8. 팔로업 추천 포함 여부
```

## 결과
```
=== F097 AI Consultation — 강화 완료 ===
- 수정 파일: 1개 | CRITICAL 5개, MISSING 4개 | 테스트: 8개 | 빌드: PASS/FAIL
```
