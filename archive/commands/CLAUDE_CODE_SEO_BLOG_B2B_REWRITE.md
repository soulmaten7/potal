# SEO 블로그 B2B 전환 — 기존 3개 리라이트 + 신규 3개 작성

> ⚠️ 이 작업은 블로그 콘텐츠만 수정합니다. 다른 기능 코드 건드리지 않습니다.
> ⚠️ **빌드(`npm run build`) 실행 금지** — 다른 터미널과 `.next/` 충돌 방지. 빌드 검증은 나중에 별도로 합니다.
> ⚠️ git add/commit/push 금지 — 나중에 한꺼번에 합니다.

## 배경
`SEO_BLOG_AUDIT_REPORT.md` 감사 결과에 따라 기존 B2C 블로그 3개를 B2B로 전환하고, B2B 타겟 신규 포스트 3개를 추가한다.

## 사전 작업
1. `SEO_BLOG_AUDIT_REPORT.md`를 읽고 각 포스트별 이슈를 파악한다.
2. `app/blog/posts.tsx`를 읽어 현재 콘텐츠 구조를 파악한다.
3. `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`를 읽어 메타데이터/SEO 구조를 파악한다.
4. `app/sitemap.ts`를 읽어 현재 sitemap 구성을 파악한다.
5. CLAUDE.md에서 최신 POTAL 수치를 확인한다:
   - 240개국, 131,794 tariff lines, ~155+ API endpoints, 9-field 100% accuracy
   - GRI Pipeline 592 codified rules, 1,233 Headings, 5,621 Subheadings
   - MCP Server v1.4.0, npm publish 완료
   - MFN 1,027,674건 + MIN ~105M + AGR ~129M

## Step 1: 기존 포스트 3개 B2B 전환

### Post 1: "Understanding Total Landed Cost" 수정
`app/blog/posts.tsx`에서 해당 포스트 수정:
- **제목 변경**: "Total Landed Cost API: How to Calculate Duties, Taxes & Fees for 240 Countries"
- **톤**: B2C "셀러 가이드" → B2B "개발자/기업 통합 가이드"
- **추가할 내용**:
  - POTAL API curl 예시 (실제 /api/v1/calculate 엔드포인트)
  - 응답 JSON 예시 (duties, taxes, fees, total_landed_cost 필드)
  - SDK 3종 코드 스니펫 (JavaScript, Python, cURL)
  - 최신 수치: 240개국, 131K tariff lines, 63 FTA, ~155 endpoints
  - 경쟁사 비교 한 줄: "Unlike manual lookup tools, POTAL's API returns results in <50ms with pre-computed rates"
- **CTA**: "Integrate via REST API in 5 minutes → /developers"
- **키워드**: "landed cost API", "customs duty calculator API", "total landed cost calculation"
- **메타데이터**: title, description, keywords 전부 B2B로 업데이트

### Post 2: "HS Code Classification" 수정
- **제목 변경**: "HS Code Classification API: 9-Field System That Achieves 100% Accuracy"
- **톤**: "셀러가 알아야 할" → "개발자가 통합하면"
- **삭제할 내용**: "50+ categories" (구시대), "AI to automatically classify" (부정확)
- **추가할 내용**:
  - 9-field 시스템 설명 (product_name, material, category, intended_use, processing, composition, weight_spec, price, additional_details)
  - 각 필드 정확도 기여도 (material +45%, category +25% 등 — POTAL_Ablation_V2.xlsx 참조)
  - GRI Pipeline: 592 codified rules, 0-2 AI calls, $0 비용
  - API 요청/응답 예시
  - "100% accuracy when all 9 fields provided" 명시
  - 경쟁사 대비: "Avalara uses AI-only approach. POTAL uses codified GRI rules first, AI only as fallback"
- **키워드**: "HS code API", "product classification API", "automated HS classification", "GRI classification"

### Post 3: "De Minimis Thresholds" 수정
- **제목 변경**: "De Minimis Thresholds API: Auto-Detect Duty-Free Shipments for 240 Countries"
- **톤**: "셀러 전략" → "API 통합 가이드"
- **추가할 내용**:
  - 전체 240개국 데이터 보유 강조 (기존 6개국만 나열 → "240 countries in our database")
  - US de minimis: CN/HK $0 vs 기타 $800 구분 (2025 변경사항)
  - EU €150 + IOSS 연동
  - API 응답에서 `de_minimis_applied: true` 예시
  - /calculate 엔드포인트에서 자동 de minimis 감지 설명
- **키워드**: "de minimis API", "customs threshold API", "duty-free shipping API"

## Step 2: 신규 B2B 포스트 3개 작성

### 신규 Post 4: "How to Integrate POTAL Landed Cost API: Quick Start for Developers"
- **Slug**: `potal-api-quickstart-guide`
- **카테고리**: Developer Guide
- **내용 구성**:
  1. API Key 발급 (Free 플랜 200건/월)
  2. 첫 번째 API 호출 (curl + JavaScript + Python)
  3. 응답 구조 설명 (duties, taxes, fees, de_minimis, fta_applied)
  4. SDK 설치 (`npm install potal-sdk` / `pip install potal`)
  5. MCP Server 연동 (`npx potal-mcp-server`)
  6. 에러 처리 (rate limit, invalid HS code 등)
  7. 프로덕션 체크리스트
- **키워드**: "landed cost API integration", "customs duty API tutorial", "POTAL API quickstart"
- **CTA**: "Start free at potal.app/developers"

### 신규 Post 5: "POTAL vs Avalara vs Zonos: Customs Duty API Comparison (2026)"
- **Slug**: `potal-vs-avalara-vs-zonos-comparison`
- **카테고리**: Industry Analysis
- **내용 구성**:
  1. 3사 개요 (POTAL: API 인프라, Avalara: Tax compliance, Zonos: Checkout widget)
  2. 기능 비교표: 국가 수, HS 매핑 수, FTA 지원, 가격, API 응답 속도
  3. POTAL 차별점: 240국 커버, 131K tariff lines, <50ms 응답, Free 플랜, MCP 지원
  4. 가격 비교: POTAL Free $0 (200건) vs Avalara Enterprise $$$$ vs Zonos $0.10/transaction
  5. 개발자 경험: POTAL SDK 3종 + MCP vs Avalara REST only vs Zonos JS widget
  6. 결론: "어떤 서비스가 맞는가" (규모별 추천)
- **키워드**: "customs duty API comparison", "Avalara alternative", "Zonos alternative", "landed cost API comparison"
- **CTA**: "Try POTAL free — 200 API calls/month"
- **주의**: 경쟁사 비하 없이 사실 기반 비교. POTAL 공식 데이터만 사용. 경쟁사 데이터는 공개 정보(가격표, 문서)에서만 인용

### 신규 Post 6: "Why 9 Fields Beat AI Guessing: The Science Behind POTAL's HS Classification"
- **Slug**: `9-field-hs-classification-science`
- **카테고리**: Technical Deep Dive
- **내용 구성**:
  1. 문제: AI-only HS 분류의 한계 (hallucination, inconsistency, cost)
  2. POTAL 접근법: GRI (General Rules of Interpretation) 코드화
  3. 9개 필드 각각의 역할과 정확도 기여
  4. Ablation Study 결과 요약 (466조합 × 50상품 = 23,300회 테스트)
  5. 파이프라인: 키워드 매칭 → GRI 규칙 → AI 폴백 (0-2 calls)
  6. 비용 비교: POTAL $0/건 (캐시) vs GPT-4 $0.03/건
  7. 실전 정확도: Section 100% → Chapter 100% → Heading 98% → HS6 95%+ (9필드 완전 입력 시 100%)
- **키워드**: "HS classification accuracy", "GRI rules API", "automated customs classification", "HS code AI vs rules"
- **CTA**: "Classify your first product — /developers"

## Step 3: SEO 인프라 수정

### sitemap.ts 업데이트
- 신규 포스트 3개 URL 추가
- `/faq` 페이지 추가 (현재 누락)
- `/guide` 페이지 추가 (현재 누락)

### [slug]/page.tsx 메타데이터 수정
- `articleBody` 버그 수정: JSON-LD에서 본문 대신 제목이 들어가는 문제 (감사 리포트 참조)
- 스키마 타입: `BlogPosting` → `TechArticle` (기술 콘텐츠에 더 적합)

### blog/page.tsx 수정
- 블로그 랜딩 제목: "POTAL Blog" → "POTAL Developer Blog — Cross-Border Commerce API Guides"
- description 업데이트

### faq/page.tsx — JSON-LD FAQPage 스키마 추가
- 현재 FAQ에 JSON-LD 없음 → Google 리치 스니펫 놓치고 있음
- FAQPage 스키마 추가 (질문/답변 구조화)

## Step 4: 검증 (빌드 제외)
1. TypeScript 컴파일: `npx tsc --noEmit 2>&1 | head -20` (타입 에러만 확인)
2. 포스트 데이터 구조 확인: 6개 포스트 모두 필수 필드 포함
3. sitemap에 6개 블로그 URL + /faq + /guide 포함 확인
4. JSON-LD 스키마 구조 확인 (articleBody 버그 수정)
5. **빌드는 하지 않는다** — 다른 터미널 작업 완료 후 별도로 실행

## 결과 출력
```
=== SEO Blog B2B Rewrite — 결과 ===
[기존 수정]
- Post 1: [제목] → B2B 전환 완료
- Post 2: [제목] → B2B 전환 완료
- Post 3: [제목] → B2B 전환 완료
[신규 작성]
- Post 4: [제목] — 신규
- Post 5: [제목] — 신규
- Post 6: [제목] — 신규
[SEO 인프라]
- sitemap: +3 블로그 + /faq + /guide
- JSON-LD articleBody 버그 수정
- FAQPage 스키마 추가
[수정 파일 수]: N개
[TypeScript 컴파일]: PASS/FAIL
```
