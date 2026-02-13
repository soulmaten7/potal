/**
 * POTAL Coordinator — Agent Orchestration 지휘자
 *
 * 전체 검색 파이프라인을 관리하는 중앙 컨트롤러.
 * 상황에 따라 AI Agent 또는 deterministic Tool을 선택적으로 호출.
 *
 * 흐름:
 *   1. 사용자 쿼리 수신
 *   2. [AI] QueryAgent → 검색어 분석 & 플랫폼별 검색어 생성
 *   3. [Tool] ProviderAPIs → 각 플랫폼 병렬 검색
 *   4. [Tool] FraudFilter → 규칙 기반 즉시 제거
 *   5. [AI] AnalysisAgent → 관련성 판단 & 사기 정밀 분석 (선택적)
 *   6. [Tool] CostEngine → Total Landed Cost 계산
 *   7. [Tool] ScoringEngine → Best/Fastest/Cheapest 점수
 *   8. 판단: 결과가 충분한가? → No → 3번으로 (다른 검색어/플랫폼)
 *   9. 결과 반환
 *
 * 핵심 원칙:
 *   - 돈 안 드는 건 Tool로 (FraudFilter, CostEngine, ScoringEngine)
 *   - 판단이 필요한 건 AI Agent로 (QueryAnalysis, ProductRelevance)
 *   - Coordinator는 "다음에 뭘 할지"만 결정
 */

import type { Product } from '@/app/types/product';
import type {
  SearchContext,
  PipelineStep,
  PipelineResult,
  QueryAnalysis,
  ToolResult,
} from './types';
import type { SearchResult } from '../search/types';
import type { TabSummary, ScoredProduct } from '../search/ScoringEngine';

// Tool imports (deterministic, $0, fast)
import { filterFraudulentProducts } from '../search/FraudFilter';
import { calculateAllLandedCosts } from '../search/CostEngine';
import { scoreProducts } from '../search/ScoringEngine';

// Provider imports
import { AmazonProvider } from '../search/providers/AmazonProvider';
import { GlobalMockProvider } from '../search/providers/GlobalMockProvider';

// AI Agent imports (costs money, but makes decisions)
import { filterProducts } from '../search/AIFilterService';
import {
  analyzeQueryWithAI,
  analyzeQueryDeterministic,
  shouldUseAIAnalysis,
} from './QueryAgent';
import {
  analyzeProductsBatch,
  applyAnalysisResults,
  shouldRunProductAnalysis,
} from './AnalysisAgent';

const amazonProvider = new AmazonProvider();
const globalMockProvider = new GlobalMockProvider();

/**
 * Coordinator — POTAL의 지휘자
 *
 * Sequential Pipeline과의 차이:
 *   Before: Provider → Fraud → AI → Cost → Score (항상 같은 순서)
 *   After:  Coordinator가 상황을 보고 판단
 *           - 결과 3개뿐? → 검색어 변형해서 재검색
 *           - 전부 Amazon? → Global provider도 호출
 *           - 가격대가 이상? → AI 사기 분석 강화
 */
export class Coordinator {
  private steps: PipelineStep[] = [];
  private startTime: number = 0;
  private totalTokens: number = 0;

  /**
   * 검색 실행 — 전체 파이프라인 오케스트레이션
   */
  async search(context: SearchContext): Promise<SearchResult> {
    this.steps = [];
    this.startTime = Date.now();
    this.totalTokens = 0;

    const { originalQuery, page = 1, market = 'all', zipcode } = context;
    const trimmed = originalQuery.trim();

    if (!trimmed) {
      return this.emptyResult();
    }

    console.log(`\n🎯 [Coordinator] Starting search: "${trimmed}" | market=${market} | page=${page}`);

    // ── Step 1: Query Analysis ──
    // 현재는 간단한 분석. 향후 QueryAgent(AI)로 교체.
    const queryAnalysis = await this.analyzeQuery(trimmed);

    // ── Step 2: Fetch from Providers ──
    const rawProducts = await this.fetchFromProviders(queryAnalysis, page, market);

    if (rawProducts.length === 0) {
      console.log('📭 [Coordinator] No results from providers.');
      return this.emptyResult();
    }

    // ── Step 3: FraudFilter (Tool — deterministic, $0) ──
    const cleanedProducts = await this.runFraudFilter(rawProducts);

    if (cleanedProducts.length === 0) {
      console.log('🛡️ [Coordinator] All products filtered by fraud rules.');
      return this.emptyResult();
    }

    // ── Step 4: Product Analysis (AI Agent — Coordinator가 판단) ──
    // 두 가지 분석 경로: 기존 AIFilter (가벼움) vs AnalysisAgent (정밀)
    let filteredProducts = cleanedProducts;

    if (shouldRunProductAnalysis(cleanedProducts.length, page)) {
      // AnalysisAgent: 관련성 + 사기 정밀 + 동일상품 매칭
      const analysisResult = await this.runAnalysisAgent(queryAnalysis, cleanedProducts);
      filteredProducts = analysisResult.filtered;

      if (analysisResult.sameProductGroups.size > 0) {
        console.log(`🔗 [Coordinator] Found ${analysisResult.sameProductGroups.size} same-product groups`);
      }
    } else if (this.shouldRunAIFilter(page, cleanedProducts.length)) {
      // Fallback: 기존 AIFilter (가벼움, 관련성만)
      filteredProducts = await this.runAIFilter(trimmed, cleanedProducts);
    }

    // ── Step 5: CostEngine (Tool — deterministic, $0) ──
    const landedCosts = await this.runCostEngine(filteredProducts, zipcode);

    // Enrich products with landed cost
    const enrichedProducts = filteredProducts.map(product => {
      const lc = landedCosts.get(product.id);
      if (lc) {
        return { ...product, totalPrice: lc.totalLandedCost, shippingPrice: lc.shippingCost };
      }
      return product;
    });

    // ── Step 6: ScoringEngine (Tool — deterministic, $0) ──
    const scoringResult = await this.runScoringEngine(
      enrichedProducts,
      landedCosts,
      trimmed,
      context.priceSpeedBalance,
    );

    // ── Step 7: Coordinator 판단 — 결과가 충분한가? ──
    const decision = this.evaluateResults(scoringResult.bestSorted, context);

    if (decision === 'refine' && page === 1 && queryAnalysis.confidence < 0.8) {
      // 재검색: 다른 검색어로 추가 검색 시도
      console.log('🔄 [Coordinator] Results insufficient, attempting refined search...');
      const refinedProducts = await this.attemptRefinedSearch(queryAnalysis, page, market);
      if (refinedProducts.length > 0) {
        // 기존 결과에 추가하고 다시 스코어링
        const merged = [...enrichedProducts, ...refinedProducts];
        const mergedLandedCosts = calculateAllLandedCosts(merged, { zipcode });
        const reScoringResult = scoreProducts(merged, {
          landedCosts: mergedLandedCosts,
          query: trimmed,
          priceSpeedBalance: context.priceSpeedBalance,
        });
        // 재스코어링 결과 사용
        const reResults = reScoringResult.bestSorted as Product[];
        const reDomesticCount = reResults.filter(p => {
          if (p.category) return p.category === 'domestic';
          return (p.shipping || '').toLowerCase() === 'domestic';
        }).length;
        const pipeline = this.buildPipelineResult();
        console.log(`\n✅ [Coordinator] Done (with refinement) in ${pipeline.totalDuration}ms | ${reResults.length} products`);
        return {
          results: reResults,
          total: reResults.length,
          metadata: {
            domesticCount: reDomesticCount,
            internationalCount: reResults.length - reDomesticCount,
            tabSummary: reScoringResult.tabSummary,
            fraudStats: this.getFraudStats(),
          },
        };
      }
    }

    // ── Step 8: 결과 조립 ──
    const results = scoringResult.bestSorted as Product[];
    const domesticCount = results.filter(p => {
      if (p.category) return p.category === 'domestic';
      return (p.shipping || '').toLowerCase() === 'domestic';
    }).length;

    const pipeline = this.buildPipelineResult();
    const aiSteps = pipeline.steps.filter(s => s.type === 'ai');
    const toolSteps = pipeline.steps.filter(s => s.type === 'deterministic');
    console.log(`\n✅ [Coordinator] Done in ${pipeline.totalDuration}ms | ${results.length} products (🇺🇸${domesticCount} + 🌏${results.length - domesticCount}) | AI:${aiSteps.length} Tool:${toolSteps.length} | ~$${pipeline.estimatedCost.toFixed(4)}`);

    return {
      results,
      total: results.length,
      metadata: {
        domesticCount,
        internationalCount: results.length - domesticCount,
        tabSummary: scoringResult.tabSummary,
        fraudStats: this.getFraudStats(),
      },
    };
  }

  // ─── Step Implementations ─────────────────────────

  /**
   * Step 1: Query Analysis — Coordinator가 AI vs deterministic 판단
   *
   * 간단한 쿼리 ("airpods") → deterministic (무료, 2ms)
   * 복잡한 쿼리 ("lightweight laptop under 800 for travel") → AI ($0.0003, 500ms)
   */
  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const stepStart = Date.now();
    const useAI = shouldUseAIAnalysis(query);

    let analysis: QueryAnalysis;

    if (useAI) {
      // AI Agent 호출 — 비용 발생하지만 정확
      analysis = await analyzeQueryWithAI(query);
      const tokensUsed = 300; // approximate
      this.totalTokens += tokensUsed;
      this.recordStep('analyze_query', 'QueryAgent', 'ai', query, analysis, stepStart, tokensUsed);
    } else {
      // Deterministic — 무료, 빠름
      analysis = analyzeQueryDeterministic(query);
      this.recordStep('analyze_query', 'QueryAnalysis', 'deterministic', query, analysis, stepStart);
    }

    return analysis;
  }

  /**
   * Step 2: Fetch from Providers (Tool)
   */
  private async fetchFromProviders(
    analysis: QueryAnalysis,
    page: number,
    market: string,
  ): Promise<Product[]> {
    const stepStart = Date.now();

    const fetchDomestic = market !== 'global';
    const fetchGlobal = market !== 'domestic';

    const [domesticResults, globalResults] = await Promise.all([
      fetchDomestic
        ? amazonProvider.search(analysis.platformQueries.amazon, page).catch(err => {
            console.error('❌ [Coordinator] Amazon error:', err);
            return [] as Product[];
          })
        : Promise.resolve([] as Product[]),
      fetchGlobal
        ? globalMockProvider.search(analysis.original, page).catch(err => {
            console.error('❌ [Coordinator] Global error:', err);
            return [] as Product[];
          })
        : Promise.resolve([] as Product[]),
    ]);

    const allProducts = [...domesticResults, ...globalResults];

    this.recordStep(
      'fetch_providers',
      'ProviderAPIs',
      'deterministic',
      { query: analysis.original, providers: ['Amazon', 'GlobalMock'] },
      { domestic: domesticResults.length, global: globalResults.length, total: allProducts.length },
      stepStart,
    );

    return allProducts;
  }

  /**
   * Step 3: FraudFilter (Tool — deterministic)
   */
  private async runFraudFilter(products: Product[]): Promise<Product[]> {
    const stepStart = Date.now();

    const fraudResult = filterFraudulentProducts(products);
    const cleaned = [...fraudResult.clean, ...fraudResult.flagged];

    this.fraudStats = {
      removed: fraudResult.stats.removed,
      flagged: fraudResult.stats.flagged,
      removeReasons: fraudResult.stats.removeReasons,
    };

    this.recordStep(
      'fraud_filter',
      'FraudFilter',
      'deterministic',
      { productCount: products.length },
      { cleaned: cleaned.length, removed: fraudResult.stats.removed, flagged: fraudResult.stats.flagged },
      stepStart,
    );

    return cleaned;
  }

  private fraudStats: { removed: number; flagged: number; removeReasons: Record<string, number> } = {
    removed: 0,
    flagged: 0,
    removeReasons: {},
  };

  private getFraudStats() {
    return this.fraudStats;
  }

  /**
   * Step 4: AI Relevance Filter (AI Agent — costs money)
   */
  private async runAIFilter(query: string, products: Product[]): Promise<Product[]> {
    const stepStart = Date.now();

    try {
      const filtered = await filterProducts(query, products);
      // 대략적인 토큰 추정 (입력 + 출력)
      const estimatedTokens = products.length * 50 + 200;
      this.totalTokens += estimatedTokens;

      this.recordStep(
        'ai_filter',
        'AnalysisAgent',
        'ai',
        { query, productCount: products.length },
        { filtered: filtered.length, removed: products.length - filtered.length },
        stepStart,
        estimatedTokens,
      );

      return filtered;
    } catch (err) {
      console.warn('⚠️ [Coordinator] AI Filter failed, using unfiltered:', err);
      this.recordStep('ai_filter', 'AnalysisAgent', 'ai', { query }, { error: 'failed, skipped' }, stepStart);
      return products;
    }
  }

  /**
   * Step 5: CostEngine (Tool — deterministic)
   */
  private async runCostEngine(
    products: Product[],
    zipcode?: string,
  ) {
    const stepStart = Date.now();

    const landedCosts = calculateAllLandedCosts(products, { zipcode });

    this.recordStep(
      'cost_engine',
      'CostEngine',
      'deterministic',
      { productCount: products.length, zipcode },
      { calculated: landedCosts.size },
      stepStart,
    );

    return landedCosts;
  }

  /**
   * Step 6: ScoringEngine (Tool — deterministic)
   */
  private async runScoringEngine(
    products: Product[],
    landedCosts: Map<string, any>,
    query: string,
    priceSpeedBalance?: number,
  ) {
    const stepStart = Date.now();

    const result = scoreProducts(products, {
      landedCosts,
      query,
      priceSpeedBalance,
    });

    this.recordStep(
      'scoring_engine',
      'ScoringEngine',
      'deterministic',
      { productCount: products.length },
      {
        bestTop: result.bestSorted[0]?.name?.substring(0, 40),
        cheapestTop: result.cheapestSorted[0]?.parsedPrice,
        fastestTop: result.fastestSorted[0]?.parsedDeliveryDays,
      },
      stepStart,
    );

    return result;
  }

  /**
   * Step 4a: AnalysisAgent (AI Agent — 정밀 분석)
   * 관련성 판단 + 사기 정밀 분석 + 동일 상품 매칭
   */
  private async runAnalysisAgent(
    queryAnalysis: QueryAnalysis,
    products: Product[],
  ): Promise<{ filtered: Product[]; sameProductGroups: Map<string, string[]> }> {
    const stepStart = Date.now();

    try {
      const analyses = await analyzeProductsBatch(queryAnalysis, products);
      const result = applyAnalysisResults(products, analyses);

      const estimatedTokens = Math.min(products.length, 20) * 80 + 300;
      this.totalTokens += estimatedTokens;

      this.recordStep(
        'analysis_agent',
        'AnalysisAgent',
        'ai',
        { productCount: products.length, query: queryAnalysis.original },
        {
          filtered: result.filtered.length,
          removed: result.removed,
          sameGroups: result.sameProductGroups.size,
        },
        stepStart,
        estimatedTokens,
      );

      return { filtered: result.filtered, sameProductGroups: result.sameProductGroups };
    } catch (err) {
      console.warn('⚠️ [Coordinator] AnalysisAgent failed, skipping:', err);
      this.recordStep('analysis_agent', 'AnalysisAgent', 'ai', {}, { error: 'failed' }, stepStart);
      return { filtered: products, sameProductGroups: new Map() };
    }
  }

  /**
   * 재검색 시도 — QueryAgent의 다른 플랫폼 검색어로 추가 검색
   */
  private async attemptRefinedSearch(
    queryAnalysis: QueryAnalysis,
    page: number,
    market: string,
  ): Promise<Product[]> {
    const stepStart = Date.now();

    // 원본과 다른 검색어가 있는지 확인
    const altQuery = queryAnalysis.platformQueries.walmart
      || queryAnalysis.platformQueries.ebay
      || queryAnalysis.original;

    // 동일한 검색어면 재검색 의미 없음
    if (altQuery === queryAnalysis.platformQueries.amazon) {
      return [];
    }

    try {
      console.log(`🔄 [Coordinator] Refined search with: "${altQuery}"`);
      const results = await amazonProvider.search(altQuery, page);

      this.recordStep(
        'refined_search',
        'ProviderAPIs',
        'deterministic',
        { altQuery },
        { results: results?.length || 0 },
        stepStart,
      );

      return results || [];
    } catch (err) {
      console.warn('⚠️ [Coordinator] Refined search failed:', err);
      return [];
    }
  }

  // ─── Coordinator Decisions ────────────────────────

  /**
   * AI Filter를 실행할지 판단
   */
  private shouldRunAIFilter(page: number, productCount: number): boolean {
    // page 1만, OpenAI 키가 있을 때만, 상품이 있을 때만
    if (page !== 1) return false;
    if (!process.env.OPENAI_API_KEY) return false;
    if (productCount === 0) return false;

    // 비용 최적화: 상품이 5개 미만이면 AI 필터 스킵 (이미 적으니까)
    if (productCount < 5) {
      console.log('💡 [Coordinator] Skipping AI filter: too few products');
      return false;
    }

    return true;
  }

  /**
   * 결과가 충분한지 판단
   */
  private evaluateResults(scoredProducts: ScoredProduct[], context: SearchContext): 'sufficient' | 'refine' {
    // 결과가 5개 미만이면 부족하다고 판단
    if (scoredProducts.length < 5) return 'refine';

    // 모든 결과가 한 플랫폼이면, 다양성 부족
    const sites = new Set(scoredProducts.map(p => p.site));
    if (sites.size === 1 && context.market === 'all') return 'refine';

    return 'sufficient';
  }

  // ─── Helpers ──────────────────────────────────────

  private emptyResult(): SearchResult {
    return {
      results: [],
      total: 0,
      metadata: { domesticCount: 0, internationalCount: 0 },
    };
  }

  private recordStep(
    step: string,
    agent: string,
    type: 'ai' | 'deterministic',
    input: unknown,
    output: unknown,
    startTime: number,
    tokensUsed?: number,
  ) {
    const duration = Date.now() - startTime;
    const emoji = type === 'ai' ? '🤖' : '⚡';
    console.log(`  ${emoji} [${agent}] ${step} — ${duration}ms${tokensUsed ? ` (~${tokensUsed} tokens)` : ''}`);

    this.steps.push({
      step,
      agent,
      type,
      input,
      output,
      duration,
      tokensUsed,
      timestamp: Date.now(),
    });
  }

  private buildPipelineResult(): PipelineResult {
    const totalDuration = Date.now() - this.startTime;
    // GPT-4o-mini: ~$0.15/1M input, ~$0.60/1M output
    const estimatedCost = this.totalTokens * 0.0000003;

    return {
      success: true,
      steps: this.steps,
      totalDuration,
      totalTokensUsed: this.totalTokens,
      estimatedCost,
    };
  }
}

// ─── Singleton ──────────────────────────────────────

let coordinator: Coordinator | null = null;

export function getCoordinator(): Coordinator {
  if (!coordinator) coordinator = new Coordinator();
  return coordinator;
}
