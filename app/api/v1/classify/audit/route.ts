/**
 * POTAL API v1 — /api/v1/classify/audit
 *
 * Query HS Code classification audit trail.
 *
 * POST /api/v1/classify/audit
 * Body: {
 *   hsCode?: string,
 *   source?: string,            // "cache" | "vector" | "keyword" | "ai" | "manual"
 *   minConfidence?: number,
 *   maxConfidence?: number,
 *   startDate?: string,         // ISO 8601
 *   endDate?: string,           // ISO 8601
 *   limit?: number,             // max 200, default 50
 *   offset?: number
 * }
 *
 * Returns: { entries: AuditTrailEntry[], total, limit, offset }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { queryClassificationAudit, type AuditTrailQuery } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const query: AuditTrailQuery = {
    sellerId: context.sellerId,
    hsCode: typeof body.hsCode === 'string' ? body.hsCode : undefined,
    source: typeof body.source === 'string' ? body.source : undefined,
    minConfidence: typeof body.minConfidence === 'number' ? body.minConfidence : undefined,
    maxConfidence: typeof body.maxConfidence === 'number' ? body.maxConfidence : undefined,
    startDate: typeof body.startDate === 'string' ? body.startDate : undefined,
    endDate: typeof body.endDate === 'string' ? body.endDate : undefined,
    limit: typeof body.limit === 'number' ? body.limit : 50,
    offset: typeof body.offset === 'number' ? body.offset : 0,
  };

  const result = await queryClassificationAudit(query);

  if (!result) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Audit trail query failed. Please try again.');
  }

  return apiSuccess(result, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { hsCode?, source?, minConfidence?, startDate?, endDate?, limit?, offset? }'
  );
}
