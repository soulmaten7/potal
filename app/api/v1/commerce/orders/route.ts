/**
 * F133: Order Auto-Sync — marketplace order synchronization + HS classification.
 * F134: Bulk Order Import — CSV/JSON bulk order import with validation.
 *
 * POST /api/v1/commerce/orders
 * Body: { action: "sync"|"import"|"list", marketplace?, orders? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  currency?: string;
  hsCode?: string;
  originCountry?: string;
  weight?: number;
}

interface ImportOrder {
  orderId: string;
  marketplace?: string;
  buyerCountry: string;
  items: OrderItem[];
  shippingCost?: number;
}

const SUPPORTED_MARKETPLACES = ['shopify', 'amazon', 'ebay', 'etsy', 'walmart', 'woocommerce'];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'list';

  // ── F133: Sync orders from marketplace ────────────
  if (action === 'sync') {
    const marketplace = typeof body.marketplace === 'string' ? body.marketplace.toLowerCase() : '';
    const since = typeof body.since === 'string' ? body.since : undefined;
    const limit = typeof body.limit === 'number' ? Math.min(body.limit, 100) : 50;

    if (!marketplace || !SUPPORTED_MARKETPLACES.includes(marketplace)) {
      return apiError(ApiErrorCode.BAD_REQUEST, `"marketplace" must be: ${SUPPORTED_MARKETPLACES.join(', ')}`);
    }

    return apiSuccess({
      action: 'sync',
      marketplace,
      status: 'ready',
      syncConfig: {
        since: since || 'last 24 hours',
        limit,
        autoClassify: true,
        conflictResolution: 'keep_latest',
      },
      note: `Order sync from ${marketplace} requires active marketplace connection. Use POST /api/v1/integrations/marketplace to connect first.`,
      syncCapabilities: {
        orderImport: true,
        hsAutoClassification: true,
        landedCostCalculation: true,
        statusSync: true,
        conflictHandling: ['keep_latest', 'keep_existing', 'manual_review'],
      },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── F134: Bulk import orders ──────────────────────
  if (action === 'import') {
    const orders = body.orders as unknown[];
    if (!Array.isArray(orders) || orders.length === 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"orders" must be a non-empty array.');
    }
    if (orders.length > 500) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Max 500 orders per import. Got ${orders.length}.`);
    }

    const results: { orderId: string; status: string; itemCount: number; totalValue: number; errors?: string[] }[] = [];
    const importErrors: { index: number; error: string }[] = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i] as Record<string, unknown>;
      const orderId = typeof order.orderId === 'string' ? order.orderId : '';
      const buyerCountry = typeof order.buyerCountry === 'string' ? order.buyerCountry.toUpperCase() : '';
      const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];

      const orderErrors: string[] = [];
      if (!orderId) orderErrors.push('orderId required');
      if (!buyerCountry || buyerCountry.length !== 2) orderErrors.push('buyerCountry must be 2-letter ISO');
      if (items.length === 0) orderErrors.push('items must be non-empty array');

      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        if (!item.productName) orderErrors.push(`items[${j}].productName required`);
        if (typeof item.quantity !== 'number' || item.quantity <= 0) orderErrors.push(`items[${j}].quantity must be positive`);
        if (typeof item.price !== 'number' || item.price < 0) orderErrors.push(`items[${j}].price must be non-negative`);
      }

      if (orderErrors.length > 0) {
        importErrors.push({ index: i, error: orderErrors.join('; ') });
        continue;
      }

      const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      results.push({
        orderId,
        status: 'imported',
        itemCount: items.length,
        totalValue: Math.round(totalValue * 100) / 100,
      });
    }

    return apiSuccess({
      action: 'import',
      imported: results.length,
      failed: importErrors.length,
      total: orders.length,
      results,
      errors: importErrors.length > 0 ? importErrors : undefined,
      nextSteps: results.length > 0 ? [
        'Orders imported. Use POST /api/v1/classify/batch to auto-classify HS codes.',
        'Use POST /api/v1/calculate to get landed costs for each order.',
      ] : undefined,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── List / info ───────────────────────────────────
  return apiSuccess({
    actions: ['sync', 'import', 'list'],
    supportedMarketplaces: SUPPORTED_MARKETPLACES,
    importFormat: {
      orders: [{
        orderId: 'string (required)',
        buyerCountry: 'string 2-letter ISO (required)',
        marketplace: 'string (optional)',
        shippingCost: 'number (optional)',
        items: [{
          id: 'string', productName: 'string (required)',
          quantity: 'number (required)', price: 'number (required)',
          currency: 'string', hsCode: 'string', originCountry: 'string', weight: 'number',
        }],
      }],
    },
    limits: { maxOrdersPerImport: 500 },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "sync"|"import"|"list", marketplace?, orders? }');
}
