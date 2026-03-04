/**
 * POTAL Global Cost Engine
 *
 * Multi-country Total Landed Cost calculation.
 * Uses HS Code classification for accurate duty rates + FTA discounts.
 * Falls back to country averages when HS Code data unavailable.
 *
 * Supports 58+ destination countries.
 * Falls back to US-specific logic (CostEngine.ts) when destination is US.
 */

import type { CostInput, LandedCost, CostBreakdownItem } from './types';
import { calculateLandedCost as calculateUSLandedCost, parsePriceToNumber } from './CostEngine';
import { getCountryProfile, type CountryTaxProfile } from './country-data';
import { classifyWithOverride, getEffectiveDutyRate, getDutyRate, hasCountryDutyData } from './hs-code';
import { applyFtaRate } from './hs-code/fta';
import type { HsClassificationResult, FtaResult } from './hs-code';

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
  if (shippingType.includes('international') || shippingType.includes('global')) return 'CN';

  return 'US'; // default: domestic
}

// ─── Extended Input (with HS Code support) ──────────

export interface GlobalCostInput extends CostInput {
  /** Product name for HS Code classification */
  productName?: string;
  /** Product category hint (e.g. 'electronics', 'apparel') */
  productCategory?: string;
  /** HS Code override (if seller knows it) */
  hsCode?: string;
}

// ─── Global Landed Cost Result ──────────────────────

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
  /** HS Code classification result (if available) */
  hsClassification?: HsClassificationResult;
  /** FTA applied (if any) */
  ftaApplied?: FtaResult;
  /** Section 301 or other additional tariff note */
  additionalTariffNote?: string;
}

/**
 * Calculate Total Landed Cost for any destination country.
 *
 * Priority for duty rate:
 * 1. HS Code-specific rate (if product name or HS code provided)
 * 2. FTA preferential rate (if applicable)
 * 3. Country average rate (fallback)
 */
export function calculateGlobalLandedCost(input: GlobalCostInput): GlobalLandedCost {
  const destination = (input.destinationCountry || 'US').toUpperCase();

  // US destination → use existing US-specific engine (state sales tax, etc.)
  if (destination === 'US') {
    const usResult = calculateUSLandedCost(input);
    // Still try to classify HS Code for informational purposes
    const hsResult = (input.productName || input.hsCode)
      ? classifyWithOverride(input.productName || '', input.hsCode, input.productCategory)
      : undefined;

    return {
      ...usResult,
      destinationCountry: 'US',
      vat: usResult.salesTax,
      vatLabel: 'Sales Tax',
      vatRate: 0,
      deMinimisApplied: false,
      destinationCurrency: 'USD',
      hsClassification: hsResult,
    };
  }

  // Non-US destination
  const profile = getCountryProfile(destination);
  if (!profile) {
    return calculateWithDefaults(input, destination);
  }

  return calculateWithProfile(input, profile);
}

// ─── Calculate with Country Profile + HS Code ───────

function calculateWithProfile(input: GlobalCostInput, profile: CountryTaxProfile): GlobalLandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const originCountry = detectOriginForGlobal(input);
  const declaredValue = productPrice + shippingCost;

  const isDomestic = originCountry === profile.code;

  // ── Step 1: HS Code Classification ──
  let hsResult: HsClassificationResult | undefined;
  if (input.productName || input.hsCode) {
    hsResult = classifyWithOverride(input.productName || '', input.hsCode, input.productCategory);
  }

  // ── Step 2: Determine Duty Rate ──
  let dutyRate = profile.avgDutyRate; // fallback
  let dutyNote = `~${(profile.avgDutyRate * 100).toFixed(1)}% avg`;
  let additionalTariffNote: string | undefined;
  let ftaResult: FtaResult | undefined;

  if (hsResult && hsResult.hsCode !== '9999') {
    const hsChapter = hsResult.hsCode.substring(0, 2);

    // Try HS Code-specific rate
    if (hasCountryDutyData(profile.code)) {
      const specificRate = getEffectiveDutyRate(hsResult.hsCode, profile.code, originCountry);
      if (specificRate >= 0) {
        dutyRate = specificRate;
        dutyNote = `HS ${hsResult.hsCode} (${(specificRate * 100).toFixed(1)}%)`;

        // Check for additional tariffs (e.g. Section 301)
        const rateInfo = getDutyRate(hsResult.hsCode, profile.code, originCountry);
        if (rateInfo?.additionalTariff) {
          additionalTariffNote = rateInfo.notes;
        }
      }
    }

    // ── Step 3: Apply FTA ──
    if (!isDomestic) {
      const ftaCalc = applyFtaRate(dutyRate, originCountry, profile.code, hsChapter);
      ftaResult = ftaCalc.fta;
      if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
        dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
        dutyRate = ftaCalc.rate;
      }
    }
  } else if (!isDomestic) {
    // No HS Code — still check FTA with average rate
    const ftaCalc = applyFtaRate(dutyRate, originCountry, profile.code);
    ftaResult = ftaCalc.fta;
    if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
      dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
      dutyRate = ftaCalc.rate;
    }
  }

  // ── Step 4: De Minimis Check ──
  const deMinimisApplied = !isDomestic && declaredValue > 0 && declaredValue <= profile.deMinimisUsd && profile.deMinimisUsd > 0;

  // ── Step 5: Calculate Duty ──
  let importDuty = 0;
  if (!isDomestic && !deMinimisApplied) {
    importDuty = declaredValue * dutyRate;
  }

  // ── Step 6: VAT/GST ──
  let vat = 0;
  if (isDomestic) {
    vat = declaredValue * profile.vatRate;
  } else {
    vat = (declaredValue + importDuty) * profile.vatRate;
  }

  const totalLandedCost = productPrice + shippingCost + importDuty + vat;

  // ── Build Breakdown ──
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
        note: dutyNote,
      });
    } else {
      breakdown.push({
        label: 'Import Duty',
        amount: 0,
        note: 'Duty-free',
      });
    }

    if (additionalTariffNote) {
      breakdown.push({
        label: 'Additional Tariff',
        amount: 0,
        note: additionalTariffNote,
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

  const originClass: 'CN' | 'OTHER' | 'DOMESTIC' =
    isDomestic ? 'DOMESTIC' :
    originCountry === 'CN' ? 'CN' : 'OTHER';

  return {
    productPrice: round(productPrice),
    shippingCost: round(shippingCost),
    importDuty: round(importDuty),
    mpf: 0,
    salesTax: round(vat),
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
    hsClassification: hsResult,
    ftaApplied: ftaResult,
    additionalTariffNote,
  };
}

// ─── Fallback for Unknown Countries ─────────────────

function calculateWithDefaults(input: GlobalCostInput, destination: string): GlobalLandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const declaredValue = productPrice + shippingCost;

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
  items: (GlobalCostInput & { id: string })[]
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
