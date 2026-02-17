/**
 * ══════════════════════════════════════════════════════════════
 * POTAL AI Prompt Registry
 * ══════════════════════════════════════════════════════════════
 *
 * 모든 프롬프트 모듈을 하나의 진입점으로 통합.
 *
 * 사용법:
 *   import { classifyIntent, generateSmartFilters, enhanceQuery, judgeProducts } from '@/app/lib/ai/prompts';
 *
 * 각 모듈은 독립적:
 *   - intent-router.ts  → classifyIntent()
 *   - smart-filter.ts   → generateSmartFilters()
 *   - query-enhancer.ts → enhanceQuery()
 *   - product-judge.ts  → judgeProducts()
 * ══════════════════════════════════════════════════════════════
 */

// 🧠 Intent Router — 쿼리 의도 분류
export { classifyIntent } from './intent-router';
export {
  CONFIG as INTENT_ROUTER_CONFIG,
  SYSTEM_PROMPT as INTENT_ROUTER_PROMPT,
} from './intent-router';

// 🔍 Smart Filter — AI 스마트 필터 제안
export { generateSmartFilters } from './smart-filter';
export {
  CONFIG as SMART_FILTER_CONFIG,
  SYSTEM_PROMPT as SMART_FILTER_PROMPT,
} from './smart-filter';

// 🎯 Query Enhancer — 플랫폼별 쿼리 최적화
export { enhanceQuery } from './query-enhancer';
export {
  CONFIG as QUERY_ENHANCER_CONFIG,
  SYSTEM_PROMPT as QUERY_ENHANCER_PROMPT,
} from './query-enhancer';

// ⚖️ Product Judge — 상품 관련성 판단
export { judgeProducts } from './product-judge';
export {
  CONFIG as PRODUCT_JUDGE_CONFIG,
  SYSTEM_PROMPT as PRODUCT_JUDGE_PROMPT,
} from './product-judge';

// Types (re-export for convenience)
export type {
  IntentRouterInput,
  IntentRouterOutput,
  SmartFilterInput,
  SmartFilterOutput,
  QueryEnhancerInput,
  QueryEnhancerOutput,
  ProductJudgeInput,
  ProductJudgeOutput,
  QueryIntent,
  PromptResult,
} from '../types';
