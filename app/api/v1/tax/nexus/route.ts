/**
 * POTAL API v1 — /api/v1/tax/nexus
 *
 * Nexus (tax obligation) tracking endpoint.
 * Tracks where a seller has established tax nexus (economic or physical)
 * and determines tax collection obligations by jurisdiction.
 *
 * GET  — List seller's nexus statuses
 * POST — Check/update nexus for a jurisdiction
 *
 * POST Body: {
 *   jurisdiction: string,       // US state code or country code
 *   annualRevenue?: number,     // Revenue in this jurisdiction
 *   transactionCount?: number,  // Number of transactions
 *   hasPhysicalPresence?: boolean,
 *   hasEmployees?: boolean,
 *   hasInventory?: boolean,
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

// US State Economic Nexus Thresholds (post-Wayfair, 2026)
const US_NEXUS_THRESHOLDS: Record<string, { revenue: number; transactions: number | null; note: string }> = {
  AL: { revenue: 250000, transactions: null, note: 'Revenue threshold only' },
  AK: { revenue: 100000, transactions: 200, note: 'No state sales tax, but local nexus applies' },
  AZ: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  AR: { revenue: 100000, transactions: 200, note: 'Either threshold triggers nexus' },
  CA: { revenue: 500000, transactions: null, note: 'Revenue threshold only (highest in US)' },
  CO: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  CT: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  FL: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  GA: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  HI: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  ID: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  IL: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  IN: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  IA: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  KS: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  KY: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  LA: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  ME: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  MD: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  MA: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  MI: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  MN: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  MS: { revenue: 250000, transactions: null, note: 'Revenue threshold only' },
  MO: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  NE: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  NV: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  NJ: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  NM: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  NY: { revenue: 500000, transactions: 100, note: 'Both thresholds must be met' },
  NC: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  ND: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  OH: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  OK: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  PA: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  RI: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  SC: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  SD: { revenue: 100000, transactions: 200, note: 'Either threshold (Wayfair state)' },
  TN: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  TX: { revenue: 500000, transactions: null, note: 'Revenue threshold only' },
  UT: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  VT: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  VA: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  WA: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  WI: { revenue: 100000, transactions: null, note: 'Revenue threshold only' },
  WV: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  WY: { revenue: 100000, transactions: 200, note: 'Either threshold' },
  DC: { revenue: 100000, transactions: 200, note: 'Either threshold' },
};

// No sales tax states
const NO_SALES_TAX = new Set(['OR', 'MT', 'NH', 'DE']);

function checkNexus(
  jurisdiction: string,
  annualRevenue?: number,
  transactionCount?: number,
  hasPhysicalPresence?: boolean,
): { hasNexus: boolean; reason: string; threshold?: { revenue: number; transactions: number | null } } {
  const j = jurisdiction.toUpperCase();

  // Physical presence always creates nexus
  if (hasPhysicalPresence) {
    return { hasNexus: true, reason: 'Physical presence (office, warehouse, employees, or inventory) creates nexus.' };
  }

  // No sales tax states
  if (NO_SALES_TAX.has(j)) {
    return { hasNexus: false, reason: `${j} has no state sales tax.` };
  }

  const threshold = US_NEXUS_THRESHOLDS[j];
  if (!threshold) {
    return { hasNexus: false, reason: `No nexus threshold data for "${j}". May be a non-US jurisdiction.` };
  }

  const revenueExceeded = annualRevenue !== undefined && annualRevenue >= threshold.revenue;
  const transactionsExceeded = threshold.transactions !== null && transactionCount !== undefined && transactionCount >= threshold.transactions;

  // NY requires BOTH thresholds
  if (j === 'NY') {
    if (revenueExceeded && transactionsExceeded) {
      return { hasNexus: true, reason: `NY requires both: revenue ≥$${threshold.revenue.toLocaleString()} AND ≥${threshold.transactions} transactions. Both met.`, threshold };
    }
    return { hasNexus: false, reason: `NY requires both thresholds. Revenue: ${revenueExceeded ? '✓' : '✗'}, Transactions: ${transactionsExceeded ? '✓' : '✗'}.`, threshold };
  }

  // Most states: EITHER threshold
  if (revenueExceeded || transactionsExceeded) {
    const reasons = [];
    if (revenueExceeded) reasons.push(`revenue $${annualRevenue?.toLocaleString()} ≥ $${threshold.revenue.toLocaleString()}`);
    if (transactionsExceeded) reasons.push(`transactions ${transactionCount} ≥ ${threshold.transactions}`);
    return { hasNexus: true, reason: `Economic nexus established: ${reasons.join(' and ')}. ${threshold.note}`, threshold };
  }

  return { hasNexus: false, reason: `Below nexus thresholds. Revenue threshold: $${threshold.revenue.toLocaleString()}${threshold.transactions ? `, Transaction threshold: ${threshold.transactions}` : ''}.`, threshold };
}

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('seller_nexus_tracking')
    .select('*')
    .eq('seller_id', context.sellerId)
    .order('jurisdiction');

  return apiSuccess(
    {
      nexusStatuses: (data || []).map((n: Record<string, unknown>) => ({
        jurisdiction: n.jurisdiction,
        hasNexus: n.has_nexus,
        reason: n.reason,
        annualRevenue: n.annual_revenue,
        transactionCount: n.transaction_count,
        lastChecked: n.updated_at,
      })),
      total: (data || []).length,
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

  const jurisdiction = typeof body.jurisdiction === 'string' ? body.jurisdiction.toUpperCase().trim() : '';
  const annualRevenue = typeof body.annualRevenue === 'number' ? body.annualRevenue : undefined;
  const transactionCount = typeof body.transactionCount === 'number' ? body.transactionCount : undefined;
  const hasPhysicalPresence = typeof body.hasPhysicalPresence === 'boolean' ? body.hasPhysicalPresence : false;
  const hasEmployees = typeof body.hasEmployees === 'boolean' ? body.hasEmployees : false;
  const hasInventory = typeof body.hasInventory === 'boolean' ? body.hasInventory : false;

  if (!jurisdiction) return apiError(ApiErrorCode.BAD_REQUEST, '"jurisdiction" is required.');

  const physicalPresence = hasPhysicalPresence || hasEmployees || hasInventory;
  const result = checkNexus(jurisdiction, annualRevenue, transactionCount, physicalPresence);

  // Save to DB
  const supabase = getSupabase();
  await supabase
    .from('seller_nexus_tracking')
    .upsert({
      seller_id: context.sellerId,
      jurisdiction,
      has_nexus: result.hasNexus,
      reason: result.reason,
      annual_revenue: annualRevenue,
      transaction_count: transactionCount,
      has_physical_presence: physicalPresence,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'seller_id,jurisdiction' });

  return apiSuccess(
    {
      jurisdiction,
      ...result,
      physicalPresence: { hasPhysicalPresence, hasEmployees, hasInventory },
      annualRevenue: annualRevenue || null,
      transactionCount: transactionCount || null,
      obligations: result.hasNexus ? [
        'Register for sales tax in this jurisdiction',
        'Collect applicable sales tax on transactions',
        'File and remit sales tax returns per filing schedule',
      ] : [],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
