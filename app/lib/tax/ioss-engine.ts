/**
 * F033: IOSS Engine — S+ Grade
 * IOSS vs non-IOSS comparison, registration guidance.
 */

const EU_VAT_RATES: Record<string, number> = {
  DE: 19, FR: 20, IT: 22, ES: 21, NL: 21, BE: 21, AT: 20, PL: 23, SE: 25,
  DK: 25, FI: 24, IE: 23, PT: 23, GR: 24, CZ: 21, RO: 19, HU: 27, BG: 20,
  HR: 25, SK: 20, SI: 22, LT: 21, LV: 21, EE: 22, CY: 19, MT: 18, LU: 17,
};

export interface IOSSResult {
  iossApplicable: boolean;
  vatRate: number;
  vatAmount: number;
  threshold: number;
  simplifiedDeclaration: boolean;
  currency: string;
}

export interface IOSSComparison {
  withIoss: { buyerPays: number; vatIncluded: boolean; surpriseFees: boolean };
  withoutIoss: { buyerPays: number; importVat: number; handlingFee: number };
  savingsForBuyer: number;
  recommendation: string;
}

export function calculateIOSS(params: { value: number; destinationEuCountry: string }): IOSSResult {
  const { value, destinationEuCountry } = params;
  const country = destinationEuCountry.toUpperCase();
  const vatRate = EU_VAT_RATES[country] || 21;
  const threshold = 150; // EUR

  const iossApplicable = value <= threshold;
  const vatAmount = iossApplicable ? Math.round(value * vatRate / 100 * 100) / 100 : 0;

  return {
    iossApplicable,
    vatRate,
    vatAmount,
    threshold,
    simplifiedDeclaration: iossApplicable,
    currency: 'EUR',
  };
}

export function compareIOSSvsNonIOSS(params: { value: number; destinationEuCountry: string; shippingCost?: number }): IOSSComparison {
  const { value, destinationEuCountry, shippingCost = 0 } = params;
  const vatRate = EU_VAT_RATES[destinationEuCountry.toUpperCase()] || 21;

  const vatWithIOSS = Math.round(value * vatRate / 100 * 100) / 100;
  const withIossTotal = value + shippingCost + vatWithIOSS;

  const importVat = Math.round((value + shippingCost) * vatRate / 100 * 100) / 100;
  const handlingFee = 8; // Typical carrier customs handling fee
  const withoutIossTotal = value + shippingCost + importVat + handlingFee;

  return {
    withIoss: { buyerPays: Math.round(withIossTotal * 100) / 100, vatIncluded: true, surpriseFees: false },
    withoutIoss: { buyerPays: Math.round(withoutIossTotal * 100) / 100, importVat, handlingFee },
    savingsForBuyer: Math.round((withoutIossTotal - withIossTotal) * 100) / 100,
    recommendation: value <= 150
      ? 'IOSS recommended: buyer sees final price at checkout, no surprise fees at delivery.'
      : 'Value exceeds €150 IOSS threshold. Standard import VAT applies.',
  };
}

export function getRegistrationGuidance(sellerCountry: string): {
  steps: string[];
  intermediaryRequired: boolean;
  estimatedCost: string;
  processingTime: string;
} {
  const isEU = !!EU_VAT_RATES[sellerCountry.toUpperCase()];

  if (isEU) {
    return {
      steps: [
        'Register for IOSS in your EU member state',
        'Appoint IOSS intermediary (optional for EU sellers)',
        'Collect VAT at point of sale',
        'File monthly IOSS return',
        'Declare IOSS number on customs declarations',
      ],
      intermediaryRequired: false,
      estimatedCost: '€0-500/year (direct registration)',
      processingTime: '2-4 weeks',
    };
  }

  return {
    steps: [
      'Appoint an EU-established IOSS intermediary',
      'Intermediary registers you for IOSS',
      'Receive IOSS identification number (IM XXX XXXXXXX)',
      'Configure checkout to collect EU VAT',
      'Intermediary files monthly returns on your behalf',
      'Declare IOSS number on all EU-bound shipments ≤€150',
    ],
    intermediaryRequired: true,
    estimatedCost: '€100-300/month (intermediary fee)',
    processingTime: '4-8 weeks',
  };
}
