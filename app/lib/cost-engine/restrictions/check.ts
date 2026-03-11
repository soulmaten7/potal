/**
 * POTAL Restricted Items — Checker
 *
 * Checks if a product (by HS code) has import restrictions
 * for a given destination country.
 */

import { getAllRestrictions } from './rules';
import type { RestrictionCheckResult, MatchedRestriction } from './types';

/**
 * Check import restrictions for a given HS code and destination country.
 *
 * @param hsCode - HS code (2-10 digits)
 * @param destinationCountry - ISO 2-letter country code
 * @returns Restriction check result with matched rules
 */
export function checkRestrictions(
  hsCode: string,
  destinationCountry: string
): RestrictionCheckResult {
  const dest = destinationCountry.toUpperCase();
  const cleanHs = hsCode.replace(/\./g, '').trim();

  if (!cleanHs || cleanHs.length < 2) {
    return {
      hasRestrictions: false,
      isProhibited: false,
      isWatched: false,
      restrictions: [],
      restrictedCarriers: [],
      hsCode: cleanHs,
      destinationCountry: dest,
    };
  }

  const allRules = getAllRestrictions();
  const matched: MatchedRestriction[] = [];
  const carrierSet = new Set<string>();

  for (const rule of allRules) {
    // Check if HS code matches the rule prefix
    if (!cleanHs.startsWith(rule.hsPrefix)) continue;

    // Check country applicability
    if (rule.countries && rule.countries.length > 0) {
      if (!rule.countries.includes(dest)) continue;
    }

    // Check exemptions
    if (rule.exemptCountries && rule.exemptCountries.includes(dest)) continue;

    matched.push({
      severity: rule.severity,
      category: rule.category,
      description: rule.description,
      requiredDocuments: rule.requiredDocuments,
      carrierRestrictions: rule.carrierRestrictions,
    });

    // Collect carrier restrictions
    if (rule.carrierRestrictions) {
      rule.carrierRestrictions.forEach(c => carrierSet.add(c));
    }
  }

  // Sort: prohibited first, then restricted, watched, then warning
  const severityOrder: Record<string, number> = { prohibited: 0, restricted: 1, watched: 2, warning: 3 };
  matched.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return {
    hasRestrictions: matched.length > 0,
    isProhibited: matched.some(r => r.severity === 'prohibited'),
    isWatched: matched.some(r => r.severity === 'watched'),
    restrictions: matched,
    restrictedCarriers: [...carrierSet],
    hsCode: cleanHs,
    destinationCountry: dest,
  };
}
