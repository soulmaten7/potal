/**
 * F006: Confidence Score Calibration
 * Platt scaling, multi-dimensional confidence, routing.
 */

export interface ConfidenceBreakdown {
  overall: number;
  components: {
    hs6Match: number;
    hs10Selection: number;
    dataFreshness: number;
    historicalAccuracy: number;
  };
}

export interface ConfidenceThresholds {
  autoApprove: number;
  reviewRecommended: number;
  manualRequired: number;
}

export type ConfidenceRouting = 'auto' | 'review' | 'manual';

// Platt scaling parameters (calibrated offline)
const PLATT_A = -1.5;
const PLATT_B = 0.2;

export function calibrateConfidence(rawScore: number, stage: string, hsChapter?: string): number {
  // Platt sigmoid calibration
  let calibrated = 1 / (1 + Math.exp(PLATT_A * rawScore + PLATT_B));

  // Stage-based adjustment
  const stageBonus: Record<string, number> = {
    cache: 0.05,
    feedback: 0.08,
    vector: 0.0,
    keyword: -0.03,
    llm: -0.05,
  };
  calibrated += stageBonus[stage] || 0;

  // Certain HS chapters are harder to classify
  const hardChapters = new Set(['84', '85', '90', '38', '39']);
  if (hsChapter && hardChapters.has(hsChapter)) {
    calibrated *= 0.95;
  }

  return Math.max(0, Math.min(1, calibrated));
}

export function getConfidenceBreakdown(params: {
  matchScore: number;
  stage: string;
  hs10Available: boolean;
  dataAge?: number; // days since last update
  feedbackAgreement?: number;
}): ConfidenceBreakdown {
  const hs6Match = params.matchScore;
  const hs10Selection = params.hs10Available ? 0.9 : 0.5;
  const dataFreshness = params.dataAge !== undefined ? Math.max(0, 1 - params.dataAge / 365) : 0.8;
  const historicalAccuracy = params.feedbackAgreement ?? 0.85;

  const overall = hs6Match * 0.4 + hs10Selection * 0.2 + dataFreshness * 0.15 + historicalAccuracy * 0.25;

  return {
    overall: Math.round(overall * 1000) / 1000,
    components: {
      hs6Match: Math.round(hs6Match * 1000) / 1000,
      hs10Selection: Math.round(hs10Selection * 1000) / 1000,
      dataFreshness: Math.round(dataFreshness * 1000) / 1000,
      historicalAccuracy: Math.round(historicalAccuracy * 1000) / 1000,
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
