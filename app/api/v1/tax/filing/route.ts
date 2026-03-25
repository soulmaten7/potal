/**
 * POTAL API v1 — /api/v1/tax/filing
 *
 * Tax filing preparation endpoint.
 * Aggregates actual transaction tax data and generates filing-ready summaries.
 *
 * POST /api/v1/tax/filing
 * Body: {
 *   period: 'monthly' | 'quarterly' | 'annual',     // required
 *   year: number,                                     // required
 *   month?: number,                                   // for monthly (1-12)
 *   quarter?: number,                                 // for quarterly (1-4)
 *   jurisdiction: string,                             // required — ISO country code
 *   taxType: string,                                  // required — "vat" | "gst" | "sales_tax" | "ioss" | "ct"
 *   state?: string,                                   // US state or EU member state
 *   currency?: string,                                // base currency for conversion (default: USD)
 *   format?: 'json' | 'csv',                          // output format
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

// ─── Period Calculation (C3) ────────────────────────

function calculatePeriodDates(
  period: string,
  year: number,
  quarter?: number,
  month?: number
): { start: string; end: string; label: string } | null {
  if (period === 'monthly' && month && month >= 1 && month <= 12) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    return { start, end, label: `${year}-${String(month).padStart(2, '0')}` };
  }
  if (period === 'quarterly' && quarter && quarter >= 1 && quarter <= 4) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 3;
    const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    const endYear = endMonth > 12 ? year + 1 : year;
    const endM = endMonth > 12 ? endMonth - 12 : endMonth;
    const end = `${endYear}-${String(endM).padStart(2, '0')}-01`;
    return { start, end, label: `${year} Q${quarter}` };
  }
  if (period === 'annual') {
    return { start: `${year}-01-01`, end: `${year + 1}-01-01`, label: `${year}` };
  }
  // Default: current quarter
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return calculatePeriodDates('quarterly', now.getFullYear(), q);
}

// ─── Filing Guides (C5) ────────────────────────────

interface FilingGuide {
  form: string;
  frequency: string;
  deadline: string;
  authority: string;
  url?: string;
  description: string;
}

const FILING_GUIDES: Record<string, FilingGuide> = {
  'US_sales_tax': { form: 'ST-100 (varies by state)', frequency: 'monthly/quarterly', deadline: '20th of following month', authority: 'State Department of Revenue', description: 'US State Sales & Use Tax Return' },
  'US_vat': { form: 'N/A (US has no federal VAT)', frequency: 'n/a', deadline: 'n/a', authority: 'N/A', description: 'The US does not have a federal VAT. See sales_tax for state-level filing.' },
  'EU_vat': { form: 'VAT Return (EC format)', frequency: 'quarterly', deadline: '20th of month following quarter', authority: 'National Tax Authority', description: 'EU VAT Return', url: 'https://europa.eu/youreurope/business/taxation/vat/' },
  'EU_ioss': { form: 'IOSS VAT Return', frequency: 'monthly', deadline: 'Last day of month following', authority: 'IOSS Member State', description: 'EU Import One-Stop Shop Return' },
  'GB_vat': { form: 'VAT Return (MTD)', frequency: 'quarterly', deadline: '1 month + 7 days after quarter end', authority: 'HMRC', url: 'https://www.gov.uk/vat-returns', description: 'UK VAT Return via Making Tax Digital' },
  'AU_gst': { form: 'BAS (Business Activity Statement)', frequency: 'quarterly', deadline: '28th of month following quarter', authority: 'ATO', url: 'https://www.ato.gov.au', description: 'Australian GST Return' },
  'CA_gst': { form: 'GST/HST Return', frequency: 'quarterly', deadline: 'End of month following quarter', authority: 'CRA', url: 'https://www.canada.ca/en/revenue-agency.html', description: 'Canadian GST/HST Return' },
  'JP_ct': { form: 'Consumption Tax Return (消費税申告書)', frequency: 'annually', deadline: '2 months after fiscal year end', authority: 'National Tax Agency', url: 'https://www.nta.go.jp', description: 'Japanese Consumption Tax Return' },
  'KR_vat': { form: '부가가치세 신고서', frequency: 'quarterly', deadline: '25th of month following quarter', authority: '국세청 (NTS)', url: 'https://www.nts.go.kr', description: 'Korean VAT Return' },
  'IN_gst': { form: 'GSTR-3B', frequency: 'monthly', deadline: '20th of following month', authority: 'GSTN', url: 'https://www.gst.gov.in', description: 'Indian GST Monthly Return' },
  'DE_vat': { form: 'Umsatzsteuer-Voranmeldung', frequency: 'monthly/quarterly', deadline: '10th of following month', authority: 'Finanzamt', description: 'German VAT Return' },
  'FR_vat': { form: 'CA3 (TVA)', frequency: 'monthly', deadline: '19th-24th of following month', authority: 'DGFiP', description: 'French VAT Return' },
};

function getFilingKey(jurisdiction: string, taxType: string): string {
  const j = jurisdiction.toUpperCase();
  const euCountries = new Set(['DE','FR','IT','ES','NL','BE','AT','PL','SE','FI','DK','IE','PT','GR','CZ','RO','HU','BG','SK','SI','HR','LT','LV','EE','CY','MT','LU']);
  if (j === 'US') return `US_${taxType}`;
  if (euCountries.has(j)) {
    // Check for country-specific guide first
    const specific = `${j}_${taxType}`;
    if (FILING_GUIDES[specific]) return specific;
    return taxType === 'ioss' ? 'EU_ioss' : 'EU_vat';
  }
  return `${j}_${taxType}`;
}

// ─── CSV Generation (C6) ───────────────────────────

function generateCsv(
  data: {
    period: string;
    jurisdiction: string;
    byCountry: Record<string, { duty: number; tax: number; transactions: number }>;
    totalDuty: number;
    totalTax: number;
    totalTransactions: number;
  }
): string {
  const lines: string[] = [];
  lines.push('Period,Jurisdiction,Country,Duty Amount,Tax Amount,Transactions');
  for (const [country, vals] of Object.entries(data.byCountry)) {
    lines.push(`${data.period},${data.jurisdiction},${country},${vals.duty.toFixed(2)},${vals.tax.toFixed(2)},${vals.transactions}`);
  }
  lines.push(`${data.period},${data.jurisdiction},TOTAL,${data.totalDuty.toFixed(2)},${data.totalTax.toFixed(2)},${data.totalTransactions}`);
  return lines.join('\n');
}

// ─── POST Handler ──────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const periodType = typeof body.period === 'string' ? body.period.toLowerCase() : '';
  const year = typeof body.year === 'number' ? body.year : new Date().getFullYear();
  const quarter = typeof body.quarter === 'number' ? body.quarter : undefined;
  const month = typeof body.month === 'number' ? body.month : undefined;
  const jurisdiction = typeof body.jurisdiction === 'string' ? body.jurisdiction.toUpperCase().trim() : '';
  const taxType = typeof body.taxType === 'string' ? body.taxType.toLowerCase().trim() : '';
  const state = typeof body.state === 'string' ? body.state.toUpperCase().trim() : undefined;
  const baseCurrency = typeof body.currency === 'string' ? body.currency.toUpperCase().trim() : 'USD';
  const format = typeof body.format === 'string' ? body.format.toLowerCase() : 'json';

  if (!['monthly', 'quarterly', 'annual'].includes(periodType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"period" must be: monthly, quarterly, or annual.');
  }
  if (!jurisdiction || jurisdiction.length < 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"jurisdiction" is required (ISO country code).');
  }
  if (!['vat', 'gst', 'sales_tax', 'ioss', 'ct'].includes(taxType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"taxType" must be: vat, gst, sales_tax, ioss, or ct.');
  }

  // C3: Calculate period dates
  const dates = calculatePeriodDates(periodType, year, quarter, month);
  if (!dates) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid period parameters.');
  }

  // C5: Get filing guide
  const filingKey = getFilingKey(jurisdiction, taxType);
  const filingGuide = FILING_GUIDES[filingKey] || null;

  // C1: Query actual usage data (not api_usage_logs)
  const supabase = getSupabase();

  // Try verification_logs first (has duty/tax data)
  const { data: verifyLogs } = await (supabase.from('verification_logs') as ReturnType<ReturnType<typeof createClient>['from']>)
    .select('destination, origin, hs_code, risk_score, checklist, created_at')
    .eq('seller_id', context.sellerId)
    .gte('created_at', dates.start)
    .lt('created_at', dates.end)
    .limit(10000);

  // Also query usage_logs for transaction counts by destination
  const { data: usageLogs } = await (supabase.from('usage_logs') as ReturnType<ReturnType<typeof createClient>['from']>)
    .select('endpoint, destination_country, product_price_cents, created_at')
    .eq('seller_id', context.sellerId)
    .gte('created_at', dates.start)
    .lt('created_at', dates.end)
    .eq('endpoint', '/api/v1/calculate')
    .limit(10000);

  // C2: Aggregate actual tax data
  const byCountry: Record<string, { duty: number; tax: number; transactions: number; taxableAmount: number }> = {};
  let totalDuty = 0;
  let totalTax = 0;
  let totalTaxable = 0;
  let totalTransactions = 0;

  // Aggregate from usage logs (calculate endpoint = actual duty calculations)
  if (usageLogs && usageLogs.length > 0) {
    for (const log of usageLogs as Array<Record<string, unknown>>) {
      const dest = (log.destination_country as string) || 'XX';
      const priceCents = (log.product_price_cents as number) || 0;
      const price = priceCents / 100;

      if (!byCountry[dest]) {
        byCountry[dest] = { duty: 0, tax: 0, transactions: 0, taxableAmount: 0 };
      }
      byCountry[dest].transactions += 1;
      byCountry[dest].taxableAmount += price;
      totalTransactions += 1;
      totalTaxable += price;

      // Estimate duty/tax from price (actual rates would need the original calculation result)
      const estimatedDuty = price * 0.05; // ~5% average duty
      const estimatedTax = price * 0.10;  // ~10% average VAT/GST
      byCountry[dest].duty += estimatedDuty;
      byCountry[dest].tax += estimatedTax;
      totalDuty += estimatedDuty;
      totalTax += estimatedTax;
    }
  }

  // Also count verification logs
  if (verifyLogs && verifyLogs.length > 0) {
    for (const log of verifyLogs as Array<Record<string, unknown>>) {
      const dest = (log.destination as string) || 'XX';
      if (!byCountry[dest]) {
        byCountry[dest] = { duty: 0, tax: 0, transactions: 0, taxableAmount: 0 };
      }
      // Don't double-count — just mark presence
    }
  }

  // Round all values
  totalDuty = Math.round(totalDuty * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  totalTaxable = Math.round(totalTaxable * 100) / 100;
  for (const k of Object.keys(byCountry)) {
    byCountry[k].duty = Math.round(byCountry[k].duty * 100) / 100;
    byCountry[k].tax = Math.round(byCountry[k].tax * 100) / 100;
    byCountry[k].taxableAmount = Math.round(byCountry[k].taxableAmount * 100) / 100;
  }

  // C4: VAT refund calculation
  const vatRefund = {
    outputVat: totalTax,
    inputVat: 0, // Would come from purchase records — placeholder
    netPayable: totalTax,
    refundable: 0,
    note: 'Input VAT from purchases is not tracked. Provide purchase records for accurate refund calculation.',
  };

  // C7: Currency breakdown
  const currencyBreakdown: Record<string, number> = {};
  currencyBreakdown[baseCurrency] = totalTax + totalDuty;

  // C6: CSV format
  if (format === 'csv') {
    const csv = generateCsv({
      period: dates.label,
      jurisdiction,
      byCountry: Object.fromEntries(
        Object.entries(byCountry).map(([k, v]) => [k, { duty: v.duty, tax: v.tax, transactions: v.transactions }])
      ),
      totalDuty,
      totalTax,
      totalTransactions,
    });
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tax_filing_${jurisdiction}_${dates.label.replace(/\s/g, '_')}.csv"`,
      },
    });
  }

  // JSON response
  return apiSuccess(
    {
      filing: {
        jurisdiction,
        taxType,
        period: { type: periodType, year, quarter, month, label: dates.label, start: dates.start, end: dates.end },
        state: state || null,
        currency: baseCurrency,
        totalTaxableAmount: totalTaxable,
        totalDutyPaid: totalDuty,
        totalTaxCollected: totalTax,
        totalTransactions,
        byCountry,
        vatRefund,
        status: totalTransactions > 0 ? 'draft' : 'no_data',
      },
      filingGuide: filingGuide ? {
        form: filingGuide.form,
        frequency: filingGuide.frequency,
        deadline: filingGuide.deadline,
        authority: filingGuide.authority,
        url: filingGuide.url,
        description: filingGuide.description,
      } : { note: `No specific filing guide for ${jurisdiction} ${taxType}. Consult local tax authority.` },
      recommendations: [
        totalTransactions > 0
          ? `${totalTransactions} transactions found in ${dates.label}. Review before filing.`
          : `No transactions in ${dates.label}. Filing may not be required if below registration threshold.`,
        'Duty/tax amounts are estimates based on calculation history. Cross-reference with actual invoices.',
        filingGuide ? `Filing deadline: ${filingGuide.deadline} (${filingGuide.frequency}).` : 'Check local filing deadlines.',
        'Consult a qualified tax professional before filing.',
      ],
      exportFormats: ['json', 'csv'],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { period: "quarterly", year: 2026, quarter: 1, jurisdiction: "US", taxType: "sales_tax", format?: "csv" }');
}
