import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getSEZByCountry, searchSEZ, getAllSEZ, getSEZById } from '@/app/lib/trade/sez-database';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const query = searchParams.get('q');
  const zoneId = searchParams.get('zone_id');

  try {
    if (zoneId) {
      const zone = getSEZById(zoneId);
      if (!zone) return apiError(ApiErrorCode.NOT_FOUND, 'Zone not found.');
      return apiSuccess(zone, { sellerId: ctx.sellerId });
    }

    if (country) {
      const zones = getSEZByCountry(country.toUpperCase());
      return apiSuccess({ zones, total: zones.length }, { sellerId: ctx.sellerId });
    }

    if (query) {
      const zones = searchSEZ(query);
      return apiSuccess({ zones, total: zones.length }, { sellerId: ctx.sellerId });
    }

    const zones = getAllSEZ();
    return apiSuccess({ zones, total: zones.length }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'SEZ search failed.');
  }
});
