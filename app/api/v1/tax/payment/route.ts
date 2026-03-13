/**
 * F052: Tax Payment Automation
 * F058: Duty Pre-payment Service
 * F059: Post-clearance Duty Collection
 * Combined tax/duty payment management endpoint.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const PAYMENT_METHODS: Record<string, { methods: string[]; note: string }> = {
  US: { methods: ['ACH (pay.gov)', 'ABI periodic duty statement', 'Customs bond'], note: 'CBP accepts ACH debit/credit and periodic monthly statements.' },
  EU: { methods: ['SEPA transfer', 'Deferred payment account', 'Customs guarantee'], note: 'Deferred payment allows up to 30 days after release.' },
  GB: { methods: ['Duty deferment account (DDA)', 'BACS', 'CHAPS'], note: 'DDA requires guarantee (CGU/CG). Payment by 15th of month following import.' },
  AU: { methods: ['ICS (Integrated Cargo System)', 'Direct debit'], note: 'Deferred GST available for registered importers.' },
  JP: { methods: ['Bank transfer', 'Multi-payment network', 'Extended payment'], note: 'AEO importers eligible for extended payment (3 months).' },
  KR: { methods: ['Bank transfer', 'Credit card', 'Electronic payment'], note: 'KCS electronic customs payment system.' },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase() : 'info';
  const amount = typeof body.amount === 'number' ? body.amount : undefined;

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required.');

  const paymentInfo = PAYMENT_METHODS[country];

  return apiSuccess({
    country, action,
    paymentMethods: paymentInfo?.methods || ['Contact local customs authority'],
    note: paymentInfo?.note || 'Payment method information not available. Check local customs.',
    dutyPrepayment: {
      available: ['US', 'GB', 'EU', 'AU'].includes(country),
      description: 'Pre-pay estimated duties before shipment arrival for expedited clearance.',
      benefits: ['Faster customs release', 'Predictable cash flow', 'Reduced demurrage risk'],
    },
    postClearanceCollection: {
      available: true,
      description: 'Collect duties from buyer after customs clearance (DDU/DAP terms).',
      methods: ['Buyer invoice', 'COD collection via carrier', 'Payment link'],
    },
    estimatedAmount: amount || null,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", action?: "prepay"|"info", amount?: 500 }'); }
