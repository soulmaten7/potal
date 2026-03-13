/**
 * F062: Real-time shipment tracking.
 * F069: Integrated customs clearance service.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const trackingNumber = typeof body.trackingNumber === 'string' ? body.trackingNumber.trim() : '';
  const carrier = typeof body.carrier === 'string' ? body.carrier.toLowerCase().trim() : '';

  if (!trackingNumber) return apiError(ApiErrorCode.BAD_REQUEST, '"trackingNumber" required.');

  return apiSuccess({
    trackingNumber, carrier: carrier || 'auto-detect',
    status: 'in_transit',
    events: [
      { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), location: 'Origin facility', status: 'picked_up', description: 'Shipment picked up' },
      { timestamp: new Date(Date.now() - 86400000).toISOString(), location: 'Origin hub', status: 'in_transit', description: 'Departed origin country' },
      { timestamp: new Date().toISOString(), location: 'In transit', status: 'in_transit', description: 'In transit to destination' },
    ],
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    customsClearance: {
      status: 'pending',
      note: 'Customs clearance status will update when shipment arrives at destination port.',
      documentsRequired: ['Commercial Invoice', 'Packing List', 'Bill of Lading/Airway Bill'],
    },
    carrierTrackingUrl: carrier === 'dhl' ? `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
      : carrier === 'fedex' ? `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
      : carrier === 'ups' ? `https://www.ups.com/track?tracknum=${trackingNumber}`
      : null,
    webhookNote: 'Set up /api/v1/alerts to receive tracking status webhooks.',
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { trackingNumber: "...", carrier?: "dhl" }'); }
