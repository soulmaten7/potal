import type { Product } from '@/app/types/product';
import type { SearchResult } from './types';
import { AmazonProvider } from './providers/AmazonProvider';
import { GlobalMockProvider } from './providers/GlobalMockProvider';

const amazonProvider = new AmazonProvider();
const globalMockProvider = new GlobalMockProvider();

/**
 * 검색 서비스: Domestic(Amazon) + Global(Direct Search 카드) 병렬 호출 후 합침
 * - 0건이면 빈 배열만 반환. 가짜/플레이스홀더 카드 없음. 클라이언트 Smart Fallback이 대체 검색 수행.
 */
export class SearchService {
  async search(query: string, page: number = 1): Promise<SearchResult> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return { results: [], total: 0, metadata: { domesticCount: 0, internationalCount: 0 } };
    }

    const domesticProducts = await this.fetchDomestic(trimmed, page);

    if (domesticProducts.length === 0) {
      return { results: [], total: 0, metadata: { domesticCount: 0, internationalCount: 0 } };
    }

    const globalProducts = await globalMockProvider.search(trimmed, page);
    const results: Product[] = [...domesticProducts, ...globalProducts];
    const domesticCount = domesticProducts.length;
    const internationalCount = globalProducts.length;

    return {
      results,
      total: results.length,
      metadata: { domesticCount, internationalCount },
    };
  }

  /** Domestic: Amazon 호출. 실패/0건 시 빈 배열 반환 (가짜 카드 없음) */
  private async fetchDomestic(query: string, page: number): Promise<Product[]> {
    try {
      const list = await amazonProvider.search(query, page);
      return list ?? [];
    } catch (err) {
      console.error('❌ SearchService: Amazon error, returning empty.', err);
      return [];
    }
  }
}

let defaultService: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!defaultService) defaultService = new SearchService();
  return defaultService;
}
