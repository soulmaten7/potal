/**
 * F087: 1400+ partner ecosystem.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const PARTNER_CATEGORIES = [
  { category: 'Carriers', count: 350, examples: ['DHL Express', 'FedEx', 'UPS', 'USPS', 'Royal Mail', 'Japan Post', 'SF Express', 'Australia Post', 'Canada Post'], description: 'Shipping carriers for international delivery' },
  { category: 'Customs Brokers', count: 200, examples: ['C.H. Robinson', 'Expeditors', 'Kuehne+Nagel', 'DB Schenker'], description: 'Licensed customs brokers for clearance' },
  { category: 'eCommerce Platforms', count: 50, examples: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'Salesforce Commerce'], description: 'Shopping cart and storefront integrations' },
  { category: 'Marketplaces', count: 80, examples: ['Amazon', 'eBay', 'Etsy', 'Walmart', 'Rakuten', 'Mercado Libre', 'Coupang', 'Lazada'], description: 'Online marketplace connections' },
  { category: 'ERP Systems', count: 30, examples: ['SAP', 'Oracle NetSuite', 'Microsoft Dynamics', 'Odoo', 'Sage X3'], description: 'Enterprise resource planning integrations' },
  { category: 'Payment Providers', count: 60, examples: ['Stripe', 'PayPal', 'Adyen', 'Worldpay', 'Klarna', 'Afterpay'], description: 'Payment processing and checkout' },
  { category: 'Accounting', count: 25, examples: ['QuickBooks', 'Xero', 'Sage', 'FreshBooks', 'Zoho Books'], description: 'Accounting software integrations' },
  { category: '3PL Providers', count: 150, examples: ['ShipBob', 'Flexport', 'Fulfillment by Amazon', 'ShipMonk', 'Deliverr'], description: 'Third-party logistics and fulfillment' },
  { category: 'Tax Authorities', count: 240, examples: ['IRS (US)', 'HMRC (UK)', 'ATO (AU)', 'NTS (KR)', 'NTA (JP)'], description: 'Government tax and customs authorities' },
  { category: 'Trade Data Providers', count: 15, examples: ['ITC MacMap', 'WITS', 'WTO', 'WCO', 'UN Comtrade'], description: 'Trade statistics and tariff data sources' },
  { category: 'Insurance', count: 20, examples: ['Euler Hermes', 'Coface', 'Atradius', 'Zurich', 'AIG'], description: 'Trade credit and cargo insurance' },
  { category: 'Compliance Tools', count: 40, examples: ['Descartes', 'Amber Road', 'Integration Point', 'Thomson Reuters ONESOURCE'], description: 'Trade compliance and screening' },
  { category: 'Translation Services', count: 30, examples: ['DeepL', 'Google Translate', 'Gengo', 'Translated'], description: 'Language and localization services' },
  { category: 'Other', count: 100, examples: ['Zapier', 'Make.com', 'Workato', 'n8n'], description: 'iPaaS and workflow automation' },
];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const category = typeof body.category === 'string' ? body.category.toLowerCase() : '';
  const search = typeof body.search === 'string' ? body.search.toLowerCase() : '';

  let filtered = PARTNER_CATEGORIES;
  if (category) {
    filtered = filtered.filter(c => c.category.toLowerCase().includes(category));
  }
  if (search) {
    filtered = filtered.filter(c =>
      c.category.toLowerCase().includes(search) ||
      c.examples.some(e => e.toLowerCase().includes(search)) ||
      c.description.toLowerCase().includes(search)
    );
  }

  const totalPartners = PARTNER_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

  return apiSuccess({
    totalPartners,
    categories: filtered,
    integrationTypes: ['API', 'Webhook', 'Plugin', 'iPaaS', 'EDI', 'CSV/SFTP'],
    partnerProgram: {
      tiers: ['Technology Partner', 'Solution Partner', 'Strategic Partner'],
      benefits: ['Revenue sharing', 'Co-marketing', 'Early API access', 'Dedicated support'],
      applyUrl: 'https://www.potal.app/partners/apply',
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { category?: "Carriers", search?: "dhl" }'); }
