/**
 * POTAL API v1 — /api/v1/compliance/aeo/benefits
 * AEO benefit calculator: what you gain with AEO status.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { AEO_PROGRAMS, findMra, getMraPartners } from '@/app/lib/compliance/aeo-programs';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const sellerCountry = typeof body.seller_country === 'string' ? body.seller_country.toUpperCase() : '';
  const destCountry = typeof body.destination_country === 'string' ? body.destination_country.toUpperCase() : '';
  const aeoStatus = typeof body.current_aeo_status === 'string' ? body.current_aeo_status : 'none';
  const annualVolume = typeof body.annual_volume === 'number' ? body.annual_volume : 0;

  if (!sellerCountry) return apiError(ApiErrorCode.BAD_REQUEST, '"seller_country" required.');

  const program = AEO_PROGRAMS[sellerCountry];
  if (!program) {
    return apiSuccess({ sellerCountry, programFound: false, message: `No AEO program data for ${sellerCountry}.` }, { sellerId: ctx.sellerId });
  }

  // Calculate benefits
  const benefits = program.benefits.map(b => ({
    ...b,
    applicable: aeoStatus !== 'none',
    currentStatus: aeoStatus,
  }));

  // MRA check
  let mraResult: Record<string, unknown> | null = null;
  if (destCountry) {
    const mra = findMra(sellerCountry, destCountry);
    if (mra) {
      mraResult = {
        recognized: true,
        fromProgram: mra.fromProgram,
        toProgram: mra.toProgram,
        effectiveDate: mra.effectiveDate,
        benefits: mra.benefits,
      };
    } else {
      mraResult = { recognized: false, note: `No MRA between ${sellerCountry} and ${destCountry}.` };
    }
  }

  // Estimated savings
  const savingsEstimate = aeoStatus !== 'none' && annualVolume > 0 ? {
    inspectionSavings: Math.round(annualVolume * 0.02 * 100) / 100, // ~2% of volume saved
    clearanceTimeSaved: '4-24 hours per shipment',
    bondReduction: 'Up to 70% (EU AEO-F)',
    annualEstimate: Math.round(annualVolume * 0.03 * 100) / 100, // ~3% overall savings
  } : null;

  return apiSuccess({
    sellerCountry,
    destinationCountry: destCountry || null,
    aeoStatus,
    program: { name: program.programName, authority: program.authority },
    benefits,
    mra: mraResult,
    mraPartners: getMraPartners(sellerCountry),
    savingsEstimate,
  }, { sellerId: ctx.sellerId });
});
