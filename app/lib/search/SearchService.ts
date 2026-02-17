import type { Product } from '@/app/types/product';
import type { SearchResult } from './types';
import { AmazonProvider } from './providers/AmazonProvider';
import { WalmartProvider } from './providers/WalmartProvider';
import { AliExpressProvider } from './providers/AliExpressProvider';
import { TemuProvider } from './providers/TemuProvider';
// SheinProvider 비활성화: API 서버 다운 (환불 요청 중)
// import { SheinProvider } from './providers/SheinProvider';
import { filterProducts } from './AIFilterService';
import { filterFraudulentProducts } from './FraudFilter';
import { calculateAllLandedCosts } from './CostEngine';
import { scoreProducts } from './ScoringEngine';
import type { ScoredProduct } from './ScoringEngine';

const amazonProvider = new AmazonProvider();
const walmartProvider = new WalmartProvider();
const aliExpressProvider = new AliExpressProvider();
const temuProvider = new TemuProvider();

/** Provider별 개별 타임아웃 (12초). eBay 등 느린 Provider 대응. */
const PROVIDER_TIMEOUT_MS = 12_000;

function withProviderTimeout<T>(promise: Promise<T>, providerName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[${providerName}] timed out after ${PROVIDER_TIMEOUT_MS}ms`));
    }, PROVIDER_TIMEOUT_MS);
    promise
      .then(r => { clearTimeout(timer); resolve(r); })
      .catch(e => { clearTimeout(timer); reject(e); });
  });
}

/**
 * POTAL SearchService — Full Pipeline
 *
 * Pipeline:
 * 1. Fetch products from all providers (parallel)
 * 2. FraudFilter Stage 1: Remove $0, no-image, sponsored, empty-title
 * 3. AI Filter: Remove irrelevant items (accessories, wrong products)
 * 4. CostEngine: Calculate Total Landed Cost for each product
 * 5. ScoringEngine: Calculate Best/Fastest/Cheapest scores
 * 6. Return enriched results with tab summary
 *
 * 0건이면 빈 배열만 반환. 가짜/플레이스홀더 카드 없음.
 * 클라이언트 Smart Fallback이 대체 검색 수행.
 */
export class SearchService {
  async search(
    query: string,
    page: number = 1,
    options?: {
      zipcode?: string;
      market?: 'all' | 'domestic' | 'global';
      priceSpeedBalance?: number;
    }
  ): Promise<SearchResult> {
    const trimmed = (query || '').trim();
    const emptyResult: SearchResult = {
      results: [],
      total: 0,
      metadata: { domesticCount: 0, internationalCount: 0 },
    };
    if (!trimmed) return emptyResult;

    const market = options?.market || 'all';

    // ── Step 1: Fetch from providers (parallel) ──
    const [domesticRaw, globalRaw] = await Promise.all([
      market !== 'global' ? this.fetchDomestic(trimmed, page) : Promise.resolve([]),
      market !== 'domestic' ? this.fetchGlobal(trimmed, page) : Promise.resolve([]),
    ]);

    const allRaw: Product[] = [...domesticRaw, ...globalRaw];
    if (allRaw.length === 0) return emptyResult;

    // ── Step 2: FraudFilter Stage 1 (rule-based, $0 cost) ──
    const fraudResult = filterFraudulentProducts(allRaw);
    let cleaned = [...fraudResult.clean, ...fraudResult.flagged]; // flagged still shown with warning

    if (cleaned.length === 0) return emptyResult;

    console.log(`🛡️ FraudFilter: ${fraudResult.stats.removed} removed, ${fraudResult.stats.flagged} flagged out of ${fraudResult.stats.total}`);

    // ── Step 3: AI Filter (page 1 only, needs OpenAI key) ──
    if (page === 1 && process.env.OPENAI_API_KEY && cleaned.length > 0) {
      try {
        cleaned = await filterProducts(trimmed, cleaned);
      } catch (err) {
        console.warn('⚠️ AI Filter failed, using unfiltered results:', err);
      }
    }

    // ── Step 4: CostEngine — Calculate Total Landed Cost ──
    const landedCosts = calculateAllLandedCosts(cleaned, {
      zipcode: options?.zipcode,
    });

    // Enrich products with landed cost data
    const enriched: Product[] = cleaned.map(product => {
      const lc = landedCosts.get(product.id);
      if (lc) {
        return {
          ...product,
          totalPrice: lc.totalLandedCost,
          shippingPrice: lc.shippingCost,
        };
      }
      return product;
    });

    // ── Step 5: ScoringEngine — Best/Fastest/Cheapest ──
    const scoringResult = scoreProducts(enriched, {
      landedCosts,
      query: trimmed,
      priceSpeedBalance: options?.priceSpeedBalance,
    });

    // Use bestSorted as default order
    const results: Product[] = scoringResult.bestSorted as Product[];

    // Count by category (direct field check, no string matching)
    const domesticCount = results.filter(p => p.category === 'domestic' || p.shipping === 'Domestic').length;
    const internationalCount = results.length - domesticCount;

    return {
      results,
      total: results.length,
      metadata: {
        domesticCount,
        internationalCount,
        tabSummary: scoringResult.tabSummary,
        fraudStats: {
          removed: fraudResult.stats.removed,
          flagged: fraudResult.stats.flagged,
          removeReasons: fraudResult.stats.removeReasons,
        },
      },
    };
  }

  /** Domestic: Amazon + Walmart 병렬 호출 (각 10초 개별 타임아웃). */
  private async fetchDomestic(query: string, page: number): Promise<Product[]> {
    const [amazonResults, walmartResults] = await Promise.allSettled([
      withProviderTimeout(amazonProvider.search(query, page), 'Amazon'),
      withProviderTimeout(walmartProvider.search(query, page), 'Walmart'),
    ]);

    const amazon = amazonResults.status === 'fulfilled' ? (amazonResults.value ?? []) : [];
    const walmart = walmartResults.status === 'fulfilled' ? (walmartResults.value ?? []) : [];

    if (amazonResults.status === 'rejected') {
      console.error('❌ SearchService: Amazon error:', amazonResults.reason);
    }
    if (walmartResults.status === 'rejected') {
      console.error('❌ SearchService: Walmart error:', walmartResults.reason);
    }

    console.log(`🛒 Domestic: Amazon ${amazon.length} + Walmart ${walmart.length} = ${amazon.length + walmart.length}`);
    return [...amazon, ...walmart];
  }

  /** Global: AliExpress + Temu 병렬 호출 */
  private async fetchGlobal(query: string, page: number): Promise<Product[]> {
    // Temu는 Apify Actor라 30초 타임아웃 별도 적용 (Provider 내부에서 관리)
    const [aliResults, temuResults] = await Promise.allSettled([
      withProviderTimeout(aliExpressProvider.search(query, page), 'AliExpress'),
      temuProvider.search(query, page), // Temu는 자체 30초 타임아웃
    ]);

    const ali = aliResults.status === 'fulfilled' ? (aliResults.value ?? []) : [];
    const temu = temuResults.status === 'fulfilled' ? (temuResults.value ?? []) : [];

    if (aliResults.status === 'rejected') {
      console.error('❌ SearchService: AliExpress error:', aliResults.reason);
    }
    if (temuResults.status === 'rejected') {
      console.error('❌ SearchService: Temu error:', temuResults.reason);
    }

    console.log(`🌏 Global: AliExpress ${ali.length} + Temu ${temu.length}`);
    return [...ali, ...temu];
  }
}

let defaultService: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!defaultService) defaultService = new SearchService();
  return defaultService;
}
