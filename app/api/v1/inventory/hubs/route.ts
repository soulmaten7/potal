/**
 * POTAL API v1 — /api/v1/inventory/hubs
 *
 * Fulfillment hub management + optimal hub selection.
 * GET  — List hubs + find optimal hub for destination
 * POST — Create/update hub, select optimal hub
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { selectOptimalHub, type Hub } from '@/app/lib/inventory/hub-optimizer';

// In-memory hub storage (production: use DB table)
// Seller-specific hubs would be in a `fulfillment_hubs` table
const DEMO_HUBS: Hub[] = [
  { id: 'hub_us_east', name: 'US East Coast (NJ)', countryCode: 'US', type: 'warehouse', isActive: true, priority: 5 },
  { id: 'hub_us_west', name: 'US West Coast (CA)', countryCode: 'US', type: 'warehouse', isActive: true, priority: 4 },
  { id: 'hub_eu_de', name: 'EU Central (DE)', countryCode: 'DE', type: '3pl', isActive: true, priority: 3 },
  { id: 'hub_uk', name: 'UK (Manchester)', countryCode: 'GB', type: 'warehouse', isActive: true, priority: 3 },
  { id: 'hub_cn', name: 'China (Shenzhen)', countryCode: 'CN', type: 'warehouse', isActive: true, priority: 2 },
  { id: 'hub_au', name: 'Australia (Sydney)', countryCode: 'AU', type: '3pl', isActive: true, priority: 2 },
  { id: 'hub_jp', name: 'Japan (Tokyo)', countryCode: 'JP', type: '3pl', isActive: true, priority: 2 },
];

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const destination = url.searchParams.get('destination')?.toUpperCase();
  const hs6 = url.searchParams.get('hs6') || '610910';
  const value = parseFloat(url.searchParams.get('value') || '50');
  const weight = parseFloat(url.searchParams.get('weight') || '1');

  // If destination provided, find optimal hub
  if (destination && destination.length === 2) {
    const result = selectOptimalHub({
      destinationCountry: destination,
      productHs6: hs6,
      hubs: DEMO_HUBS,
      productValue: value,
      weightKg: weight,
    });

    return apiSuccess({
      optimal: result.recommended,
      alternatives: result.alternatives,
      destination: result.destinationCountry,
      hs6: result.productHs6,
      hubCount: DEMO_HUBS.filter(h => h.isActive).length,
    }, { sellerId: ctx.sellerId });
  }

  // List all hubs
  return apiSuccess({
    hubs: DEMO_HUBS,
    totalHubs: DEMO_HUBS.length,
    activeHubs: DEMO_HUBS.filter(h => h.isActive).length,
    hubTypes: { warehouse: DEMO_HUBS.filter(h => h.type === 'warehouse').length, '3pl': DEMO_HUBS.filter(h => h.type === '3pl').length },
  }, { sellerId: ctx.sellerId });
});

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'optimize';

  if (action === 'optimize') {
    const destination = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';
    if (!destination || destination.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'destinationCountry (ISO2) required.');

    const result = selectOptimalHub({
      destinationCountry: destination,
      productHs6: typeof body.hs6 === 'string' ? body.hs6 : '610910',
      hubs: DEMO_HUBS,
      productValue: typeof body.value === 'number' ? body.value : 50,
      weightKg: typeof body.weightKg === 'number' ? body.weightKg : 1,
    });

    return apiSuccess({
      action: 'optimize',
      recommended: result.recommended,
      alternatives: result.alternatives,
      destinationCountry: destination,
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Supported actions: optimize');
});
