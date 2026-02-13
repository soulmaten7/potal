import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * GlobalMockProvider — Global 플랫폼 Direct Search Cards
 *
 * 실제 API가 없으므로 가짜 상품을 만들지 않음.
 * 대신 각 플랫폼의 특성(배송일, 일반적 가격대, 신뢰도)을 반영한
 * "Direct Search Card"를 생성 → 사용자가 해당 사이트에서 직접 검색하도록 유도.
 *
 * TODO: AliExpress/Temu API 연동 시 실제 상품 데이터로 교체
 */

interface GlobalSiteConfig {
  site: string;
  estimatedDays: string;
  parsedDeliveryDays: number;
  trustScore: number;
  tagline: string;
  buildLink: (query: string) => string;
}

const GLOBAL_SITES: GlobalSiteConfig[] = [
  {
    site: 'AliExpress',
    estimatedDays: '7-15 Days',
    parsedDeliveryDays: 11,
    trustScore: 55,
    tagline: 'Lowest prices, factory direct',
    buildLink: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`,
  },
  {
    site: 'Temu',
    estimatedDays: '5-12 Days',
    parsedDeliveryDays: 8,
    trustScore: 50,
    tagline: 'Team up, price down',
    buildLink: (q) => `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(q)}`,
  },
  {
    site: 'Shein',
    estimatedDays: '7-14 Days',
    parsedDeliveryDays: 10,
    trustScore: 48,
    tagline: 'Fast fashion, global shipping',
    buildLink: (q) => `https://us.shein.com/pdsearch/${encodeURIComponent(q)}`,
  },
];

export class GlobalMockProvider implements SearchProvider {
  readonly name = 'GlobalMock';
  readonly type = 'global' as const;

  async search(query: string, _page?: number): Promise<Product[]> {
    const q = (query || '').trim() || 'search';

    return GLOBAL_SITES.map((config) => ({
      id: `direct-search-${config.site.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Search "${q}" on ${config.site} — ${config.tagline}`,
      price: 'Compare',
      image: `https://logo.clearbit.com/${config.site.toLowerCase()}.com`,
      site: config.site,
      shipping: 'International' as const,
      category: 'international' as const,
      link: config.buildLink(q),
      deliveryDays: config.estimatedDays,
      parsedDeliveryDays: config.parsedDeliveryDays,
      shippingPrice: 0,
      totalPrice: 0,
      trustScore: config.trustScore,
      bestScore: 0, // Search cards don't get scored
    }));
  }
}
