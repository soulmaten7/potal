import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateDrawback } from '@/app/lib/trade/duty-drawback';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const dutiesPaid = typeof body.duties_paid === 'number' ? body.duties_paid : 0;
  const importValue = typeof body.import_value === 'number' ? body.import_value : 0;
  const hsCode = typeof body.hs_code === 'string' ? body.hs_code : '';
  const importDate = typeof body.import_date === 'string' ? body.import_date : '';
  const exportDate = typeof body.export_date === 'string' ? body.export_date : new Date().toISOString();
  const exportValue = typeof body.export_value === 'number' ? body.export_value : importValue;
  const drawbackType = typeof body.drawback_type === 'string' ? body.drawback_type as 'manufacturing' | 'substitution' | 'rejected_merchandise' : 'manufacturing';

  if (dutiesPaid <= 0 || !importDate) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'duties_paid and import_date required.');
  }

  try {
    const result = calculateDrawback({
      originalImport: { hsCode, value: importValue, dutyPaid: dutiesPaid, date: importDate },
      exportItem: { value: exportValue, date: exportDate },
      drawbackType,
    });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Drawback calculation failed.');
  }
});
