/**
 * POTAL API v1 — /api/v1/fta/eligibility
 *
 * FTA origin eligibility check using Rules of Origin engine.
 *
 * POST /api/v1/fta/eligibility
 * Body: {
 *   hs_code: string,                    // required
 *   origin: string,                     // required (ISO2)
 *   destination: string,                // required (ISO2)
 *   fta_id?: string,                    // optional — auto-detect if omitted
 *   product_value?: number,             // for RVC calculation
 *   local_content_percentage?: number,  // 0-100
 *   materials?: Array<{ hs_code: string, origin: string, value: number }>,
 *   input_origins?: string[],           // for cumulation
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { evaluateRoO } from '@/app/lib/trade/roo-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/[^0-9]/g, '') : '';
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase().trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase().trim() : '';

  if (!hsCode || hsCode.length < 4) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code (4+ digits) required.');
  if (!origin || origin.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'origin (2-letter ISO) required.');
  if (!destination || destination.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'destination (2-letter ISO) required.');

  const ftaId = typeof body.fta_id === 'string' ? body.fta_id.trim() : undefined;
  const productValue = typeof body.product_value === 'number' ? body.product_value : undefined;
  const localContent = typeof body.local_content_percentage === 'number' ? body.local_content_percentage : undefined;
  const inputOrigins = Array.isArray(body.input_origins)
    ? (body.input_origins as string[]).map(s => String(s).toUpperCase())
    : undefined;

  // Parse materials array
  let materials: Array<{ hsCode: string; origin: string; value: number }> | undefined;
  if (Array.isArray(body.materials)) {
    materials = (body.materials as Array<Record<string, unknown>>)
      .filter(m => typeof m.hs_code === 'string' && typeof m.origin === 'string' && typeof m.value === 'number')
      .map(m => ({
        hsCode: String(m.hs_code).replace(/[^0-9]/g, ''),
        origin: String(m.origin).toUpperCase(),
        value: Number(m.value),
      }));
  }

  const roo = evaluateRoO({
    hs6: hsCode.slice(0, 6),
    origin,
    destination,
    ftaId,
    productValue,
    localContentValue: productValue && localContent ? productValue * localContent / 100 : undefined,
    nonOriginatingMaterialValue: materials
      ? materials.filter(m => m.origin !== origin).reduce((s, m) => s + m.value, 0)
      : undefined,
    materials,
    inputOrigins,
  });

  return apiSuccess({
    hs_code: hsCode,
    origin,
    destination,
    fta_id: ftaId || null,
    eligible: roo.eligible,
    best_criteria: roo.method,
    criteria_met: roo.criteriaMetList,
    criteria_failed: roo.criteriaFailed,
    rvc_percentage: roo.rvcPercentage,
    required_rvc: roo.requiredRvc,
    tariff_shift_met: roo.tariffShiftMet,
    substantial_transformation: roo.substantialTransformation,
    cumulation_applied: roo.cumulationApplied,
    de_minimis_applied: roo.deMinimisApplied,
    savings_if_eligible: roo.savingsIfEligible,
    mfn_duty_estimate: roo.mfnDutyEstimate,
    fta_duty_estimate: roo.ftaDutyEstimate,
    details: roo.details,
    warnings: roo.warnings.length > 0 ? roo.warnings : undefined,
  }, { sellerId: ctx.sellerId });
});
