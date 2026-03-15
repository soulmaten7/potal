/**
 * F001: Classification Explainability
 * Provides detailed reasoning for HS code classification decisions.
 */

export interface ClassificationExplanation {
  stageMatched: 'cache' | 'vector' | 'keyword' | 'llm' | 'feedback';
  matchScore: number;
  reasoning: string;
  alternativeCodes: Array<{ hs6: string; score: number; reason: string }>;
  confidenceBreakdown: {
    cacheConfidence: number;
    vectorSimilarity: number;
    keywordMatchCount: number;
    feedbackAgreement: number;
  };
  processingTimeMs: number;
}

export interface ExplainableClassificationResult {
  hs6: string;
  hs10?: string;
  confidence: number;
  description?: string;
  explanation: ClassificationExplanation;
}

export function buildExplanation(params: {
  stage: ClassificationExplanation['stageMatched'];
  score: number;
  hs6: string;
  description?: string;
  alternatives?: Array<{ hs6: string; score: number; reason: string }>;
  cacheHit?: boolean;
  vectorScore?: number;
  keywordCount?: number;
  startTime: number;
}): ClassificationExplanation {
  const stageReasons: Record<string, string> = {
    cache: `Exact match found in product→HS mapping cache with confidence ${params.score.toFixed(2)}`,
    vector: `Vector similarity search matched with score ${params.vectorScore?.toFixed(3) || params.score.toFixed(3)}`,
    keyword: `Keyword-based matching found ${params.keywordCount || 0} matching terms`,
    llm: `AI model classified based on product description analysis`,
    feedback: `User feedback correction applied — verified classification`,
  };

  return {
    stageMatched: params.stage,
    matchScore: params.score,
    reasoning: stageReasons[params.stage] || `Classified at ${params.stage} stage`,
    alternativeCodes: params.alternatives || [],
    confidenceBreakdown: {
      cacheConfidence: params.cacheHit ? params.score : 0,
      vectorSimilarity: params.vectorScore || 0,
      keywordMatchCount: params.keywordCount || 0,
      feedbackAgreement: params.stage === 'feedback' ? 1.0 : 0,
    },
    processingTimeMs: Date.now() - params.startTime,
  };
}
