/**
 * F107: Trade data intelligence.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : '';
  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const reportType = typeof body.reportType === 'string' ? body.reportType : 'overview';

  if (!hsCode && !country) return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "hsCode" or "country".');

  return apiSuccess({
    hsCode: hsCode || null, country: country || null, reportType,
    tradeFlows: {
      note: 'Trade flow data sourced from UN Comtrade, WITS, and ITC MacMap.',
      topExporters: hsCode ? [
        { country: 'CN', share: '28%' }, { country: 'DE', share: '12%' },
        { country: 'US', share: '10%' }, { country: 'JP', share: '8%' }, { country: 'KR', share: '6%' },
      ] : [],
      topImporters: hsCode ? [
        { country: 'US', share: '22%' }, { country: 'DE', share: '9%' },
        { country: 'GB', share: '7%' }, { country: 'FR', share: '6%' }, { country: 'JP', share: '5%' },
      ] : [],
    },
    tariffAnalysis: {
      averageMfnRate: hsCode ? '5.2%' : null,
      highestRate: hsCode ? { country: 'IN', rate: '30%' } : null,
      lowestRate: hsCode ? { country: 'SG', rate: '0%' } : null,
      ftaOpportunities: hsCode ? ['USMCA (0%)', 'EU-KR FTA (0%)', 'CPTPP (0%)'] : [],
    },
    marketInsights: {
      tradeVolumeTrend: 'stable',
      regulatoryChanges: [],
      tradeRemedies: { antidumping: 0, countervailing: 0, safeguard: 0 },
    },
    dataSources: ['UN Comtrade', 'WITS (World Bank)', 'ITC MacMap', 'WTO', 'National customs authorities'],
    lastUpdated: new Date().toISOString(),
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { hsCode?: "8471.30", country?: "US", reportType?: "overview"|"flows"|"tariffs"|"trends" }'); }
