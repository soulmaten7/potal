/**
 * POTAL API v1 — /api/v1/customs/drawback
 *
 * F070: Customs duty drawback calculator.
 * Three types: unused, manufacturing, rejected.
 * 7-country rules with minClaim + currency + deadline.
 *
 * POST /api/v1/customs/drawback
 * Body: { type, country, dutiesPaid, importDate?, hsCode? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateDrawback, type DrawbackType } from '@/app/lib/customs/drawback-calculator';

const VALID_TYPES: DrawbackType[] = ['unused', 'manufacturing', 'rejected'];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const type = typeof body.type === 'string' ? body.type as DrawbackType : '' as DrawbackType;
  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const dutiesPaid = typeof body.dutiesPaid === 'number' ? body.dutiesPaid : 0;
  const importDate = typeof body.importDate === 'string' ? body.importDate : undefined;
  const exportDate = typeof body.exportDate === 'string' ? body.exportDate : undefined;
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode : undefined;

  if (!VALID_TYPES.includes(type)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"type" must be: ${VALID_TYPES.join(', ')}`);
  }
  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required (2-letter ISO).');
  if (dutiesPaid <= 0) return apiError(ApiErrorCode.BAD_REQUEST, '"dutiesPaid" must be positive.');

  const result = calculateDrawback({ type, country, dutiesPaid, importDate, exportDate, hsCode });

  return apiSuccess(result, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { type: "unused"|"manufacturing"|"rejected", country, dutiesPaid, importDate? }');
}
