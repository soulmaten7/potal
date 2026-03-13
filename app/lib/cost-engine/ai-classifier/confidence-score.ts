/**
 * POTAL F006 — Classification Confidence Score System
 *
 * Provides detailed confidence scoring for HS Code classifications.
 * Breaks down confidence into multiple factors with explanations.
 *
 * Confidence Grades:
 *   A (0.90-1.00) — Very High: DB cache hit, manual override, or high-confidence vector match
 *   B (0.75-0.89) — High: Strong keyword match or AI classification with good signals
 *   C (0.60-0.74) — Medium: Partial match, may need review
 *   D (0.40-0.59) — Low: Weak match, review recommended
 *   F (0.00-0.39) — Very Low: Fallback classification, manual review required
 */

import type { HsClassificationResult } from '../hs-code/types';

// ─── Types ──────────────────────────────────────────

export type ConfidenceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ConfidenceFactor {
  /** Factor name */
  name: string;
  /** Factor score (0-1) */
  score: number;
  /** Weight in overall calculation (0-1) */
  weight: number;
  /** Human-readable explanation */
  description: string;
}

export interface ClassificationConfidenceScore {
  /** Overall confidence score (0-1) */
  overall: number;
  /** Letter grade: A/B/C/D/F */
  grade: ConfidenceGrade;
  /** Grade label */
  gradeLabel: string;
  /** Individual scoring factors */
  factors: ConfidenceFactor[];
  /** Whether manual review is recommended */
  reviewRecommended: boolean;
  /** Actionable recommendation */
  recommendation: string;
}

// ─── Grade Mapping ──────────────────────────────────

function getGrade(score: number): ConfidenceGrade {
  if (score >= 0.90) return 'A';
  if (score >= 0.75) return 'B';
  if (score >= 0.60) return 'C';
  if (score >= 0.40) return 'D';
  return 'F';
}

const GRADE_LABELS: Record<ConfidenceGrade, string> = {
  A: 'Very High',
  B: 'High',
  C: 'Medium',
  D: 'Low',
  F: 'Very Low',
};

// ─── Confidence Calculator ──────────────────────────

/**
 * Calculate detailed confidence score for an HS classification result.
 *
 * Factors considered:
 * 1. Classification method reliability (cache/vector/keyword/ai/fallback)
 * 2. Base confidence from classifier
 * 3. HS code specificity (6-digit vs 4-digit vs generic)
 * 4. Alternative count (more alternatives = more ambiguity)
 * 5. Product name quality (longer/more descriptive = better)
 */
export function calculateConfidenceScore(
  result: HsClassificationResult & { classificationSource?: string },
  productName?: string,
): ClassificationConfidenceScore {
  const factors: ConfidenceFactor[] = [];

  // Factor 1: Classification method reliability
  const methodScores: Record<string, number> = {
    manual: 1.0,
    cache: 0.95,
    vector: 0.90,
    keyword: 0.75,
    ai: 0.85,
    keyword_fallback: 0.40,
  };
  const source = result.classificationSource || result.method;
  const methodScore = methodScores[source] ?? 0.50;
  factors.push({
    name: 'classification_method',
    score: methodScore,
    weight: 0.30,
    description: source === 'manual'
      ? 'Manually provided HS code — highest reliability'
      : source === 'cache'
        ? 'Cached result from previous successful classification'
        : source === 'vector'
          ? 'Vector similarity match against verified database'
          : source === 'keyword'
            ? 'Keyword-based classification with pattern matching'
            : source === 'ai'
              ? 'AI-powered classification with LLM analysis'
              : 'Fallback classification — low confidence',
  });

  // Factor 2: Base classifier confidence
  const baseConfidence = result.confidence;
  factors.push({
    name: 'classifier_confidence',
    score: baseConfidence,
    weight: 0.30,
    description: baseConfidence >= 0.9
      ? 'Classifier reports very high confidence in this match'
      : baseConfidence >= 0.7
        ? 'Classifier reports good confidence'
        : baseConfidence >= 0.5
          ? 'Classifier reports moderate confidence — some ambiguity'
          : 'Classifier reports low confidence — significant ambiguity',
  });

  // Factor 3: HS code specificity
  const hsCode = result.hsCode.replace(/\./g, '');
  const specificityScore = hsCode === '9999' ? 0.1
    : hsCode.length >= 6 ? 1.0
      : hsCode.length >= 4 ? 0.7
        : 0.4;
  factors.push({
    name: 'hs_code_specificity',
    score: specificityScore,
    weight: 0.15,
    description: hsCode === '9999'
      ? 'Generic fallback code — no specific classification found'
      : hsCode.length >= 6
        ? `Full 6-digit HS code (${result.hsCode}) — internationally standardized`
        : `${hsCode.length}-digit heading — less specific classification`,
  });

  // Factor 4: Alternative count (ambiguity indicator)
  const altCount = result.alternatives?.length ?? 0;
  const ambiguityScore = altCount === 0 ? 1.0
    : altCount <= 2 ? 0.85
      : altCount <= 4 ? 0.65
        : 0.45;
  factors.push({
    name: 'classification_ambiguity',
    score: ambiguityScore,
    weight: 0.15,
    description: altCount === 0
      ? 'No alternative classifications — clear match'
      : altCount <= 2
        ? `${altCount} alternative(s) considered — relatively clear`
        : `${altCount} alternatives — significant ambiguity between categories`,
  });

  // Factor 5: Product name quality
  let nameScore = 0.5; // default if no name
  if (productName) {
    const words = productName.trim().split(/\s+/).length;
    nameScore = words >= 5 ? 1.0
      : words >= 3 ? 0.85
        : words >= 2 ? 0.65
          : 0.40;
  }
  factors.push({
    name: 'input_quality',
    score: nameScore,
    weight: 0.10,
    description: !productName
      ? 'No product name provided — classification based on HS code only'
      : nameScore >= 0.85
        ? 'Descriptive product name provides strong classification signals'
        : 'Short product name — more detail would improve accuracy',
  });

  // Calculate weighted overall score
  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) * 100
  ) / 100;

  const grade = getGrade(overall);
  const reviewRecommended = grade === 'C' || grade === 'D' || grade === 'F';

  const recommendation = grade === 'A'
    ? 'Classification is highly reliable. No action needed.'
    : grade === 'B'
      ? 'Classification is reliable. Verify for high-value shipments.'
      : grade === 'C'
        ? 'Consider providing more product details or manually verifying the HS code.'
        : grade === 'D'
          ? 'Manual review recommended. Provide a more detailed product description.'
          : 'Classification unreliable. Please provide the correct HS code manually.';

  return {
    overall,
    grade,
    gradeLabel: GRADE_LABELS[grade],
    factors,
    reviewRecommended,
    recommendation,
  };
}
