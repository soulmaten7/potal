import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * TemuProvider — Serper Google Shopping API
 *
 * 방식: Serper Shopping API + 검색어에 "temu" 추가 → Temu 상품만 필터링
 * Google Shopping에 Temu가 등록되어 있어 가격/이미지/평점 전부 확보 가능.
 *
 * 기존 Apify Actor 방식은 Temu 403 차단으로 폐기 (2026-02-18~)
 * Serper organic 방식은 가격 미포함으로 부적합 (2026-02-24 확인)
 * → Serper Shopping + "temu" 키워드 방식으로 최종 전환 (2026-02-24)
 *
 * 환경변수: SERPER_API_KEY (필수), TEMU_AFFILIATE_CODE (선택)
 * 비용: $0.001/검색 (무료 2,500건/월 포함)
 *
 * Global(International) provider. 중국→미국 직배송.
 * 배송: 7-15일 기본
 */

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';
const TEMU_AFFILIATE = process.env.TEMU_AFFILIATE_CODE || '';
const TIMEOUT_MS = 10_000;

// ── Affiliate ──
function appendTemuAffiliate(url: string): string {
  if (!TEMU_AFFILIATE) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}aff_code=${encodeURIComponent(TEMU_AFFILIATE)}`;
}

// ── Price parsing ──
function parsePriceStr(raw: string): { priceStr: string; priceNum: number } {
  if (!raw) return { priceStr: '$0.00', priceNum: 0 };
  const cleaned = raw.replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n) || n <= 0) return { priceStr: '$0.00', priceNum: 0 };
  return { priceStr: `$${n.toFixed(2)}`, priceNum: n };
}

// ── Serper Shopping response types ──
interface SerperShoppingItem {
  title?: string;
  source?: string;
  link?: string;
  price?: string;
  imageUrl?: string;
  thumbnail?: string;
  rating?: number;
  ratingCount?: number;
  productId?: string;
  position?: number;
  delivery?: string;
}

interface SerperShoppingResponse {
  shopping?: SerperShoppingItem[];
  searchParameters?: Record<string, unknown>;
}

// ── Map Serper Shopping item → Product ──
function mapShoppingItemToProduct(
  item: SerperShoppingItem,
  index: number,
  query: string,
): Product {
  const title = (item.title || 'Temu Product').trim();

  // Price — structured data from Google Shopping
  const { priceStr, priceNum } = parsePriceStr(item.price || '');

  // Image — Google Shopping provides CDN image URLs
  const image = item.imageUrl || item.thumbnail || '';

  // Link — Google Shopping gives redirect URL; build direct Temu search link as fallback
  // Temu affiliate code는 직접 Temu URL에 추가
  const temuSearchLink = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  const link = appendTemuAffiliate(temuSearchLink);

  // Rating from Google Shopping
  const rating = typeof item.rating === 'number' ? Math.min(item.rating, 5) : 0;
  const reviewCount = typeof item.ratingCount === 'number' ? item.ratingCount : 0;

  // Product ID from Google Shopping
  const productId = item.productId || `temu_${index}`;

  // Trust score
  let trustScore = 40;
  if (rating >= 4.5) trustScore += 15;
  else if (rating >= 4.0) trustScore += 10;
  if (reviewCount > 1000) trustScore += 10;
  else if (reviewCount > 100) trustScore += 5;
  if (priceNum > 0) trustScore += 5;

  // Badges
  const badges: string[] = [];

  return {
    id: `temu-${productId}-${index}`,
    name: title,
    price: priceStr,
    parsedPrice: priceNum,
    image,
    link,
    site: 'Temu',
    seller: 'Temu',
    rating,
    reviewCount,
    shipping: 'International' as const,
    category: 'global' as const,
    deliveryDays: '7-15 Business Days',
    delivery: 'Standard Shipping',
    parsedDeliveryDays: 10,
    shippingPrice: 0,
    totalPrice: priceNum,
    trustScore,
    is_prime: false,
    badges,
    brand: undefined,
  } as unknown as Product;
}

export class TemuProvider implements SearchProvider {
  readonly name = 'Temu';
  readonly type = 'global' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    if (!SERPER_API_KEY) {
      console.warn('⚠️ [TemuProvider] No SERPER_API_KEY — skipping');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Serper Google Shopping API
      // 핵심: 검색어에 "temu"를 추가해야 Temu 상품이 Google Shopping에 노출됨
      const res = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: `${trimmed} temu`,
          gl: 'us',
          hl: 'en',
          num: 30,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(
          `❌ [TemuProvider] Serper ${res.status}:`,
          errBody.slice(0, 300),
        );
        return [];
      }

      const data: SerperShoppingResponse = await res.json();

      if (!data.shopping || data.shopping.length === 0) {
        console.warn('⚠️ [TemuProvider] No shopping results from Serper');
        return [];
      }

      // Filter: Temu 상품만 (source가 "Temu"인 것)
      const temuItems = data.shopping.filter((item) => {
        const source = (item.source || '').toLowerCase();
        return source.includes('temu');
      });

      if (temuItems.length === 0) {
        console.warn('⚠️ [TemuProvider] No Temu products in shopping results');
        return [];
      }

      const products = temuItems
        .slice(0, 20)
        .map((item, i) => mapShoppingItemToProduct(item, i, trimmed))
        .filter((p) => (p.parsedPrice ?? 0) > 0);

      if (products.length > 0) {
        console.log(
          `✅ [TemuProvider] ${products.length} products via Google Shopping`,
        );
      }

      return products;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        console.warn(`⏱️ [TemuProvider] Timeout (${TIMEOUT_MS}ms)`);
      } else {
        console.error(`❌ [TemuProvider] Error:`, msg);
      }
      return [];
    }
  }
}
