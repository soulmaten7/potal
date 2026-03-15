/**
 * F002: Detailed Landed Cost Breakdown — S+ Grade
 */

export interface CostBreakdown {
  productValue: number;
  shippingCost: number;
  insuranceCost: number;
  duty: { rate: number; amount: number; type: 'MFN' | 'FTA' | 'MIN' | 'AGR'; ftaName?: string };
  vat: { rate: number; amount: number; baseForVat: number };
  specialTaxes: Array<{ name: string; rate: number; amount: number }>;
  customsFees: Array<{ name: string; amount: number }>;
  totalLandedCost: number;
  marginAnalysis?: { sellingPrice: number; grossMargin: number; netMarginAfterDuties: number };
  metadata: { dataFreshness: Date; ratesValidUntil?: Date; sources: string[] };
}

export function buildBreakdown(params: {
  productValue: number;
  shippingCost: number;
  insuranceCost: number;
  dutyRate: number;
  dutyType: CostBreakdown['duty']['type'];
  ftaName?: string;
  vatRate: number;
  specialTaxes?: Array<{ name: string; rate: number }>;
  customsFees?: Array<{ name: string; amount: number }>;
  sellingPrice?: number;
}): CostBreakdown {
  const { productValue, shippingCost, insuranceCost, dutyRate, dutyType, ftaName, vatRate } = params;
  const cifValue = productValue + shippingCost + insuranceCost;
  const dutyAmount = Math.round(cifValue * dutyRate) / 100;
  const vatBase = cifValue + dutyAmount;
  const vatAmount = Math.round(vatBase * vatRate) / 100;

  const specialTaxes = (params.specialTaxes || []).map(t => ({
    name: t.name,
    rate: t.rate,
    amount: Math.round(cifValue * t.rate) / 100,
  }));

  const customsFees = params.customsFees || [];
  const totalSpecial = specialTaxes.reduce((s, t) => s + t.amount, 0);
  const totalFees = customsFees.reduce((s, f) => s + f.amount, 0);
  const totalLandedCost = Math.round((cifValue + dutyAmount + vatAmount + totalSpecial + totalFees) * 100) / 100;

  let marginAnalysis: CostBreakdown['marginAnalysis'];
  if (params.sellingPrice) {
    const gross = params.sellingPrice - productValue;
    const net = params.sellingPrice - totalLandedCost;
    marginAnalysis = {
      sellingPrice: params.sellingPrice,
      grossMargin: Math.round(gross / params.sellingPrice * 10000) / 100,
      netMarginAfterDuties: Math.round(net / params.sellingPrice * 10000) / 100,
    };
  }

  return {
    productValue, shippingCost, insuranceCost,
    duty: { rate: dutyRate, amount: dutyAmount, type: dutyType, ftaName },
    vat: { rate: vatRate, amount: vatAmount, baseForVat: vatBase },
    specialTaxes, customsFees, totalLandedCost, marginAnalysis,
    metadata: { dataFreshness: new Date(), sources: ['POTAL DB', 'WTO MFN', 'MacMap'] },
  };
}
