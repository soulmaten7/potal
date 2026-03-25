/**
 * F138: Multi-hub Inventory — Optimal Hub Selection
 *
 * Selects the best fulfillment hub for a shipment based on:
 * - Estimated landed cost (duties + tax + shipping)
 * - FTA availability (preferential rates)
 * - Export restrictions (skip blocked hubs)
 * - Inventory availability
 */

// ─── Types ──────────────────────────────────────────

export interface Hub {
  id: string;
  name: string;
  countryCode: string;
  type: 'warehouse' | '3pl' | 'dropship' | 'fba';
  isActive: boolean;
  priority: number;
  address?: string;
}

export interface HubInventory {
  hubId: string;
  sku: string;
  quantity: number;
  reserved: number;
  available: number;
}

export interface HubCostEstimate {
  hubId: string;
  hubName: string;
  hubCountry: string;
  estimatedDutyRate: number;
  estimatedShippingCost: number;
  estimatedTax: number;
  totalLandedCost: number;
  hasFta: boolean;
  exportAllowed: boolean;
  inStock: boolean;
  score: number;
}

export interface OptimalHubResult {
  recommended: HubCostEstimate | null;
  alternatives: HubCostEstimate[];
  destinationCountry: string;
  productHs6: string;
}

// ─── Distance-based Shipping Estimate ────────────────

/** Rough shipping cost estimate based on region distance */
function estimateShippingCost(originCountry: string, destCountry: string, weightKg: number): number {
  if (originCountry === destCountry) return Math.max(5, weightKg * 2); // Domestic

  // Region grouping
  const REGIONS: Record<string, string[]> = {
    NA: ['US', 'CA', 'MX'],
    EU: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'PL', 'CZ', 'SE', 'DK', 'FI', 'IE', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT'],
    APAC: ['CN', 'JP', 'KR', 'AU', 'SG', 'TW', 'HK', 'TH', 'VN', 'MY', 'ID', 'PH', 'IN'],
    UK: ['GB'],
  };

  const getRegion = (cc: string) => Object.entries(REGIONS).find(([, countries]) => countries.includes(cc))?.[0] || 'OTHER';
  const originRegion = getRegion(originCountry);
  const destRegion = getRegion(destCountry);

  if (originRegion === destRegion) return Math.max(8, weightKg * 5); // Intra-region
  return Math.max(15, weightKg * 12); // Inter-region
}

// ─── FTA Check (simplified) ──────────────────────────

const FTA_PAIRS = new Set([
  'US-CA', 'CA-US', 'US-MX', 'MX-US', // USMCA
  'AU-NZ', 'NZ-AU', // ANZCERTA
  'JP-AU', 'AU-JP', // JAEPA
  'KR-US', 'US-KR', // KORUS
  'GB-AU', 'AU-GB', // UK-AU FTA
  'GB-NZ', 'NZ-GB', // UK-NZ FTA
]);
// EU intra-trade is duty-free
const EU_SET = new Set(['DE','FR','IT','ES','NL','BE','AT','PT','GR','PL','CZ','SE','DK','FI','IE','HU','RO','BG','HR','SK','SI','LT','LV','EE','CY','LU','MT']);

function hasFta(origin: string, dest: string): boolean {
  if (EU_SET.has(origin) && EU_SET.has(dest)) return true;
  return FTA_PAIRS.has(`${origin}-${dest}`);
}

// ─── Optimal Hub Selection ───────────────────────────

/**
 * Select optimal fulfillment hub based on lowest total landed cost.
 *
 * @param destinationCountry - Buyer's country (ISO2)
 * @param productHs6 - Product HS code (6 digits)
 * @param hubs - Available fulfillment hubs
 * @param inventory - Optional inventory levels per hub
 * @param productValue - Declared value in USD
 * @param weightKg - Product weight in kg
 */
export function selectOptimalHub(params: {
  destinationCountry: string;
  productHs6: string;
  hubs: Hub[];
  inventory?: HubInventory[];
  productValue?: number;
  weightKg?: number;
}): OptimalHubResult {
  const { destinationCountry, productHs6, hubs, inventory, productValue = 50, weightKg = 1 } = params;
  const dest = destinationCountry.toUpperCase();

  const estimates: HubCostEstimate[] = [];

  for (const hub of hubs) {
    if (!hub.isActive) continue;

    const origin = hub.countryCode.toUpperCase();
    const fta = hasFta(origin, dest);

    // Duty estimate: FTA = 0%, same country = 0%, else ~5-15% average
    const baseDutyRate = origin === dest ? 0 : fta ? 0.02 : 0.10; // rough averages
    const estimatedDuty = Math.round(productValue * baseDutyRate * 100) / 100;

    // Shipping estimate
    const shipping = Math.round(estimateShippingCost(origin, dest, weightKg) * 100) / 100;

    // Tax estimate (rough: 10% average)
    const taxRate = origin === dest ? 0 : 0.10;
    const tax = Math.round((productValue + estimatedDuty) * taxRate * 100) / 100;

    const totalLandedCost = Math.round((productValue + estimatedDuty + shipping + tax) * 100) / 100;

    // Check inventory
    const inv = inventory?.find(i => i.hubId === hub.id);
    const inStock = inv ? inv.available > 0 : true; // Assume in stock if no inventory data

    // Export allowed (basic: not embargoed destinations from this origin)
    const EMBARGOED = new Set(['CU', 'IR', 'KP', 'SY']);
    const exportAllowed = !EMBARGOED.has(dest);

    // Score: lower cost = higher score, FTA bonus, in-stock bonus, priority bonus
    let score = 1000 - totalLandedCost; // Invert: lower cost → higher score
    if (fta) score += 50;
    if (inStock) score += 30;
    if (origin === dest) score += 100; // Domestic = huge advantage
    score += hub.priority * 10;
    if (!exportAllowed) score = -999;

    estimates.push({
      hubId: hub.id,
      hubName: hub.name,
      hubCountry: origin,
      estimatedDutyRate: baseDutyRate,
      estimatedShippingCost: shipping,
      estimatedTax: tax,
      totalLandedCost,
      hasFta: fta,
      exportAllowed,
      inStock,
      score: Math.round(score),
    });
  }

  // Sort by score (highest first)
  estimates.sort((a, b) => b.score - a.score);

  const allowed = estimates.filter(e => e.exportAllowed);

  return {
    recommended: allowed[0] || null,
    alternatives: allowed.slice(1, 5),
    destinationCountry: dest,
    productHs6,
  };
}
