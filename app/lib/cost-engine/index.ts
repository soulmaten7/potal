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

// Global multi-country calculator
export { calculateGlobalLandedCost, calculateGlobalBatchLandedCosts } from './GlobalCostEngine';
export type { GlobalLandedCost } from './GlobalCostEngine';

// Country data
export { getCountryProfile, getSupportedCountries, getCountriesByRegion, getCountryCount, COUNTRY_DATA } from './country-data';
export type { CountryTaxProfile } from './country-data';

// B2C adapters
export { toCostInput, toCostInputBatch } from './adapters';
