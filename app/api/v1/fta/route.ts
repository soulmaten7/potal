/**
 * POTAL API v1 — /api/v1/fta
 *
 * Free Trade Agreement lookup with Rules of Origin (RoO).
 *
 * GET /api/v1/fta?origin=CN&destination=AU&hsCode=8471
 * GET /api/v1/fta?country=KR  (list all FTAs for a country)
 *
 * Returns: FTA details, preferential rates, rules of origin, certificate requirements.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { findApplicableFta, getCountryFtas, getRulesOfOrigin } from '@/app/lib/cost-engine/hs-code/fta';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const GET = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  const origin = req.nextUrl.searchParams.get('origin')?.toUpperCase();
  const destination = req.nextUrl.searchParams.get('destination')?.toUpperCase();
  const hsCode = req.nextUrl.searchParams.get('hsCode') || req.nextUrl.searchParams.get('hs_code') || undefined;
  const country = req.nextUrl.searchParams.get('country')?.toUpperCase();

  // Mode 1: List all FTAs for a country
  if (country) {
    if (country.length !== 2) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'country must be a 2-letter ISO code.');
    }
    const ftas = getCountryFtas(country);
    return apiSuccess({
      country,
      totalFtas: ftas.length,
      agreements: ftas,
    });
  }

  // Mode 2: Look up specific FTA between origin and destination
  if (!origin || origin.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'origin must be a 2-letter ISO code. Use ?origin=CN&destination=US or ?country=KR');
  }
  if (!destination || destination.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'destination must be a 2-letter ISO code.');
  }

  const chapter = hsCode?.replace(/[^0-9]/g, '').slice(0, 2);
  const fta = findApplicableFta(origin, destination, chapter);
  const roo = getRulesOfOrigin(origin, destination, hsCode?.replace(/[^0-9]/g, ''));

  return apiSuccess({
    origin,
    destination,
    hsCode: hsCode || null,
    fta: {
      applicable: fta.hasFta,
      name: fta.ftaName || null,
      code: fta.ftaCode || null,
      preferentialMultiplier: fta.preferentialMultiplier ?? null,
      isExcluded: fta.isExcluded || false,
    },
    rulesOfOrigin: roo ? {
      ftaCode: roo.ftaCode,
      rules: roo.rules,
      accumulationAllowed: roo.accumulationAllowed,
      accumulationType: roo.accumulationType,
      certificateType: roo.certificateType,
      notes: roo.notes,
    } : null,
  });
});
