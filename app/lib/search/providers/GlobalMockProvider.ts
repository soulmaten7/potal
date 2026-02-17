import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * GlobalMockProvider — Global 플랫폼 Direct Search Cards
 *
 * 실제 API가 없는 플랫폼(Shein 등)을 위한 "Direct Search Card" 생성.
 * 사용자가 해당 사이트에서 직접 검색하도록 유도하는 CTA 카드.
 *
 * isSearchCard: true → ProductCard에서 별도 UI로 렌더링
 * ScoringEngine/FraudFilter를 건너뜀 (Coordinator에서 마지막에 주입)
 */

interface GlobalSiteConfig {
  site: string;
  estimatedDays: string;
  parsedDeliveryDays: number;
  trustScore: number;
  tagline: string;
  /** SVG data URI or emoji fallback for platform logo */
  logoFallback: string;
  buildLink: (query: string) => string;
}

const GLOBAL_SITES: GlobalSiteConfig[] = [
  // AliExpress — 실제 API 사용 중 (AliExpressProvider), SearchCard 불필요
  // Shein — 실제 API 사용 중 (SheinProvider), SearchCard 불필요
  {
    site: 'Temu',
    estimatedDays: '5-12 Days',
    parsedDeliveryDays: 8,
    trustScore: 50,
    tagline: 'Team up, price down — Compare prices on Temu',
    logoFallback: 'https://img.temu.com/favicon.ico',
    buildLink: (q) => {
      const affiliate = process.env.TEMU_AFFILIATE_CODE;
      const base = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(q)}`;
      if (!affiliate) return base;
      return `${base}&aff_code=${encodeURIComponent(affiliate)}`;
    },
  },
];

export class GlobalMockProvider implements SearchProvider {
  readonly name = 'GlobalMock';
  readonly type = 'global' as const;

  async search(query: string, _page?: number): Promise<Product[]> {
    const q = (query || '').trim() || 'search';

    return GLOBAL_SITES.map((config) => ({
      id: `direct-search-${config.site.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Search "${q}" on ${config.site}`,
      price: '-',
      image: config.logoFallback,
      site: config.site,
      shipping: 'International' as const,
      category: 'international' as const,
      link: config.buildLink(q),
      deliveryDays: config.estimatedDays,
      parsedDeliveryDays: config.parsedDeliveryDays,
      shippingPrice: 0,
      totalPrice: 0,
      parsedPrice: 0,
      trustScore: config.trustScore,
      bestScore: 0,
      rating: 0,
      reviewCount: 0,
      // ── Search Card 전용 ──
      isSearchCard: true,
      searchCardTagline: config.tagline,
    }));
  }
}
