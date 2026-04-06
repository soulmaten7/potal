# POTAL 140 Features — 전체 프론트엔드 구현 계획
# 2026-04-06 작성 / 2026-04-06 15:30 KST 전체 완료 ✅

> **전체 5라운드 완료!** 3터미널 병렬 빌드로 ~79 새 페이지 생성, 사이트 총 503페이지.
> Chrome MCP 검증: Tools Hub ✅, DIM Weight 계산 ✅, Dashboard Analytics ✅, API Sandbox ✅

## 터미널 구조
- 터미널1: Opus — Compliance & Screening → Dashboard
- 터미널2: Opus — Tax & Documentation → Integration
- 터미널3: Sonnet — Trade & Classification → Shipping

---

## 라운드 1 ✅ 완료 — app/tools/ 도구 페이지 15개

### 터미널1 (Opus)
1. app/tools/screening/page.tsx — Denied Party + Sanctions (/api/v1/screening)
2. app/tools/export-controls/page.tsx — EAR/ITAR (/api/v1/export-controls/classify)
3. app/tools/embargo/page.tsx — Trade Embargo (/api/v1/screening)
4. app/tools/restrictions/page.tsx — Country Restrictions (/api/v1/restrictions)
5. app/tools/pre-shipment/page.tsx — Pre-shipment Check (/api/v1/verify/pre-shipment)

### 터미널2 (Opus)
1. app/tools/tax/page.tsx — US Sales Tax + Specialized (/api/v1/tax/*)
2. app/tools/customs-docs/page.tsx — Customs Docs (/api/v1/customs-docs/generate)
3. app/tools/ddp-calculator/page.tsx — DDP vs DDU (/api/v1/calculate/ddp-vs-ddu)
4. app/tools/vat-check/page.tsx — VAT Registration (/api/v1/tax/vat-registration)
5. app/tools/shipping/page.tsx — Shipping Rates (/api/v1/shipping/rates)

### 터미널3 (Sonnet)
1. app/tools/fta/page.tsx — FTA Lookup (/api/v1/fta)
2. app/tools/hs-lookup/page.tsx — HS Code Classification (/api/v1/classify)
3. app/tools/compare/page.tsx — Multi-country Compare (/api/v1/calculate)
4. app/tools/batch/page.tsx — Batch Classification (/api/v1/classify/batch)
5. app/tools/currency/page.tsx — Currency Converter (/api/v1/exchange-rate)

---

## 라운드 2 ✅ 완료 — app/tools/ 추가 도구 페이지 15개

### 터미널1 (Opus)
6. app/tools/classify-eccn/page.tsx — ECCN Classification (/api/v1/classify/eccn)
7. app/tools/dual-use/page.tsx — Dual-use Goods (/api/v1/compliance/export-controls)
8. app/tools/ics2/page.tsx — ICS2 Pre-arrival (/api/v1/ics2)
9. app/tools/type86/page.tsx — Type 86 Entry (/api/v1/customs/type86)
10. app/tools/customs-forms/page.tsx — CN22/CN23 Forms (/api/v1/customs-docs/generate)

### 터미널2 (Opus)
6. app/tools/e-invoice/page.tsx — E-Invoice (/api/v1/invoicing/e-invoice)
7. app/tools/digital-tax/page.tsx — Digital Services Tax (/api/v1/tax/digital-services)
8. app/tools/tax-exemptions/page.tsx — Tax Exemptions (/api/v1/tax/exemption)
9. app/tools/label-generation/page.tsx — Shipping Labels (/api/v1/shipping/labels)
10. app/tools/returns/page.tsx — Returns + Duty Drawback (/api/v1/returns/process)

### 터미널3 (Sonnet)
6. app/tools/de-minimis/page.tsx — De Minimis Check (/api/v1/calculate)
7. app/tools/image-classify/page.tsx — Image Classification (/api/v1/classify)
8. app/tools/anti-dumping/page.tsx — Anti-dumping Duties (/api/v1/calculate)
9. app/tools/ioss/page.tsx — IOSS Calculator (/api/v1/calculate)
10. app/tools/compliance-report/page.tsx — Compliance Reports (/api/v1/reports/compliance-audit)

---

## 라운드 3 ✅ 완료 — app/tools/ 나머지 도구 페이지 + 허브 15개

### 터미널1 (Opus)
11. app/tools/pdf-reports/page.tsx — PDF Trade Documents (/api/v1/documents/pdf)
12. app/tools/csv-export/page.tsx — CSV Export (/api/v1/calculate/csv)
13. app/tools/checkout/page.tsx — Checkout Integration Demo (/api/v1/checkout)
14. app/tools/countries/page.tsx — Country Database Browser (/api/v1/countries)
15. app/tools/page.tsx — 도구 허브 (전체 도구 카드 목록 + 카테고리 필터)

### 터미널2 (Opus)
11. app/tools/insurance/page.tsx — Insurance Calc (클라이언트 계산)
12. app/tools/dim-weight/page.tsx — Dimensional Weight (클라이언트 계산)
13. app/tools/certificates/page.tsx — Compliance Certificates
14. app/tools/origin-detection/page.tsx — Origin Detection (/api/v1/classify)
15. app/tools/safeguard/page.tsx — Safeguard Measures (/api/v1/calculate)

### 터미널3 (Sonnet)
11. app/tools/dangerous-goods/page.tsx — Dangerous Goods Flag (/api/v1/restrictions)
12. app/tools/price-break/page.tsx — Price Break Rules (/api/v1/classify)
13. app/tools/audit-trail/page.tsx — Audit Trail Viewer (/api/v1/classify)
14. app/tools/confidence/page.tsx — Confidence Score Demo (/api/v1/classify)
15. app/tools/multi-currency/page.tsx — Multi-currency Display (/api/v1/calculate)

---

## 라운드 4 ✅ 완료 — Dashboard 기능 페이지 18개 (team 기존 유지)

### 터미널1 (Opus)
16. app/dashboard/analytics/page.tsx — Usage Analytics (/api/v1/admin/usage)
17. app/dashboard/webhooks/page.tsx — Webhook Management (/api/v1/webhooks)
18. app/dashboard/team/page.tsx — Team Management (/api/v1/team)
19. app/dashboard/api-keys/page.tsx — API Key Management
20. app/dashboard/notifications/page.tsx — Notifications (/api/v1/notifications)
21. app/dashboard/rate-monitor/page.tsx — Rate Change Monitor (/api/v1/admin/rate-monitor)
22. app/dashboard/sla/page.tsx — SLA Dashboard (/api/v1/admin/sla)

### 터미널2 (Opus)
16. app/dashboard/reports/page.tsx — Custom + Scheduled Reports
17. app/dashboard/branding/page.tsx — White-label + Branding (/api/v1/branding)
18. app/dashboard/widget/page.tsx — Widget Configurator (/api/v1/whitelabel/config)
19. app/dashboard/batch-history/page.tsx — Batch Import/Export History
20. app/dashboard/integrations/page.tsx — ERP/Marketplace/Accounting 연동 관리
21. app/dashboard/orders/page.tsx — Order Sync (/api/v1/orders/sync)
22. app/dashboard/inventory/page.tsx — Inventory Sync (/api/v1/inventory/levels)

### 터미널3 (Sonnet)
16. app/dashboard/visualization/page.tsx — Data Visualization (차트)
17. app/dashboard/status/page.tsx — Status Page (/api/v1/health)
18. app/dashboard/audit-log/page.tsx — Audit Log Viewer
19. app/dashboard/settings/page.tsx — User Settings + Data Retention
20. app/dashboard/onboarding/page.tsx — Onboarding Wizard
21. app/dashboard/partner/page.tsx — Partner Portal (/api/v1/partners)

---

## 라운드 5 ✅ 완료 — 문서/가이드/기존 페이지 개선

### 터미널1 (Opus)
23. app/developers/sdk/page.tsx — SDK 허브 (JS + Python + cURL)
24. app/developers/api-changelog/page.tsx — API Changelog
25. app/developers/migration/page.tsx — Migration Guide (경쟁사별)
26. app/developers/openapi/page.tsx — OpenAPI Spec Viewer
27. app/developers/sandbox/page.tsx — Sandbox Environment

### 터미널2 (Opus)
23. app/learn/page.tsx — Learning Hub (Training Program)
24. app/certification/page.tsx — Certification Program (기존 페이지 개선)
25. app/community/page.tsx — Community Forum Hub
26. app/help/page.tsx — Help Center (Knowledge Base 통합)

### 터미널3 (Sonnet)
22. Integration Coming Soon 페이지 4개 개선 (Shopify, WooCommerce, BigCommerce, Magento)
23. app/features/page.tsx 개선 — 각 기능 카드에서 도구 페이지로 바로 링크
24. 홈페이지 네비게이션에 Tools 메뉴 추가

---

## 건너뛰는 기능 (프론트엔드 UI 불필요 — 인프라/백엔드)
F035 Multi-language (이미 작동), F036 REST API (인프라), F037 API Key Auth (인프라),
F038 Rate Limiting (인프라), F088 User Management (Auth 내장), F089 RBAC (내장),
F091 API Docs (이미 존재), F095 High Throughput (인프라), F096 Webhook Retry (인프라),
F097 Error Handling (인프라), F098 Versioned API (인프라), F100 Status Page → dashboard/status로 이동,
F101 Uptime Monitoring (Cron), F102 Incident Response (Telegram), F112 Multi-tenant (RLS),
F113 SSO (Supabase), F115 Data Retention (설정), F121-F125 Security 5개 (인프라),
F116-F120 Legal 5개 (이미 페이지 존재), F104-F107 Web 4개 (이미 존재),
F145 A/B Testing (내부), F146 Feature Flags (내부)

총 건너뛰기: ~30개 (프론트엔드 변경 불필요)

---

## 요약
- 도구 페이지 (app/tools/): 45개
- 대시보드 페이지 (app/dashboard/): 20개
- 문서/가이드 페이지: 15개
- 기존 페이지 개선: 5개
- 건너뛰기 (인프라): 30개
- Coming Soon: 4개 (플레이스홀더)
- 이미 존재: ~21개

**총 새로 만드는 페이지: ~85개**
**라운드 5까지 = 터미널 3개 × 5라운드 = 완료**
