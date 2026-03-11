/**
 * POTAL Global Cost Engine
 *
 * Multi-country Total Landed Cost calculation.
 *
 * Data source priority:
 * 1. DB (Supabase) — duty rates, FTA, country profiles (async, cached)
 * 2. Hardcoded fallback — if DB unavailable
 *
 * Supports 220+ destination countries.
 * Delegates to US-specific engine for US destinations.
 */

import type { CostInput, LandedCost, CostBreakdownItem } from './types';
import { calculateLandedCost as calculateUSLandedCost, parsePriceToNumber, zipcodeToState, STATE_TAX_RATES, postalCodeToProvince, CANADA_PROVINCE_TAX_RATES, cepToState, BRAZIL_STATE_ICMS_RATES, calculateBrazilImportTaxes, calculateIndiaImportTaxes, getIndiaIgstRate, calculateChinaCBECTaxes, calculateMexicoImportTaxes, getMexicoIepsRate } from './CostEngine';
import { getCountryProfile, type CountryTaxProfile } from './country-data';
import { classifyWithOverride } from './hs-code';
import type { HsClassificationResult } from './hs-code';
import type { FtaResult } from './hs-code/fta';

// AI-powered classification (async, with DB caching)
import { classifyWithOverrideAsync } from './ai-classifier';

// External tariff API (async, with DB caching + circuit breaker)
import { fetchDutyRateWithFallback, getFtaRateFromLiveDb } from './tariff-api';

// Real-time exchange rates
import { convertCurrency, type CurrencyConversion } from './exchange-rate';

// DB-backed modules (async, with cache + hardcoded fallback)
import { getCountryProfileFromDb } from './db/country-data-db';
import { getDutyRateFromDb, getEffectiveDutyRateFromDb, hasCountryDutyDataFromDb } from './db/duty-rates-db';
import { applyFtaRateFromDb } from './db/fta-db';

// MacMap 4-stage fallback lookup (AGR → MIN → NTLC → MFN)
import { lookupMacMapDutyRate } from './macmap-lookup';

// Trade remedy lookup (AD/CVD/Safeguard)
import { lookupTradeRemedies, type TradeRemedyResult } from './trade-remedy-lookup';

// US Section 301/232 additional tariffs
import { lookupUSAdditionalTariffs, type USAdditionalTariffResult } from './section301-lookup';

// Hardcoded fallbacks (sync, for backward compat)
import { getEffectiveDutyRate as getHardcodedEffectiveDutyRate, getDutyRate as getHardcodedDutyRate, hasCountryDutyData as hardcodedHasCountryDutyData } from './hs-code';
import { applyFtaRate as hardcodedApplyFtaRate } from './hs-code/fta';

// ─── Origin Detection ───────────────────────────────

const CHINESE_PLATFORMS = ['aliexpress', 'temu', 'shein', 'wish', 'dhgate', 'banggood'];

// EU member states for IOSS (Import One-Stop Shop) VAT handling
const EU_IOSS_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// GCC countries (Gulf Cooperation Council) — VAT 5% standard (SA, AE, BH, OM implemented; KW, QA pending)
const GCC_VAT_COUNTRIES: Record<string, { rate: number; label: string }> = {
  SA: { rate: 0.15, label: 'VAT' },      // Saudi Arabia: 15% (raised from 5% in Jul 2020)
  AE: { rate: 0.05, label: 'VAT' },      // UAE: 5%
  BH: { rate: 0.10, label: 'VAT' },      // Bahrain: 10% (raised from 5% in Jan 2022)
  OM: { rate: 0.05, label: 'VAT' },      // Oman: 5% (introduced Apr 2021)
  KW: { rate: 0, label: 'None' },         // Kuwait: no VAT yet
  QA: { rate: 0, label: 'None' },         // Qatar: no VAT yet
};

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
  /** Insurance rate override (0.01 = 1%). Default: auto-calculated based on CIF */
  insuranceRate?: number;
  /** Include brokerage fee estimate (default: true for international) */
  includeBrokerage?: boolean;
  /** Shipping terms: DDP (seller pays duties) or DDU (buyer pays) */
  shippingTerms?: 'DDP' | 'DDU';
}

// ─── Global Landed Cost Result ──────────────────────

export interface GlobalLandedCost extends LandedCost {
  destinationCountry: string;
  vat: number;
  vatLabel: string;
  vatRate: number;
  deMinimisApplied: boolean;
  /** Whether duty is exempt (de minimis, IOSS, or duty-free) */
  dutyExempt?: boolean;
  /** Whether tax (VAT/GST) is exempt */
  taxExempt?: boolean;
  /** Duty de minimis threshold in USD (if applicable) */
  dutyThresholdUsd?: number;
  /** Tax de minimis threshold in USD (if applicable) */
  taxThresholdUsd?: number;
  destinationCurrency: string;
  hsClassification?: HsClassificationResult;
  ftaApplied?: FtaResult;
  additionalTariffNote?: string;
  /** How the HS code was classified: 'cache' | 'keyword' | 'ai' | 'manual' | 'keyword_fallback' */
  classificationSource?: string;
  /** Where the duty rate came from: 'agr' | 'min' | 'ntlc' | 'mfn' | 'live_db' | 'external_api' | 'db' | 'hardcoded' */
  dutyRateSource?: string;
  /** Confidence score of the duty rate (1.0=agr, 0.9=min, 0.8=ntlc, 0.7=mfn/hardcoded) */
  dutyConfidenceScore?: number;
  /** Insurance cost (CIF component) */
  insurance?: number;
  /** Brokerage fee estimate */
  brokerageFee?: number;
  /** Per-item confidence score (overall calculation reliability) */
  confidenceScore?: number;
  /** Trade remedy measures (AD/CVD/Safeguard) */
  tradeRemedies?: TradeRemedyResult;
  /** US Section 301/232 additional tariffs */
  usAdditionalTariffs?: USAdditionalTariffResult;
  /** Entry type: formal (>$2500) or informal (<=$2500) */
  entryType?: 'formal' | 'informal';
  /** Shipping terms used */
  shippingTerms?: 'DDP' | 'DDU';
  /** DDU breakdown: duties/taxes the buyer must pay at delivery (DDU mode only) */
  dduBuyerCharges?: {
    importDuty: number;
    vat: number;
    processingFee: number;
    total: number;
    note: string;
  };
  /** AI-detected origin country ISO code (when seller didn't provide origin) */
  detectedOriginCountry?: string;
  /** Accuracy guarantee level based on data quality */
  accuracyGuarantee?: {
    /** Guarantee level: high/medium/low */
    level: 'high' | 'medium' | 'low';
    /** Estimated accuracy percentage */
    estimatedAccuracy: number;
    /** Factors that affect accuracy */
    factors: string[];
  };
  /** Data freshness metadata */
  dataFreshness?: {
    /** Duty rate data source and age */
    dutyRateAge: string;
    /** Last tariff DB update check */
    lastTariffUpdate?: string;
    /** Overall data quality: fresh/stale/fallback */
    quality: 'fresh' | 'stale' | 'fallback';
  };
  /** Exchange rate timestamp (ISO 8601) */
  exchangeRateTimestamp?: string;
  /** Local currency conversion (if destination currency != USD) */
  localCurrency?: {
    /** Total landed cost in local currency */
    totalLandedCost: number;
    /** Exchange rate USD → local */
    exchangeRate: number;
    /** Currency code */
    currency: string;
    /** Rate source */
    rateSource: string;
    /** Last updated timestamp */
    lastUpdated: string;
  };
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

  // Get country profile from DB (works for US and all other countries)
  const profile = await getCountryProfileFromDb(destination);

  if (profile) {
    return calculateWithProfileAsync(input, profile);
  }

  // US fallback if no DB profile found
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

  return calculateWithDefaults(input, destination);
}

async function calculateWithProfileAsync(input: GlobalCostInput, profile: CountryTaxProfile): Promise<GlobalLandedCost> {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  let originCountry = detectOriginForGlobal(input);
  const declaredValue = productPrice + shippingCost;

  // HS Code Classification — AI-powered async (DB 캐시 → 키워드 → AI 폴백)
  let hsResult: HsClassificationResult | undefined;
  let classificationSource: string | undefined;
  if (input.productName || input.hsCode) {
    const asyncResult = await classifyWithOverrideAsync(
      input.productName || '',
      input.hsCode,
      input.productCategory,
    );
    hsResult = asyncResult;
    classificationSource = asyncResult.classificationSource;

    // Auto-detect origin: if seller didn't provide origin, use AI-detected country
    if (!input.origin && asyncResult.countryOfOrigin) {
      originCountry = asyncResult.countryOfOrigin;
    }
  }

  const isDomestic = originCountry === profile.code;

  // Determine Duty Rate — MacMap 4단계 폴백 → 정부 API → DB → 하드코딩
  let dutyRate = profile.avgDutyRate;
  let dutyNote = `~${(profile.avgDutyRate * 100).toFixed(1)}% avg`;
  let additionalTariffNote: string | undefined;
  let ftaResult: FtaResult | undefined;
  let dutyRateSource: string = 'hardcoded';
  let dutyConfidenceScore: number = 0.7;

  if (hsResult && hsResult.hsCode !== '9999') {
    const hsChapter = hsResult.hsCode.substring(0, 2);

    // ━━━ 1차: MacMap 4단계 폴백 (AGR → MIN → NTLC) ━━━
    const macmapResult = await lookupMacMapDutyRate(profile.code, originCountry, hsResult.hsCode);
    if (macmapResult) {
      dutyRate = macmapResult.avDuty;
      dutyNote = `HS ${hsResult.hsCode} (${(dutyRate * 100).toFixed(1)}%) [${macmapResult.source}]`;
      dutyRateSource = macmapResult.source;
      dutyConfidenceScore = macmapResult.confidenceScore;
    }
    // ━━━ 2차: 정부 API 캐시(duty_rates_live) 조회 ━━━
    else {
      const liveRate = await fetchDutyRateWithFallback(hsResult.hsCode, profile.code, originCountry);
      if (liveRate) {
        dutyRate = liveRate.rate.mfnRate + (liveRate.rate.additionalTariff || 0);
        dutyNote = `HS ${hsResult.hsCode} (${(dutyRate * 100).toFixed(1)}%)`;
        dutyRateSource = liveRate.source;
        dutyConfidenceScore = 0.85;
        if (liveRate.rate.additionalTariff) {
          additionalTariffNote = liveRate.rate.notes;
        }
      }
      // ━━━ 3차: 기존 duty_rates DB 조회 ━━━
      else if (await hasCountryDutyDataFromDb(profile.code)) {
        const specificRate = await getEffectiveDutyRateFromDb(hsResult.hsCode, profile.code, originCountry);
        if (specificRate >= 0) {
          dutyRate = specificRate;
          dutyNote = `HS ${hsResult.hsCode} (${(specificRate * 100).toFixed(1)}%)`;
          dutyRateSource = 'db';
          dutyConfidenceScore = 0.75;

          const rateInfo = await getDutyRateFromDb(hsResult.hsCode, profile.code, originCountry);
          if (rateInfo?.additionalTariff) {
            additionalTariffNote = rateInfo.notes;
          }
        }
      }
      // ━━━ 4차: hardcoded (dutyRate는 profile.avgDutyRate 유지) ━━━
      // dutyRateSource = 'hardcoded', dutyConfidenceScore = 0.7
    }

    // FTA: Live DB → 기존 DB 폴백
    if (!isDomestic) {
      const liveFta = await getFtaRateFromLiveDb(originCountry, profile.code, hsChapter);
      if (liveFta && liveFta.preferentialRate < dutyRate) {
        ftaResult = {
          hasFta: true,
          ftaName: liveFta.ftaName,
          ftaCode: liveFta.ftaName,
          preferentialMultiplier: liveFta.preferentialRate / (dutyRate || 1),
        };
        dutyNote += ` → ${(liveFta.preferentialRate * 100).toFixed(1)}% (${liveFta.ftaName})`;
        dutyRate = liveFta.preferentialRate;
      } else {
        const ftaCalc = await applyFtaRateFromDb(dutyRate, originCountry, profile.code, hsChapter);
        ftaResult = ftaCalc.fta;
        if (ftaCalc.fta.hasFta && ftaCalc.rate < dutyRate) {
          dutyNote += ` → ${(ftaCalc.rate * 100).toFixed(1)}% (${ftaCalc.fta.ftaCode})`;
          dutyRate = ftaCalc.rate;
        }
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

  // Trade Remedies: AD/CVD/Safeguard additional duties
  let tradeRemedyResult: TradeRemedyResult | undefined;
  if (!isDomestic && hsResult && hsResult.hsCode !== '9999') {
    tradeRemedyResult = await lookupTradeRemedies(profile.code, originCountry, hsResult.hsCode);
    if (tradeRemedyResult.hasRemedies) {
      // Add trade remedy duties on top of base duty rate
      dutyRate += tradeRemedyResult.totalRemedyRate;
      const remedyTypes = tradeRemedyResult.measures.map(m => m.type).join('+');
      additionalTariffNote = `${remedyTypes}: +${(tradeRemedyResult.totalRemedyRate * 100).toFixed(1)}%`;
    }
  }

  // US Section 301/232 additional tariffs
  let usAdditionalTariffs: USAdditionalTariffResult | undefined;
  if (!isDomestic && profile.code === 'US' && hsResult && hsResult.hsCode !== '9999') {
    usAdditionalTariffs = lookupUSAdditionalTariffs(originCountry, hsResult.hsCode);
    if (usAdditionalTariffs.hasAdditionalTariffs) {
      dutyRate += usAdditionalTariffs.totalRate;
      const notes: string[] = [];
      if (usAdditionalTariffs.section301) notes.push(usAdditionalTariffs.section301.note);
      if (usAdditionalTariffs.section232) notes.push(usAdditionalTariffs.section232.note);
      additionalTariffNote = (additionalTariffNote ? additionalTariffNote + '; ' : '') + notes.join('; ');
    }
  }

  // De Minimis — split into duty and tax thresholds
  // Many countries have different thresholds for duty vs tax exemption
  // EU: duty exempt ≤€150 but VAT always applies (IOSS); AU: no duty/GST exemption post-2018 for LVG
  // US: $800 de minimis covers both duty and tax; UK: £135 duty de minimis, VAT always applies
  const dutyThresholdUsd = profile.deMinimisUsd;
  // Tax threshold: most countries = same as duty, but UK/EU/AU have $0 (tax always applies on imports)
  const taxAlwaysAppliesCountries = new Set([...EU_IOSS_COUNTRIES, 'GB', 'AU', 'NZ', 'NO', 'CH']);
  const taxThresholdUsd = taxAlwaysAppliesCountries.has(profile.code) ? 0 : profile.deMinimisUsd;

  const dutyExempt = !isDomestic && declaredValue > 0 && declaredValue <= dutyThresholdUsd && dutyThresholdUsd > 0;
  const taxExempt = !isDomestic && declaredValue > 0 && declaredValue <= taxThresholdUsd && taxThresholdUsd > 0;
  const deMinimisApplied = dutyExempt; // backward compat: deMinimisApplied = duty exemption

  // Duty
  let importDuty = 0;
  if (!isDomestic && !deMinimisApplied) {
    importDuty = declaredValue * dutyRate;
  }

  // VAT/GST (US: state-level sales tax from zipcode)
  let vat = 0;
  let effectiveVatRate = profile.vatRate;
  let effectiveVatLabel = profile.vatLabel;

  if (profile.code === 'US' && input.zipcode) {
    // US uses state-level sales tax, not national VAT
    const state = zipcodeToState(input.zipcode);
    const stateTaxRate = state ? (STATE_TAX_RATES[state] ?? 0.07) : 0.07;
    vat = declaredValue * stateTaxRate;
    effectiveVatRate = stateTaxRate;
    effectiveVatLabel = 'Sales Tax';
  } else if (profile.code === 'US') {
    // US without zipcode → avg 7%
    vat = declaredValue * 0.07;
    effectiveVatRate = 0.07;
    effectiveVatLabel = 'Sales Tax';
  } else if (profile.code === 'CA' && input.zipcode) {
    // Canada uses province-level GST/HST/PST
    const province = postalCodeToProvince(input.zipcode);
    const provRate = province ? (CANADA_PROVINCE_TAX_RATES[province] ?? 0.05) : 0.05;
    const taxBase = isDomestic ? declaredValue : (declaredValue + importDuty);
    vat = taxBase * provRate;
    effectiveVatRate = provRate;
    const HST_PROVINCES = new Set(['ON', 'NB', 'NS', 'NL', 'PE']);
    effectiveVatLabel = province && HST_PROVINCES.has(province) ? 'HST' : (provRate > 0.05 ? 'GST+PST' : 'GST');
  } else if (profile.code === 'CA') {
    // Canada without postal code → national avg
    const taxBase = isDomestic ? declaredValue : (declaredValue + importDuty);
    vat = taxBase * profile.vatRate;
    effectiveVatRate = profile.vatRate;
    effectiveVatLabel = 'GST/HST';
  } else if (profile.code === 'BR' && !isDomestic && !deMinimisApplied) {
    // Brazil: cascading tax (IPI + PIS/COFINS + ICMS por dentro)
    const brState = input.zipcode ? cepToState(input.zipcode) : null;
    const icmsRate = brState ? (BRAZIL_STATE_ICMS_RATES[brState] ?? 0.18) : 0.18;
    const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate);
    vat = brTaxes.totalTax;
    effectiveVatRate = brTaxes.effectiveRate;
    effectiveVatLabel = brState ? `ICMS ${brState}` : 'Import Taxes';
  } else if (profile.code === 'IN' && !isDomestic && !deMinimisApplied) {
    // India: BCD + SWS (10% of BCD) + IGST (on CIF + BCD + SWS)
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const igstRate = hsChapter ? getIndiaIgstRate(hsChapter) : 0.18;
    const inTaxes = calculateIndiaImportTaxes(declaredValue, importDuty, igstRate);
    vat = inTaxes.totalTax;
    effectiveVatRate = inTaxes.effectiveRate;
    effectiveVatLabel = 'IGST+SWS';
  } else if (profile.code === 'CN' && !isDomestic && !deMinimisApplied) {
    // China: CBEC tax regime (9.1% composite) or regular import (VAT 13% + consumption tax)
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const cnTaxes = calculateChinaCBECTaxes(declaredValue, importDuty, hsChapter);
    vat = cnTaxes.totalTax;
    effectiveVatRate = cnTaxes.effectiveRate;
    effectiveVatLabel = cnTaxes.isCBEC ? 'CBEC Tax' : 'VAT+CT';
  } else if (profile.code === 'MX' && !isDomestic && !deMinimisApplied) {
    // Mexico: IVA 16% + IEPS (excise tax on certain goods)
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const mxTaxes = calculateMexicoImportTaxes(declaredValue, importDuty, hsChapter);
    vat = mxTaxes.totalTax;
    effectiveVatRate = mxTaxes.effectiveRate;
    effectiveVatLabel = mxTaxes.ieps > 0 ? 'IVA+IEPS' : 'IVA';
  } else if (profile.code === 'GB' && !isDomestic) {
    // UK: VAT reverse charge for B2B imports
    // Under £135 (~$170): seller charges VAT at point of sale (no import VAT)
    // Over £135: standard import VAT 20% on (CIF + duty)
    const UK_LOW_VALUE_THRESHOLD_USD = 170;
    if (declaredValue <= UK_LOW_VALUE_THRESHOLD_USD) {
      // Low value: VAT collected at point of sale (included in product price for marketplace)
      // For B2B API: show VAT as seller-collected
      vat = declaredValue * 0.20;
      effectiveVatRate = 0.20;
      effectiveVatLabel = 'VAT (seller-collected)';
    } else {
      // Standard import VAT on CIF + duty
      vat = (declaredValue + importDuty) * 0.20;
      effectiveVatRate = 0.20;
      effectiveVatLabel = 'Import VAT';
    }
  } else if (EU_IOSS_COUNTRIES.has(profile.code) && !isDomestic) {
    // EU IOSS: Import One-Stop Shop for consignments ≤€150 (~$165 USD)
    // Below threshold: VAT at destination country rate, no import duty
    // Above threshold: standard import VAT on (CIF + duty)
    const EU_IOSS_THRESHOLD_USD = 165;
    if (declaredValue <= EU_IOSS_THRESHOLD_USD) {
      // IOSS: VAT at destination rate, duty exempt
      vat = declaredValue * profile.vatRate;
      effectiveVatRate = profile.vatRate;
      effectiveVatLabel = 'VAT (IOSS)';
      // Under IOSS, customs duty is waived for ≤€150
      importDuty = 0;
    } else {
      // Standard EU import: VAT on (CIF + duty)
      vat = (declaredValue + importDuty) * profile.vatRate;
      effectiveVatRate = profile.vatRate;
      effectiveVatLabel = 'Import VAT';
    }
  } else if (profile.code === 'AU' && !isDomestic) {
    // Australia: GST on Low Value Goods (LVG) ≤ AUD 1000 (~$650 USD)
    // Since Jul 2018: GST 10% applies to ALL imported goods (including ≤$1000)
    // ≤ AUD 1000: GST collected by marketplace/seller (no customs processing)
    // > AUD 1000: GST collected at border + customs processing
    const AU_LVG_THRESHOLD_USD = 650;
    if (declaredValue <= AU_LVG_THRESHOLD_USD) {
      // Low Value Goods: GST on product value only (seller-collected)
      vat = declaredValue * 0.10;
      effectiveVatRate = 0.10;
      effectiveVatLabel = 'GST (LVG seller-collected)';
    } else {
      // Standard: GST on (CIF + duty + customs charges)
      vat = (declaredValue + importDuty) * 0.10;
      effectiveVatRate = 0.10;
      effectiveVatLabel = 'GST';
    }
  } else if (GCC_VAT_COUNTRIES[profile.code] && !isDomestic) {
    // GCC countries: VAT on (CIF + duty) — rate varies by country
    const gcc = GCC_VAT_COUNTRIES[profile.code];
    if (gcc.rate > 0) {
      vat = (declaredValue + importDuty) * gcc.rate;
      effectiveVatRate = gcc.rate;
      effectiveVatLabel = gcc.label;
    } else {
      vat = 0;
      effectiveVatRate = 0;
      effectiveVatLabel = 'None';
    }
  } else if (isDomestic) {
    vat = declaredValue * profile.vatRate;
  } else {
    vat = (declaredValue + importDuty) * profile.vatRate;
  }

  const totalLandedCost = productPrice + shippingCost + importDuty + vat;

  // Track IOSS status for breakdown
  const isIossExempt = EU_IOSS_COUNTRIES.has(profile.code) && !isDomestic && importDuty === 0 && declaredValue <= 165;

  // Breakdown
  const breakdown: CostBreakdownItem[] = [
    { label: 'Product', amount: round(productPrice) },
    { label: 'Shipping', amount: round(shippingCost), note: shippingCost === 0 ? 'Free' : undefined },
  ];

  if (!isDomestic) {
    if (deMinimisApplied) {
      breakdown.push({ label: 'Import Duty', amount: 0, note: `De minimis exempt (≤$${profile.deMinimisUsd})` });
    } else if (isIossExempt) {
      breakdown.push({ label: 'Import Duty', amount: 0, note: 'IOSS exempt (≤€150)' });
    } else if (importDuty > 0) {
      breakdown.push({ label: 'Import Duty', amount: round(importDuty), note: dutyNote });
    } else {
      breakdown.push({ label: 'Import Duty', amount: 0, note: 'Duty-free' });
    }

    if (additionalTariffNote) {
      breakdown.push({ label: 'Additional Tariff', amount: 0, note: additionalTariffNote });
    }
  }

  // Brazil: detailed tax breakdown (IPI, PIS/COFINS, ICMS separately)
  if (profile.code === 'BR' && !isDomestic && !deMinimisApplied && vat > 0) {
    const brState = input.zipcode ? cepToState(input.zipcode) : null;
    const icmsRate = brState ? (BRAZIL_STATE_ICMS_RATES[brState] ?? 0.18) : 0.18;
    const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate);
    breakdown.push({ label: 'IPI', amount: round(brTaxes.ipi), note: '~10% industrial tax' });
    breakdown.push({ label: 'PIS/COFINS', amount: round(brTaxes.pisCofins), note: '11.75% federal' });
    breakdown.push({ label: 'ICMS', amount: round(brTaxes.icms), note: `${(icmsRate * 100).toFixed(1)}% ${brState || 'avg'}` });
  } else if (profile.code === 'IN' && !isDomestic && !deMinimisApplied && vat > 0) {
    // India: detailed tax breakdown (SWS + IGST)
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const igstRate = hsChapter ? getIndiaIgstRate(hsChapter) : 0.18;
    const inTaxes = calculateIndiaImportTaxes(declaredValue, importDuty, igstRate);
    breakdown.push({ label: 'SWS', amount: round(inTaxes.sws), note: '10% of BCD' });
    breakdown.push({ label: 'IGST', amount: round(inTaxes.igst), note: `${(igstRate * 100).toFixed(0)}% integrated GST` });
  } else if (profile.code === 'CN' && !isDomestic && !deMinimisApplied && vat > 0) {
    // China: CBEC or regular import tax breakdown
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const cnTaxes = calculateChinaCBECTaxes(declaredValue, importDuty, hsChapter);
    if (cnTaxes.isCBEC) {
      breakdown.push({ label: 'CBEC Tax', amount: round(cnTaxes.totalTax), note: `${(cnTaxes.effectiveRate * 100).toFixed(1)}% composite` });
    } else {
      breakdown.push({ label: 'VAT', amount: round(cnTaxes.vat), note: '13% (standard)' });
      if (cnTaxes.consumptionTax > 0) {
        breakdown.push({ label: 'Consumption Tax', amount: round(cnTaxes.consumptionTax), note: 'Luxury/excise' });
      }
    }
  } else if (profile.code === 'MX' && !isDomestic && !deMinimisApplied && vat > 0) {
    // Mexico: IVA + IEPS breakdown
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const mxTaxes = calculateMexicoImportTaxes(declaredValue, importDuty, hsChapter);
    breakdown.push({ label: 'IVA', amount: round(mxTaxes.iva), note: '16%' });
    if (mxTaxes.ieps > 0) {
      breakdown.push({ label: 'IEPS', amount: round(mxTaxes.ieps), note: 'Excise tax' });
    }
  } else if (vat > 0) {
    breakdown.push({
      label: effectiveVatLabel === 'None' ? 'Tax' : effectiveVatLabel,
      amount: round(vat),
      note: `${(effectiveVatRate * 100).toFixed(1)}%`,
    });
  }

  // Entry type: formal (>$2500 US) or informal (≤$2500)
  const entryType: 'formal' | 'informal' = declaredValue > 2500 ? 'formal' : 'informal';

  // Country-specific processing / customs handling fees
  let mpf = 0;
  if (!isDomestic && !deMinimisApplied) {
    if (profile.code === 'US') {
      if (entryType === 'formal') {
        // Formal entry (>$2500): MPF 0.3464%, min $31.67, max $614.35
        mpf = Math.min(Math.max(declaredValue * 0.003464, 31.67), 614.35);
        breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'CBP MPF (formal entry)' });
      } else {
        // Informal entry (≤$2500): flat $2.00-$6.00 (avg $2)
        mpf = 2;
        breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'CBP MPF (informal entry)' });
      }
    } else if (profile.code === 'AU') {
      // Australia Import Processing Charge (IPC): AUD 88 (~$56 USD) for standard entries
      mpf = 56;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'ABF IPC ~AUD 88' });
    } else if (profile.code === 'NZ') {
      // New Zealand Biosecurity System Entry Levy: NZD 33.32 (~$20 USD)
      // + MPI Transitional Facility Operator levy if applicable
      mpf = 20;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'MPI Biosecurity Levy' });
    } else if (profile.code === 'CA') {
      // Canada CBSA: No explicit MPF for most shipments, but customs broker fee ~$10-25
      // We estimate a modest broker/handling fee
      mpf = 10;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'CBSA handling est.' });
    } else if (profile.code === 'JP') {
      // Japan: Customs examination fee ¥200 (~$1.30) + broker ~¥3000 (~$20)
      mpf = 20;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'Customs broker est.' });
    } else if (profile.code === 'KR') {
      // Korea: Customs clearance fee ~KRW 10,000-30,000 (~$8-23)
      mpf = 15;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'KCS clearance est.' });
    } else if (profile.code === 'IN') {
      // India: Landing charges 1% of CIF + CESS (varies)
      mpf = declaredValue * 0.01;
      breakdown.push({ label: 'Landing Charges', amount: round(mpf), note: '1% of CIF' });
    } else if (profile.code === 'CH') {
      // Switzerland: Statistical fee CHF 15 (~$17)
      mpf = 17;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'Statistical fee' });
    } else if (profile.code === 'CN') {
      // China: Customs inspection fee + broker ~¥200-500 (~$30-70)
      mpf = 30;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'Customs clearance est.' });
    } else if (profile.code === 'MX') {
      // Mexico: DTA (Derecho de Trámite Aduanero) 0.8% of goods value, min ~$36
      mpf = Math.max(declaredValue * 0.008, 36);
      breakdown.push({ label: 'DTA', amount: round(mpf), note: '0.8% customs processing' });
    } else if (profile.code === 'SG') {
      // Singapore: Permit fee SGD 2.88 + handling ~SGD 10 (~$10)
      mpf = 10;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'TradeNet permit est.' });
    } else if (profile.code === 'BR') {
      // Brazil: SISCOMEX fee BRL 185 (~$36)
      mpf = 36;
      breakdown.push({ label: 'SISCOMEX', amount: round(mpf), note: 'Import registration fee' });
    }
    // EU & UK: No separate customs processing fee for standard imports
    // (brokerage is private, not government-imposed)
  }

  // Insurance (CIF component): 0.5-1.5% of declared value based on shipping type
  let insurance = 0;
  if (!isDomestic) {
    const insuranceRate = input.insuranceRate ?? (
      declaredValue > 5000 ? 0.005 :   // High value: 0.5%
      declaredValue > 1000 ? 0.008 :    // Medium value: 0.8%
      0.015                              // Low value: 1.5%
    );
    insurance = declaredValue * insuranceRate;
    breakdown.push({ label: 'Insurance', amount: round(insurance), note: `${(insuranceRate * 100).toFixed(1)}% of CIF` });
  }

  // Brokerage fee estimate (for international shipments)
  let brokerageFee = 0;
  if (!isDomestic && input.includeBrokerage !== false) {
    // Estimate based on declared value tiers
    if (declaredValue > 2500) {
      brokerageFee = Math.min(declaredValue * 0.005, 250); // 0.5% capped at $250
    } else if (declaredValue > 800) {
      brokerageFee = 25; // Flat $25 for mid-range
    }
    // Under $800: typically no formal entry / broker needed
    if (brokerageFee > 0) {
      breakdown.push({ label: 'Brokerage', amount: round(brokerageFee), note: 'Customs broker est.' });
    }
  }

  // Per-item confidence score (overall calculation reliability)
  // Factors: duty source confidence, HS classification, country specificity
  let confidenceScore = dutyConfidenceScore;
  if (!hsResult || hsResult.hsCode === '9999') confidenceScore *= 0.7;  // No HS = lower confidence
  else if (classificationSource === 'ai') confidenceScore *= 0.9;       // AI classification = slightly lower
  else if (classificationSource === 'cache' || classificationSource === 'manual') confidenceScore *= 1.0;
  confidenceScore = Math.round(confidenceScore * 100) / 100;

  const totalWithMpf = productPrice + shippingCost + importDuty + vat + mpf + insurance + brokerageFee;

  // DDU: buyer pays duties/taxes at delivery, seller only pays product+shipping
  const isDDU = input.shippingTerms === 'DDU';
  const dduBuyerCharges = (!isDomestic && isDDU) ? {
    importDuty: round(importDuty),
    vat: round(vat),
    processingFee: round(mpf),
    total: round(importDuty + vat + mpf),
    note: 'Buyer pays at delivery (DDU)',
  } : undefined;

  // For DDU, totalLandedCost still includes everything (full cost to buyer)
  // but dduBuyerCharges shows what the buyer must pay separately at delivery

  const originClass: 'CN' | 'OTHER' | 'DOMESTIC' =
    isDomestic ? 'DOMESTIC' : originCountry === 'CN' ? 'CN' : 'OTHER';

  // 환율 변환 (목적지 통화가 USD가 아니면 현지 통화로 변환)
  let localCurrency: GlobalLandedCost['localCurrency'];
  if (profile.currency !== 'USD') {
    try {
      const conversion = await convertCurrency(round(totalWithMpf), 'USD', profile.currency);
      localCurrency = {
        totalLandedCost: conversion.convertedAmount,
        exchangeRate: conversion.rate,
        currency: profile.currency,
        rateSource: 'live',
        lastUpdated: conversion.lastUpdated,
      };
    } catch (error) {
      console.warn('[POTAL FX] Currency conversion failed:', error);
    }
  }

  return {
    productPrice: round(productPrice),
    shippingCost: round(shippingCost),
    importDuty: round(importDuty),
    mpf: round(mpf),
    salesTax: round(vat),
    totalLandedCost: round(totalWithMpf),
    type: isDomestic ? 'domestic' : 'global',
    isDutyFree: importDuty === 0,
    originCountry: originClass,
    breakdown,
    destinationCountry: profile.code,
    vat: round(vat),
    vatLabel: effectiveVatLabel,
    vatRate: effectiveVatRate,
    deMinimisApplied,
    dutyExempt: isDomestic ? false : dutyExempt,
    taxExempt: isDomestic ? false : taxExempt,
    dutyThresholdUsd: !isDomestic ? dutyThresholdUsd : undefined,
    taxThresholdUsd: !isDomestic ? taxThresholdUsd : undefined,
    destinationCurrency: profile.currency,
    hsClassification: hsResult,
    ftaApplied: ftaResult,
    additionalTariffNote,
    classificationSource,
    dutyRateSource,
    dutyConfidenceScore,
    insurance: round(insurance),
    brokerageFee: round(brokerageFee),
    confidenceScore,
    tradeRemedies: tradeRemedyResult?.hasRemedies ? tradeRemedyResult : undefined,
    usAdditionalTariffs: usAdditionalTariffs?.hasAdditionalTariffs ? usAdditionalTariffs : undefined,
    entryType: !isDomestic ? entryType : undefined,
    shippingTerms: input.shippingTerms || 'DDP',
    dduBuyerCharges,
    accuracyGuarantee: (() => {
      const factors: string[] = [];
      let score = confidenceScore;
      if (dutyRateSource === 'agr') factors.push('FTA agreement rate');
      else if (dutyRateSource === 'min') factors.push('Minimum duty rate');
      else if (dutyRateSource === 'hardcoded') { factors.push('Estimated duty rate'); score *= 0.8; }
      if (hsResult && hsResult.hsCode !== '9999') factors.push('HS-specific');
      else { factors.push('No HS classification'); score *= 0.7; }
      if (ftaResult?.hasFta) factors.push('FTA applied');
      if (tradeRemedyResult?.hasRemedies) factors.push('Trade remedies included');
      const level = score >= 0.8 ? 'high' as const : score >= 0.6 ? 'medium' as const : 'low' as const;
      return {
        level,
        estimatedAccuracy: Math.round(score * 100),
        factors,
      };
    })(),
    dataFreshness: {
      dutyRateAge: dutyRateSource === 'agr' || dutyRateSource === 'min' || dutyRateSource === 'ntlc'
        ? 'macmap_db' : dutyRateSource || 'hardcoded',
      quality: dutyRateSource === 'hardcoded' ? 'fallback'
        : (dutyRateSource === 'agr' || dutyRateSource === 'min' || dutyRateSource === 'ntlc' || dutyRateSource === 'live_db' || dutyRateSource === 'external_api') ? 'fresh'
        : 'stale',
    },
    exchangeRateTimestamp: localCurrency?.lastUpdated,
    detectedOriginCountry: (!input.origin && hsResult?.countryOfOrigin) ? hsResult.countryOfOrigin : undefined,
    localCurrency,
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

  const profile = getCountryProfile(destination);

  if (profile) {
    return calculateWithProfileSync(input, profile);
  }

  // US fallback if no hardcoded profile
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

  return calculateWithDefaults(input, destination);
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

  // VAT/GST (US: state-level sales tax from zipcode)
  let vat = 0;
  let effectiveVatRateSync = profile.vatRate;
  let effectiveVatLabelSync = profile.vatLabel;

  if (profile.code === 'US' && input.zipcode) {
    const state = zipcodeToState(input.zipcode);
    const stateTaxRate = state ? (STATE_TAX_RATES[state] ?? 0.07) : 0.07;
    vat = declaredValue * stateTaxRate;
    effectiveVatRateSync = stateTaxRate;
    effectiveVatLabelSync = 'Sales Tax';
  } else if (profile.code === 'US') {
    vat = declaredValue * 0.07;
    effectiveVatRateSync = 0.07;
    effectiveVatLabelSync = 'Sales Tax';
  } else if (profile.code === 'CA' && input.zipcode) {
    // Canada uses province-level GST/HST/PST
    const province = postalCodeToProvince(input.zipcode);
    const provRate = province ? (CANADA_PROVINCE_TAX_RATES[province] ?? 0.05) : 0.05;
    const taxBase = isDomestic ? declaredValue : (declaredValue + importDuty);
    vat = taxBase * provRate;
    effectiveVatRateSync = provRate;
    const HST_PROVS = new Set(['ON', 'NB', 'NS', 'NL', 'PE']);
    effectiveVatLabelSync = province && HST_PROVS.has(province) ? 'HST' : (provRate > 0.05 ? 'GST+PST' : 'GST');
  } else if (profile.code === 'CA') {
    const taxBase = isDomestic ? declaredValue : (declaredValue + importDuty);
    vat = taxBase * profile.vatRate;
    effectiveVatRateSync = profile.vatRate;
    effectiveVatLabelSync = 'GST/HST';
  } else if (profile.code === 'BR' && !isDomestic && !deMinimisApplied) {
    const brState = input.zipcode ? cepToState(input.zipcode) : null;
    const icmsRate = brState ? (BRAZIL_STATE_ICMS_RATES[brState] ?? 0.18) : 0.18;
    const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate);
    vat = brTaxes.totalTax;
    effectiveVatRateSync = brTaxes.effectiveRate;
    effectiveVatLabelSync = brState ? `ICMS ${brState}` : 'Import Taxes';
  } else if (profile.code === 'IN' && !isDomestic && !deMinimisApplied) {
    // India: BCD + SWS (10% of BCD) + IGST (on CIF + BCD + SWS)
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const igstRate = hsChapter ? getIndiaIgstRate(hsChapter) : 0.18;
    const inTaxes = calculateIndiaImportTaxes(declaredValue, importDuty, igstRate);
    vat = inTaxes.totalTax;
    effectiveVatRateSync = inTaxes.effectiveRate;
    effectiveVatLabelSync = 'IGST+SWS';
  } else if (profile.code === 'CN' && !isDomestic && !deMinimisApplied) {
    // China: CBEC tax regime (9.1% composite) or regular import
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const cnTaxes = calculateChinaCBECTaxes(declaredValue, importDuty, hsChapter);
    vat = cnTaxes.totalTax;
    effectiveVatRateSync = cnTaxes.effectiveRate;
    effectiveVatLabelSync = cnTaxes.isCBEC ? 'CBEC Tax' : 'VAT+CT';
  } else if (profile.code === 'MX' && !isDomestic && !deMinimisApplied) {
    // Mexico: IVA 16% + IEPS (excise tax on certain goods)
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const mxTaxes = calculateMexicoImportTaxes(declaredValue, importDuty, hsChapter);
    vat = mxTaxes.totalTax;
    effectiveVatRateSync = mxTaxes.effectiveRate;
    effectiveVatLabelSync = mxTaxes.ieps > 0 ? 'IVA+IEPS' : 'IVA';
  } else if (isDomestic) {
    vat = declaredValue * profile.vatRate;
  } else {
    vat = (declaredValue + importDuty) * profile.vatRate;
  }

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

  if (profile.code === 'BR' && !isDomestic && !deMinimisApplied && vat > 0) {
    const brState = input.zipcode ? cepToState(input.zipcode) : null;
    const icmsRate = brState ? (BRAZIL_STATE_ICMS_RATES[brState] ?? 0.18) : 0.18;
    const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate);
    breakdown.push({ label: 'IPI', amount: round(brTaxes.ipi), note: '~10% industrial tax' });
    breakdown.push({ label: 'PIS/COFINS', amount: round(brTaxes.pisCofins), note: '11.75% federal' });
    breakdown.push({ label: 'ICMS', amount: round(brTaxes.icms), note: `${(icmsRate * 100).toFixed(1)}% ${brState || 'avg'}` });
  } else if (profile.code === 'IN' && !isDomestic && !deMinimisApplied && vat > 0) {
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const igstRate = hsChapter ? getIndiaIgstRate(hsChapter) : 0.18;
    const inTaxes = calculateIndiaImportTaxes(declaredValue, importDuty, igstRate);
    breakdown.push({ label: 'SWS', amount: round(inTaxes.sws), note: '10% of BCD' });
    breakdown.push({ label: 'IGST', amount: round(inTaxes.igst), note: `${(igstRate * 100).toFixed(0)}% integrated GST` });
  } else if (profile.code === 'CN' && !isDomestic && !deMinimisApplied && vat > 0) {
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const cnTaxes = calculateChinaCBECTaxes(declaredValue, importDuty, hsChapter);
    if (cnTaxes.isCBEC) {
      breakdown.push({ label: 'CBEC Tax', amount: round(cnTaxes.totalTax), note: `${(cnTaxes.effectiveRate * 100).toFixed(1)}% composite` });
    } else {
      breakdown.push({ label: 'VAT', amount: round(cnTaxes.vat), note: '13% (standard)' });
      if (cnTaxes.consumptionTax > 0) {
        breakdown.push({ label: 'Consumption Tax', amount: round(cnTaxes.consumptionTax), note: 'Luxury/excise' });
      }
    }
  } else if (profile.code === 'MX' && !isDomestic && !deMinimisApplied && vat > 0) {
    const hsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const mxTaxes = calculateMexicoImportTaxes(declaredValue, importDuty, hsChapter);
    breakdown.push({ label: 'IVA', amount: round(mxTaxes.iva), note: '16%' });
    if (mxTaxes.ieps > 0) {
      breakdown.push({ label: 'IEPS', amount: round(mxTaxes.ieps), note: 'Excise tax' });
    }
  } else if (vat > 0) {
    breakdown.push({
      label: effectiveVatLabelSync === 'None' ? 'Tax' : effectiveVatLabelSync,
      amount: round(vat),
      note: `${(effectiveVatRateSync * 100).toFixed(1)}%`,
    });
  }

  // Country-specific processing / customs handling fees
  let mpf = 0;
  if (!isDomestic && !deMinimisApplied) {
    if (profile.code === 'US') {
      mpf = Math.min(Math.max(declaredValue * 0.003464, 31.67), 614.35);
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'CBP MPF' });
    } else if (profile.code === 'AU') {
      mpf = 56;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'ABF IPC ~AUD 88' });
    } else if (profile.code === 'NZ') {
      mpf = 20;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'MPI Biosecurity Levy' });
    } else if (profile.code === 'CA') {
      mpf = 10;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'CBSA handling est.' });
    } else if (profile.code === 'JP') {
      mpf = 20;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'Customs broker est.' });
    } else if (profile.code === 'KR') {
      mpf = 15;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'KCS clearance est.' });
    } else if (profile.code === 'IN') {
      mpf = declaredValue * 0.01;
      breakdown.push({ label: 'Landing Charges', amount: round(mpf), note: '1% of CIF' });
    } else if (profile.code === 'CH') {
      mpf = 17;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'Statistical fee' });
    } else if (profile.code === 'CN') {
      mpf = 30;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'Customs clearance est.' });
    } else if (profile.code === 'MX') {
      mpf = Math.max(declaredValue * 0.008, 36);
      breakdown.push({ label: 'DTA', amount: round(mpf), note: '0.8% customs processing' });
    } else if (profile.code === 'SG') {
      mpf = 10;
      breakdown.push({ label: 'Processing Fee', amount: round(mpf), note: 'TradeNet permit est.' });
    } else if (profile.code === 'BR') {
      mpf = 36;
      breakdown.push({ label: 'SISCOMEX', amount: round(mpf), note: 'Import registration fee' });
    }
  }

  const totalWithMpf = productPrice + shippingCost + importDuty + vat + mpf;

  const originClass: 'CN' | 'OTHER' | 'DOMESTIC' =
    isDomestic ? 'DOMESTIC' : originCountry === 'CN' ? 'CN' : 'OTHER';

  return {
    productPrice: round(productPrice),
    shippingCost: round(shippingCost),
    importDuty: round(importDuty),
    mpf: round(mpf),
    salesTax: round(vat),
    totalLandedCost: round(totalWithMpf),
    type: isDomestic ? 'domestic' : 'global',
    isDutyFree: importDuty === 0,
    originCountry: originClass,
    breakdown,
    destinationCountry: profile.code,
    vat: round(vat),
    vatLabel: effectiveVatLabelSync,
    vatRate: effectiveVatRateSync,
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

/**
 * Async batch calculator — runs all items in parallel using Promise.allSettled.
 * Failed items are silently skipped (logged to console.warn).
 * Concurrency: unlimited (Promise.allSettled). For rate-limited APIs,
 * the individual providers already have circuit breakers.
 */
export async function calculateGlobalBatchLandedCostsAsync(
  items: (GlobalCostInput & { id: string })[]
): Promise<Map<string, GlobalLandedCost>> {
  const costMap = new Map<string, GlobalLandedCost>();

  const results = await Promise.allSettled(
    items.map(async (item) => ({
      id: item.id,
      result: await calculateGlobalLandedCostAsync(item),
    }))
  );

  for (const settled of results) {
    if (settled.status === 'fulfilled') {
      costMap.set(settled.value.id, settled.value.result);
    } else {
      console.warn('[POTAL Batch] Item failed:', settled.reason);
    }
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
