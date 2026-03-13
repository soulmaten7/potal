/**
 * F144: International marketplace exposure.
 * F145: Marketing feed generation.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const INTERNATIONAL_MARKETPLACES = [
  { id: 'amazon_us', name: 'Amazon US', country: 'US', url: 'amazon.com', category: 'General' },
  { id: 'amazon_uk', name: 'Amazon UK', country: 'GB', url: 'amazon.co.uk', category: 'General' },
  { id: 'amazon_de', name: 'Amazon DE', country: 'DE', url: 'amazon.de', category: 'General' },
  { id: 'amazon_jp', name: 'Amazon JP', country: 'JP', url: 'amazon.co.jp', category: 'General' },
  { id: 'ebay', name: 'eBay Global', country: 'US', url: 'ebay.com', category: 'General' },
  { id: 'etsy', name: 'Etsy', country: 'US', url: 'etsy.com', category: 'Handmade/Vintage' },
  { id: 'rakuten', name: 'Rakuten', country: 'JP', url: 'rakuten.co.jp', category: 'General' },
  { id: 'coupang', name: 'Coupang', country: 'KR', url: 'coupang.com', category: 'General' },
  { id: 'mercado_libre', name: 'Mercado Libre', country: 'MX', url: 'mercadolibre.com', category: 'General (LATAM)' },
  { id: 'lazada', name: 'Lazada', country: 'SG', url: 'lazada.com', category: 'General (SEA)' },
  { id: 'shopee', name: 'Shopee', country: 'SG', url: 'shopee.com', category: 'General (SEA)' },
  { id: 'allegro', name: 'Allegro', country: 'PL', url: 'allegro.pl', category: 'General (CEE)' },
  { id: 'bol', name: 'Bol.com', country: 'NL', url: 'bol.com', category: 'General (Benelux)' },
  { id: 'cdiscount', name: 'Cdiscount', country: 'FR', url: 'cdiscount.com', category: 'General' },
  { id: 'walmart', name: 'Walmart Marketplace', country: 'US', url: 'walmart.com', category: 'General' },
];

const FEED_FORMATS = [
  { id: 'google_shopping', name: 'Google Shopping Feed', format: 'XML/CSV', spec: 'Google Merchant Center' },
  { id: 'facebook_catalog', name: 'Facebook/Meta Product Catalog', format: 'CSV/XML', spec: 'Meta Commerce Manager' },
  { id: 'amazon_feed', name: 'Amazon Product Feed', format: 'XML/TSV', spec: 'Amazon MWS/SP-API' },
  { id: 'tiktok_catalog', name: 'TikTok Product Catalog', format: 'CSV', spec: 'TikTok Shop' },
  { id: 'pinterest_catalog', name: 'Pinterest Product Catalog', format: 'CSV/XML', spec: 'Pinterest for Business' },
  { id: 'bing_shopping', name: 'Bing Shopping Feed', format: 'CSV/XML', spec: 'Microsoft Merchant Center' },
];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'list_marketplaces';

  if (action === 'list_marketplaces') {
    const region = typeof body.region === 'string' ? body.region.toLowerCase() : '';
    let marketplaces = INTERNATIONAL_MARKETPLACES;
    if (region) {
      const regionCountries: Record<string, string[]> = {
        'north_america': ['US', 'CA', 'MX'], 'europe': ['GB', 'DE', 'FR', 'NL', 'PL'],
        'asia': ['JP', 'KR', 'SG'], 'latam': ['MX', 'BR'],
      };
      const countries = regionCountries[region] || [];
      if (countries.length) marketplaces = marketplaces.filter(m => countries.includes(m.country));
    }

    return apiSuccess({
      marketplaces,
      totalMarketplaces: INTERNATIONAL_MARKETPLACES.length,
      potalAdvantage: 'POTAL auto-calculates landed costs for each marketplace, ensuring DDP pricing accuracy across all platforms.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'generate_feed') {
    const feedType = typeof body.feedType === 'string' ? body.feedType : 'google_shopping';
    const targetCountry = typeof body.targetCountry === 'string' ? body.targetCountry.toUpperCase() : '';
    const feed = FEED_FORMATS.find(f => f.id === feedType);
    if (!feed) return apiError(ApiErrorCode.BAD_REQUEST, `Unknown feed type. Available: ${FEED_FORMATS.map(f => f.id).join(', ')}`);

    return apiSuccess({
      feed: { ...feed, targetCountry: targetCountry || 'global' },
      enrichment: {
        landedCost: 'Auto-calculated DDP prices per destination',
        hsCode: 'HS codes added to product data',
        localCurrency: 'Prices converted to local currency',
        compliance: 'Restricted product flags included',
        translations: 'Product titles/descriptions in local language (50 languages)',
      },
      output: {
        format: feed.format,
        downloadUrl: `https://app.potal.app/feeds/${feedType}/download`,
        autoRefresh: 'Daily at 00:00 UTC',
      },
      note: 'Configure products and target markets in Settings > Marketing Feeds.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'list_feeds') {
    return apiSuccess({ feedFormats: FEED_FORMATS }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: list_marketplaces, generate_feed, list_feeds.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "list_marketplaces"|"generate_feed"|"list_feeds", feedType?, targetCountry?, region? }'); }
