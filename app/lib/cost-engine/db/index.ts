/**
 * POTAL Cost Engine DB Layer — Public API
 *
 * DB-backed tariff data with in-memory caching.
 * Falls back to hardcoded data if DB unavailable.
 */

// Country data
export { getCountryProfileFromDb, getSupportedCountriesFromDb, getCountryCountFromDb } from './country-data-db';

// Duty rates
export { getDutyRateFromDb, getEffectiveDutyRateFromDb, hasCountryDutyDataFromDb } from './duty-rates-db';

// FTA
export { findApplicableFtaFromDb, applyFtaRateFromDb } from './fta-db';

// Cache control
export { invalidateAllCaches, invalidateCache, getCacheStatus } from './tariff-cache';

// Types
export type { CachedCountryProfile, CachedDutyRate, CachedFtaAgreement, CachedAdditionalTariff } from './tariff-cache';
