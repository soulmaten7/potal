/**
 * F047: Foreign Trade Zone (FTZ) management.
 * F048: Bonded Warehouse management (combined endpoint).
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const FTZ_BENEFITS = [
  'Duty deferral — no duty until goods enter domestic commerce',
  'Duty elimination — no duty on re-exported goods',
  'Inverted tariff relief — pay lower duty rate on finished product vs components',
  'Weekly entry — consolidate customs entries to reduce processing fees',
  'Reduced merchandise processing fees',
];

const BONDED_WAREHOUSE_TYPES: Record<string, string> = {
  '1': 'Government-owned, operated by US government',
  '2': 'Privately owned, used only by importer',
  '3': 'Publicly bonded warehouse, open to all importers',
  '4': 'Bonded yard/pen for bulk goods',
  '5': 'Bonded bin (grain/cotton)',
  '7': 'Duty-free store (DFQC)',
  '8': 'Bonded warehouse for cleaning/sorting/repacking',
  '9': 'Duty-free store at exit point',
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const facilityType = typeof body.facilityType === 'string' ? body.facilityType.toLowerCase() : 'ftz';
  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : 'US';
  const goodsValue = typeof body.goodsValue === 'number' ? body.goodsValue : undefined;
  const dutyRate = typeof body.dutyRate === 'number' ? body.dutyRate : undefined;

  if (facilityType === 'ftz') {
    const dutySavings = goodsValue && dutyRate ? Math.round(goodsValue * dutyRate * 100) / 100 : null;
    return apiSuccess({
      facilityType: 'ftz', country,
      benefits: FTZ_BENEFITS,
      estimatedDutySavings: dutySavings,
      usInfo: country === 'US' ? {
        totalFtzZones: 294, activeFtzSubzones: 640,
        applicationAuthority: 'Foreign-Trade Zones Board (Commerce Dept)',
        applicationUrl: 'https://enforcement.trade.gov/ftzpage/',
        annualReportRequired: true,
      } : null,
      equivalentPrograms: {
        EU: 'Free Zones (Art. 243-249 UCC)',
        CN: 'Free Trade Zones (Shanghai, Hainan, etc.)',
        SG: 'Free Trade Zones (Changi, Jurong)',
        AE: 'Free Zones (JAFZA, DAFZA, etc.)',
        KR: 'Free Economic Zones (Incheon, Busan)',
      },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // Bonded warehouse
  return apiSuccess({
    facilityType: 'bonded_warehouse', country,
    warehouseTypes: BONDED_WAREHOUSE_TYPES,
    benefits: [
      'Duty deferral for up to 5 years (US)',
      'Goods can be stored, manipulated, or manufactured',
      'No duty on re-exported goods',
      'Allows examination before entry',
    ],
    usRequirements: country === 'US' ? {
      bond: 'Warehouse bond required (CBP Form 301)',
      permit: 'Application to district/area port director',
      duration: 'Goods may remain up to 5 years',
      supervision: 'CBP oversight required',
    } : null,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { facilityType: "ftz"|"bonded_warehouse", country?: "US", goodsValue?, dutyRate? }'); }
