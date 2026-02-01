import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * 정직한 폴백: Global(테무/알리/쉬인) API가 없으므로 가짜 상품을 만들지 않음.
 * 사이트별 **딱 1개씩** 'Direct Search Card'만 반환 (해당 사이트 검색 페이지로 이동).
 */
function buildSearchLink(site: string, query: string): string {
  const raw = (query || '').trim() || 'search';
  const encoded = encodeURIComponent(raw);
  switch (site) {
    case 'AliExpress':
      return `https://www.aliexpress.com/wholesale?SearchText=${encoded}`;
    case 'Temu':
      return `https://www.temu.com/search_result.html?search_key=${encoded}`;
    case 'Shein':
      return `https://us.shein.com/pdsearch/${encoded}`;
    default:
      return '#';
  }
}

const GLOBAL_SITES: { site: string }[] = [
  { site: 'AliExpress' },
  { site: 'Temu' },
  { site: 'Shein' },
];

export class GlobalMockProvider implements SearchProvider {
  readonly name = 'GlobalMock';

  async search(query: string, _page?: number): Promise<Product[]> {
    const q = (query || '').trim() || 'search';

    return GLOBAL_SITES.map(({ site }, index) => ({
      id: `direct-search-${site.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Search '${q}' on ${site}`,
      price: '',
      image: `https://placehold.co/400x400?text=${encodeURIComponent(site)}`,
      site,
      shipping: 'International' as const,
      category: 'international' as const,
      link: buildSearchLink(site, q),
      deliveryDays: 'Check Site',
    }));
  }
}
