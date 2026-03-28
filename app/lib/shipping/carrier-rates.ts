/**
 * F060: Multi-Carrier Shipping Rate Comparison
 *
 * Compares rates across 8 major carriers with service levels.
 * Returns estimated rates, transit times, and landed cost totals.
 */

export interface ShipmentParams {
  originCountry: string;
  destinationCountry: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue: number;
  currency?: string;
}

export interface CarrierRate {
  carrier: string;
  service: string;
  serviceLevel: 'express' | 'standard' | 'economy';
  rate: number;
  currency: string;
  estimatedDays: { min: number; max: number };
  trackingAvailable: boolean;
  insuranceIncluded: boolean;
  maxWeightKg: number;
}

export interface CarrierComparison {
  carriers: Array<CarrierRate & { landedCostTotal?: number }>;
  recommendation: {
    cheapest: string;
    fastest: string;
    bestValue: string;
  };
  shipmentDetails: ShipmentParams;
}

// ─── Carrier Base Rates (per kg, simplified) ────────

interface CarrierConfig {
  name: string;
  services: Array<{
    name: string;
    level: 'express' | 'standard' | 'economy';
    baseRate: number;        // USD per kg
    minCharge: number;
    transitDays: { domestic: [number, number]; international: [number, number] };
    maxWeightKg: number;
    tracking: boolean;
    insurance: boolean;
  }>;
  zones: Record<string, number>; // destination zone multipliers
}

const CARRIERS: CarrierConfig[] = [
  {
    name: 'DHL Express',
    services: [
      { name: 'Express Worldwide', level: 'express', baseRate: 12.50, minCharge: 45, transitDays: { domestic: [1, 2], international: [2, 5] }, maxWeightKg: 70, tracking: true, insurance: true },
      { name: 'Economy Select', level: 'economy', baseRate: 7.80, minCharge: 30, transitDays: { domestic: [2, 4], international: [5, 12] }, maxWeightKg: 70, tracking: true, insurance: false },
    ],
    zones: { NA: 1.0, EU: 0.9, APAC: 1.2, LATAM: 1.3, MENA: 1.4, AF: 1.6 },
  },
  {
    name: 'FedEx',
    services: [
      { name: 'International Priority', level: 'express', baseRate: 13.00, minCharge: 50, transitDays: { domestic: [1, 2], international: [1, 3] }, maxWeightKg: 68, tracking: true, insurance: true },
      { name: 'International Economy', level: 'standard', baseRate: 8.50, minCharge: 35, transitDays: { domestic: [2, 5], international: [4, 7] }, maxWeightKg: 68, tracking: true, insurance: false },
    ],
    zones: { NA: 0.95, EU: 1.0, APAC: 1.15, LATAM: 1.25, MENA: 1.35, AF: 1.5 },
  },
  {
    name: 'UPS',
    services: [
      { name: 'Worldwide Express', level: 'express', baseRate: 12.80, minCharge: 48, transitDays: { domestic: [1, 2], international: [1, 3] }, maxWeightKg: 70, tracking: true, insurance: true },
      { name: 'Worldwide Expedited', level: 'standard', baseRate: 8.20, minCharge: 32, transitDays: { domestic: [3, 5], international: [3, 7] }, maxWeightKg: 70, tracking: true, insurance: false },
      { name: 'Standard', level: 'economy', baseRate: 5.50, minCharge: 20, transitDays: { domestic: [5, 8], international: [7, 14] }, maxWeightKg: 70, tracking: true, insurance: false },
    ],
    zones: { NA: 0.9, EU: 1.0, APAC: 1.2, LATAM: 1.3, MENA: 1.35, AF: 1.5 },
  },
  {
    name: 'USPS',
    services: [
      { name: 'Priority Mail Express International', level: 'express', baseRate: 8.50, minCharge: 40, transitDays: { domestic: [1, 2], international: [3, 5] }, maxWeightKg: 30, tracking: true, insurance: true },
      { name: 'Priority Mail International', level: 'standard', baseRate: 5.80, minCharge: 25, transitDays: { domestic: [2, 3], international: [6, 10] }, maxWeightKg: 30, tracking: true, insurance: false },
      { name: 'First-Class Package International', level: 'economy', baseRate: 3.50, minCharge: 14, transitDays: { domestic: [5, 7], international: [10, 21] }, maxWeightKg: 2, tracking: true, insurance: false },
    ],
    zones: { NA: 0.85, EU: 1.0, APAC: 1.1, LATAM: 1.0, MENA: 1.2, AF: 1.4 },
  },
  {
    name: 'EMS',
    services: [
      { name: 'EMS Express', level: 'express', baseRate: 7.00, minCharge: 30, transitDays: { domestic: [1, 2], international: [3, 7] }, maxWeightKg: 30, tracking: true, insurance: false },
    ],
    zones: { NA: 1.0, EU: 1.0, APAC: 0.8, LATAM: 1.1, MENA: 1.2, AF: 1.3 },
  },
  {
    name: 'Royal Mail',
    services: [
      { name: 'International Tracked & Signed', level: 'standard', baseRate: 6.50, minCharge: 15, transitDays: { domestic: [1, 3], international: [5, 10] }, maxWeightKg: 30, tracking: true, insurance: false },
      { name: 'International Economy', level: 'economy', baseRate: 4.00, minCharge: 10, transitDays: { domestic: [3, 5], international: [10, 25] }, maxWeightKg: 30, tracking: false, insurance: false },
    ],
    zones: { NA: 1.1, EU: 0.85, APAC: 1.2, LATAM: 1.3, MENA: 1.2, AF: 1.4 },
  },
  {
    name: 'Australia Post',
    services: [
      { name: 'Express International', level: 'express', baseRate: 9.00, minCharge: 35, transitDays: { domestic: [1, 3], international: [3, 6] }, maxWeightKg: 20, tracking: true, insurance: true },
      { name: 'Standard International', level: 'standard', baseRate: 5.50, minCharge: 20, transitDays: { domestic: [3, 7], international: [6, 15] }, maxWeightKg: 20, tracking: true, insurance: false },
    ],
    zones: { NA: 1.2, EU: 1.2, APAC: 0.8, LATAM: 1.3, MENA: 1.3, AF: 1.5 },
  },
  {
    name: 'Canada Post',
    services: [
      { name: 'Xpresspost International', level: 'express', baseRate: 8.80, minCharge: 35, transitDays: { domestic: [1, 2], international: [4, 7] }, maxWeightKg: 30, tracking: true, insurance: true },
      { name: 'International Parcel', level: 'standard', baseRate: 5.20, minCharge: 18, transitDays: { domestic: [4, 8], international: [8, 15] }, maxWeightKg: 30, tracking: true, insurance: false },
    ],
    zones: { NA: 0.8, EU: 1.0, APAC: 1.15, LATAM: 1.1, MENA: 1.3, AF: 1.5 },
  },
];

// ─── Zone Detection ─────────────────────────────────

function getZone(country: string): string {
  const zones: Record<string, string[]> = {
    NA: ['US', 'CA', 'MX'],
    EU: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'GB', 'CH', 'NO'],
    APAC: ['CN', 'JP', 'KR', 'AU', 'NZ', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH', 'IN', 'TW', 'HK'],
    LATAM: ['BR', 'AR', 'CL', 'CO', 'PE', 'EC'],
    MENA: ['AE', 'SA', 'IL', 'TR', 'EG', 'QA', 'KW', 'BH', 'OM'],
    AF: ['ZA', 'NG', 'KE', 'GH', 'TZ'],
  };
  for (const [zone, countries] of Object.entries(zones)) {
    if (countries.includes(country)) return zone;
  }
  return 'APAC'; // default
}

function calculateVolumetricWeight(l: number, w: number, h: number): number {
  return (l * w * h) / 5000; // industry standard divisor
}

// ─── Main Functions ─────────────────────────────────

export function getCarrierRates(params: ShipmentParams): CarrierRate[] {
  const zone = getZone(params.destinationCountry);
  const isDomestic = params.originCountry === params.destinationCountry;

  // Volumetric weight check
  let effectiveWeight = params.weightKg;
  if (params.lengthCm && params.widthCm && params.heightCm) {
    const volumetric = calculateVolumetricWeight(params.lengthCm, params.widthCm, params.heightCm);
    effectiveWeight = Math.max(params.weightKg, volumetric);
  }

  const rates: CarrierRate[] = [];

  for (const carrier of CARRIERS) {
    const zoneMult = carrier.zones[zone] || 1.0;

    for (const service of carrier.services) {
      if (effectiveWeight > service.maxWeightKg) continue;

      const rawRate = Math.max(service.minCharge, effectiveWeight * service.baseRate * zoneMult);
      const transit = isDomestic ? service.transitDays.domestic : service.transitDays.international;

      rates.push({
        carrier: carrier.name,
        service: service.name,
        serviceLevel: service.level,
        rate: Math.round(rawRate * 100) / 100,
        currency: params.currency || 'USD',
        estimatedDays: { min: transit[0], max: transit[1] },
        trackingAvailable: service.tracking,
        insuranceIncluded: service.insurance,
        maxWeightKg: service.maxWeightKg,
      });
    }
  }

  return rates.sort((a, b) => a.rate - b.rate);
}

export function recommendCarrier(
  rates: CarrierRate[],
  priority: 'cheapest' | 'fastest' | 'best_value' = 'best_value'
): CarrierRate | null {
  if (rates.length === 0) return null;

  switch (priority) {
    case 'cheapest':
      return rates.reduce((min, r) => r.rate < min.rate ? r : min, rates[0]);
    case 'fastest':
      return rates.reduce((fast, r) => r.estimatedDays.min < fast.estimatedDays.min ? r : fast, rates[0]);
    case 'best_value': {
      // Best ratio of cost to speed
      return rates.reduce((best, r) => {
        const score = r.rate / Math.max(1, r.estimatedDays.max);
        const bestScore = best.rate / Math.max(1, best.estimatedDays.max);
        return score < bestScore ? r : best;
      }, rates[0]);
    }
  }
}

// ─── Landed Cost Integrated Comparison ────────────────

export interface LandedCostCarrierRate extends CarrierRate {
  estimatedDuty: number;
  estimatedTax: number;
  insuranceFee: number;
  totalLandedCost: number;
}

/**
 * Compare carrier rates with landed cost integration.
 * Adds duty, tax, and insurance estimates to each carrier option
 * for true total-cost comparison.
 */
export function getCarrierRatesWithLandedCost(
  params: ShipmentParams & { dutyRate?: number; taxRate?: number; includeInsurance?: boolean }
): CarrierComparison {
  const rates = getCarrierRates(params);
  const dutyRate = params.dutyRate ?? 0;
  const taxRate = params.taxRate ?? 0;
  const includeInsurance = params.includeInsurance ?? false;

  const enriched: Array<CarrierRate & { landedCostTotal: number; breakdown: { shippingCost: number; duty: number; tax: number; insurance: number } }> = rates.map(rate => {
    const duty = Math.round(params.declaredValue * dutyRate * 100) / 100;
    const taxableBase = params.declaredValue + duty + rate.rate;
    const tax = Math.round(taxableBase * taxRate * 100) / 100;
    const insurance = includeInsurance ? Math.round(Math.max(2, params.declaredValue * 0.015) * 100) / 100 : 0;
    const landedCostTotal = Math.round((params.declaredValue + rate.rate + duty + tax + insurance) * 100) / 100;

    return {
      ...rate,
      landedCostTotal,
      breakdown: {
        shippingCost: rate.rate,
        duty,
        tax,
        insurance,
      },
    };
  });

  enriched.sort((a, b) => a.landedCostTotal - b.landedCostTotal);

  const cheapest = enriched[0] || null;
  const fastest = enriched.length > 0
    ? enriched.reduce((f, r) => r.estimatedDays.min < f.estimatedDays.min ? r : f, enriched[0])
    : null;
  const bestValue = enriched.length > 0
    ? enriched.reduce((best, r) => {
        const score = r.landedCostTotal / Math.max(1, r.estimatedDays.max);
        const bestScore = best.landedCostTotal / Math.max(1, best.estimatedDays.max);
        return score < bestScore ? r : best;
      }, enriched[0])
    : null;

  return {
    carriers: enriched,
    recommendation: {
      cheapest: cheapest?.carrier || '',
      fastest: fastest?.carrier || '',
      bestValue: bestValue?.carrier || '',
    },
    shipmentDetails: params,
  };
}

/**
 * Calculate dimensional weight for a package.
 * Standard DIM factor: 5000 (international), 6000 (domestic US).
 */
export function calculateDimWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  dimFactor: number = 5000
): { volumetricWeightKg: number; cubicCm: number; dimFactor: number } {
  const cubicCm = lengthCm * widthCm * heightCm;
  const volumetricWeightKg = Math.round((cubicCm / dimFactor) * 100) / 100;
  return { volumetricWeightKg, cubicCm, dimFactor };
}

/**
 * Calculate shipping insurance premium based on CIF value.
 * Standard rate: 1.5% of declared value, minimum $2.
 */
export function calculateInsurancePremium(
  declaredValue: number,
  shippingCost: number,
  coverageType: 'basic' | 'full' | 'premium' = 'basic'
): { premium: number; coverageAmount: number; coverageType: string; deductible: number } {
  const rates: Record<string, { rate: number; deductible: number; coverageMultiplier: number }> = {
    basic: { rate: 0.015, deductible: 50, coverageMultiplier: 1.0 },
    full: { rate: 0.025, deductible: 25, coverageMultiplier: 1.1 },
    premium: { rate: 0.035, deductible: 0, coverageMultiplier: 1.2 },
  };
  const config = rates[coverageType];
  const cifValue = declaredValue + shippingCost;
  const coverageAmount = Math.round(cifValue * config.coverageMultiplier * 100) / 100;
  const premium = Math.round(Math.max(2, cifValue * config.rate) * 100) / 100;

  return { premium, coverageAmount, coverageType, deductible: config.deductible };
}
