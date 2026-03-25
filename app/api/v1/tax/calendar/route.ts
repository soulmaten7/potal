/**
 * POTAL API v1 — /api/v1/tax/calendar
 *
 * F074/F075: Tax filing deadline calendar by country.
 * Returns deadlines for a given year with nextUpcoming and overdue markers.
 *
 * GET /api/v1/tax/calendar?country=US&year=2026
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface TaxDeadline {
  date: string;
  event: string;
  form: string;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'semi-annual';
  authority: string;
  penaltyInfo?: string;
}

const TAX_DEADLINES: Record<string, TaxDeadline[]> = {
  US: [
    { date: '01-31', event: 'Q4 Sales Tax Return (Oct-Dec)', form: 'State-specific', frequency: 'quarterly', authority: 'State DOR' },
    { date: '04-15', event: 'Federal Income Tax Return', form: '1040 / 1120', frequency: 'annual', authority: 'IRS', penaltyInfo: '5% per month up to 25% of unpaid tax' },
    { date: '04-30', event: 'Q1 Sales Tax Return (Jan-Mar)', form: 'State-specific', frequency: 'quarterly', authority: 'State DOR' },
    { date: '06-15', event: 'Q2 Estimated Tax Payment', form: '1040-ES', frequency: 'quarterly', authority: 'IRS' },
    { date: '07-31', event: 'Q2 Sales Tax Return (Apr-Jun)', form: 'State-specific', frequency: 'quarterly', authority: 'State DOR' },
    { date: '09-15', event: 'Q3 Estimated Tax Payment', form: '1040-ES', frequency: 'quarterly', authority: 'IRS' },
    { date: '10-31', event: 'Q3 Sales Tax Return (Jul-Sep)', form: 'State-specific', frequency: 'quarterly', authority: 'State DOR' },
  ],
  GB: [
    { date: '01-07', event: 'Q4 VAT Return (Oct-Dec)', form: 'VAT Return (MTD)', frequency: 'quarterly', authority: 'HMRC' },
    { date: '01-31', event: 'Self Assessment Tax Return', form: 'SA100', frequency: 'annual', authority: 'HMRC', penaltyInfo: '£100 immediate + daily penalties' },
    { date: '04-07', event: 'Q1 VAT Return (Jan-Mar)', form: 'VAT Return (MTD)', frequency: 'quarterly', authority: 'HMRC' },
    { date: '07-07', event: 'Q2 VAT Return (Apr-Jun)', form: 'VAT Return (MTD)', frequency: 'quarterly', authority: 'HMRC' },
    { date: '10-07', event: 'Q3 VAT Return (Jul-Sep)', form: 'VAT Return (MTD)', frequency: 'quarterly', authority: 'HMRC' },
  ],
  EU: [
    { date: '01-31', event: 'Q4 OSS VAT Return (Oct-Dec)', form: 'OSS Return', frequency: 'quarterly', authority: 'EU Member State Tax Authority' },
    { date: '04-30', event: 'Q1 OSS VAT Return (Jan-Mar)', form: 'OSS Return', frequency: 'quarterly', authority: 'EU Member State Tax Authority' },
    { date: '07-31', event: 'Q2 OSS VAT Return (Apr-Jun)', form: 'OSS Return', frequency: 'quarterly', authority: 'EU Member State Tax Authority' },
    { date: '10-31', event: 'Q3 OSS VAT Return (Jul-Sep)', form: 'OSS Return', frequency: 'quarterly', authority: 'EU Member State Tax Authority' },
  ],
  AU: [
    { date: '02-28', event: 'Q2 BAS (Oct-Dec)', form: 'BAS', frequency: 'quarterly', authority: 'ATO' },
    { date: '04-28', event: 'Q3 BAS (Jan-Mar)', form: 'BAS', frequency: 'quarterly', authority: 'ATO' },
    { date: '07-28', event: 'Q4 BAS (Apr-Jun)', form: 'BAS', frequency: 'quarterly', authority: 'ATO' },
    { date: '10-28', event: 'Q1 BAS (Jul-Sep)', form: 'BAS', frequency: 'quarterly', authority: 'ATO' },
    { date: '10-31', event: 'Annual Income Tax Return', form: 'Individual/Company Return', frequency: 'annual', authority: 'ATO' },
  ],
  JP: [
    { date: '03-31', event: 'Annual Consumption Tax Return', form: '消費税申告書', frequency: 'annual', authority: 'NTA' },
    { date: '03-15', event: 'Annual Income Tax Return', form: '確定申告書', frequency: 'annual', authority: 'NTA' },
  ],
  KR: [
    { date: '01-25', event: 'H2 VAT Return (Jul-Dec)', form: '부가가치세 확정신고', frequency: 'semi-annual', authority: 'NTS' },
    { date: '03-31', event: 'Corporate Tax Return', form: '법인세 신고', frequency: 'annual', authority: 'NTS' },
    { date: '05-31', event: 'Individual Income Tax', form: '종합소득세 신고', frequency: 'annual', authority: 'NTS' },
    { date: '07-25', event: 'H1 VAT Return (Jan-Jun)', form: '부가가치세 확정신고', frequency: 'semi-annual', authority: 'NTS' },
  ],
  CA: [
    { date: '03-31', event: 'Q4 GST/HST Return (Oct-Dec)', form: 'GST34', frequency: 'quarterly', authority: 'CRA' },
    { date: '04-30', event: 'Personal Income Tax', form: 'T1', frequency: 'annual', authority: 'CRA' },
    { date: '06-30', event: 'Q1 GST/HST Return (Jan-Mar)', form: 'GST34', frequency: 'quarterly', authority: 'CRA' },
    { date: '09-30', event: 'Q2 GST/HST Return (Apr-Jun)', form: 'GST34', frequency: 'quarterly', authority: 'CRA' },
    { date: '12-31', event: 'Q3 GST/HST Return (Jul-Sep)', form: 'GST34', frequency: 'quarterly', authority: 'CRA' },
  ],
  DE: [
    { date: '02-10', event: 'Monthly VAT Return (prior month)', form: 'USt-Voranmeldung', frequency: 'monthly', authority: 'Finanzamt', penaltyInfo: '1% of outstanding tax per month' },
    { date: '07-31', event: 'Annual VAT Return', form: 'USt-Erklärung', frequency: 'annual', authority: 'Finanzamt' },
  ],
  FR: [
    { date: '04-30', event: 'Annual VAT Return (régime simplifié)', form: 'CA12', frequency: 'annual', authority: 'DGFiP' },
    { date: '05-15', event: 'Monthly VAT Return', form: 'CA3', frequency: 'monthly', authority: 'DGFiP' },
  ],
  IN: [
    { date: '01-31', event: 'Q3 GSTR-3B (Oct-Dec)', form: 'GSTR-3B', frequency: 'quarterly', authority: 'GST Council' },
    { date: '04-30', event: 'Q4 GSTR-3B (Jan-Mar)', form: 'GSTR-3B', frequency: 'quarterly', authority: 'GST Council' },
    { date: '07-31', event: 'Q1 GSTR-3B (Apr-Jun) + Annual ITR', form: 'GSTR-3B / ITR', frequency: 'quarterly', authority: 'GST Council / CBDT' },
    { date: '10-31', event: 'Q2 GSTR-3B (Jul-Sep)', form: 'GSTR-3B', frequency: 'quarterly', authority: 'GST Council' },
  ],
  SG: [
    { date: '01-31', event: 'Q4 GST Return (Oct-Dec)', form: 'GST F5', frequency: 'quarterly', authority: 'IRAS' },
    { date: '04-30', event: 'Q1 GST Return (Jan-Mar)', form: 'GST F5', frequency: 'quarterly', authority: 'IRAS' },
    { date: '07-31', event: 'Q2 GST Return (Apr-Jun)', form: 'GST F5', frequency: 'quarterly', authority: 'IRAS' },
    { date: '10-31', event: 'Q3 GST Return (Jul-Sep)', form: 'GST F5', frequency: 'quarterly', authority: 'IRAS' },
  ],
  MX: [
    { date: '03-17', event: 'Monthly VAT/ISR Return', form: 'Declaración mensual', frequency: 'monthly', authority: 'SAT' },
    { date: '03-31', event: 'Annual Income Tax (individuals)', form: 'Declaración anual', frequency: 'annual', authority: 'SAT' },
  ],
  NZ: [
    { date: '01-28', event: 'GST Return (Nov-Jan)', form: 'GST101A', frequency: 'quarterly', authority: 'IRD' },
    { date: '05-07', event: 'GST Return (Feb-Apr)', form: 'GST101A', frequency: 'quarterly', authority: 'IRD' },
    { date: '08-28', event: 'GST Return (May-Jul)', form: 'GST101A', frequency: 'quarterly', authority: 'IRD' },
    { date: '10-28', event: 'GST Return (Aug-Oct)', form: 'GST101A', frequency: 'quarterly', authority: 'IRD' },
  ],
};

function buildYearDeadlines(deadlines: TaxDeadline[], year: number): Array<TaxDeadline & { fullDate: string; isPast: boolean }> {
  const now = new Date();
  return deadlines
    .map(d => {
      const fullDate = `${year}-${d.date}`;
      return { ...d, fullDate, isPast: new Date(fullDate) < now };
    })
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
}

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const country = (url.searchParams.get('country') || '').toUpperCase();
  const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);

  if (!country) {
    return apiSuccess({
      availableCountries: Object.keys(TAX_DEADLINES).sort(),
      totalCountries: Object.keys(TAX_DEADLINES).length,
      note: 'Add ?country=US&year=2026 to get deadlines.',
    }, { sellerId: context.sellerId });
  }

  const deadlines = TAX_DEADLINES[country];
  if (!deadlines) {
    return apiError(ApiErrorCode.NOT_FOUND,
      `No tax calendar for "${country}". Available: ${Object.keys(TAX_DEADLINES).join(', ')}`);
  }

  const yearDeadlines = buildYearDeadlines(deadlines, year);
  const now = new Date();
  const upcoming = yearDeadlines.filter(d => !d.isPast);
  const overdue = yearDeadlines.filter(d => d.isPast);

  return apiSuccess({
    country,
    year,
    deadlines: yearDeadlines,
    total: yearDeadlines.length,
    nextUpcoming: upcoming.length > 0 ? upcoming[0] : null,
    daysUntilNext: upcoming.length > 0
      ? Math.ceil((new Date(upcoming[0].fullDate).getTime() - now.getTime()) / 86400000)
      : null,
    overdueCount: overdue.length,
    upcomingCount: upcoming.length,
  }, { sellerId: context.sellerId, plan: context.planId });
});
