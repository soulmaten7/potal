# F003 URL-Based Classification — 프로덕션 강화

> ⚠️ 이 기능(F003)만 작업합니다. 다른 기능은 절대 수정하지 마세요.

## 현재 파일
- `app/api/v1/classify/url/route.ts` (247행) — URL 스크래핑 + 분류

## CRITICAL 5개

### C1: DOM 추출에 정규식 사용 (Lines 51-114)
```typescript
/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
```
주석, 네임스페이스, 중첩 따옴표에서 실패. Shopify/Amazon 일부 페이지 파싱 불가.
**수정**: regex → cheerio 파서로 교체
```typescript
import * as cheerio from 'cheerio'; // npm install cheerio
const $ = cheerio.load(html);
const jsonLd = $('script[type="application/ld+json"]').map((i, el) => {
  try { return JSON.parse($(el).html() || ''); } catch { return null; }
}).get().filter(Boolean);
```

### C2: 타임아웃 핸들링 불완전 (Lines 143-154)
AbortError가 특정 조건에서만 트리거. 느린 사이트에서 조용한 실패.
**수정**: 타임아웃 15초 + 명시적 AbortError 처리
```typescript
const FETCH_TIMEOUT_MS = 15000;
try {
  const response = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return apiError(ApiErrorCode.GATEWAY_TIMEOUT, `URL fetch timed out after ${FETCH_TIMEOUT_MS/1000}s: ${url}`);
  }
  throw err;
}
```

### C3: 일시적 실패에 재시도 없음 (Line 173)
429/5xx에서 즉시 에러 반환.
**수정**: 5xx/429에 대해 2회 재시도 (1초, 3초 딜레이)
```typescript
const MAX_RETRIES = 2;
for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  const res = await fetch(url, { signal });
  if (res.ok) return res;
  if (res.status === 429 || res.status >= 500) {
    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
    continue;
  }
  break; // 4xx (429 제외)는 재시도 안 함
}
```

### C4: XSS 위험 — 사용자 URL의 악성 데이터 (Line 129)
JSON-LD에서 추출한 문자열이 LLM으로 직접 전달됨.
**수정**: 추출된 문자열 새니타이즈
```typescript
function sanitizeExtracted(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').substring(0, 1000);
}
```

### C5: 2MB 제한 너무 작음 (Line 21, 165-167)
광고/트래킹이 많은 이커머스 사이트에서 상품 정보 누락.
**수정**: 5MB로 증가 + head 영역 우선 파싱
```typescript
const MAX_HTML_SIZE = 5 * 1024 * 1024;
// 먼저 head + 처음 100KB에서 JSON-LD/OG 추출 시도
// 실패 시 전체 HTML에서 추출
```

## MISSING 4개
M1: JavaScript 렌더링 없음 → Shopify 등 SPA는 정적 HTML에 상품 정보 없을 수 있음. 경고 반환
M2: OpenGraph 폴백 미사용 → JSON-LD 실패 시 og:title, og:description으로 폴백
M3: 가격 통화 추출 없음 → "$99.99" → { price: 99.99, currency: "USD" }
M4: 이미지 URL 유효성 검증 → 반환된 imageUrl이 404인지 HEAD 체크

## 의존성: `npm install cheerio`
## 수정 파일: 1개 (classify/url/route.ts)
## 테스트 10개
```
1. Shopify 상품 URL → 정상 분류 + JSON-LD 추출
2. Amazon URL → OG fallback으로 분류
3. 타임아웃: 느린 사이트 → 15초 후 GATEWAY_TIMEOUT
4. 429 응답 → 재시도 2회 후 성공/실패
5. 5xx 응답 → 재시도 후 에러
6. 악성 JSON-LD → 새니타이즈 후 안전하게 처리
7. 5MB 초과 페이지 → 처음 100KB에서 추출 시도
8. JSON-LD 없는 페이지 → OG 메타 태그로 폴백
9. 가격 추출: "$29.99" → currency: USD, price: 29.99
10. 유효하지 않은 URL → 400 에러
```

## 결과
```
=== F003 URL Classification — 강화 완료 ===
- 수정 파일: 1개 | 의존성: cheerio
- CRITICAL 5개, MISSING 4개 | 테스트: 10개 | 빌드: PASS/FAIL
```
