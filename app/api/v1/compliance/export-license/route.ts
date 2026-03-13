/**
 * POTAL API v1 — /api/v1/compliance/export-license
 *
 * Export License requirement check and management.
 * Determines if an export license is needed and what type.
 *
 * POST /api/v1/compliance/export-license
 * Body: {
 *   productName: string,
 *   originCountry: string,
 *   destinationCountry: string,
 *   hsCode?: string,
 *   eccn?: string,
 *   value?: number,
 *   endUse?: string,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── License Types ─────────────────────────────────

interface LicenseRequirement {
  type: string;
  authority: string;
  description: string;
  estimatedProcessingDays: number;
  required: boolean;
}

// Embargoed destinations
const EMBARGOED = new Set(['CU', 'IR', 'KP', 'SY']);
const RESTRICTED_D1 = new Set(['CN', 'RU', 'BY', 'VN', 'MM', 'PK', 'IQ', 'AF']);

// Sensitive HS chapters requiring export licenses
const CONTROLLED_CHAPTERS: Record<string, { authority: string; licenseType: string }> = {
  '27': { authority: 'DOE/BIS', licenseType: 'Energy export license' },
  '28': { authority: 'BIS/EPA', licenseType: 'Chemical export license' },
  '29': { authority: 'BIS/EPA', licenseType: 'Chemical export license' },
  '84': { authority: 'BIS', licenseType: 'Dual-use technology license' },
  '85': { authority: 'BIS', licenseType: 'Technology/electronics export license' },
  '88': { authority: 'DDTC/BIS', licenseType: 'Aerospace export license' },
  '90': { authority: 'BIS', licenseType: 'Precision instruments license' },
  '93': { authority: 'DDTC', licenseType: 'ITAR Munitions License (DSP-5/DSP-73)' },
};

function determineLicenseRequirements(
  originCountry: string,
  destinationCountry: string,
  hsCode?: string,
  eccn?: string,
  value?: number,
): LicenseRequirement[] {
  const requirements: LicenseRequirement[] = [];
  const dest = destinationCountry.toUpperCase();
  const origin = originCountry.toUpperCase();

  // US origin export controls
  if (origin === 'US') {
    if (EMBARGOED.has(dest)) {
      requirements.push({
        type: 'OFAC License',
        authority: 'US Treasury OFAC',
        description: `${dest} is under comprehensive US embargo. Specific OFAC license required for virtually all exports.`,
        estimatedProcessingDays: 90,
        required: true,
      });
    }

    if (RESTRICTED_D1.has(dest) && eccn && eccn.charAt(1) !== '9') {
      requirements.push({
        type: 'BIS Individual License',
        authority: 'US Commerce BIS',
        description: `ECCN ${eccn} to Country Group D:1 (${dest}) requires BIS export license.`,
        estimatedProcessingDays: 60,
        required: true,
      });
    }

    if (hsCode) {
      const chapter = hsCode.replace(/\./g, '').substring(0, 2);
      const controlled = CONTROLLED_CHAPTERS[chapter];
      if (controlled && (RESTRICTED_D1.has(dest) || EMBARGOED.has(dest))) {
        requirements.push({
          type: controlled.licenseType,
          authority: controlled.authority,
          description: `HS chapter ${chapter} exports to ${dest} may require ${controlled.licenseType}.`,
          estimatedProcessingDays: 45,
          required: EMBARGOED.has(dest),
        });
      }
    }

    // High-value technology exports
    if (value && value > 500000 && RESTRICTED_D1.has(dest)) {
      requirements.push({
        type: 'End-Use Certificate',
        authority: 'BIS',
        description: 'High-value export to restricted destination may require end-use certificate from consignee.',
        estimatedProcessingDays: 30,
        required: false,
      });
    }
  }

  // EU origin export controls
  if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'PL', 'CZ'].includes(origin)) {
    if (EMBARGOED.has(dest)) {
      requirements.push({
        type: 'EU Export Authorization',
        authority: 'National Export Control Authority',
        description: `EU export controls apply. ${dest} is under EU restrictive measures.`,
        estimatedProcessingDays: 60,
        required: true,
      });
    }
  }

  // No specific license found
  if (requirements.length === 0) {
    requirements.push({
      type: 'No License Required',
      authority: 'N/A',
      description: 'Based on provided information, no specific export license appears required. Standard customs declaration applies.',
      estimatedProcessingDays: 0,
      required: false,
    });
  }

  return requirements;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const eccn = typeof body.eccn === 'string' ? body.eccn.toUpperCase().trim() : undefined;
  const value = typeof body.value === 'number' ? body.value : undefined;

  if (!productName) return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  if (!originCountry || originCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" must be 2-letter ISO code.');
  if (!destinationCountry || destinationCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" must be 2-letter ISO code.');

  const requirements = determineLicenseRequirements(originCountry, destinationCountry, hsCode, eccn, value);
  const licenseRequired = requirements.some(r => r.required);

  return apiSuccess(
    {
      productName,
      originCountry,
      destinationCountry,
      hsCode: hsCode || null,
      eccn: eccn || null,
      licenseRequired,
      requirements,
      applications: licenseRequired ? {
        us: 'BIS SNAP-R: https://snapr.bis.doc.gov',
        usItar: 'DDTC D-Trade: https://dtrade.pmddtc.state.gov',
        eu: 'Contact national export control authority',
      } : null,
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { productName, originCountry: "US", destinationCountry: "CN", hsCode?, eccn? }');
}
