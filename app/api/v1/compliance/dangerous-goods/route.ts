/**
 * POTAL API v1 — /api/v1/compliance/dangerous-goods
 *
 * Dangerous Goods (DG) / Hazardous Materials (HAZMAT) shipping check.
 * Validates products against IATA DGR (air), IMDG (sea), and ADR (road) regulations.
 *
 * POST /api/v1/compliance/dangerous-goods
 * Body: {
 *   productName: string,         // required
 *   hsCode?: string,             // optional
 *   unNumber?: string,           // UN number (e.g., "UN1234")
 *   transportMode: string,       // required: "air" | "sea" | "road" | "rail"
 *   quantity?: number,
 *   weight?: number,             // kg
 *   packagingType?: string,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── DG Classes (UN classification) ────────────────

interface DGClass {
  class: string;
  division?: string;
  name: string;
  examples: string[];
  placardColor: string;
  airRestriction: 'forbidden' | 'restricted' | 'allowed';
}

const DG_CLASSES: DGClass[] = [
  { class: '1', division: '1.1', name: 'Explosives — Mass explosion hazard', examples: ['dynamite', 'detonators'], placardColor: 'orange', airRestriction: 'forbidden' },
  { class: '1', division: '1.4', name: 'Explosives — Minor hazard', examples: ['ammunition', 'fireworks', 'safety fuses'], placardColor: 'orange', airRestriction: 'restricted' },
  { class: '2', division: '2.1', name: 'Flammable gases', examples: ['propane', 'butane', 'aerosols'], placardColor: 'red', airRestriction: 'restricted' },
  { class: '2', division: '2.2', name: 'Non-flammable, non-toxic gases', examples: ['CO2', 'nitrogen', 'fire extinguisher'], placardColor: 'green', airRestriction: 'restricted' },
  { class: '2', division: '2.3', name: 'Toxic gases', examples: ['chlorine', 'phosgene'], placardColor: 'white', airRestriction: 'forbidden' },
  { class: '3', name: 'Flammable liquids', examples: ['gasoline', 'acetone', 'paint', 'perfume', 'nail polish'], placardColor: 'red', airRestriction: 'restricted' },
  { class: '4', division: '4.1', name: 'Flammable solids', examples: ['matches', 'sulfur'], placardColor: 'red/white', airRestriction: 'restricted' },
  { class: '4', division: '4.2', name: 'Spontaneously combustible', examples: ['white phosphorus', 'certain metal powders'], placardColor: 'red/white', airRestriction: 'forbidden' },
  { class: '4', division: '4.3', name: 'Dangerous when wet', examples: ['sodium', 'calcium carbide'], placardColor: 'blue', airRestriction: 'forbidden' },
  { class: '5', division: '5.1', name: 'Oxidizing substances', examples: ['ammonium nitrate', 'hydrogen peroxide'], placardColor: 'yellow', airRestriction: 'restricted' },
  { class: '5', division: '5.2', name: 'Organic peroxides', examples: ['benzoyl peroxide'], placardColor: 'yellow/red', airRestriction: 'restricted' },
  { class: '6', division: '6.1', name: 'Toxic substances', examples: ['pesticides', 'cyanide'], placardColor: 'white', airRestriction: 'restricted' },
  { class: '6', division: '6.2', name: 'Infectious substances', examples: ['medical samples', 'biological cultures'], placardColor: 'white', airRestriction: 'restricted' },
  { class: '7', name: 'Radioactive material', examples: ['uranium', 'medical isotopes'], placardColor: 'yellow/white', airRestriction: 'restricted' },
  { class: '8', name: 'Corrosive substances', examples: ['sulfuric acid', 'batteries (wet)', 'mercury'], placardColor: 'black/white', airRestriction: 'restricted' },
  { class: '9', name: 'Miscellaneous dangerous goods', examples: ['lithium batteries', 'dry ice', 'magnetized material', 'engines'], placardColor: 'white', airRestriction: 'restricted' },
];

// Common products → DG class mapping
const PRODUCT_DG_MAP: { keywords: RegExp; dgClass: string; division?: string; unNumber?: string }[] = [
  { keywords: /lithium.*batter|li-ion|lipo/i, dgClass: '9', unNumber: 'UN3481' },
  { keywords: /perfume|cologne|fragrance/i, dgClass: '3', unNumber: 'UN1266' },
  { keywords: /nail polish|nail varnish/i, dgClass: '3', unNumber: 'UN1263' },
  { keywords: /paint|lacquer|varnish/i, dgClass: '3', unNumber: 'UN1263' },
  { keywords: /aerosol|spray can/i, dgClass: '2', division: '2.1', unNumber: 'UN1950' },
  { keywords: /hand sanitizer|alcohol.*gel/i, dgClass: '3', unNumber: 'UN1170' },
  { keywords: /dry ice|solid co2/i, dgClass: '9', unNumber: 'UN1845' },
  { keywords: /magnet|magnetized/i, dgClass: '9', unNumber: 'UN2807' },
  { keywords: /matches|lighter/i, dgClass: '4', division: '4.1', unNumber: 'UN1944' },
  { keywords: /firework|pyrotechnic/i, dgClass: '1', division: '1.4', unNumber: 'UN0336' },
  { keywords: /ammunition|cartridge/i, dgClass: '1', division: '1.4', unNumber: 'UN0012' },
  { keywords: /bleach|chlorine/i, dgClass: '8', unNumber: 'UN1791' },
  { keywords: /battery.*acid|sulfuric acid/i, dgClass: '8', unNumber: 'UN2796' },
  { keywords: /motor.*oil|engine oil/i, dgClass: '9' },
  { keywords: /pesticide|insecticide|herbicide/i, dgClass: '6', division: '6.1' },
  { keywords: /power bank|portable charger/i, dgClass: '9', unNumber: 'UN3481' },
];

// HS chapters commonly associated with DG
const DG_HS_CHAPTERS: Record<string, string> = {
  '28': 'Inorganic chemicals (potential DG Class 5/6/8)',
  '29': 'Organic chemicals (potential DG Class 3/6)',
  '33': 'Essential oils and perfumery (DG Class 3)',
  '34': 'Soap and washing preparations (may contain flammable solvents)',
  '36': 'Explosives, matches (DG Class 1/4)',
  '38': 'Chemical products (various DG classes)',
  '85': 'Electronics with batteries (DG Class 9 for lithium batteries)',
  '93': 'Arms and ammunition (DG Class 1)',
};

// ─── Handler ───────────────────────────────────────

interface DGIssue {
  type: 'classification' | 'packaging' | 'documentation' | 'restriction' | 'quantity';
  severity: 'blocked' | 'action_required' | 'warning' | 'info';
  message: string;
  regulation?: string;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const unNumber = typeof body.unNumber === 'string' ? body.unNumber.toUpperCase().trim() : undefined;
  const transportMode = typeof body.transportMode === 'string' ? body.transportMode.toLowerCase().trim() : '';
  const weight = typeof body.weight === 'number' ? body.weight : undefined;
  const packagingType = typeof body.packagingType === 'string' ? body.packagingType.trim() : undefined;

  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  }
  if (!['air', 'sea', 'road', 'rail'].includes(transportMode)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"transportMode" must be: air, sea, road, or rail.');
  }

  const issues: DGIssue[] = [];

  // Detect DG class from product name
  let detectedDG: { dgClass: string; division?: string; unNumber?: string } | null = null;
  for (const mapping of PRODUCT_DG_MAP) {
    if (mapping.keywords.test(productName)) {
      detectedDG = mapping;
      break;
    }
  }

  // Check HS code for DG association
  let hsChapterWarning: string | undefined;
  if (hsCode) {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    hsChapterWarning = DG_HS_CHAPTERS[chapter];
  }

  const isDangerous = !!detectedDG || !!unNumber || !!hsChapterWarning;

  // Get DG class info
  let dgClassInfo: DGClass | undefined;
  const classToFind = detectedDG?.dgClass || (unNumber ? undefined : undefined);
  const divisionToFind = detectedDG?.division;
  if (classToFind) {
    dgClassInfo = DG_CLASSES.find(d =>
      d.class === classToFind && (!divisionToFind || d.division === divisionToFind)
    ) || DG_CLASSES.find(d => d.class === classToFind);
  }

  // Air transport restrictions
  if (transportMode === 'air' && dgClassInfo) {
    if (dgClassInfo.airRestriction === 'forbidden') {
      issues.push({
        type: 'restriction',
        severity: 'blocked',
        message: `${dgClassInfo.name} (Class ${dgClassInfo.class}${dgClassInfo.division ? '.' + dgClassInfo.division : ''}) is FORBIDDEN on passenger and cargo aircraft.`,
        regulation: 'IATA DGR',
      });
    } else if (dgClassInfo.airRestriction === 'restricted') {
      issues.push({
        type: 'restriction',
        severity: 'action_required',
        message: `${dgClassInfo.name} is restricted on aircraft. Requires DG declaration, proper packaging, and may be cargo-only.`,
        regulation: 'IATA DGR',
      });
    }
  }

  // Documentation requirements
  if (isDangerous) {
    issues.push({
      type: 'documentation',
      severity: 'action_required',
      message: 'Dangerous Goods Declaration (DGD) / Shipper\'s Declaration required. Must be signed by trained personnel.',
      regulation: transportMode === 'air' ? 'IATA DGR Section 8' : transportMode === 'sea' ? 'IMDG Code Section 5.4' : 'ADR Section 5.4',
    });

    // Packaging requirements
    if (!packagingType) {
      issues.push({
        type: 'packaging',
        severity: 'action_required',
        message: 'UN-approved packaging required for dangerous goods. Specify packaging type for compliance check.',
        regulation: transportMode === 'air' ? 'IATA PI (Packing Instructions)' : 'UN Packaging Standards',
      });
    }

    // Quantity limits for air
    if (transportMode === 'air' && weight && weight > 30) {
      issues.push({
        type: 'quantity',
        severity: 'warning',
        message: `Weight ${weight}kg may exceed per-package limits for air transport. Check specific packing instruction limits.`,
        regulation: 'IATA DGR',
      });
    }

    // Marking and labeling
    issues.push({
      type: 'packaging',
      severity: 'info',
      message: dgClassInfo
        ? `Requires DG label (Class ${dgClassInfo.class}), UN number marking, and proper shipping name on outer package.`
        : 'Requires proper DG marking and labeling per applicable regulations.',
    });
  }

  if (hsChapterWarning && !detectedDG) {
    issues.push({
      type: 'classification',
      severity: 'warning',
      message: `HS code chapter: ${hsChapterWarning}. Product may require DG classification — verify with MSDS/SDS.`,
    });
  }

  return apiSuccess(
    {
      productName,
      isDangerousGood: isDangerous,
      classification: detectedDG ? {
        dgClass: detectedDG.dgClass,
        division: detectedDG.division || null,
        unNumber: detectedDG.unNumber || unNumber || null,
        className: dgClassInfo?.name || null,
        placardColor: dgClassInfo?.placardColor || null,
      } : unNumber ? {
        unNumber,
        note: 'UN number provided but product not auto-classified. Verify DG class from MSDS/SDS.',
      } : null,
      transportMode,
      airRestriction: dgClassInfo?.airRestriction || (isDangerous ? 'check_required' : 'allowed'),
      issues,
      requiredDocuments: isDangerous ? [
        'Dangerous Goods Declaration (DGD)',
        'Material Safety Data Sheet (MSDS/SDS)',
        'UN-approved packaging certification',
        transportMode === 'air' ? 'IATA Shipper\'s Declaration' : null,
        transportMode === 'sea' ? 'IMDG Dangerous Goods manifest' : null,
      ].filter(Boolean) : [],
      regulations: {
        air: 'IATA Dangerous Goods Regulations (DGR)',
        sea: 'IMDG Code (International Maritime Dangerous Goods)',
        road: 'ADR (European Agreement for Road Transport of Dangerous Goods)',
        rail: 'RID (Regulations concerning the International Carriage of Dangerous Goods by Rail)',
      },
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { productName: "lithium battery", transportMode: "air", weight?: 5 }'
  );
}
