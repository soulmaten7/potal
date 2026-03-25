/**
 * F056: Business License Management — import/export license requirements by country + industry.
 *
 * POST /api/v1/tax/business-license
 * Body: { country, industry?, productType? }
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface License {
  name: string;
  authority: string;
  required: boolean;
  renewalPeriod: string;
  estimatedCost?: string;
  applicationUrl?: string;
}

const LICENSE_REQUIREMENTS: Record<string, { licenses: License[]; generalUrl: string }> = {
  US: { generalUrl: 'https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits', licenses: [
    { name: 'Importer of Record Number', authority: 'CBP', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free', applicationUrl: 'https://www.cbp.gov/trade/basic-import-export/importer-exporter-number' },
    { name: 'Customs Bond (Continuous)', authority: 'CBP / Surety', required: true, renewalPeriod: 'Annual', estimatedCost: '$300-$10,000/yr based on import volume' },
    { name: 'FDA Registration (food/drugs/medical)', authority: 'FDA', required: false, renewalPeriod: 'Annual (Oct-Dec)', estimatedCost: 'Free (foreign facility $6,793/yr)', applicationUrl: 'https://www.fda.gov/food/registration-food-facilities-and-other-submissions/registration-food-facilities' },
    { name: 'FCC Equipment Authorization', authority: 'FCC', required: false, renewalPeriod: 'Per product', estimatedCost: '$500-$5,000 per product' },
    { name: 'CPSC Certificate', authority: 'CPSC', required: false, renewalPeriod: 'Per product batch', estimatedCost: 'Testing: $2,000-$10,000' },
    { name: 'State Sales Tax Permit', authority: 'State DOR', required: true, renewalPeriod: 'Varies by state', estimatedCost: 'Free in most states' },
    { name: 'Business License', authority: 'City/County', required: true, renewalPeriod: 'Annual', estimatedCost: '$50-$500/yr' },
    { name: 'EIN (Employer ID)', authority: 'IRS', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free', applicationUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online' },
  ]},
  GB: { generalUrl: 'https://www.gov.uk/set-up-business', licenses: [
    { name: 'EORI Number', authority: 'HMRC', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free', applicationUrl: 'https://www.gov.uk/eori' },
    { name: 'CDS Access', authority: 'HMRC', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'VAT Registration', authority: 'HMRC', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free', applicationUrl: 'https://www.gov.uk/vat-registration' },
    { name: 'Import License (controlled goods)', authority: 'DBT', required: false, renewalPeriod: 'Per shipment/annual', estimatedCost: 'Varies' },
  ]},
  EU: { generalUrl: 'https://trade.ec.europa.eu/access-to-markets/', licenses: [
    { name: 'EORI Number', authority: 'National customs', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'VAT Registration', authority: 'National tax authority', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free (may need fiscal rep: €1,000-5,000/yr)' },
    { name: 'IOSS Registration', authority: 'Member state', required: false, renewalPeriod: 'Permanent', estimatedCost: 'Free (intermediary: €500-2,000/yr)' },
    { name: 'CE Marking', authority: 'Notified Body', required: false, renewalPeriod: 'Per product', estimatedCost: '€2,000-20,000 per product line' },
  ]},
  CA: { generalUrl: 'https://www.cbsa-asfc.gc.ca/import/', licenses: [
    { name: 'Business Number (BN)', authority: 'CRA', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'Import Account', authority: 'CBSA', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'GST/HST Registration', authority: 'CRA', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'Import Permit (controlled goods)', authority: 'GAC', required: false, renewalPeriod: 'Per shipment', estimatedCost: 'Varies' },
  ]},
  AU: { generalUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing', licenses: [
    { name: 'ABN', authority: 'ABR', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free', applicationUrl: 'https://www.abr.gov.au/' },
    { name: 'GST Registration', authority: 'ATO', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'Import Declaration (N10)', authority: 'ABF', required: true, renewalPeriod: 'Per shipment', estimatedCost: 'AUD 50-90 per declaration' },
  ]},
  JP: { generalUrl: 'https://www.customs.go.jp/english/', licenses: [
    { name: 'Import Declaration', authority: 'Japan Customs', required: true, renewalPeriod: 'Per shipment', estimatedCost: 'Free (broker fee separate)' },
    { name: 'Consumption Tax Registration', authority: 'NTA', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'ATA Carnet (temporary imports)', authority: 'JCCI', required: false, renewalPeriod: 'Per carnet (1 year)', estimatedCost: '¥10,000-50,000' },
  ]},
  KR: { generalUrl: 'https://www.customs.go.kr/english/', licenses: [
    { name: 'Customs Code (통관고유부호)', authority: 'KCS', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'Business Registration', authority: 'NTS', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
  ]},
  SG: { generalUrl: 'https://www.customs.gov.sg/businesses/new-traders-and-registration-services', licenses: [
    { name: 'UEN', authority: 'ACRA', required: true, renewalPeriod: 'Permanent', estimatedCost: 'SGD 15-300' },
    { name: 'GST Registration', authority: 'IRAS', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
    { name: 'TradeNet Account', authority: 'Singapore Customs', required: true, renewalPeriod: 'Permanent', estimatedCost: 'Free' },
  ]},
};

// Industry-specific additions
const INDUSTRY_LICENSES: Record<string, string[]> = {
  food: ['FDA Registration (US)', 'Health Certificate', 'Phytosanitary Certificate', 'FSSAI License (IN)'],
  pharmaceuticals: ['FDA Drug Establishment Registration', 'Import Drug License', 'GMP Certificate'],
  electronics: ['FCC Authorization (US)', 'CE Marking (EU)', 'PSE Mark (JP)', 'KC Mark (KR)'],
  chemicals: ['EPA Registration', 'REACH Registration (EU)', 'TSCA Compliance', 'SDS/MSDS'],
  textiles: ['CPSIA Testing (children)', 'Flammability Testing', 'Country of Origin Labels'],
  alcohol: ['TTB Permit (US)', 'AGCO License (CA)', 'Alcohol Wholesale License'],
  firearms: ['ATF FFL (US)', 'ITAR Registration', 'End-User Certificate'],
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const industry = typeof body.industry === 'string' ? body.industry.toLowerCase().trim() : '';

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required (2-letter ISO).');

  const info = LICENSE_REQUIREMENTS[country];
  const industryLicenses = industry && INDUSTRY_LICENSES[industry] ? INDUSTRY_LICENSES[industry] : [];

  return apiSuccess({
    country,
    industry: industry || null,
    found: !!info,
    licenses: info?.licenses || [],
    requiredCount: info?.licenses.filter(l => l.required).length || 0,
    industrySpecific: industryLicenses.length > 0 ? {
      industry,
      additionalLicenses: industryLicenses,
      note: `${industry} products may require additional licenses/certifications beyond standard import requirements.`,
    } : undefined,
    generalUrl: info?.generalUrl || null,
    availableIndustries: Object.keys(INDUSTRY_LICENSES),
    disclaimer: 'License requirements are informational. Consult a licensed customs broker or trade compliance attorney for your specific situation.',
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", industry?: "food"|"electronics"|"chemicals" }');
}
