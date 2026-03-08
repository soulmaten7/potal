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
      restrictions: [],
      hsCode: cleanHs,
      destinationCountry: dest,
    };
  }

  const allRules = getAllRestrictions();
  const matched: MatchedRestriction[] = [];

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
    });
  }

  // Sort: prohibited first, then restricted, then warning
  const severityOrder = { prohibited: 0, restricted: 1, warning: 2 };
  matched.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    hasRestrictions: matched.length > 0,
    isProhibited: matched.some(r => r.severity === 'prohibited'),
    restrictions: matched,
    hsCode: cleanHs,
    destinationCountry: dest,
  };
}
