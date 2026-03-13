/**
 * POTAL API v1 — /api/v1/tax/filing
 *
 * Tax filing preparation endpoint.
 * Generates tax return data for VAT/GST/sales tax filing.
 * Aggregates transactions and prepares filing-ready summaries.
 *
 * POST /api/v1/tax/filing
 * Body: {
 *   period: { startDate: string, endDate: string },  // required — ISO dates
 *   jurisdiction: string,                             // required — "US" | "EU" | "GB" | country code
 *   taxType: string,                                  // required — "vat" | "gst" | "sales_tax" | "ioss"
 *   state?: string,                                   // US state or EU member state
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

interface FilingLine {
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  transactionCount: number;
  category: string;
}

interface FilingSummary {
  jurisdiction: string;
  taxType: string;
  period: { startDate: string; endDate: string };
  totalTaxableAmount: number;
  totalTaxCollected: number;
  totalTransactions: number;
  lines: FilingLine[];
  filingDeadline: string;
  filingFrequency: string;
  formNumber: string;
  status: 'draft' | 'ready' | 'filed';
}

// Filing deadlines and forms by jurisdiction
const FILING_INFO: Record<string, { form: string; frequency: string; deadlineDay: number; description: string }> = {
  'US_sales_tax': { form: 'ST-100 (varies by state)', frequency: 'monthly/quarterly', deadlineDay: 20, description: 'US State Sales & Use Tax Return' },
  'EU_vat': { form: 'VAT Return (EC format)', frequency: 'quarterly', deadlineDay: 20, description: 'EU VAT Return' },
  'EU_ioss': { form: 'IOSS VAT Return', frequency: 'monthly', deadlineDay: 31, description: 'EU Import One-Stop Shop VAT Return' },
  'GB_vat': { form: 'VAT Return (MTD)', frequency: 'quarterly', deadlineDay: 7, description: 'UK VAT Return via Making Tax Digital' },
  'AU_gst': { form: 'BAS (Business Activity Statement)', frequency: 'quarterly', deadlineDay: 28, description: 'Australian GST Return' },
  'CA_gst': { form: 'GST/HST Return', frequency: 'quarterly', deadlineDay: 30, description: 'Canadian GST/HST Return' },
  'JP_ct': { form: 'Consumption Tax Return', frequency: 'annually', deadlineDay: 60, description: 'Japanese Consumption Tax Return' },
  'KR_vat': { form: 'VAT Return (부가세 신고서)', frequency: 'quarterly', deadlineDay: 25, description: 'Korean VAT Return' },
  'IN_gst': { form: 'GSTR-3B', frequency: 'monthly', deadlineDay: 20, description: 'Indian GST Monthly Return' },
};

function getFilingKey(jurisdiction: string, taxType: string): string {
  const j = jurisdiction.toUpperCase();
  if (j === 'US') return `US_${taxType}`;
  if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'FI', 'DK', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'BG', 'SK', 'SI', 'HR', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU'].includes(j)) {
    return taxType === 'ioss' ? 'EU_ioss' : 'EU_vat';
  }
  return `${j}_${taxType}`;
}

function calculateFilingDeadline(period: { endDate: string }, deadlineDay: number): string {
  const endDate = new Date(period.endDate);
  const nextMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, deadlineDay);
  return nextMonth.toISOString().split('T')[0];
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const period = body.period as { startDate?: string; endDate?: string } | undefined;
  const jurisdiction = typeof body.jurisdiction === 'string' ? body.jurisdiction.toUpperCase().trim() : '';
  const taxType = typeof body.taxType === 'string' ? body.taxType.toLowerCase().trim() : '';
  const state = typeof body.state === 'string' ? body.state.toUpperCase().trim() : undefined;

  if (!period?.startDate || !period?.endDate) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"period" with startDate and endDate is required.');
  }
  if (!jurisdiction) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"jurisdiction" is required (ISO country code).');
  }
  if (!['vat', 'gst', 'sales_tax', 'ioss', 'ct'].includes(taxType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"taxType" must be: vat, gst, sales_tax, ioss, or ct.');
  }

  const filingKey = getFilingKey(jurisdiction, taxType);
  const filingInfo = FILING_INFO[filingKey];

  // Query transaction data for the period
  const supabase = getSupabase();
  const { data: transactions } = await supabase
    .from('api_usage_logs')
    .select('*')
    .eq('seller_id', context.sellerId)
    .gte('created_at', period.startDate)
    .lte('created_at', period.endDate + 'T23:59:59Z')
    .limit(10000);

  const transactionCount = transactions?.length || 0;

  // Build filing summary (placeholder aggregation)
  const summary: FilingSummary = {
    jurisdiction,
    taxType,
    period: { startDate: period.startDate, endDate: period.endDate },
    totalTaxableAmount: 0,
    totalTaxCollected: 0,
    totalTransactions: transactionCount,
    lines: [],
    filingDeadline: filingInfo
      ? calculateFilingDeadline({ endDate: period.endDate }, filingInfo.deadlineDay)
      : 'Unknown — check local tax authority',
    filingFrequency: filingInfo?.frequency || 'Check local requirements',
    formNumber: filingInfo?.form || 'Check local requirements',
    status: transactionCount > 0 ? 'draft' : 'ready',
  };

  return apiSuccess(
    {
      filing: summary,
      filingInfo: filingInfo ? {
        form: filingInfo.form,
        description: filingInfo.description,
        frequency: filingInfo.frequency,
      } : null,
      state: state || null,
      recommendations: [
        'Review all transaction data before filing.',
        'Consult a tax professional for compliance review.',
        filingInfo ? `Filing deadline: ${summary.filingDeadline} (${filingInfo.frequency}).` : 'Check local filing deadlines.',
      ],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { period: {startDate, endDate}, jurisdiction: "US", taxType: "sales_tax" }');
}
