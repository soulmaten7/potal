/**
 * POTAL CostEngine — Total Landed Cost Calculator
 *
 * Standalone B2B-ready module. Zero external dependencies.
 * Calculates the TRUE cost of a product including:
 * - Product price
 * - Shipping cost
 * - Import duty (for Global: China tariffs + MPF since Aug 2025)
 * - Estimated sales tax (for Domestic: state-based)
 *
 * IMPORTANT UPDATE (2025-08-29):
 * US $800 de minimis exemption has been ELIMINATED.
 * ALL packages from China are now subject to import duties.
 * - Reciprocal tariff: ~10%
 * - Fentanyl tariff: ~10%
 * - Section 301 additional: varies by category
 * - Effective rate for Chinese goods: ~20-37%
 * - Merchandise Processing Fee (MPF): $2.69-$12.09 for informal entries
 *
 * Philosophy: Show the most accurate estimate possible.
 * User sees "Expected Total" — honest about it being an estimate.
 */

import type { CostInput, LandedCost, CostBreakdownItem } from './types';

// ─── US Import Rules (Updated 2025-08) ──────────────

/**
 * China-specific import duty rates (post de minimis elimination)
 * Base: Reciprocal 10% + Fentanyl 10% = 20%
 * With Section 301 (many consumer goods): up to 37%
 * We use a conservative average of 20% for general merchandise
 */
export const CHINA_IMPORT_DUTY_RATE = 0.20;

/**
 * Merchandise Processing Fee (MPF) for informal entries (under $2,500)
 * CBP charges $2.69 - $12.09 per shipment
 * We use the middle estimate
 */
export const MPF_INFORMAL = 5.50;

/**
 * Non-China import duty rate (general)
 * Most Favored Nation (MFN) average for consumer goods
 */
const OTHER_IMPORT_DUTY_RATE = 0.05;

/** Average US sales tax rate by state (simplified) */
export const STATE_TAX_RATES: Record<string, number> = {
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

const DEFAULT_TAX_RATE = 0.07;

// ─── Zipcode to State Mapping (first 3 digits) ──────

export function zipcodeToState(zipcode: string): string | null {
  if (!zipcode || zipcode.length < 3) return null;
  const prefix = parseInt(zipcode.substring(0, 3), 10);

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

// ─── Origin Country Detection ────────────────────────

/** Known Chinese-origin e-commerce platforms */
const CHINESE_PLATFORMS = ['aliexpress', 'temu', 'shein', 'wish', 'dhgate', 'banggood'];

/**
 * Detect origin country from CostInput.
 * Supports both B2C (site name) and B2B (ISO country code) inputs.
 */
function detectOriginCountry(input: CostInput): 'CN' | 'OTHER' | 'DOMESTIC' {
  const origin = (input.origin || '').toLowerCase().trim();
  const shippingType = (input.shippingType || '').toLowerCase();

  // Direct country code (B2B API usage)
  if (origin === 'cn' || origin === 'china') return 'CN';
  if (origin === 'us' || origin === 'usa' || origin === 'domestic') return 'DOMESTIC';

  // Any 2-letter ISO code that isn't US → international
  if (origin.length === 2 && /^[a-z]{2}$/.test(origin)) return 'OTHER';

  // Shipping type hint
  if (shippingType.includes('domestic')) return 'DOMESTIC';

  // Chinese origin platforms (B2C compatibility)
  if (CHINESE_PLATFORMS.some(p => origin.includes(p))) return 'CN';

  // International but non-China
  if (shippingType.includes('international') || shippingType.includes('global')) return 'OTHER';

  return 'DOMESTIC';
}

// ─── Price Parser ────────────────────────────────────

export function parsePriceToNumber(price: string | number | undefined): number {
  if (typeof price === 'number') return Math.max(0, price);
  if (!price) return 0;
  const num = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
  return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
}

// ─── Main Calculator ─────────────────────────────────

/**
 * Calculate Total Landed Cost for a single product/item.
 *
 * @example B2B API usage:
 * ```ts
 * const cost = calculateLandedCost({
 *   price: 49.99,
 *   shippingPrice: 8.50,
 *   origin: 'CN',
 *   zipcode: '10001'
 * });
 * ```
 *
 * @example B2C compatibility:
 * ```ts
 * import { toCostInput } from './adapters';
 * const cost = calculateLandedCost(toCostInput(product), { zipcode: '90210' });
 * ```
 */
export function calculateLandedCost(input: CostInput): LandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const originCountry = detectOriginCountry(input);
  const zipcode = input.zipcode || '';

  if (originCountry === 'DOMESTIC') {
    // ── Domestic: Product + Shipping + Sales Tax ──
    const state = zipcodeToState(zipcode);
    const taxRate = state ? (STATE_TAX_RATES[state] ?? DEFAULT_TAX_RATE) : DEFAULT_TAX_RATE;
    const salesTax = (productPrice + shippingCost) * taxRate;

    const breakdown: CostBreakdownItem[] = [
      { label: 'Product', amount: productPrice },
      { label: 'Shipping', amount: shippingCost, note: shippingCost === 0 ? 'Free' : undefined },
      { label: 'Est. Sales Tax', amount: Math.round(salesTax * 100) / 100, note: state ? `${state} ~${(taxRate * 100).toFixed(1)}%` : 'Avg ~7%' },
    ];

    return {
      productPrice,
      shippingCost,
      importDuty: 0,
      mpf: 0,
      salesTax: Math.round(salesTax * 100) / 100,
      totalLandedCost: Math.round((productPrice + shippingCost + salesTax) * 100) / 100,
      type: 'domestic',
      isDutyFree: true,
      originCountry,
      breakdown,
    };
  } else {
    // ── Global: Product + Shipping + Import Duty + MPF ──
    const totalDeclaredValue = productPrice + shippingCost;

    const dutyRate = originCountry === 'CN' ? CHINA_IMPORT_DUTY_RATE : OTHER_IMPORT_DUTY_RATE;
    const importDuty = totalDeclaredValue * dutyRate;

    const mpf = originCountry === 'CN' ? MPF_INFORMAL : 0;

    const isDutyFree = originCountry === 'OTHER' && totalDeclaredValue === 0;

    const dutyNote = originCountry === 'CN'
      ? `~${(dutyRate * 100)}% (China tariff)`
      : `~${(dutyRate * 100)}% (MFN avg)`;

    const breakdown: CostBreakdownItem[] = [
      { label: 'Product', amount: productPrice },
      { label: 'Shipping', amount: shippingCost, note: shippingCost === 0 ? 'Free' : undefined },
      { label: 'Import Duty', amount: Math.round(importDuty * 100) / 100, note: dutyNote },
    ];

    if (mpf > 0) {
      breakdown.push({ label: 'Processing Fee', amount: mpf, note: 'CBP MPF' });
    }

    const total = productPrice + shippingCost + importDuty + mpf;

    return {
      productPrice,
      shippingCost,
      importDuty: Math.round(importDuty * 100) / 100,
      mpf,
      salesTax: 0,
      totalLandedCost: Math.round(total * 100) / 100,
      type: 'global',
      isDutyFree,
      originCountry,
      breakdown,
    };
  }
}

// ─── Batch Calculator ────────────────────────────────

/**
 * Calculate Total Landed Cost for multiple items.
 * @param items Array of CostInput with an id field
 */
export function calculateBatchLandedCosts(
  items: (CostInput & { id: string })[]
): Map<string, LandedCost> {
  const costMap = new Map<string, LandedCost>();
  for (const item of items) {
    costMap.set(item.id, calculateLandedCost(item));
  }
  return costMap;
}
