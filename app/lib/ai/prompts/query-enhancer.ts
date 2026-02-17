/**
 * ══════════════════════════════════════════════════════════════
 * 🎯 QUERY ENHANCER — 플랫폼별 검색 쿼리 최적화
 * ══════════════════════════════════════════════════════════════
 *
 * 같은 상품이라도 플랫폼마다 검색이 다르게 동작함.
 * Amazon: 정확한 키워드 매칭, eBay: 넓은 검색, AliExpress: 키워드 많을수록 좋음.
 * 이 모듈이 각 플랫폼에 최적화된 쿼리를 생성.
 *
 * ✅ 수정 가이드:
 * - 특정 플랫폼 검색 품질이 낮을 때 → SYSTEM_PROMPT 해당 플랫폼 규칙 수정
 * - 새 리테일러 추가 → types.ts RetailerPlatform + 여기 규칙 추가
 * - 다른 파일 건드릴 필요 없음
 *
 * 비용: ~100 input tokens + ~120 output tokens ≈ $0.00009/call
 * ══════════════════════════════════════════════════════════════
 */

import { executePrompt } from '../engine';
import type {
  PromptModuleConfig,
  PromptResult,
  FewShotExample,
  QueryEnhancerInput,
  QueryEnhancerOutput,
  RetailerPlatform,
} from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CONFIG: PromptModuleConfig = {
  id: 'query-enhancer',
  version: '1.0.0',
  description: '플랫폼별 검색 쿼리 최적화 — 같은 상품, 다른 검색어',
  model: 'gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 400,
  timeoutMs: 2500,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYSTEM_PROMPT = `You are POTAL's Query Optimizer — you transform a single search query into platform-specific queries that maximize result quality on each retailer.

## PLATFORM SEARCH BEHAVIORS

### Amazon (amazon)
- Best with concise, specific keywords
- Supports implicit category filtering
- Good with brand + model + key attribute
- Example: "Sony noise cancelling headphones" → "Sony noise cancelling headphones"

### Walmart (walmart)
- Similar to Amazon but less precise matching
- Benefits from slightly broader terms
- Example: "Sony noise cancelling headphones" → "Sony noise cancelling headphones wireless"

### Best Buy (bestbuy)
- Strong with tech products and model numbers
- Keep model numbers intact
- Example: "Sony noise cancelling headphones" → "Sony noise cancelling headphones"

### eBay (ebay)
- Best with broader searches (cast wide net)
- Adding condition or "new" can help
- Example: "Sony noise cancelling headphones" → "Sony noise cancelling headphones new"

### Target (target)
- Good with lifestyle/generic terms
- Less technical, more consumer-friendly
- Example: "Sony noise cancelling headphones" → "noise cancelling wireless headphones"

### AliExpress (aliexpress)
- MORE keywords = BETTER results (Chinese search algorithm)
- Add descriptive words, use cases, materials
- Example: "Sony noise cancelling headphones" → "noise cancelling headphones wireless bluetooth over ear"

### Temu (temu)
- Similar to AliExpress — more descriptive is better
- Focus on product type + key features
- Example: "Sony noise cancelling headphones" → "noise cancelling headphones wireless bluetooth"

### Shein (shein)
- Fashion/lifestyle focused
- Style-oriented keywords work best
- Example: "women running shoes" → "women athletic running shoes breathable"

## RULES
1. NEVER remove the core product from the query
2. For specific models (PRODUCT_SPECIFIC), keep the model name INTACT on all platforms
3. For categories (PRODUCT_CATEGORY), adapt aggressiveness based on platform
4. Include user-specified attributes in ALL platform queries
5. Keep queries under 8 words per platform

## OUTPUT FORMAT (JSON only)
{
  "platformQueries": {
    "amazon": "...",
    "walmart": "...",
    "bestbuy": "...",
    "ebay": "...",
    "target": "...",
    "aliexpress": "...",
    "temu": "...",
    "shein": "..."
  }
}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEW-SHOT EXAMPLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    user: 'Query: "camping tent"\nIntent: PRODUCT_CATEGORY\nAttributes: []',
    assistant: JSON.stringify({
      platformQueries: {
        amazon: 'camping tent',
        walmart: 'camping tent outdoor',
        bestbuy: 'camping tent',
        ebay: 'camping tent new',
        target: 'camping tent outdoor',
        aliexpress: 'camping tent outdoor waterproof portable',
        temu: 'camping tent outdoor waterproof',
        shein: 'camping tent outdoor',
      },
    }),
  },
  {
    user: 'Query: "waterproof running shoes"\nIntent: PRODUCT_CATEGORY\nAttributes: ["waterproof"]',
    assistant: JSON.stringify({
      platformQueries: {
        amazon: 'waterproof running shoes',
        walmart: 'waterproof running shoes men',
        bestbuy: 'waterproof running shoes',
        ebay: 'waterproof running shoes new',
        target: 'waterproof running shoes athletic',
        aliexpress: 'waterproof running shoes breathable outdoor trail',
        temu: 'waterproof running shoes outdoor breathable',
        shein: 'waterproof running shoes athletic breathable',
      },
    }),
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD USER MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildUserMessage(input: QueryEnhancerInput): string {
  return `Query: "${input.query}"\nIntent: ${input.intent}\nAttributes: ${JSON.stringify(input.attributes)}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSE OUTPUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ALL_PLATFORMS: RetailerPlatform[] = [
  'amazon', 'walmart', 'bestbuy', 'ebay', 'target', 'aliexpress', 'temu', 'shein',
];

export function parseOutput(raw: string): QueryEnhancerOutput {
  const parsed = JSON.parse(raw);
  const pq = parsed.platformQueries ?? {};

  // 모든 플랫폼이 있는지 확인, 없으면 원본 쿼리로 채움
  const platformQueries = {} as Record<RetailerPlatform, string>;
  for (const p of ALL_PLATFORMS) {
    platformQueries[p] = typeof pq[p] === 'string' ? pq[p] : '';
  }

  return { platformQueries };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FALLBACK — 모든 플랫폼에 같은 쿼리 사용
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function fallback(input: QueryEnhancerInput): QueryEnhancerOutput {
  const platformQueries = {} as Record<RetailerPlatform, string>;
  for (const p of ALL_PLATFORMS) {
    platformQueries[p] = input.query;
  }
  return { platformQueries };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function enhanceQuery(
  input: QueryEnhancerInput,
): Promise<PromptResult<QueryEnhancerOutput>> {
  return executePrompt<QueryEnhancerOutput>({
    config: CONFIG,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: buildUserMessage(input),
    fewShot: FEW_SHOT_EXAMPLES,
    fallback: () => fallback(input),
    parseOutput,
  });
}
