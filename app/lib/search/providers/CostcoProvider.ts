import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { parsePriceToNumber } from '../searchIntelligence';

/**
 * CostcoProvider — RapidAPI Costco Real-Time Deals API (AffordableAPIS)
 *
 * Host: costco-real-time-deals-api-discounts-ratings-dates.p.rapidapi.com
 * Endpoint: GET /search/{query}
 *
 * US Domestic provider. Costco is the 6th largest US e-commerce retailer (~1.5% market share).
 *
 * Response shape:
 *   Array of deal objects, each with:
 *   id, deal_type, image_url, price, item_name, details, url,
 *   discount, price_after_discount, rating, rating_count, item_number, terms
 */

const API_KEY = process.env.RAPIDAPI_KEY ?? '';
const API_HOST = process.env.RAPIDAPI_HOST_COSTCO ?? 'costco-real-time-deals-api-discounts-ratings-dates.p.rapidapi.com';
const TIMEOUT_MS = 10_000;

interface CostcoItem {
  id: number;
  deal_type: string;
  image_url: string;
  price: string;
  item_name: string;
  details: string;
  url: string;
  discount: string;
  price_after_discount: string;
  rating: string;
  rating_count: number;
  item_number: string;
  terms: string;
  created_at: string;
  event_start: string | null;
  event_end: string | null;
}

export class CostcoProvider implements SearchProvider {
  readonly name = 'Costco';
  readonly type = 'domestic' as const;

  async search(query: string, _page?: number): Promise<Product[]> {
    if (!API_KEY) {
      console.warn('⚠️ [Costco] RAPIDAPI_KEY not set');
      return [];
    }

    const url = `https://${API_HOST}/search/${encodeURIComponent(query)}`;


    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': API_HOST,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`❌ [Costco] HTTP ${res.status}: ${body.slice(0, 300)}`);
        return [];
      }

      // Safe JSON parse
      const text = await res.text();
      if (!text || text.length < 5) {
        console.warn('⚠️ [Costco] Empty response');
        return [];
      }

      let data: CostcoItem[];
      try {
        data = JSON.parse(text);
      } catch {
        console.error('❌ [Costco] Invalid JSON:', text.slice(0, 300));
        return [];
      }

      if (!Array.isArray(data)) {
        console.warn('⚠️ [Costco] Response is not an array:', typeof data);
        return [];
      }

      const products = data
        .map((item) => this.mapToProduct(item))
        .filter((p): p is Product => p !== null);

      return products;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`⏱️ [Costco] Timeout after ${TIMEOUT_MS}ms`);
      } else {
        console.error('❌ [Costco] Fetch error:', err);
      }
      return [];
    }
  }

  private mapToProduct(item: CostcoItem): Product | null {
    const name = item.item_name?.trim();
    if (!name) return null;

    // 가격 결정: discount가 있으면 price_after_discount 사용, 없으면 price 사용
    const discountAmount = parseFloat(item.discount) || 0;
    const afterDiscount = parseFloat(item.price_after_discount) || 0;
    const originalPrice = parseFloat(item.price) || 0;

    // 유효한 가격 결정
    let finalPrice: number;
    if (afterDiscount > 0) {
      finalPrice = afterDiscount;
    } else if (originalPrice > 0) {
      finalPrice = originalPrice;
    } else {
      // 가격이 0이면 "Warehouse-Only" 등 온라인 가격 미공개 상품 → 스킵
      return null;
    }

    const priceStr = `$${finalPrice.toFixed(2)}`;

    // 이미지 URL 검증
    const image = item.image_url?.trim() || '';
    if (!image) return null;

    // URL
    const link = item.url?.trim() || '';
    if (!link) return null;

    // Rating
    const rating = parseFloat(item.rating) || undefined;
    const reviewCount = item.rating_count || undefined;

    // 배송 정보: deal_type으로 추정
    let deliveryDays: string | undefined;
    if (item.deal_type === 'Online-Only') {
      deliveryDays = '3-7 Days';
    } else if (item.deal_type === 'In-Warehouse & Online') {
      deliveryDays = '3-7 Days';
    }
    // Warehouse-Only는 배송 정보 없음 (매장 픽업)

    return {
      id: `costco-${item.id}`,
      name,
      price: priceStr,
      image,
      site: 'Costco',
      shipping: 'Domestic',
      category: 'domestic',
      link,
      rating,
      reviewCount,
      deliveryDays,
      parsedPrice: finalPrice,
      // 할인 정보가 있으면 brand 필드에 표시 (UI에서 활용 가능)
      brand: item.details?.match(/Item \d+/)?.[0] ? undefined : undefined,
    };
  }
}
