/**
 * F011: Insurance Calculation — S+ Grade
 */

export type ProductCategory = 'electronics' | 'textiles' | 'hazmat' | 'fragile' | 'general' | 'luxury' | 'food';

const BASE_RATES: Record<ProductCategory, number> = {
  electronics: 0.015, textiles: 0.008, hazmat: 0.03, fragile: 0.02,
  general: 0.01, luxury: 0.025, food: 0.012,
};

// High-risk route surcharges (origin→destination patterns)
const HIGH_RISK_ROUTES = new Set([
  'NG', 'SO', 'YE', 'LY', 'SY', 'IQ', 'AF', 'VE', 'MM', 'CD',
]);

const MANDATORY_INSURANCE_COUNTRIES = new Set(['BR', 'AR', 'EG', 'NG', 'IN']);

export interface InsuranceResult {
  rate: number;
  amount: number;
  tier: string;
  mandatory: boolean;
  notes: string;
}

export function calculateInsurance(params: {
  value: number;
  category: ProductCategory;
  origin: string;
  destination: string;
  shippingMode?: 'air' | 'sea' | 'land';
}): InsuranceResult {
  const { value, category, origin, destination, shippingMode } = params;
  let rate = BASE_RATES[category] || BASE_RATES.general;

  // Sea freight surcharge
  if (shippingMode === 'sea') rate += 0.003;

  // High-risk route surcharge
  if (HIGH_RISK_ROUTES.has(destination) || HIGH_RISK_ROUTES.has(origin)) {
    rate += 0.005;
  }

  // Value-based tier
  let tier = 'standard';
  if (value > 50000) { tier = 'premium'; rate += 0.002; }
  else if (value > 10000) { tier = 'enhanced'; rate += 0.001; }
  else if (value < 100) { tier = 'basic'; rate = Math.max(rate, 0.005); }

  const amount = Math.round(value * rate * 100) / 100;
  const mandatory = MANDATORY_INSURANCE_COUNTRIES.has(destination);

  const notes = [
    mandatory ? `Insurance is mandatory for imports to ${destination}.` : 'Insurance recommended.',
    tier === 'premium' ? 'High-value shipment: enhanced coverage recommended.' : '',
    HIGH_RISK_ROUTES.has(destination) ? 'High-risk destination surcharge applied (+0.5%).' : '',
  ].filter(Boolean).join(' ');

  return { rate, amount, tier, mandatory, notes };
}
