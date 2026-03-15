/**
 * POTAL HS Code System — Type Definitions
 *
 * Harmonized System (HS) codes are international standardized
 * numerical method of classifying traded products.
 *
 * Structure: XXXX.XX.XXXX
 * - First 2 digits: Chapter (e.g. 61 = Knitted apparel)
 * - First 4 digits: Heading (e.g. 6109 = T-shirts)
 * - First 6 digits: Subheading (international standard)
 * - 8-10 digits: Country-specific tariff line
 */

export interface HsCodeEntry {
  /** HS Code (4-6 digits) */
  code: string;
  /** Human-readable description */
  description: string;
  /** Chapter (first 2 digits) */
  chapter: string;
  /** Product category for matching */
  category: string;
  /** Keywords for text matching */
  keywords: string[];
}

export interface HsCodeDutyRate {
  /** HS Code (4-6 digits) */
  hsCode: string;
  /** Destination country ISO code */
  destinationCountry: string;
  /** Origin country ISO code (for FTA-specific rates) */
  originCountry?: string;
  /** MFN (Most Favored Nation) duty rate */
  mfnRate: number;
  /** FTA preferential rate (if applicable) */
  ftaRate?: number;
  /** Additional tariff (e.g. Section 301 for China→US) */
  additionalTariff?: number;
  /** Anti-dumping duty (if applicable) */
  antiDumpingRate?: number;
  /** Notes */
  notes?: string;
}

export interface HsClassificationResult {
  /** Best matching HS Code */
  hsCode: string;
  /** Description */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** How it was classified */
  method: 'keyword' | 'category' | 'ai' | 'manual';
  /** Alternative matches */
  alternatives?: { hsCode: string; description: string; confidence: number }[];
  /** AI-detected country of origin (ISO 2-letter code, e.g. "CN", "US", "DE") */
  countryOfOrigin?: string;
}

// ─── F001 Explainability ────────────────────────────

export interface ReasoningStep {
  step: 'lookup' | 'vector' | 'keyword' | 'chapter_note' | 'llm' | 'price_break' | 'cache' | 'manual';
  detail: string;
  confidence: number;
}

export interface RulingReference {
  ruling_id: string;
  ruling_date: string;
  summary: string;
  source: string;
}

// ─── F006 Multi-dimensional Confidence ──────────────

export interface MultiDimensionalConfidence {
  overall: number;
  semantic_match: number;
  keyword_overlap: number;
  category_certainty: number;
  price_consistency: number;
  review_recommended: boolean;
  review_required: boolean;
}
