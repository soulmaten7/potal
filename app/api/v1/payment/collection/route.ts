/**
 * POTAL API v1 — /api/v1/payment/collection
 * Post-clearance duty collection tracking.
 * GET — query outstanding collections
 * POST — create new collection record
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createCollectionRecord, summarizeCollections, type CollectionRecord } from '@/app/lib/payment/duty-collection';

// In-memory store (production: DB table)
const collections: CollectionRecord[] = [];

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const country = url.searchParams.get('country')?.toUpperCase() || undefined;
  const summary = url.searchParams.get('summary') === 'true';

  let filtered = collections.filter(c => c.sellerId === ctx.sellerId);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (country) filtered = filtered.filter(c => c.buyerCountry === country);

  if (summary) {
    return apiSuccess({ summary: summarizeCollections(filtered) }, { sellerId: ctx.sellerId });
  }

  return apiSuccess({ records: filtered, total: filtered.length }, { sellerId: ctx.sellerId });
});

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const shipmentId = typeof body.shipmentId === 'string' ? body.shipmentId : '';
  const buyerCountry = typeof body.buyerCountry === 'string' ? body.buyerCountry : '';
  const dutyAmount = typeof body.dutyAmount === 'number' ? body.dutyAmount : 0;
  const taxAmount = typeof body.taxAmount === 'number' ? body.taxAmount : 0;
  const feesAmount = typeof body.feesAmount === 'number' ? body.feesAmount : 0;

  if (!shipmentId) return apiError(ApiErrorCode.BAD_REQUEST, 'shipmentId required.');
  if (!buyerCountry || buyerCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'buyerCountry (ISO2) required.');
  if (dutyAmount <= 0 && taxAmount <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'dutyAmount or taxAmount must be positive.');

  try {
    const record = createCollectionRecord({
      shipmentId, sellerId: ctx.sellerId, buyerCountry, dutyAmount, taxAmount, feesAmount,
    });
    collections.push(record);
    return apiSuccess({ record, note: `Collection record created. Due date: ${record.dueDate}` }, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.BAD_REQUEST, err instanceof Error ? err.message : 'Creation failed.');
  }
});
