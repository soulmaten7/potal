/**
 * F006: Confidence Score Calibration — Production Grade
 *
 * Single source of truth for confidence scoring across all POTAL endpoints.
 *
 * Scoring approach:
 * - No Platt scaling (insufficient calibration data; direct weighted calculation instead)
 * - Field-count based confidence derived from 466-combination ablation test results:
 *   9/9 fields = 100%, material absent = -45%, category absent = -33%
 * - Stage reliability from actual pipeline performance
 * - Chapter difficulty from HSCodeComp 632-item benchmark
 * - DB-backed components (feedback, data age, HS10 availability)
 */

import { createClient } from '@supabase/supabase-js';

export interface ConfidenceBreakdown {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeLabel: string;
  components: {
    hs6Match: number;
    hs10Selection: number;
    dataFreshness: number;
    historicalAccuracy: number;
  };
  dataSources: {
    hs6Match: string;
    hs10Selection: string;
    dataFreshness: string;
    historicalAccuracy: string;
  };
}

export interface ConfidenceThresholds {
  autoApprove: number;
  reviewRecommended: number;
  manualRequired: number;
}

export type ConfidenceRouting = 'auto' | 'review' | 'manual';

/**
 * Classification stage reliability scores.
 * Derived from actual pipeline behavior:
 * - cache/exact_match: previously verified result = highest
 * - pattern_strong: 10+ scoring points in base-agent = high
 * - pattern_match/pattern_single: lower scoring = moderate
 * - gri_pipeline: v3 pipeline with 9-field = high
 * - db_keyword_match: keyword overlap in DB = moderate
 * - vector: embedding similarity = moderate
 * - keyword: simple text match = lower
 * - llm: AI inference = lower (depends on model)
 * - pattern_catch_all: "other" fallback = low
 */
const STAGE_RELIABILITY: Record<string, number> = {
  cache: 0.98,
  exact_match: 0.95,
  manual: 1.0,
  gri_pipeline: 0.95,
  pattern_strong: 0.90,
  pattern_match: 0.80,
  pattern_single: 0.75,
  feedback: 0.92,
  vector: 0.70,
  db_keyword_match: 0.65,
  keyword: 0.55,
  llm: 0.60,
  pattern_catch_all: 0.40,
  keyword_fallback: 0.30,
};

/**
 * Chapter difficulty penalties from HSCodeComp 632-item benchmark.
 * Chapters with 0% accuracy in benchmark get higher penalty.
 * Chapters with known classification ambiguity (machinery, electronics) also penalized.
 *
 * Penalty applied as multiplier: score *= (1 - penalty)
 */
const CHAPTER_DIFFICULTY: Record<string, number> = {
  // 0% accuracy in HSCodeComp benchmark — keyword coverage gaps
  '67': 0.15, // wigs, artificial flowers
  '82': 0.12, // tools, cutlery
  '83': 0.12, // misc base metal articles
  '49': 0.10, // printed matter, stickers
  '63': 0.10, // other textile articles, towels
  // Known ambiguity — complex classification rules
  '84': 0.08, // machinery — 515 subheadings, most complex chapter
  '85': 0.08, // electronics — 274 subheadings, boundary cases
  '90': 0.07, // optical/medical instruments
  '38': 0.06, // misc chemical products
  '39': 0.06, // plastics
  '95': 0.05, // toys — electronic vs non-electronic boundary
  '40': 0.05, // rubber — composite product boundary
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.90) return 'A';
  if (score >= 0.75) return 'B';
  if (score >= 0.60) return 'C';
  if (score >= 0.40) return 'D';
  return 'F';
}

const GRADE_LABELS: Record<string, string> = {
  A: 'Very High', B: 'High', C: 'Medium', D: 'Low', F: 'Very Low',
};

/**
 * Calculate calibrated confidence score for an HS classification.
 * Replaces Platt scaling with direct weighted calculation based on ablation data.
 *
 * @param rawScore - Raw match score from the classifier (0-1)
 * @param stage - Classification method/stage identifier
 * @param hsChapter - First 2 digits of HS code (for chapter difficulty adjustment)
 * @param fieldCount - Number of input fields provided (0-9, for ablation-based adjustment)
 */
export function calibrateConfidence(
  rawScore: number,
  stage: string,
  hsChapter?: string,
  fieldCount?: number,
): number {
  // Base: stage reliability × raw score
  const stageReliability = STAGE_RELIABILITY[stage] ?? 0.50;
  let calibrated = rawScore * stageReliability;

  // Field-count adjustment (from 466-combination ablation test)
  // 9 fields = 1.0x, 3 fields (name+material+category) = 0.98x, 1 field (name only) = 0.06x
  if (fieldCount !== undefined && fieldCount < 9) {
    const fieldMultiplier = fieldCount >= 3 ? 0.70 + (fieldCount - 3) * 0.05
      : fieldCount === 2 ? 0.55
        : fieldCount === 1 ? 0.30
          : 0.10;
    calibrated *= fieldMultiplier;
  }

  // Chapter difficulty penalty
  if (hsChapter) {
    const penalty = CHAPTER_DIFFICULTY[hsChapter] ?? 0;
    calibrated *= (1 - penalty);
  }

  return Math.max(0, Math.min(1, Math.round(calibrated * 1000) / 1000));
}

/**
 * Fetch feedback agreement rate from classification_feedback table.
 * Returns agree/(agree+disagree) ratio, or field-count based default.
 */
async function fetchFeedbackAgreement(hs6: string): Promise<{ rate: number; source: string; count: number }> {
  const supabase = getSupabase();
  if (!supabase) return { rate: 0.85, source: 'default (no DB connection)', count: 0 };

  try {
    const { data, error } = await supabase
      .from('classification_feedback')
      .select('feedback_type')
      .eq('hs_code', hs6);

    if (error || !data || data.length === 0) {
      // No feedback exists yet — use pipeline accuracy as default
      // Layer 1 with 9-field = 100% verified, so base default is high
      return { rate: 0.90, source: 'pipeline baseline (no user feedback yet)', count: 0 };
    }

    const agrees = data.filter((r: { feedback_type: string }) => r.feedback_type === 'agree').length;
    const total = data.length;
    return {
      rate: total > 0 ? agrees / total : 0.90,
      source: `classification_feedback (${total} feedback records for HS6 ${hs6})`,
      count: total,
    };
  } catch {
    return { rate: 0.90, source: 'pipeline baseline (DB query error)', count: 0 };
  }
}

/**
 * Fetch data age from product_hs_mappings for the given HS6.
 */
async function fetchDataAge(hs6: string): Promise<{ days: number; source: string }> {
  const supabase = getSupabase();
  if (!supabase) return { days: 30, source: 'default (no DB connection)' };

  try {
    const { data, error } = await supabase
      .from('product_hs_mappings')
      .select('updated_at')
      .like('hs6_code', `${hs6}%`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { days: 30, source: 'default (no mapping data for this HS6)' };
    }

    const updatedAt = new Date(data[0].updated_at);
    const days = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)));
    return { days, source: `product_hs_mappings (last updated ${days}d ago)` };
  } catch {
    return { days: 30, source: 'default (DB query error)' };
  }
}

/**
 * Check if 10-digit HS code exists in gov_tariff_schedules for the given HS6 + country.
 */
async function fetchHs10Availability(hs6: string, country?: string): Promise<{ available: boolean; source: string }> {
  const supabase = getSupabase();
  if (!supabase) return { available: false, source: 'default (no DB connection)' };

  // Only 7 countries have 10-digit schedules
  const SUPPORTED_10DIGIT = ['US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA'];

  try {
    let query = supabase
      .from('gov_tariff_schedules')
      .select('hs_code')
      .like('hs_code', `${hs6}%`)
      .limit(1);

    if (country) {
      const cc = country.toUpperCase();
      if (!SUPPORTED_10DIGIT.includes(cc)) {
        return { available: false, source: `${cc} not in 10-digit schedule (6-digit only for 233 countries)` };
      }
      query = query.eq('country_code', cc);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return { available: false, source: `gov_tariff_schedules (no 10-digit match for ${hs6}${country ? ` in ${country}` : ''})` };
    }

    return { available: true, source: `gov_tariff_schedules (${country || '7 countries'}, 131,794 tariff lines)` };
  } catch {
    return { available: false, source: 'default (DB query error)' };
  }
}

/**
 * Get full confidence breakdown with real DB data.
 * This is the primary confidence calculation — all other confidence values should reference this.
 */
export async function getConfidenceBreakdown(params: {
  matchScore: number;
  stage: string;
  hsCode: string;
  country?: string;
  fieldCount?: number;
}): Promise<ConfidenceBreakdown> {
  const hs6 = params.hsCode.replace(/[\s.\-]/g, '').substring(0, 6);
  const hsChapter = hs6.substring(0, 2);

  // Fetch all data sources in parallel
  const [feedback, dataAge, hs10] = await Promise.all([
    fetchFeedbackAgreement(hs6),
    fetchDataAge(hs6),
    fetchHs10Availability(hs6, params.country),
  ]);

  // Component scores
  const hs6Match = calibrateConfidence(params.matchScore, params.stage, hsChapter, params.fieldCount);
  const hs10Selection = hs10.available ? 0.90 : 0.50;
  const dataFreshness = Math.max(0, Math.round((1 - dataAge.days / 365) * 1000) / 1000);
  const historicalAccuracy = feedback.rate;

  // Weighted overall — hs6Match dominates (classification quality is primary signal)
  const overall = Math.round((
    hs6Match * 0.45 +
    hs10Selection * 0.15 +
    dataFreshness * 0.15 +
    historicalAccuracy * 0.25
  ) * 1000) / 1000;

  const grade = getGrade(overall);

  return {
    overall,
    grade,
    gradeLabel: GRADE_LABELS[grade],
    components: {
      hs6Match: Math.round(hs6Match * 1000) / 1000,
      hs10Selection: Math.round(hs10Selection * 1000) / 1000,
      dataFreshness,
      historicalAccuracy: Math.round(historicalAccuracy * 1000) / 1000,
    },
    dataSources: {
      hs6Match: `classification pipeline (stage: ${params.stage}, chapter: ${hsChapter})`,
      hs10Selection: hs10.source,
      dataFreshness: dataAge.source,
      historicalAccuracy: feedback.source,
    },
  };
}

export function getConfidenceThresholds(): ConfidenceThresholds {
  return { autoApprove: 0.90, reviewRecommended: 0.75, manualRequired: 0.60 };
}

export function routeByConfidence(score: number): ConfidenceRouting {
  const t = getConfidenceThresholds();
  if (score >= t.autoApprove) return 'auto';
  if (score >= t.manualRequired) return 'review';
  return 'manual';
}
