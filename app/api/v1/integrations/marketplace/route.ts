/**
 * POTAL API v1 — /api/v1/integrations/marketplace
 *
 * Marketplace integration management.
 * Connect and manage marketplace accounts (Amazon, eBay, Etsy, Walmart, etc.)
 * for automated tax/duty calculation on marketplace orders.
 *
 * GET  — List connected marketplaces
 * POST — Connect/configure a marketplace
 *
 * POST Body: {
 *   marketplace: string,        // "amazon" | "ebay" | "etsy" | "walmart" | "shopee" | "lazada" | "mercadolibre" | "rakuten"
 *   action: string,             // "connect" | "disconnect" | "configure"
 *   credentials?: {
 *     apiKey?: string,
 *     apiSecret?: string,
 *     sellerId?: string,
 *     region?: string,
 *   },
 *   settings?: {
 *     autoCalculateDuty?: boolean,
 *     autoClassifyHs?: boolean,
 *     syncOrders?: boolean,
 *     defaultOriginCountry?: string,
 *   },
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

const SUPPORTED_MARKETPLACES: Record<string, { name: string; regions: string[]; features: string[] }> = {
  amazon: { name: 'Amazon', regions: ['US', 'CA', 'MX', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU', 'IN', 'SG', 'AE', 'SA', 'BR'], features: ['Order sync', 'Tax calculation', 'HS classification', 'FBA inventory tracking'] },
  ebay: { name: 'eBay', regions: ['US', 'UK', 'DE', 'AU', 'CA', 'FR', 'IT', 'ES'], features: ['Order sync', 'Tax calculation', 'HS classification', 'GSP support'] },
  etsy: { name: 'Etsy', regions: ['US', 'UK', 'CA', 'AU', 'DE', 'FR'], features: ['Order sync', 'Tax calculation', 'Customs declaration'] },
  walmart: { name: 'Walmart', regions: ['US', 'CA', 'MX'], features: ['Order sync', 'Tax calculation', 'WFS inventory'] },
  shopee: { name: 'Shopee', regions: ['SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'TW', 'BR', 'MX', 'CL', 'CO'], features: ['Order sync', 'Tax calculation', 'Cross-border support'] },
  lazada: { name: 'Lazada', regions: ['SG', 'MY', 'TH', 'ID', 'PH', 'VN'], features: ['Order sync', 'Tax calculation'] },
  mercadolibre: { name: 'MercadoLibre', regions: ['MX', 'BR', 'AR', 'CL', 'CO', 'UY'], features: ['Order sync', 'Tax calculation', 'CFDI support'] },
  rakuten: { name: 'Rakuten', regions: ['JP', 'FR', 'DE', 'US'], features: ['Order sync', 'Tax calculation', 'JCT support'] },
};

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('seller_id', context.sellerId)
    .order('created_at', { ascending: false });

  return apiSuccess(
    {
      connections: (data || []).map((c: Record<string, unknown>) => ({
        marketplace: c.marketplace,
        region: c.region,
        status: c.status,
        settings: c.settings,
        connectedAt: c.created_at,
        lastSync: c.last_sync_at,
      })),
      availableMarketplaces: Object.entries(SUPPORTED_MARKETPLACES).map(([key, info]) => ({
        id: key,
        name: info.name,
        regions: info.regions,
        features: info.features,
      })),
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const marketplace = typeof body.marketplace === 'string' ? body.marketplace.toLowerCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : '';
  const credentials = body.credentials as Record<string, string> | undefined;
  const settings = body.settings as Record<string, unknown> | undefined;

  if (!SUPPORTED_MARKETPLACES[marketplace]) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported marketplace "${marketplace}". Supported: ${Object.keys(SUPPORTED_MARKETPLACES).join(', ')}`);
  }
  if (!['connect', 'disconnect', 'configure'].includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"action" must be: connect, disconnect, or configure.');
  }

  const supabase = getSupabase();
  const marketplaceInfo = SUPPORTED_MARKETPLACES[marketplace];

  if (action === 'connect') {
    const region = credentials?.region || 'US';
    if (!marketplaceInfo.regions.includes(region)) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Region "${region}" not available for ${marketplaceInfo.name}. Available: ${marketplaceInfo.regions.join(', ')}`);
    }

    const { error } = await supabase
      .from('marketplace_connections')
      .upsert({
        seller_id: context.sellerId,
        marketplace,
        region,
        status: 'connected',
        settings: settings || { autoCalculateDuty: true, autoClassifyHs: true, syncOrders: true },
        created_at: new Date().toISOString(),
      }, { onConflict: 'seller_id,marketplace,region' });

    if (error) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to save marketplace connection.');
    }

    return apiSuccess(
      { marketplace, marketplaceName: marketplaceInfo.name, region, status: 'connected', action: 'connect', features: marketplaceInfo.features },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  if (action === 'disconnect') {
    await supabase
      .from('marketplace_connections')
      .update({ status: 'disconnected' })
      .eq('seller_id', context.sellerId)
      .eq('marketplace', marketplace);

    return apiSuccess(
      { marketplace, status: 'disconnected', action: 'disconnect' },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  // configure
  if (settings) {
    await supabase
      .from('marketplace_connections')
      .update({ settings, updated_at: new Date().toISOString() })
      .eq('seller_id', context.sellerId)
      .eq('marketplace', marketplace);
  }

  return apiSuccess(
    { marketplace, action: 'configure', settings },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
