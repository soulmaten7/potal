/**
 * POTAL API v1 — /api/v1/compliance/calendar
 * F106: Compliance Calendar — regulatory deadlines and events.
 *
 * GET /api/v1/compliance/calendar?country=US&from=2026-04-01&to=2026-12-31&type=vat&impact=critical
 */
import { NextRequest, NextResponse } from 'next/server';

interface ComplianceEvent {
  date: string;
  country: string;
  event: string;
  type: 'tax' | 'vat' | 'customs' | 'regulation' | 'tariff' | 'trade_agreement';
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  actionRequired?: string;
  sourceUrl?: string;
}

const COMPLIANCE_EVENTS: ComplianceEvent[] = [
  // US
  { date: '2026-04-15', country: 'US', event: 'Federal Income Tax Deadline', type: 'tax', impact: 'high', description: 'Annual federal income tax filing deadline', actionRequired: 'File Form 1040' },
  { date: '2026-06-30', country: 'US', event: 'FBAR Deadline', type: 'regulation', impact: 'high', description: 'Foreign bank account reporting deadline', actionRequired: 'File FinCEN 114' },
  { date: '2026-07-31', country: 'US', event: 'Q2 Sales Tax Filing', type: 'tax', impact: 'high', description: 'Quarterly sales tax return for most states', actionRequired: 'File state sales tax returns' },
  { date: '2026-10-01', country: 'US', event: 'New Fiscal Year Tariff Review', type: 'tariff', impact: 'high', description: 'Annual tariff schedule review and adjustments' },
  { date: '2026-10-31', country: 'US', event: 'Q3 Sales Tax Filing', type: 'tax', impact: 'high', description: 'Quarterly sales tax return' },

  // EU
  { date: '2026-04-30', country: 'EU', event: 'Q1 OSS VAT Return', type: 'vat', impact: 'high', description: 'One-Stop Shop quarterly VAT return', actionRequired: 'File OSS return for Q1' },
  { date: '2026-07-01', country: 'EU', event: 'CBAM Phase 2 Full Implementation', type: 'regulation', impact: 'critical', description: 'Carbon Border Adjustment Mechanism — full financial obligations begin', actionRequired: 'Purchase CBAM certificates for covered imports' },
  { date: '2026-07-31', country: 'EU', event: 'Q2 OSS VAT Return', type: 'vat', impact: 'high', description: 'One-Stop Shop quarterly VAT return', actionRequired: 'File OSS return for Q2' },
  { date: '2026-09-01', country: 'EU', event: 'France B2B e-Invoicing Mandate', type: 'regulation', impact: 'critical', description: 'France mandatory B2B e-invoicing via PPF platform begins', actionRequired: 'Ensure e-invoicing system compliance' },
  { date: '2026-10-01', country: 'EU', event: 'EU Customs Reform Phase 1', type: 'customs', impact: 'critical', description: 'New EU Customs Code begins phased implementation' },
  { date: '2026-10-31', country: 'EU', event: 'Q3 OSS VAT Return', type: 'vat', impact: 'high', description: 'One-Stop Shop quarterly VAT return' },

  // GB
  { date: '2026-05-07', country: 'GB', event: 'Q4 VAT Return (Jan-Mar)', type: 'vat', impact: 'high', description: 'Quarterly VAT return + 7 days', actionRequired: 'File MTD VAT return' },
  { date: '2026-07-01', country: 'GB', event: 'UK Border TOM Phase 3', type: 'customs', impact: 'high', description: 'Target Operating Model — full customs controls on EU imports' },
  { date: '2026-08-07', country: 'GB', event: 'Q1 VAT Return (Apr-Jun)', type: 'vat', impact: 'high', description: 'Quarterly VAT return' },

  // AU
  { date: '2026-04-28', country: 'AU', event: 'Q3 BAS (Jan-Mar)', type: 'vat', impact: 'high', description: 'Business Activity Statement', actionRequired: 'Lodge BAS with ATO' },
  { date: '2026-07-28', country: 'AU', event: 'Q4 BAS (Apr-Jun)', type: 'vat', impact: 'high', description: 'Business Activity Statement' },
  { date: '2026-10-28', country: 'AU', event: 'Q1 BAS (Jul-Sep)', type: 'vat', impact: 'high', description: 'Business Activity Statement' },

  // JP
  { date: '2027-03-31', country: 'JP', event: 'Annual Consumption Tax Filing', type: 'vat', impact: 'high', description: '消費税確定申告 annual filing deadline', actionRequired: 'File consumption tax return' },

  // KR
  { date: '2026-04-25', country: 'KR', event: 'Q1 VAT Return', type: 'vat', impact: 'high', description: '부가가치세 1기 예정신고 (Jan-Mar)', actionRequired: '홈택스에서 부가세 신고' },
  { date: '2026-07-25', country: 'KR', event: 'H1 VAT Return', type: 'vat', impact: 'high', description: '부가가치세 1기 확정신고 (Jan-Jun)', actionRequired: '홈택스에서 부가세 신고' },

  // CA
  { date: '2026-04-30', country: 'CA', event: 'Q1 GST/HST Return', type: 'vat', impact: 'high', description: 'Quarterly GST/HST filing (Jan-Mar)', actionRequired: 'File GST/HST return with CRA' },
  { date: '2026-07-31', country: 'CA', event: 'Q2 GST/HST Return', type: 'vat', impact: 'high', description: 'Quarterly GST/HST filing (Apr-Jun)' },

  // DE
  { date: '2026-07-10', country: 'DE', event: 'Jun USt-Voranmeldung', type: 'vat', impact: 'high', description: 'Monthly VAT advance return', actionRequired: 'File via ELSTER' },

  // IN
  { date: '2026-04-20', country: 'IN', event: 'Mar GSTR-3B', type: 'vat', impact: 'high', description: 'Monthly GST return for March', actionRequired: 'File GSTR-3B on GST portal' },

  // Global
  { date: '2026-07-01', country: 'GLOBAL', event: 'WTO HS 2027 Nomenclature', type: 'customs', impact: 'critical', description: 'WCO Harmonized System 2027 amendments take effect globally', actionRequired: 'Update all HS code mappings to HS 2027' },
  { date: '2027-01-01', country: 'GLOBAL', event: 'OECD Pillar Two GloBE Rules', type: 'tax', impact: 'critical', description: 'Global minimum corporate tax 15% fully effective in all jurisdictions', actionRequired: 'Ensure compliance with minimum tax rules' },
  { date: '2026-06-01', country: 'GLOBAL', event: 'WTO Trade Policy Review', type: 'trade_agreement', impact: 'medium', description: 'Semi-annual WTO trade policy review — potential tariff adjustments' },
];

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const country = params.get('country')?.toUpperCase();
  const from = params.get('from');
  const to = params.get('to');
  const type = params.get('type');
  const impact = params.get('impact');

  let filtered = [...COMPLIANCE_EVENTS];

  if (country) {
    filtered = filtered.filter(e => e.country === country || e.country === 'GLOBAL');
  }
  if (from) {
    filtered = filtered.filter(e => e.date >= from);
  }
  if (to) {
    filtered = filtered.filter(e => e.date <= to);
  }
  if (type) {
    filtered = filtered.filter(e => e.type === type);
  }
  if (impact) {
    filtered = filtered.filter(e => e.impact === impact);
  }

  filtered.sort((a, b) => a.date.localeCompare(b.date));

  // Upcoming (within 7 days) and overdue
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const upcoming = filtered.filter(e => e.date >= today && e.date <= sevenDaysLater);
  const overdue = filtered.filter(e => e.date < today && e.actionRequired);

  return NextResponse.json({
    success: true,
    data: {
      events: filtered,
      total: filtered.length,
      upcoming: upcoming.length > 0 ? upcoming : undefined,
      overdue: overdue.length > 0 ? overdue : undefined,
      filters: { country: country || 'all', from, to, type, impact },
      availableCountries: [...new Set(COMPLIANCE_EVENTS.map(e => e.country))].sort(),
      availableTypes: ['tax', 'vat', 'customs', 'regulation', 'tariff', 'trade_agreement'],
    },
  });
}
