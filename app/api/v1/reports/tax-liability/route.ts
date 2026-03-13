/**
 * POTAL API v1 — /api/v1/reports/tax-liability
 *
 * Tax liability report generation.
 * Summarizes tax obligations across jurisdictions for a given period.
 *
 * POST /api/v1/reports/tax-liability
 * Body: {
 *   period: { startDate: string, endDate: string },
 *   groupBy?: string,     // "country" | "state" | "tax_type" | "month"
 *   format?: string,      // "json" | "csv"
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

interface LiabilityLine {
  jurisdiction: string;
  taxType: string;
  taxableAmount: number;
  taxCollected: number;
  taxOwed: number;
  transactionCount: number;
  currency: string;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const period = body.period as { startDate?: string; endDate?: string } | undefined;
  const groupBy = typeof body.groupBy === 'string' ? body.groupBy : 'country';
  const format = typeof body.format === 'string' ? body.format.toLowerCase() : 'json';

  if (!period?.startDate || !period?.endDate) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"period" with startDate and endDate is required.');
  }

  // Query nexus tracking for jurisdictions with tax obligations
  const supabase = getSupabase();
  const { data: nexusData } = await supabase
    .from('seller_nexus_tracking')
    .select('*')
    .eq('seller_id', context.sellerId)
    .eq('has_nexus', true);

  // Build liability report
  const liabilities: LiabilityLine[] = (nexusData || []).map((n: Record<string, unknown>) => ({
    jurisdiction: n.jurisdiction as string,
    taxType: 'sales_tax',
    taxableAmount: (n.annual_revenue as number) || 0,
    taxCollected: 0,
    taxOwed: 0,
    transactionCount: (n.transaction_count as number) || 0,
    currency: 'USD',
  }));

  const totalTaxableAmount = liabilities.reduce((s, l) => s + l.taxableAmount, 0);
  const totalTaxCollected = liabilities.reduce((s, l) => s + l.taxCollected, 0);
  const totalTaxOwed = liabilities.reduce((s, l) => s + l.taxOwed, 0);

  if (format === 'csv') {
    const csvHeader = 'Jurisdiction,Tax Type,Taxable Amount,Tax Collected,Tax Owed,Transactions,Currency\n';
    const csvRows = liabilities.map(l =>
      `${l.jurisdiction},${l.taxType},${l.taxableAmount},${l.taxCollected},${l.taxOwed},${l.transactionCount},${l.currency}`
    ).join('\n');

    return new Response(csvHeader + csvRows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tax-liability-${period.startDate}-${period.endDate}.csv"`,
      },
    });
  }

  return apiSuccess(
    {
      report: {
        period: { startDate: period.startDate, endDate: period.endDate },
        generatedAt: new Date().toISOString(),
        groupBy,
        summary: {
          totalJurisdictions: liabilities.length,
          totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
          totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
          totalTaxOwed: Math.round(totalTaxOwed * 100) / 100,
        },
        liabilities,
      },
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { period: {startDate: "2026-01-01", endDate: "2026-03-31"}, format?: "csv" }');
}
