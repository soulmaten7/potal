import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

/**
 * WalmartProvider — Realtime Walmart Data (RapidAPI)
 *
 * Endpoint: GET /product
 * Host:     realtime-walmart-data.p.rapidapi.com
 *
 * US Domestic provider. Walmart 상품은 항상 Domestic 분류.
 * Walmart+ 여부에 따라 무료 배송 / 2-day 추정.
 */

// ── Affiliate ──
const WALMART_AFFILIATE_ID = process.env.WALMART_AFFILIATE_ID?.trim() || '';

function appendWalmartAffiliate(url: string): string {
  if (!WALMART_AFFILIATE_ID) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}affiliateId=${encodeURIComponent(WALMART_AFFILIATE_ID)}`;
}

function buildWalmartLink(url: string | undefined, query: string): string {
  const base = (url && typeof url === 'string' && url.startsWith('http'))
    ? url
    : `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
  return appendWalmartAffiliate(base);
}

// ── Price parsing ──
function normalizePrice(raw: unknown): string {
  if (raw == null) return '$0.00';
  const s = String(raw).trim().replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

function parsePriceToNum(priceStr: string): number {
  const s = String(priceStr).replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

// ── Image normalization ──
function normalizeImage(item: Record<string, unknown>): string {
  const keys = [
    'imageUrl',
    'image',
    'thumbnailImage',
    'productImage',
    'mediumImage',
    'largeImage',
    'thumbnail',
    'productPageUrl', // fallback: won't be image but prevents crash
  ];
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().startsWith('http') && !v.includes('walmart.com/ip/')) return v.trim();
  }
  // Try nested images array
  const images = item.images ?? item.imageEntities;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
    if (typeof first === 'object' && first !== null) {
      const url = (first as Record<string, unknown>).thumbnailImage ?? (first as Record<string, unknown>).largeImage ?? (first as Record<string, unknown>).url;
      if (typeof url === 'string' && url.startsWith('http')) return url;
    }
  }
  return 'https://placehold.co/400x400?text=Walmart';
}

// ── Shipping parsing ──
function parseShippingCost(item: Record<string, unknown>): number {
  const raw = item.shippingCost ?? item.shipping_cost ?? item.deliveryPrice;
  if (raw == null || raw === '') return 0;
  const s = String(raw).trim().toLowerCase();
  if (s.includes('free') || s === '0' || s === '$0' || s === '$0.00') return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

// ── Map API item → Product ──
function mapItemToProduct(
  item: Record<string, unknown>,
  index: number,
  searchQuery: string
): Product {
  const price = normalizePrice(
    item.price ?? item.currentPrice ?? item.salePrice ?? item.offerPrice ?? item.minPrice ?? 0
  );
  const priceNum = parsePriceToNum(price);
  const shippingPrice = parseShippingCost(item);
  const totalPrice = priceNum + shippingPrice;

  const name = String(
    item.name ?? item.title ?? item.productName ?? 'Unknown Product'
  ).trim();

  const itemId = String(
    item.usItemId ?? item.productId ?? item.id ?? `wmt_${index}`
  );

  const link = buildWalmartLink(
    (item.canonicalUrl ?? item.productPageUrl ?? item.url ?? item.link) as string | undefined,
    searchQuery
  );

  const rating = parseFloat(String(item.averageRating ?? item.rating ?? item.stars ?? 0)) || 0;
  const reviews = parseInt(String(item.numberOfReviews ?? item.numReviews ?? item.reviewCount ?? item.totalReviewCount ?? 0), 10) || 0;
  const trustScore = Math.min(100, Math.round(rating * 20 + (reviews > 500 ? 10 : 0)));

  // Walmart+ / 2-day shipping detection
  const isTwoDayShipping = !!(
    item.twoDay === true ||
    item.twoDayShippingEligible === true ||
    String(item.shippingText ?? item.fulfillment ?? '').toLowerCase().includes('2-day') ||
    String(item.shippingText ?? item.fulfillment ?? '').toLowerCase().includes('free shipping')
  );
  const parsedDeliveryDays = isTwoDayShipping ? 2 : 5;

  const brand = String(item.brandName ?? item.brand ?? '').trim() || undefined;

  return {
    id: `walmart_${itemId}`,
    name,
    price,
    parsedPrice: priceNum,
    image: normalizeImage(item),
    site: 'Walmart',
    shipping: 'Domestic' as const,
    category: 'domestic' as const,
    link,
    deliveryDays: isTwoDayShipping ? 'Free 2-Day Shipping' : '3-5 Business Days',
    parsedDeliveryDays,
    shippingPrice,
    totalPrice,
    trustScore,
    rating,
    reviewCount: reviews,
    brand,
  };
}

export class WalmartProvider implements SearchProvider {
  readonly name = 'Walmart';
  readonly type = 'domestic' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    const host = process.env.RAPIDAPI_HOST_WALMART ?? 'realtime-walmart-data.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey?.trim()) {
      console.warn('⚠️ [Walmart] RAPIDAPI_KEY not set');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    // AI 인텔리전스: 검색어 정제
    const queryForApi = refineQuery(trimmed) || trimmed;
    const priceIntent = detectPriceIntent(trimmed);

    // Realtime Walmart Data — GET /search?keyword=...&page=...&sort=best_match
    // RapidAPI Code Snippet 확인 완료: /search (NOT /product)
    const endpoints = [
      { path: '/search', params: { keyword: queryForApi, page: String(page), sort: 'best_match' } },
    ];

    for (const ep of endpoints) {
      try {
        const url = new URL(`https://${host}${ep.path}`);
        for (const [k, v] of Object.entries(ep.params)) {
          url.searchParams.set(k, v);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.warn(`⚠️ [WalmartProvider] ${res.status} from ${ep.path}:`, errBody.slice(0, 200));
          continue;
        }

        const data = (await res.json()) as Record<string, unknown>;

        // 진단 로그: 응답 구조 확인
        const topKeys = Object.keys(data).slice(0, 10).join(', ');
        console.log(`🔍 [WalmartProvider] ${ep.path} response keys: [${topKeys}]`);

        // Parse items from various possible response shapes
        let items: unknown[] = [];
        const dataAny = data as any;

        if (Array.isArray(data.results)) {
          items = data.results as unknown[];
        } else if (Array.isArray(dataAny.item?.props?.pageProps?.initialData?.searchResult?.itemStacks?.[0]?.items)) {
          items = dataAny.item.props.pageProps.initialData.searchResult.itemStacks[0].items;
        } else if (Array.isArray(dataAny.item?.items)) {
          items = dataAny.item.items;
        } else if (Array.isArray(data.items)) {
          items = data.items as unknown[];
        } else if (Array.isArray(data.products)) {
          items = data.products as unknown[];
        } else if (Array.isArray(data.searchResults)) {
          items = data.searchResults as unknown[];
        } else if (Array.isArray(data.data)) {
          items = data.data as unknown[];
        } else {
          for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
              items = val;
              break;
            }
          }
        }

        const list = items.filter((i): i is Record<string, unknown> => i != null && typeof i === 'object');

        if (list.length === 0) continue;

        let products = list.map((item, index) => mapItemToProduct(item, index, queryForApi));

        // 가격 필터
        if (priceIntent != null && priceIntent.maxPrice > 0) {
          products = products.filter((p) => {
            const num = parsePriceToNumber(p.price);
            return num != null && num <= priceIntent.maxPrice;
          });
        }

        if (products.length > 0) {
          console.log(`✅ [WalmartProvider] ${products.length} products from ${ep.path}`);
          return products;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('abort')) {
          console.warn(`⏱️ [WalmartProvider] Timeout: ${ep.path}`);
        } else {
          console.error(`❌ [WalmartProvider] Error: ${ep.path}`, msg);
        }
      }
    }

    console.warn('⚠️ [WalmartProvider] All endpoints returned 0 results');
    return [];
  }
}
