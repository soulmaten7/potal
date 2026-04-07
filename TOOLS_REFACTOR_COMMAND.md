# Tools → Features 통합 리팩터 명령어
# 2026-04-07 CW22-S4e
# Claude Code 터미널1 (Opus)에서 실행

## 작업 개요
- 1단계: API 미들웨어에 X-Demo-Request 바이패스 추가 (32개 tool 복구)
- 2단계: Features 페이지에 인터랙티브 tool 폼 통합
- 3단계: /tools 페이지 제거 + SEO 리다이렉트
- 최종: 빌드 확인 + 문서 업데이트

---

## 명령어 (아래 전체를 터미널1에 붙여넣기)

```
이 작업은 3단계로 진행합니다. 반드시 순서대로, 각 단계 완료 후 빌드 확인하세요.

=== 1단계: API 미들웨어 X-Demo-Request 바이패스 ===

핵심 문제: app/lib/api-auth/middleware.ts의 withApiAuth() 함수가 API key 없으면 즉시 거부합니다.
현재 X-Demo-Request 바이패스는 app/api/v1/calculate/route.ts에만 있습니다.
이걸 미들웨어 레벨에서 처리하면 모든 API 엔드포인트가 demo 모드로 작동합니다.

수정 파일: app/lib/api-auth/middleware.ts

수정 내용:
1. withApiAuth() 함수 시작 부분(line 165 근처)에서, apiKey 추출 전에 X-Demo-Request 체크 추가:

```typescript
// Demo bypass — Tools pages send X-Demo-Request: true, no API key required
if (req.headers.get('X-Demo-Request') === 'true') {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  // Demo rate limit: 10 req/min per IP
  const now = Date.now();
  const key = `demo_${ip}`;
  const entry = demoRateLimitMap.get(key);
  if (entry && now - entry.start < 60000) {
    if (entry.count >= 10) {
      return apiError(ApiErrorCode.RATE_LIMITED, 'Demo rate limit exceeded (10/min). Sign up for unlimited access.');
    }
    entry.count++;
  } else {
    demoRateLimitMap.set(key, { start: now, count: 1 });
  }
  // Demo context — sandbox mode, no real key needed
  const demoCtx: ApiAuthContext = {
    keyId: 'demo',
    sellerId: 'demo',
    keyType: 'publishable',
    planId: 'free',
    subscriptionStatus: 'active',
    rateLimitPerMinute: 10,
    sandbox: true,
  };
  const response = await handler(req, demoCtx);
  const elapsed = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${elapsed}ms`);
  response.headers.set('X-Demo-Mode', 'true');
  return response;
}
```

2. 파일 상단에 demoRateLimitMap 추가:
```typescript
const demoRateLimitMap = new Map<string, { start: number; count: number }>();
```

3. app/api/v1/calculate/route.ts에서 기존 demo bypass 코드(line 376-384)를 제거하세요.
   미들웨어에서 이미 처리하므로 중복됩니다. POST 함수를 다음으로 변경:
```typescript
export async function POST(req: NextRequest): Promise<Response> {
  return withApiAuth(_calculateHandler)(req);
}
```
   그리고 DEMO_CONTEXT, checkDemoRateLimit, demoRateLimitStore 등 demo 관련 코드도 삭제.

4. 추가 수정 필요 - tool 페이지에서 보내는 필드명과 API가 요구하는 필드명 불일치:

   a) app/tools/anti-dumping/page.tsx: API body에서 productValue → price 로 변경
   b) app/tools/de-minimis/page.tsx: API body에서 productValue → price 로 변경
   c) app/tools/ioss/page.tsx: API body에서 productValue → price 로 변경
   d) app/tools/currency/page.tsx: POST → GET으로 변경. fetch URL을
      `/api/v1/exchange-rate?from=${from}&to=${to}&amount=${amount}` GET으로 변경
   e) app/tools/fta/page.tsx: POST 대신 GET을 사용하거나,
      fta route가 POST를 지원하도록 app/api/v1/fta/route.ts 수정

5. 누락된 API 엔드포인트 2개 생성:
   a) app/api/v1/tax/exemption/route.ts — 새로 만들기.
      요청: { productCategory, originCountry, destinationCountry, exemptionType }
      응답: exemption 정보 (zero-rated, reduced rate 등)
   b) app/api/v1/tax/digital-services/route.ts — 새로 만들기.
      요청: { serviceType, revenue, sellerCountry, buyerCountry }
      응답: digital services tax 계산 결과

6. app/api/v1/exchange-rate/route.ts: X-Demo-Request 헤더가 있으면 API key 체크 건너뛰도록 수정.
   주의: exchange-rate는 GET이라 withApiAuth를 안 쓸 수 있음. 확인 후 수정.

7. app/api/v1/fta/route.ts: POST 메소드 지원 확인. 현재 GET만 지원하면 POST도 추가하거나,
   app/tools/fta/page.tsx에서 GET으로 변경.

빌드 확인: npm run build
테스트: 각 tool 페이지에서 X-Demo-Request가 잘 작동하는지 curl로 확인:
curl -X POST https://localhost:3000/api/v1/screening -H "Content-Type: application/json" -H "X-Demo-Request: true" -d '{"name":"Huawei","country":"CN"}'

=== 2단계: Features 페이지에 인터랙티브 tool 통합 ===

현재 구조:
- app/features/page.tsx에 TOOL_LINKS 맵이 있고, "Try it →" 클릭하면 /tools/* 로 이동
- app/features/[slug]/page.tsx에 feature 상세 가이드가 있음

변경 계획:
Features [slug] 상세 페이지에서 바로 tool을 사용할 수 있게 합니다.

수정 파일: app/features/[slug]/page.tsx

1. 새 컴포넌트 생성: app/features/[slug]/FeatureToolWidget.tsx
   - 이 컴포넌트는 slug를 받아서 해당 tool의 인터랙티브 폼을 렌더링
   - 기존 /tools/*/page.tsx의 폼+API 호출 로직을 재사용
   - 폼 제출 시 X-Demo-Request: true 헤더로 API 호출
   - 결과를 폼 아래에 표시

   구현 방식:
   - TOOL_CONFIGS 맵을 만들어서 각 tool의 폼 필드, API endpoint, method 정의
   - 범용 ToolForm 컴포넌트가 config를 받아서 폼을 동적 생성
   - 이렇게 하면 34개 tool을 하나의 컴포넌트로 처리 가능

   예시 구조:
   ```typescript
   const TOOL_CONFIGS: Record<string, ToolConfig> = {
     'hs-code-classification': {
       apiEndpoint: '/api/v1/classify',
       method: 'POST',
       fields: [
         { name: 'productName', label: 'Product Name', placeholder: 'e.g. Cotton T-Shirt', required: true },
         { name: 'material', label: 'Material', placeholder: 'e.g. cotton' },
         { name: 'category', label: 'Category', placeholder: 'e.g. apparel' },
       ],
       submitLabel: 'Classify Product',
     },
     'sanctions-screening': {
       apiEndpoint: '/api/v1/screening',
       method: 'POST',
       fields: [
         { name: 'name', label: 'Name to Screen', placeholder: 'e.g. John Smith, ABC Trading Co.', required: true },
         { name: 'country', label: 'Country (Optional)', placeholder: 'e.g. IR, RU, CN' },
       ],
       submitLabel: 'Screen Now',
     },
     // ... 나머지 tool configs
   };
   ```

2. app/features/[slug]/page.tsx 수정:
   - 기존 가이드 내용 아래에 FeatureToolWidget 추가
   - TOOL_LINKS에 매핑된 slug만 widget 표시
   - "Try it live" 섹션으로 구분

3. app/features/page.tsx 수정:
   - TOOL_LINKS의 "Try it →" 버튼 동작을 /tools/* 대신 /features/[slug]#try-it 로 변경
   - 즉, 같은 features 상세 페이지 내의 try-it 섹션으로 스크롤

빌드 확인: npm run build

=== 3단계: /tools 페이지 제거 + SEO 리다이렉트 ===

1. next.config.js (또는 next.config.mjs)에 리다이렉트 추가:
   ```javascript
   async redirects() {
     return [
       // /tools 허브 페이지 → /features
       { source: '/tools', destination: '/features', permanent: true },
       // 각 tool 페이지 → 해당 feature 상세 페이지
       { source: '/tools/screening', destination: '/features/sanctions-screening', permanent: true },
       { source: '/tools/hs-lookup', destination: '/features/hs-code-classification', permanent: true },
       { source: '/tools/export-controls', destination: '/features/export-controls', permanent: true },
       { source: '/tools/classify-eccn', destination: '/features/eccn-classification', permanent: true },
       { source: '/tools/dual-use', destination: '/features/export-controls', permanent: true },
       { source: '/tools/embargo', destination: '/features/trade-embargo-check', permanent: true },
       { source: '/tools/restrictions', destination: '/features/restricted-items', permanent: true },
       { source: '/tools/pre-shipment', destination: '/features/pre-shipment-check', permanent: true },
       { source: '/tools/compliance-report', destination: '/features/compliance-report', permanent: true },
       { source: '/tools/anti-dumping', destination: '/features/anti-dumping-duties', permanent: true },
       { source: '/tools/ics2', destination: '/features/ics2-filing', permanent: true },
       { source: '/tools/type86', destination: '/features/type86-entry', permanent: true },
       { source: '/tools/customs-forms', destination: '/features/customs-documentation', permanent: true },
       { source: '/tools/customs-docs', destination: '/features/customs-documentation', permanent: true },
       { source: '/tools/de-minimis', destination: '/features/de-minimis-check', permanent: true },
       { source: '/tools/batch', destination: '/features/batch-classification', permanent: true },
       { source: '/tools/image-classify', destination: '/features/image-classification', permanent: true },
       { source: '/tools/fta', destination: '/features/fta-detection', permanent: true },
       { source: '/tools/compare', destination: '/features/compare-origins', permanent: true },
       { source: '/tools/currency', destination: '/features/currency-conversion', permanent: true },
       { source: '/tools/tax', destination: '/features/tax-calculation-vat-gst', permanent: true },
       { source: '/tools/vat-check', destination: '/features/vat-registration-check', permanent: true },
       { source: '/tools/tax-exemptions', destination: '/features/tax-exemptions', permanent: true },
       { source: '/tools/digital-tax', destination: '/features/digital-services-tax', permanent: true },
       { source: '/tools/ioss', destination: '/features/ioss-registration', permanent: true },
       { source: '/tools/ddp-calculator', destination: '/features/ddp-ddu-calculator', permanent: true },
       { source: '/tools/shipping', destination: '/features/shipping-rates', permanent: true },
       { source: '/tools/returns', destination: '/features/cross-border-returns', permanent: true },
       { source: '/tools/label-generation', destination: '/features/shipping-labels', permanent: true },
       { source: '/tools/pdf-reports', destination: '/features/pdf-reports', permanent: true },
       { source: '/tools/e-invoice', destination: '/features/e-invoicing', permanent: true },
       { source: '/tools/checkout', destination: '/features/checkout-widget', permanent: true },
       { source: '/tools/csv-export', destination: '/features/csv-export', permanent: true },
       { source: '/tools/countries', destination: '/features/country-database', permanent: true },
     ];
   },
   ```

2. Header.tsx에서 nav 메뉴의 Tools 항목 제거:
   components/layout/Header.tsx line 141의 { href: '/tools', label: 'Tools' } 삭제

3. app/tools/ 디렉토리 전체를 archive/tools-deprecated/ 로 이동 (삭제하지 않고 보관)

4. features/page.tsx에서 TOOL_LINKS 맵의 /tools/* 링크를 모두 /features/*#try-it 로 변경
   또는 TOOL_LINKS 자체를 제거하고, tool이 있는 feature는 자동으로 "Try it" 버튼 표시

빌드 확인: npm run build

=== 최종: 문서 업데이트 ===

1. CLAUDE.md 헤더 날짜 업데이트 (CW22-S4e: Tools→Features 통합)
2. CHANGELOG.md에 변경사항 추가
3. session-context.md 업데이트
4. NEXT_SESSION_START.md 업데이트
5. .cursorrules 업데이트 (파일 구조 변경 반영)

git add 관련 파일 && git commit && git push && vercel --prod
```
