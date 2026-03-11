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
export { findApplicableFta, applyFtaRate, getCountryFtas, getRulesOfOrigin } from './fta';
export type { RoOResult, RoOCriterion, RuleOfOrigin } from './fta';

// HS 10-digit Expansion
export { expandHsCode, getBestHs10, collectHs10Data } from './hs10-expander';
export type { Hs10Variant, Hs10ExpansionResult } from './hs10-expander';

// Types
export type { HsCodeEntry, HsCodeDutyRate, HsClassificationResult } from './types';
export type { FtaResult } from './fta';
