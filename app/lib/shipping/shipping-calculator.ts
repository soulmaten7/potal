/**
 * F014: Shipping Cost Estimation — S+ Grade
 * Market-average ranges by region, weight, and service tier.
 */

export interface ShippingEstimate {
  estimates: Array<{
    tier: 'express' | 'standard' | 'economy';
    costMin: number;
    costMax: number;
    transitDaysMin: number;
    transitDaysMax: number;
    carrierType: string;
  }>;
  dimWeight?: number;
  actualWeight: number;
  billedWeight: number;
  surcharges: Array<{ name: string; amount: number }>;
}

// Regional base rates (USD per kg, approximate market averages)
const REGIONAL_RATES: Record<string, { express: number; standard: number; economy: number }> = {
  'NA-EU': { express: 12, standard: 6, economy: 3.5 },
  'NA-ASIA': { express: 15, standard: 8, economy: 4 },
  'EU-ASIA': { express: 14, standard: 7, economy: 3.5 },
  'NA-NA': { express: 8, standard: 4, economy: 2 },
  'EU-EU': { express: 6, standard: 3, economy: 1.5 },
  'ASIA-ASIA': { express: 8, standard: 4, economy: 2 },
  'DEFAULT': { express: 16, standard: 9, economy: 5 },
};

const TRANSIT_DAYS: Record<string, { express: [number, number]; standard: [number, number]; economy: [number, number] }> = {
  'NA-EU': { express: [2, 4], standard: [5, 10], economy: [10, 20] },
  'NA-ASIA': { express: [3, 5], standard: [7, 14], economy: [14, 30] },
  'EU-ASIA': { express: [3, 5], standard: [7, 14], economy: [14, 30] },
  'NA-NA': { express: [1, 3], standard: [3, 7], economy: [5, 14] },
  'EU-EU': { express: [1, 3], standard: [3, 7], economy: [5, 14] },
  'ASIA-ASIA': { express: [2, 4], standard: [5, 10], economy: [10, 20] },
  'DEFAULT': { express: [3, 7], standard: [7, 21], economy: [14, 45] },
};

function getRegion(country: string): string {
  const NA = new Set(['US', 'CA', 'MX']);
  const EU_SET = new Set(['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'GB']);
  const ASIA = new Set(['CN', 'JP', 'KR', 'IN', 'TW', 'TH', 'VN', 'MY', 'SG', 'ID', 'PH', 'BD', 'PK', 'HK', 'AU', 'NZ']);
  if (NA.has(country)) return 'NA';
  if (EU_SET.has(country)) return 'EU';
  if (ASIA.has(country)) return 'ASIA';
  return 'OTHER';
}

export function calculateDimWeight(length: number, width: number, height: number, unit: 'cm' | 'in' = 'cm'): number {
  const l = unit === 'in' ? length * 2.54 : length;
  const w = unit === 'in' ? width * 2.54 : width;
  const h = unit === 'in' ? height * 2.54 : height;
  return Math.round(l * w * h / 5000 * 100) / 100;
}

export function estimateShipping(params: {
  origin: string;
  destination: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  mode?: 'express' | 'standard' | 'economy';
}): ShippingEstimate {
  const { origin, destination, weightKg } = params;
  const originRegion = getRegion(origin.toUpperCase());
  const destRegion = getRegion(destination.toUpperCase());

  const routeKey = `${originRegion}-${destRegion}`;
  const rates = REGIONAL_RATES[routeKey] || REGIONAL_RATES['DEFAULT'];
  const transit = TRANSIT_DAYS[routeKey] || TRANSIT_DAYS['DEFAULT'];

  let dimWeight: number | undefined;
  const actualWeight = weightKg;
  let billedWeight = actualWeight;

  if (params.lengthCm && params.widthCm && params.heightCm) {
    dimWeight = calculateDimWeight(params.lengthCm, params.widthCm, params.heightCm);
    billedWeight = Math.max(actualWeight, dimWeight);
  }

  const surcharges: Array<{ name: string; amount: number }> = [];

  // Fuel surcharge (~15% average)
  const fuelPct = 0.15;

  // Remote area
  const REMOTE = new Set(['IS', 'GL', 'FO', 'FK', 'GU', 'AS']);
  if (REMOTE.has(destination.toUpperCase())) {
    surcharges.push({ name: 'Remote area surcharge', amount: 15 });
  }

  // Oversize
  if (billedWeight > 30) {
    surcharges.push({ name: 'Overweight handling', amount: 25 });
  }

  const tiers: Array<'express' | 'standard' | 'economy'> = params.mode ? [params.mode] : ['express', 'standard', 'economy'];
  const totalSurcharge = surcharges.reduce((s, c) => s + c.amount, 0);

  const estimates = tiers.map(tier => {
    const base = rates[tier] * billedWeight;
    const fuel = base * fuelPct;
    const costMin = Math.round((base + fuel + totalSurcharge) * 0.85 * 100) / 100;
    const costMax = Math.round((base + fuel + totalSurcharge) * 1.15 * 100) / 100;
    const [tMin, tMax] = transit[tier];

    return {
      tier,
      costMin, costMax,
      transitDaysMin: tMin, transitDaysMax: tMax,
      carrierType: tier === 'express' ? 'Courier (DHL/FedEx/UPS)' : tier === 'standard' ? 'Postal/Parcel' : 'Freight/Economy',
    };
  });

  return { estimates, dimWeight, actualWeight, billedWeight, surcharges };
}
