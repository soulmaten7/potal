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

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: list, connect, or status.');
});
