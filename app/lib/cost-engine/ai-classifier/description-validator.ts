/**
 * POTAL F013 — Poor Product Description Detection
 *
 * Flags product descriptions that are likely to cause customs issues:
 * - Too vague (e.g., "gift", "item", "stuff")
 * - Contains prohibited terms
 * - Missing required detail for the product type
 * - Potential misdeclaration indicators
 */

// ─── Types ──────────────────────────────────────────

export interface DescriptionIssue {
  /** Issue type */
  type: 'vague' | 'prohibited' | 'misdeclaration' | 'too_short' | 'generic' | 'missing_material' | 'missing_quantity_unit';
  /** Severity: 'error' = likely rejected, 'warning' = may cause delays */
  severity: 'error' | 'warning';
  /** Human-readable message */
  message: string;
  /** Suggestion to fix */
  suggestion?: string;
}

export interface DescriptionValidationResult {
  /** Whether the description passes validation */
  valid: boolean;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** List of issues found */
  issues: DescriptionIssue[];
  /** Overall score (0-100, higher = better) */
  qualityScore: number;
  /** Improved description suggestion (if issues found) */
  suggestedDescription?: string;
}

// ─── Patterns ───────────────────────────────────────

const VAGUE_TERMS = new Set([
  'gift', 'gifts', 'item', 'items', 'stuff', 'thing', 'things',
  'goods', 'merchandise', 'product', 'products', 'sample', 'samples',
  'package', 'parcel', 'box', 'personal effects', 'personal use',
  'made in china', 'no commercial value', 'not for resale',
  'various', 'miscellaneous', 'misc', 'assorted', 'mixed',
  'general merchandise', 'household goods', 'parts',
]);

const PROHIBITED_DECLARATION_TERMS = new Set([
  'no commercial value', 'free of charge', 'free sample',
  'no value', 'worthless', 'used clothing donation',
]);

const MISDECLARATION_INDICATORS = [
  { pattern: /value\s*[:=]?\s*\$?0/i, message: 'Zero-value declaration may be flagged as under-valuation' },
  { pattern: /consolidat/i, message: 'Consolidated shipments may require separate declarations per item' },
  { pattern: /re-?export/i, message: 'Re-export goods may need special documentation' },
];

const GENERIC_CATEGORY_WORDS = new Set([
  'accessories', 'supplies', 'equipment', 'materials', 'components',
  'hardware', 'tools', 'devices', 'appliances',
]);

// ─── Validator ──────────────────────────────────────

/**
 * Validate a product description for customs compliance.
 */
export function validateProductDescription(
  description: string,
  category?: string,
): DescriptionValidationResult {
  const issues: DescriptionIssue[] = [];
  const desc = description.trim();
  const descLower = desc.toLowerCase();
  const words = descLower.split(/\s+/);

  // Check minimum length
  if (desc.length < 3) {
    issues.push({
      type: 'too_short',
      severity: 'error',
      message: 'Description is too short. Customs requires specific product details.',
      suggestion: 'Provide a detailed description including: product type, material, and intended use.',
    });
  } else if (words.length < 2) {
    issues.push({
      type: 'too_short',
      severity: 'warning',
      message: 'Single-word descriptions often cause customs delays.',
      suggestion: 'Add material, size, or intended use details.',
    });
  }

  // Check for vague terms
  const foundVague = words.filter(w => VAGUE_TERMS.has(w));
  if (foundVague.length > 0 && words.length <= 3) {
    issues.push({
      type: 'vague',
      severity: 'error',
      message: `Vague term(s): "${foundVague.join(', ')}". Customs may reject or delay shipment.`,
      suggestion: 'Replace with specific product type, e.g., "cotton t-shirt" instead of "gift".',
    });
  }

  // Check for prohibited declaration terms
  for (const term of PROHIBITED_DECLARATION_TERMS) {
    if (descLower.includes(term)) {
      issues.push({
        type: 'prohibited',
        severity: 'error',
        message: `"${term}" is not acceptable for customs declaration. All goods must have a declared value.`,
        suggestion: 'Provide the actual commercial value and product description.',
      });
    }
  }

  // Check for misdeclaration indicators
  for (const indicator of MISDECLARATION_INDICATORS) {
    if (indicator.pattern.test(desc)) {
      issues.push({
        type: 'misdeclaration',
        severity: 'warning',
        message: indicator.message,
      });
    }
  }

  // Check for overly generic category words used alone
  if (words.length <= 2 && words.some(w => GENERIC_CATEGORY_WORDS.has(w))) {
    issues.push({
      type: 'generic',
      severity: 'warning',
      message: 'Description is too generic for accurate HS classification.',
      suggestion: 'Specify the type of product, e.g., "stainless steel kitchen tools" instead of "tools".',
    });
  }

  // Check for material specification (important for textiles, metals)
  const textileChapters = ['50','51','52','53','54','55','56','57','58','59','60','61','62','63'];
  const metalChapters = ['72','73','74','75','76','78','79','80','81'];
  if (category) {
    const ch = category.substring(0, 2);
    if (textileChapters.includes(ch) || metalChapters.includes(ch)) {
      const hasMaterial = /cotton|silk|wool|polyester|nylon|steel|iron|copper|aluminum|leather/i.test(desc);
      if (!hasMaterial) {
        issues.push({
          type: 'missing_material',
          severity: 'warning',
          message: 'Material composition is important for this product category but not specified.',
          suggestion: 'Add material details (e.g., "100% cotton", "stainless steel").',
        });
      }
    }
  }

  // Calculate quality score
  let qualityScore = 100;
  for (const issue of issues) {
    qualityScore -= issue.severity === 'error' ? 30 : 15;
  }
  // Bonus for longer, more descriptive text
  if (words.length >= 5) qualityScore = Math.min(100, qualityScore + 10);
  if (words.length >= 8) qualityScore = Math.min(100, qualityScore + 5);
  qualityScore = Math.max(0, qualityScore);

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  const riskLevel: DescriptionValidationResult['riskLevel'] =
    errorCount >= 2 ? 'critical'
      : errorCount >= 1 ? 'high'
        : warningCount >= 2 ? 'medium'
          : 'low';

  // Generate suggested description improvement
  let suggestedDescription: string | undefined;
  if (issues.length > 0 && words.length <= 3) {
    suggestedDescription = `[specific product type] made of [material], [size/dimensions], for [intended use]`;
  }

  return {
    valid: errorCount === 0,
    riskLevel,
    issues,
    qualityScore,
    suggestedDescription,
  };
}
