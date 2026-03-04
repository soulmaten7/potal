/**
 * POTAL Global Cost Engine
 *
 * Multi-country Total Landed Cost calculation.
 *
 * Data source priority:
 * 1. DB (Supabase) — duty rates, FTA, country profiles (async, cached)
 * 2. Hardcoded fallback — if DB unavailable
 *
 * Supports 58+ destination countries.
 * Delegates to US-specific engine for US destinations.
 */

import type { CostInput, LandedCost, CostBreakdownItem } from './types';
import { calculateLandedCost as calculateUSLandedCost, parsePriceToNumber } from './CostEngine';
import { getCountryProfile, type CountryTaxProfile } from './country-data';
import { classifyWithOverride } from './hs-code';
import type { HsClassificationResult } from './hs-code';
import type { FtaResult } from './hs-code/fta';

// DB-backed modules (async, with cache + hardcoded fallback)
import { getCountryProfileFromDb } from './db/country-data-db';
import { getDutyRateFromDb, getEffectiveDutyRateFromDb, hasCountryDutyDataFromDb } from './db/duty-rates-db';
import { applyFtaRateFromDb } from './db/fta-db';

// Hardcoded fallbacks (sync, for backward compat)
import { getEffectiveDutyRate as getHardcodedEffectiveDutyRate, getDutyRate as getHardcodedDutyRate, hasCountryDutyData as hardcodedHasCountryDutyData } from './hs-code';
import { applyFtaRate as hardcodedApplyFtaRate } from './hs-code/fta';

// ─── Origin Detection ───────────────────────────────

const CHINESE_PLATFORMS = ['aliexpress', 'temu', 'shein', 'wish', 'dhgate', 'banggood'];

function detectOriginForGlobal(input: CostInput): string {
  const origin = (input.origin || '').toLowerCase().trim();

  if (origin.length === 2) return origin.toUpperCase();
  if (CHINESE_PLATFORMS.some(p => origin.includes(p))) return 'CN';
  if (origin === 'china') return 'CN';
  if (origin === 'usa' || origin === 'us' || origin === 'domestic') return 'US';

  const shippingType = (input.shippingType || '').toLowerCase();
  if (shippingType.includes('domestic')) return input.destinationCountry?.toUpperCase() || 'US';
  if (shippingType.includes('international') || shippingType.includes('global')) return 'CN';

  return 'US';
}

// ─── Extended Input ─────────────────────────────────

export interface GlobalCostInput extends CostInput {
  productName?: string;
  productCategory?: string;
  hsCode?: string;
}

// ─── Global Landed Cost Result ──────────────────────

export interface GlobalLandedCost extends LandedCost {
  destinationCountry: string;
  vat: number;
  vatLabel: string;
  vatRate: number;
  deMinimisApplied: boolean;
  destinationCurrency: string;
  hsClassification?: HsClassificationResult;
  ftaApplied?: FtaResult;
  additionalTariffNote?: string;
}

// ════════════════════════════════════════════════════
// ASYNC VERSION (DB-backed) — used by API routes
// ════════════════════════════════════════════════════

/**
 * Calculate Total Landed Cost — ASYNC (DB-backed)
 *
 * Reads duty rates, FTA, country profiles from Supabase.
 * Falls back to hardcoded data if DB unavailable.
 * Use this in API routes.
 */
export async function calculateGlobalLandedCostAsync(input: GlobalCostInput): Promise<GlobalLandedCost> {
  const destination = (input.destinationCountry || 'US').toUpperCase();

  // US destination → US-specific engine
  if (destination === 'US') {
    const usResult = calculateUSLandedCost(input);
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

  // Get country profile from DB
  const profile = await getCountryProfileFromDb(destination);
  if (!profile) {
    return calculateWithDefaults(input, destination);
  }

  return calculateWithProfileAsync(input, profile);
}

async function calculateWithProfileAsync(input: GlobalCostInput, profile: CountryTaxProfile): Promise<GlobalLandedCost> {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const originCountry = detectOriginForGlobal(input);
  const declaredValue = productPrice + shippingCost;
  const isDomestic = originCountry === profile.code;

  // HS Code Classification (local, no DB needed)
  let hsResult: HsClassificationResult | undefined;
  if (input.productName || input.hsCode) {
    hsResult = classifyWithOverride(input.productName || '', input.hsCode, input.productCategory);
  }

  // Determine Duty Rate from DB
  let dutyRate = profile.avgDutyRate;
  let dutyNote = `~${(profile.avgDutyRate * 100).toFixed(1)}% avg`;
  let additionalTariffNote: string | undefined;
  let ftaResult: FtaResult | undefined;

  if (hsResult && hsResult.hsCode !== '9999') {
    const hsChapter = hsResult.hsCode.substring(0, 2);

    if (await hasCountryDutyDataFromDb(profile.code)) {
      const specificRate = await getEffectiveDutyRateFromDb(hsResult.hsCode, profile.code, originCountry);
      if (specificRate >= 0) {
        dutyRate = specificRate;
        dutyNote = `HS ${hsResult.hsCode} (${(specificRate * 100).toFixed(1)}%)`;

        const rateInfo = await getDutyRateFromDb(hsResult.hsCode, profile.code, originCountry);
        if (rateInfo?.additionalTariff) {
          additionalTariffNote = rateInfo.notes;
        }
      }
    }

    // FTA from DB
    if (!isDomestic) {
      const ftaCalc = await applyFtaRateFromDb(dutyRate, originCountry, profile.code, hsChapter);
      ftaResult = ftaCalc.fta;
      if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
        dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
        dutyRate = ftaCalc.rate;
      }
    }
  } else if (!isDomestic) {
    const ftaCalc = await applyFtaRateFromDb(dutyRate, originCountry, profile.code);
    ftaResult = ftaCalc.fta;
    if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
      dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
      dutyRate = ftaCalc.rate;
    }
  }

  // De Minimis
  const deMinimisApplied = !isDomestic && declaredValue > 0 && declaredValue <= profile.deMinimisUsd && profile.deMinimisUsd > 0;

  // Duty
  let importDuty = 0;
  if (!isDomestic && !deMinimisApplied) {
    importDuty = declaredValue * dutyRate;
  }

  // VAT/GST
  let vat = 0;
  if (isDomestic) {
    vat = declaredValue * profile.vatRate;
  } else {
    vat = (declaredValue + importDuty) * profile.vatRate;
  }

  const totalLandedCost = productPrice + shippingCost + importDuty + vat;

  // Breakdown
  const breakdown: CostBreakdownItem[] = [
    { label: 'Product', amount: round(productPrice) },
    { label: 'Shipping', amount: round(shippingCost), note: shippingCost === 0 ? 'Free' : undefined },
  ];

  if (!isDomestic) {
    if (deMinimisApplied) {
      breakdown.push({ label: 'Import Duty', amount: 0, note: `De minimis exempt (≤$${profile.deMinimisUsd})` });
    } else if (importDuty > 0) {
      breakdown.push({ label: 'Import Duty', amount: round(importDuty), note: dutyNote });
    } else {
      breakdown.push({ label: 'Import Duty', amount: 0, note: 'Duty-free' });
    }

    if (additionalTariffNote) {
      breakdown.push({ label: 'Additional Tariff', amount: 0, note: additionalTariffNote });
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
    isDomestic ? 'DOMESTIC' : originCountry === 'CN' ? 'CN' : 'OTHER';

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

// ════════════════════════════════════════════════════
// SYNC VERSION (hardcoded) — used by tests, B2C, widget
// ════════════════════════════════════════════════════

/**
 * Calculate Total Landed Cost — SYNC (hardcoded data)
 *
 * Uses in-memory hardcoded data only. No DB calls.
 * Used by tests, B2C frontend, widget.
 */
export function calculateGlobalLandedCost(input: GlobalCostInput): GlobalLandedCost {
  const destination = (input.destinationCountry || 'US').toUpperCase();

  if (destination === 'US') {
    const usResult = calculateUSLandedCost(input);
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

  const profile = getCountryProfile(destination);
  if (!profile) return calculateWithDefaults(input, destination);

  return calculateWithProfileSync(input, profile);
}

function calculateWithProfileSync(input: GlobalCostInput, profile: CountryTaxProfile): GlobalLandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const originCountry = detectOriginForGlobal(input);
  const declaredValue = productPrice + shippingCost;
  const isDomestic = originCountry === profile.code;

  let hsResult: HsClassificationResult | undefined;
  if (input.productName || input.hsCode) {
    hsResult = classifyWithOverride(input.productName || '', input.hsCode, input.productCategory);
  }

  let dutyRate = profile.avgDutyRate;
  let dutyNote = `~${(profile.avgDutyRate * 100).toFixed(1)}% avg`;
  let additionalTariffNote: string | undefined;
  let ftaResult: FtaResult | undefined;

  if (hsResult && hsResult.hsCode !== '9999') {
    const hsChapter = hsResult.hsCode.substring(0, 2);

    if (hardcodedHasCountryDutyData(profile.code)) {
      const specificRate = getHardcodedEffectiveDutyRate(hsResult.hsCode, profile.code, originCountry);
      if (specificRate >= 0) {
        dutyRate = specificRate;
        dutyNote = `HS ${hsResult.hsCode} (${(specificRate * 100).toFixed(1)}%)`;

        const rateInfo = getHardcodedDutyRate(hsResult.hsCode, profile.code, originCountry);
        if (rateInfo?.additionalTariff) {
          additionalTariffNote = rateInfo.notes;
        }
      }
    }

    if (!isDomestic) {
      const ftaCalc = hardcodedApplyFtaRate(dutyRate, originCountry, profile.code, hsChapter);
      ftaResult = ftaCalc.fta;
      if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
        dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
        dutyRate = ftaCalc.rate;
      }
    }
  } else if (!isDomestic) {
    const ftaCalc = hardcodedApplyFtaRate(dutyRate, originCountry, profile.code);
    ftaResult = ftaCalc.fta;
    if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
      dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
      dutyRate = ftaCalc.rate;
    }
  }

  const deMinimisApplied = !isDomestic && declaredValue > 0 && declaredValue <= profile.deMinimisUsd && profile.deMinimisUsd > 0;

  let importDuty = 0;
  if (!isDomestic && !deMinimisApplied) {
    importDuty = declaredValue * dutyRate;
  }

  let vat = 0;
  if (isDomestic) {
    vat = declaredValue * profile.vatRate;
  } else {
    vat = (declaredValue + importDuty) * profile.vatRate;
  }

  const totalLandedCost = productPrice + shippingCost + importDuty + vat;

  const breakdown: CostBreakdownItem[] = [
    { label: 'Product', amount: round(productPrice) },
    { label: 'Shipping', amount: round(shippingCost), note: shippingCost === 0 ? 'Free' : undefined },
  ];

  if (!isDomestic) {
    if (deMinimisApplied) {
      breakdown.push({ label: 'Import Duty', amount: 0, note: `De minimis exempt (≤$${profile.deMinimisUsd})` });
    } else if (importDuty > 0) {
      breakdown.push({ label: 'Import Duty', amount: round(importDuty), note: dutyNote });
    } else {
      breakdown.push({ label: 'Import Duty', amount: 0, note: 'Duty-free' });
    }
    if (additionalTariffNote) {
      breakdown.push({ label: 'Additional Tariff', amount: 0, note: additionalTariffNote });
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
    isDomestic ? 'DOMESTIC' : originCountry === 'CN' ? 'CN' : 'OTHER';

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
    breakdown: [
      { label: 'Product', amount: round(productPrice) },
      { label: 'Shipping', amount: round(shippingCost) },
      { label: 'Import Duty (est.)', amount: round(importDuty), note: '~10% default' },
      { label: 'VAT/GST (est.)', amount: round(vat), note: '~15% default' },
    ],
    destinationCountry: destination,
    vat: round(vat),
    vatLabel: 'VAT',
    vatRate,
    deMinimisApplied: false,
    destinationCurrency: 'USD',
  };
}

// ─── Batch Calculators ──────────────────────────────

export async function calculateGlobalBatchLandedCostsAsync(
  items: (GlobalCostInput & { id: string })[]
): Promise<Map<string, GlobalLandedCost>> {
  const costMap = new Map<string, GlobalLandedCost>();
  for (const item of items) {
    costMap.set(item.id, await calculateGlobalLandedCostAsync(item));
  }
  return costMap;
}

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
