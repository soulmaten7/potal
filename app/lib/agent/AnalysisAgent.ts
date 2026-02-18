/**
 * POTAL AnalysisAgent — AI 기반 상품 분석 에이전트
 *
 * Coordinator가 호출할 때만 실행 (비용 발생):
 * 1. 상품-검색어 관련성 판단 (액세서리/부품 제거)
 * 2. 사기 의심 정밀 분석 (Stage 2: AI 판단)
 * 3. 동일 상품 크로스 플랫폼 매칭 (Same Product Detection)
 *
 * FraudFilter(Stage 1, 규칙 기반)가 먼저 처리한 후,
 * AnalysisAgent(Stage 2, AI 기반)가 정밀 분석.
 *
 * 비용: GPT-4o-mini ~$0.001/호출 (상품 10개 배치 기준)
 * 지연: ~1-2초
 */

import type { Product } from '@/app/types/product';
import type { ProductAnalysis, QueryAnalysis } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const RELEVANCE_SYSTEM_PROMPT = `You are POTAL's Product Analysis Agent. Given a search query and a list of products, analyze each product for:

1. RELEVANCE (0-100): Is this the actual product the user wants? Score low for:
   - Accessories when the main product was searched (e.g., "iPhone case" when user searched "iPhone")
   - Replacement parts instead of the actual product
   - Completely unrelated products with keyword-stuffed titles
   - Screen protectors, cables, etc. when user wanted the device

2. FRAUD_SUSPICION (none/low/medium/high): Should the user be cautious?
   - "none": Normal product listing
   - "low": Minor concerns (new seller, few reviews)
   - "medium": Price seems off, title is suspicious, brand typo
   - "high": Price impossibly low, known scam patterns

3. SAME_PRODUCT_GROUP: If two products are the SAME item (same model, different seller/platform), assign them the same group ID.
   - Example: "Apple AirPods Pro 2" from Amazon and AliExpress → same group

Respond in valid JSON: { "analyses": [{ "index": number, "relevance": number, "relevanceReason": "string", "fraudSuspicion": "none|low|medium|high", "fraudReasons": ["string"], "sameProductGroupId": "string|null" }] }`;

/**
 * 배치 상품 분석 — 한 번의 API 호출로 여러 상품 분석
 *
 * @param query 검색어 분석 결과
 * @param products 분석할 상품 목록
 * @returns 각 상품에 대한 분석 결과
 */
export async function analyzeProductsBatch(
  queryAnalysis: QueryAnalysis,
  products: Product[],
): Promise<ProductAnalysis[]> {
  if (!OPENAI_API_KEY || products.length === 0) {
    return products.map(p => defaultAnalysis(p));
  }

  // 비용 최적화: 20개 이상이면 배치 분할
  if (products.length > 20) {
    const first20 = products.slice(0, 20);
    const rest = products.slice(20);
    const firstAnalysis = await analyzeProductsBatch(queryAnalysis, first20);
    const restAnalysis = rest.map(p => defaultAnalysis(p)); // 나머지는 기본값
    return [...firstAnalysis, ...restAnalysis];
  }

  try {
    // 상품 정보를 간결하게 요약 (토큰 절약)
    const productSummaries = products.map((p, i) => ({
      index: i,
      title: (p.name || '').substring(0, 100),
      price: p.price,
      site: p.site,
      brand: p.brand || null,
      shipping: p.shipping,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: RELEVANCE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Search query: "${queryAnalysis.original}"
Category: ${queryAnalysis.category}
Strategy: ${queryAnalysis.strategy}

Products to analyze:
${JSON.stringify(productSummaries, null, 0)}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });

    if (!response.ok) {
      console.warn(`⚠️ [AnalysisAgent] OpenAI error: ${response.status}`);
      return products.map(p => defaultAnalysis(p));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!content) {
      return products.map(p => defaultAnalysis(p));
    }

    const parsed = JSON.parse(content);
    const analyses = parsed.analyses || [];

    console.log(`🤖 [AnalysisAgent] Analyzed ${analyses.length} products | ${tokensUsed} tokens`);

    // API 응답을 ProductAnalysis 형식으로 매핑
    return products.map((product, i) => {
      const analysis = analyses.find((a: any) => a.index === i);
      if (!analysis) return defaultAnalysis(product);

      return {
        productId: product.id,
        relevanceScore: analysis.relevance || 70,
        relevanceReason: analysis.relevanceReason || '',
        fraudSuspicion: analysis.fraudSuspicion || 'none',
        fraudReasons: analysis.fraudReasons || [],
        sameProductGroupId: analysis.sameProductGroupId || undefined,
      };
    });
  } catch (err) {
    console.warn('⚠️ [AnalysisAgent] Analysis failed:', err);
    return products.map(p => defaultAnalysis(p));
  }
}

/**
 * 기본 분석 결과 (AI 실패 시 fallback)
 */
function defaultAnalysis(product: Product): ProductAnalysis {
  return {
    productId: product.id,
    relevanceScore: 70,
    relevanceReason: 'Default score (AI analysis unavailable)',
    fraudSuspicion: 'none',
  };
}

/**
 * 분석 결과를 기반으로 상품 필터링 & 정렬
 *
 * - relevanceScore < 30 → 제거 (명확한 미관련 상품)
 * - fraudSuspicion === 'high' → 제거
 * - 나머지는 relevanceScore 기반으로 부스트
 */
export function applyAnalysisResults(
  products: Product[],
  analyses: ProductAnalysis[],
): {
  filtered: Product[];
  removed: number;
  sameProductGroups: Map<string, string[]>;
} {
  const analysisMap = new Map(analyses.map(a => [a.productId, a]));
  const filtered: Product[] = [];
  let removed = 0;
  const sameProductGroups = new Map<string, string[]>();

  for (const product of products) {
    const analysis = analysisMap.get(product.id);

    if (analysis) {
      // 명확한 미관련 상품 제거
      if (analysis.relevanceScore < 30) {
        removed++;
        continue;
      }

      // 고위험 사기 의심 제거
      if (analysis.fraudSuspicion === 'high') {
        removed++;
        continue;
      }

      // 동일 상품 그룹 추적
      if (analysis.sameProductGroupId) {
        const group = sameProductGroups.get(analysis.sameProductGroupId) || [];
        group.push(product.id);
        sameProductGroups.set(analysis.sameProductGroupId, group);
      }
    }

    filtered.push(product);
  }

  return { filtered, removed, sameProductGroups };
}

/**
 * Coordinator가 AI 분석을 호출할지 판단하는 헬퍼
 */
export function shouldRunProductAnalysis(
  productCount: number,
  page: number,
): boolean {
  // MVP 단계: AnalysisAgent 비활성화
  // 이유: gpt-4o-mini가 20개 상품 + JSON mode + 1500 토큰을 5초 안에 처리 못함
  //       → 매 검색마다 6초 낭비 (타임아웃 후 기본값 반환)
  // 대안: ProductJudge가 대신 관련성 필터링 수행 (더 빠르고 안정적)
  // TODO: v2에서 AnalysisAgent를 non-blocking으로 리팩토링 후 재활성화
  return false;

  // page 1만
  if (page !== 1) return false;

  // API 키 필요
  if (!OPENAI_API_KEY) return false;

  // 상품이 3개 미만이면 스킵
  if (productCount < 3) return false;

  // 비용 제한: 50개 이상이면 처음 20개만 분석
  return true;
}
