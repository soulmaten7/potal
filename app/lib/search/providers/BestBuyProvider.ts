/**
 * BestBuyProvider — Best Buy 공식 Products API 기반
 *
 * 기존 Serper 방식 → Best Buy 공식 API 전환 (2026-02-27)
 * API 문서: https://bestbuyapis.github.io/api-documentation/
 * API 키 발급: https://developer.bestbuy.com/ (무료)
 *
 * Domestic provider. 배송: $35+ 무료배송, 일반 3-7일
 * 멤버십: My Best Buy Plus ($49.99/yr), Total ($179.99/yr)
 */
import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

function normalizePrice(value: unknown): string {
  if (value == null) return '$0.00';
  const n = parseFloat(String(value));
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

function parsePriceToNum(value: unknown): number {
  if (value == null) return 0;
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Best Buy API 응답 → Product 매핑
 */
function mapItemToProduct(
  item: Record<string, unknown>,
  index: number,
  searchQuery: string
): Product {
  // 가격: salePrice 우선, 없으면 regularPrice
  const rawPrice = item.salePrice ?? item.regularPrice ?? 0;
  const price = normalizePrice(rawPrice);
  const priceNum = parsePriceToNum(rawPrice);

  // 배송비: freeShipping 이면 0, 아니면 shippingCost 사용
  const freeShipping = item.freeShipping === true;
  const shippingPrice = freeShipping ? 0 : parsePriceToNum(item.shippingCost);
  const totalPrice = priceNum + shippingPrice;

  // 상품명
  const name = String(item.name ?? 'Unknown Product').trim();

  // SKU (고유 식별자)
  const sku = String(item.sku ?? `bestbuy_${index}`);

  // 이미지: largeImage 우선 → image → thumbnailImage
  const image =
    (typeof item.largeImage === 'string' && item.largeImage) ||
    (typeof item.image === 'string' && item.image) ||
    (typeof item.thumbnailImage === 'string' && item.thumbnailImage) ||
    '';

  // 상품 URL
  const rawUrl = item.url ?? item.mobileUrl;
  const link = typeof rawUrl === 'string' && rawUrl.startsWith('http')
    ? rawUrl
    : `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(searchQuery)}`;

  // 리뷰/평점
  const rating = parseFloat(String(item.customerReviewAverage ?? 0)) || 0;
  const reviewCount = parseInt(String(item.customerReviewCount ?? 0), 10) || 0;
  const trustScore = Math.min(100, Math.round(rating * 20 + (reviewCount > 100 ? 10 : 0)));

  // 배송 기간: freeShipping + onlineAvailability 기반 추정
  const onlineAvailable = item.onlineAvailability === true;
  const parsedDeliveryDays = freeShipping ? 3 : 5;
  const deliveryDays = freeShipping ? 'Free Shipping 3-5 Days' : '3-7 Business Days';

  // 브랜드
  const brand = (typeof item.manufacturer === 'string' && item.manufacturer.trim()) || undefined;

  return {
    id: `bestbuy_${sku}`,
    name,
    price,
    parsedPrice: priceNum,
    image,
    site: 'Best Buy',
    shipping: 'Domestic' as const,
    category: 'domestic' as const,
    link,
    deliveryDays,
    parsedDeliveryDays,
    shippingPrice,
    totalPrice,
    trustScore,
    rating,
    reviewCount,
    brand,
  };
}

export class BestBuyProvider implements SearchProvider {
  readonly name = 'Best Buy';
  readonly type = 'domestic' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    const apiKey = process.env.BESTBUY_API_KEY?.trim();
    if (!apiKey) {
      console.warn('⚠️ [Best Buy] BESTBUY_API_KEY not set');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    // AI 인텔리전스: 검색어 정제
    const queryForApi = refineQuery(trimmed) || trimmed;
    const priceIntent = detectPriceIntent(trimmed);

    try {
      // Best Buy Products API: keyword search + 핵심 필드만 요청
      const url = new URL('https://api.bestbuy.com/v1/products');

      // 검색 파라미터
      const params = url.searchParams;
      params.set('search', queryForApi);
      params.set('format', 'json');
      params.set('apiKey', apiKey);
      params.set('pageSize', '25');
      params.set('page', String(page));
      params.set('show', [
        'sku', 'name', 'salePrice', 'regularPrice',
        'image', 'largeImage', 'thumbnailImage',
        'url', 'mobileUrl',
        'freeShipping', 'shippingCost',
        'customerReviewAverage', 'customerReviewCount',
        'manufacturer', 'onlineAvailability',
        'categoryPath',
      ].join(','));
      // 온라인 구매 가능 + 가격 있는 상품만
      params.set('sort', 'bestSellingRank.asc');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.error(`❌ [Best Buy] HTTP ${res.status}`);
        return [];
      }

      const data = (await res.json()) as Record<string, unknown>;
      const items = data.products;
      const list = Array.isArray(items) ? items : [];

      let products = list.map((item: Record<string, unknown>, index: number) =>
        mapItemToProduct(item, index, queryForApi)
      );

      // $0 상품 제거
      products = products.filter(p => (p.parsedPrice ?? 0) > 0);

      // 이미지 없는 상품 제거
      products = products.filter(p => p.image && p.image.length > 0);

      // AI 인텔리전스: 가격 제한 의도 필터
      if (priceIntent != null && priceIntent.maxPrice > 0) {
        products = products.filter((p) => {
          const num = parsePriceToNumber(p.price);
          return num != null && num <= priceIntent.maxPrice;
        });
      }

      return products;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        console.warn('⏱️ [Best Buy] Timeout (10s)');
      } else {
        console.error('❌ [Best Buy] Fetch error:', msg);
      }
      return [];
    }
  }
}
