/**
 * F006: Confidence Score Calibration
 * Platt scaling, multi-dimensional confidence, routing.
 *
 * Data sources:
 * - matchScore: from classification pipeline result (cache=1.0, keyword=ratio, llm=returned confidence)
 * - feedbackAgreement: from classification_feedback table (agree/disagree ratio per HS6)
 * - dataAge: from product_hs_mappings.updated_at (days since last update)
 * - hs10Available: from gov_tariff_schedules (actual 10-digit existence for HS6+country)
 */

import { createClient } from '@supabase/supabase-js';

export interface ConfidenceBreakdown {
  overall: number;
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

// Platt scaling parameters (calibrated offline)
// TODO: Re-calibrate after 1,000-item benchmark with ground truth
const PLATT_A = -1.5;
const PLATT_B = 0.2;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function calibrateConfidence(rawScore: number, stage: string, hsChapter?: string): number {
  // Platt sigmoid calibration
  let calibrated = 1 / (1 + Math.exp(PLATT_A * rawScore + PLATT_B));

  // Stage-based adjustment
  const stageBonus: Record<string, number> = {
    cache: 0.05,
    feedback: 0.08,
    pattern_strong: 0.04,
    pattern_match: 0.02,
    pattern_single: 0.01,
    pattern_catch_all: -0.03,
    vector: 0.0,
    keyword: -0.03,
    llm: -0.05,
    db_keyword_match: -0.02,
    exact_match: 0.03,
  };
  calibrated += stageBonus[stage] || 0;

  // Certain HS chapters are harder to classify
  const hardChapters = new Set(['84', '85', '90', '38', '39']);
  if (hsChapter && hardChapters.has(hsChapter)) {
    calibrated *= 0.95;
  }

  return Math.max(0, Math.min(1, calibrated));
}

/**
 * Fetch feedback agreement rate from classification_feedback table.
 * Returns agree/(agree+disagree) ratio for the given HS6, or default if no data.
 */
async function fetchFeedbackAgreement(hs6: string): Promise<{ rate: number; source: string }> {
  const supabase = getSupabase();
  if (!supabase) return { rate: 0.85, source: 'default (no DB)' };

  try {
    const { data, error } = await supabase
      .from('classification_feedback')
      .select('feedback_type')
      .eq('hs_code', hs6);

    if (error || !data || data.length === 0) {
      return { rate: 0.85, source: 'default (no feedback data)' };
    }

    const agrees = data.filter((r: { feedback_type: string }) => r.feedback_type === 'agree').length;
    const total = data.length;
    return { rate: total > 0 ? agrees / total : 0.85, source: `classification_feedback (${total} records)` };
  } catch {
    return { rate: 0.85, source: 'default (query error)' };
  }
}

/**
 * Fetch data age from product_hs_mappings for the given HS6.
 * Returns days since last update.
 */
async function fetchDataAge(hs6: string): Promise<{ days: number; source: string }> {
  const supabase = getSupabase();
  if (!supabase) return { days: 30, source: 'default (no DB)' };

  try {
    const { data, error } = await supabase
      .from('product_hs_mappings')
      .select('updated_at')
      .eq('hs6_code', hs6)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { days: 30, source: 'default (no mapping data)' };
    }

    const updatedAt = new Date(data[0].updated_at);
    const days = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    return { days, source: `product_hs_mappings (updated ${days}d ago)` };
  } catch {
    return { days: 30, source: 'default (query error)' };
  }
}

/**
 * Check if 10-digit HS code exists in gov_tariff_schedules for the given HS6 + country.
 */
async function fetchHs10Availability(hs6: string, country?: string): Promise<{ available: boolean; source: string }> {
  const supabase = getSupabase();
  if (!supabase) return { available: false, source: 'default (no DB)' };

  try {
    let query = supabase
      .from('gov_tariff_schedules')
      .select('hs_code')
      .like('hs_code', `${hs6}%`)
      .limit(1);

    if (country) {
      query = query.eq('country_code', country.toUpperCase());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return { available: false, source: `gov_tariff_schedules (no 10-digit for ${hs6}${country ? ` in ${country}` : ''})` };
    }

    return { available: true, source: `gov_tariff_schedules (${country || '7 countries'})` };
  } catch {
    return { available: false, source: 'default (query error)' };
  }
}

export async function getConfidenceBreakdown(params: {
  matchScore: number;
  stage: string;
  hsCode: string;
  country?: string;
}): Promise<ConfidenceBreakdown> {
  const hs6 = params.hsCode.replace(/[\s.\-]/g, '').substring(0, 6);

  // Fetch all data sources in parallel
  const [feedback, dataAge, hs10] = await Promise.all([
    fetchFeedbackAgreement(hs6),
    fetchDataAge(hs6),
    fetchHs10Availability(hs6, params.country),
  ]);

  const hs6Match = params.matchScore;
  const hs10Selection = hs10.available ? 0.9 : 0.5;
  const dataFreshness = Math.max(0, 1 - dataAge.days / 365);
  const historicalAccuracy = feedback.rate;

  const overall = hs6Match * 0.4 + hs10Selection * 0.2 + dataFreshness * 0.15 + historicalAccuracy * 0.25;

  return {
    overall: Math.round(overall * 1000) / 1000,
    components: {
      hs6Match: Math.round(hs6Match * 1000) / 1000,
      hs10Selection: Math.round(hs10Selection * 1000) / 1000,
      dataFreshness: Math.round(dataFreshness * 1000) / 1000,
      historicalAccuracy: Math.round(historicalAccuracy * 1000) / 1000,
    },
    dataSources: {
      hs6Match: `classification pipeline (stage: ${params.stage})`,
      hs10Selection: hs10.source,
      dataFreshness: dataAge.source,
      historicalAccuracy: feedback.source,
    },
  };
}

export function getConfidenceThresholds(): ConfidenceThresholds {
  return { autoApprove: 0.95, reviewRecommended: 0.80, manualRequired: 0.60 };
}

export function routeByConfidence(score: number): ConfidenceRouting {
  const t = getConfidenceThresholds();
  if (score >= t.autoApprove) return 'auto';
  if (score >= t.manualRequired) return 'review';
  return 'manual';
}
