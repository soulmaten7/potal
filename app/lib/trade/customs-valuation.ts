/**
 * F024: Customs Valuation — WTO 6-method hierarchy
 */

export interface ValuationInput {
  transactionValue: number;
  freight?: number;
  insurance?: number;
  incoterm: string;
  assistsValue?: number;
  royalties?: number;
  relatedParty: boolean;
  buyingCommissions?: number;
}

export interface ValuationResult {
  customsValue: number;
  methodUsed: 1 | 2 | 3 | 4 | 5 | 6;
  methodName: string;
  breakdown: {
    fob: number;
    freight: number;
    insurance: number;
    assists: number;
    royalties: number;
    adjustments: number;
  };
  relatedPartyFlag: boolean;
  firstSaleApplicable: boolean;
}

// Incoterm → FOB adjustment factors
const INCOTERM_TO_FOB: Record<string, { includesFreight: boolean; includesInsurance: boolean }> = {
  EXW: { includesFreight: false, includesInsurance: false },
  FCA: { includesFreight: false, includesInsurance: false },
  FAS: { includesFreight: false, includesInsurance: false },
  FOB: { includesFreight: false, includesInsurance: false },
  CFR: { includesFreight: true, includesInsurance: false },
  CIF: { includesFreight: true, includesInsurance: true },
  CPT: { includesFreight: true, includesInsurance: false },
  CIP: { includesFreight: true, includesInsurance: true },
  DAP: { includesFreight: true, includesInsurance: false },
  DPU: { includesFreight: true, includesInsurance: false },
  DDP: { includesFreight: true, includesInsurance: true },
};

export function calculateCustomsValue(input: ValuationInput): ValuationResult {
  const { transactionValue, freight = 0, insurance = 0, incoterm, assistsValue = 0, royalties = 0, relatedParty, buyingCommissions = 0 } = input;

  const incotermInfo = INCOTERM_TO_FOB[incoterm.toUpperCase()] || INCOTERM_TO_FOB['FOB'];

  // Method 1: Transaction value (primary method ~95% of cases)
  let fob = transactionValue;
  if (incotermInfo.includesFreight) fob -= freight;
  if (incotermInfo.includesInsurance) fob -= insurance;

  // Add dutiable assists and royalties
  const adjustments = assistsValue + royalties - buyingCommissions;

  // CIF-based customs value (most countries use CIF)
  const customsValue = Math.round((fob + freight + insurance + adjustments) * 100) / 100;

  const methodUsed: ValuationResult['methodUsed'] = relatedParty && transactionValue === 0 ? 6 : 1;
  const methodNames: Record<number, string> = {
    1: 'Transaction Value', 2: 'Identical Goods', 3: 'Similar Goods',
    4: 'Deductive Method', 5: 'Computed Method', 6: 'Fallback Method',
  };

  return {
    customsValue,
    methodUsed,
    methodName: methodNames[methodUsed],
    breakdown: {
      fob: Math.round(fob * 100) / 100,
      freight, insurance,
      assists: assistsValue,
      royalties,
      adjustments: Math.round(adjustments * 100) / 100,
    },
    relatedPartyFlag: relatedParty,
    firstSaleApplicable: relatedParty && transactionValue > 0,
  };
}
