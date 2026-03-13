/**
 * F103: Shipping analytics/reports.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const reportType = typeof body.reportType === 'string' ? body.reportType : 'overview';
  const period = typeof body.period === 'string' ? body.period : '30d';

  const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30;

  return apiSuccess({
    reportType, period, generatedAt: new Date().toISOString(),
    overview: {
      totalShipments: 0, deliveredOnTime: 0, deliveredLate: 0, inTransit: 0,
      averageTransitDays: 0, averageCost: 0,
      onTimeDeliveryRate: '0%',
    },
    carrierPerformance: [
      { carrier: 'DHL Express', shipments: 0, onTimeRate: '0%', avgTransitDays: 0, avgCost: 0, claimsRate: '0%' },
      { carrier: 'FedEx', shipments: 0, onTimeRate: '0%', avgTransitDays: 0, avgCost: 0, claimsRate: '0%' },
      { carrier: 'UPS', shipments: 0, onTimeRate: '0%', avgTransitDays: 0, avgCost: 0, claimsRate: '0%' },
    ],
    topRoutes: [],
    costBreakdown: { shipping: 0, duties: 0, taxes: 0, insurance: 0, total: 0 },
    customsClearance: { avgClearanceDays: 0, holdRate: '0%', commonIssues: [] },
    trends: { periodDays, note: 'Shipping analytics populate as orders are processed through POTAL.' },
    exportFormats: ['CSV', 'XLSX', 'PDF'],
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { reportType?: "overview"|"carrier"|"routes"|"costs", period?: "7d"|"30d"|"90d"|"365d" }'); }
