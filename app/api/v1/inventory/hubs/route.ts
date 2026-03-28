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

// In-memory inventory (production: use DB)
const DEMO_INVENTORY: Record<string, { sku: string; quantity: number; reserved: number }[]> = {
  hub_us_east: [
    { sku: 'SHIRT-BLK-M', quantity: 500, reserved: 20 },
    { sku: 'SHOE-WHT-42', quantity: 200, reserved: 5 },
    { sku: 'BAG-LTH-001', quantity: 80, reserved: 3 },
  ],
  hub_us_west: [
    { sku: 'SHIRT-BLK-M', quantity: 300, reserved: 10 },
    { sku: 'ELEC-PHN-01', quantity: 150, reserved: 8 },
  ],
  hub_eu_de: [
    { sku: 'SHIRT-BLK-M', quantity: 400, reserved: 15 },
    { sku: 'SHOE-WHT-42', quantity: 350, reserved: 12 },
  ],
  hub_uk: [
    { sku: 'SHIRT-BLK-M', quantity: 200, reserved: 5 },
    { sku: 'BAG-LTH-001', quantity: 100, reserved: 2 },
  ],
  hub_cn: [
    { sku: 'SHIRT-BLK-M', quantity: 2000, reserved: 50 },
    { sku: 'ELEC-PHN-01', quantity: 500, reserved: 20 },
    { sku: 'SHOE-WHT-42', quantity: 800, reserved: 30 },
    { sku: 'BAG-LTH-001', quantity: 300, reserved: 10 },
  ],
  hub_au: [
    { sku: 'SHIRT-BLK-M', quantity: 100, reserved: 3 },
  ],
  hub_jp: [
    { sku: 'ELEC-PHN-01', quantity: 200, reserved: 10 },
  ],
};

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

  if (action === 'inventory') {
    const sku = typeof body.sku === 'string' ? body.sku.toUpperCase() : '';
    const hubId = typeof body.hubId === 'string' ? body.hubId : '';

    if (hubId) {
      // Single hub inventory
      const items = DEMO_INVENTORY[hubId] || [];
      const filtered = sku ? items.filter(i => i.sku === sku) : items;
      const hub = DEMO_HUBS.find(h => h.id === hubId);
      return apiSuccess({
        action: 'inventory',
        hub: hub ? { id: hub.id, name: hub.name, country: hub.countryCode } : null,
        items: filtered.map(i => ({ ...i, available: i.quantity - i.reserved })),
        totalSkus: filtered.length,
      }, { sellerId: ctx.sellerId });
    }

    // Cross-hub inventory for a SKU
    if (sku) {
      const crossHub = DEMO_HUBS.filter(h => h.isActive).map(hub => {
        const items = DEMO_INVENTORY[hub.id] || [];
        const item = items.find(i => i.sku === sku);
        return {
          hubId: hub.id,
          hubName: hub.name,
          hubCountry: hub.countryCode,
          quantity: item?.quantity || 0,
          reserved: item?.reserved || 0,
          available: item ? item.quantity - item.reserved : 0,
        };
      }).filter(h => h.quantity > 0);

      const totalAvailable = crossHub.reduce((s, h) => s + h.available, 0);

      return apiSuccess({
        action: 'inventory',
        sku,
        hubs: crossHub,
        totalAvailable,
        totalHubsWithStock: crossHub.length,
      }, { sellerId: ctx.sellerId });
    }

    // All inventory summary
    const summary = DEMO_HUBS.filter(h => h.isActive).map(hub => {
      const items = DEMO_INVENTORY[hub.id] || [];
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);
      const totalReserved = items.reduce((s, i) => s + i.reserved, 0);
      return {
        hubId: hub.id,
        hubName: hub.name,
        hubCountry: hub.countryCode,
        skuCount: items.length,
        totalQuantity: totalQty,
        totalReserved: totalReserved,
        totalAvailable: totalQty - totalReserved,
      };
    });

    return apiSuccess({
      action: 'inventory',
      hubs: summary,
      totalHubs: summary.length,
      totalSkus: new Set(Object.values(DEMO_INVENTORY).flat().map(i => i.sku)).size,
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'allocate') {
    const sku = typeof body.sku === 'string' ? body.sku.toUpperCase() : '';
    const quantity = typeof body.quantity === 'number' ? body.quantity : 1;
    const destination = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';

    if (!sku) return apiError(ApiErrorCode.BAD_REQUEST, '"sku" required for allocation.');
    if (!destination) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" required for allocation.');

    // Find optimal hub that has stock
    const hubsWithStock = DEMO_HUBS.filter(h => {
      if (!h.isActive) return false;
      const items = DEMO_INVENTORY[h.id] || [];
      const item = items.find(i => i.sku === sku);
      return item && (item.quantity - item.reserved) >= quantity;
    });

    if (hubsWithStock.length === 0) {
      return apiSuccess({
        action: 'allocate',
        sku,
        quantity,
        allocated: false,
        reason: 'Insufficient stock across all hubs.',
      }, { sellerId: ctx.sellerId });
    }

    const result = selectOptimalHub({
      destinationCountry: destination,
      productHs6: typeof body.hs6 === 'string' ? body.hs6 : '610910',
      hubs: hubsWithStock,
      productValue: typeof body.value === 'number' ? body.value : 50,
      weightKg: typeof body.weightKg === 'number' ? body.weightKg : 1,
    });

    return apiSuccess({
      action: 'allocate',
      sku,
      quantity,
      allocated: !!result.recommended,
      allocatedHub: result.recommended ? {
        hubId: result.recommended.hubId,
        hubName: result.recommended.hubName,
        hubCountry: result.recommended.hubCountry,
        estimatedLandedCost: result.recommended.totalLandedCost,
        hasFta: result.recommended.hasFta,
      } : null,
      alternativeHubs: result.alternatives.slice(0, 3).map(a => ({
        hubId: a.hubId,
        hubName: a.hubName,
        estimatedLandedCost: a.totalLandedCost,
      })),
      destination,
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Supported actions: optimize, inventory, allocate');
});
