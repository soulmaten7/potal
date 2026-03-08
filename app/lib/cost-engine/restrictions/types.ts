/**
 * POTAL Restricted Items — Type Definitions
 */

export type RestrictionSeverity = 'prohibited' | 'restricted' | 'warning';

export interface Restriction {
  /** Severity: prohibited (cannot import), restricted (needs permit/license), warning (info only) */
  severity: RestrictionSeverity;
  /** HS Code prefix that triggers this restriction (2-6 digits) */
  hsPrefix: string;
  /** Human-readable category (e.g. "Firearms", "Pharmaceuticals") */
  category: string;
  /** Description of the restriction */
  description: string;
  /** Required documents or permits */
  requiredDocuments?: string[];
  /** Applicable countries (empty = all countries) */
  countries?: string[];
  /** Countries exempt from this restriction */
  exemptCountries?: string[];
}

export interface RestrictionCheckResult {
  /** Whether any restrictions were found */
  hasRestrictions: boolean;
  /** Whether import is completely prohibited */
  isProhibited: boolean;
  /** List of matched restrictions */
  restrictions: MatchedRestriction[];
  /** HS code checked */
  hsCode: string;
  /** Destination country */
  destinationCountry: string;
}

export interface MatchedRestriction {
  severity: RestrictionSeverity;
  category: string;
  description: string;
  requiredDocuments?: string[];
}
