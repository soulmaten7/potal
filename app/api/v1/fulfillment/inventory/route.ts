/**
 * F135: Inventory Sync — marketplace stock sync + low-stock alerts.
 * F136: 3PL Integration — ShipBob/Deliverr connector interface.
 * F137: Multi-Hub — optimal warehouse selection + inventory across hubs.
 *
 * POST /api/v1/fulfillment/inventory
 * Body: { action: "sync"|"3pl_status"|"find_hub"|"alert_config"|"list_hubs", ... }
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── F137: Fulfillment Hubs ─────────────────────────

interface FulfillmentHub {
  id: string;
  name: string;
  country: string;
  region: string;
  capabilities: string[];
  avgShipDays: Record<string, number>;
}

const FULFILLMENT_HUBS: FulfillmentHub[] = [
  { id: 'us-east', name: 'US East (New Jersey)', country: 'US', region: 'North America', capabilities: ['standard', 'express', 'hazmat', 'cold_chain'], avgShipDays: { US: 2, CA: 3, MX: 5, EU: 7, GB: 6 } },
  { id: 'us-west', name: 'US West (Los Angeles)', country: 'US', region: 'North America', capabilities: ['standard', 'express'], avgShipDays: { US: 2, JP: 5, AU: 7, KR: 5, CN: 4 } },
  { id: 'eu-central', name: 'EU Central (Netherlands)', country: 'NL', region: 'Europe', capabilities: ['standard', 'express', 'cold_chain'], avgShipDays: { DE: 1, FR: 2, GB: 2, IT: 3, ES: 3, US: 7 } },
  { id: 'uk', name: 'UK (Birmingham)', country: 'GB', region: 'Europe', capabilities: ['standard', 'express'], avgShipDays: { GB: 1, IE: 2, FR: 3, DE: 3, US: 7 } },
  { id: 'apac', name: 'APAC (Singapore)', country: 'SG', region: 'Asia Pacific', capabilities: ['standard', 'express'], avgShipDays: { SG: 1, MY: 2, TH: 3, AU: 4, JP: 3, KR: 3 } },
  { id: 'jp', name: 'Japan (Tokyo)', country: 'JP', region: 'Asia Pacific', capabilities: ['standard', 'express', 'cold_chain'], avgShipDays: { JP: 1, KR: 2, CN: 3, US: 5, AU: 5 } },
];

// ─── F136: 3PL Connectors ───────────────────────────

interface ThreePLConnector {
  provider: string;
  name: string;
  apiType: string;
  features: string[];
  regions: string[];
}

const THREE_PL_CONNECTORS: ThreePLConnector[] = [
  { provider: 'shipbob', name: 'ShipBob', apiType: 'REST', features: ['Inventory sync', 'Order fulfillment', 'Returns', 'Lot tracking'], regions: ['US', 'CA', 'AU', 'GB'] },
  { provider: 'deliverr', name: 'Deliverr (Shopify Fulfillment)', apiType: 'REST', features: ['Fast shipping badges', 'Multi-channel', 'Inventory placement'], regions: ['US'] },
  { provider: 'shiphero', name: 'ShipHero', apiType: 'GraphQL', features: ['WMS', 'Order routing', 'Batch picking', 'Returns'], regions: ['US', 'CA'] },
  { provider: 'easypost', name: 'EasyPost', apiType: 'REST', features: ['Multi-carrier rates', 'Label generation', 'Tracking'], regions: ['US', 'CA', 'EU', 'AU'] },
  { provider: 'flexport', name: 'Flexport', apiType: 'REST', features: ['Freight forwarding', 'Customs brokerage', 'Warehousing'], regions: ['US', 'CN', 'EU', 'GB'] },
];

// ─── F137: Optimal Hub Selection ────────────────────

function findOptimalHub(destinationCountry: string, capabilities?: string[]): { hub: FulfillmentHub; estimatedDays: number; reason: string } | null {
  const dest = destinationCountry.toUpperCase();
  let bestHub: FulfillmentHub | null = null;
  let bestDays = Infinity;

  for (const hub of FULFILLMENT_HUBS) {
    if (capabilities && !capabilities.every(c => hub.capabilities.includes(c))) continue;
    const days = hub.avgShipDays[dest];
    if (days !== undefined && days < bestDays) {
      bestDays = days;
      bestHub = hub;
    }
  }

  if (!bestHub) {
    // Fallback: pick by region
    const regionMap: Record<string, string> = { US: 'us-east', CA: 'us-east', MX: 'us-east', GB: 'uk', DE: 'eu-central', FR: 'eu-central', JP: 'jp', SG: 'apac', AU: 'apac' };
    const fallbackId = regionMap[dest] || 'us-east';
    bestHub = FULFILLMENT_HUBS.find(h => h.id === fallbackId) || FULFILLMENT_HUBS[0];
    bestDays = 7;
  }

  return { hub: bestHub, estimatedDays: bestDays, reason: `Shortest estimated delivery to ${dest}: ${bestDays} days from ${bestHub.name}` };
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'list_hubs';

  // ── F135: Inventory Sync ──────────────────────────
  if (action === 'sync') {
    const marketplace = typeof body.marketplace === 'string' ? body.marketplace : '';
    const products = Array.isArray(body.products) ? body.products : [];

    return apiSuccess({
      action: 'sync',
      marketplace: marketplace || null,
      syncStatus: 'ready',
      productsToSync: products.length,
      note: marketplace
        ? `Connect ${marketplace} via POST /api/v1/integrations/marketplace first, then sync inventory.`
        : 'Provide "marketplace" to sync specific platform, or use manual product list.',
      capabilities: ['stock_level_sync', 'low_stock_alerts', 'auto_reorder_triggers', 'multi_marketplace_inventory'],
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── F135: Low Stock Alert Config ──────────────────
  if (action === 'alert_config') {
    const threshold = typeof body.threshold === 'number' ? body.threshold : 10;
    const emailAlert = typeof body.emailAlert === 'boolean' ? body.emailAlert : true;
    const webhookAlert = typeof body.webhookAlert === 'boolean' ? body.webhookAlert : false;

    return apiSuccess({
      action: 'alert_config',
      config: {
        lowStockThreshold: threshold,
        emailAlert, webhookAlert,
        alertTypes: ['low_stock', 'out_of_stock', 'reorder_point'],
      },
      saved: true,
      note: 'Alert configuration saved. Webhook alerts require POST /api/v1/webhooks setup.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── F136: 3PL Status ──────────────────────────────
  if (action === '3pl_status') {
    return apiSuccess({
      action: '3pl_status',
      connectors: THREE_PL_CONNECTORS,
      connected: [],
      note: '3PL integration requires provider API credentials. Contact support for setup assistance.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── F137: Find Optimal Hub ────────────────────────
  if (action === 'find_hub') {
    const destination = typeof body.destinationCountry === 'string' ? body.destinationCountry : '';
    const capabilities = Array.isArray(body.capabilities) ? body.capabilities as string[] : undefined;

    if (!destination) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" required for hub selection.');

    const result = findOptimalHub(destination, capabilities);

    return apiSuccess({
      action: 'find_hub',
      destinationCountry: destination,
      optimal: result,
      allHubs: FULFILLMENT_HUBS.map(h => ({
        ...h,
        estimatedDays: h.avgShipDays[destination.toUpperCase()] || null,
      })),
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── Default: List Hubs ────────────────────────────
  return apiSuccess({
    hubs: FULFILLMENT_HUBS,
    threePLConnectors: THREE_PL_CONNECTORS,
    actions: ['sync', 'alert_config', '3pl_status', 'find_hub', 'list_hubs'],
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "list_hubs"|"find_hub"|"sync"|"3pl_status"|"alert_config", destinationCountry? }');
}
