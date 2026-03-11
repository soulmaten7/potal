/**
 * POTAL API v1 — /api/v1/screening
 *
 * Denied Party Screening — check parties against sanctions lists.
 *
 * POST /api/v1/screening
 * Body: {
 *   name: string,            // required — party name to screen
 *   country?: string,        // ISO 2-letter code
 *   address?: string,        // optional address
 *   lists?: string[],        // specific lists to check (default: all)
 *   minScore?: number        // minimum match threshold (default: 0.8)
 * }
 *
 * POST /api/v1/screening (batch)
 * Body: {
 *   parties: Array<{ name, country?, address? }>,
 *   lists?: string[],
 *   minScore?: number
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { screenParty, screenParties, type ScreeningInput, type ScreeningList } from '@/app/lib/cost-engine/screening';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const VALID_LISTS: ScreeningList[] = ['OFAC_SDN', 'OFAC_CONS', 'BIS_ENTITY', 'BIS_DENIED', 'BIS_UNVERIFIED', 'EU_SANCTIONS', 'UN_SANCTIONS', 'UK_SANCTIONS'];
const MAX_BATCH = 50;

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // Parse common options
  let lists: ScreeningList[] | undefined;
  if (Array.isArray(body.lists)) {
    lists = body.lists
      .map((l: unknown) => String(l))
      .filter((l: string) => VALID_LISTS.includes(l as ScreeningList)) as ScreeningList[];
  }
  const minScore = typeof body.minScore === 'number' ? Math.max(0.5, Math.min(1.0, body.minScore)) : 0.8;

  // Batch mode
  if (Array.isArray(body.parties)) {
    if (body.parties.length === 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'parties array must have at least 1 entry.');
    }
    if (body.parties.length > MAX_BATCH) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Maximum ${MAX_BATCH} parties per batch request.`);
    }

    const inputs: ScreeningInput[] = [];
    for (let i = 0; i < body.parties.length; i++) {
      const p = body.parties[i] as Record<string, unknown>;
      if (!p || typeof p.name !== 'string' || !p.name.trim()) {
        return apiError(ApiErrorCode.BAD_REQUEST, `Party ${i}: name is required.`);
      }
      inputs.push({
        name: p.name.trim(),
        country: typeof p.country === 'string' ? p.country.trim().toUpperCase().slice(0, 2) : undefined,
        address: typeof p.address === 'string' ? p.address.trim() : undefined,
        lists,
        minScore,
      });
    }

    const results = screenParties(inputs);
    const hasAnyMatch = results.some(r => r.hasMatches);

    return apiSuccess({
      batchMode: true,
      overallStatus: hasAnyMatch ? 'matches_found' : 'all_clear',
      totalScreened: results.length,
      totalWithMatches: results.filter(r => r.hasMatches).length,
      results,
    }, {
      sellerId: context.sellerId,
    });
  }

  // Single mode
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'name is required. Provide a party name to screen.');
  }

  const input: ScreeningInput = {
    name: body.name.trim(),
    country: typeof body.country === 'string' ? body.country.trim().toUpperCase().slice(0, 2) : undefined,
    address: typeof body.address === 'string' ? body.address.trim() : undefined,
    lists,
    minScore,
  };

  const result = screenParty(input);

  return apiSuccess(result, {
    sellerId: context.sellerId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { name: "Company Name", country: "CN" } or { parties: [{ name: "...", country: "..." }] }. Lists: OFAC_SDN, BIS_ENTITY, EU_SANCTIONS, UN_SANCTIONS, UK_SANCTIONS'
  );
}
