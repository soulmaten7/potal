/**
 * POTAL Global Cost Engine
 *
 * Multi-country Total Landed Cost calculation.
 * Uses country-data.ts for VAT/GST rates, duty averages, and de minimis thresholds.
 *
 * Supports 58+ destination countries.
 * Falls back to US-specific logic (CostEngine.ts) when destination is US.
 */

import type { CostInput, LandedCost, CostBreakdownItem } from './types';
import { calculateLandedCost as calculateUSLandedCost, parsePriceToNumber } from './CostEngine';
import { getCountryProfile, type CountryTaxProfile } from './country-data';

// ─── Origin Detection (simplified for global) ───────

const CHINESE_PLATFORMS = ['aliexpress', 'temu', 'shein', 'wish', 'dhgate', 'banggood'];

function detectOriginForGlobal(input: CostInput): string {
  const origin = (input.origin || '').toLowerCase().trim();

  // Direct ISO code
  if (origin.length === 2) return origin.toUpperCase();

  // Known platform mappings
  if (CHINESE_PLATFORMS.some(p => origin.includes(p))) return 'CN';
  if (origin === 'china') return 'CN';
  if (origin === 'usa' || origin === 'us' || origin === 'domestic') return 'US';

  // Shipping type hint
  const shippingType = (input.shippingType || '').toLowerCase();
  if (shippingType.includes('domestic')) return input.destinationCountry?.toUpperCase() || 'US';
  if (shippingType.includes('international') || shippingType.includes('global')) return 'CN'; // assume CN if international

  return 'US'; // default: domestic
}

// ─── Global Landed Cost Calculator ──────────────────

export interface GlobalLandedCost extends LandedCost {
  /** Destination country ISO code */
  destinationCountry: string;
  /** VAT/GST amount */
  vat: number;
  /** VAT/GST label used */
  vatLabel: string;
  /** VAT/GST rate applied */
  vatRate: number;
  /** Whether de minimis exemption applied */
  deMinimisApplied: boolean;
  /** Currency of destination */
  destinationCurrency: string;
}

/**
 * Calculate Total Landed Cost for any destination country.
 *
 * For US destinations, delegates to the US-specific engine (with state tax support).
 * For all other countries, uses country-data.ts profiles.
 */
export function calculateGlobalLandedCost(input: CostInput): GlobalLandedCost {
  const destination = (input.destinationCountry || 'US').toUpperCase();

  // US destination → use existing US-specific engine (state sales tax, etc.)
  if (destination === 'US') {
    const usResult = calculateUSLandedCost(input);
    return {
      ...usResult,
      destinationCountry: 'US',
      vat: usResult.salesTax,
      vatLabel: 'Sales Tax',
      vatRate: 0, // state-level, varies
      deMinimisApplied: false,
      destinationCurrency: 'USD',
    };
  }

  // Non-US destination
  const profile = getCountryProfile(destination);
  if (!profile) {
    // Unknown country — use conservative defaults
    return calculateWithDefaults(input, destination);
  }

  return calculateWithProfile(input, profile);
}

// ─── Calculate with Country Profile ─────────────────

function calculateWithProfile(input: CostInput, profile: CountryTaxProfile): GlobalLandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const originCountry = detectOriginForGlobal(input);
  const declaredValue = productPrice + shippingCost;

  // Determine if domestic
  const isDomestic = originCountry === profile.code;

  // De minimis check (duty exemption for low-value goods)
  const deMinimisApplied = !isDomestic && declaredValue > 0 && declaredValue <= profile.deMinimisUsd && profile.deMinimisUsd > 0;

  // Import duty calculation
  let importDuty = 0;
  if (!isDomestic && !deMinimisApplied) {
    importDuty = declaredValue * profile.avgDutyRate;
  }

  // VAT/GST calculation (usually on declared value + duty)
  let vat = 0;
  if (isDomestic) {
    // Domestic: VAT on product + shipping
    vat = declaredValue * profile.vatRate;
  } else {
    // Import: VAT typically on (declared value + duty)
    vat = (declaredValue + importDuty) * profile.vatRate;
  }

  // China-specific MPF for US (already handled in US engine, but just in case)
  const mpf = 0;

  const totalLandedCost = productPrice + shippingCost + importDuty + mpf + vat;

  // Build breakdown
  const breakdown: CostBreakdownItem[] = [
    { label: 'Product', amount: round(productPrice) },
    { label: 'Shipping', amount: round(shippingCost), note: shippingCost === 0 ? 'Free' : undefined },
  ];

  if (!isDomestic) {
    if (deMinimisApplied) {
      breakdown.push({
        label: 'Import Duty',
        amount: 0,
        note: `De minimis exempt (≤$${profile.deMinimisUsd})`,
      });
    } else if (importDuty > 0) {
      breakdown.push({
        label: 'Import Duty',
        amount: round(importDuty),
        note: `~${(profile.avgDutyRate * 100).toFixed(1)}% avg`,
      });
    }
  }

  if (vat > 0) {
    breakdown.push({
      label: profile.vatLabel === 'None' ? 'Tax' : profile.vatLabel,
      amount: round(vat),
      note: `${(profile.vatRate * 100).toFixed(1)}%`,
    });
  }

  // Determine origin country classification for compatibility
  const originClass: 'CN' | 'OTHER' | 'DOMESTIC' =
    isDomestic ? 'DOMESTIC' :
    originCountry === 'CN' ? 'CN' : 'OTHER';

  return {
    productPrice: round(productPrice),
    shippingCost: round(shippingCost),
    importDuty: round(importDuty),
    mpf,
    salesTax: round(vat), // maps to VAT for backward compat
    totalLandedCost: round(totalLandedCost),
    type: isDomestic ? 'domestic' : 'global',
    isDutyFree: importDuty === 0,
    originCountry: originClass,
    breakdown,
    // Extended global fields
    destinationCountry: profile.code,
    vat: round(vat),
    vatLabel: profile.vatLabel,
    vatRate: profile.vatRate,
    deMinimisApplied,
    destinationCurrency: profile.currency,
  };
}

// ─── Fallback for Unknown Countries ─────────────────

function calculateWithDefaults(input: CostInput, destination: string): GlobalLandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const declaredValue = productPrice + shippingCost;

  // Conservative defaults
  const dutyRate = 0.10;
  const vatRate = 0.15;
  const importDuty = declaredValue * dutyRate;
  const vat = (declaredValue + importDuty) * vatRate;
  const total = productPrice + shippingCost + importDuty + vat;

  const breakdown: CostBreakdownItem[] = [
    { label: 'Product', amount: round(productPrice) },
    { label: 'Shipping', amount: round(shippingCost) },
    { label: 'Import Duty (est.)', amount: round(importDuty), note: '~10% default' },
    { label: 'VAT/GST (est.)', amount: round(vat), note: '~15% default' },
  ];

  return {
    productPrice: round(productPrice),
    shippingCost: round(shippingCost),
    importDuty: round(importDuty),
    mpf: 0,
    salesTax: round(vat),
    totalLandedCost: round(total),
    type: 'global',
    isDutyFree: false,
    originCountry: 'OTHER',
    breakdown,
    destinationCountry: destination,
    vat: round(vat),
    vatLabel: 'VAT',
    vatRate,
    deMinimisApplied: false,
    destinationCurrency: 'USD',
  };
}

// ─── Batch Global Calculator ────────────────────────

export function calculateGlobalBatchLandedCosts(
  items: (CostInput & { id: string })[]
): Map<string, GlobalLandedCost> {
  const costMap = new Map<string, GlobalLandedCost>();
  for (const item of items) {
    costMap.set(item.id, calculateGlobalLandedCost(item));
  }
  return costMap;
}

// ─── Utility ────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
