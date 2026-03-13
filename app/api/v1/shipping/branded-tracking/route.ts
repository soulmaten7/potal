/**
 * F110: Branded tracking page.
 * F111: Branded emails.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'get_config';

  if (action === 'get_config') {
    return apiSuccess({
      trackingPage: {
        enabled: true,
        url: `https://track.potal.app/${context.sellerId}/{trackingNumber}`,
        customizable: ['logo', 'colors', 'banner_image', 'footer_links', 'social_links', 'custom_css'],
        features: ['Real-time tracking map', 'Estimated delivery countdown', 'Customs status', 'Product recommendations', 'Review request'],
      },
      brandedEmails: {
        enabled: true,
        templates: [
          { id: 'order_confirmed', name: 'Order Confirmed', trigger: 'order_placed' },
          { id: 'shipped', name: 'Shipment Dispatched', trigger: 'shipment_created' },
          { id: 'in_transit', name: 'In Transit Update', trigger: 'status_change' },
          { id: 'customs_hold', name: 'Customs Hold Notice', trigger: 'customs_hold' },
          { id: 'out_for_delivery', name: 'Out for Delivery', trigger: 'out_for_delivery' },
          { id: 'delivered', name: 'Delivered', trigger: 'delivered' },
          { id: 'review_request', name: 'Review Request', trigger: 'delivered_+3days' },
        ],
        customizable: ['subject_line', 'header_logo', 'brand_colors', 'footer_text', 'reply_to_email'],
      },
      smsNotifications: { available: true, note: 'Enable SMS via Settings > Notifications.' },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'preview') {
    const template = typeof body.template === 'string' ? body.template : 'shipped';
    return apiSuccess({
      template, previewUrl: `https://app.potal.app/email-preview/${template}`,
      note: 'Customize templates in Settings > Branding > Email Templates.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: get_config, preview.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "get_config"|"preview", template?: "shipped" }'); }
