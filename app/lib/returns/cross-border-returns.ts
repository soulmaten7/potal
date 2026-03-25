/**
 * F067: Cross-Border Returns Processing
 *
 * C1: Drawback calculation for returned goods
 * C2: Return customs document generation
 */

// ─── Types ──────────────────────────────────────────

export interface ImportRecord {
  country: string;
  value: number;
  dutiesPaid: number;
  taxesPaid: number;
  hsCode?: string;
  importDate?: string;
  entryNumber?: string;
}

export interface ReturnRequest {
  originalImport: ImportRecord;
  returnReason: 'defective' | 'wrong_item' | 'not_as_described' | 'buyer_remorse' | 'damaged_in_transit';
  returnDestination: string;
  returnValue?: number;
}

export interface DrawbackResult {
  eligible: boolean;
  reason: string;
  originalDutyPaid: number;
  originalTaxPaid: number;
  refundableDuty: number;
  refundableTax: number;
  totalRefundable: number;
  filingDeadline: string;
  form: string;
  process: string[];
}

export interface ReturnDocuments {
  commercialInvoice: { type: string; fields: Record<string, string | number> };
  returnAuthorization: { returnId: string; reason: string; originalOrderRef: string };
  customsDeclaration: { hsCode: string; value: number; returnReason: string; entryType: string };
  countrySpecific: { form: string; authority: string; notes: string } | null;
}

// ─── Country Rules ──────────────────────────────────

const DRAWBACK_RULES: Record<string, { rate: number; timeLimitYears: number; form: string; authority: string }> = {
  US: { rate: 0.99, timeLimitYears: 5, form: 'CBP Form 7551', authority: 'US CBP' },
  EU: { rate: 1.00, timeLimitYears: 3, form: 'Customs Declaration (re-export)', authority: 'National Customs' },
  GB: { rate: 1.00, timeLimitYears: 3, form: 'C285 Claim Form', authority: 'HMRC' },
  CA: { rate: 1.00, timeLimitYears: 4, form: 'B2 Adjustment Request', authority: 'CBSA' },
  AU: { rate: 1.00, timeLimitYears: 4, form: 'Refund/Drawback Application', authority: 'ABF' },
  JP: { rate: 1.00, timeLimitYears: 1, form: '関税払戻し申請書', authority: 'Japan Customs' },
  KR: { rate: 1.00, timeLimitYears: 2, form: '관세환급신청서', authority: 'KCS' },
};

const RETURN_REASON_ELIGIBLE: Record<string, boolean> = {
  defective: true,
  wrong_item: true,
  not_as_described: true,
  buyer_remorse: false,
  damaged_in_transit: true,
};

// ─── C1: Drawback Calculation ───────────────────────

export function calculateReturnDrawback(request: ReturnRequest): DrawbackResult {
  const { originalImport, returnReason } = request;
  const country = originalImport.country.toUpperCase();
  const rules = DRAWBACK_RULES[country];

  if (!rules) {
    return {
      eligible: false,
      reason: `No drawback rules available for ${country}. Contact local customs authority.`,
      originalDutyPaid: originalImport.dutiesPaid,
      originalTaxPaid: originalImport.taxesPaid,
      refundableDuty: 0,
      refundableTax: 0,
      totalRefundable: 0,
      filingDeadline: 'Unknown',
      form: 'Contact customs authority',
      process: [],
    };
  }

  // Check filing deadline based on import date
  let filingDeadline = `${rules.timeLimitYears} years from import date`;
  let deadlineExpired = false;
  if (originalImport.importDate) {
    const importDate = new Date(originalImport.importDate);
    const deadline = new Date(importDate);
    deadline.setFullYear(deadline.getFullYear() + rules.timeLimitYears);
    filingDeadline = deadline.toISOString().split('T')[0];
    deadlineExpired = new Date() > deadline;
  }

  if (deadlineExpired) {
    return {
      eligible: false,
      reason: `Filing deadline expired. ${rules.timeLimitYears}-year limit from import date has passed (deadline: ${filingDeadline}).`,
      originalDutyPaid: originalImport.dutiesPaid,
      originalTaxPaid: originalImport.taxesPaid,
      refundableDuty: 0,
      refundableTax: 0,
      totalRefundable: 0,
      filingDeadline,
      form: rules.form,
      process: [],
    };
  }

  const reasonEligible = RETURN_REASON_ELIGIBLE[returnReason] !== false;

  if (!reasonEligible) {
    return {
      eligible: false,
      reason: `Return reason "${returnReason}" does not qualify for duty drawback. Buyer remorse returns are typically not eligible.`,
      originalDutyPaid: originalImport.dutiesPaid,
      originalTaxPaid: originalImport.taxesPaid,
      refundableDuty: 0,
      refundableTax: 0,
      totalRefundable: 0,
      filingDeadline,
      form: rules.form,
      process: [],
    };
  }

  const refundableDuty = Math.round(originalImport.dutiesPaid * rules.rate * 100) / 100;
  const refundableTax = Math.round(originalImport.taxesPaid * rules.rate * 100) / 100;

  return {
    eligible: true,
    reason: `Eligible for ${(rules.rate * 100).toFixed(0)}% duty drawback. File ${rules.form} with ${rules.authority}.`,
    originalDutyPaid: originalImport.dutiesPaid,
    originalTaxPaid: originalImport.taxesPaid,
    refundableDuty,
    refundableTax,
    totalRefundable: Math.round((refundableDuty + refundableTax) * 100) / 100,
    filingDeadline,
    form: rules.form,
    process: [
      `1. Obtain proof of re-export (shipping documentation)`,
      `2. Complete ${rules.form}`,
      `3. Submit to ${rules.authority} with original entry documentation`,
      `4. Include: original entry number, HS code, proof of duty payment, export evidence`,
      `5. Processing time: typically 30-90 days`,
    ],
  };
}

// ─── C2: Return Documents ───────────────────────────

export function generateReturnDocuments(request: ReturnRequest): ReturnDocuments {
  const { originalImport, returnReason, returnDestination } = request;
  const returnId = `RET-${Date.now().toString(36).toUpperCase()}`;
  const country = originalImport.country.toUpperCase();

  const countryDocs: Record<string, { form: string; authority: string; notes: string }> = {
    US: { form: 'CBP Form 4455 (Declaration of Free Entry)', authority: 'CBP', notes: 'Mark packages "RETURN TO SENDER" or "AMERICAN GOODS RETURNED"' },
    EU: { form: 'Returned Goods Relief Application', authority: 'National Customs', notes: 'Goods must be re-imported within 3 years. Proof of original export required.' },
    GB: { form: 'C1314 (Returned Goods Relief)', authority: 'HMRC', notes: 'Relief available if goods re-imported within 3 years in same state.' },
    CA: { form: 'B2G (Casual Refund)', authority: 'CBSA', notes: 'Goods must be returned in same condition as exported.' },
  };

  return {
    commercialInvoice: {
      type: 'Return Credit Invoice',
      fields: {
        invoiceType: 'CREDIT/RETURN',
        originalValue: originalImport.value,
        returnValue: request.returnValue || originalImport.value,
        currency: 'USD',
        hsCode: originalImport.hsCode || '',
        returnReason,
        returnDestination,
      },
    },
    returnAuthorization: {
      returnId,
      reason: returnReason,
      originalOrderRef: originalImport.entryNumber || 'N/A',
    },
    customsDeclaration: {
      hsCode: originalImport.hsCode || '',
      value: request.returnValue || originalImport.value,
      returnReason,
      entryType: 'returned_goods',
    },
    countrySpecific: countryDocs[country] || null,
  };
}
