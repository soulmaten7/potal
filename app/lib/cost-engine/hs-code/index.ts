/**
 * POTAL HS Code System — Public API
 */

// Classifier
export { classifyProduct, classifyWithOverride } from './classifier';

// Database
export { HS_DATABASE, getHsEntry, getChapterEntries, getCategoryEntries } from './hs-database';

// Duty Rates
export { getDutyRate, getEffectiveDutyRate, hasCountryDutyData, isEuMember } from './duty-rates';

// FTA
export { findApplicableFta, applyFtaRate, getCountryFtas } from './fta';

// Types
export type { HsCodeEntry, HsCodeDutyRate, HsClassificationResult } from './types';
export type { FtaResult } from './fta';
