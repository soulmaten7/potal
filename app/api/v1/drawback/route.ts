/**
 * POTAL API v1 — /api/v1/drawback
 *
 * Duty Drawback calculation for returned goods.
 * Calculates refundable duties/taxes when goods are re-exported or returned.
 *
 * POST /api/v1/drawback
 * Body: {
 *   originalPrice: number,          // Original item price (USD)
 *   destinationCountry: string,     // Import destination (ISO2)
 *   originCountry: string,          // Origin country (ISO2)
 *   hsCode?: string,                // HS Code
 *   productName?: string,           // Product name (for HS classification)
 *   returnReason: string,           // "defective" | "wrong_item" | "not_as_described" | "other"
 *   returnWithinDays?: number,      // Days since import (affects eligibility)
 *   dutyPaid?: number,              // Actual duty paid (if known)
 *   vatPaid?: number,               // Actual VAT paid (if known)
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// Country-specific drawback rules
const DRAWBACK_RULES: Record<string, {
  maxDays: number;
  dutyRefundPercent: number;
  vatRefundPercent: number;
  processingFeeRefund: boolean;
  notes: string;
}> = {
  US: { maxDays: 1825, dutyRefundPercent: 99, vatRefundPercent: 0, processingFeeRefund: false, notes: 'US drawback per 19 USC §1313. 99% refund within 5 years of import.' },
  GB: { maxDays: 365, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'UK customs duty relief for re-exported goods within 12 months.' },
  DE: { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'EU UCC Art. 238. Full refund within 3 years.' },
  FR: { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'EU UCC Art. 238.' },
  IT: { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'EU UCC Art. 238.' },
  ES: { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'EU UCC Art. 238.' },
  NL: { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'EU UCC Art. 238.' },
  CA: { maxDays: 1460, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'CBSA duty drawback within 4 years.' },
  AU: { maxDays: 1460, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'ABF Duty Drawback Scheme within 4 years.' },
  JP: { maxDays: 365, dutyRefundPercent: 100, vatRefundPercent: 0, processingFeeRefund: false, notes: 'Japan Customs drawback within 1 year of import.' },
  KR: { maxDays: 730, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'KCS drawback within 2 years.' },
  CN: { maxDays: 365, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'China re-export duty drawback within 1 year.' },
  SG: { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'Singapore customs duty refund.' },
  MX: { maxDays: 365, dutyRefundPercent: 100, vatRefundPercent: 0, processingFeeRefund: false, notes: 'Mexico IMMEX drawback within 1 year.' },
  IN: { maxDays: 730, dutyRefundPercent: 98, vatRefundPercent: 0, processingFeeRefund: false, notes: 'India duty drawback scheme, 98% refund within 2 years.' },
  BR: { maxDays: 365, dutyRefundPercent: 100, vatRefundPercent: 0, processingFeeRefund: false, notes: 'Brazil drawback regime, II refund within 1 year.' },
};

// Default for countries not in the specific list
const DEFAULT_DRAWBACK = { maxDays: 365, dutyRefundPercent: 100, vatRefundPercent: 0, processingFeeRefund: false, notes: 'General customs refund policy. Check with local customs authority.' };

// EU member states share the same UCC rules
const EU_MEMBERS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

function getDrawbackRules(country: string) {
  if (DRAWBACK_RULES[country]) return DRAWBACK_RULES[country];
  if (EU_MEMBERS.has(country)) {
    return { maxDays: 1095, dutyRefundPercent: 100, vatRefundPercent: 100, processingFeeRefund: false, notes: 'EU UCC Art. 238. Full refund within 3 years.' };
  }
  return DEFAULT_DRAWBACK;
}

export const POST = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const originalPrice = typeof body.originalPrice === 'number' ? body.originalPrice : parseFloat(String(body.originalPrice || ''));
  if (isNaN(originalPrice) || originalPrice <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "originalPrice" is required and must be positive.');
  }

  const destinationCountry = String(body.destinationCountry || 'US').toUpperCase().slice(0, 2);
  const originCountry = String(body.originCountry || 'CN').toUpperCase().slice(0, 2);
  const returnReason = String(body.returnReason || 'other');
  const returnWithinDays = typeof body.returnWithinDays === 'number' ? body.returnWithinDays : undefined;

  // Get drawback rules for this country
  const rules = getDrawbackRules(destinationCountry);

  // Check eligibility
  const isEligible = !returnWithinDays || returnWithinDays <= rules.maxDays;

  // Calculate original duties using the cost engine
  const costInput: GlobalCostInput = {
    price: originalPrice,
    shippingPrice: 0,
    origin: originCountry,
    destinationCountry,
    hsCode: body.hsCode as string | undefined,
    productName: body.productName as string | undefined,
    shippingTerms: 'DDP',
  };

  let dutyRefund = 0;
  let vatRefund = 0;
  let totalRefund = 0;
  let dutyPaidEstimate = 0;
  let vatPaidEstimate = 0;

  try {
    const result = await calculateGlobalLandedCostAsync(costInput);
    dutyPaidEstimate = typeof body.dutyPaid === 'number' ? body.dutyPaid : result.importDuty;
    vatPaidEstimate = typeof body.vatPaid === 'number' ? body.vatPaid : (result as any).vat || 0;

    if (isEligible) {
      dutyRefund = Math.round(dutyPaidEstimate * (rules.dutyRefundPercent / 100) * 100) / 100;
      vatRefund = Math.round(vatPaidEstimate * (rules.vatRefundPercent / 100) * 100) / 100;
      totalRefund = Math.round((dutyRefund + vatRefund) * 100) / 100;
    }
  } catch {
    // If calculation fails, use provided values or return error
    if (typeof body.dutyPaid === 'number' && typeof body.vatPaid === 'number') {
      dutyPaidEstimate = body.dutyPaid as number;
      vatPaidEstimate = body.vatPaid as number;
      if (isEligible) {
        dutyRefund = Math.round(dutyPaidEstimate * (rules.dutyRefundPercent / 100) * 100) / 100;
        vatRefund = Math.round(vatPaidEstimate * (rules.vatRefundPercent / 100) * 100) / 100;
        totalRefund = Math.round((dutyRefund + vatRefund) * 100) / 100;
      }
    } else {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Unable to calculate drawback. Provide dutyPaid and vatPaid manually.');
    }
  }

  return apiSuccess({
    drawback: {
      eligible: isEligible,
      totalRefund,
      dutyRefund,
      vatRefund,
      currency: 'USD',
      originalDutyPaid: dutyPaidEstimate,
      originalVatPaid: vatPaidEstimate,
    },
    rules: {
      country: destinationCountry,
      maxReturnDays: rules.maxDays,
      dutyRefundPercent: rules.dutyRefundPercent,
      vatRefundPercent: rules.vatRefundPercent,
      notes: rules.notes,
    },
    request: {
      originalPrice,
      originCountry,
      destinationCountry,
      returnReason,
      returnWithinDays: returnWithinDays || null,
      hsCode: body.hsCode || null,
    },
    ineligibleReason: !isEligible
      ? `Return after ${returnWithinDays} days exceeds ${rules.maxDays}-day drawback window for ${destinationCountry}.`
      : null,
  });
});
