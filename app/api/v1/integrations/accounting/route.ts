/**
 * F084: Accounting software integration.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const ACCOUNTING_PLATFORMS = [
  { id: 'quickbooks', name: 'QuickBooks Online', features: ['invoices', 'expenses', 'tax_codes', 'journal_entries'], regions: ['US', 'CA', 'UK', 'AU'] },
  { id: 'xero', name: 'Xero', features: ['invoices', 'expenses', 'tax_codes', 'bank_reconciliation'], regions: ['AU', 'NZ', 'UK', 'US'] },
  { id: 'sage', name: 'Sage', features: ['invoices', 'expenses', 'tax_codes', 'inventory'], regions: ['UK', 'EU', 'US', 'ZA'] },
  { id: 'freshbooks', name: 'FreshBooks', features: ['invoices', 'expenses', 'time_tracking'], regions: ['US', 'CA'] },
  { id: 'zoho_books', name: 'Zoho Books', features: ['invoices', 'expenses', 'tax_codes', 'inventory'], regions: ['IN', 'US', 'UK', 'AU'] },
  { id: 'wave', name: 'Wave', features: ['invoices', 'expenses', 'receipts'], regions: ['US', 'CA'] },
  { id: 'netsuite', name: 'Oracle NetSuite', features: ['invoices', 'expenses', 'tax_codes', 'journal_entries', 'inventory', 'multi_currency'], regions: ['global'] },
  { id: 'datev', name: 'DATEV', features: ['invoices', 'tax_codes', 'journal_entries'], regions: ['DE'] },
];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'list';
  const platform = typeof body.platform === 'string' ? body.platform.toLowerCase() : '';

  if (action === 'list') {
    return apiSuccess({ platforms: ACCOUNTING_PLATFORMS }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (!platform) return apiError(ApiErrorCode.BAD_REQUEST, '"platform" required.');
  const found = ACCOUNTING_PLATFORMS.find(p => p.id === platform);
  if (!found) return apiError(ApiErrorCode.BAD_REQUEST, `Unknown platform "${platform}". Use "list" action to see available platforms.`);

  if (action === 'connect') {
    return apiSuccess({
      platform: found.id, name: found.name, status: 'pending_auth',
      authUrl: `https://app.potal.app/integrations/accounting/${found.id}/auth`,
      features: found.features, regions: found.regions,
      setup: { step1: 'Redirect user to authUrl', step2: 'User grants access', step3: 'Callback stores tokens', step4: 'Enable sync settings' },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'sync') {
    const syncType = typeof body.syncType === 'string' ? body.syncType : 'all';
    return apiSuccess({
      platform: found.id, syncType, status: 'queued',
      syncableData: {
        duties_and_taxes: 'Import duty and tax amounts as expense line items',
        invoices: 'Cross-border invoices with tax breakdowns',
        tax_codes: 'Map HS codes to accounting tax categories',
        journal_entries: 'Landed cost adjustments as journal entries',
      },
      fieldMapping: {
        hs_code: 'Product tax code / category',
        duty_amount: 'Cost of goods adjustment',
        vat_amount: 'Tax line item',
        shipping_cost: 'Freight expense',
      },
      note: 'Configure field mappings in Settings > Integrations > Accounting.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: list, connect, sync.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "list"|"connect"|"sync", platform?: "quickbooks", syncType?: "all" }'); }
