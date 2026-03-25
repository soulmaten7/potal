/**
 * F030: Property Tax lookup — county/city level + commercial/residential multiplier.
 *
 * POST /api/v1/tax/property
 * Body: { country, state?, propertyValue?, propertyType?: "commercial"|"residential" }
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface PropertyTaxInfo {
  rate: number;
  commercialMultiplier: number;
  note: string;
  assessmentRatio: number;
  authorityUrl: string;
}

const PROPERTY_TAX_RATES: Record<string, PropertyTaxInfo> = {
  US: { rate: 0.011, commercialMultiplier: 1.3, assessmentRatio: 1.0, note: 'US average ~1.1%. Varies widely: NJ 2.49%, HI 0.28%. Commercial typically 1.3x residential.', authorityUrl: 'https://www.tax.gov/' },
  GB: { rate: 0.005, commercialMultiplier: 2.0, assessmentRatio: 1.0, note: 'Council Tax (residential) / Business Rates (commercial 2x). Varies by local authority.', authorityUrl: 'https://www.gov.uk/council-tax' },
  CA: { rate: 0.0085, commercialMultiplier: 1.5, assessmentRatio: 1.0, note: 'Provincial 0.5-1.5%. Commercial 1.5x multiplier in most provinces.', authorityUrl: 'https://www.canada.ca/en/services/taxes.html' },
  AU: { rate: 0.004, commercialMultiplier: 1.0, assessmentRatio: 0.8, note: 'Land tax varies: VIC 0.3%, NSW 0.4-1.6%. Based on unimproved land value.', authorityUrl: 'https://www.ato.gov.au/' },
  JP: { rate: 0.014, commercialMultiplier: 1.0, assessmentRatio: 0.7, note: 'Fixed asset tax 1.4% of assessed value (70% of market). City planning tax +0.3%.', authorityUrl: 'https://www.nta.go.jp/' },
  KR: { rate: 0.003, commercialMultiplier: 1.2, assessmentRatio: 0.6, note: 'Property tax 0.1-0.4%. Comprehensive real estate tax for high-value properties.', authorityUrl: 'https://www.hometax.go.kr/' },
  DE: { rate: 0.006, commercialMultiplier: 1.0, assessmentRatio: 1.0, note: 'Grundsteuer reform 2025. ~0.3-1% depending on municipality Hebesatz.', authorityUrl: 'https://www.bundesfinanzministerium.de/' },
  FR: { rate: 0.012, commercialMultiplier: 1.5, assessmentRatio: 0.5, note: 'Taxe foncière based on cadastral rental value (50% of market). Varies by commune.', authorityUrl: 'https://www.impots.gouv.fr/' },
  SG: { rate: 0.04, commercialMultiplier: 2.5, assessmentRatio: 1.0, note: 'Owner-occupied 0-16%, non-owner 10-20%, commercial 10% flat.', authorityUrl: 'https://www.iras.gov.sg/taxes/property-tax' },
  NZ: { rate: 0.007, commercialMultiplier: 1.2, assessmentRatio: 1.0, note: 'Council rates based on capital or land value. Varies by district.', authorityUrl: 'https://www.govt.nz/browse/housing-and-property/rates/' },
};

// US state-level rates for finer granularity
const US_STATE_PROPERTY_RATES: Record<string, { rate: number; note: string }> = {
  NJ: { rate: 0.0249, note: 'Highest in US. Average effective rate ~2.49%.' },
  IL: { rate: 0.0223, note: 'Cook County (Chicago) can exceed 3%.' },
  TX: { rate: 0.0181, note: 'No state income tax; higher property tax. Homestead exemption available.' },
  CT: { rate: 0.0215, note: 'Mill rate system. Varies by town.' },
  NY: { rate: 0.0172, note: 'NYC has separate commercial rate structure.' },
  CA: { rate: 0.0073, note: 'Prop 13 limits rate to ~1% + local bonds.' },
  FL: { rate: 0.0089, note: 'Save Our Homes limits annual assessment increase.' },
  HI: { rate: 0.0028, note: 'Lowest effective rate in US.' },
  WA: { rate: 0.0098, note: 'No state income tax. Levy limited to 1%.' },
  CO: { rate: 0.0055, note: 'Gallagher Amendment keeps residential ratio at ~7.15%.' },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const state = typeof body.state === 'string' ? body.state.toUpperCase().trim() : '';
  const propertyValue = typeof body.propertyValue === 'number' ? body.propertyValue : undefined;
  const propertyType = typeof body.propertyType === 'string' ? body.propertyType : 'residential';

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be 2-letter ISO code.');

  const info = PROPERTY_TAX_RATES[country];
  const isCommercial = propertyType === 'commercial';

  // US state-level override
  let effectiveRate = info?.rate || 0;
  let stateInfo: { rate: number; note: string } | null = null;
  if (country === 'US' && state && US_STATE_PROPERTY_RATES[state]) {
    stateInfo = US_STATE_PROPERTY_RATES[state];
    effectiveRate = stateInfo.rate;
  }

  const multiplier = isCommercial ? (info?.commercialMultiplier || 1.0) : 1.0;
  const assessmentRatio = info?.assessmentRatio || 1.0;
  const assessedValue = propertyValue ? Math.round(propertyValue * assessmentRatio) : undefined;
  const taxAmount = assessedValue ? Math.round(assessedValue * effectiveRate * multiplier * 100) / 100 : null;

  return apiSuccess({
    country,
    state: state || null,
    propertyType,
    found: !!info,
    rate: effectiveRate,
    ratePercent: `${(effectiveRate * 100).toFixed(2)}%`,
    commercialMultiplier: isCommercial ? multiplier : null,
    assessmentRatio,
    assessedValue: assessedValue || null,
    estimatedAnnualTax: taxAmount,
    propertyValue: propertyValue || null,
    note: stateInfo?.note || info?.note || 'No property tax data. Check local tax authority.',
    authorityUrl: info?.authorityUrl || null,
    disclaimer: 'Property tax rates are estimates. Actual rates depend on municipality, assessment method, and exemptions. Consult local tax authority for exact amounts.',
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", state?: "NJ", propertyValue?: 500000, propertyType?: "commercial"|"residential" }');
}
