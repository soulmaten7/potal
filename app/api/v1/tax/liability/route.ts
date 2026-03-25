/**
 * POTAL API v1 — /api/v1/tax/liability
 *
 * F104: Tax Liability Dashboard.
 * Aggregates tax obligations by country from transaction data.
 * Tracks filing deadlines and alerts.
 *
 * GET /api/v1/tax/liability?period=2026-Q1
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Types ──────────────────────────────────────────

interface CountryLiability {
  country: string;
  dutyOwed: number;
  vatOwed: number;
  totalOwed: number;
  transactionCount: number;
  totalValue: number;
}

interface FilingDeadline {
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  daysAfterPeriod: number;
  name: string;
  authority: string;
}

interface UpcomingDeadline {
  country: string;
  deadlineName: string;
  authority: string;
  dueDate: string;
  daysRemaining: number;
  amountOwed: number;
  status: 'upcoming' | 'due_soon' | 'overdue';
}

// ─── Filing Deadlines ───────────────────────────────

const FILING_DEADLINES: Record<string, FilingDeadline> = {
  US: { frequency: 'quarterly', daysAfterPeriod: 30, name: 'Sales Tax Return', authority: 'State DOR' },
  GB: { frequency: 'quarterly', daysAfterPeriod: 37, name: 'MTD VAT Return', authority: 'HMRC' },
  DE: { frequency: 'monthly', daysAfterPeriod: 10, name: 'Umsatzsteuervoranmeldung', authority: 'Finanzamt' },
  FR: { frequency: 'monthly', daysAfterPeriod: 15, name: 'CA3 VAT Return', authority: 'DGFiP' },
  AU: { frequency: 'quarterly', daysAfterPeriod: 28, name: 'Business Activity Statement', authority: 'ATO' },
  CA: { frequency: 'quarterly', daysAfterPeriod: 30, name: 'GST/HST Return', authority: 'CRA' },
  JP: { frequency: 'annual', daysAfterPeriod: 60, name: '消費税確定申告', authority: 'NTA' },
  KR: { frequency: 'semi-annual', daysAfterPeriod: 25, name: '부가가치세 신고', authority: 'NTS' },
  IN: { frequency: 'quarterly', daysAfterPeriod: 30, name: 'GSTR-3B', authority: 'GST Council' },
  SG: { frequency: 'quarterly', daysAfterPeriod: 30, name: 'GST F5 Return', authority: 'IRAS' },
  EU: { frequency: 'quarterly', daysAfterPeriod: 30, name: 'OSS VAT Return', authority: 'EU Member State' },
};

// ─── Period Parsing ─────────────────────────────────

function parsePeriod(period: string): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();

  // Format: "2026-Q1", "2026-01", "2026", "Q1", "last-30d"
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const y = parseInt(period.substring(0, 4));
    const q = parseInt(period.charAt(6));
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString(), label: period };
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString(), label: period };
  }
  if (/^\d{4}$/.test(period)) {
    const y = parseInt(period);
    return { start: new Date(y, 0, 1).toISOString(), end: new Date(y, 11, 31, 23, 59, 59).toISOString(), label: period };
  }
  // Default: current quarter
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(year, q * 3, 1);
  const end = new Date(year, q * 3 + 3, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString(), label: `${year}-Q${q + 1}` };
}

// ─── Deadline Calculation ───────────────────────────

function getUpcomingDeadlines(liabilities: CountryLiability[], periodEnd: string): UpcomingDeadline[] {
  const deadlines: UpcomingDeadline[] = [];
  const now = new Date();

  for (const liability of liabilities) {
    if (liability.totalOwed <= 0) continue;
    const deadline = FILING_DEADLINES[liability.country];
    if (!deadline) continue;

    const periodEndDate = new Date(periodEnd);
    const dueDate = new Date(periodEndDate);
    dueDate.setDate(dueDate.getDate() + deadline.daysAfterPeriod);

    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);

    deadlines.push({
      country: liability.country,
      deadlineName: deadline.name,
      authority: deadline.authority,
      dueDate: dueDate.toISOString().split('T')[0],
      daysRemaining,
      amountOwed: liability.totalOwed,
      status: daysRemaining < 0 ? 'overdue' : daysRemaining <= 7 ? 'due_soon' : 'upcoming',
    });
  }

  return deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// ─── GET Handler ────────────────────────────────────

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const period = url.searchParams.get('period') || '';

  const { start, end, label } = parsePeriod(period);

  const supabase = getSupabase();
  const liabilities: CountryLiability[] = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('health_check_logs')
        .select('checks, checked_at')
        .gte('checked_at', start)
        .lte('checked_at', end)
        .order('checked_at', { ascending: false })
        .limit(500);

      // Aggregate from logged calculations
      const byCountry = new Map<string, CountryLiability>();

      if (data) {
        for (const row of data) {
          const checks = row.checks as Array<Record<string, unknown>> | null;
          if (!Array.isArray(checks)) continue;
          for (const check of checks) {
            if (check.sellerId !== context.sellerId) continue;
            const country = String(check.destinationCountry || check.country || '');
            if (!country || country.length !== 2) continue;

            const existing = byCountry.get(country) || {
              country, dutyOwed: 0, vatOwed: 0, totalOwed: 0, transactionCount: 0, totalValue: 0,
            };
            const duty = Number(check.dutyAmount || check.duties_total || 0);
            const vat = Number(check.vatAmount || check.taxes_total || 0);
            const value = Number(check.declaredValue || check.productValue || 0);

            existing.dutyOwed = Math.round((existing.dutyOwed + duty) * 100) / 100;
            existing.vatOwed = Math.round((existing.vatOwed + vat) * 100) / 100;
            existing.totalOwed = Math.round((existing.dutyOwed + existing.vatOwed) * 100) / 100;
            existing.transactionCount += 1;
            existing.totalValue = Math.round((existing.totalValue + value) * 100) / 100;
            byCountry.set(country, existing);
          }
        }
      }

      liabilities.push(...Array.from(byCountry.values()).sort((a, b) => b.totalOwed - a.totalOwed));
    } catch { /* empty liabilities */ }
  }

  const deadlines = getUpcomingDeadlines(liabilities, end);
  const totalOwed = liabilities.reduce((sum, l) => sum + l.totalOwed, 0);
  const totalDuty = liabilities.reduce((sum, l) => sum + l.dutyOwed, 0);
  const totalVat = liabilities.reduce((sum, l) => sum + l.vatOwed, 0);

  return apiSuccess({
    period: label,
    periodStart: start,
    periodEnd: end,
    liabilities,
    summary: {
      countriesWithLiability: liabilities.filter(l => l.totalOwed > 0).length,
      totalDutyOwed: Math.round(totalDuty * 100) / 100,
      totalVatOwed: Math.round(totalVat * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalTransactions: liabilities.reduce((sum, l) => sum + l.transactionCount, 0),
      totalValue: Math.round(liabilities.reduce((sum, l) => sum + l.totalValue, 0) * 100) / 100,
    },
    deadlines,
    overdueCount: deadlines.filter(d => d.status === 'overdue').length,
    dueSoonCount: deadlines.filter(d => d.status === 'due_soon').length,
    filingDeadlineInfo: FILING_DEADLINES,
  }, { sellerId: context.sellerId, plan: context.planId });
});
