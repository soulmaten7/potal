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
import { logSearch, generateSessionId, type SearchLogEntry } from '../learning';

// Tool imports (deterministic, $0, fast)
import { filterFraudulentProducts } from '../search/FraudFilter';
import { calculateAllLandedCosts } from '../search/CostEngine';
import { scoreProducts } from '../search/ScoringEngine';

// Provider imports
import { AmazonProvider } from '../search/providers/AmazonProvider';
import { WalmartProvider } from '../search/providers/WalmartProvider';
// BestBuyProvider 비활성화: RapidAPI 서버 500 에러 (2026-02-22 Playground에서도 확인)
// import { BestBuyProvider } from '../search/providers/BestBuyProvider';
import { AliExpressProvider } from '../search/providers/AliExpressProvider';
// TemuProvider 비활성화: Temu 서버가 2026-02-18부터 모든 빌드(v1.0.32~1.0.37) 403 차단
// amit123이 새 우회 방법 적용 시 복원. Apify 콘솔에서 Results > 0 확인 후 주석 해제.
// import { TemuProvider } from '../search/providers/TemuProvider';
// CostcoProvider 비활성화: Deals API만 제공 (오프라인 중심, MVP 제외)
// import { CostcoProvider } from '../search/providers/CostcoProvider';
// SheinProvider 비활성화: 3번째 API도 서버 500 (2026-02-22 Playground에서도 확인)
// import { SheinProvider } from '../search/providers/SheinProvider';
import { EbayProvider } from '../search/providers/EbayProvider';
import { TargetProvider } from '../search/providers/TargetProvider';

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

// ── Prompt Module imports (modular AI system) ──
import { classifyIntent } from '../ai/prompts/intent-router';
import { judgeProducts } from '../ai/prompts/product-judge';
import type { IntentRouterOutput } from '../ai/types';

const amazonProvider = new AmazonProvider();
const walmartProvider = new WalmartProvider();
// const bestBuyProvider = new BestBuyProvider(); // 비활성화: RapidAPI 서버 500 에러 (2026-02-22 확인). 복구 시 주석 해제.
const aliExpressProvider = new AliExpressProvider();
// const temuProvider = new TemuProvider(); // 비활성화: Temu 403 차단 (2026-02-18~)
// const costcoProvider = new CostcoProvider(); // 비활성화: 오프라인 중심, MVP 제외
const ebayProvider = new EbayProvider();
const targetProvider = new TargetProvider();
// const sheinProvider = new SheinProvider(); // 비활성화: RapidAPI 서버 500 에러 (2026-02-22 확인). 복구 시 주석 해제.

/** Provider별 개별 타임아웃 (12초, eBay/Target 등 느린 Provider 대응) */
const PROVIDER_TIMEOUT = 12_000;

/** AI Agent 타임아웃 (6초 — 실패 시 분석 없이 진행) */
const AI_AGENT_TIMEOUT = 6_000;
function withTimeout<T>(p: Promise<T>, name: string): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const t = setTimeout(() => {
      if (!settled) { settled = true; reject(new Error(`[${name}] timeout`)); }
    }, PROVIDER_TIMEOUT);
    p.then(r => { if (!settled) { settled = true; clearTimeout(t); resolve(r); } })
     .catch(e => { if (!settled) { settled = true; clearTimeout(t); reject(e); } });
  });
}

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
  /** 마지막 검색의 리테일러별 상태 (Skyscanner-style partial failure tracking) */
  private _lastProviderStatus: Record<string, { status: 'ok' | 'error' | 'timeout'; count: number }> = {};
  /** Session ID for learning system (generated once per coordinator instance) */
  private sessionId: string = generateSessionId();

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


    // ── Step 1: Query Analysis ──
    // 현재는 간단한 분석. 향후 QueryAgent(AI)로 교체.
    const queryAnalysis = await this.analyzeQuery(trimmed);

    // ── Step 1.5: 질문형 쿼리 → 조기 반환 (API 호출 없이 suggestedProducts만) ──
    if (queryAnalysis.isQuestionQuery && queryAnalysis.suggestedProducts && queryAnalysis.suggestedProducts.length > 0) {
      const questionResult = {
        results: [],
        total: 0,
        metadata: {
          domesticCount: 0,
          internationalCount: 0,
          isQuestionQuery: true,
          suggestedProducts: queryAnalysis.suggestedProducts,
        },
      };
      this.logSearchAsync(context, queryAnalysis, questionResult);
      return questionResult;
    }

    // ── Step 2: Fetch from Providers ──
    const rawProducts = await this.fetchFromProviders(queryAnalysis, page, market);

    if (rawProducts.length === 0) {
      return this.emptyResult();
    }

    // ── Step 3: FraudFilter (Tool — deterministic, $0) ──
    const cleanedProducts = await this.runFraudFilter(rawProducts);

    if (cleanedProducts.length === 0) {
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
      }
    } else if (this.shouldRunAIFilter(page, cleanedProducts.length)) {
      // Fallback: 기존 AIFilter (가벼움, 관련성만)
      filteredProducts = await this.runAIFilter(trimmed, cleanedProducts);
    }

    // ── Step 5: CostEngine (Tool — deterministic, $0) ──
    const landedCosts = await this.runCostEngine(filteredProducts, zipcode);

    // Enrich products with landed cost
    let enrichedProducts = filteredProducts.map(product => {
      const lc = landedCosts.get(product.id);
      if (lc) {
        return { ...product, totalPrice: lc.totalLandedCost, shippingPrice: lc.shippingCost };
      }
      return product;
    });

    // Step 5.3 제거: 가짜 config 기반 배송 토글 삭제 → API 실제 데이터만 표시
    // Temu는 이제 실제 Provider로 fetchFromProviders에서 호출됨 (GlobalMockProvider 제거)

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
      const refinedProducts = await this.attemptRefinedSearch(queryAnalysis, page, market);
      if (refinedProducts.length > 0) {
        // 기존 결과에 추가하되 중복 제거 (같은 ID 방지)
        const existingIds = new Set(enrichedProducts.map(p => p.id));
        const uniqueRefined = refinedProducts.filter(p => !existingIds.has(p.id));
        const merged = [...enrichedProducts, ...uniqueRefined];
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
        return {
          results: reResults,
          total: reResults.length,
          metadata: {
            domesticCount: reDomesticCount,
            internationalCount: reResults.length - reDomesticCount,
            tabSummary: reScoringResult.tabSummary,
            fraudStats: this.getFraudStats(),
            providerStatus: this._lastProviderStatus,
          },
        };
      }
    }

    // ── Step 8: 결과 조립 + 사이트 인터리빙 ──
    const results = this.interleaveBysite(scoringResult.bestSorted as Product[]);
    const domesticCount = results.filter(p => {
      if (p.category) return p.category === 'domestic';
      return (p.shipping || '').toLowerCase() === 'domestic';
    }).length;

    const pipeline = this.buildPipelineResult();
    const aiSteps = pipeline.steps.filter(s => s.type === 'ai');
    const toolSteps = pipeline.steps.filter(s => s.type === 'deterministic');

    const result = {
      results,
      total: results.length,
      metadata: {
        domesticCount,
        internationalCount: results.length - domesticCount,
        tabSummary: scoringResult.tabSummary,
        fraudStats: this.getFraudStats(),
        providerStatus: this._lastProviderStatus,
      },
    };

    // ── Phase 1: Log search (fire-and-forget, never awaited) ──
    this.logSearchAsync(context, queryAnalysis, result);

    return result;
  }

  /**
   * 사이트별 인터리빙: 같은 사이트 상품이 연속으로 나오지 않도록 교차 배치
   * bestScore 순서를 최대한 유지하면서 사이트 다양성을 확보
   */
  private interleaveBysite(products: Product[]): Product[] {
    if (products.length <= 1) return products;

    // 사이트별로 그룹핑 (각 그룹 내에서는 bestScore 순서 유지)
    const groups = new Map<string, Product[]>();
    for (const p of products) {
      const site = p.site || 'Unknown';
      if (!groups.has(site)) groups.set(site, []);
      groups.get(site)!.push(p);
    }

    // Round-robin 방식으로 교차 배치
    const result: Product[] = [];
    const queues = Array.from(groups.values());
    const indices = queues.map(() => 0);

    while (result.length < products.length) {
      let added = false;
      for (let i = 0; i < queues.length; i++) {
        if (indices[i] < queues[i].length) {
          result.push(queues[i][indices[i]]);
          indices[i]++;
          added = true;
        }
      }
      if (!added) break;
    }

    return result;
  }

  // ─── Step Implementations ─────────────────────────

  /**
   * Step 1: Query Analysis — Intent Router + QueryAgent
   *
   * 1단계: Intent Router (빠르고 저렴, ~$0.00005) — 의도 분류
   * 2단계: 의도에 따라 분기
   *   - QUESTION → suggestedCategories로 조기 반환 (API 호출 없음)
   *   - PRODUCT_SPECIFIC → deterministic 분석 (충분히 명확)
   *   - 나머지 → 기존 QueryAgent 로직
   */
  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const stepStart = Date.now();

    // ── Phase 1: Intent Router (항상 실행, 빠르고 저렴) ──
    let intent: IntentRouterOutput | null = null;
    try {
      const intentResult = await classifyIntent({ query });
      intent = intentResult.data;
      const tokensUsed = (intentResult.meta.tokensUsed?.input ?? 0) + (intentResult.meta.tokensUsed?.output ?? 0);
      this.totalTokens += tokensUsed;
      this.recordStep('intent_router', 'IntentRouter', 'ai', query,
        { intent: intent.intent, confidence: intent.confidence, searchQuery: intent.searchQuery },
        stepStart, tokensUsed);
    } catch (err) {
      console.warn('⚠️ [Coordinator] Intent Router failed, continuing with QueryAgent:', err);
    }

    // ── Phase 2: 의도별 분기 ──

    // QUESTION → 바로 suggestedCategories 반환 (API 호출 불필요)
    if (intent?.intent === 'QUESTION' && intent.suggestedCategories && intent.suggestedCategories.length > 0) {
      const analysis: QueryAnalysis = {
        original: query,
        category: 'General',
        platformQueries: { amazon: intent.searchQuery || query },
        attributes: {},
        strategy: 'broad',
        confidence: intent.confidence,
        isQuestionQuery: true,
        suggestedProducts: intent.suggestedCategories,
      };
      this.recordStep('analyze_query', 'IntentRouter→Question', 'ai', query, analysis, stepStart);
      return analysis;
    }

    // PRODUCT_SPECIFIC → deterministic으로 충분 (모델번호/정확한 상품명)
    if (intent?.intent === 'PRODUCT_SPECIFIC' && intent.confidence >= 0.85) {
      const cleanQuery = intent.searchQuery || query;
      const analysis = analyzeQueryDeterministic(cleanQuery);
      analysis.strategy = 'specific';
      analysis.confidence = intent.confidence;
      if (intent.attributes?.length) {
        for (const attr of intent.attributes) {
          analysis.attributes[attr] = attr;
        }
      }
      this.recordStep('analyze_query', 'IntentRouter→Specific', 'deterministic', query, analysis, stepStart);
      return analysis;
    }

    // PRICE_HUNT → priceSignal 정보 활용
    if (intent?.intent === 'PRICE_HUNT' && intent.priceSignal) {
      const cleanQuery = intent.searchQuery || query;
      const useAI = shouldUseAIAnalysis(cleanQuery);
      let analysis: QueryAnalysis;

      if (useAI) {
        analysis = await analyzeQueryWithAI(cleanQuery);
        this.totalTokens += 300;
        this.recordStep('analyze_query', 'IntentRouter→PriceHunt+AI', 'ai', query, analysis, stepStart, 300);
      } else {
        analysis = analyzeQueryDeterministic(cleanQuery);
        this.recordStep('analyze_query', 'IntentRouter→PriceHunt', 'deterministic', query, analysis, stepStart);
      }

      // Intent Router의 priceSignal로 보강
      if (intent.priceSignal.maxPrice) {
        analysis.priceIntent = { max: intent.priceSignal.maxPrice, currency: 'USD' };
      }
      return analysis;
    }

    // COMPARISON → comparisonTargets 활용
    if (intent?.intent === 'COMPARISON' && intent.comparisonTargets && intent.comparisonTargets.length > 0) {
      const cleanQuery = intent.searchQuery || query;
      const analysis = analyzeQueryDeterministic(cleanQuery);
      analysis.strategy = 'comparison';
      analysis.confidence = intent.confidence;
      this.recordStep('analyze_query', 'IntentRouter→Comparison', 'deterministic', query, analysis, stepStart);
      return analysis;
    }

    // PRODUCT_CATEGORY 또는 Intent Router 실패 → 기존 QueryAgent 로직
    const effectiveQuery = intent?.searchQuery || query;
    const useAI = shouldUseAIAnalysis(effectiveQuery);
    let analysis: QueryAnalysis;

    if (useAI) {
      analysis = await analyzeQueryWithAI(effectiveQuery);
      const tokensUsed = 300;
      this.totalTokens += tokensUsed;
      this.recordStep('analyze_query', 'QueryAgent', 'ai', query, analysis, stepStart, tokensUsed);
    } else {
      analysis = analyzeQueryDeterministic(effectiveQuery);
      this.recordStep('analyze_query', 'QueryAnalysis', 'deterministic', query, analysis, stepStart);
    }

    return analysis;
  }

  /**
   * Step 2: Fetch from Providers (Tool)
   * Amazon + Walmart + BestBuy (Domestic) | AliExpress + Temu + Shein (Global)
   * 모두 병렬, 각 10초 개별 타임아웃
   */
  private async fetchFromProviders(
    analysis: QueryAnalysis,
    page: number,
    market: string,
  ): Promise<Product[]> {
    const stepStart = Date.now();

    const fetchDomestic = market !== 'global';
    const fetchGlobal = market !== 'domestic';
    const q = analysis.platformQueries?.amazon || analysis.original;

    // Domestic: Amazon + Walmart + eBay + Target 병렬 (4개)
    // BestBuy 비활성화: RapidAPI 서버 500 (2026-02-22). 복구 시 추가.
    const domesticPromises = fetchDomestic
      ? Promise.allSettled([
          withTimeout(amazonProvider.search(q, page), 'Amazon'),
          withTimeout(walmartProvider.search(q, page), 'Walmart'),
          // withTimeout(bestBuyProvider.search(q, page), 'BestBuy'), // 비활성화: RapidAPI 500 에러 (2026-02-22)
          withTimeout(ebayProvider.search(q, page), 'eBay'),
          withTimeout(targetProvider.search(q, page), 'Target'),
          // withTimeout(costcoProvider.search(q, page), 'Costco'), // 비활성화: 오프라인 중심, MVP 제외
        ])
      : Promise.resolve([]);

    // Global: AliExpress 단독 (1개)
    // Shein 비활성화: RapidAPI 서버 500 (2026-02-22). Temu: 403 차단. 복구 시 추가.
    const globalQuery = analysis.platformQueries?.aliexpress || analysis.platformQueries?.amazon || analysis.original;
    const globalPromises = fetchGlobal
      ? Promise.allSettled([
          withTimeout(aliExpressProvider.search(globalQuery, page), 'AliExpress'),
          // withTimeout(sheinProvider.search(globalQuery, page), 'Shein'), // 비활성화: RapidAPI 500 에러 (2026-02-22)
          // temuProvider.search(globalQuery, page), // 비활성화: Temu 403 차단 (2026-02-18~)
        ])
      : Promise.resolve([]);

    const [domesticSettled, globalSettled] = await Promise.all([domesticPromises, globalPromises]);

    // Collect results + track provider status (Skyscanner-style partial failure)
    const domesticResults: Product[] = [];
    const globalResults: Product[] = [];
    const domesticProviderNames = fetchDomestic ? ['Amazon', 'Walmart', 'eBay', 'Target'] : [];
    const globalProviderNames = fetchGlobal ? ['AliExpress'] : [];

    // 리테일러별 성공/실패 상태 추적
    const providerStatus: Record<string, { status: 'ok' | 'error' | 'timeout'; count: number }> = {};

    if (Array.isArray(domesticSettled)) {
      domesticSettled.forEach((r, i) => {
        const name = domesticProviderNames[i] || `Provider${i}`;
        if (r.status === 'fulfilled') {
          const items = r.value ?? [];
          domesticResults.push(...items);
          providerStatus[name] = { status: 'ok', count: items.length };
        } else {
          const errMsg = r.reason?.message || 'Unknown error';
          const fullError = r.reason ? `${r.reason.message}${r.reason.stack ? '\n' + r.reason.stack : ''}` : errMsg;
          const isTimeout = errMsg.includes('timeout');
          providerStatus[name] = { status: isTimeout ? 'timeout' : 'error', count: 0 };
          console.error(`❌ [Coordinator] ${name} ${isTimeout ? 'timeout' : 'error'}: ${errMsg}`);
          console.error(`  Details: ${fullError}`);
        }
      });
    }

    if (Array.isArray(globalSettled)) {
      globalSettled.forEach((r, i) => {
        const name = globalProviderNames[i] || `GlobalProvider${i}`;
        if (r.status === 'fulfilled') {
          const items = r.value ?? [];
          globalResults.push(...items);
          providerStatus[name] = { status: 'ok', count: items.length };
        } else {
          const errMsg = r.reason?.message || 'Unknown error';
          const fullError = r.reason ? `${r.reason.message}${r.reason.stack ? '\n' + r.reason.stack : ''}` : errMsg;
          const isTimeout = errMsg.includes('timeout');
          providerStatus[name] = { status: isTimeout ? 'timeout' : 'error', count: 0 };
          console.error(`❌ [Coordinator] ${name} ${isTimeout ? 'timeout' : 'error'}: ${errMsg}`);
          console.error(`  Details: ${fullError}`);
        }
      });
    }

    // 비활성화된 프로바이더도 상태에 추가 (disabled)
    // (향후 활성화 시 자동 제거)

    // NOTE: Shein mock cards are injected AFTER FraudFilter in search()
    // because their price='Compare' ($0) would trigger price_zero removal.

    const allProducts = [...domesticResults, ...globalResults];
    const providerNames = [...domesticProviderNames, ...globalProviderNames];

    // providerStatus를 인스턴스에 저장 (metadata에서 사용)
    this._lastProviderStatus = providerStatus;

    const failedProviders = Object.entries(providerStatus).filter(([, v]) => v.status !== 'ok').map(([k]) => k);
    if (failedProviders.length > 0) {
      console.warn(`⚠️ [Coordinator] Failed providers: ${failedProviders.join(', ')}`);
    }

    this.recordStep(
      'fetch_providers',
      'ProviderAPIs',
      'deterministic',
      { query: analysis.original, providers: providerNames },
      { domestic: domesticResults.length, global: globalResults.length, total: allProducts.length, providerStatus },
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

    // Debug: AliExpress 아이템이 FraudFilter에서 얼마나 제거되는지 확인
    const globalBefore = products.filter(p => p.category === 'international' || p.shipping === 'International').length;
    const globalAfter = cleaned.filter(p => p.category === 'international' || p.shipping === 'International').length;
    if (globalBefore > 0) {
      if (fraudResult.removed.length > 0) {
        const sample = fraudResult.removed.slice(0, 3).map(p => `${p.site}: "${(p.name || '').slice(0, 30)}" price=${p.price}`);
      }
    }

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
   * Step 4: AI Relevance Filter — Product Judge 모듈 사용
   *
   * 기존 AIFilterService 대신 프롬프트 모듈 시스템의 Product Judge를 사용.
   * 장점: 모듈화, few-shot 예시, 자동 fallback, 비용 추적
   */
  private async runAIFilter(query: string, products: Product[]): Promise<Product[]> {
    const stepStart = Date.now();

    try {
      // Product Judge 모듈 호출
      const judgeInput = {
        query,
        products: products.map(p => ({
          id: p.id,
          name: p.name || '',
          price: p.price || '',
          site: p.site || '',
        })),
      };

      const result = await judgeProducts(judgeInput);
      const { relevantIds, removedReasons } = result.data;

      // relevantIds로 필터링
      const relevantSet = new Set(relevantIds);
      const filtered = products.filter(p => relevantSet.has(p.id));

      const tokensUsed = (result.meta.tokensUsed?.input ?? 0) + (result.meta.tokensUsed?.output ?? 0);
      this.totalTokens += tokensUsed;


      this.recordStep(
        'ai_filter',
        'ProductJudge',
        'ai',
        { query, productCount: products.length },
        { filtered: filtered.length, removed: removedReasons.length, usedFallback: result.meta.usedFallback },
        stepStart,
        tokensUsed,
      );

      // Product Judge가 모든 상품을 제거한 경우 → 원본 반환 (안전장치)
      if (filtered.length === 0 && products.length > 0) {
        console.warn('⚠️ [ProductJudge] Removed all products, reverting to unfiltered');
        return products;
      }

      return filtered;
    } catch (err) {
      console.warn('⚠️ [Coordinator] Product Judge failed, using unfiltered:', err);
      this.recordStep('ai_filter', 'ProductJudge', 'ai', { query }, { error: 'failed, skipped' }, stepStart);
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
      // AI Agent에 타임아웃 적용 — 실패 시 분석 없이 진행
      const analyses = await Promise.race([
        analyzeProductsBatch(queryAnalysis, products),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AnalysisAgent timeout')), AI_AGENT_TIMEOUT)
        ),
      ]);
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
      const settled = await Promise.allSettled([
        withTimeout(amazonProvider.search(altQuery, page), 'Amazon-refine'),
        withTimeout(walmartProvider.search(altQuery, page), 'Walmart-refine'),
        // withTimeout(bestBuyProvider.search(altQuery, page), 'BestBuy-refine'), // 비활성화
        withTimeout(ebayProvider.search(altQuery, page), 'eBay-refine'),
        withTimeout(targetProvider.search(altQuery, page), 'Target-refine'),
      ]);
      const results: Product[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled') results.push(...(r.value ?? []));
      }

      this.recordStep(
        'refined_search',
        'ProviderAPIs',
        'deterministic',
        { altQuery },
        { results: results.length },
        stepStart,
      );

      return results;
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

  /**
   * Log search to Supabase asynchronously (fire-and-forget)
   * Never awaited in search path — does not affect search latency
   */
  private logSearchAsync(context: SearchContext, queryAnalysis: QueryAnalysis, result: SearchResult) {
    const endTime = Date.now();
    const responseTime = endTime - this.startTime;

    // Collect provider results
    const providerResults: Record<string, number> = {};
    if (this._lastProviderStatus) {
      for (const [name, status] of Object.entries(this._lastProviderStatus)) {
        providerResults[name] = status.count || 0;
      }
    }

    const entry: SearchLogEntry = {
      session_id: this.sessionId,
      query: context.originalQuery,
      intent: (this.steps.find(s => s.step === 'intent_router')?.output as any)?.intent || 'unknown',
      intent_confidence: (this.steps.find(s => s.step === 'intent_router')?.output as any)?.confidence || 0,
      is_question_query: queryAnalysis.isQuestionQuery || false,
      search_query_used: queryAnalysis.platformQueries?.amazon || context.originalQuery,
      category: queryAnalysis.category || 'General',
      strategy: queryAnalysis.strategy || 'unknown',
      provider_results: providerResults,
      total_results: result.total,
      fraud_removed: this.fraudStats.removed,
      ai_filtered: this.fraudStats.flagged,
      response_time_ms: responseTime,
      ai_cost_usd: this.buildPipelineResult().estimatedCost,
      used_ai_analysis: this.steps.some(s => s.type === 'ai' && s.step !== 'intent_router'),
    };

    // Fire-and-forget: never await (logSearch is synchronous, async happens in background)
    logSearch(entry);
  }
}

// ─── Singleton ──────────────────────────────────────

let coordinator: Coordinator | null = null;

export function getCoordinator(): Coordinator {
  if (!coordinator) coordinator = new Coordinator();
  return coordinator;
}
