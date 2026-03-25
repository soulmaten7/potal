/**
 * POTAL API v1 — /api/v1/customs/consolidate
 * F069: Consolidated clearance — combine shipments for duty optimization.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import {
  calculateConsolidatedDuty,
  detectSplitShipments,
  type ConsolidationShipment,
} from '@/app/lib/customs/consolidation';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const rawShipments = body.shipments;
  if (!Array.isArray(rawShipments) || rawShipments.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"shipments" must be a non-empty array.');
  }

  if (rawShipments.length > 50) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Maximum 50 shipments per consolidation request.');
  }

  const shipments: ConsolidationShipment[] = rawShipments.map((s: Record<string, unknown>, i: number) => ({
    id: typeof s.id === 'string' ? s.id : `shipment_${i + 1}`,
    items: Array.isArray(s.items) ? (s.items as Array<Record<string, unknown>>).map(item => ({
      description: String(item.description || ''),
      hsCode: String(item.hs_code || item.hsCode || '999999'),
      value: Number(item.value) || 0,
      quantity: Number(item.quantity) || 1,
    })) : [],
    origin: typeof s.origin === 'string' ? s.origin.toUpperCase() : 'CN',
    destination: typeof s.destination === 'string' ? s.destination.toUpperCase() : 'US',
    recipient: typeof s.recipient === 'string' ? s.recipient : 'Unknown',
    shipDate: typeof s.ship_date === 'string' ? s.ship_date : new Date().toISOString().split('T')[0],
  }));

  const result = calculateConsolidatedDuty(shipments);
  const splitCheck = detectSplitShipments(shipments);

  if (splitCheck.detected) {
    result.splitShipmentRisk = true;
    result.warnings.push(...splitCheck.groups.map(g => g.warning));
  }

  return apiSuccess({
    ...result,
    splitShipmentDetection: splitCheck.detected ? splitCheck.groups : undefined,
    note: result.savings > 0
      ? `Consolidation could save $${result.savings.toFixed(2)} in duties.`
      : result.formalEntryRequired
        ? 'Consolidated value exceeds de minimis — formal entry required for all items.'
        : 'Individual shipments are each under de minimis threshold. No duty savings from consolidation.',
  }, { sellerId: ctx.sellerId });
});
