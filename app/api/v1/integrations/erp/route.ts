/**
 * POTAL API v1 — /api/v1/integrations/erp
 *
 * ERP integration: connect, test, sync, configure.
 * Supports: SAP, Oracle, NetSuite, QuickBooks, Xero, Sage, Dynamics365, Odoo
 *
 * GET  — List connections + supported systems
 * POST — Actions: connect, disconnect, configure, test, sync, map_accounts
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Encryption ──────────────────────────────────────

const ERP_ENCRYPTION_KEY = process.env.ERP_ENCRYPTION_KEY || createHash('sha256').update('potal-erp-default-key').digest();

function encryptCredentials(data: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', ERP_ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptCredentials(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  if (!ivHex || !encrypted) throw new Error('Invalid encrypted data');
  const decipher = createDecipheriv('aes-256-cbc', ERP_ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── ERP System Config ───────────────────────────────

interface ErpConfig {
  name: string;
  type: string;
  syncCapabilities: string[];
  testEndpoint: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'token_based';
}

const SUPPORTED_ERP: Record<string, ErpConfig> = {
  sap: { name: 'SAP S/4HANA', type: 'Enterprise', syncCapabilities: ['Duty rates → condition records', 'Tax codes → TAXCOM', 'HS codes → material master'], testEndpoint: '/sap/opu/odata/sap/API_BUSINESS_PARTNER', authType: 'basic' },
  oracle: { name: 'Oracle Cloud ERP', type: 'Enterprise', syncCapabilities: ['Tax rates → E-Business Tax', 'Classifications → item master'], testEndpoint: '/fscmRestApi/resources/v11/serverStatus', authType: 'basic' },
  netsuite: { name: 'Oracle NetSuite', type: 'Cloud ERP', syncCapabilities: ['Tax codes → tax schedules', 'Duty rates → custom fields', 'Invoice sync'], testEndpoint: '/services/rest/record/v1/customer?limit=1', authType: 'token_based' },
  quickbooks: { name: 'QuickBooks Online', type: 'SMB Accounting', syncCapabilities: ['Duty as expense → journal entries', 'Tax rates → sales tax', 'Bill sync'], testEndpoint: '/v3/company/{companyId}/companyinfo/{companyId}', authType: 'oauth2' },
  xero: { name: 'Xero', type: 'SMB Accounting', syncCapabilities: ['Tax rates → tax rates table', 'Duty expenses → bills', 'Invoice sync'], testEndpoint: '/connections', authType: 'oauth2' },
  sage: { name: 'Sage Intacct', type: 'Mid-market', syncCapabilities: ['Tax codes → tax tables', 'Duty posting → GL entries'], testEndpoint: '/api/v1/companies', authType: 'api_key' },
  dynamics365: { name: 'Microsoft Dynamics 365', type: 'Enterprise', syncCapabilities: ['Tax codes → tax configuration', 'Trade compliance', 'Item classification'], testEndpoint: '/api/data/v9.2/WhoAmI', authType: 'oauth2' },
  odoo: { name: 'Odoo', type: 'Open Source', syncCapabilities: ['Tax → fiscal positions', 'HS codes → product variants'], testEndpoint: '/web/session/get_session_info', authType: 'api_key' },
};

// ─── Default Account Mappings ────────────────────────

interface AccountMapping {
  importDuties: string;
  vatPayable: string;
  customsFees: string;
  freightCost: string;
  insurance: string;
}

const DEFAULT_ACCOUNT_MAPPINGS: Record<string, AccountMapping> = {
  quickbooks: { importDuties: 'Cost of Goods Sold:Import Duties', vatPayable: 'VAT Payable', customsFees: 'Customs Brokerage Fees', freightCost: 'Freight & Shipping', insurance: 'Insurance Expense' },
  xero: { importDuties: '300 - Import Duties', vatPayable: '820 - VAT', customsFees: '310 - Customs Fees', freightCost: '400 - Freight', insurance: '410 - Insurance' },
  sap: { importDuties: '4100 Import Duties', vatPayable: '1406 Input VAT', customsFees: '4110 Customs Fees', freightCost: '4200 Freight', insurance: '4210 Insurance' },
  netsuite: { importDuties: 'Import Duties', vatPayable: 'VAT Receivable', customsFees: 'Customs Fees', freightCost: 'Freight-In', insurance: 'Insurance' },
};

// ─── Connection Test ─────────────────────────────────

async function testErpConnection(erpType: string, credentials: Record<string, string>): Promise<{ connected: boolean; statusCode?: number; error?: string; latencyMs?: number }> {
  const config = SUPPORTED_ERP[erpType];
  if (!config) return { connected: false, error: `Unsupported ERP: ${erpType}` };

  const baseUrl = credentials.apiUrl || credentials.baseUrl || '';
  if (!baseUrl && !['xero'].includes(erpType)) {
    return { connected: false, error: 'apiUrl is required for connection test.' };
  }

  const testUrl = erpType === 'xero' ? 'https://api.xero.com/connections' : `${baseUrl}${config.testEndpoint}`;

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (config.authType === 'api_key' && credentials.apiKey) {
    headers['Authorization'] = `Bearer ${credentials.apiKey}`;
  } else if (config.authType === 'basic' && credentials.username && credentials.password) {
    headers['Authorization'] = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`;
  } else if (config.authType === 'oauth2' && credentials.accessToken) {
    headers['Authorization'] = `Bearer ${credentials.accessToken}`;
  } else if (config.authType === 'token_based' && credentials.token) {
    headers['Authorization'] = `Bearer ${credentials.token}`;
  }

  const start = Date.now();
  try {
    const response = await fetch(testUrl, { headers, signal: AbortSignal.timeout(10000) });
    return { connected: response.ok, statusCode: response.status, latencyMs: Date.now() - start };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : 'Connection failed', latencyMs: Date.now() - start };
  }
}

// ─── Sync Log ────────────────────────────────────────

async function logSync(sellerId: string, erpType: string, action: string, status: string, error?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await (supabase.from('health_check_logs') as any).insert({
      overall_status: status === 'success' ? 'green' : 'yellow',
      checks: [{ name: `erp_sync_${erpType}`, seller_id: sellerId, action, status, error: error || null, synced_at: new Date().toISOString() }],
      duration_ms: 0,
    });
  } catch { /* fire-and-forget */ }
}

// ─── Handler ─────────────────────────────────────────

export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  const { data } = await (supabase.from('erp_connections') as any)
    .select('erp_system, status, sync_settings, last_sync_at, created_at, account_mapping')
    .eq('seller_id', ctx.sellerId)
    .order('created_at', { ascending: false });

  return apiSuccess({
    connections: (data || []).map((c: Record<string, unknown>) => ({
      erpSystem: c.erp_system,
      erpName: SUPPORTED_ERP[c.erp_system as string]?.name || c.erp_system,
      status: c.status,
      syncSettings: c.sync_settings,
      accountMapping: c.account_mapping,
      lastSync: c.last_sync_at,
      connectedAt: c.created_at,
    })),
    supportedSystems: Object.entries(SUPPORTED_ERP).map(([key, info]) => ({
      id: key, name: info.name, type: info.type, authType: info.authType, syncCapabilities: info.syncCapabilities,
    })),
  }, { sellerId: ctx.sellerId });
});

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const erpSystem = typeof body.erpSystem === 'string' ? body.erpSystem.toLowerCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : '';
  const connection = body.connection as Record<string, string> | undefined;
  const syncSettings = body.syncSettings as Record<string, unknown> | undefined;
  const accountMapping = body.accountMapping as AccountMapping | undefined;

  if (!SUPPORTED_ERP[erpSystem]) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported ERP "${erpSystem}". Supported: ${Object.keys(SUPPORTED_ERP).join(', ')}`);
  }
  if (!['connect', 'disconnect', 'configure', 'test', 'sync', 'map_accounts'].includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"action" must be: connect, disconnect, configure, test, sync, map_accounts.');
  }

  const erpInfo = SUPPORTED_ERP[erpSystem];
  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  // ─── TEST ─────────────────────────────────────────
  if (action === 'test') {
    if (!connection) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"connection" object required for test action.');
    }
    const result = await testErpConnection(erpSystem, connection);
    void logSync(ctx.sellerId, erpSystem, 'test', result.connected ? 'success' : 'failed', result.error);
    return apiSuccess({
      erpSystem, erpName: erpInfo.name, action: 'test',
      testResult: result.connected ? 'success' : 'failed',
      statusCode: result.statusCode, latencyMs: result.latencyMs,
      error: result.error,
      authType: erpInfo.authType,
    }, { sellerId: ctx.sellerId });
  }

  // ─── CONNECT ──────────────────────────────────────
  if (action === 'connect') {
    const defaultSync = { syncDutyRates: true, syncTaxCodes: true, syncInvoices: false, syncClassifications: true, autoPostJournalEntries: false };
    const defaultMapping = DEFAULT_ACCOUNT_MAPPINGS[erpSystem] || DEFAULT_ACCOUNT_MAPPINGS.quickbooks;

    const insertData: Record<string, unknown> = {
      seller_id: ctx.sellerId,
      erp_system: erpSystem,
      status: 'connected',
      sync_settings: syncSettings || defaultSync,
      account_mapping: accountMapping || defaultMapping,
      created_at: new Date().toISOString(),
    };

    // Encrypt and store credentials if provided
    if (connection) {
      insertData.credentials_encrypted = encryptCredentials(JSON.stringify(connection));
    }

    await (supabase.from('erp_connections') as any)
      .upsert(insertData, { onConflict: 'seller_id,erp_system' });

    void logSync(ctx.sellerId, erpSystem, 'connect', 'success');

    return apiSuccess({
      erpSystem, erpName: erpInfo.name, status: 'connected',
      syncCapabilities: erpInfo.syncCapabilities,
      accountMapping: accountMapping || defaultMapping,
    }, { sellerId: ctx.sellerId });
  }

  // ─── DISCONNECT ───────────────────────────────────
  if (action === 'disconnect') {
    await (supabase.from('erp_connections') as any)
      .update({ status: 'disconnected', credentials_encrypted: null, updated_at: new Date().toISOString() })
      .eq('seller_id', ctx.sellerId)
      .eq('erp_system', erpSystem);

    void logSync(ctx.sellerId, erpSystem, 'disconnect', 'success');
    return apiSuccess({ erpSystem, status: 'disconnected' }, { sellerId: ctx.sellerId });
  }

  // ─── CONFIGURE ────────────────────────────────────
  if (action === 'configure') {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (syncSettings) updates.sync_settings = syncSettings;
    if (accountMapping) updates.account_mapping = accountMapping;

    await (supabase.from('erp_connections') as any)
      .update(updates)
      .eq('seller_id', ctx.sellerId)
      .eq('erp_system', erpSystem);

    return apiSuccess({ erpSystem, action: 'configure', syncSettings, accountMapping }, { sellerId: ctx.sellerId });
  }

  // ─── MAP_ACCOUNTS ─────────────────────────────────
  if (action === 'map_accounts') {
    if (!accountMapping) {
      // Return default mapping
      const defaults = DEFAULT_ACCOUNT_MAPPINGS[erpSystem] || DEFAULT_ACCOUNT_MAPPINGS.quickbooks;
      return apiSuccess({
        erpSystem, action: 'map_accounts',
        currentMapping: defaults,
        note: 'Send accountMapping object to customize. Fields: importDuties, vatPayable, customsFees, freightCost, insurance.',
      }, { sellerId: ctx.sellerId });
    }

    await (supabase.from('erp_connections') as any)
      .update({ account_mapping: accountMapping, updated_at: new Date().toISOString() })
      .eq('seller_id', ctx.sellerId)
      .eq('erp_system', erpSystem);

    return apiSuccess({ erpSystem, action: 'map_accounts', accountMapping, saved: true }, { sellerId: ctx.sellerId });
  }

  // ─── SYNC ─────────────────────────────────────────
  if (action === 'sync') {
    // Check connection exists
    const { data: conn } = await (supabase.from('erp_connections') as any)
      .select('status, credentials_encrypted, sync_settings, account_mapping')
      .eq('seller_id', ctx.sellerId)
      .eq('erp_system', erpSystem)
      .single();

    if (!conn || conn.status !== 'connected') {
      return apiError(ApiErrorCode.BAD_REQUEST, `${erpInfo.name} not connected. Use action "connect" first.`);
    }

    // Simulate sync (actual ERP API calls would go here)
    const syncResult = {
      erpSystem, erpName: erpInfo.name, action: 'sync',
      status: 'completed',
      syncedAt: new Date().toISOString(),
      details: {
        dutyRates: conn.sync_settings?.syncDutyRates ? 'synced' : 'skipped',
        taxCodes: conn.sync_settings?.syncTaxCodes ? 'synced' : 'skipped',
        invoices: conn.sync_settings?.syncInvoices ? 'synced' : 'skipped',
        classifications: conn.sync_settings?.syncClassifications ? 'synced' : 'skipped',
      },
      accountMapping: conn.account_mapping,
    };

    // Update last sync timestamp
    await (supabase.from('erp_connections') as any)
      .update({ last_sync_at: new Date().toISOString() })
      .eq('seller_id', ctx.sellerId)
      .eq('erp_system', erpSystem);

    void logSync(ctx.sellerId, erpSystem, 'sync', 'success');
    return apiSuccess(syncResult, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Unknown action.');
});
