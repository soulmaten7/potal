/**
 * POTAL API v1 — /api/v1/vat-report
 *
 * VAT/GST Report API — monthly country summaries for sellers.
 *
 * GET  /api/v1/vat-report?month=2026-03&format=json
 * POST /api/v1/vat-report { month: "2026-03", countries?: ["DE", "FR"], format?: "json"|"csv" }
 *
 * Returns monthly VAT/GST summaries by country for the seller's transactions.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

interface VatCountrySummary {
  country: string;
  countryName: string;
  vatLabel: string;
  vatRate: number;
  transactionCount: number;
  totalProductValue: number;
  totalDuty: number;
  totalVat: number;
  totalLandedCost: number;
  currency: string;
}

interface VatReport {
  month: string;
  sellerId: string;
  generatedAt: string;
  totalTransactions: number;
  totalVatCollected: number;
  countries: VatCountrySummary[];
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toCsv(report: VatReport): string {
  const headers = ['Country', 'Country Name', 'VAT Label', 'VAT Rate', 'Transactions', 'Product Value', 'Duty', 'VAT', 'Landed Cost', 'Currency'];
  const rows = report.countries.map(c => [
    c.country,
    c.countryName,
    c.vatLabel,
    (c.vatRate * 100).toFixed(1) + '%',
    c.transactionCount,
    c.totalProductValue.toFixed(2),
    c.totalDuty.toFixed(2),
    c.totalVat.toFixed(2),
    c.totalLandedCost.toFixed(2),
    c.currency,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const month = typeof body.month === 'string' ? body.month.trim() : '';
  const countries = Array.isArray(body.countries) ? body.countries.map((c: unknown) => String(c).toUpperCase()) : undefined;
  const format = typeof body.format === 'string' ? body.format : 'json';

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'month must be in YYYY-MM format (e.g. "2026-03").');
  }

  const supabase = getSupabase();
  if (!supabase) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');
  }

  // Query API usage logs for the seller's transactions in the given month
  const startDate = `${month}-01`;
  const endMonth = parseInt(month.split('-')[1]) + 1;
  const endYear = endMonth > 12 ? parseInt(month.split('-')[0]) + 1 : parseInt(month.split('-')[0]);
  const endMonthStr = endMonth > 12 ? '01' : String(endMonth).padStart(2, '0');
  const endDate = `${endYear}-${endMonthStr}-01`;

  try {
    const result: any = await supabase
      .from('api_usage_logs' as any)
      .select('destination_country, vat_amount, duty_amount, product_price, total_landed_cost, vat_rate, vat_label, currency')
      .eq('seller_id', context.sellerId)
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .eq('endpoint', '/api/v1/calculate');

    const rows = (result.data || []) as any[];

    // Aggregate by country
    const countryMap = new Map<string, VatCountrySummary>();

    for (const row of rows) {
      const cc = row.destination_country || 'XX';
      if (countries && !countries.includes(cc)) continue;

      if (!countryMap.has(cc)) {
        countryMap.set(cc, {
          country: cc,
          countryName: cc, // simplified — could look up full name
          vatLabel: row.vat_label || 'VAT',
          vatRate: row.vat_rate || 0,
          transactionCount: 0,
          totalProductValue: 0,
          totalDuty: 0,
          totalVat: 0,
          totalLandedCost: 0,
          currency: row.currency || 'USD',
        });
      }

      const summary = countryMap.get(cc)!;
      summary.transactionCount++;
      summary.totalProductValue += parseFloat(row.product_price) || 0;
      summary.totalDuty += parseFloat(row.duty_amount) || 0;
      summary.totalVat += parseFloat(row.vat_amount) || 0;
      summary.totalLandedCost += parseFloat(row.total_landed_cost) || 0;
    }

    const countrySummaries = [...countryMap.values()].sort((a, b) => b.totalVat - a.totalVat);

    const report: VatReport = {
      month,
      sellerId: context.sellerId,
      generatedAt: new Date().toISOString(),
      totalTransactions: countrySummaries.reduce((sum, c) => sum + c.transactionCount, 0),
      totalVatCollected: Math.round(countrySummaries.reduce((sum, c) => sum + c.totalVat, 0) * 100) / 100,
      countries: countrySummaries,
    };

    if (format === 'csv') {
      return new Response(toCsv(report), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vat-report-${month}.csv"`,
        },
      });
    }

    return apiSuccess(report, {
      sellerId: context.sellerId,
      plan: context.planId,
    });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to generate VAT report.');
  }
});

export async function GET(req: NextRequest) {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { month: "2026-03", countries?: ["DE", "FR"], format?: "json"|"csv" }.'
  );
}
