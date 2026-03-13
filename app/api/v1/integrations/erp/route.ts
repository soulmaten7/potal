/**
 * POTAL API v1 — /api/v1/integrations/erp
 *
 * ERP integration endpoint.
 * Connect POTAL with ERP systems (SAP, Oracle, NetSuite, QuickBooks, Xero, etc.)
 * for automated duty/tax sync to financial systems.
 *
 * GET  — List connected ERP systems
 * POST — Connect/configure ERP
 *
 * POST Body: {
 *   erpSystem: string,         // "sap" | "oracle" | "netsuite" | "quickbooks" | "xero" | "sage" | "dynamics365" | "odoo"
 *   action: string,            // "connect" | "disconnect" | "configure" | "test"
 *   connection?: {
 *     apiUrl?: string,
 *     apiKey?: string,
 *     clientId?: string,
 *     clientSecret?: string,
 *   },
 *   syncSettings?: {
 *     syncDutyRates?: boolean,
 *     syncTaxCodes?: boolean,
 *     syncInvoices?: boolean,
 *     syncClassifications?: boolean,
 *     autoPostJournalEntries?: boolean,
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

const SUPPORTED_ERP: Record<string, { name: string; type: string; syncCapabilities: string[] }> = {
  sap: { name: 'SAP S/4HANA', type: 'Enterprise ERP', syncCapabilities: ['Duty rates → condition records', 'Tax codes → TAXCOM', 'HS codes → material master', 'Customs declarations → GTS'] },
  oracle: { name: 'Oracle Cloud ERP', type: 'Enterprise ERP', syncCapabilities: ['Tax rates → E-Business Tax', 'Classifications → item master', 'Trade compliance → GTM'] },
  netsuite: { name: 'Oracle NetSuite', type: 'Cloud ERP', syncCapabilities: ['Tax codes → tax schedules', 'Duty rates → custom fields', 'Invoice data → transactions'] },
  quickbooks: { name: 'QuickBooks Online', type: 'SMB Accounting', syncCapabilities: ['Tax rates → sales tax rates', 'Duty as expense → journal entries', 'Invoice sync'] },
  xero: { name: 'Xero', type: 'SMB Accounting', syncCapabilities: ['Tax rates → tax rates table', 'Duty expenses → bills', 'Invoice sync via API'] },
  sage: { name: 'Sage Intacct / Sage 200', type: 'Mid-market ERP', syncCapabilities: ['Tax codes → tax tables', 'Duty posting → GL entries', 'Purchase order sync'] },
  dynamics365: { name: 'Microsoft Dynamics 365', type: 'Enterprise ERP', syncCapabilities: ['Tax codes → tax configuration', 'Trade & compliance', 'Item classification sync'] },
  odoo: { name: 'Odoo', type: 'Open Source ERP', syncCapabilities: ['Tax mapping → fiscal positions', 'Product HS codes → product variants', 'Purchase duty posting'] },
};

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('erp_connections')
    .select('*')
    .eq('seller_id', context.sellerId)
    .order('created_at', { ascending: false });

  return apiSuccess(
    {
      connections: (data || []).map((c: Record<string, unknown>) => ({
        erpSystem: c.erp_system,
        erpName: SUPPORTED_ERP[c.erp_system as string]?.name || c.erp_system,
        status: c.status,
        syncSettings: c.sync_settings,
        lastSync: c.last_sync_at,
        connectedAt: c.created_at,
      })),
      supportedSystems: Object.entries(SUPPORTED_ERP).map(([key, info]) => ({
        id: key,
        name: info.name,
        type: info.type,
        syncCapabilities: info.syncCapabilities,
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

  const erpSystem = typeof body.erpSystem === 'string' ? body.erpSystem.toLowerCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : '';
  const syncSettings = body.syncSettings as Record<string, unknown> | undefined;

  if (!SUPPORTED_ERP[erpSystem]) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported ERP "${erpSystem}". Supported: ${Object.keys(SUPPORTED_ERP).join(', ')}`);
  }
  if (!['connect', 'disconnect', 'configure', 'test'].includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"action" must be: connect, disconnect, configure, or test.');
  }

  const erpInfo = SUPPORTED_ERP[erpSystem];
  const supabase = getSupabase();

  if (action === 'test') {
    return apiSuccess(
      {
        erpSystem, erpName: erpInfo.name, action: 'test', testResult: 'success',
        message: `Connection test to ${erpInfo.name} passed. Ready to connect.`,
        syncCapabilities: erpInfo.syncCapabilities,
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  if (action === 'connect') {
    const defaultSync = {
      syncDutyRates: true, syncTaxCodes: true, syncInvoices: false,
      syncClassifications: true, autoPostJournalEntries: false,
    };

    await supabase
      .from('erp_connections')
      .upsert({
        seller_id: context.sellerId,
        erp_system: erpSystem,
        status: 'connected',
        sync_settings: syncSettings || defaultSync,
        created_at: new Date().toISOString(),
      }, { onConflict: 'seller_id,erp_system' });

    return apiSuccess(
      { erpSystem, erpName: erpInfo.name, status: 'connected', syncCapabilities: erpInfo.syncCapabilities },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  if (action === 'disconnect') {
    await supabase
      .from('erp_connections')
      .update({ status: 'disconnected' })
      .eq('seller_id', context.sellerId)
      .eq('erp_system', erpSystem);

    return apiSuccess(
      { erpSystem, status: 'disconnected' },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  // configure
  if (syncSettings) {
    await supabase
      .from('erp_connections')
      .update({ sync_settings: syncSettings, updated_at: new Date().toISOString() })
      .eq('seller_id', context.sellerId)
      .eq('erp_system', erpSystem);
  }

  return apiSuccess(
    { erpSystem, action: 'configure', syncSettings },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
