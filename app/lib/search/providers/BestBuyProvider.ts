import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

/**
 * BestBuyProvider — RapidAPI Best Buy Data Service
 *
 * Host: bestbuy-usa.p.rapidapi.com
 * Endpoint: GET /product/search (or /search)
 *
 * US Domestic provider. Best Buy 상품은 항상 Domestic 분류.
 * Geek Squad / Store Pickup 여부 추정.
 */

// ── Affiliate ──
const BESTBUY_AFFILIATE_ID = process.env.BESTBUY_AFFILIATE_ID?.trim() || '';

function appendBestBuyAffiliate(url: string): string {
  if (!BESTBUY_AFFILIATE_ID) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}irclickid=${encodeURIComponent(BESTBUY_AFFILIATE_ID)}`;
}

function buildBestBuyLink(url: string | undefined, query: string): string {
  const base = (url && typeof url === 'string' && url.startsWith('http'))
    ? url
    : `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`;
  return appendBestBuyAffiliate(base);
}

// ── Price parsing ──
function normalizePrice(raw: unknown): string {
  if (raw == null) return '$0.00';
  const s = String(raw).trim().replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

function parsePriceNum(priceStr: string): number {
  const s = String(priceStr).replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

// ── Image normalization ──
function normalizeImage(item: Record<string, unknown>): string {
  const keys = [
    'image', 'thumbnailImage', 'imageUrl', 'productImage',
    'mediumImage', 'largeImage', 'thumbnail', 'img',
  ];
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().startsWith('http')) return v.trim();
  }
  // Try nested images
  const images = item.images ?? item.imageEntities;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
    if (typeof first === 'object' && first !== null) {
      const url = (first as Record<string, unknown>).href ?? (first as Record<string, unknown>).url;
      if (typeof url === 'string' && url.startsWith('http')) return url;
    }
  }
  return 'https://placehold.co/400x400?text=BestBuy';
}

// ── Shipping parsing ──
function parseShippingCost(item: Record<string, unknown>): number {
  const raw = item.shippingCost ?? item.shipping ?? item.deliveryPrice;
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
    item.price ?? item.salePrice ?? item.currentPrice ?? item.regularPrice ?? item.offerPrice ?? 0
  );
  const priceNum = parsePriceNum(price);
  const shippingPrice = parseShippingCost(item);
  const totalPrice = priceNum + shippingPrice;

  const name = String(
    item.name ?? item.title ?? item.productName ?? 'Unknown Product'
  ).trim();

  const itemId = String(
    item.sku ?? item.productId ?? item.id ?? `bby_${index}`
  );

  const link = buildBestBuyLink(
    (item.url ?? item.productUrl ?? item.link ?? item.addToCartUrl) as string | undefined,
    searchQuery
  );

  const rating = parseFloat(String(item.customerReviewAverage ?? item.rating ?? item.stars ?? 0)) || 0;
  const reviews = parseInt(String(item.customerReviewCount ?? item.reviewCount ?? item.numReviews ?? 0), 10) || 0;
  const trustScore = Math.min(100, Math.round(rating * 20 + (reviews > 500 ? 10 : 0) + 5)); // +5 for trusted retailer

  // Shipping: Best Buy typically offers free shipping or store pickup
  const isFreeShipping = !!(
    item.freeShipping === true ||
    item.shipping === 'Free' ||
    String(item.shippingText ?? '').toLowerCase().includes('free')
  );
  const parsedDeliveryDays = isFreeShipping ? 3 : 5;

  const brand = String(item.manufacturer ?? item.brand ?? item.brandName ?? '').trim() || undefined;

  return {
    id: `bestbuy_${itemId}`,
    name,
    price,
    parsedPrice: priceNum,
    image: normalizeImage(item),
    site: 'Best Buy',
    shipping: 'Domestic' as const,
    category: 'domestic' as const,
    link,
    deliveryDays: isFreeShipping ? 'Free Shipping · 2-4 Days' : '3-5 Business Days',
    parsedDeliveryDays,
    shippingPrice,
    totalPrice,
    trustScore,
    rating,
    reviewCount: reviews,
    brand,
  };
}

export class BestBuyProvider implements SearchProvider {
  readonly name = 'BestBuy';
  readonly type = 'domestic' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    const host = process.env.RAPIDAPI_HOST_BESTBUY ?? 'bestbuy-usa.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey?.trim()) {
      console.warn('⚠️ [BestBuy] RAPIDAPI_KEY not set');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const queryForApi = refineQuery(trimmed) || trimmed;
    const priceIntent = detectPriceIntent(trimmed);

    // BestBuy USA (Pinto) — GitHub docs: GET /search?query=...&page=...
    const endpoints = [
      { path: '/search', params: { query: queryForApi, page: String(page) } },
      { path: '/search', params: { query: queryForApi } },
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
          console.warn(`⚠️ [BestBuyProvider] ${res.status} from ${ep.path}`);
          continue;
        }

        const data = (await res.json()) as Record<string, unknown>;

        // 진단 로그: 응답 구조 확인
        const topKeys = Object.keys(data).slice(0, 10).join(', ');
        console.log(`🔍 [BestBuyProvider] ${ep.path} response keys: [${topKeys}]`);

        const products = this.parseResponse(data, queryForApi, priceIntent);
        if (products.length > 0) {
          console.log(`✅ [BestBuyProvider] ${products.length} products from ${ep.path}`);
          return products;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('abort')) {
          console.warn(`⏱️ [BestBuyProvider] Timeout: ${ep.path}`);
        }
      }
    }

    console.warn('⚠️ [BestBuyProvider] All endpoints returned 0 results');
    return [];
  }

  private parseResponse(
    data: Record<string, unknown>,
    queryForApi: string,
    priceIntent: ReturnType<typeof detectPriceIntent>
  ): Product[] {
    let items: unknown[] = [];
    const dataAny = data as any;

    // BestBuy Pinto API: {success, message, data: {products: [...]}} 또는 {success, data: [...]}
    // 응답 구조를 더 깊이 탐색
    if (Array.isArray(dataAny.products)) {
      items = dataAny.products;
    } else if (Array.isArray(dataAny.data?.products)) {
      items = dataAny.data.products;
    } else if (Array.isArray(dataAny.data?.items)) {
      items = dataAny.data.items;
    } else if (Array.isArray(dataAny.data?.results)) {
      items = dataAny.data.results;
    } else if (Array.isArray(dataAny.data?.searchResults)) {
      items = dataAny.data.searchResults;
    } else if (Array.isArray(dataAny.items)) {
      items = dataAny.items;
    } else if (Array.isArray(dataAny.results)) {
      items = dataAny.results;
    } else if (Array.isArray(dataAny.data)) {
      items = dataAny.data;
    } else if (dataAny.data && typeof dataAny.data === 'object') {
      // Deep scan inside data object
      const innerData = dataAny.data as Record<string, unknown>;
      const innerKeys = Object.keys(innerData);
      console.log(`🔍 [BestBuyProvider] data inner keys: [${innerKeys.join(', ')}]`);
      for (const key of innerKeys) {
        const val = innerData[key];
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
          items = val;
          console.log(`🔍 [BestBuyProvider] Found products in data.${key} (${val.length} items)`);
          break;
        }
      }
    } else {
      // Deep scan top-level
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
          items = val;
          break;
        }
      }
    }

    const list = items.filter((i): i is Record<string, unknown> =>
      i != null && typeof i === 'object'
    );

    if (list.length === 0) return [];

    let products = list.map((item, index) => mapItemToProduct(item, index, queryForApi));

    // Price filter
    if (priceIntent != null && priceIntent.maxPrice > 0) {
      products = products.filter(p => {
        const num = parsePriceToNumber(p.price);
        return num != null && num <= priceIntent.maxPrice;
      });
    }

    return products;
  }
}
