/**
 * F061: Shipping label generation.
 * F063: Return label/management.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const labelType = typeof body.labelType === 'string' ? body.labelType : 'shipping';
  const carrier = typeof body.carrier === 'string' ? body.carrier : '';
  const fromAddress = body.fromAddress as Record<string, unknown> | undefined;
  const toAddress = body.toAddress as Record<string, unknown> | undefined;

  if (!carrier) return apiError(ApiErrorCode.BAD_REQUEST, '"carrier" is required.');
  if (!fromAddress?.name || !toAddress?.name) return apiError(ApiErrorCode.BAD_REQUEST, 'fromAddress and toAddress with name required.');

  const labelId = `LBL-${Date.now().toString(36).toUpperCase()}`;
  const trackingNumber = `${carrier.toUpperCase().slice(0, 3)}${Date.now().toString().slice(-10)}`;

  return apiSuccess({
    labelId, trackingNumber, carrier, labelType,
    status: 'created',
    from: fromAddress, to: toAddress,
    label: {
      format: 'PDF',
      note: 'Connect carrier API credentials in Settings for actual label generation.',
      supportedFormats: ['PDF', 'ZPL', 'PNG'],
    },
    returnLabel: labelType === 'return' ? {
      returnTrackingNumber: `RET${trackingNumber}`,
      returnAddress: fromAddress,
      validDays: 30,
    } : null,
    customs: {
      cn22Required: true,
      cn23Required: false,
      commercialInvoiceRequired: true,
      note: 'Use /api/v1/documents to generate customs documents.',
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { carrier, fromAddress: {name, ...}, toAddress: {name, ...}, labelType?: "shipping"|"return" }'); }
