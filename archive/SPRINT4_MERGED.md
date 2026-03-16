아래 Sprint 4 전체 기능을 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수. 한 번에 하나의 파일씩 수정하고, 중간에 막히면 스킵하고 다음으로 넘어갔다가 마지막에 다시 시도해.

# ═══════════════════════════════════════
# SPRINT 4: BUSINESS SCALE (P3)
# ═══════════════════════════════════════

【F047 BigCommerce Plugin A+】
1. plugins/bigcommerce/ 확장:
   - manifest.json: app 메타데이터
   - src/index.ts: BigCommerce Stencil theme snippet
     - 상품 페이지에 "Estimated Import Duties & Taxes" 섹션 삽입
     - POTAL API 호출 → 결과 표시
   - src/webhook.ts: orders/created webhook handler
     - 주문 생성 시 → POTAL calculate 호출 → 결과 저장
   - README.md: 설치 가이드 (API key 설정, webhook URL 등록)
   - package.json

【F048 Magento Plugin A+】
1. plugins/magento/ 확장:
   - registration.php: Magento module 등록
   - etc/module.xml: module 정의
   - Observer/OrderPlaceBefore.php: sales_order_place_before 이벤트
     - 주문 생성 전 → POTAL calculate 호출 → 관세/세금 항목 추가
   - Block/DutyDisplay.php: 상품 페이지 관세 표시 블록
   - view/frontend/templates/duty-display.phtml: 프론트엔드 템플릿
   - README.md: 설치 가이드

【F082-F083 Marketplace + ERP Connections A+】
1. /dashboard/integrations 페이지:
   - 통합 가능 플랫폼 카드 목록:
     ✅ Shopify (Connected) | ✅ WooCommerce (Connected)
     🔜 eBay (Coming Soon) | 🔜 Etsy (Coming Soon)
     🔜 QuickBooks (Coming Soon) | 🔜 Xero (Coming Soon)
   - marketplace_connections 테이블 활용: platform, status, credentials(encrypted), connected_at
   - "Connect" 버튼 → 모달: API credentials 입력 → 저장 → 테스트 연결

2. 기본 연동 프레임워크:
   - app/lib/integrations/base.ts: abstract IntegrationClient { connect(), disconnect(), test(), sync() }
   - app/lib/integrations/ebay.ts: extends IntegrationClient (stub — OAuth flow 준비)
   - app/lib/integrations/quickbooks.ts: extends IntegrationClient (stub — OAuth 2.0 flow 준비)
   - 실제 API 호출은 credentials 입력 후 활성화

【F084 Accounting Integration A+】
1. QuickBooks/Xero 연동 준비:
   - 관세 비용 자동 분개 로직 (app/lib/integrations/accounting.ts):
     - mapToAccountingEntry(landed_cost_result) → { accounts: [{name: "Import Duty Expense", amount}, {name: "VAT Receivable", amount}] }
   - 실제 API 호출은 OAuth 연결 후

【F056 US State Sales Tax A+】
1. us_state_tax_rates 테이블:
   CREATE TABLE IF NOT EXISTS us_state_tax_rates (
     id serial PRIMARY KEY,
     state_code text NOT NULL,
     state_name text NOT NULL,
     state_rate numeric NOT NULL,
     avg_local_rate numeric DEFAULT 0,
     combined_rate numeric NOT NULL,
     has_economic_nexus boolean DEFAULT true,
     nexus_revenue_threshold numeric DEFAULT 100000,
     nexus_transaction_threshold integer DEFAULT 200,
     food_exempt boolean DEFAULT false,
     clothing_exempt boolean DEFAULT false,
     notes text
   );
2. 50개 주 + DC = 51건 시딩:
   - AL(4%), AK(0%), AZ(5.6%), AR(6.5%), CA(7.25%), CO(2.9%), CT(6.35%), DE(0%), FL(6%), GA(4%), HI(4%), ID(6%), IL(6.25%), IN(7%), IA(6%), KS(6.5%), KY(6%), LA(4.45%), ME(5.5%), MD(6%), MA(6.25%), MI(6%), MN(6.875%), MS(7%), MO(4.225%), MT(0%), NE(5.5%), NV(6.85%), NH(0%), NJ(6.625%), NM(4.875%), NY(4%), NC(4.75%), ND(5%), OH(5.75%), OK(4.5%), OR(0%), PA(6%), RI(7%), SC(6%), SD(4.2%), TN(7%), TX(6.25%), UT(6.1%), VT(6%), VA(5.3%), WA(6.5%), WV(6%), WI(5%), WY(4%), DC(6%)
   - food_exempt: 대부분 true (TX, AL 등은 false)
   - clothing_exempt: NY(under $110), PA, NJ, MN 등
3. GET /api/v1/tax/us-state?state=CA&product_category=clothing&value=50:
   - 응답: { state, rate, combined_rate, exempt: false, tax_amount }

【F059 E-Invoice Basic A+】
1. POST /api/v1/invoice/generate 엔드포인트:
   - body: { format: "ubl"|"json", invoice_data: { seller, buyer, items, totals } }
   - UBL 2.1 최소 필드셋 XML 생성:
     <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
       <ID>, <IssueDate>, <InvoiceTypeCode>, <DocumentCurrencyCode>
       <AccountingSupplierParty>, <AccountingCustomerParty>
       <InvoiceLine> (items)
       <TaxTotal>, <LegalMonetaryTotal>
   - JSON 포맷: 동일 데이터 구조

【F035 Multi-language S — RTL 검증】
1. globals.css 또는 layout.tsx에 RTL 지원:
   - html[dir="rtl"] 스타일 추가
   - 주요 컴포넌트 flexbox direction 반전
   - Arabic(ar), Hebrew(he) 로케일 선택 시 dir="rtl" 자동 적용
   - 주요 5개 페이지 RTL 레이아웃 확인 (Landing, Pricing, Dashboard, Developers, Login)

【F132-F133 Partner Portal + Referral A+】
1. /partners 공개 페이지:
   - 파트너 프로그램 소개 (4 tiers: Technology, Reseller, Service, Channel)
   - 혜택: Revenue share, Co-marketing, Technical support, Early access
   - "Apply" 버튼 → 신청 폼 (company, name, email, tier, website)
   - partner_accounts 테이블에 INSERT

2. /dashboard/partners 파트너 대시보드:
   - 내 추천 링크: https://potal.app/ref/[partner_code]
   - 추천 현황: partner_referrals 테이블에서 조회
   - { total_referrals, converted, revenue_share }

【나머지 Post-customer 기능 — 최소 구현만】

【F130 Video Tutorials A】
1. /support/videos 또는 /learn 페이지:
   - 5개 비디오 카드 (YouTube embed placeholder):
     "Getting Started with POTAL API", "HS Code Classification", "Reading Your Landed Cost", "Setting Up Webhooks", "Widget Installation"
   - 실제 비디오 URL은 나중에 교체 (placeholder thumbnail)

【F131 Community A】
1. /community 페이지:
   - GitHub Discussions 링크 (버튼: "Join Our Developer Community")
   - Stack Overflow 태그 안내: [potal-api]
   - Discord/Slack 링크 (준비되면 추가)

【F134-F135 Affiliate + Reseller】
1. Partner Portal(F132)에 통합:
   - Affiliate: referral link 기반 tracking (partner_referrals)
   - Reseller: tier='reseller'인 파트너에게 대량 할인 코드 발급 (향후)

【F136 Training Program A】
1. /learn 페이지 확장:
   - Getting Started Guide (step-by-step)
   - API Reference Quick Tour
   - Video Tutorials (F130)
   - "POTAL Certified" badge 소개 (향후)

【F137 Certification Program A】
1. /certification 페이지:
   - 프로그램 소개: "POTAL Certified Trade Compliance Professional"
   - "Coming Soon" + 이메일 대기 목록 폼
   - certification_waitlist 테이블: email, name, company, signed_up_at

【F141 Product Tour A】
1. 대시보드 최초 로그인 시 Tour 표시:
   - react-joyride 또는 shepherd.js 설치
   - 5-step tour: Welcome → API Key → Calculator → Docs → Support
   - "다시 보지 않기" 체크박스 → localStorage 또는 user_preferences

【F144 Sentiment Analysis — Skip (Post-customer)】
【F145 A/B Testing — Skip (Post-customer)】

npm run build 통과 확인. 에러 있으면 수정 후 다시 빌드.
전체 Sprint 1-4 완료 후:
git add -A && git commit -m "Sprint 1-4: S-Grade upgrade - all 142 features A+ or above" 
→ Mac 터미널에서 git push
