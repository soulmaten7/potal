/**
 * POTAL API v1 — /api/v1/fulfillment/3pl
 * F136: 3PL Integration — connect, list warehouses, check status.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const SUPPORTED_3PL: Record<string, { name: string; countries: string[]; features: string[] }> = {
  shipbob: { name: 'ShipBob', countries: ['US', 'CA', 'GB', 'AU'], features: ['2-day shipping', 'inventory management', 'returns'] },
  deliverr: { name: 'Deliverr (Shopify Fulfillment)', countries: ['US'], features: ['fast shipping', 'Shopify integration'] },
  amazon_fba: { name: 'Amazon FBA', countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU'], features: ['Prime eligible', 'multi-channel'] },
  cj_dropshipping: { name: 'CJ Dropshipping', countries: ['CN', 'US', 'DE', 'TH'], features: ['dropshipping', 'product sourcing'] },
  ship_from_china: { name: 'CNStorm / 4PX', countries: ['CN'], features: ['China warehouse', 'ePacket', 'global shipping'] },
};

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'list';
  const provider = typeof body.provider === 'string' ? body.provider.toLowerCase() : '';

  if (action === 'list') {
    return apiSuccess({
      providers: Object.entries(SUPPORTED_3PL).map(([id, info]) => ({ id, ...info })),
      note: 'Use action: "connect" with provider ID to initiate 3PL connection.',
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'connect') {
    if (!provider || !SUPPORTED_3PL[provider]) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Unknown provider. Supported: ${Object.keys(SUPPORTED_3PL).join(', ')}`);
    }
    const info = SUPPORTED_3PL[provider];
    return apiSuccess({
      provider: info.name,
      status: 'pending_setup',
      setupSteps: [
        `Create ${info.name} account if not exists`,
        `Generate API credentials in ${info.name} dashboard`,
        'Provide credentials in POTAL Settings → 3PL Integrations',
        'Sync inventory and warehouse locations',
      ],
      countries: info.countries,
      features: info.features,
      webhookUrl: `https://www.potal.app/api/v1/webhooks/3pl/${provider}`,
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'status') {
    return apiSuccess({
      connected: false,
      provider: provider || null,
      message: 'No 3PL provider currently connected. Use action: "connect" to set up.',
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'warehouses') {
    if (!provider || !SUPPORTED_3PL[provider]) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Provider required. Supported: ${Object.keys(SUPPORTED_3PL).join(', ')}`);
    }
    const info = SUPPORTED_3PL[provider];
    // Provider-specific warehouse data structures
    const warehouses = info.countries.map((country, idx) => ({
      id: `wh_${provider}_${idx + 1}`,
      name: `${info.name} — ${country} Warehouse`,
      country,
      address: `Fulfillment Center ${idx + 1}`,
      type: 'fulfillment_center' as const,
      capabilities: ['pick_pack', 'kitting', 'returns_processing'],
      cutoffTime: '14:00',
      timezone: country === 'US' ? 'America/New_York' : 'UTC',
      isActive: true,
    }));

    return apiSuccess({
      provider: info.name,
      warehouses,
      totalWarehouses: warehouses.length,
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'inventory') {
    if (!provider || !SUPPORTED_3PL[provider]) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Provider required.');
    }
    const sku = typeof body.sku === 'string' ? body.sku : '';
    return apiSuccess({
      provider: SUPPORTED_3PL[provider].name,
      note: sku
        ? `Inventory query for SKU "${sku}". Connect your ${SUPPORTED_3PL[provider].name} API key to get live data.`
        : `Connect your ${SUPPORTED_3PL[provider].name} API key to sync inventory.`,
      inventorySync: {
        endpoint: `https://www.potal.app/api/v1/fulfillment/3pl`,
        requiredCredentials: ['apiKey', 'accountId'],
        syncFrequency: 'every 15 minutes',
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'fulfill') {
    if (!provider || !SUPPORTED_3PL[provider]) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Provider required for fulfillment.');
    }
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const items = Array.isArray(body.items) ? body.items : [];
    if (!orderId) return apiError(ApiErrorCode.BAD_REQUEST, '"orderId" required for fulfillment.');
    if (items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, '"items" array required for fulfillment.');

    return apiSuccess({
      provider: SUPPORTED_3PL[provider].name,
      fulfillmentRequest: {
        orderId,
        status: 'submitted',
        items: items.map((item: Record<string, unknown>, idx: number) => ({
          line: idx + 1,
          sku: String(item.sku || ''),
          quantity: Number(item.quantity || 1),
        })),
        submittedAt: new Date().toISOString(),
        estimatedProcessingHours: 24,
      },
      note: 'Connect API credentials to submit fulfillment orders to your 3PL provider.',
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: list, connect, status, warehouses, inventory, or fulfill.');
});
