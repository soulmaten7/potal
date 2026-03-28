export type FeatureStatus = 'active' | 'coming_soon';
export type FeaturePriority = 'MUST' | 'SHOULD';
export type FeatureCategory =
  | 'Core'
  | 'Trade'
  | 'Tax'
  | 'Platform'
  | 'Integration'
  | 'Shipping'
  | 'Security'
  | 'Legal'
  | 'Web'
  | 'Support'
  | 'Business'
  | 'Marketing';

export interface Feature {
  id: string;
  name: string;
  category: FeatureCategory;
  priority: FeaturePriority;
  status: FeatureStatus;
  description: string;
  apiEndpoint?: string;
}

export const CATEGORY_ICONS: Record<FeatureCategory, string> = {
  Core: '\u2699\ufe0f',
  Trade: '\ud83c\udf10',
  Tax: '\ud83d\udcb0',
  Platform: '\ud83d\udee0\ufe0f',
  Integration: '\ud83d\udd17',
  Shipping: '\ud83d\ude9a',
  Security: '\ud83d\udd12',
  Legal: '\ud83d\udccb',
  Web: '\ud83c\udf10',
  Support: '\ud83d\udcac',
  Business: '\ud83d\udcbc',
  Marketing: '\ud83d\udce3',
};

export const FEATURES: Feature[] = [
  // ─── Core Engine (15) ──────────────────────────────
  { id: 'F001', name: 'HS Code Classification', category: 'Core', priority: 'MUST', status: 'active', description: 'Classify products into 5,000+ HS codes using the v3.3 GRI pipeline', apiEndpoint: '/api/v1/classify' },
  { id: 'F002', name: 'Duty Rate Calculation', category: 'Core', priority: 'MUST', status: 'active', description: 'Look up MFN, MIN, and AGR duty rates for 240 countries', apiEndpoint: '/api/v1/calculate' },
  { id: 'F003', name: 'Tax Calculation (VAT/GST)', category: 'Core', priority: 'MUST', status: 'active', description: 'Calculate VAT, GST, and sales tax for 240 countries and territories', apiEndpoint: '/api/v1/calculate' },
  { id: 'F004', name: 'Total Landed Cost', category: 'Core', priority: 'MUST', status: 'active', description: 'Get the full import cost including duties, taxes, fees, and shipping', apiEndpoint: '/api/v1/calculate' },
  { id: 'F006', name: 'Confidence Score', category: 'Core', priority: 'MUST', status: 'active', description: 'Multi-dimensional confidence scoring for every classification result', apiEndpoint: '/api/v1/classify' },
  { id: 'F007', name: 'Multi-country Support', category: 'Core', priority: 'MUST', status: 'active', description: 'Full coverage across 240 countries with localized tax rules', apiEndpoint: '/api/v1/countries' },
  { id: 'F008', name: 'Audit Trail', category: 'Core', priority: 'MUST', status: 'active', description: 'Complete classification history with decision path and rules applied', apiEndpoint: '/api/v1/classify' },
  { id: 'F009', name: 'Batch Classification', category: 'Core', priority: 'MUST', status: 'active', description: 'Classify hundreds of products at once via CSV or JSON batch API', apiEndpoint: '/api/v1/classify/batch' },
  { id: 'F010', name: 'Image Classification', category: 'Core', priority: 'MUST', status: 'active', description: 'Classify products from photos using AI vision analysis', apiEndpoint: '/api/v1/classify' },
  { id: 'F011', name: 'Currency Conversion', category: 'Core', priority: 'MUST', status: 'active', description: 'Real-time exchange rates with daily auto-updates for 160+ currencies', apiEndpoint: '/api/v1/exchange-rate' },
  { id: 'F012', name: 'HS Code Validation', category: 'Core', priority: 'MUST', status: 'active', description: '9-field input validation ensuring accurate classification inputs', apiEndpoint: '/api/v1/classify' },
  { id: 'F013', name: 'De Minimis Check', category: 'Core', priority: 'MUST', status: 'active', description: 'Automatically check if shipment value falls below duty-free threshold', apiEndpoint: '/api/v1/calculate' },
  { id: 'F014', name: 'Restricted Items', category: 'Core', priority: 'MUST', status: 'active', description: 'Screen products against import restrictions and prohibited item lists', apiEndpoint: '/api/v1/restrictions' },
  { id: 'F015', name: 'Price Break Rules', category: 'Core', priority: 'MUST', status: 'active', description: 'Apply "valued over/under $X" rules from government tariff schedules', apiEndpoint: '/api/v1/classify' },
  { id: 'F016', name: 'Origin Detection', category: 'Core', priority: 'MUST', status: 'active', description: 'Detect country of origin from product description and brand analysis', apiEndpoint: '/api/v1/classify' },

  // ─── Trade Compliance (21) ─────────────────────────
  { id: 'F017', name: 'FTA Detection', category: 'Trade', priority: 'MUST', status: 'active', description: 'Identify applicable Free Trade Agreements across 63 FTAs', apiEndpoint: '/api/v1/fta' },
  { id: 'F018', name: 'Rules of Origin', category: 'Trade', priority: 'MUST', status: 'active', description: 'Verify preferential origin eligibility with certificate requirements', apiEndpoint: '/api/v1/fta' },
  { id: 'F019', name: 'Preferential Rates', category: 'Trade', priority: 'MUST', status: 'active', description: 'Apply reduced FTA duty rates when origin rules are satisfied', apiEndpoint: '/api/v1/fta' },
  { id: 'F020', name: 'Anti-dumping Duties', category: 'Trade', priority: 'MUST', status: 'active', description: 'Check 119K+ trade remedy cases for anti-dumping duty exposure', apiEndpoint: '/api/v1/calculate' },
  { id: 'F021', name: 'Countervailing Duties', category: 'Trade', priority: 'MUST', status: 'active', description: 'Identify countervailing (subsidy) duty risks on imports', apiEndpoint: '/api/v1/calculate' },
  { id: 'F022', name: 'Safeguard Measures', category: 'Trade', priority: 'MUST', status: 'active', description: 'Apply safeguard tariffs and exemptions from 15K+ records', apiEndpoint: '/api/v1/calculate' },
  { id: 'F023', name: 'Sanctions Screening', category: 'Trade', priority: 'MUST', status: 'active', description: 'Screen against OFAC SDN, BIS Entity List, and 19 global sources', apiEndpoint: '/api/v1/screening' },
  { id: 'F024', name: 'Denied Party Screening', category: 'Trade', priority: 'MUST', status: 'active', description: 'Check 21K+ denied party entries with fuzzy name matching', apiEndpoint: '/api/v1/screening' },
  { id: 'F025', name: 'Export Controls', category: 'Trade', priority: 'MUST', status: 'active', description: 'EAR/ITAR export control classification and license determination', apiEndpoint: '/api/v1/export-controls/classify' },
  { id: 'F026', name: 'ECCN Classification', category: 'Trade', priority: 'MUST', status: 'active', description: 'Classify products into Export Control Classification Numbers', apiEndpoint: '/api/v1/classify/eccn' },
  { id: 'F027', name: 'Dangerous Goods Flag', category: 'Trade', priority: 'MUST', status: 'active', description: 'Flag hazardous materials and dangerous goods restrictions', apiEndpoint: '/api/v1/restrictions' },
  { id: 'F028', name: 'Country Prohibitions', category: 'Trade', priority: 'MUST', status: 'active', description: 'Enforce country-specific import bans and product restrictions', apiEndpoint: '/api/v1/restrictions' },
  { id: 'F029', name: 'Dual-use Goods', category: 'Trade', priority: 'MUST', status: 'active', description: 'Identify dual-use items requiring export authorization', apiEndpoint: '/api/v1/compliance/export-controls' },
  { id: 'F030', name: 'Trade Embargo Check', category: 'Trade', priority: 'MUST', status: 'active', description: 'Verify trade routes against comprehensive embargo lists', apiEndpoint: '/api/v1/screening' },
  { id: 'F031', name: 'Customs Documentation', category: 'Trade', priority: 'MUST', status: 'active', description: 'Generate commercial invoices, packing lists, and certificates', apiEndpoint: '/api/v1/customs-docs/generate' },
  { id: 'F032', name: 'ICS2 Pre-arrival', category: 'Trade', priority: 'MUST', status: 'active', description: 'EU ICS2 pre-arrival safety and security declaration support', apiEndpoint: '/api/v1/ics2' },
  { id: 'F033', name: 'IOSS Support', category: 'Trade', priority: 'MUST', status: 'active', description: 'EU Import One-Stop Shop VAT collection and reporting', apiEndpoint: '/api/v1/calculate' },
  { id: 'F034', name: 'Type 86 Entry', category: 'Trade', priority: 'MUST', status: 'active', description: 'US Type 86 simplified customs entry for low-value shipments', apiEndpoint: '/api/v1/customs/type86' },
  { id: 'F040', name: 'Pre-shipment Check', category: 'Trade', priority: 'MUST', status: 'active', description: 'Comprehensive screening before shipping: cost + compliance', apiEndpoint: '/api/v1/verify/pre-shipment' },
  { id: 'F043', name: 'Customs Forms', category: 'Trade', priority: 'MUST', status: 'active', description: 'Auto-generate CN22, CN23, and customs declaration forms', apiEndpoint: '/api/v1/customs-docs/generate' },
  { id: 'F111', name: 'Compliance Certificates', category: 'Trade', priority: 'SHOULD', status: 'active', description: 'Generate compliance and origin certificates for customs clearance' },

  // ─── Tax (7) ───────────────────────────────────────
  { id: 'F053', name: 'Tax Exemptions', category: 'Tax', priority: 'MUST', status: 'active', description: 'Manage and apply tax exemption certificates per jurisdiction', apiEndpoint: '/api/v1/tax/exemption' },
  { id: 'F054', name: 'Sub-national Tax', category: 'Tax', priority: 'MUST', status: 'active', description: 'Calculate state, province, and regional tax rates accurately', apiEndpoint: '/api/v1/tax/us-sales-tax' },
  { id: 'F055', name: 'Digital Services Tax', category: 'Tax', priority: 'MUST', status: 'active', description: 'Apply DST rates for digital goods and services across jurisdictions', apiEndpoint: '/api/v1/tax/digital-services' },
  { id: 'F056', name: 'US State Sales Tax', category: 'Tax', priority: 'SHOULD', status: 'active', description: 'ZIP-level US sales tax with nexus rules and marketplace facilitator', apiEndpoint: '/api/v1/tax/us-sales-tax' },
  { id: 'F057', name: 'Specialized Tax', category: 'Tax', priority: 'SHOULD', status: 'active', description: 'Telecom, lodging, and 12 country-specific tax calculations', apiEndpoint: '/api/v1/tax/specialized' },
  { id: 'F058', name: 'VAT Registration', category: 'Tax', priority: 'SHOULD', status: 'active', description: 'Verify VAT registration numbers and validate tax IDs', apiEndpoint: '/api/v1/tax/vat-registration' },
  { id: 'F059', name: 'E-Invoice', category: 'Tax', priority: 'SHOULD', status: 'active', description: 'Generate compliant e-invoices for jurisdictions requiring them', apiEndpoint: '/api/v1/invoicing/e-invoice' },

  // ─── Platform (43) ─────────────────────────────────
  { id: 'F035', name: 'Multi-language UI', category: 'Platform', priority: 'MUST', status: 'active', description: 'Full interface localization in 50 languages' },
  { id: 'F036', name: 'REST API', category: 'Platform', priority: 'MUST', status: 'active', description: '155+ API endpoints with consistent JSON responses' },
  { id: 'F037', name: 'API Key Auth', category: 'Platform', priority: 'MUST', status: 'active', description: 'Secure API key authentication with scope-based permissions' },
  { id: 'F038', name: 'Rate Limiting', category: 'Platform', priority: 'MUST', status: 'active', description: 'Intelligent rate limiting with per-plan quotas and burst support' },
  { id: 'F039', name: 'Webhooks', category: 'Platform', priority: 'MUST', status: 'active', description: 'Real-time event notifications with configurable endpoints', apiEndpoint: '/api/v1/webhooks' },
  { id: 'F041', name: 'Dashboard', category: 'Platform', priority: 'MUST', status: 'active', description: 'Full-featured admin dashboard with usage analytics and tools' },
  { id: 'F042', name: 'Usage Analytics', category: 'Platform', priority: 'MUST', status: 'active', description: 'Track API usage, classification history, and cost analytics', apiEndpoint: '/api/v1/admin/usage' },
  { id: 'F044', name: 'Multi-currency', category: 'Platform', priority: 'MUST', status: 'active', description: 'Display costs in any currency with real-time conversion', apiEndpoint: '/api/v1/calculate' },
  { id: 'F071', name: 'White-label Widget', category: 'Platform', priority: 'MUST', status: 'active', description: 'Customizable widget that matches your brand colors and style', apiEndpoint: '/api/v1/whitelabel/config' },
  { id: 'F072', name: 'Custom Branding', category: 'Platform', priority: 'MUST', status: 'active', description: 'Apply your logo, colors, and fonts to all customer-facing elements', apiEndpoint: '/api/v1/branding' },
  { id: 'F078', name: 'Batch Import/Export', category: 'Platform', priority: 'MUST', status: 'active', description: 'Bulk import products via CSV and export results in any format', apiEndpoint: '/api/v1/classify/batch' },
  { id: 'F079', name: 'Scheduled Reports', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Automate daily, weekly, or monthly report generation', apiEndpoint: '/api/v1/reports/schedule' },
  { id: 'F080', name: 'Custom Reports', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Build custom reports with flexible filters and visualizations' },
  { id: 'F081', name: 'Data Visualization', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Interactive charts for duty rates, classifications, and trends' },
  { id: 'F086', name: 'Email Notifications', category: 'Platform', priority: 'MUST', status: 'active', description: 'Automated email alerts for rate changes, compliance, and usage' },
  { id: 'F087', name: 'In-app Notifications', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Real-time notification bell with read/unread status tracking', apiEndpoint: '/api/v1/notifications' },
  { id: 'F088', name: 'User Management', category: 'Platform', priority: 'MUST', status: 'active', description: 'Full user lifecycle management with Supabase Auth integration' },
  { id: 'F089', name: 'Role-based Access', category: 'Platform', priority: 'MUST', status: 'active', description: 'RBAC with admin, manager, analyst, and viewer roles' },
  { id: 'F090', name: 'Team Management', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Invite team members, assign roles, and manage permissions', apiEndpoint: '/api/v1/team' },
  { id: 'F091', name: 'API Documentation', category: 'Platform', priority: 'MUST', status: 'active', description: 'Interactive API docs with code examples in 5 languages' },
  { id: 'F092', name: 'Sandbox Environment', category: 'Platform', priority: 'MUST', status: 'active', description: 'Test API calls in sandbox mode without affecting production data' },
  { id: 'F093', name: 'Rate Monitoring', category: 'Platform', priority: 'MUST', status: 'active', description: 'Monitor tariff rate changes with automated government data sync', apiEndpoint: '/api/v1/admin/rate-monitor' },
  { id: 'F094', name: 'SLA Dashboard', category: 'Platform', priority: 'MUST', status: 'active', description: 'Real-time SLA metrics including uptime, latency, and error rates', apiEndpoint: '/api/v1/admin/sla' },
  { id: 'F095', name: 'High Throughput', category: 'Platform', priority: 'MUST', status: 'active', description: '117K pre-computed results for sub-50ms response times', apiEndpoint: '/api/v1/calculate' },
  { id: 'F096', name: 'Webhook Retry', category: 'Platform', priority: 'MUST', status: 'active', description: 'Automatic webhook retry with exponential backoff on failure', apiEndpoint: '/api/v1/webhooks' },
  { id: 'F097', name: 'Error Handling', category: 'Platform', priority: 'MUST', status: 'active', description: 'Structured error responses with codes, messages, and doc links' },
  { id: 'F098', name: 'Versioned API', category: 'Platform', priority: 'MUST', status: 'active', description: 'Stable v1 API with backward-compatible versioning strategy' },
  { id: 'F099', name: 'OpenAPI Spec', category: 'Platform', priority: 'MUST', status: 'active', description: 'Full OpenAPI 3.0 specification for automated client generation', apiEndpoint: '/api/v1/docs' },
  { id: 'F100', name: 'Status Page', category: 'Platform', priority: 'MUST', status: 'active', description: 'Public health check endpoint with service status monitoring', apiEndpoint: '/api/v1/health' },
  { id: 'F101', name: 'Uptime Monitoring', category: 'Platform', priority: 'MUST', status: 'active', description: 'Automated uptime checks every 6 hours via Vercel Cron' },
  { id: 'F102', name: 'Incident Response', category: 'Platform', priority: 'MUST', status: 'active', description: 'Automated escalation flow with Telegram alerts for incidents' },
  { id: 'F109', name: 'CSV Export', category: 'Platform', priority: 'MUST', status: 'active', description: 'Export classification and calculation results as CSV files', apiEndpoint: '/api/v1/calculate/csv' },
  { id: 'F110', name: 'PDF Reports', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Generate PDF trade documents: invoices, packing lists, certificates', apiEndpoint: '/api/v1/documents/pdf' },
  { id: 'F112', name: 'Multi-tenant', category: 'Platform', priority: 'MUST', status: 'active', description: 'Full multi-tenancy with row-level security data isolation' },
  { id: 'F113', name: 'SSO Support', category: 'Platform', priority: 'MUST', status: 'active', description: 'Single sign-on via Supabase Auth with OAuth providers' },
  { id: 'F114', name: 'Audit Logging', category: 'Platform', priority: 'MUST', status: 'active', description: 'Every API call and classification logged with full traceability', apiEndpoint: '/api/v1/classify' },
  { id: 'F115', name: 'Data Retention', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Configurable data retention policies per plan tier' },
  { id: 'F128', name: 'API Changelog', category: 'Platform', priority: 'MUST', status: 'active', description: 'Detailed changelog for every API version and breaking change' },
  { id: 'F129', name: 'Migration Guide', category: 'Platform', priority: 'MUST', status: 'active', description: 'Step-by-step guides for migrating from competitor platforms' },
  { id: 'F140', name: 'Onboarding Wizard', category: 'Platform', priority: 'MUST', status: 'active', description: 'Guided setup wizard for new users with API key generation' },
  { id: 'F141', name: 'Product Tour', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Interactive walkthrough highlighting key platform features' },
  { id: 'F145', name: 'A/B Testing', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Built-in A/B testing framework for feature experiments' },
  { id: 'F146', name: 'Feature Flags', category: 'Platform', priority: 'SHOULD', status: 'active', description: 'Toggle features on/off per tenant without deployments' },

  // ─── Integration (14) ──────────────────────────────
  { id: 'F045', name: 'Shopify App', category: 'Integration', priority: 'MUST', status: 'active', description: 'Native Shopify Theme App Extension with one-click install' },
  { id: 'F046', name: 'WooCommerce Plugin', category: 'Integration', priority: 'MUST', status: 'active', description: 'WordPress/WooCommerce plugin for automatic landed cost display' },
  { id: 'F047', name: 'BigCommerce Plugin', category: 'Integration', priority: 'MUST', status: 'active', description: 'BigCommerce integration for storefront landed cost calculations' },
  { id: 'F048', name: 'Magento Module', category: 'Integration', priority: 'MUST', status: 'active', description: 'Full Magento 2 module with checkout and admin integration' },
  { id: 'F049', name: 'JS Widget', category: 'Integration', priority: 'MUST', status: 'active', description: 'Drop-in JavaScript widget for any website or checkout page' },
  { id: 'F050', name: 'SDK (JavaScript)', category: 'Integration', priority: 'MUST', status: 'active', description: 'Official JavaScript/TypeScript SDK published on npm' },
  { id: 'F051', name: 'SDK (Python)', category: 'Integration', priority: 'MUST', status: 'active', description: 'Official Python SDK with sync and async client support' },
  { id: 'F052', name: 'SDK (cURL)', category: 'Integration', priority: 'MUST', status: 'active', description: 'Comprehensive cURL examples and shell script snippets' },
  { id: 'F073', name: 'Checkout Integration', category: 'Integration', priority: 'MUST', status: 'active', description: 'DDP/DDU checkout flow with fraud detection and session management', apiEndpoint: '/api/v1/checkout' },
  { id: 'F074', name: 'Order Sync', category: 'Integration', priority: 'SHOULD', status: 'active', description: 'Bi-directional order synchronization with e-commerce platforms', apiEndpoint: '/api/v1/orders/sync' },
  { id: 'F075', name: 'Inventory Sync', category: 'Integration', priority: 'SHOULD', status: 'active', description: 'Real-time inventory level synchronization across warehouses', apiEndpoint: '/api/v1/inventory/levels' },
  { id: 'F082', name: 'Marketplace Connect', category: 'Integration', priority: 'SHOULD', status: 'active', description: 'Connect Amazon, eBay, Etsy and other marketplaces via OAuth', apiEndpoint: '/api/v1/integrations/marketplace' },
  { id: 'F083', name: 'ERP Integration', category: 'Integration', priority: 'SHOULD', status: 'active', description: 'SAP, Oracle, NetSuite, and 5 more ERP connectors with encryption', apiEndpoint: '/api/v1/integrations/erp' },
  { id: 'F084', name: 'Accounting Integration', category: 'Integration', priority: 'SHOULD', status: 'active', description: 'QuickBooks, Xero, Sage, and FreshBooks duty/tax data sync', apiEndpoint: '/api/v1/integrations/accounting' },

  // ─── Shipping (11) ─────────────────────────────────
  { id: 'F060', name: 'Shipping Rates', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Compare rates across 8 carriers including DHL, FedEx, UPS', apiEndpoint: '/api/v1/shipping/rates' },
  { id: 'F061', name: 'Carrier Integration', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Live carrier API connections for real-time rate quotes' },
  { id: 'F062', name: 'Label Generation', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Generate 4x6 shipping labels as PDF with barcodes', apiEndpoint: '/api/v1/shipping/labels' },
  { id: 'F063', name: 'Tracking', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Real-time shipment tracking with carrier event integration' },
  { id: 'F064', name: 'DDP Quote', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Compare DDP vs DDU costs with itemized fee breakdown', apiEndpoint: '/api/v1/calculate/ddp-vs-ddu' },
  { id: 'F065', name: 'Dimensional Weight', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Calculate dimensional weight for accurate shipping cost estimates' },
  { id: 'F066', name: 'Insurance Calc', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Shipping insurance cost estimation based on declared value' },
  { id: 'F067', name: 'Returns Management', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Cross-border returns with duty drawback calculations', apiEndpoint: '/api/v1/returns/process' },
  { id: 'F068', name: 'Multi-package', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Split shipments across multiple packages with cost optimization' },
  { id: 'F069', name: '3PL Integration', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Connect ShipBob, Amazon FBA, and other fulfillment providers' },
  { id: 'F070', name: 'Multi-warehouse', category: 'Shipping', priority: 'SHOULD', status: 'active', description: 'Manage inventory across multiple warehouse locations' },

  // ─── Security (5) ──────────────────────────────────
  { id: 'F121', name: 'Data Encryption', category: 'Security', priority: 'MUST', status: 'active', description: 'AES-256 encryption at rest and TLS 1.3 in transit' },
  { id: 'F122', name: 'Access Control', category: 'Security', priority: 'MUST', status: 'active', description: 'Granular API key scopes with row-level security enforcement' },
  { id: 'F123', name: 'Security Headers', category: 'Security', priority: 'MUST', status: 'active', description: 'CSP, HSTS, X-Frame-Options, and OWASP-compliant headers' },
  { id: 'F124', name: 'Vulnerability Scanning', category: 'Security', priority: 'MUST', status: 'active', description: 'Automated dependency scanning and security audits' },
  { id: 'F125', name: 'Penetration Testing', category: 'Security', priority: 'MUST', status: 'active', description: 'Regular security assessments with documented test results' },

  // ─── Legal (6) ─────────────────────────────────────
  { id: 'F116', name: 'GDPR Compliance', category: 'Legal', priority: 'MUST', status: 'active', description: 'Full GDPR compliance with data export and deletion rights' },
  { id: 'F117', name: 'CCPA Compliance', category: 'Legal', priority: 'MUST', status: 'active', description: 'California Consumer Privacy Act compliance and disclosures' },
  { id: 'F118', name: 'Terms of Service', category: 'Legal', priority: 'MUST', status: 'active', description: 'Comprehensive terms of service for API and platform usage' },
  { id: 'F119', name: 'Privacy Policy', category: 'Legal', priority: 'MUST', status: 'active', description: 'Transparent privacy policy covering all data processing' },
  { id: 'F120', name: 'Cookie Consent', category: 'Legal', priority: 'MUST', status: 'active', description: 'Cookie consent banner compliant with EU ePrivacy Directive' },
  { id: 'F126', name: 'Compliance Reports', category: 'Legal', priority: 'SHOULD', status: 'active', description: 'Generate compliance audit reports for internal and external use', apiEndpoint: '/api/v1/reports/compliance-audit' },

  // ─── Web (4) ─���─────────────────────────────────────
  { id: 'F104', name: 'Landing Page', category: 'Web', priority: 'MUST', status: 'active', description: 'High-converting landing page with interactive cost calculator' },
  { id: 'F105', name: 'Pricing Page', category: 'Web', priority: 'MUST', status: 'active', description: 'Transparent pricing with plan comparison and annual discount' },
  { id: 'F106', name: 'Blog', category: 'Web', priority: 'SHOULD', status: 'active', description: 'SEO-optimized blog with cross-border commerce guides' },
  { id: 'F107', name: 'SEO Optimization', category: 'Web', priority: 'SHOULD', status: 'active', description: 'Dynamic sitemap, Open Graph, and structured data for search' },

  // ─── Support (8) ───────────────────────────────────
  { id: 'F127', name: 'Knowledge Base', category: 'Support', priority: 'MUST', status: 'active', description: 'Comprehensive FAQ and help center with search functionality' },
  { id: 'F130', name: 'Video Tutorials', category: 'Support', priority: 'SHOULD', status: 'active', description: 'Step-by-step video guides for API integration and setup' },
  { id: 'F131', name: 'Community Forum', category: 'Support', priority: 'SHOULD', status: 'active', description: 'Developer community on GitHub Discussions and Discord' },
  { id: 'F136', name: 'Training Program', category: 'Support', priority: 'SHOULD', status: 'active', description: 'Structured training courses for customs and API usage' },
  { id: 'F137', name: 'Certification', category: 'Support', priority: 'SHOULD', status: 'active', description: 'Professional certification program for customs specialists' },
  { id: 'F138', name: 'Customer Success', category: 'Support', priority: 'SHOULD', status: 'active', description: 'Dedicated customer success manager for Enterprise plans', apiEndpoint: '/api/v1/account/csm' },
  { id: 'F143', name: 'AI Chatbot', category: 'Support', priority: 'SHOULD', status: 'active', description: 'AI-powered support chatbot with Crisp live chat integration', apiEndpoint: '/api/v1/support/chat' },
  { id: 'F144', name: 'Sentiment Analysis', category: 'Support', priority: 'SHOULD', status: 'active', description: 'Analyze customer feedback sentiment for proactive support' },

  // ─── Business (5) ──────────────────────────────────
  { id: 'F132', name: 'Partner Portal', category: 'Business', priority: 'SHOULD', status: 'active', description: 'Self-service partner dashboard with revenue sharing analytics', apiEndpoint: '/api/v1/partners' },
  { id: 'F133', name: 'Referral Program', category: 'Business', priority: 'SHOULD', status: 'active', description: 'Customer referral tracking with automated reward payouts' },
  { id: 'F134', name: 'Affiliate System', category: 'Business', priority: 'SHOULD', status: 'active', description: 'Affiliate marketing program with tracking links and commissions' },
  { id: 'F135', name: 'Reseller Program', category: 'Business', priority: 'SHOULD', status: 'active', description: 'White-label reseller program with custom pricing tiers' },
  { id: 'F147', name: 'Partner Ecosystem', category: 'Business', priority: 'MUST', status: 'active', description: '1,400+ potential partners across logistics and e-commerce', apiEndpoint: '/api/v1/partners' },

  // ─── Marketing (1) ─────────────────────────────────
  { id: 'F142', name: 'Email Campaigns', category: 'Marketing', priority: 'SHOULD', status: 'active', description: 'Automated welcome emails and engagement campaign workflows' },
];

export const CATEGORIES: { key: FeatureCategory | 'All'; label: string; count: number }[] = [
  { key: 'All', label: 'All', count: FEATURES.length },
  { key: 'Core', label: 'Core Engine', count: FEATURES.filter(f => f.category === 'Core').length },
  { key: 'Trade', label: 'Trade Compliance', count: FEATURES.filter(f => f.category === 'Trade').length },
  { key: 'Tax', label: 'Tax', count: FEATURES.filter(f => f.category === 'Tax').length },
  { key: 'Platform', label: 'Platform', count: FEATURES.filter(f => f.category === 'Platform').length },
  { key: 'Integration', label: 'Integration', count: FEATURES.filter(f => f.category === 'Integration').length },
  { key: 'Shipping', label: 'Shipping', count: FEATURES.filter(f => f.category === 'Shipping').length },
  { key: 'Security', label: 'Security', count: FEATURES.filter(f => f.category === 'Security').length },
  { key: 'Legal', label: 'Legal', count: FEATURES.filter(f => f.category === 'Legal').length },
  { key: 'Web', label: 'Web', count: FEATURES.filter(f => f.category === 'Web').length },
  { key: 'Support', label: 'Support', count: FEATURES.filter(f => f.category === 'Support').length },
  { key: 'Business', label: 'Business', count: FEATURES.filter(f => f.category === 'Business').length },
  { key: 'Marketing', label: 'Marketing', count: FEATURES.filter(f => f.category === 'Marketing').length },
];
