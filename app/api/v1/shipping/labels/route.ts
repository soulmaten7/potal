/**
 * F061: Shipping label generation.
 * F063: Return label/management.
 * Supports ?format=pdf for actual 4x6 label PDF.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { generateShippingLabelPdf } from '@/app/lib/cost-engine/documents/pdf-generator';

interface AddressInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const url = new URL(req.url);
  const outputFormat = url.searchParams.get('format') || 'json';

  const labelType = typeof body.labelType === 'string' ? body.labelType : 'shipping';
  const carrier = typeof body.carrier === 'string' ? body.carrier : '';
  const fromAddress = body.fromAddress as AddressInput | undefined;
  const toAddress = body.toAddress as AddressInput | undefined;

  if (!carrier) return apiError(ApiErrorCode.BAD_REQUEST, '"carrier" is required.');
  if (!fromAddress?.name || !toAddress?.name) return apiError(ApiErrorCode.BAD_REQUEST, 'fromAddress and toAddress with name required.');

  const labelId = `LBL-${Date.now().toString(36).toUpperCase()}`;
  const trackingNumber = `${carrier.toUpperCase().slice(0, 3)}${Date.now().toString().slice(-10)}`;

  // PDF label generation
  if (outputFormat === 'pdf') {
    const weight = typeof body.weight === 'string' ? body.weight : typeof body.weight === 'number' ? `${body.weight} kg` : undefined;
    const hsCode = typeof body.hsCode === 'string' ? body.hsCode : undefined;
    const origin = typeof body.origin === 'string' ? body.origin : fromAddress.country || undefined;

    const pdfBytes = await generateShippingLabelPdf({
      from: fromAddress,
      to: toAddress,
      trackingNumber,
      carrier,
      weight,
      hsCode,
      origin,
      labelId,
    });

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${labelId}.pdf"`,
        'Content-Length': String(pdfBytes.length),
      },
    });
  }

  return apiSuccess({
    labelId, trackingNumber, carrier, labelType,
    status: 'created',
    from: fromAddress, to: toAddress,
    label: {
      format: 'PDF',
      note: 'Connect carrier API credentials in Settings for actual label generation. Use ?format=pdf to get a label PDF.',
      supportedFormats: ['PDF', 'ZPL', 'PNG'],
      pdfUrl: `/api/v1/shipping/labels?format=pdf`,
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
      note: 'Use /api/v1/documents to generate customs documents. Use /api/v1/documents/pdf for PDF output.',
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { carrier, fromAddress: {name, ...}, toAddress: {name, ...}, labelType?: "shipping"|"return" }. Query: ?format=pdf for label PDF.'); }
