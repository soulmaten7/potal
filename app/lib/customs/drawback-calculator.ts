/**
 * F070: Customs Duty Drawback Calculator
 *
 * C1: Three drawback types + country-specific rules + minClaim + currency.
 */

// ─── Types ──────────────────────────────────────────

export type DrawbackType = 'unused' | 'manufacturing' | 'rejected';

export interface DrawbackInput {
  type: DrawbackType;
  country: string;
  dutiesPaid: number;
  importDate?: string;
  exportDate?: string;
  hsCode?: string;
}

export interface DrawbackCalculation {
  eligible: boolean;
  type: DrawbackType;
  typeDescription: string;
  country: string;
  dutiesPaid: number;
  refundableAmount: number;
  refundRate: number;
  filingDeadline: string;
  withinTimeLimit: boolean;
  authority: string;
  form: string;
  requiredDocuments: string[];
  minClaimAmount: { amount: number; currency: string };
  process: string[];
  ineligibleReason?: string;
}

// ─── Constants ──────────────────────────────────────

const DRAWBACK_TYPES: Record<DrawbackType, { rate: number; description: string; requiresProof: string[] }> = {
  unused: {
    rate: 0.99,
    description: 'Imported and exported without use',
    requiresProof: ['Proof of export (bill of lading / airway bill)', 'Original import entry documentation', 'Evidence goods were not used domestically'],
  },
  manufacturing: {
    rate: 0.99,
    description: 'Used in manufacturing, finished product exported',
    requiresProof: ['Bill of materials showing imported components', 'Export documentation for finished goods', 'Manufacturing records linking import to export', 'Proof of duty payment on imported materials'],
  },
  rejected: {
    rate: 0.99,
    description: 'Returned due to defect or non-conformance',
    requiresProof: ['Rejection notice or quality inspection report', 'Return shipping documentation', 'Original import entry and proof of duty payment', 'Correspondence with supplier regarding rejection'],
  },
};

interface CountryDrawbackRule {
  authority: string;
  form: string;
  maxRate: number;
  timeLimitYears: number;
  minClaim: number;
  currency: string;
  additionalNotes: string[];
}

const COUNTRY_DRAWBACK_RULES: Record<string, CountryDrawbackRule> = {
  US: { authority: 'US CBP', form: 'CBP Form 7551', maxRate: 0.99, timeLimitYears: 5, minClaim: 100, currency: 'USD',
    additionalNotes: ['TFTEA drawback simplification applies (2018+)', 'Claimant must be registered with CBP', 'Accelerated payment available for qualified claimants'] },
  EU: { authority: 'National Customs Authority', form: 'Customs Declaration (re-export)', maxRate: 1.00, timeLimitYears: 3, minClaim: 50, currency: 'EUR',
    additionalNotes: ['Inward Processing authorization required for manufacturing', 'Returned goods relief for rejected items', 'UCC Art. 238 applies'] },
  GB: { authority: 'HMRC', form: 'C285 (Claim for repayment)', maxRate: 1.00, timeLimitYears: 3, minClaim: 50, currency: 'GBP',
    additionalNotes: ['Claim within 3 years of import declaration acceptance', 'Inward Processing for manufacturing drawback'] },
  CA: { authority: 'CBSA', form: 'K32 (Drawback Claim)', maxRate: 1.00, timeLimitYears: 4, minClaim: 100, currency: 'CAD',
    additionalNotes: ['D7-4-2 drawback regulations apply', 'Goods must be exported within 4 years of import'] },
  AU: { authority: 'ABF', form: 'B602 (Drawback Application)', maxRate: 1.00, timeLimitYears: 4, minClaim: 100, currency: 'AUD',
    additionalNotes: ['Section 168 of Customs Act 1901', 'Commercial documentation required'] },
  JP: { authority: 'Japan Customs', form: '関税払戻申請書', maxRate: 1.00, timeLimitYears: 1, minClaim: 10000, currency: 'JPY',
    additionalNotes: ['1-year time limit (shortest among major countries)', 'Must apply before or at time of export'] },
  KR: { authority: 'Korea Customs Service', form: '관세환급신청서', maxRate: 1.00, timeLimitYears: 2, minClaim: 50000, currency: 'KRW',
    additionalNotes: ['Individual/simplified drawback system available', 'Must register as drawback user with KCS'] },
};

// ─── Calculator ─────────────────────────────────────

function calculateDeadline(importDate: string, timeLimitYears: number): Date {
  const d = new Date(importDate);
  d.setFullYear(d.getFullYear() + timeLimitYears);
  return d;
}

export function calculateDrawback(input: DrawbackInput): DrawbackCalculation {
  const country = input.country.toUpperCase();
  const typeInfo = DRAWBACK_TYPES[input.type];
  const rules = COUNTRY_DRAWBACK_RULES[country];

  if (!rules) {
    return {
      eligible: false,
      type: input.type,
      typeDescription: typeInfo.description,
      country,
      dutiesPaid: input.dutiesPaid,
      refundableAmount: 0,
      refundRate: 0,
      filingDeadline: 'Unknown',
      withinTimeLimit: false,
      authority: 'Local customs authority',
      form: 'Contact customs authority',
      requiredDocuments: typeInfo.requiresProof,
      minClaimAmount: { amount: 0, currency: 'USD' },
      process: [],
      ineligibleReason: `No drawback rules available for ${country}. Contact local customs authority.`,
    };
  }

  // Time limit check
  let filingDeadline = `${rules.timeLimitYears} years from import date`;
  let withinTimeLimit = true;
  if (input.importDate) {
    const deadline = calculateDeadline(input.importDate, rules.timeLimitYears);
    filingDeadline = deadline.toISOString().split('T')[0];
    withinTimeLimit = new Date() <= deadline;
  }

  // Min claim check
  const meetsMinClaim = input.dutiesPaid >= rules.minClaim;

  const eligible = withinTimeLimit && meetsMinClaim;
  const rate = Math.min(typeInfo.rate, rules.maxRate);
  const refundableAmount = eligible ? Math.round(input.dutiesPaid * rate * 100) / 100 : 0;

  let ineligibleReason: string | undefined;
  if (!withinTimeLimit) {
    ineligibleReason = `Filing deadline expired. ${rules.timeLimitYears}-year limit from import date has passed.`;
  } else if (!meetsMinClaim) {
    ineligibleReason = `Duty paid (${input.dutiesPaid} ${rules.currency}) below minimum claim amount (${rules.minClaim} ${rules.currency}).`;
  }

  return {
    eligible,
    type: input.type,
    typeDescription: typeInfo.description,
    country,
    dutiesPaid: input.dutiesPaid,
    refundableAmount,
    refundRate: rate,
    filingDeadline,
    withinTimeLimit,
    authority: rules.authority,
    form: rules.form,
    requiredDocuments: typeInfo.requiresProof,
    minClaimAmount: { amount: rules.minClaim, currency: rules.currency },
    process: eligible ? [
      '1. Gather all required documents (see requiredDocuments)',
      `2. Complete ${rules.form}`,
      `3. Submit to ${rules.authority}`,
      `4. Review period: 30-90 days typical`,
      `5. Refund credited: ${refundableAmount > 0 ? `${refundableAmount} ${rules.currency}` : 'pending'}`,
      ...rules.additionalNotes.map((n, i) => `${i + 6}. Note: ${n}`),
    ] : [],
    ineligibleReason,
  };
}
