/**
 * POTAL Cost Engine — Public API
 *
 * Standalone Total Landed Cost calculation module.
 * Used by: B2B REST API, AI Agent API, B2C frontend (via adapters)
 */

// Core calculator
export { calculateLandedCost, calculateBatchLandedCosts, parsePriceToNumber, zipcodeToState } from './CostEngine';

// Types
export type { CostInput, LandedCost, CostBreakdownItem } from './types';

// Constants (for API documentation / transparency)
export { CHINA_IMPORT_DUTY_RATE, MPF_INFORMAL, STATE_TAX_RATES } from './CostEngine';

// Global multi-country calculator (sync = hardcoded, async = DB-backed)
export { calculateGlobalLandedCost, calculateGlobalBatchLandedCosts } from './GlobalCostEngine';
export { calculateGlobalLandedCostAsync, calculateGlobalBatchLandedCostsAsync } from './GlobalCostEngine';
export type { GlobalLandedCost, GlobalCostInput } from './GlobalCostEngine';

// DB layer (cache control)
export { invalidateAllCaches, invalidateCache, getCacheStatus } from './db';

// Country data
export { getCountryProfile, getSupportedCountries, getCountriesByRegion, getCountryCount, COUNTRY_DATA } from './country-data';
export type { CountryTaxProfile } from './country-data';

// B2C adapters
export { toCostInput, toCostInputBatch } from './adapters';

// AI Classification (async, with DB caching)
export { classifyProductAsync, classifyWithOverrideAsync } from './ai-classifier';

// External Tariff API (with DB caching + circuit breaker)
export { fetchDutyRateWithFallback, invalidateAllLiveCache } from './tariff-api';
