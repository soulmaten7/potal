/**
 * F133: Order auto-sync.
 * F134: Bulk order import.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'status';

  if (action === 'status') {
    return apiSuccess({
      syncStatus: {
        enabled: false,
        platforms: [],
        lastSync: null,
        syncInterval: '15 minutes',
        note: 'Connect a platform in Settings > Integrations to enable order auto-sync.',
      },
      supportedPlatforms: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'Amazon', 'eBay', 'Etsy', 'Custom API'],
      syncFields: ['order_id', 'products', 'quantities', 'prices', 'shipping_address', 'billing_address', 'hs_codes', 'duties', 'taxes'],
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'bulk_import') {
    const orders = Array.isArray(body.orders) ? body.orders : [];
    const format = typeof body.format === 'string' ? body.format : 'json';

    if (format === 'json' && orders.length === 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "orders" array for JSON bulk import.');
    }

    return apiSuccess({
      importId: `IMP-${Date.now().toString(36).toUpperCase()}`,
      format,
      ordersReceived: orders.length,
      status: 'processing',
      supportedFormats: ['JSON', 'CSV', 'XLSX'],
      csvTemplate: {
        columns: ['order_id', 'product_name', 'hs_code', 'quantity', 'unit_price', 'currency', 'origin_country', 'destination_country', 'weight_kg'],
        downloadUrl: 'https://app.potal.app/templates/bulk-order-import.csv',
      },
      processing: {
        steps: ['Validate order data', 'Classify products (HS codes)', 'Calculate landed costs', 'Generate customs documents'],
        estimatedTime: `${Math.max(1, Math.ceil(orders.length / 100))} minutes`,
      },
      webhookUrl: 'Set up webhook in Settings to receive import completion notification.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'configure') {
    const platform = typeof body.platform === 'string' ? body.platform : '';
    if (!platform) return apiError(ApiErrorCode.BAD_REQUEST, '"platform" required.');

    return apiSuccess({
      platform,
      configuration: {
        syncInterval: ['5min', '15min', '30min', '1hour', 'manual'],
        syncDirection: ['import_only', 'export_only', 'bidirectional'],
        filters: { orderStatus: ['unfulfilled', 'fulfilled', 'all'], dateRange: true, minOrderValue: true },
        autoActions: ['auto_classify_hs', 'auto_calculate_landed_cost', 'auto_generate_documents'],
      },
      note: `Connect ${platform} API credentials to enable sync.`,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: status, bulk_import, configure.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "status"|"bulk_import"|"configure", orders?: [...], platform?: "shopify" }'); }
