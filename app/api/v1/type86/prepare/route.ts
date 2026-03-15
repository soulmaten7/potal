/**
 * POTAL API v1 — /api/v1/type86/prepare
 * Type 86 entry preparation for US Section 321 de minimis shipments
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const SECTION321_BLOCKED_ORIGINS = new Set(['CN', 'RU', 'BY']);
const TYPE86_THRESHOLD = 800; // USD

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const shipperName = typeof body.shipper_name === 'string' ? body.shipper_name.trim() : '';
  const consigneeName = typeof body.consignee_name === 'string' ? body.consignee_name.trim() : '';
  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/[^0-9]/g, '') : '';
  const declaredValue = typeof body.declared_value === 'number' ? body.declared_value : 0;
  const originCountry = typeof body.origin_country === 'string' ? body.origin_country.toUpperCase().trim() : '';
  const productDesc = typeof body.product_description === 'string' ? body.product_description.trim() : '';
  const trackingNumber = typeof body.tracking_number === 'string' ? body.tracking_number.trim() : undefined;

  if (!shipperName) return apiError(ApiErrorCode.BAD_REQUEST, 'shipper_name required.');
  if (!consigneeName) return apiError(ApiErrorCode.BAD_REQUEST, 'consignee_name required.');
  if (!hsCode || hsCode.length < 4) return apiError(ApiErrorCode.BAD_REQUEST, 'Valid hs_code required.');
  if (declaredValue <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'declared_value must be > 0.');
  if (!originCountry || originCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'Valid origin_country required.');

  // Check Section 321 blocking for CN/RU/BY
  if (SECTION321_BLOCKED_ORIGINS.has(originCountry)) {
    return apiSuccess({
      eligible: false,
      entry_type: 'formal',
      reason: `Section 321 de minimis eliminated for ${originCountry}-origin goods (effective 2026-02-28). Formal entry required regardless of value.`,
      recommendation: 'File formal entry (Type 01/11). Consider using a customs broker.',
      origin_country: originCountry,
      declared_value: declaredValue,
    }, { sellerId: _ctx.sellerId });
  }

  // Check value threshold
  if (declaredValue > TYPE86_THRESHOLD) {
    return apiSuccess({
      eligible: false,
      entry_type: 'formal',
      reason: `Declared value $${declaredValue.toFixed(2)} exceeds Type 86 threshold ($${TYPE86_THRESHOLD}). Formal entry required.`,
      recommendation: 'File formal entry (Type 01 for commercial, Type 11 for informal >$800).',
      origin_country: originCountry,
      declared_value: declaredValue,
    }, { sellerId: _ctx.sellerId });
  }

  // Type 86 eligible — generate ACE filing JSON
  const filingDate = new Date().toISOString().split('T')[0];
  const aceFilingJson = {
    entry_type: '86',
    entry_summary: {
      shipper: shipperName,
      consignee: consigneeName,
      hs_code: hsCode,
      declared_value: declaredValue,
      currency: 'USD',
      origin_country: originCountry,
      product_description: productDesc || `HS ${hsCode} product`,
      tracking_number: trackingNumber || null,
    },
    filing_date: filingDate,
    de_minimis_claim: true,
    section_321: true,
    duty_amount: 0,
    tax_amount: 0,
    mpf_amount: 0,
  };

  return apiSuccess({
    eligible: true,
    entry_type: '86',
    reason: `Value $${declaredValue.toFixed(2)} ≤ $${TYPE86_THRESHOLD} from ${originCountry}: Type 86 Section 321 eligible.`,
    ace_filing: aceFilingJson,
    requirements: [
      'Shipment must be destined for a single US consignee',
      'Value must not exceed $800 fair retail value',
      'Cannot contain prohibited goods (tobacco, alcohol, controlled substances)',
      'Must provide valid HS code for ACE filing',
    ],
    origin_country: originCountry,
    declared_value: declaredValue,
  }, { sellerId: _ctx.sellerId });
});
