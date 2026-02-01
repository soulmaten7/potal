import type { Product } from '@/app/types/product';

/**
 * 검색 공급자 인터페이스
 * - Amazon, Coupang, Mock 등 교체·추가 시 동일 계약 사용
 */
export interface SearchProvider {
  readonly name: string;
  search(query: string, page?: number): Promise<Product[]>;
}

export interface SearchResult {
  results: Product[];
  total: number;
  metadata: { domesticCount: number; internationalCount: number };
}
