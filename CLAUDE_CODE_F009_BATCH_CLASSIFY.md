# F009 Batch Classification — 신규 구현

> ⚠️ 이 기능(F009)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **미구현** — 배치 분류 엔드포인트 없음

## 배경
다수의 상품을 한 번의 API 호출로 HS 코드 분류. /classify는 단일 상품만 처리.
경쟁사 대비 필수 기능 — Avalara, Zonos 모두 배치 분류 제공.

## 구현할 파일

### 1. `app/api/v1/classify/batch/route.ts` (신규 생성)
```typescript
// POST /api/v1/classify/batch
// 요청:
// {
//   items: [
//     { id: "item1", name: "cotton t-shirt", category?: "clothing", material?: "cotton", price?: 29.99 },
//     { id: "item2", name: "stainless steel bolt M10", material?: "steel" }
//   ],
//   options?: {
//     includeConfidence?: boolean,   // 기본 true
//     includeAlternatives?: boolean, // 대안 HS 코드 포함
//     targetCountries?: string[],    // HS10 확장 대상국
//     maxConcurrency?: number        // 동시 처리 수 (기본 5, 최대 10)
//   }
// }
//
// 응답:
// {
//   results: [
//     { id: "item1", hsCode: "6109.10", confidence: 0.95, source: "database", alternatives: [...] },
//     { id: "item2", hsCode: "7318.15", confidence: 0.88, source: "vector_search" }
//   ],
//   errors: [
//     { id: "item3", error: "Product name too short for classification" }
//   ],
//   summary: {
//     total: 3, classified: 2, failed: 1, avgConfidence: 0.915,
//     sourceBreakdown: { database: 1, vector_search: 1, llm: 0 }
//   }
// }

export async function POST(request: NextRequest) {
  // 1. 인증 + API 키 확인
  // 2. 요청 검증
  //    - items 배열 필수, 최소 1개
  //    - 플랜별 최대 items: Free 10, Basic 50, Pro 200, Enterprise 500
  //    - 각 item에 name 필수 (최소 3자)
  // 3. 중복 제거 (같은 name → 1번만 분류)
  // 4. 배치 처리
  //    - concurrency 제한 (Promise.allSettled + 청크)
  //    - 각 item에 대해 classifyProductAsync() 호출
  //    - 타임아웃: 개별 item 10초, 전체 배치 60초
  //    - 실패한 item은 errors에 별도 수집
  // 5. 결과 조합 + 요약 생성
  // 6. usage_logs에 기록 (item 수만큼 카운트)
}
```

### 2. `app/lib/ai-classifier/batch-processor.ts` (신규 생성)
```typescript
export interface BatchItem {
  id: string;
  name: string;
  category?: string;
  material?: string;
  price?: number;
}

export interface BatchResult {
  id: string;
  hsCode: string;
  confidence: number;
  source: 'database' | 'vector_search' | 'llm' | 'cache';
  alternatives?: { hsCode: string; confidence: number }[];
  processingTimeMs: number;
}

export async function processBatch(
  items: BatchItem[],
  options: { concurrency: number; timeoutMs: number; sellerId: string }
): Promise<{ results: BatchResult[]; errors: { id: string; error: string }[] }> {
  // 1. 캐시 체크 — product_hs_mappings에서 이미 매핑된 상품 조회
  // 2. 캐시 미스 아이템만 분류 파이프라인으로
  // 3. 청크 분할 (concurrency 크기)
  // 4. Promise.allSettled + Promise.race(timeout)
  // 5. 결과 병합 (캐시 히트 + 새로 분류)
  // 6. 새 분류 결과 DB 저장 (confidence >= 0.80일 때만)
}
```

### 3. `app/lib/ai-classifier/index.ts` (수정)
- `classifyProductAsync()`에 타임아웃 옵션 추가
- 배치 처리 시 DB 커넥션 풀 고갈 방지 로직

## 테스트 (12개)
```
1. 정상 배치: 5개 상품 → 5개 결과 반환
2. 부분 실패: 3개 성공 + 2개 실패 → results 3개 + errors 2개
3. 중복 제거: 같은 상품명 3번 → 1번만 분류, 결과 복사
4. 빈 배열: items=[] → 400 에러 "At least 1 item required"
5. 플랜 제한: Free 플랜 11개 → 400 에러 "Free plan: max 10 items per batch"
6. 타임아웃: 10초 이상 걸리는 분류 → 해당 item만 에러, 나머지 정상
7. 캐시 히트: DB에 이미 매핑된 상품 → source: 'cache', processingTime < 50ms
8. confidence 필터: includeConfidence=false → confidence 필드 생략
9. alternatives: includeAlternatives=true → 대안 HS 코드 포함
10. summary: sourceBreakdown 정확성 확인
11. usage 로깅: 5개 아이템 → usage_logs에 5건 카운트
12. 인증: API 키 없음 → 401 에러
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 12개 PASS
3. curl로 /api/v1/classify/batch 호출 테스트
4. 기존 /api/v1/classify 단일 분류에 영향 없음
5. usage_logs에 배치 건수 정확히 기록됨
```

## 결과
```
=== F009 Batch Classification — 구현 완료 ===
- 신규 파일: 2개 (batch/route.ts, batch-processor.ts)
- 수정 파일: 1개 (ai-classifier/index.ts)
- 테스트: 12개
- 빌드: PASS/FAIL
```
