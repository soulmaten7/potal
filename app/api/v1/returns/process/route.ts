/**
 * POTAL API v1 — /api/v1/returns/process
 *
 * F067: Cross-border return processing — drawback + documents.
 *
 * POST /api/v1/returns/process
 * Body: {
 *   country: string,
 *   originalValue: number,
 *   dutiesPaid: number,
 *   taxesPaid?: number,
 *   hsCode?: string,
 *   returnReason: "defective"|"wrong_item"|"not_as_described"|"buyer_remorse"|"damaged_in_transit",
 *   returnDestination?: string,
 *   entryNumber?: string,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateReturnDrawback, generateReturnDocuments } from '@/app/lib/returns/cross-border-returns';

const VALID_REASONS = ['defective', 'wrong_item', 'not_as_described', 'buyer_remorse', 'damaged_in_transit'];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const originalValue = typeof body.originalValue === 'number' ? body.originalValue : 0;
  const dutiesPaid = typeof body.dutiesPaid === 'number' ? body.dutiesPaid : 0;
  const taxesPaid = typeof body.taxesPaid === 'number' ? body.taxesPaid : 0;
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const returnReason = typeof body.returnReason === 'string' ? body.returnReason : '';
  const returnDestination = typeof body.returnDestination === 'string' ? body.returnDestination.toUpperCase().trim() : country;
  const entryNumber = typeof body.entryNumber === 'string' ? body.entryNumber.trim() : undefined;

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required (2-letter ISO).');
  if (originalValue <= 0) return apiError(ApiErrorCode.BAD_REQUEST, '"originalValue" must be positive.');
  if (!VALID_REASONS.includes(returnReason)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"returnReason" must be: ${VALID_REASONS.join(', ')}`);
  }

  const request = {
    originalImport: { country, value: originalValue, dutiesPaid, taxesPaid, hsCode, entryNumber },
    returnReason: returnReason as 'defective' | 'wrong_item' | 'not_as_described' | 'buyer_remorse' | 'damaged_in_transit',
    returnDestination,
  };

  const drawback = calculateReturnDrawback(request);
  const documents = generateReturnDocuments(request);

  return apiSuccess({
    drawback,
    documents,
    summary: {
      originalValue,
      dutiesPaid,
      taxesPaid,
      totalRefundable: drawback.totalRefundable,
      netReturnCost: Math.round((dutiesPaid + taxesPaid - drawback.totalRefundable) * 100) / 100,
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country, originalValue, dutiesPaid, returnReason }');
}
