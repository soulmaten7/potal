/**
 * F030: Property Tax lookup by jurisdiction.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const PROPERTY_TAX_RATES: Record<string, { rate: number; note: string }> = {
  US: { rate: 0.011, note: 'US average ~1.1% of assessed value. Varies widely by county.' },
  GB: { rate: 0.005, note: 'Council Tax / Business Rates. Varies by local authority.' },
  CA: { rate: 0.0085, note: 'Provincial property tax ~0.5-1.5% of assessed value.' },
  AU: { rate: 0.004, note: 'Land tax varies by state. VIC ~0.3%, NSW ~0.4-1.6%.' },
  JP: { rate: 0.014, note: 'Fixed asset tax 1.4% of assessed value.' },
  KR: { rate: 0.003, note: 'Property tax 0.1-0.4% + comprehensive real estate tax for high-value.' },
  DE: { rate: 0.006, note: 'Grundsteuer reform effective 2025. ~0.3-1% depending on municipality.' },
  FR: { rate: 0.012, note: 'Taxe foncière. Varies significantly by commune.' },
  SG: { rate: 0.04, note: 'Owner-occupied 0-16%, non-owner 10-20% progressive rates.' },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const propertyValue = typeof body.propertyValue === 'number' ? body.propertyValue : undefined;

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be 2-letter ISO code.');

  const info = PROPERTY_TAX_RATES[country];
  const taxAmount = propertyValue && info ? Math.round(propertyValue * info.rate * 100) / 100 : null;

  return apiSuccess({
    country, found: !!info,
    rate: info?.rate || null,
    ratePercent: info ? `${(info.rate * 100).toFixed(2)}%` : null,
    note: info?.note || 'No property tax data. Check local tax authority.',
    estimatedAnnualTax: taxAmount, propertyValue: propertyValue || null,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", propertyValue?: 500000 }'); }
