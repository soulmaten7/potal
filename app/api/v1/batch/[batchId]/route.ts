import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getBatchStatus } from '@/app/lib/batch/async-batch';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const batchId = req.url.split('/batch/')[1]?.split('?')[0] || '';
  if (!batchId) return apiError(ApiErrorCode.BAD_REQUEST, 'batchId required.');

  try {
    const status = await getBatchStatus(batchId);
    return apiSuccess(status, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.NOT_FOUND, err instanceof Error ? err.message : 'Batch not found.');
  }
});
