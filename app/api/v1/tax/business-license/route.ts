/**
 * F056: Business License Management — license/permit requirements by jurisdiction.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const LICENSE_REQUIREMENTS: Record<string, { licenses: { name: string; authority: string; required: boolean; renewalPeriod: string }[] }> = {
  US: { licenses: [
    { name: 'Importer of Record Number', authority: 'CBP', required: true, renewalPeriod: 'Permanent' },
    { name: 'Customs Bond', authority: 'CBP / Surety', required: true, renewalPeriod: 'Annual' },
    { name: 'FDA Registration', authority: 'FDA', required: false, renewalPeriod: 'Annual (Oct-Dec)' },
    { name: 'FCC Equipment Authorization', authority: 'FCC', required: false, renewalPeriod: 'Per product' },
    { name: 'State Sales Tax Permit', authority: 'State Dept of Revenue', required: true, renewalPeriod: 'Varies by state' },
    { name: 'Business License', authority: 'City/County', required: true, renewalPeriod: 'Annual' },
  ]},
  GB: { licenses: [
    { name: 'EORI Number', authority: 'HMRC', required: true, renewalPeriod: 'Permanent' },
    { name: 'Customs Declaration Service Access', authority: 'HMRC', required: true, renewalPeriod: 'Permanent' },
    { name: 'VAT Registration', authority: 'HMRC', required: true, renewalPeriod: 'Permanent (annual returns)' },
    { name: 'Import License (controlled goods)', authority: 'Dept for Business & Trade', required: false, renewalPeriod: 'Per shipment or annual' },
  ]},
  EU: { licenses: [
    { name: 'EORI Number', authority: 'National customs authority', required: true, renewalPeriod: 'Permanent' },
    { name: 'VAT Registration', authority: 'National tax authority', required: true, renewalPeriod: 'Permanent' },
    { name: 'IOSS Registration', authority: 'Member state of identification', required: false, renewalPeriod: 'Permanent' },
    { name: 'Import License (agricultural/textiles)', authority: 'European Commission', required: false, renewalPeriod: 'Per shipment' },
  ]},
  JP: { licenses: [
    { name: 'Customs Broker License', authority: 'Japan Customs', required: false, renewalPeriod: 'Permanent' },
    { name: 'Import Business Registration', authority: 'METI', required: false, renewalPeriod: 'Varies' },
    { name: 'Consumption Tax Registration', authority: 'NTA', required: true, renewalPeriod: 'Permanent' },
  ]},
  KR: { licenses: [
    { name: 'Customs Code (통관고유부호)', authority: 'KCS', required: true, renewalPeriod: 'Permanent' },
    { name: 'Business Registration', authority: 'NTS', required: true, renewalPeriod: 'Permanent' },
    { name: 'Import License (controlled items)', authority: 'Relevant ministry', required: false, renewalPeriod: 'Varies' },
  ]},
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required.');

  const info = LICENSE_REQUIREMENTS[country];

  return apiSuccess({
    country, found: !!info,
    licenses: info?.licenses || [],
    note: info ? null : 'No specific license data. Contact local trade/customs authority.',
    recommendation: 'Consult with a licensed customs broker or trade compliance attorney for your specific situation.',
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US" }'); }
