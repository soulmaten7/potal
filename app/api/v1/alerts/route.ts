/**
 * POTAL API v1 — /api/v1/alerts
 *
 * Tariff change alert management.
 *
 * GET  /api/v1/alerts          — List active alerts
 * POST /api/v1/alerts          — Create new alert
 * DELETE /api/v1/alerts?id=xxx — Delete (deactivate) alert
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { createAlert, listAlerts, deleteAlert } from '@/app/lib/cost-engine/alerts';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── GET: List alerts ───────────────────────────────

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  try {
    const alerts = await listAlerts(context.sellerId);
    return apiSuccess({ alerts, count: alerts.length }, {
      sellerId: context.sellerId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch alerts.';
    return apiError(ApiErrorCode.INTERNAL_ERROR, msg);
  }
});

// ─── POST: Create alert ─────────────────────────────

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

  if (!hsCode || hsCode.length < 4) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hsCode must be at least 4 digits.');
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
    });

    return apiSuccess(alert, {
      sellerId: context.sellerId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create alert.';
    return apiError(ApiErrorCode.INTERNAL_ERROR, msg);
  }
});

// ─── DELETE: Deactivate alert ───────────────────────

export const DELETE = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const alertId = url.searchParams.get('id');

  if (!alertId) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide alert id as query parameter: ?id=ta_xxx');
  }

  const success = await deleteAlert(alertId, context.sellerId);
  if (!success) {
    return apiError(ApiErrorCode.NOT_FOUND, 'Alert not found or already deleted.');
  }

  return apiSuccess({ deleted: true, alertId }, {
    sellerId: context.sellerId,
  });
});
