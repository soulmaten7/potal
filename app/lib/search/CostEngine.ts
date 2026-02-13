/**
 * POTAL CostEngine — Total Landed Cost Calculator
 *
 * Calculates the TRUE cost of a product including:
 * - Product price
 * - Shipping cost
 * - Import duty (for Global: US de minimis $800 rule)
 * - Estimated sales tax (for Domestic: state-based)
 *
 * Philosophy: Show the most accurate estimate possible.
 * User sees "Expected Total" — honest about it being an estimate.
 */

import type { Product } from '../../types/product';

export interface LandedCost {
  /** Original product price */
  productPrice: number;
  /** Shipping cost (0 for free shipping) */
  shippingCost: number;
  /** Import duty amount (0 if under de minimis or domestic) */
  importDuty: number;
  /** Estimated sales tax */
  salesTax: number;
  /** Total = product + shipping + duty + tax */
  totalLandedCost: number;
  /** Whether this is domestic or global */
  type: 'domestic' | 'global';
  /** Whether duty-free (under $800 for US imports) */
  isDutyFree: boolean;
  /** Breakdown text for display */
  breakdown: CostBreakdownItem[];
}

export interface CostBreakdownItem {
  label: string;
  amount: number;
  note?: string;
}

// ─── US Import Rules ─────────────────────────────────

/** US de minimis threshold - packages under this value are duty-free */
const US_DE_MINIMIS = 800;

/** Average US sales tax rate by state (simplified) */
const STATE_TAX_RATES: Record<string, number> = {
  // No sales tax states
  'OR': 0, 'MT': 0, 'NH': 0, 'DE': 0, 'AK': 0,
  // Major states (approximate combined state + local average)
  'CA': 0.0875, 'NY': 0.08, 'TX': 0.0825, 'FL': 0.07,
  'WA': 0.0892, 'IL': 0.0882, 'PA': 0.0634, 'OH': 0.0723,
  'GA': 0.0732, 'NC': 0.0698, 'MI': 0.06, 'NJ': 0.0663,
  'VA': 0.057, 'AZ': 0.084, 'MA': 0.0625, 'TN': 0.0955,
  'IN': 0.07, 'MO': 0.0823, 'MD': 0.06, 'WI': 0.055,
  'CO': 0.077, 'MN': 0.0773, 'SC': 0.0746, 'AL': 0.0922,
  'LA': 0.0955, 'KY': 0.06, 'CT': 0.0635, 'UT': 0.0719,
  'IA': 0.0694, 'NV': 0.0823, 'AR': 0.0947, 'MS': 0.07,
  'KS': 0.087, 'NE': 0.0694, 'NM': 0.0781, 'ID': 0.06,
  'WV': 0.065, 'HI': 0.0444, 'ME': 0.055, 'RI': 0.07,
  'SD': 0.064, 'ND': 0.0696, 'VT': 0.063, 'WY': 0.054,
  'DC': 0.06, 'PR': 0.115,
};

/** Default tax rate when state is unknown */
const DEFAULT_TAX_RATE = 0.07;

/** Average import duty rate for general merchandise (when over $800) */
const AVG_IMPORT_DUTY_RATE = 0.05; // 5% average

// ─── Zipcode to State Mapping (first 3 digits) ──────

function zipcodeToState(zipcode: string): string | null {
  if (!zipcode || zipcode.length < 3) return null;
  const prefix = parseInt(zipcode.substring(0, 3), 10);

  // Major zipcode prefix ranges → state codes
  if (prefix >= 100 && prefix <= 149) return 'NY';
  if (prefix >= 150 && prefix <= 196) return 'PA';
  if (prefix >= 197 && prefix <= 199) return 'DE';
  if (prefix >= 200 && prefix <= 205) return 'DC';
  if (prefix >= 206 && prefix <= 219) return 'MD';
  if (prefix >= 220 && prefix <= 246) return 'VA';
  if (prefix >= 247 && prefix <= 268) return 'WV';
  if (prefix >= 270 && prefix <= 289) return 'NC';
  if (prefix >= 290 && prefix <= 299) return 'SC';
  if (prefix >= 300 && prefix <= 319) return 'GA';
  if (prefix >= 320 && prefix <= 349) return 'FL';
  if (prefix >= 350 && prefix <= 369) return 'AL';
  if (prefix >= 370 && prefix <= 385) return 'TN';
  if (prefix >= 386 && prefix <= 397) return 'MS';
  if (prefix >= 400 && prefix <= 427) return 'KY';
  if (prefix >= 430 && prefix <= 458) return 'OH';
  if (prefix >= 460 && prefix <= 479) return 'IN';
  if (prefix >= 480 && prefix <= 499) return 'MI';
  if (prefix >= 500 && prefix <= 528) return 'IA';
  if (prefix >= 530 && prefix <= 549) return 'WI';
  if (prefix >= 550 && prefix <= 567) return 'MN';
  if (prefix >= 570 && prefix <= 577) return 'SD';
  if (prefix >= 580 && prefix <= 588) return 'ND';
  if (prefix >= 590 && prefix <= 599) return 'MT';
  if (prefix >= 600 && prefix <= 629) return 'IL';
  if (prefix >= 630 && prefix <= 658) return 'MO';
  if (prefix >= 660 && prefix <= 679) return 'KS';
  if (prefix >= 680 && prefix <= 693) return 'NE';
  if (prefix >= 700 && prefix <= 714) return 'LA';
  if (prefix >= 716 && prefix <= 729) return 'AR';
  if (prefix >= 730 && prefix <= 749) return 'OK';
  if (prefix >= 750 && prefix <= 799) return 'TX';
  if (prefix >= 800 && prefix <= 816) return 'CO';
  if (prefix >= 820 && prefix <= 831) return 'WY';
  if (prefix >= 832 && prefix <= 838) return 'ID';
  if (prefix >= 840 && prefix <= 847) return 'UT';
  if (prefix >= 850 && prefix <= 865) return 'AZ';
  if (prefix >= 870 && prefix <= 884) return 'NM';
  if (prefix >= 889 && prefix <= 898) return 'NV';
  if (prefix >= 900 && prefix <= 961) return 'CA';
  if (prefix >= 967 && prefix <= 968) return 'HI';
  if (prefix >= 970 && prefix <= 979) return 'OR';
  if (prefix >= 980 && prefix <= 994) return 'WA';
  if (prefix >= 995 && prefix <= 999) return 'AK';

  return null;
}

// ─── Main Calculator ─────────────────────────────────

export function calculateLandedCost(
  product: Product,
  options?: {
    zipcode?: string;
  }
): LandedCost {
  const productPrice = parsePriceToNumber(product.price);
  const shippingCost = product.shippingPrice ?? 0;
  const isDomestic = (product.shipping || '').toLowerCase().includes('domestic');
  const zipcode = options?.zipcode || '';

  if (isDomestic) {
    // ── Domestic: Product + Shipping + Sales Tax ──
    const state = zipcodeToState(zipcode);
    const taxRate = state ? (STATE_TAX_RATES[state] ?? DEFAULT_TAX_RATE) : DEFAULT_TAX_RATE;
    const salesTax = productPrice * taxRate;

    const breakdown: CostBreakdownItem[] = [
      { label: 'Product', amount: productPrice },
      { label: 'Shipping', amount: shippingCost, note: shippingCost === 0 ? 'Free' : undefined },
      { label: 'Est. Sales Tax', amount: Math.round(salesTax * 100) / 100, note: state ? `${state} ~${(taxRate * 100).toFixed(1)}%` : 'Avg ~7%' },
    ];

    return {
      productPrice,
      shippingCost,
      importDuty: 0,
      salesTax: Math.round(salesTax * 100) / 100,
      totalLandedCost: Math.round((productPrice + shippingCost + salesTax) * 100) / 100,
      type: 'domestic',
      isDutyFree: true,
      breakdown,
    };
  } else {
    // ── Global: Product + Shipping + Import Duty + (no state sales tax for imports) ──
    const totalDeclaredValue = productPrice + shippingCost;
    const isDutyFree = totalDeclaredValue <= US_DE_MINIMIS;
    const importDuty = isDutyFree ? 0 : (totalDeclaredValue * AVG_IMPORT_DUTY_RATE);

    const breakdown: CostBreakdownItem[] = [
      { label: 'Product', amount: productPrice },
      { label: 'Shipping', amount: shippingCost, note: shippingCost === 0 ? 'Free' : undefined },
      {
        label: 'Import Duty',
        amount: Math.round(importDuty * 100) / 100,
        note: isDutyFree ? `Duty-Free (Under $${US_DE_MINIMIS})` : `~${(AVG_IMPORT_DUTY_RATE * 100)}%`,
      },
    ];

    return {
      productPrice,
      shippingCost,
      importDuty: Math.round(importDuty * 100) / 100,
      salesTax: 0, // International imports generally don't have state sales tax at point of entry
      totalLandedCost: Math.round((productPrice + shippingCost + importDuty) * 100) / 100,
      type: 'global',
      isDutyFree,
      breakdown,
    };
  }
}

// ─── Batch Calculator ────────────────────────────────

export function calculateAllLandedCosts(
  products: Product[],
  options?: { zipcode?: string }
): Map<string, LandedCost> {
  const costMap = new Map<string, LandedCost>();
  for (const product of products) {
    costMap.set(product.id, calculateLandedCost(product, options));
  }
  return costMap;
}

// ─── Helper ──────────────────────────────────────────

function parsePriceToNumber(price: string | number | undefined): number {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const num = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

export { parsePriceToNumber, zipcodeToState, STATE_TAX_RATES, US_DE_MINIMIS };
