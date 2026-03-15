/**
 * F036: Cross-Border Returns Calculator
 */

export interface ReturnCost {
  shippingCostEstimate: number;
  dutyRecovery: { eligible: boolean; amount: number; process: string };
  totalReturnCost: number;
  countryRules: { returnWindowDays: number; documentationRequired: string[] };
  netLoss: number;
}

const RETURN_WINDOWS: Record<string, number> = {
  US: 365, EU: 365, GB: 365, CA: 365, AU: 365, JP: 180, KR: 365, CN: 90,
};

export function calculateReturnCost(params: {
  originalImport: { country: string; value: number; dutyPaid: number };
  returnDestination: string;
  shippingEstimate?: number;
}): ReturnCost {
  const { originalImport, returnDestination, shippingEstimate } = params;
  const dest = originalImport.country.toUpperCase();

  const shippingCostEstimate = shippingEstimate || Math.max(15, originalImport.value * 0.1);

  // Most countries allow duty recovery on returned goods
  const eligible = true;
  const recoveryRate = 0.99; // 99% refund typical
  const dutyRecoveryAmount = Math.round(originalImport.dutyPaid * recoveryRate * 100) / 100;

  const returnWindowDays = RETURN_WINDOWS[dest] || 180;
  const documentationRequired = [
    'Proof of original import (entry number)',
    'Proof of return shipment',
    'Commercial invoice for return',
    'Reason for return documentation',
  ];

  if (dest === 'US') documentationRequired.push('CBP Form 4315 (if claiming drawback)');
  if (dest === 'EU' || dest === 'GB') documentationRequired.push('Return goods relief application');

  const totalReturnCost = shippingCostEstimate;
  const netLoss = Math.round((totalReturnCost + originalImport.dutyPaid - dutyRecoveryAmount) * 100) / 100;

  return {
    shippingCostEstimate: Math.round(shippingCostEstimate * 100) / 100,
    dutyRecovery: { eligible, amount: dutyRecoveryAmount, process: `File duty refund claim within ${returnWindowDays} days of original import.` },
    totalReturnCost: Math.round(totalReturnCost * 100) / 100,
    countryRules: { returnWindowDays, documentationRequired },
    netLoss,
  };
}
