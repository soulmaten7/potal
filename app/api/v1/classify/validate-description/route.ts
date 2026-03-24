/**
 * POTAL API v1 — POST /api/v1/classify/validate-description
 *
 * Validates a product description for HS classification quality.
 * Returns issues, suggestions, and a quality score.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { validateProductDescription } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "description" is required.');
  }

  if (description.length > 5000) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Description exceeds 5000 character limit.');
  }

  try {
    const validation = validateProductDescription(description);

    return apiSuccess({
      description: description.substring(0, 200),
      is_valid: validation.valid,
      quality_score: validation.qualityScore,
      issues: validation.issues.map(i => ({ type: i.type, severity: i.severity, message: i.message, suggestion: i.suggestion })),
      word_count: description.split(/\s+/).filter(Boolean).length,
    }, { sellerId: ctx.sellerId });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Description validation failed.');
  }
});
