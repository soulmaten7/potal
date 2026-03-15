import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateCustomsValue } from '@/app/lib/trade/customs-valuation';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const transactionValue = typeof body.transaction_value === 'number' ? body.transaction_value : 0;
  const incoterm = typeof body.incoterm === 'string' ? body.incoterm : '';

  if (transactionValue <= 0 || !incoterm) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'transaction_value and incoterm required.');
  }

  try {
    const result = calculateCustomsValue({
      transactionValue,
      incoterm,
      freight: typeof body.freight === 'number' ? body.freight : undefined,
      insurance: typeof body.insurance === 'number' ? body.insurance : undefined,
      assistsValue: typeof body.assists_value === 'number' ? body.assists_value : undefined,
      royalties: typeof body.royalties === 'number' ? body.royalties : undefined,
      relatedParty: body.related_party === true,
      buyingCommissions: typeof body.buying_commissions === 'number' ? body.buying_commissions : undefined,
    });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Valuation failed.');
  }
});
