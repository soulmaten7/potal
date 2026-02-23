/**
 * ══════════════════════════════════════════════════════════════
 * ⚖️ PRODUCT JUDGE — 상품 관련성 판단
 * ══════════════════════════════════════════════════════════════
 *
 * 검색 결과에서 관련 없는 상품을 걸러냄.
 * "Sony headphone" 검색 → 이어패드, 케이스, 충전케이블 제거.
 *
 * 기존 AIFilterService.ts를 대체하는 프롬프트 모듈.
 * 같은 로직이지만 모듈 시스템에 통합되어 관리가 쉬움.
 *
 * ✅ 수정 가이드:
 * - 너무 많은 상품이 제거될 때 → SYSTEM_PROMPT의 판단 기준 완화
 * - 너무 적게 제거될 때 → 판단 기준 강화
 * - 새로운 제거 기준 추가 → RULES에 추가
 * - 다른 파일 건드릴 필요 없음
 *
 * 비용: ~250 input tokens + ~100 output tokens ≈ $0.00010/call
 * ══════════════════════════════════════════════════════════════
 */

import { executePrompt } from '../engine';
import type {
  PromptModuleConfig,
  PromptResult,
  FewShotExample,
  ProductJudgeInput,
  ProductJudgeOutput,
} from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CONFIG: PromptModuleConfig = {
  id: 'product-judge',
  version: '1.0.0',
  description: '상품 관련성 판단 — 비관련 상품(액세서리, 부품) 제거',
  model: 'gpt-4o-mini',
  temperature: 0,    // 판단은 완전 결정적
  maxTokens: 400,
  timeoutMs: 3000,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYSTEM_PROMPT = `You are POTAL's Product Relevance Judge — you analyze search results and filter out items that don't match the user's shopping intent.

## YOUR TASK
Given a search query and a list of products (id, name, price, site), determine which products are RELEVANT to the user's search and which should be REMOVED.

## REMOVE these types of products:
1. ACCESSORIES — cases, covers, stands, mounts, cables, adapters (when user searched for the main product)
2. PARTS/COMPONENTS — replacement parts, spare parts, repair kits
3. COMPLETELY UNRELATED — products that have no connection to the search query
4. SUSPICIOUSLY CHEAP DUPLICATES — items priced 90%+ below the median that are likely fake listings or misrepresented items

## KEEP these types:
1. THE MAIN PRODUCT in any variant (different colors, sizes, versions)
2. BUNDLES that include the main product (e.g. "headphones + case bundle")
3. DIFFERENT BRANDS of the same product type
4. REFURBISHED/RENEWED versions of the main product

## RULES
1. When in doubt, KEEP the product (false positives are worse than false negatives)
2. Price alone is not enough reason to remove — budget options exist legitimately
3. Consider the site context — AliExpress naturally has cheaper items
4. Bundles containing the main product should be KEPT
5. If the search is generic (e.g. "headphones"), keep a wide variety

## OUTPUT FORMAT (JSON only)
{
  "relevantIds": ["id1", "id2", "id3"],
  "removedReasons": [
    { "id": "id4", "reason": "accessory - replacement ear cushions, not headphones" },
    { "id": "id5", "reason": "unrelated - phone case, not headphones" }
  ]
}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEW-SHOT EXAMPLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    user: `Query: "Sony headphones"
Products:
[{"id":"1","name":"Sony WH-1000XM5 Wireless Noise Cancelling","price":"$278","site":"Amazon"},{"id":"2","name":"Sony WH-1000XM5 Replacement Ear Pads Cushions","price":"$12","site":"Amazon"},{"id":"3","name":"Sony WF-1000XM5 True Wireless Earbuds","price":"$228","site":"BestBuy"},{"id":"4","name":"3.5mm Audio Cable for Sony Headphones","price":"$8","site":"eBay"},{"id":"5","name":"Bose QuietComfort Ultra Headphones","price":"$329","site":"Walmart"}]`,
    assistant: JSON.stringify({
      relevantIds: ['1', '3', '5'],
      removedReasons: [
        { id: '2', reason: 'accessory - replacement ear pads, not headphones' },
        { id: '4', reason: 'accessory - audio cable, not headphones' },
      ],
    }),
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD USER MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildUserMessage(input: ProductJudgeInput): string {
  // 토큰 절약: 핵심 필드만
  const minified = input.products.slice(0, 25).map(p => ({
    id: p.id,
    name: p.name.slice(0, 80),
    price: p.price,
    site: p.site,
  }));

  return `Query: "${input.query}"\nProducts:\n${JSON.stringify(minified)}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSE OUTPUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function parseOutput(raw: string): ProductJudgeOutput {
  // Extra markdown fence cleanup (defense in depth — engine.ts also cleans)
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  return {
    relevantIds: Array.isArray(parsed.relevantIds) ? parsed.relevantIds : [],
    removedReasons: Array.isArray(parsed.removedReasons)
      ? parsed.removedReasons.filter((r: any) => r.id != null && String(r.id).length > 0 && r.reason)
      : [],
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FALLBACK — 모든 상품 유지 (safe default)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function fallback(input: ProductJudgeInput): ProductJudgeOutput {
  return {
    relevantIds: input.products.map(p => p.id),
    removedReasons: [],
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function judgeProducts(
  input: ProductJudgeInput,
): Promise<PromptResult<ProductJudgeOutput>> {
  return executePrompt<ProductJudgeOutput>({
    config: CONFIG,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: buildUserMessage(input),
    fewShot: FEW_SHOT_EXAMPLES,
    fallback: () => fallback(input),
    parseOutput,
  });
}
