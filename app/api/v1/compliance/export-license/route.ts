/**
 * POTAL API v1 — /api/v1/compliance/export-license
 *
 * Export License requirement check and management.
 * Covers all 6 CRITICAL areas:
 * - C1: Real-time sanctions/embargo check (DB + static fallback)
 * - C2: ECCN + Commerce Country Chart license determination
 * - C3: License exception eligibility (LVS, TMP, TSR, ENC)
 * - C4: Application guide with required documents
 * - C5: Re-export de minimis rule check
 * - C6: License application tracking
 *
 * POST /api/v1/compliance/export-license
 * Body: {
 *   productName: string,
 *   originCountry: string,        // 2-letter ISO
 *   destinationCountry: string,    // 2-letter ISO
 *   hsCode?: string,
 *   eccn?: string,                 // e.g. "5A002", "EAR99"
 *   value?: number,
 *   endUse?: string,
 *   isTemporary?: boolean,         // for TMP exception
 *   returnDays?: number,           // for TMP exception
 *   itemType?: string,             // "goods"|"software"|"technology"
 *   isEncryption?: boolean,        // for ENC exception
 *   usOriginContentPercent?: number, // for re-export de minimis
 *   recordApplication?: boolean,   // save to DB
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import {
  determineExportLicense,
  recordLicenseApplication,
} from '@/app/lib/compliance/export-license';

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
  const value = typeof body.value === 'number' && body.value >= 0 ? body.value : undefined;
  const endUse = typeof body.endUse === 'string' ? body.endUse.trim() : undefined;
  const isTemporary = typeof body.isTemporary === 'boolean' ? body.isTemporary : false;
  const returnDays = typeof body.returnDays === 'number' ? body.returnDays : 0;
  const itemType = typeof body.itemType === 'string' ? body.itemType : 'goods';
  const isEncryption = typeof body.isEncryption === 'boolean' ? body.isEncryption : false;
  const usOriginContentPercent = typeof body.usOriginContentPercent === 'number' ? body.usOriginContentPercent : undefined;
  const recordApp = typeof body.recordApplication === 'boolean' ? body.recordApplication : false;

  if (!productName) return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  if (!originCountry || originCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" must be 2-letter ISO code.');
  if (!destinationCountry || destinationCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" must be 2-letter ISO code.');

  const result = await determineExportLicense({
    originCountry,
    destinationCountry,
    productName,
    hsCode,
    eccn,
    value,
    endUse,
    sellerId: context.sellerId,
    isTemporary,
    returnDays,
    itemType,
    isEncryption,
    usOriginContentPercent,
  });

  // C6: Record application if requested and license is required
  let applicationReference: string | undefined;
  if (recordApp && result.licenseRequired && eccn) {
    applicationReference = await recordLicenseApplication(
      context.sellerId,
      eccn,
      destinationCountry,
      productName,
    );
  }

  return apiSuccess(
    {
      productName,
      originCountry,
      destinationCountry,
      hsCode: hsCode || null,
      eccn: eccn || null,
      value: value || null,
      endUse: endUse || null,
      licenseRequired: result.licenseRequired,
      sanctionStatus: result.sanctionStatus,
      requirements: result.requirements,
      exceptions: result.exceptions.length > 0 ? result.exceptions : undefined,
      reexportControl: result.reexportControl,
      applicationGuide: result.applicationGuide,
      existingLicense: result.existingLicense,
      applicationReference: applicationReference || undefined,
      economicSanctionsWarning: result.economicSanctionsWarning,
      applications: result.licenseRequired ? {
        us: 'BIS SNAP-R: https://snapr.bis.doc.gov',
        usItar: 'DDTC D-Trade: https://dtrade.pmddtc.state.gov',
        eu: 'Contact national export control authority',
      } : null,
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST. Body: { productName, originCountry, destinationCountry, eccn?, hsCode?, value?, isTemporary?, isEncryption?, usOriginContentPercent?, recordApplication? }',
  );
}
