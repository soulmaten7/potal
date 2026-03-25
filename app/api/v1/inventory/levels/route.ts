/**
 * POTAL API v1 — /api/v1/inventory/levels
 *
 * Inventory level management across fulfillment hubs.
 * GET  — Query inventory by hub/sku
 * POST — Update inventory (receive/ship/adjust)
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface InventoryRecord {
  hubId: string;
  sku: string;
  productName: string;
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: string;
}

// Demo inventory data (production: DB table)
const INVENTORY: InventoryRecord[] = [
  { hubId: 'hub_us_east', sku: 'SHIRT-001', productName: 'Cotton T-Shirt', quantity: 500, reserved: 30, available: 470, lastUpdated: '2026-03-25T00:00:00Z' },
  { hubId: 'hub_us_east', sku: 'CAP-001', productName: 'Baseball Cap', quantity: 200, reserved: 10, available: 190, lastUpdated: '2026-03-25T00:00:00Z' },
  { hubId: 'hub_eu_de', sku: 'SHIRT-001', productName: 'Cotton T-Shirt', quantity: 300, reserved: 20, available: 280, lastUpdated: '2026-03-25T00:00:00Z' },
  { hubId: 'hub_cn', sku: 'SHIRT-001', productName: 'Cotton T-Shirt', quantity: 2000, reserved: 100, available: 1900, lastUpdated: '2026-03-25T00:00:00Z' },
  { hubId: 'hub_uk', sku: 'SHIRT-001', productName: 'Cotton T-Shirt', quantity: 150, reserved: 5, available: 145, lastUpdated: '2026-03-25T00:00:00Z' },
];

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const hubId = url.searchParams.get('hub_id') || undefined;
  const sku = url.searchParams.get('sku') || undefined;

  let results = INVENTORY;
  if (hubId) results = results.filter(i => i.hubId === hubId);
  if (sku) results = results.filter(i => i.sku === sku);

  // Aggregate by SKU across hubs
  const bySku: Record<string, { totalQuantity: number; totalAvailable: number; hubs: number }> = {};
  for (const item of results) {
    if (!bySku[item.sku]) bySku[item.sku] = { totalQuantity: 0, totalAvailable: 0, hubs: 0 };
    bySku[item.sku].totalQuantity += item.quantity;
    bySku[item.sku].totalAvailable += item.available;
    bySku[item.sku].hubs++;
  }

  return apiSuccess({
    inventory: results,
    total: results.length,
    aggregated: Object.entries(bySku).map(([skuKey, agg]) => ({ sku: skuKey, ...agg })),
    filters: { hubId: hubId || 'all', sku: sku || 'all' },
  }, { sellerId: ctx.sellerId });
});

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : '';
  const hubId = typeof body.hubId === 'string' ? body.hubId : '';
  const sku = typeof body.sku === 'string' ? body.sku : '';
  const quantity = typeof body.quantity === 'number' ? body.quantity : 0;

  if (!['receive', 'ship', 'adjust', 'reserve'].includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"action" must be: receive, ship, adjust, reserve.');
  }
  if (!hubId) return apiError(ApiErrorCode.BAD_REQUEST, '"hubId" required.');
  if (!sku) return apiError(ApiErrorCode.BAD_REQUEST, '"sku" required.');
  if (quantity <= 0 && action !== 'adjust') return apiError(ApiErrorCode.BAD_REQUEST, '"quantity" must be positive.');

  const item = INVENTORY.find(i => i.hubId === hubId && i.sku === sku);
  if (!item) {
    return apiError(ApiErrorCode.NOT_FOUND, `No inventory for SKU "${sku}" at hub "${hubId}".`);
  }

  let newQuantity = item.quantity;
  let newReserved = item.reserved;

  if (action === 'receive') {
    newQuantity += quantity;
  } else if (action === 'ship') {
    if (item.available < quantity) {
      // Find alternative hubs
      const alternatives = INVENTORY.filter(i => i.sku === sku && i.hubId !== hubId && i.available >= quantity);
      return apiError(ApiErrorCode.BAD_REQUEST, `Insufficient stock (available: ${item.available}, requested: ${quantity}).${alternatives.length > 0 ? ` Alternative hubs: ${alternatives.map(a => a.hubId).join(', ')}` : ''}`);
    }
    newQuantity -= quantity;
  } else if (action === 'adjust') {
    newQuantity = Math.max(0, quantity); // Set absolute quantity
  } else if (action === 'reserve') {
    if (item.available < quantity) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Cannot reserve ${quantity} (available: ${item.available}).`);
    }
    newReserved += quantity;
  }

  // Update (in production: DB update)
  item.quantity = newQuantity;
  item.reserved = newReserved;
  item.available = newQuantity - newReserved;
  item.lastUpdated = new Date().toISOString();

  return apiSuccess({
    action,
    hubId, sku, quantity,
    updatedInventory: { quantity: item.quantity, reserved: item.reserved, available: item.available },
    lastUpdated: item.lastUpdated,
  }, { sellerId: ctx.sellerId });
});
