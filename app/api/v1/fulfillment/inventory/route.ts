/**
 * F135: Inventory sync.
 * F136: 3PL integration.
 * F137: Multi-hub fulfillment.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const FULFILLMENT_HUBS = [
  { id: 'us-east', name: 'US East (NJ)', country: 'US', region: 'North America' },
  { id: 'us-west', name: 'US West (CA)', country: 'US', region: 'North America' },
  { id: 'eu-central', name: 'EU Central (DE)', country: 'DE', region: 'Europe' },
  { id: 'uk', name: 'UK (London)', country: 'GB', region: 'Europe' },
  { id: 'asia-east', name: 'Asia East (CN)', country: 'CN', region: 'Asia Pacific' },
  { id: 'asia-se', name: 'Southeast Asia (SG)', country: 'SG', region: 'Asia Pacific' },
  { id: 'oceania', name: 'Oceania (AU)', country: 'AU', region: 'Oceania' },
  { id: 'latam', name: 'Latin America (MX)', country: 'MX', region: 'Latin America' },
];

const SUPPORTED_3PLS = [
  { id: 'shipbob', name: 'ShipBob', hubs: 8, countries: ['US', 'CA', 'UK', 'AU', 'EU'] },
  { id: 'flexport', name: 'Flexport', hubs: 12, countries: ['US', 'CN', 'DE', 'NL', 'HK'] },
  { id: 'fba', name: 'Fulfillment by Amazon', hubs: 15, countries: ['US', 'CA', 'MX', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU'] },
  { id: 'shipmonk', name: 'ShipMonk', hubs: 4, countries: ['US', 'CA', 'UK', 'MX'] },
  { id: 'deliverr', name: 'Deliverr', hubs: 6, countries: ['US', 'CA'] },
  { id: 'dhl_supply_chain', name: 'DHL Supply Chain', hubs: 20, countries: ['global'] },
];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'overview';

  if (action === 'overview') {
    return apiSuccess({
      inventorySync: {
        status: 'not_configured',
        supportedSources: ['Shopify', 'WooCommerce', 'BigCommerce', 'Custom API', 'CSV upload'],
        syncFrequency: ['real-time', '15min', '1hour', 'daily'],
        features: ['Multi-location inventory', 'Low stock alerts', 'Reorder point automation', 'SKU mapping'],
      },
      thirdPartyLogistics: { providers: SUPPORTED_3PLS },
      fulfillmentHubs: FULFILLMENT_HUBS,
      multiHubRouting: {
        strategies: ['nearest_to_customer', 'lowest_shipping_cost', 'fastest_delivery', 'lowest_duty', 'stock_availability'],
        features: ['Automatic hub selection', 'Split shipment optimization', 'FTZ routing for duty savings', 'Cross-border consolidation'],
      },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'recommend_hub') {
    const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';
    if (!destinationCountry) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" required.');

    const regionMap: Record<string, string> = {
      US: 'us-east', CA: 'us-east', MX: 'us-west', GB: 'uk', DE: 'eu-central', FR: 'eu-central',
      IT: 'eu-central', ES: 'eu-central', NL: 'eu-central', JP: 'asia-east', KR: 'asia-east',
      CN: 'asia-east', SG: 'asia-se', AU: 'oceania', NZ: 'oceania', BR: 'latam',
    };
    const recommendedId = regionMap[destinationCountry] || 'us-east';
    const recommended = FULFILLMENT_HUBS.find(h => h.id === recommendedId) || FULFILLMENT_HUBS[0];

    return apiSuccess({
      destinationCountry,
      recommendedHub: recommended,
      reasoning: `${recommended.name} selected for proximity to ${destinationCountry}, minimizing transit time and shipping costs.`,
      alternatives: FULFILLMENT_HUBS.filter(h => h.id !== recommendedId).slice(0, 3),
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'connect_3pl') {
    const provider = typeof body.provider === 'string' ? body.provider.toLowerCase() : '';
    if (!provider) return apiError(ApiErrorCode.BAD_REQUEST, '"provider" required.');
    const found = SUPPORTED_3PLS.find(p => p.id === provider);
    if (!found) return apiError(ApiErrorCode.BAD_REQUEST, `Unknown provider. Available: ${SUPPORTED_3PLS.map(p => p.id).join(', ')}`);

    return apiSuccess({
      provider: found, status: 'pending_auth',
      setup: { step1: 'Provide API credentials', step2: 'Map warehouse locations', step3: 'Map SKUs', step4: 'Enable order routing' },
      note: 'Configure 3PL connection in Settings > Fulfillment.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: overview, recommend_hub, connect_3pl.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "overview"|"recommend_hub"|"connect_3pl", destinationCountry?, provider? }'); }
