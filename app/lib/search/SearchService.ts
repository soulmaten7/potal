import type { Product } from '@/app/types/product';
import type { SearchResult } from './types';
import { AmazonProvider } from './providers/AmazonProvider';
import { GlobalMockProvider } from './providers/GlobalMockProvider';
import { filterProducts } from './AIFilterService';
import { filterFraudulentProducts } from './FraudFilter';
import { calculateAllLandedCosts } from './CostEngine';
import { scoreProducts } from './ScoringEngine';
import type { ScoredProduct } from './ScoringEngine';

const amazonProvider = new AmazonProvider();
const globalMockProvider = new GlobalMockProvider();

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

    // Count by shipping type
    const domesticCount = results.filter(p => {
      const val = (p.shipping || (p as any).category || '').toString().toLowerCase();
      return val.includes('domestic');
    }).length;
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

  /** Domestic: Amazon 호출. 실패/0건 시 빈 배열 반환 */
  private async fetchDomestic(query: string, page: number): Promise<Product[]> {
    try {
      const list = await amazonProvider.search(query, page);
      return list ?? [];
    } catch (err) {
      console.error('❌ SearchService: Amazon error, returning empty.', err);
      return [];
    }
  }

  /** Global: Direct Search cards (will be replaced with real APIs later) */
  private async fetchGlobal(query: string, page: number): Promise<Product[]> {
    try {
      const list = await globalMockProvider.search(query, page);
      return list ?? [];
    } catch (err) {
      console.error('❌ SearchService: Global error, returning empty.', err);
      return [];
    }
  }
}

let defaultService: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!defaultService) defaultService = new SearchService();
  return defaultService;
}
