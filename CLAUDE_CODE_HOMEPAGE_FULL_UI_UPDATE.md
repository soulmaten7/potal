# POTAL 전체 공개 페이지 UI 일괄 업데이트

## 목표
공개 페이지 6개(page.tsx, pricing, about, help, faq, developers) 전체를 점검하여 오래된 수치, 부정확한 기술 설명, 누락된 기능을 일괄 업데이트한다.

## 반드시 먼저 읽기
- session-context.md (프로젝트 맥락)
- CLAUDE.md (핵심 수치 섹션 — 특히 v3 파이프라인, Layer 구조, 벤치마크)
- 절대 규칙: npm run build 확인 후에만 push

---

## 수정 대상 파일 6개

1. `app/page.tsx` — 홈페이지 (8건)
2. `app/pricing/page.tsx` — 가격 페이지 (1건)
3. `app/about/page.tsx` — About 페이지 (1건)
4. `app/help/page.tsx` — Help 페이지 (3건)
5. `app/faq/page.tsx` — Knowledge Base (5건)
6. `app/developers/page.tsx` — Developers 페이지 (2건)

**총 20건 변경**

---

## ═══ FILE 1: app/page.tsx (홈페이지) — 8건 ═══

### 1-1. TRUST METRICS: 99.2% → 100%
**위치**: ~line 521
```
변경 전: { value: '99.2%', label: 'Calculation Accuracy', sub: 'Verified against gov sources' },
변경 후: { value: '100%', label: 'HS Code Accuracy', sub: '9-field input, verified against WCO' },
```

### 1-2. curl 예시: 6필드 → 9필드
**위치**: CodeBlock 컴포넌트 (~line 33-43)
curl code string에 material, category 필드 추가:
```typescript
const code = `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productName": "Cotton T-Shirt",
    "material": "cotton",
    "category": "apparel",
    "declaredValue": 49.99,
    "originCountry": "CN",
    "destinationCountry": "US",
    "zipcode": "10001",
    "shippingCost": 8.50
  }'`;
```
그리고 아래 syntax-highlighted `<pre>` 부분(~line 91-101)도 동일하게 material, category 줄 추가. 색상은 기존 key-value 패턴 따라서:
```tsx
{'  '}-d <span style={{ color: '#86efac' }}>{`'{
    "productName": "Cotton T-Shirt",
    "material": "cotton",
    "category": "apparel",
    "declaredValue": 49.99,
    "originCountry": "CN",
    "destinationCountry": "US",
    "zipcode": "10001",
    "shippingCost": 8.50
  }'`}</span>
```

### 1-3. API 응답 예시: fieldValidation 추가
**위치**: ResponsePreview 컴포넌트 (~line 135-150)
hsCode 줄 뒤에 추가:
```
    "hsCodeConfidence": "100%",
    "fieldValidation": {
      "status": "valid",
      "fieldsProvided": 8,
      "fieldsRequired": 3
    },
```

### 1-4. 데이터 소스: +Japan Customs
**위치**: ~line 465-490, OFAC 앞에 추가:
```typescript
{ name: 'JP Customs', full: 'Japan Customs & Tariff Bureau' },
```

### 1-5. Features: +3 카드
**위치**: features-grid (~line 654-685), 기존 6개 카드(Widget) 뒤에 추가:
```tsx
<FeatureCard
  icon="🛡️"
  title="Sanctions & Export Controls"
  description="Screen against OFAC SDN, BIS Entity List, and 19 sanctions sources. 21,300+ entries with fuzzy matching."
/>
<FeatureCard
  icon="⚖️"
  title="Trade Remedies"
  description="Anti-dumping duties, countervailing duties, and safeguard measures. 119,700+ cases across 36 countries."
/>
<FeatureCard
  icon="🤖"
  title="AI Agent Ready (MCP)"
  description="Official MCP server on the registry. Any AI agent — ChatGPT, Claude, Gemini — can call POTAL via one command."
/>
```

### 1-6. CTA 문구 수정
**위치**: ~line 918
```
변경 전: Join sellers who use POTAL to show transparent pricing to customers in 240 countries.
변경 후: Start showing transparent pricing to customers in 240 countries. Free forever, up to 200 API calls per month.
```

### 1-7. Hero description 수정
**위치**: ~line 385-393
```
변경 전: Show your buyers the true cost of any product — duties, taxes, and shipping — for 240 countries. Embed in minutes, not months.
변경 후: Calculate duties, taxes, and shipping for 240 countries with one API call. 100% HS Code accuracy with 9-field classification.
```

### 1-8. Hero CTA 통일
**위치**: ~line 396-412
첫 번째 CTA 버튼의 href를 `/auth/signup`에서 `/developers`로 변경 (Developers 페이지가 실질적 시작점이므로).
아니면 텍스트를 "Get Started Free"로 변경하고 href는 그대로 유지해도 됨. 판단하여 처리.

---

## ═══ FILE 2: app/pricing/page.tsx — 1건 ═══

### 2-1. FAQ: AI-powered → 9-field
**위치**: FAQS 배열 마지막 항목 (~line 144)
```
변경 전: 'POTAL covers 240 countries with AI-powered HS classification, real-time FTA detection, anti-dumping duty alerts, and 50 language support — all at a fraction of competitors\' pricing. Our Basic plan at $20/month includes features that competitors charge $500+/month for.',
변경 후: 'POTAL covers 240 countries with 9-field HS classification (100% accuracy with complete input), real-time FTA detection, anti-dumping duty alerts, sanctions screening, and 50 language support — all at a fraction of competitors\' pricing. Our Basic plan at $20/month includes features that competitors charge $500+/month for.',
```

---

## ═══ FILE 3: app/about/page.tsx — 1건 ═══

### 3-1. STATS에 HS 정확도 추가
**위치**: STATS 배열 (~line 6-11)
기존 4개 유지 + 아래 추가:
```typescript
{ value: "100%", label: "HS Accuracy", description: "9-field classification, WCO verified" },
```
그리고 gridTemplateColumns를 `'1fr 1fr'`에서 5개 맞추려면... 기존 2x2 레이아웃이므로 하나만 추가하면 2x3으로 자연스럽게 들어감. 그대로 두면 됨.

---

## ═══ FILE 4: app/help/page.tsx — 3건 ═══

### 4-1. FAQ #1 "What is POTAL?"
**위치**: FAQ_ITEMS id: '1' (~line 24)
```
변경 전: ...covering 240 countries with AI-powered HS Code classification.
변경 후: ...covering 240 countries with 9-field HS Code classification (100% accuracy with complete input).
```

### 4-2. FAQ #2 "How accurate are the duty calculations?"
**위치**: FAQ_ITEMS id: '2' (~line 30)
```
변경 전: Our calculations are based on official tariff schedules, trade agreements (FTAs), and de minimis thresholds. While we provide highly accurate estimates, actual customs charges may vary based on the destination country\'s customs authority assessment. We recommend consulting a licensed customs broker for binding classifications.
변경 후: POTAL achieves 100% HS Code accuracy when all 9 classification fields are provided (product name, material, category, description, processing, composition, weight spec, price, origin country). Our calculations are based on official tariff schedules from 7 governments, 113M+ tariff records, 63 FTAs, and WCO standards. For binding rulings, we recommend consulting a licensed customs broker.
```

### 4-3. FAQ #12 "How does HS Code classification work?"
**위치**: FAQ_ITEMS id: '12' (~line 89-91)
```
변경 전: POTAL uses a 3-stage AI classification pipeline: first checking a cached product database (WDC), then vector similarity search, and finally an LLM-based classifier. This ensures fast, accurate HS Code assignment for any product description.
변경 후: POTAL uses a 9-field classification system based on WCO General Rules of Interpretation (GRI). You provide product name, material, category, and up to 6 additional fields. The engine applies 592 codified Section/Chapter Notes, 1,233 Heading rules, and 5,621 Subheading rules — achieving 100% accuracy with complete input. No AI guessing: the system follows the same process licensed customs brokers use.
```

---

## ═══ FILE 5: app/faq/page.tsx (Knowledge Base) — 5건 ═══

### 5-1. HS Code FAQ #3 "How does POTAL classify products?"
**위치**: faqs 배열 (~line 15)
```
변경 전: POTAL uses a 3-stage AI classification pipeline: (1) Vector similarity search against 8,389+ pre-classified products, (2) Keyword matching against product descriptions, (3) LLM-based classification for novel products. Results are cached for instant future lookups at zero cost.
변경 후: POTAL uses a 9-field classification system following WCO General Rules of Interpretation (GRI). Provide product name, material, category, and up to 6 additional fields. The engine applies 592 codified rules, 1,233 Heading descriptions, and 5,621 Subheading conditions to determine the exact HS Code — with 0-2 AI calls (most products need zero). Results are cached for instant future lookups at $0 cost.
```

### 5-2. HS Code FAQ #4 "How accurate?"
**위치**: faqs 배열 (~line 16)
```
변경 전: POTAL achieves near-100% accuracy through a combination of curated product-to-HS mappings (8,389+ entries), vector similarity search, and LLM fallback. All classifications include confidence scores and reasoning chains for transparency.
변경 후: POTAL achieves 100% HS Code accuracy when all 9 classification fields are provided. This was verified through Amazon 50-product benchmarks (100% across all levels) and 466-combination ablation tests. The critical fields are: product name, material (+45% accuracy impact), and category (+33%). All responses include field validation feedback showing which fields to add for higher accuracy.
```

### 5-3. HS Code FAQ #5 "tariff schedule"
**위치**: faqs 배열 (~line 17)
```
변경 전: ...covering 89,842 tariff lines.
변경 후: ...covering 131,794 tariff lines with country-specific 10-digit codes.
```

### 5-4. Troubleshooting FAQ "Low confidence"
**위치**: faqs 배열 (~line 50)
```
변경 전: Low confidence usually means the product description is too vague. Include specific details: material, intended use, size, and category. For example, "cotton t-shirt for men" is better than "shirt".
변경 후: Low confidence means key classification fields are missing. POTAL uses 9 fields: product name, material, category, description, processing, composition, weight spec, price, and origin country. Material alone improves accuracy by 45%. The API response includes a fieldValidation object showing exactly which fields to add. For example, providing material="cotton" and category="apparel" with product name is enough for 98%+ accuracy.
```

### 5-5. General FAQ "How many countries"
**위치**: faqs 배열 (~line 61)
```
변경 전: ...MFN tariff data covers 186 countries (1M+ rates), with preferential rates for 53 countries (257M+ rows).
변경 후: ...MFN tariff data covers 186 countries (113M+ tariff records), with preferential rates for 53 countries (257M+ rows) and bulk-downloaded 10-digit schedules from 7 governments (131,794 lines).
```

---

## ═══ FILE 6: app/developers/page.tsx — 2건 ═══

### 6-1. CODE_EXAMPLES: 구 API 형식 → 신 형식
**위치**: CODE_EXAMPLES 객체 (~line 38-86)

**cURL 변경 후:**
```typescript
cURL: `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "productName": "Cotton T-Shirt",
    "material": "cotton",
    "category": "apparel",
    "declaredValue": 25.00,
    "originCountry": "CN",
    "destinationCountry": "US",
    "shippingCost": 8.50
  }'`,
```

**JavaScript 변경 후:**
```typescript
JavaScript: `const response = await fetch(
  "https://www.potal.app/api/v1/calculate",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "YOUR_API_KEY",
    },
    body: JSON.stringify({
      productName: "Cotton T-Shirt",
      material: "cotton",
      category: "apparel",
      declaredValue: 25.00,
      originCountry: "CN",
      destinationCountry: "US",
      shippingCost: 8.50,
    }),
  }
);
const data = await response.json();
console.log(data.data.totalLandedCost);`,
```

**Python 변경 후:**
```typescript
Python: `import requests

response = requests.post(
    "https://www.potal.app/api/v1/calculate",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "YOUR_API_KEY",
    },
    json={
        "productName": "Cotton T-Shirt",
        "material": "cotton",
        "category": "apparel",
        "declaredValue": 25.00,
        "originCountry": "CN",
        "destinationCountry": "US",
        "shippingCost": 8.50,
    },
)
data = response.json()
print(data["data"]["totalLandedCost"])`,
```

### 6-2. API Explorer curl도 동일하게 업데이트
**위치**: ApiExplorer 내 curlCode (~line 161-170)
기존 from_country/to_country/hs_code/value/currency 형식을:
```typescript
const curlCode = `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "productName": "Cotton T-Shirt",
    "material": "cotton",
    "category": "apparel",
    "declaredValue": ${numValue.toFixed(2)},
    "originCountry": "${origin}",
    "destinationCountry": "${destination}",
    "shippingCost": 8.50
  }'`;
```

API Explorer의 responseJson도 hsCodeConfidence + fieldValidation 필드 추가:
```typescript
const responseJson = `{
  "success": true,
  "data": {
    "totalLandedCost": ${total},
    "breakdown": {
      "productPrice": ${numValue.toFixed(2)},
      "importDuty": ${scaledDuty.toFixed(2)},
      "tax": ${scaledTax.toFixed(2)},
      "shipping": ${shipping.toFixed(2)},
      "taxLabel": "${mock.taxLabel}"
    },
    "hsCode": "${mock.hsCode}",
    "hsCodeConfidence": "100%",
    "deMinimis": ${mock.deMinimis},
    "fta": ${mock.fta}
  }
}`;
```

---

## 실행 순서

1. 위 20건을 6개 파일에 순차 적용
2. `npm run build 2>&1 | tail -20` — 빌드 확인 (timeout 3m)
3. 빌드 성공 시:
```bash
git add app/page.tsx app/pricing/page.tsx app/about/page.tsx app/help/page.tsx app/faq/page.tsx app/developers/page.tsx && git commit -m "$(cat <<'EOF'
update: full public pages UI refresh — 20 changes across 6 files

Homepage (8):
- Trust metrics: 99.2% → 100% HS Code Accuracy (9-field, WCO verified)
- curl example: 6-field → 9-field (material + category)
- API response: +hsCodeConfidence +fieldValidation
- Data sources: +Japan Customs (7→8)
- Features: +3 cards (Sanctions, Trade Remedies, MCP)
- CTA: "Join sellers" → value-first (0 customers)
- Hero: emphasize 100% accuracy
- Hero CTA: unified

Pricing (1):
- FAQ: AI-powered → 9-field classification

About (1):
- Stats: +100% HS Accuracy metric

Help (3):
- FAQ #1,#2,#12: AI pipeline → 9-field GRI system

FAQ/Knowledge Base (5):
- HS classification, accuracy, tariff lines, troubleshooting, coverage

Developers (2):
- Code examples: old API format → new 9-field format
- API Explorer: updated request/response format

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

4. Vercel 배포 상태 확인

---

## 주의사항
- 기존 UI 스타일(색상, 폰트, 레이아웃, 반응형) 절대 변경하지 않기
- 기존 기능 카드 6개 내용 수정하지 않기 (추가만)
- CodeBlock의 syntax highlighting 색상 유지
- 엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx에 시트 추가 (시트명: 현재 YYMMDDHHMM)
- 절대 규칙 위반 금지 (console.log, B2C 코드 수정 등)
