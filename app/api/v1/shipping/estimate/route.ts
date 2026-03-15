import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { estimateShipping } from '@/app/lib/shipping/shipping-calculator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';
  const weightKg = typeof body.weight_kg === 'number' ? body.weight_kg : 0;

  if (!origin || !destination || weightKg <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'origin, destination, weight_kg required.');

  const result = estimateShipping({
    origin, destination, weightKg,
    lengthCm: typeof body.length_cm === 'number' ? body.length_cm : undefined,
    widthCm: typeof body.width_cm === 'number' ? body.width_cm : undefined,
    heightCm: typeof body.height_cm === 'number' ? body.height_cm : undefined,
    mode: typeof body.mode === 'string' ? body.mode as 'express' | 'standard' | 'economy' : undefined,
  });

  return apiSuccess(result, { sellerId: ctx.sellerId });
});
