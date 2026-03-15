/**
 * POTAL AI Classifier — Public API
 *
 * 3-Stage Classification Pipeline:
 *   ① Vector search (pgvector cosine > 0.85)
 *   ② Keyword matching (confidence > 0.6)
 *   ③ LLM fallback (Claude/Groq)
 */

export { classifyWithAi, classifyWithVision, getAiClassifierConfig } from './claude-classifier';
export type { AiClassifierConfig } from './claude-classifier';
export {
  classifyProductAsync,
  classifyWithOverrideAsync,
} from './ai-classifier-wrapper';
export {
  classifyWithVectorSearch,
  searchByVector,
  generateEmbedding,
  storeClassificationVector,
  storeClassificationVectorsBatch,
  getVectorSearchConfig,
} from './vector-search';
export type { VectorSearchResult, VectorSearchConfig } from './vector-search';
export { searchProductMappings, getMappingStats } from './product-mappings';
export { calculateConfidenceScore } from './confidence-score';
export type { ClassificationConfidenceScore, ConfidenceGrade, ConfidenceFactor } from './confidence-score';
export { recordClassificationAudit, queryClassificationAudit } from './audit-trail';
export { validateProductDescription } from './description-validator';
export type { DescriptionValidationResult, DescriptionIssue } from './description-validator';
export type { AuditTrailEntry, AuditTrailQuery, AuditTrailResponse } from './audit-trail';
export { buildReasoningChain, lookupRulingReference, buildMultiDimensionalConfidence, getChapterNote } from './explainability';
export type { } from './explainability';
