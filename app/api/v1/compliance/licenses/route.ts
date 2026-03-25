/**
 * POTAL API v1 — /api/v1/compliance/licenses
 * Import license requirement lookup.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getRequiredLicenses } from '@/app/lib/compliance/import-license';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const country = url.searchParams.get('country')?.toUpperCase() || '';
  const hsCode = url.searchParams.get('hs_code') || url.searchParams.get('hsCode') || '';

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'country (ISO2) required.');
  if (!hsCode) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code required.');

  const result = getRequiredLicenses(country, hsCode);

  return apiSuccess({
    ...result,
    hsCode,
    note: result.totalRequired > 0
      ? `${result.mandatoryCount} mandatory license(s) required for HS ${result.hsChapter} imports to ${country}.`
      : `No specific import licenses identified for HS ${result.hsChapter} to ${country}. Standard customs procedures apply.`,
  }, { sellerId: ctx.sellerId });
});
