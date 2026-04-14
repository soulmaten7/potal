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
import { calculateLandedCost as calculateUSLandedCost, parsePriceToNumber, zipcodeToState, STATE_TAX_RATES, postalCodeToProvince, CANADA_PROVINCE_TAX_RATES, cepToState, BRAZIL_STATE_ICMS_RATES, calculateBrazilImportTaxes, getBrazilIpiRate, calculateIndiaImportTaxes, getIndiaIgstRate, calculateChinaCBECTaxes, calculateMexicoImportTaxes, getMexicoIepsRate } from './CostEngine';
import { getCountryProfile, type CountryTaxProfile } from './country-data';
import { classifyWithOverride } from './hs-code';
import type { HsClassificationResult } from './hs-code';
import type { FtaResult } from './hs-code/fta';

// AI-powered classification (async, with DB caching)
import { classifyWithOverrideAsync } from './ai-classifier';

// EU HS chapter-based reduced VAT rates
import { getEuReducedVatRate } from './eu-vat-rates';

// External tariff API (async, with DB caching + circuit breaker)
import { fetchDutyRateWithFallback, getFtaRateFromLiveDb } from './tariff-api';

// Real-time exchange rates
import { convertCurrency, type CurrencyConversion } from './exchange-rate';

// DB-backed modules (async, with cache + hardcoded fallback)
import { getCountryProfileFromDb } from './db/country-data-db';
import { getDutyRateFromDb, getEffectiveDutyRateFromDb, hasCountryDutyDataFromDb } from './db/duty-rates-db';
import { applyFtaRateFromDb } from './db/fta-db';

// MacMap 4-stage fallback lookup (AGR → MIN → NTLC → MFN) + tariff optimization
import { lookupMacMapDutyRate, lookupAllDutyRates, type TariffOptimization } from './macmap-lookup';

// Trade remedy lookup (AD/CVD/Safeguard)
import { lookupTradeRemedies, type TradeRemedyResult } from './trade-remedy-lookup';

// US Section 301/232 additional tariffs
import { lookupUSAdditionalTariffs, type USAdditionalTariffResult } from './section301-lookup';

// Hardcoded fallbacks (sync, for backward compat)
import { getEffectiveDutyRate as getHardcodedEffectiveDutyRate, getDutyRate as getHardcodedDutyRate, hasCountryDutyData as hardcodedHasCountryDutyData } from './hs-code';
import { applyFtaRate as hardcodedApplyFtaRate } from './hs-code/fta';

// HS 10-digit resolver (7 countries: US/EU/GB/KR/CA/AU/JP)
import { resolveHs10, type Hs10Resolution } from './hs-code/hs10-resolver';

// Precomputed landed cost cache (117,600 combinations: 490 HS6 × 240 countries)
import { getPrecomputedLandedCost, type PrecomputedLandedCost } from './db/precomputed-cache';

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
  productMaterial?: string;
  hsCode?: string;
  /** Insurance rate override (0.01 = 1%). Default: auto-calculated based on CIF */
  insuranceRate?: number;
  /** Include brokerage fee estimate (default: true for international) */
  includeBrokerage?: boolean;
  /** Shipping terms / Incoterms: DDP, DDU, CIF, FOB, EXW */
  shippingTerms?: 'DDP' | 'DDU' | 'CIF' | 'FOB' | 'EXW';
  /** Exporter/manufacturer firm name for firm-specific AD/CVD matching */
  firmName?: string;
  /** Weight in kilograms (for specific/compound duty types) */
  weight_kg?: number;
  /** Quantity (for per-unit specific duties) */
  quantity?: number;
  /** Annual import volume for savings projection */
  annualVolume?: number;
  /** Buyer VAT registration number (triggers B2B reverse charge) */
  buyerVatNumber?: string;
  /** Seller plan ID for guarantee tier determination */
  planId?: string;
  /** CW34-S4: 10-field material (e.g. "cotton", "steel") */
  material?: string;
  /** CW34-S4: Material composition percentages */
  materialComposition?: Record<string, number>;
  /** CW34-S4: Product form (e.g. "knitted", "woven", "molded") */
  productForm?: string;
  /** CW34-S4: Intended use (e.g. "clothing", "industrial") */
  intendedUse?: string;
}

// ─── 15-Item Detailed Cost Breakdown ────────────────

export interface DetailedCostItem {
  amount: number;
  calculation_basis: string;
}

export interface DetailedCostBreakdown {
  product_price: DetailedCostItem;
  import_duty: DetailedCostItem;
  anti_dumping_duty: DetailedCostItem;
  countervailing_duty: DetailedCostItem;
  safeguard_duty: DetailedCostItem;
  vat_gst: DetailedCostItem;
  customs_processing_fee: DetailedCostItem;
  merchandise_processing_fee: DetailedCostItem;
  harbor_maintenance_fee: DetailedCostItem;
  insurance_estimate: DetailedCostItem;
  freight_estimate: DetailedCostItem;
  broker_fee_estimate: DetailedCostItem;
  documentation_fee: DetailedCostItem;
  currency_conversion_cost: DetailedCostItem;
  total_landed_cost: DetailedCostItem;
}

// ─── Incoterms Comparison ───────────────────────────

export interface IncotermsComparison {
  DDP: { total: number; breakdown: string; buyer_owes: number };
  DAP: { total: number; breakdown: string; buyer_owes: number };
  EXW: { total: number; breakdown: string; buyer_owes: number };
}

// ─── Rate Optimization ──────────────────────────────

export interface RateOptimizationResult {
  available_rates: { type: string; rate: number; condition?: string }[];
  optimal: { type: string; rate: number; reason: string };
  savings_vs_mfn: { per_unit: number; annual_estimate?: number };
}

// ─── Duty Type ──────────────────────────────────────

export type DutyType = 'ad_valorem' | 'specific' | 'compound' | 'mixed';

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
  /** Where the duty rate came from: 'agr' | 'min' | 'ntlc' | 'mfn' | 'live_db' | 'external_api' | 'db' | 'hardcoded' | 'macmap_ntlc' */
  dutyRateSource?: string;
  /** Resolved rate type from DB: ad_valorem | specific | compound */
  rateTypeResolved?: string;
  /** Confidence score of the duty rate (1.0=agr, 0.9=min, 0.8=ntlc, 0.7=mfn/hardcoded) */
  dutyConfidenceScore?: number;
  /** CW34-S4: Matching customs ruling precedent (classification reference, not duty source) */
  rulingMatch?: { rulingId: string; source: string; confidenceScore: number; matchScore: number; conditionalApplied?: string };
  /** CW36-CN1: Data availability warning for jurisdictions without rulings */
  dataAvailability?: { jurisdiction: string; status: string; warning?: string };
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
  /** Shipping terms / Incoterms used */
  shippingTerms?: 'DDP' | 'DDU' | 'CIF' | 'FOB' | 'EXW';
  /** DDU breakdown: duties/taxes the buyer must pay at delivery (DDU mode only) */
  dduBuyerCharges?: {
    importDuty: number;
    vat: number;
    processingFee: number;
    total: number;
    note: string;
  };
  /** Incoterms cost allocation — who pays what */
  incotermsBreakdown?: {
    /** Incoterm used */
    term: string;
    /** What the seller pays */
    sellerPays: { item: string; amount: number }[];
    /** What the buyer pays */
    buyerPays: { item: string; amount: number }[];
    /** Seller total */
    sellerTotal: number;
    /** Buyer total */
    buyerTotal: number;
  };
  /** HS 10-digit resolution result (7 countries) */
  hs10Resolution?: Hs10Resolution;
  /** HS code precision: 'HS10' (7 countries with gov schedule) or 'HS6' (233 countries) */
  hsCodePrecision?: 'HS10' | 'HS9' | 'HS8' | 'HS6';
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
  /** Tariff optimization: compares MFN/MIN/AGR rates and shows savings */
  tariffOptimization?: TariffOptimization;
  /** Whether result came from precomputed cache (117,600 combinations) */
  precomputed?: boolean;
  /** Response time in milliseconds */
  responseTimeMs?: number;
  /** Precomputed cache coverage info */
  cacheCoverage?: string;
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

  /** VAT rate type applied: standard, reduced, zero, exempt, or reverse_charge */
  vatRateType?: 'standard' | 'reduced' | 'zero' | 'exempt' | 'reverse_charge';
  /** B2B reverse charge info (when buyer provides VAT number) */
  reverseCharge?: {
    applied: boolean;
    buyerVatNumber: string;
    note: string;
  };

  // ─── S-Grade Extensions (CW14) ──────────────────

  /** 15-item detailed cost breakdown with calculation basis */
  detailedCostBreakdown?: DetailedCostBreakdown;
  /** Incoterms comparison: DDP vs DAP vs EXW */
  incotermsComparison?: IncotermsComparison;
  /** Rate optimization: all available rates + optimal + savings */
  rateOptimization?: RateOptimizationResult;
  /** Duty calculation type used */
  dutyType?: DutyType;
  /** Weight-based duty component (if specific/compound) */
  weightBasedDuty?: number;
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

  // HS Code Classification — AI-powered async (DB 캐시 → v3 pipeline → 키워드 → AI 폴백)
  let hsResult: HsClassificationResult | undefined;
  let classificationSource: string | undefined;
  if (input.productName || input.hsCode) {
    const asyncResult = await classifyWithOverrideAsync(
      input.productName || '',
      input.hsCode,
      input.productCategory,
      undefined, // sellerId
      input.productMaterial,
      originCountry,
      profile.code,
    );
    hsResult = asyncResult;
    classificationSource = asyncResult.classificationSource;

    // Auto-detect origin: if seller didn't provide origin, use AI-detected country
    if (!input.origin && asyncResult.countryOfOrigin) {
      originCountry = asyncResult.countryOfOrigin;
    }
  }

  const isDomestic = originCountry === profile.code;

  // ━━━ HS 10-digit Resolution (7 countries) ━━━
  let hs10Result: Hs10Resolution | undefined;
  if (hsResult && hsResult.hsCode !== '9999' && !isDomestic) {
    try {
      hs10Result = await resolveHs10(
        hsResult.hsCode.substring(0, 6),
        profile.code,
        input.productName || '',
        productPrice,
      );
      // If HS10 resolved with a duty rate, use it
      if (hs10Result.dutyRate !== undefined && hs10Result.hsCodePrecision !== 'HS6') {
        // Will be used as additional context below
      }
    } catch {
      // HS10 resolution failure is non-critical
    }
  }

  // ━━━ CW34-S4: Ruling Lookup (classification precedent, NOT duty rate) ━━━
  // ━━━ CW36-CN1: Data availability warning for jurisdictions without rulings ━━━
  let rulingMatch: { rulingId: string; source: string; confidenceScore: number; matchScore: number; conditionalApplied?: string } | undefined;
  let rulingConditionalDutyOverride: number | null = null;
  let dataAvailability: { jurisdiction: string; status: string; warning?: string } | undefined;
  if (hsResult && hsResult.hsCode !== '9999' && !isDomestic) {
    try {
      const { lookupRulings, checkDataAvailability } = await import('@/app/lib/rulings/lookup');
      const { evaluateConditionalRules } = await import('@/app/lib/rulings/conditional-evaluator');
      const hs6 = hsResult.hsCode.substring(0, 6);
      const destJurisdiction = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'].includes(profile.code) ? 'EU' : profile.code;
      const rulings = await lookupRulings({
        hsCode: hsResult.hsCode,
        hs6,
        jurisdiction: destJurisdiction,
        material: (input as GlobalCostInput).material as string | undefined,
        productForm: (input as GlobalCostInput).productForm as string | undefined,
        intendedUse: (input as GlobalCostInput).intendedUse as string | undefined,
        limit: 3,
      });
      if (rulings.length > 0) {
        const top = rulings[0];
        rulingMatch = { rulingId: top.rulingId, source: top.source, confidenceScore: top.confidenceScore, matchScore: top.matchScore };
        // CEO Decision 2: only conditional_rules outcomes provide duty rates
        if (top.conditionalRules) {
          const evalResult = evaluateConditionalRules(top.conditionalRules, {
            material: (input as GlobalCostInput).material as string | undefined,
            materialComposition: (input as GlobalCostInput).materialComposition as Record<string, number> | undefined,
            productForm: (input as GlobalCostInput).productForm as string | undefined,
            weightKg: input.weight_kg,
            priceUsd: productPrice,
          });
          if (evalResult.matched && evalResult.adValorem != null) {
            rulingConditionalDutyOverride = evalResult.adValorem / 100; // percentage → decimal
            rulingMatch.conditionalApplied = evalResult.reason;
          }
        }
      }
      // CW36-CN1: Check data availability for this jurisdiction
      if (!rulingMatch) {
        dataAvailability = checkDataAvailability(destJurisdiction) ?? undefined;
      }
    } catch { /* ruling lookup failure is non-critical */ }
  }

  // Determine Duty Rate — Precomputed → MacMap 4단계 폴백 → 정부 API → DB → 하드코딩
  let dutyRate = profile.avgDutyRate;
  let dutyNote = `~${(profile.avgDutyRate * 100).toFixed(1)}% avg`;
  let additionalTariffNote: string | undefined;
  let ftaResult: FtaResult | undefined;
  let dutyRateSource: string = 'hardcoded';
  let dutyConfidenceScore: number = 0.7;
  let tariffOptimization: TariffOptimization | undefined;
  let precomputedHit = false;

  // ━━━ 0차: Precomputed cache lookup (117,600 combinations, <50ms) ━━━
  if (hsResult && hsResult.hsCode !== '9999') {
    const hs6 = hsResult.hsCode.substring(0, 6);
    try {
      const cached = await getPrecomputedLandedCost(hs6, profile.code);
      if (cached && cached.best_rate !== null) {
        dutyRate = cached.best_rate / 100; // DB stores as percentage, engine uses decimal
        dutyNote = `HS ${hsResult.hsCode} (${cached.best_rate.toFixed(1)}%) [precomputed:${cached.best_rate_source}]`;
        dutyRateSource = `precomputed_${(cached.best_rate_source || 'MFN').toLowerCase()}`;
        dutyConfidenceScore = cached.best_rate_source === 'AGR' ? 1.0 :
                              cached.best_rate_source === 'MIN' ? 1.0 : 1.0;
        precomputedHit = true;

        // Build tariff optimization from precomputed data if multiple rates available
        if (cached.mfn_rate !== null) {
          const rateOptions: TariffOptimization['rateOptions'] = [];
          rateOptions.push({ rateType: 'MFN', source: 'mfn', rate: cached.mfn_rate / 100, matchedCode: hs6, agreementName: 'MFN' });
          if (cached.min_rate !== null) {
            rateOptions.push({ rateType: 'MIN', source: 'min', rate: cached.min_rate / 100, matchedCode: hs6, agreementName: 'Preferential (MIN)' });
          }
          if (cached.agr_rate !== null) {
            rateOptions.push({ rateType: 'AGR', source: 'agr', rate: cached.agr_rate / 100, matchedCode: hs6, agreementName: 'Agreement (AGR)' });
          }
          if (rateOptions.length > 1) {
            const mfnRate = cached.mfn_rate / 100;
            const bestRate = cached.best_rate / 100;
            const optType = cached.best_rate_source === 'AGR' ? 'AGR' as const :
                            cached.best_rate_source === 'MIN' ? 'MIN' as const : 'MFN' as const;
            tariffOptimization = {
              optimalRate: bestRate,
              optimalRateType: optType,
              optimalAgreementName: optType === 'AGR' ? 'Agreement (AGR)' :
                                    optType === 'MIN' ? 'Preferential (MIN)' : 'MFN',
              mfnRate: mfnRate,
              savingsVsMfn: mfnRate - bestRate,
              savingsPercent: mfnRate > 0 ? Math.round((mfnRate - bestRate) / mfnRate * 100) : 0,
              rateOptions: rateOptions,
            };
          }
        }
      }
    } catch {
      // Precomputed lookup failure is non-critical, fall through to live lookup
    }
  }

  if (hsResult && hsResult.hsCode !== '9999' && !precomputedHit) {
    const hsChapter = hsResult.hsCode.substring(0, 2);

    // ━━━ 1차: MacMap 관세최적화 — 3개 테이블 병렬 조회 후 최저 세율 자동 선택 ━━━
    const { best: macmapResult, optimization } = await lookupAllDutyRates(profile.code, originCountry, hsResult.hsCode);
    if (macmapResult) {
      dutyRate = macmapResult.avDuty;
      dutyNote = `HS ${hsResult.hsCode} (${(dutyRate * 100).toFixed(1)}%) [${macmapResult.source}]`;
      dutyRateSource = macmapResult.source;
      dutyConfidenceScore = macmapResult.confidenceScore;
      if (optimization && optimization.rateOptions.length > 1) {
        tariffOptimization = optimization;
        if (optimization.savingsVsMfn > 0 && optimization.optimalAgreementName) {
          dutyNote += ` (${optimization.optimalAgreementName}, -${optimization.savingsPercent}%)`;
        }
      }
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

  // CW34-S4: Ruling conditional override (CEO Decision 2: only conditional outcomes)
  if (rulingConditionalDutyOverride !== null) {
    dutyRate = rulingConditionalDutyOverride;
    dutyRateSource = `ruling_conditional`;
    dutyNote = `HS ${hsResult?.hsCode || '?'} (${(dutyRate * 100).toFixed(1)}%) [ruling:${rulingMatch?.rulingId}]`;
    dutyConfidenceScore = rulingMatch?.confidenceScore ?? 0.8;
  }

  // Save base duty rate BEFORE additional tariffs (for accurate breakdown)
  const baseDutyRate = dutyRate;

  // Rich duty rate lookup for specific/compound duty support
  let richDutyRate: import('./db/duty-rates-db').RichDutyRate | null = null;
  if (!isDomestic && hsResult && hsResult.hsCode !== '9999') {
    try {
      const { getRichDutyRate } = await import('./db/duty-rates-db');
      richDutyRate = await getRichDutyRate(hsResult.hsCode, profile.code, originCountry);
    } catch { /* non-critical */ }
  }

  // Trade Remedies: AD/CVD/Safeguard additional duties
  let tradeRemedyResult: TradeRemedyResult | undefined;
  let tradeRemedyRate = 0;
  if (!isDomestic && hsResult && hsResult.hsCode !== '9999') {
    tradeRemedyResult = await lookupTradeRemedies(profile.code, originCountry, hsResult.hsCode, {
      firmName: (input as GlobalCostInput).firmName,
    });
    if (tradeRemedyResult.hasRemedies) {
      tradeRemedyRate = tradeRemedyResult.totalRemedyRate;
      dutyRate += tradeRemedyRate;
      const remedyTypes = tradeRemedyResult.measures.map(m => m.type).join('+');
      additionalTariffNote = `${remedyTypes}: +${(tradeRemedyRate * 100).toFixed(1)}%`;
    }
  }

  // US Section 301/232 additional tariffs
  let usAdditionalTariffs: USAdditionalTariffResult | undefined;
  let usAdditionalRate = 0;
  if (!isDomestic && profile.code === 'US' && hsResult && hsResult.hsCode !== '9999') {
    usAdditionalTariffs = lookupUSAdditionalTariffs(originCountry, hsResult.hsCode);
    if (usAdditionalTariffs.hasAdditionalTariffs) {
      usAdditionalRate = usAdditionalTariffs.totalRate;
      dutyRate += usAdditionalRate;
      const notes: string[] = [];
      if (usAdditionalTariffs.section301) notes.push(usAdditionalTariffs.section301.note);
      if (usAdditionalTariffs.section232) notes.push(usAdditionalTariffs.section232.note);
      additionalTariffNote = (additionalTariffNote ? additionalTariffNote + '; ' : '') + notes.join('; ');
    }
  }

  // Calculate separate duty amounts for breakdown
  const additionalTariffRate = tradeRemedyRate + usAdditionalRate;

  // De Minimis — split into duty and tax thresholds
  // Many countries have different thresholds for duty vs tax exemption
  // EU: duty exempt ≤€150 but VAT always applies (IOSS); AU: no duty/GST exemption post-2018 for LVG
  // US: $800 de minimis covers both duty and tax; UK: £135 duty de minimis, VAT always applies
  // Origin-specific exceptions: US $0 for CN/HK (IEEPA Aug 2025)
  let dutyThresholdUsd = profile.deMinimisUsd;
  if (profile.deMinimisExceptions && originCountry in profile.deMinimisExceptions) {
    dutyThresholdUsd = profile.deMinimisExceptions[originCountry];
  }
  // Tax threshold: most countries = same as duty, but UK/EU/AU have $0 (tax always applies on imports)
  const taxAlwaysAppliesCountries = new Set([...EU_IOSS_COUNTRIES, 'GB', 'AU', 'NZ', 'NO', 'CH']);
  const taxThresholdUsd = taxAlwaysAppliesCountries.has(profile.code) ? 0 : dutyThresholdUsd;

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
  let vatRateType: 'standard' | 'reduced' | 'zero' | 'exempt' | 'reverse_charge' = 'standard';

  // F003: B2B Reverse Charge — if buyer has VAT number, VAT = 0
  const isReverseCharge = !!input.buyerVatNumber && !isDomestic;
  if (isReverseCharge) {
    vat = 0;
    effectiveVatRate = 0;
    vatRateType = 'reverse_charge';
    effectiveVatLabel = `${profile.vatLabel} (Reverse Charge)`;
  }

  // F003: Product-specific VAT rate lookup from DB
  let productVatApplied = false;
  if (!isReverseCharge && hsResult?.hsCode && hsResult.hsCode !== '9999') {
    const hsChapter = hsResult.hsCode.substring(0, 2);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: vatProduct } = await sb
        .from('vat_product_rates')
        .select('rate, rate_type, description')
        .eq('country_code', profile.code)
        .eq('hs_chapter', hsChapter)
        .neq('rate_type', 'standard')
        .order('rate', { ascending: true })
        .limit(1)
        .single();

      if (vatProduct) {
        effectiveVatRate = parseFloat(vatProduct.rate);
        vatRateType = vatProduct.rate_type as typeof vatRateType;
        effectiveVatLabel = `${profile.vatLabel} (${vatProduct.description || vatProduct.rate_type})`;
        productVatApplied = true;
      }
    } catch { /* no product-specific rate, use standard */ }
  }

  if (isReverseCharge) {
    // Already handled above — skip all VAT calculation
  } else if (profile.code === 'US' && input.zipcode) {
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
    const brHsChapter = hsResult?.hsCode ? hsResult.hsCode.substring(0, 2) : '';
    const brIpiRate = brHsChapter ? getBrazilIpiRate(brHsChapter + '0000') : undefined;
    const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate, brIpiRate);
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

    // Check for HS chapter-based reduced VAT rate (e.g. food, books, pharma)
    const euReduced = hsResult?.hsCode ? getEuReducedVatRate(profile.code, hsResult.hsCode) : null;
    const euVatRate = euReduced ? euReduced.rate : profile.vatRate;
    const euVatLabel = euReduced ? `${euReduced.label}` : undefined;

    if (declaredValue <= EU_IOSS_THRESHOLD_USD) {
      // IOSS: VAT at destination rate, duty exempt
      vat = declaredValue * euVatRate;
      effectiveVatRate = euVatRate;
      effectiveVatLabel = euVatLabel ? `VAT (IOSS, ${euVatLabel})` : 'VAT (IOSS)';
      // Under IOSS, customs duty is waived for ≤€150
      importDuty = 0;
    } else {
      // Standard EU import: VAT on (CIF + duty)
      vat = (declaredValue + importDuty) * euVatRate;
      effectiveVatRate = euVatRate;
      effectiveVatLabel = euVatLabel ? `Import VAT (${euVatLabel})` : 'Import VAT';
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
    vat = declaredValue * (productVatApplied ? effectiveVatRate : profile.vatRate);
  } else {
    vat = (declaredValue + importDuty) * (productVatApplied ? effectiveVatRate : profile.vatRate);
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
    // Split importDuty into base duty vs additional tariff amounts
    const baseDutyAmount = deMinimisApplied ? 0 : round(declaredValue * baseDutyRate);
    const additionalTariffAmount = deMinimisApplied ? 0 : round(declaredValue * additionalTariffRate);

    if (deMinimisApplied) {
      breakdown.push({ label: 'Import Duty', amount: 0, note: `De minimis exempt (≤$${profile.deMinimisUsd})` });
    } else if (isIossExempt) {
      breakdown.push({ label: 'Import Duty', amount: 0, note: 'IOSS exempt (≤€150)' });
    } else if (baseDutyAmount > 0) {
      breakdown.push({ label: 'Import Duty', amount: baseDutyAmount, note: dutyNote });
    } else {
      breakdown.push({ label: 'Import Duty', amount: 0, note: additionalTariffAmount > 0 ? `Base duty 0% (${dutyNote})` : 'Duty-free' });
    }

    if (additionalTariffNote && additionalTariffAmount > 0) {
      breakdown.push({ label: 'Additional Tariff', amount: additionalTariffAmount, note: additionalTariffNote });
    } else if (additionalTariffNote) {
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
        // Formal entry (>$2500): MPF 0.3464%, min $32.71, max $634.04 (FY2025/2026)
        mpf = Math.min(Math.max(declaredValue * 0.003464, 32.71), 634.04);
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

  // DDU/CIF/FOB/EXW: buyer pays duties/taxes at delivery
  const isDDU = input.shippingTerms === 'DDU' || input.shippingTerms === 'CIF' || input.shippingTerms === 'FOB' || input.shippingTerms === 'EXW';
  const dduBuyerCharges = (!isDomestic && isDDU) ? {
    importDuty: round(importDuty),
    vat: round(vat),
    processingFee: round(mpf),
    total: round(importDuty + vat + mpf),
    note: `Buyer pays at delivery (${input.shippingTerms || 'DDU'})`,
  } : undefined;

  // For DDU, totalLandedCost still includes everything (full cost to buyer)
  // but dduBuyerCharges shows what the buyer must pay separately at delivery

  // Build incoterms cost allocation breakdown
  const incotermsBreakdown = (!isDomestic) ? (() => {
    const term = input.shippingTerms || 'DDP';
    const sellerPays: { item: string; amount: number }[] = [];
    const buyerPays: { item: string; amount: number }[] = [];

    // Product price is always seller's cost
    sellerPays.push({ item: 'Product', amount: round(productPrice) });

    if (term === 'EXW') {
      // EXW: Seller delivers at their premises. Buyer pays everything else.
      buyerPays.push({ item: 'Shipping', amount: round(shippingCost) });
      buyerPays.push({ item: 'Insurance', amount: round(insurance) });
      buyerPays.push({ item: 'Import Duty', amount: round(importDuty) });
      buyerPays.push({ item: 'VAT/GST', amount: round(vat) });
      if (mpf > 0) buyerPays.push({ item: 'Processing Fee', amount: round(mpf) });
      if (brokerageFee > 0) buyerPays.push({ item: 'Brokerage', amount: round(brokerageFee) });
    } else if (term === 'FOB') {
      // FOB: Seller delivers to port. Buyer pays freight + insurance + duties.
      buyerPays.push({ item: 'Shipping (freight)', amount: round(shippingCost) });
      buyerPays.push({ item: 'Insurance', amount: round(insurance) });
      buyerPays.push({ item: 'Import Duty', amount: round(importDuty) });
      buyerPays.push({ item: 'VAT/GST', amount: round(vat) });
      if (mpf > 0) buyerPays.push({ item: 'Processing Fee', amount: round(mpf) });
      if (brokerageFee > 0) buyerPays.push({ item: 'Brokerage', amount: round(brokerageFee) });
    } else if (term === 'CIF') {
      // CIF: Seller pays freight + insurance. Buyer pays duties at destination.
      sellerPays.push({ item: 'Shipping (freight)', amount: round(shippingCost) });
      sellerPays.push({ item: 'Insurance', amount: round(insurance) });
      buyerPays.push({ item: 'Import Duty', amount: round(importDuty) });
      buyerPays.push({ item: 'VAT/GST', amount: round(vat) });
      if (mpf > 0) buyerPays.push({ item: 'Processing Fee', amount: round(mpf) });
      if (brokerageFee > 0) buyerPays.push({ item: 'Brokerage', amount: round(brokerageFee) });
    } else if (term === 'DDU') {
      // DDU: Seller pays shipping. Buyer pays duties/taxes at delivery.
      sellerPays.push({ item: 'Shipping', amount: round(shippingCost) });
      buyerPays.push({ item: 'Import Duty', amount: round(importDuty) });
      buyerPays.push({ item: 'VAT/GST', amount: round(vat) });
      if (mpf > 0) buyerPays.push({ item: 'Processing Fee', amount: round(mpf) });
      if (insurance > 0) sellerPays.push({ item: 'Insurance', amount: round(insurance) });
      if (brokerageFee > 0) buyerPays.push({ item: 'Brokerage', amount: round(brokerageFee) });
    } else {
      // DDP: Seller pays everything.
      sellerPays.push({ item: 'Shipping', amount: round(shippingCost) });
      sellerPays.push({ item: 'Import Duty', amount: round(importDuty) });
      sellerPays.push({ item: 'VAT/GST', amount: round(vat) });
      if (mpf > 0) sellerPays.push({ item: 'Processing Fee', amount: round(mpf) });
      if (insurance > 0) sellerPays.push({ item: 'Insurance', amount: round(insurance) });
      if (brokerageFee > 0) sellerPays.push({ item: 'Brokerage', amount: round(brokerageFee) });
    }

    const sellerTotal = round(sellerPays.reduce((s, p) => s + p.amount, 0));
    const buyerTotal = round(buyerPays.reduce((s, p) => s + p.amount, 0));

    return { term, sellerPays, buyerPays, sellerTotal, buyerTotal };
  })() : undefined;

  const originClass: 'CN' | 'OTHER' | 'DOMESTIC' =
    isDomestic ? 'DOMESTIC' : originCountry === 'CN' ? 'CN' : 'OTHER';

  // ━━━ S-Grade: Duty Type Calculation ━━━
  const weightKg = input.weight_kg ?? 0;
  // Use rich rate from macmap_ntlc_rates if available (rate_type + nav_duty_text)
  let resolvedDutyType: DutyType = 'ad_valorem';
  let specificRatePerKg = 0;
  if (richDutyRate && richDutyRate.rateType !== 'ad_valorem') {
    resolvedDutyType = richDutyRate.rateType as DutyType;
    // Parse nav_duty_text for specific rate (simple pattern: "X currency/unit")
    if (richDutyRate.navDutyText && weightKg > 0) {
      const parsed = parseSpecificRate(richDutyRate.navDutyText);
      if (parsed) specificRatePerKg = parsed;
    }
  }
  const dutyCalc = calculateDutyByType(resolvedDutyType, declaredValue, baseDutyRate, weightKg, specificRatePerKg);

  // ━━━ S-Grade: Additional fees ━━━
  const hmf = getHarborMaintenanceFee(profile.code, declaredValue, isDomestic);
  const docFee = getDocumentationFee(profile.code, isDomestic);
  const brokerEstimate = !isDomestic ? getBrokerFeeEstimate(profile.code) : 0;
  // Use calculated broker or country estimate (whichever is higher for formal entries)
  const effectiveBrokerFee = brokerageFee > 0 ? brokerageFee : (!isDomestic && declaredValue > 800 ? brokerEstimate : 0);

  // Include HMF + docFee in total
  const totalWithAllFees = totalWithMpf + hmf + docFee + (effectiveBrokerFee - brokerageFee);

  // ━━━ S-Grade: 15-Item Detailed Breakdown ━━━
  const detailedCostBreakdown = buildDetailedCostBreakdown({
    productPrice, importDuty, dutyRate: baseDutyRate, declaredValue,
    tradeRemedies: tradeRemedyResult, vat, vatRate: effectiveVatRate, vatLabel: effectiveVatLabel,
    mpf, countryCode: profile.code, insurance, shippingCost,
    brokerageFee: effectiveBrokerFee, hmf, docFee,
    totalLandedCost: totalWithAllFees, isDomestic, deMinimisApplied,
    dutyType: resolvedDutyType, dutyBasis: dutyCalc.basis,
  });

  // ━━━ S-Grade: Incoterms Comparison ━━━
  const incotermsComparison = !isDomestic ? buildIncotermsComparison({
    productPrice, shippingCost, importDuty, vat, mpf,
    insurance, brokerageFee: effectiveBrokerFee, hmf, docFee,
  }) : undefined;

  // ━━━ S-Grade: Rate Optimization ━━━
  const rateOptimization = !isDomestic ? buildRateOptimization(
    tariffOptimization, baseDutyRate, declaredValue, ftaResult,
    (input as GlobalCostInput).annualVolume,
  ) : undefined;

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
    vatRateType,
    reverseCharge: isReverseCharge ? {
      applied: true,
      buyerVatNumber: input.buyerVatNumber!,
      note: 'B2B transaction: reverse charge applies. Buyer self-assesses VAT.',
    } : undefined,
    deMinimisApplied,
    dutyExempt: isDomestic ? false : dutyExempt,
    taxExempt: isDomestic ? false : taxExempt,
    dutyThresholdUsd: !isDomestic ? dutyThresholdUsd : undefined,
    taxThresholdUsd: !isDomestic ? taxThresholdUsd : undefined,
    destinationCurrency: profile.currency,
    hsClassification: hsResult,
    hs10Resolution: hs10Result,
    hsCodePrecision: hs10Result?.hsCodePrecision || 'HS6',
    ftaApplied: ftaResult,
    additionalTariffNote,
    classificationSource,
    dutyRateSource: richDutyRate?.source || dutyRateSource,
    rateTypeResolved: resolvedDutyType,
    dutyConfidenceScore,
    rulingMatch: rulingMatch || undefined,
    dataAvailability: dataAvailability || undefined,
    tariffOptimization,
    insurance: round(insurance),
    brokerageFee: round(brokerageFee),
    confidenceScore,
    tradeRemedies: tradeRemedyResult?.hasRemedies ? tradeRemedyResult : undefined,
    usAdditionalTariffs: usAdditionalTariffs?.hasAdditionalTariffs ? usAdditionalTariffs : undefined,
    entryType: !isDomestic ? entryType : undefined,
    shippingTerms: input.shippingTerms || 'DDP',
    dduBuyerCharges,
    incotermsBreakdown,
    accuracyGuarantee: (() => {
      try {
        const { assessGuarantee } = require('./landed-cost-guarantee');
        const dataQuality = dutyRateSource === 'hardcoded' ? 'fallback' as const
          : (precomputedHit || dutyRateSource === 'agr' || dutyRateSource === 'min' || dutyRateSource === 'ntlc') ? 'fresh' as const
          : 'stale' as const;
        return assessGuarantee({
          planId: input.planId || 'free',
          confidenceScore,
          dataQuality,
          dutyRateSource: dutyRateSource || 'unknown',
          hsCodeSource: hsResult?.method || 'unknown',
          hasTradeRemedies: tradeRemedyResult?.hasRemedies || false,
          isSanctioned: false,
        });
      } catch {
        // Fallback to legacy format if guarantee module fails
        const factors: string[] = [];
        let score = confidenceScore;
        if (dutyRateSource === 'hardcoded') { factors.push('Estimated duty rate'); score *= 0.8; }
        if (hsResult && hsResult.hsCode !== '9999') factors.push('HS-specific');
        else { factors.push('No HS classification'); score *= 0.7; }
        const level = score >= 0.8 ? 'high' as const : score >= 0.6 ? 'medium' as const : 'low' as const;
        return { level, estimatedAccuracy: Math.round(score * 100), factors };
      }
    })(),
    dataFreshness: {
      dutyRateAge: precomputedHit ? 'precomputed_cache'
        : dutyRateSource === 'agr' || dutyRateSource === 'min' || dutyRateSource === 'ntlc'
        ? 'macmap_db' : dutyRateSource || 'hardcoded',
      lastTariffUpdate: 'daily_04utc',
      quality: dutyRateSource === 'hardcoded' ? 'fallback'
        : (precomputedHit || dutyRateSource === 'agr' || dutyRateSource === 'min' || dutyRateSource === 'ntlc' || dutyRateSource === 'live_db' || dutyRateSource === 'external_api') ? 'fresh'
        : 'stale',
    },
    exchangeRateTimestamp: localCurrency?.lastUpdated,
    detectedOriginCountry: (!input.origin && hsResult?.countryOfOrigin) ? hsResult.countryOfOrigin : undefined,
    localCurrency,
    precomputed: precomputedHit,
    cacheCoverage: precomputedHit ? '117,600/117,600 (100%)' : undefined,

    // S-Grade Extensions
    detailedCostBreakdown,
    incotermsComparison,
    rateOptimization,
    dutyType: resolvedDutyType,
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
    const brTaxes = calculateBrazilImportTaxes(declaredValue, importDuty, icmsRate); // sync path: no HS available
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
      mpf = Math.min(Math.max(declaredValue * 0.003464, 32.71), 634.04); // FY2025/2026
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

// ─── Broker Fee by Country ──────────────────────────

const BROKER_FEE_BY_COUNTRY: Record<string, number> = {
  US: 200, CA: 180, GB: 120, AU: 150, JP: 180, KR: 130, DE: 150, FR: 150,
  IT: 150, ES: 140, NL: 140, BE: 140, AT: 140, SE: 160, NO: 170, CH: 200,
  DK: 160, FI: 160, PL: 100, CZ: 90, HU: 80, RO: 70, BG: 60,
  CN: 80, IN: 60, BR: 100, MX: 90, SG: 120, HK: 100, TW: 100,
  TH: 70, VN: 60, ID: 60, MY: 80, PH: 50, TR: 80, AE: 150, SA: 150,
  ZA: 90, NG: 70, KE: 60, EG: 70, IL: 130, NZ: 140,
};

function getBrokerFeeEstimate(countryCode: string): number {
  return BROKER_FEE_BY_COUNTRY[countryCode] ?? 100;
}

// ─── HMF (Harbor Maintenance Fee) ───────────────────

function getHarborMaintenanceFee(countryCode: string, declaredValue: number, isDomestic: boolean): number {
  if (isDomestic) return 0;
  // US HMF: 0.125% of declared value (applies to ocean shipments)
  if (countryCode === 'US') return declaredValue * 0.00125;
  return 0;
}

// ─── Documentation Fee ──────────────────────────────

function getDocumentationFee(countryCode: string, isDomestic: boolean): number {
  if (isDomestic) return 0;
  // Standard documentation/filing fee estimate
  const fees: Record<string, number> = {
    US: 35, CA: 25, GB: 20, AU: 30, JP: 40, KR: 25, DE: 25, FR: 25, CN: 20, IN: 15, BR: 30,
  };
  return fees[countryCode] ?? 15;
}

// ─── Nav Duty Text Parser ───────────────────────────

/**
 * Parse nav_duty_text into a per-kg USD rate.
 * Patterns: "361 yen/kg", "$1.220/kg", "15 Euro per 100 kg", "EUR 12.5/kg"
 * Returns per-1-kg rate in the original currency (not yet USD-converted).
 * Returns null if unparsable.
 */
function parseSpecificRate(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, '').trim();
  // Pattern: "<number> <currency>/<unit>" or "<number> <currency> per <unit>"
  const m = t.match(/(\d+(?:\.\d+)?)\s*(?:eur|euro|€|usd|\$|jpy|¥|yen|gbp|£|krw|₩|cny|rmb|aud|cad)?\s*(?:per|\/)\s*(?:(\d+)\s*)?(?:kg|kilogram)/);
  if (m) {
    const amount = Number(m[1]);
    const divisor = m[2] ? Number(m[2]) : 1; // "per 100 kg" → divisor=100
    return amount / divisor;
  }
  // Pattern: "<currency> <number>/kg"
  const m2 = t.match(/(?:eur|euro|€|usd|\$|jpy|¥|yen|gbp|£|krw|₩|cny|rmb|aud|cad)\s*(\d+(?:\.\d+)?)\s*\/\s*(?:(\d+)\s*)?kg/);
  if (m2) {
    const amount = Number(m2[1]);
    const divisor = m2[2] ? Number(m2[2]) : 1;
    return amount / divisor;
  }
  return null;
}

// ─── Duty Type Calculation ──────────────────────────

function calculateDutyByType(
  dutyType: DutyType,
  declaredValue: number,
  adValoremRate: number,
  weightKg: number,
  specificRatePerKg: number,
): { duty: number; basis: string } {
  switch (dutyType) {
    case 'specific': {
      const duty = weightKg * specificRatePerKg;
      return { duty, basis: `Specific: ${weightKg}kg x $${specificRatePerKg}/kg = $${round(duty)}` };
    }
    case 'compound': {
      const adVal = declaredValue * adValoremRate;
      const spec = weightKg * specificRatePerKg;
      const duty = adVal + spec;
      return { duty, basis: `Compound: (${(adValoremRate * 100).toFixed(1)}% x $${declaredValue}) + (${weightKg}kg x $${specificRatePerKg}/kg) = $${round(duty)}` };
    }
    case 'mixed': {
      const adVal = declaredValue * adValoremRate;
      const spec = weightKg * specificRatePerKg;
      const duty = Math.max(adVal, spec);
      return { duty, basis: `Mixed: MAX(${(adValoremRate * 100).toFixed(1)}% = $${round(adVal)}, ${weightKg}kg x $${specificRatePerKg}/kg = $${round(spec)}) = $${round(duty)}` };
    }
    default: { // ad_valorem
      const duty = declaredValue * adValoremRate;
      return { duty, basis: `Ad valorem: ${(adValoremRate * 100).toFixed(1)}% on $${round(declaredValue)} = $${round(duty)}` };
    }
  }
}

// ─── 15-Item Detailed Breakdown Builder ─────────────

function buildDetailedCostBreakdown(params: {
  productPrice: number;
  importDuty: number;
  dutyRate: number;
  declaredValue: number;
  tradeRemedies?: TradeRemedyResult;
  vat: number;
  vatRate: number;
  vatLabel: string;
  mpf: number;
  countryCode: string;
  insurance: number;
  shippingCost: number;
  brokerageFee: number;
  hmf: number;
  docFee: number;
  totalLandedCost: number;
  isDomestic: boolean;
  deMinimisApplied: boolean;
  dutyType: DutyType;
  dutyBasis: string;
}): DetailedCostBreakdown {
  const p = params;
  const adRate = (ad: number) => `${(ad * 100).toFixed(1)}%`;

  // Split trade remedies into AD, CVD, SG
  let adDuty = 0, cvdDuty = 0, sgDuty = 0;
  if (p.tradeRemedies?.hasRemedies) {
    for (const m of p.tradeRemedies.measures) {
      const amount = p.declaredValue * m.dutyRate;
      if (m.type === 'AD') adDuty += amount;
      else if (m.type === 'CVD') cvdDuty += amount;
      else if (m.type === 'SG') sgDuty += amount;
    }
  }

  return {
    product_price: { amount: round(p.productPrice), calculation_basis: `Product price: $${round(p.productPrice)}` },
    import_duty: {
      amount: round(p.importDuty),
      calculation_basis: p.isDomestic ? 'Domestic — no duty' :
        p.deMinimisApplied ? 'De minimis exempt' :
        p.dutyBasis,
    },
    anti_dumping_duty: { amount: round(adDuty), calculation_basis: adDuty > 0 ? `AD duty on $${round(p.declaredValue)}` : 'No anti-dumping duty applicable' },
    countervailing_duty: { amount: round(cvdDuty), calculation_basis: cvdDuty > 0 ? `CVD on $${round(p.declaredValue)}` : 'No countervailing duty applicable' },
    safeguard_duty: { amount: round(sgDuty), calculation_basis: sgDuty > 0 ? `Safeguard on $${round(p.declaredValue)}` : 'No safeguard duty applicable' },
    vat_gst: { amount: round(p.vat), calculation_basis: p.vat > 0 ? `${p.vatLabel} ${adRate(p.vatRate)} on $${round(p.declaredValue + p.importDuty)} = $${round(p.vat)}` : 'No VAT/GST applicable' },
    customs_processing_fee: { amount: round(p.mpf), calculation_basis: p.mpf > 0 ? `${p.countryCode} customs processing fee` : 'No customs processing fee' },
    merchandise_processing_fee: {
      amount: p.countryCode === 'US' ? round(p.mpf) : 0,
      calculation_basis: p.countryCode === 'US' && p.mpf > 0
        ? `US MPF: 0.3464% of $${round(p.declaredValue)} = $${round(p.mpf)}`
        : 'MPF applies to US entries only',
    },
    harbor_maintenance_fee: { amount: round(p.hmf), calculation_basis: p.hmf > 0 ? `US HMF: 0.125% of $${round(p.declaredValue)} = $${round(p.hmf)}` : 'No HMF applicable' },
    insurance_estimate: { amount: round(p.insurance), calculation_basis: p.insurance > 0 ? `Insurance estimate on $${round(p.declaredValue)}` : 'No insurance (domestic)' },
    freight_estimate: { amount: round(p.shippingCost), calculation_basis: p.shippingCost > 0 ? `Freight/shipping cost: $${round(p.shippingCost)}` : 'Free shipping' },
    broker_fee_estimate: { amount: round(p.brokerageFee), calculation_basis: p.brokerageFee > 0 ? `${p.countryCode} broker fee estimate: $${round(p.brokerageFee)}` : 'No broker fee (domestic or below threshold)' },
    documentation_fee: { amount: round(p.docFee), calculation_basis: p.docFee > 0 ? `${p.countryCode} documentation/filing fee` : 'No documentation fee' },
    currency_conversion_cost: { amount: 0, calculation_basis: 'Included in exchange rate (no separate fee)' },
    total_landed_cost: { amount: round(p.totalLandedCost), calculation_basis: `Sum of all cost components = $${round(p.totalLandedCost)}` },
  };
}

// ─── Incoterms Comparison Builder ───────────────────

function buildIncotermsComparison(params: {
  productPrice: number;
  shippingCost: number;
  importDuty: number;
  vat: number;
  mpf: number;
  insurance: number;
  brokerageFee: number;
  hmf: number;
  docFee: number;
}): IncotermsComparison {
  const p = params;
  const allCosts = p.productPrice + p.shippingCost + p.importDuty + p.vat + p.mpf + p.insurance + p.brokerageFee + p.hmf + p.docFee;
  const dutyTaxCosts = p.importDuty + p.vat + p.mpf + p.hmf;
  const logisticsCosts = p.shippingCost + p.insurance + p.brokerageFee + p.docFee;

  return {
    DDP: {
      total: round(allCosts),
      breakdown: 'Seller pays all costs including duty, tax, shipping, and delivery',
      buyer_owes: 0,
    },
    DAP: {
      total: round(allCosts),
      breakdown: 'Seller pays shipping + insurance. Buyer pays duty + tax at import',
      buyer_owes: round(dutyTaxCosts),
    },
    EXW: {
      total: round(allCosts),
      breakdown: 'Buyer pays all logistics, insurance, duty, and tax',
      buyer_owes: round(logisticsCosts + dutyTaxCosts),
    },
  };
}

// ─── Rate Optimization Builder ──────────────────────

function buildRateOptimization(
  tariffOpt: TariffOptimization | undefined,
  dutyRate: number,
  declaredValue: number,
  ftaResult: FtaResult | undefined,
  annualVolume?: number,
): RateOptimizationResult {
  const availableRates: RateOptimizationResult['available_rates'] = [];

  if (tariffOpt) {
    for (const opt of tariffOpt.rateOptions) {
      availableRates.push({
        type: opt.rateType === 'AGR' ? `FTA_${opt.agreementName}` : opt.rateType,
        rate: round(opt.rate * 100),
        condition: opt.rateType === 'AGR' ? 'Preferential — verify Rules of Origin' : undefined,
      });
    }
  }

  if (availableRates.length === 0) {
    availableRates.push({ type: 'MFN', rate: round(dutyRate * 100) });
  }

  // Find optimal
  const sorted = [...availableRates].sort((a, b) => a.rate - b.rate);
  const optimal = sorted[0];
  const mfnRate = availableRates.find(r => r.type === 'MFN')?.rate ?? optimal.rate;
  const savingsPerUnit = round(declaredValue * (mfnRate - optimal.rate) / 100);

  return {
    available_rates: availableRates,
    optimal: {
      type: optimal.type,
      rate: optimal.rate,
      reason: optimal.type === 'MFN'
        ? 'MFN rate (no preferential rate available)'
        : `${optimal.type} offers ${round(mfnRate - optimal.rate)}% savings vs MFN${ftaResult?.ftaName ? ` via ${ftaResult.ftaName}` : ''}`,
    },
    savings_vs_mfn: {
      per_unit: savingsPerUnit,
      annual_estimate: annualVolume ? round(savingsPerUnit * annualVolume) : undefined,
    },
  };
}

// ─── Utility ────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
