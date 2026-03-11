/**
 * POTAL API v1 — /api/v1/alerts/subscribe
 *
 * Subscribe to specific types of tariff change alerts.
 * Supports: tariff_change, fta_update, trade_remedy, section_301, regulation_change
 *
 * POST /api/v1/alerts/subscribe
 * Body: {
 *   hsCode: string,
 *   originCountry: string,
 *   destinationCountry: string,
 *   alertTypes: ["tariff_change", "fta_update", "trade_remedy", "section_301"],
 *   webhookUrl?: string,
 *   notifyEmail?: string
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { createAlert } from '@/app/lib/cost-engine/alerts';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import type { AlertType } from '@/app/lib/cost-engine/alerts/types';

const VALID_ALERT_TYPES: AlertType[] = [
  'tariff_change',
  'fta_update',
  'trade_remedy',
  'section_301',
  'regulation_change',
];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.replace(/[^0-9]/g, '').slice(0, 6) : '';
  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.trim().toUpperCase().slice(0, 2) : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.trim().toUpperCase().slice(0, 2) : '';
  const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : undefined;
  const notifyEmail = typeof body.notifyEmail === 'string' ? body.notifyEmail.trim() : undefined;

  // Parse alert types
  let alertTypes: AlertType[] = VALID_ALERT_TYPES;
  if (Array.isArray(body.alertTypes)) {
    alertTypes = body.alertTypes
      .map((t: unknown) => String(t))
      .filter((t: string) => VALID_ALERT_TYPES.includes(t as AlertType)) as AlertType[];
    if (alertTypes.length === 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, `alertTypes must include at least one of: ${VALID_ALERT_TYPES.join(', ')}`);
    }
  }

  if (!hsCode || hsCode.length < 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hsCode must be at least 2 digits.');
  }
  if (!originCountry || originCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'originCountry must be a 2-letter ISO code.');
  }
  if (!destinationCountry || destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'destinationCountry must be a 2-letter ISO code.');
  }
  if (webhookUrl && !webhookUrl.startsWith('https://')) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'webhookUrl must be an HTTPS URL.');
  }
  if (!webhookUrl && !notifyEmail) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide webhookUrl or notifyEmail for notifications.');
  }

  try {
    const alert = await createAlert(context.sellerId, {
      hsCode,
      originCountry,
      destinationCountry,
      webhookUrl,
      notifyEmail,
      alertTypes,
    });

    return apiSuccess({
      subscription: alert,
      subscribedTo: alertTypes,
      message: `Subscribed to ${alertTypes.length} alert type(s) for HS ${hsCode} (${originCountry} → ${destinationCountry})`,
    }, {
      sellerId: context.sellerId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create subscription.';
    return apiError(ApiErrorCode.INTERNAL_ERROR, msg);
  }
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { hsCode: "8471", originCountry: "CN", destinationCountry: "US", alertTypes: ["tariff_change", "trade_remedy", "section_301"], webhookUrl: "https://..." }'
  );
}
