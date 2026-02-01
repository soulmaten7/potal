import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * 정직한 폴백 정책: 가짜 상품 생성 제거.
 * SearchService는 Amazon 실패 시 Search Link 카드 1개만 사용.
 * 이 Provider는 더 이상 사용되지 않으며, 호환성용으로 빈 배열만 반환.
 */
export class MockProvider implements SearchProvider {
  readonly name = 'Mock';

  async search(_query: string, _page?: number): Promise<Product[]> {
    return [];
  }
}
