/**
 * ══════════════════════════════════════════════════════════════
 * 🧠 INTENT ROUTER — POTAL의 두뇌
 * ══════════════════════════════════════════════════════════════
 *
 * 모든 쿼리가 가장 먼저 거치는 관문.
 * "사용자가 진짜 원하는 게 뭔지"를 AI가 판단.
 *
 * ✅ 수정 가이드:
 * - 의도 분류가 틀릴 때 → SYSTEM_PROMPT의 분류 규칙 수정
 * - 새로운 의도 추가 → types.ts의 QueryIntent + 여기 규칙 추가
 * - 분류 예시 추가 → FEW_SHOT_EXAMPLES에 추가
 * - 다른 파일 건드릴 필요 없음
 *
 * 비용: ~80 input tokens + ~60 output tokens ≈ $0.00005/call
 * ══════════════════════════════════════════════════════════════
 */

import { executePrompt } from '../engine';
import type {
  PromptModuleConfig,
  PromptResult,
  FewShotExample,
  IntentRouterInput,
  IntentRouterOutput,
  QueryIntent,
} from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG — 모델 설정 (독립적으로 조정 가능)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CONFIG: PromptModuleConfig = {
  id: 'intent-router',
  version: '1.0.0',
  description: '쿼리 의도 분류 — 모든 검색의 첫 단계',
  model: 'gpt-4o-mini',
  temperature: 0.1,  // 분류는 결정적이어야 함 (낮은 temperature)
  maxTokens: 350,
  timeoutMs: 2500,   // 검색 UX에 영향 → 빠르게
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT — 핵심 프롬프트 (여기만 수정하면 분류 로직 변경)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYSTEM_PROMPT = `You are POTAL's Query Intelligence Engine — the brain of a world-class multi-retailer shopping comparison platform.

Your single task: Analyze a shopping query and classify it into one of 5 intent types with structured metadata.

## INTENT TYPES (choose exactly ONE)

### PRODUCT_SPECIFIC
The user knows EXACTLY what product they want. Contains model numbers, specific product names, or SKU-level detail.
- "iPhone 15 Pro Max 256GB" ✅
- "Sony WH-1000XM5" ✅
- "LEGO Star Wars 75375" ✅
- "Nike Air Max 90 White Size 10" ✅
⚠️ "Sony headphones" is NOT specific — that's PRODUCT_CATEGORY

### PRODUCT_CATEGORY (most common, ~60% of queries)
The user wants a TYPE of product. They need to browse, filter, and compare.
- "camping tent" ✅
- "wireless earbuds" ✅
- "men's running shoes" ✅
- "gaming keyboard mechanical" ✅
- "Sony headphones" ✅ (brand + category, but no specific model)

### COMPARISON
The user wants to compare specific products or brands against each other.
- "AirPods Pro vs Sony WF-1000XM5" ✅
- "MacBook Air or Pro" ✅
- "Samsung S24 vs iPhone 15 which is better" ✅

### QUESTION
The user is exploring. They don't know what product they need yet. Help them narrow down.
- "what tent should I buy for camping?" ✅
- "best gifts for dad" ✅
- "what do I need for a home office?" ✅
- "recommend a good laptop for students" ✅

### PRICE_HUNT
The user's PRIMARY goal is finding the lowest/best price.
- "cheapest noise cancelling headphones" ✅
- "earbuds under $50" ✅
- "best deal on PS5" ✅
- "budget 4K TV" ✅

## OUTPUT FORMAT (JSON only, no explanation, no markdown)
{
  "intent": "PRODUCT_CATEGORY",
  "confidence": 0.92,
  "searchQuery": "camping tent",
  "attributes": ["waterproof"],
  "priceSignal": null,
  "suggestedCategories": null,
  "comparisonTargets": null
}

## CRITICAL RULES
1. searchQuery = CLEAN product terms only. Strip intent words ("best","cheapest","recommend"), strip question words ("what","which","should I buy").
   "best wireless earbuds for running" → searchQuery: "wireless earbuds running"
   "what camping tent should I buy?" → searchQuery: "camping tent"
2. attributes = specific product attributes found IN the query (color, size, material, feature). NOT intent words.
   "red Nike running shoes size 11" → attributes: ["red", "size 11"]
   "waterproof camping tent 4 person" → attributes: ["waterproof", "4 person"]
3. For QUESTION: provide suggestedCategories — 3-5 specific, searchable product types.
   "what do I need for camping?" → suggestedCategories: ["camping tent", "sleeping bag", "camping stove", "camping chair", "headlamp"]
4. For COMPARISON: provide comparisonTargets — the 2-3 items being compared.
5. For PRICE_HUNT: extract priceSignal. "under $50" → { type: "budget", maxPrice: 50 }
6. Default to PRODUCT_CATEGORY with lower confidence when ambiguous.`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEW-SHOT EXAMPLES — AI 학습용 예시 (추가/삭제 자유)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    user: 'camping tent',
    assistant: JSON.stringify({
      intent: 'PRODUCT_CATEGORY',
      confidence: 0.95,
      searchQuery: 'camping tent',
      attributes: [],
      priceSignal: null,
      suggestedCategories: null,
      comparisonTargets: null,
    }),
  },
  {
    user: 'iPhone 15 Pro Max 256GB black',
    assistant: JSON.stringify({
      intent: 'PRODUCT_SPECIFIC',
      confidence: 0.98,
      searchQuery: 'iPhone 15 Pro Max 256GB black',
      attributes: ['256GB', 'black'],
      priceSignal: null,
      suggestedCategories: null,
      comparisonTargets: null,
    }),
  },
  {
    user: 'what should I buy for my home office?',
    assistant: JSON.stringify({
      intent: 'QUESTION',
      confidence: 0.93,
      searchQuery: 'home office',
      attributes: [],
      priceSignal: null,
      suggestedCategories: ['standing desk', 'ergonomic chair', 'monitor', 'keyboard', 'desk lamp'],
      comparisonTargets: null,
    }),
  },
  {
    user: 'cheapest noise cancelling earbuds under $80',
    assistant: JSON.stringify({
      intent: 'PRICE_HUNT',
      confidence: 0.96,
      searchQuery: 'noise cancelling earbuds',
      attributes: ['noise cancelling'],
      priceSignal: { type: 'budget', maxPrice: 80 },
      suggestedCategories: null,
      comparisonTargets: null,
    }),
  },
  {
    user: 'AirPods Pro 2 vs Sony WF-1000XM5',
    assistant: JSON.stringify({
      intent: 'COMPARISON',
      confidence: 0.97,
      searchQuery: 'AirPods Pro 2 Sony WF-1000XM5',
      attributes: [],
      priceSignal: null,
      suggestedCategories: null,
      comparisonTargets: ['AirPods Pro 2', 'Sony WF-1000XM5'],
    }),
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD USER MESSAGE — 입력 데이터 포맷팅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildUserMessage(input: IntentRouterInput): string {
  return input.query;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSE OUTPUT — AI 응답 파싱 + 검증
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VALID_INTENTS: Set<string> = new Set([
  'PRODUCT_SPECIFIC', 'PRODUCT_CATEGORY', 'COMPARISON', 'QUESTION', 'PRICE_HUNT',
]);

export function parseOutput(raw: string): IntentRouterOutput {
  const parsed = JSON.parse(raw);

  // 검증: intent 필드가 유효한지
  if (!parsed.intent || !VALID_INTENTS.has(parsed.intent)) {
    throw new Error(`Invalid intent: ${parsed.intent}`);
  }

  // Confidence clamping: always 0-1 range
  const rawConf = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
  const confidence = Math.max(0, Math.min(1, rawConf));

  return {
    intent: parsed.intent as QueryIntent,
    confidence,
    searchQuery: typeof parsed.searchQuery === 'string' && parsed.searchQuery.trim().length > 0 ? parsed.searchQuery.trim() : '',
    attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
    priceSignal: parsed.priceSignal ?? null,
    suggestedCategories: Array.isArray(parsed.suggestedCategories) ? parsed.suggestedCategories : null,
    comparisonTargets: Array.isArray(parsed.comparisonTargets) ? parsed.comparisonTargets : null,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FALLBACK — AI 실패 시 규칙 기반 분류 (항상 동작 보장)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const QUESTION_PATTERN = /^(what|which|how|where|can|should|do|does|is|are|will|would|could|recommend|suggest|best\s+.+\s+for)\b/i;
const PRICE_PATTERN = /\b(cheap|cheapest|budget|affordable|under\s*\$?\d+|below\s*\$?\d+|deal|sale|discount|\d+\s*(?:doll[aoe]rs?|dollers?|bucks?|usd))\b/i;
const COMPARISON_PATTERN = /\b(vs\.?|versus|compared?\s+to|or\b.*\bwhich|difference\s+between)\b|\b\w+\s+or\s+\w+\b/i;

/** 카테고리 키워드 → 추천 상품 키워드 (fallback용) */
const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  electronics: ['wireless earbuds', 'laptop stand', 'phone charger', 'bluetooth speaker', 'webcam', 'keyboard'],
  fashion: ['sneakers', 'hoodie', 'sunglasses', 'crossbody bag', 'watch', 'running shoes'],
  home: ['desk lamp', 'throw blanket', 'kitchen organizer', 'vacuum cleaner', 'bookshelf', 'candle set'],
  beauty: ['moisturizer', 'sunscreen SPF 50', 'vitamin C serum', 'lip balm set', 'makeup brush set'],
  camping: ['camping tent', 'sleeping bag', 'hiking boots', 'camping chair', 'headlamp', 'cooler bag'],
  sports: ['yoga mat', 'water bottle', 'resistance bands', 'running shoes', 'fitness tracker', 'gym bag'],
  cooking: ['air fryer', 'instant pot', 'knife set', 'cutting board', 'blender', 'cast iron skillet'],
  office: ['standing desk', 'ergonomic chair', 'monitor', 'keyboard', 'desk lamp', 'webcam'],
  gaming: ['gaming keyboard', 'gaming mouse', 'gaming headset', 'gaming monitor', 'controller', 'mousepad'],
  baby: ['baby monitor', 'stroller', 'car seat', 'diaper bag', 'baby carrier', 'high chair'],
  pet: ['dog bed', 'cat tree', 'pet carrier', 'dog harness', 'cat toy', 'pet water fountain'],
  travel: ['carry-on luggage', 'packing cubes', 'travel pillow', 'portable charger', 'travel adapter'],
  general: ['gift set', 'daily essentials', 'travel accessories', 'home office setup', 'fitness starter kit'],
};

/** 쿼리에서 카테고리 추론 */
function inferCategoryFromQuery(q: string): string[] {
  const lower = q.toLowerCase();
  for (const [cat, suggestions] of Object.entries(CATEGORY_SUGGESTIONS)) {
    if (lower.includes(cat)) return suggestions;
  }
  // 키워드 매칭
  if (/laptop|phone|tablet|earbuds|headphone|speaker|charger|monitor/i.test(lower)) return CATEGORY_SUGGESTIONS.electronics;
  if (/shoes|sneakers|dress|jacket|hoodie|pants|fashion/i.test(lower)) return CATEGORY_SUGGESTIONS.fashion;
  if (/tent|hik|camp|outdoor|sleeping bag/i.test(lower)) return CATEGORY_SUGGESTIONS.camping;
  if (/cook|kitchen|recipe|bak/i.test(lower)) return CATEGORY_SUGGESTIONS.cooking;
  if (/desk|office|chair|work from home/i.test(lower)) return CATEGORY_SUGGESTIONS.office;
  if (/game|gaming|console|controller/i.test(lower)) return CATEGORY_SUGGESTIONS.gaming;
  if (/baby|newborn|toddler|infant/i.test(lower)) return CATEGORY_SUGGESTIONS.baby;
  if (/dog|cat|pet/i.test(lower)) return CATEGORY_SUGGESTIONS.pet;
  if (/travel|trip|luggage|vacation/i.test(lower)) return CATEGORY_SUGGESTIONS.travel;
  if (/gym|yoga|fitness|running|exercise/i.test(lower)) return CATEGORY_SUGGESTIONS.sports;
  if (/skin|makeup|beauty|serum|moistur/i.test(lower)) return CATEGORY_SUGGESTIONS.beauty;
  if (/lamp|furniture|decor|pillow|blanket|clean/i.test(lower)) return CATEGORY_SUGGESTIONS.home;
  return CATEGORY_SUGGESTIONS.general;
}

export function fallback(input: IntentRouterInput): IntentRouterOutput {
  const q = input.query.trim();
  const qLower = q.toLowerCase();

  let intent: QueryIntent = 'PRODUCT_CATEGORY';

  if (COMPARISON_PATTERN.test(qLower)) {
    intent = 'COMPARISON';
  } else if (QUESTION_PATTERN.test(qLower)) {
    intent = 'QUESTION';
  } else if (PRICE_PATTERN.test(qLower)) {
    intent = 'PRICE_HUNT';
  }

  // 가격 추출 시도 — 오타 허용 (dollors, dollers, bucks 등)
  let priceSignal = null;
  const priceNorm = qLower
    .replace(/(\d+)\s*(?:doll[aoe]rs?|dollers?|bucks?|usd)/gi, '$$$1');
  const priceMatch = priceNorm.match(/(?:under|below)\s*\$?(\d+)/);
  const standalonePriceMatch = !priceMatch ? priceNorm.match(/\$(\d+)/) : null;
  if (priceMatch) {
    priceSignal = { type: 'budget' as const, maxPrice: parseInt(priceMatch[1], 10) };
  } else if (standalonePriceMatch) {
    priceSignal = { type: 'budget' as const, maxPrice: parseInt(standalonePriceMatch[1], 10) };
  }

  // 질문형 → 카테고리 기반 추천 상품 생성
  const suggestedCategories = intent === 'QUESTION'
    ? inferCategoryFromQuery(qLower)
    : null;

  // searchQuery: 의도 패턴 + 통화 오타 제거 후 빈 문자열 방지
  const cleanedQuery = q
    .replace(QUESTION_PATTERN, '')
    .replace(/(?:under|below|less than|over|above|more than)\s*\d+\s*(?:doll[aoe]rs?|dollers?|bucks?|usd)/gi, '')
    .replace(PRICE_PATTERN, '')
    .replace(/\d+\s*(?:doll[aoe]rs?|dollers?|bucks?|usd)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const searchQuery = cleanedQuery.length > 0 ? cleanedQuery : q;

  return {
    intent,
    confidence: 0.5, // Fallback은 AI보다 낮지만 너무 낮으면 불필요한 재검색 트리거
    searchQuery,
    attributes: [],
    priceSignal,
    suggestedCategories,
    comparisonTargets: null,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXECUTE — 이 모듈의 실행 함수 (외부에서 호출)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function classifyIntent(
  input: IntentRouterInput,
): Promise<PromptResult<IntentRouterOutput>> {
  // Empty query guard: skip AI call entirely
  if (!input.query || !input.query.trim()) {
    return {
      ok: true,
      data: fallback({ query: '' }),
      meta: {
        moduleId: CONFIG.id,
        durationMs: 0,
        tokensUsed: { input: 0, output: 0, total: 0 },
        estimatedCost: 0,
        usedFallback: true,
        error: 'Empty query',
      },
    };
  }

  return executePrompt<IntentRouterOutput>({
    config: CONFIG,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: buildUserMessage(input),
    fewShot: FEW_SHOT_EXAMPLES,
    fallback: () => fallback(input),
    parseOutput,
  });
}
