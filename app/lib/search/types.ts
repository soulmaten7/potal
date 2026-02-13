import type { Product } from '@/app/types/product';
import type { TabSummary } from './ScoringEngine';

/**
 * 검색 공급자 인터페이스
 * - Amazon, Walmart, eBay, AliExpress 등 교체·추가 시 동일 계약 사용
 * - country/currency params for future global expansion
 */
export interface SearchProvider {
  readonly name: string;
  readonly type: 'domestic' | 'global';
  search(query: string, page?: number, options?: {
    country?: string;
    currency?: string;
  }): Promise<Product[]>;
}

export interface SearchResult {
  results: Product[];
  total: number;
  metadata: {
    domesticCount: number;
    internationalCount: number;
    /** Dynamic tab summary values (Best/Cheapest/Fastest top picks) */
    tabSummary?: TabSummary;
    /** Fraud filter stats */
    fraudStats?: {
      removed: number;
      flagged: number;
      removeReasons: Record<string, number>;
    };
  };
}
