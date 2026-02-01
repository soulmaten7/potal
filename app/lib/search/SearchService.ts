import type { Product } from '@/app/types/product';
import type { SearchResult } from './types';
import { AmazonProvider } from './providers/AmazonProvider';
import { GlobalMockProvider } from './providers/GlobalMockProvider';

const amazonProvider = new AmazonProvider();
const globalMockProvider = new GlobalMockProvider();

/** 정직한 폴백: Amazon 실패 시 단 1개의 Search Link 카드만 반환 (가짜 상품 없음) */
function buildAmazonSearchLinkCard(query: string): Product {
  const encoded = encodeURIComponent((query || '').trim() || 'search');
  return {
    id: 'fallback-amazon',
    name: `View all results for '${(query || '').trim() || 'search'}' on Amazon`,
    price: '',
    image: 'https://placehold.co/400x400?text=Amazon',
    site: 'Amazon',
    shipping: 'Domestic',
    category: 'domestic',
    link: `https://www.amazon.com/s?k=${encoded}&tag=potal-20`,
    deliveryDays: 'Check Site',
  };
}

/**
 * 검색 서비스: Domestic(Amazon) + Global(Direct Search 카드) 병렬 호출 후 합침
 * - Amazon 성공: 실제 상품 | 실패/0건: Search Link 카드 1개만 (정직한 폴백)
 * - Global: 사이트별 Direct Search 카드만 (가짜 상품 없음)
 */
export class SearchService {
  async search(query: string, page: number = 1): Promise<SearchResult> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return { results: [], total: 0, metadata: { domesticCount: 0, internationalCount: 0 } };
    }

    const [domesticProducts, globalProducts] = await Promise.all([
      this.fetchDomestic(trimmed, page),
      globalMockProvider.search(trimmed, page),
    ]);

    const results: Product[] = [...domesticProducts, ...globalProducts];
    const domesticCount = domesticProducts.length;
    const internationalCount = globalProducts.length;

    return {
      results,
      total: results.length,
      metadata: { domesticCount, internationalCount },
    };
  }

  /** Domestic: Amazon 호출, 실패/0건 시 Search Link 카드 1개만 반환 (Mock 미사용) */
  private async fetchDomestic(query: string, page: number): Promise<Product[]> {
    try {
      const list = await amazonProvider.search(query, page);
      if (list.length > 0) return list;
      console.warn('⚠️ SearchService: Amazon returned empty, showing honest fallback card.');
      return [buildAmazonSearchLinkCard(query)];
    } catch (err) {
      console.error('❌ SearchService: Amazon error, showing honest fallback card:', err);
      return [buildAmazonSearchLinkCard(query)];
    }
  }
}

let defaultService: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!defaultService) defaultService = new SearchService();
  return defaultService;
}
