import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

/**
 * EbayProvider — RapidAPI Real-Time eBay Data
 *
 * Host: real-time-ebay-data.p.rapidapi.com
 * Endpoint: GET /search (or /search/{query})
 *
 * US Domestic provider. eBay is the 3rd largest US e-commerce marketplace.
 * Affiliate: eBay Partner Network (campaign ID in env).
 *
 * Response shape:
 *   body.products[] — each product has nested price, customerReviews, etc.
 */

const API_KEY = process.env.RAPIDAPI_KEY ?? '';
const API_HOST = process.env.RAPIDAPI_HOST_EBAY ?? 'real-time-ebay-data.p.rapidapi.com';
const CAMPAIGN_ID = process.env.EBAY_CAMPAIGN_ID ?? '';
const TIMEOUT_MS = 12_000;

// ── Price parsing (handles "$94.99" format from API) ──
function extractPrice(priceObj: unknown): { priceStr: string; priceNum: number } {
  if (!priceObj || typeof priceObj !== 'object') return { priceStr: '$0.00', priceNum: 0 };

  const p = priceObj as Record<string, unknown>;
  const current = p.current as Record<string, unknown> | undefined;

  // Try current.from first (lowest price), then current.to
  let raw = '';
  if (current) {
    raw = String(current.from ?? current.to ?? '').trim();
  }
  // Fallback to hotness (lowest price string)
  if (!raw) {
    // Check parent for hotness
    raw = '';
  }

  if (!raw) return { priceStr: '$0.00', priceNum: 0 };

  const cleaned = raw.replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n) || n <= 0) return { priceStr: '$0.00', priceNum: 0 };
  return { priceStr: `$${n.toFixed(2)}`, priceNum: n };
}

function parsePriceFromString(raw: string): number {
  const cleaned = String(raw).replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

// ── Image normalization ──
function normalizeImage(item: Record<string, unknown>): string {
  // Primary: item.image
  if (typeof item.image === 'string' && item.image.startsWith('http')) {
    return item.image.trim();
  }
  // Fallback keys
  const keys = ['imageUrl', 'thumbnailImage', 'thumbnail', 'galleryURL', 'img'];
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().startsWith('http')) return v.trim();
  }
  return '';
}

// ── Affiliate link ──
function buildEbayLink(url: string | undefined, query: string): string {
  if (url && typeof url === 'string' && url.startsWith('http')) {
    if (CAMPAIGN_ID) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}campid=${CAMPAIGN_ID}&toolid=10001`;
    }
    return url;
  }
  const base = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
  return CAMPAIGN_ID ? `${base}&campid=${CAMPAIGN_ID}&toolid=10001` : base;
}

// ── Shipping parsing from shippingMessage ──
function parseShipping(item: Record<string, unknown>): {
  shippingPrice: number;
  isFree: boolean;
  deliveryDays: string;
  deliveryLabel: string;
  parsedDeliveryDays: number;
} {
  const msg = String(item.shippingMessage ?? '').trim().toLowerCase();

  let shippingPrice = 0;
  let isFree = false;
  let deliveryDays = '5-10 Days';
  let deliveryLabel = 'Standard';
  let parsedDeliveryDays = 7;

  // Free shipping detection
  if (msg.includes('free')) {
    isFree = true;
    shippingPrice = 0;

    // Parse delivery time from "Free delivery in X-Y days"
    const daysMatch = msg.match(/(\d+)-(\d+)\s*days?/i);
    if (daysMatch) {
      const low = parseInt(daysMatch[1], 10);
      const high = parseInt(daysMatch[2], 10);
      deliveryDays = `${low}-${high} Days`;
      deliveryLabel = `Free Shipping · ${low}-${high} Days`;
      parsedDeliveryDays = Math.ceil((low + high) / 2);
    } else {
      deliveryDays = '3-7 Days';
      deliveryLabel = 'Free Shipping';
      parsedDeliveryDays = 5;
    }
  } else if (msg.startsWith('+')) {
    // "+$7.99 delivery" format
    const priceMatch = msg.match(/\$?([\d.]+)/);
    if (priceMatch) {
      shippingPrice = parseFloat(priceMatch[1]) || 0;
    }
    deliveryDays = '5-10 Days';
    deliveryLabel = `+$${shippingPrice.toFixed(2)} Shipping`;
    parsedDeliveryDays = 7;
  }

  return { shippingPrice, isFree, deliveryDays, deliveryLabel, parsedDeliveryDays };
}

// ── Rating parsing from customerReviews ──
function parseReviews(item: Record<string, unknown>): { rating: number; reviewCount: number } {
  const reviews = item.customerReviews as Record<string, unknown> | undefined;
  if (!reviews) return { rating: 0, reviewCount: 0 };

  // Parse rating from "5.0 out of 5 stars." or "4.5 out of 5 stars."
  let rating = 0;
  const reviewStr = String(reviews.review ?? '');
  const ratingMatch = reviewStr.match(/([\d.]+)\s*out\s*of\s*5/i);
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1]) || 0;
  }

  const reviewCount = parseInt(String(reviews.count ?? 0), 10) || 0;

  return { rating: Math.min(rating, 5), reviewCount };
}

// ── Seller info parsing ──
function parseSellerInfo(item: Record<string, unknown>): string {
  const raw = String(item.sellerInfo ?? '').trim();
  if (!raw) return 'eBay Seller';

  // Extract seller name from "cocosprinkles 99.8% positive (36.6K)"
  const parts = raw.split(/\s+/);
  return parts[0] || 'eBay Seller';
}

// ── Condition from subTitles ──
function parseCondition(item: Record<string, unknown>): string {
  const subTitles = item.subTitles;
  if (!Array.isArray(subTitles)) return '';

  for (const sub of subTitles) {
    const s = String(sub).trim();
    if (/pre-owned|refurbished|open box|new|used|good|excellent|very good|acceptable/i.test(s)) {
      return s;
    }
  }
  return '';
}

export class EbayProvider implements SearchProvider {
  readonly name = 'eBay';
  readonly type = 'domestic' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    if (!API_KEY) {
      console.warn('⚠️ [EbayProvider] No RAPIDAPI_KEY');
      return [];
    }

    const q = refineQuery(query);
    const priceIntent = detectPriceIntent(query);

    const headers = {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST,
    };

    // Real-Time eBay Data API — /search_more only (tld required, /search removed by API provider)
    const endpoints = [
      `https://${API_HOST}/search_more?query=${encodeURIComponent(q)}&tld=com&page=${page}`,
      `https://${API_HOST}/search_more?query=${encodeURIComponent(q)}&tld=com`,
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.error(`❌ [EbayProvider] ${res.status} from ${url}`, errBody.slice(0, 300));
          continue;
        }

        const data = await res.json();
        const products = this.parseResponse(data, q, priceIntent);

        if (products.length > 0) {
          console.log(`✅ [eBay] ${products.length} products`);
          return products;
        } else {
          // 디버그: 응답은 200인데 파싱 결과 0건일 때 — 응답 구조 확인용
          const keys = data && typeof data === 'object' ? Object.keys(data) : [];
          console.warn(`⚠️ [eBay] 200 OK but 0 parsed products. Response keys: [${keys.join(',')}], sample: ${JSON.stringify(data).slice(0, 200)}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('abort')) {
          console.warn(`⏱️ [EbayProvider] Timeout: ${url}`);
        } else {
          console.error(`❌ [EbayProvider] Error: ${url}`, msg);
        }
      }
    }

    console.warn('⚠️ [EbayProvider] All endpoints returned 0 results');
    return [];
  }

  private parseResponse(data: unknown, queryForApi: string, priceIntent: ReturnType<typeof detectPriceIntent>): Product[] {
    if (!data || typeof data !== 'object') return [];

    const d = data as Record<string, unknown>;

    // ── Real-Time eBay Data: multiple response shapes ──
    let items: Record<string, unknown>[] = [];

    // Primary: body.products (Real-Time eBay Data API)
    const body = d.body as Record<string, unknown> | undefined;
    if (body && Array.isArray(body.products)) {
      items = body.products;
    }
    // Fallback: direct top-level arrays
    else if (Array.isArray(d.products)) items = d.products;
    else if (Array.isArray(d.results)) items = d.results;
    else if (Array.isArray(d.items)) items = d.items;
    else if (Array.isArray(d.searchResult)) items = d.searchResult;
    else if (d.data && typeof d.data === 'object') {
      const inner = d.data as Record<string, unknown>;
      if (Array.isArray(inner.results)) items = inner.results;
      else if (Array.isArray(inner.products)) items = inner.products;
      else if (Array.isArray(inner.items)) items = inner.items;
    }
    else if (Array.isArray(data)) items = data;

    // Deep scan: walk ALL keys recursively to find ANY array with 3+ objects
    if (items.length === 0) {
      const findItems = (obj: Record<string, unknown>, depth: number, path: string): Record<string, unknown>[] | null => {
        if (depth > 5) return null;
        for (const [key, val] of Object.entries(obj)) {
          if (Array.isArray(val) && val.length >= 2 && typeof val[0] === 'object' && val[0] !== null) {
            const first = val[0] as Record<string, unknown>;
            const firstKeys = Object.keys(first);
            // Accept any array of objects with 3+ keys (very relaxed)
            if (firstKeys.length >= 3) {
              return val;
            }
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const found = findItems(val as Record<string, unknown>, depth + 1, `${path}.${key}`);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findItems(d, 0, 'root');
      if (found) items = found;
    }

    let products = items
      .slice(0, 30)
      .map((item, idx) => this.mapProduct(item, idx, queryForApi))
      .filter(p => (p.parsedPrice ?? 0) > 0);

    // Price filter
    if (priceIntent != null && priceIntent.maxPrice > 0) {
      products = products.filter(p => {
        const num = parsePriceToNumber(p.price);
        return num != null && num <= priceIntent.maxPrice;
      });
    }

    return products;
  }

  private mapProduct(
    item: Record<string, unknown>,
    idx: number,
    queryForApi: string,
  ): Product {
    const title = String(
      item.title ?? item.name ?? item.product_title ?? item.itemTitle
      ?? item.heading ?? item.productName ?? item.item_title ?? 'eBay Product',
    ).replace(/Opens in a new window or tab$/i, '').trim();

    // Price: try ALL possible structures
    let priceStr = '$0.00';
    let priceNum = 0;

    // 1. Nested price object (price.current.from/to)
    if (item.price && typeof item.price === 'object') {
      const extracted = extractPrice(item.price);
      priceStr = extracted.priceStr;
      priceNum = extracted.priceNum;
    }

    // 2. price as string ("$12.99")
    if (priceNum === 0 && typeof item.price === 'string') {
      priceNum = parsePriceFromString(item.price);
      if (priceNum > 0) priceStr = `$${priceNum.toFixed(2)}`;
    }

    // 3. price as number
    if (priceNum === 0 && typeof item.price === 'number' && item.price > 0) {
      priceNum = item.price;
      priceStr = `$${priceNum.toFixed(2)}`;
    }

    // 4. Hotness field (lowest price as string)
    if (priceNum === 0 && typeof item.hotness === 'string' && item.hotness) {
      priceNum = parsePriceFromString(item.hotness);
      if (priceNum > 0) priceStr = `$${priceNum.toFixed(2)}`;
    }

    // 5. Flat price fields (legacy/alternative APIs)
    if (priceNum === 0) {
      const flatPrice = item.currentPrice ?? item.buyItNowPrice ?? item.sellingPrice
        ?? item.cost ?? item.salePrice ?? item.sale_price ?? item.offerPrice
        ?? item.convertedCurrentPrice ?? item.discountPrice;
      if (flatPrice != null) {
        priceNum = parsePriceFromString(String(flatPrice));
        if (priceNum > 0) priceStr = `$${priceNum.toFixed(2)}`;
      }
    }

    // 6. Deep scan: find any numeric-looking value in known price-like keys
    if (priceNum === 0) {
      for (const [k, v] of Object.entries(item)) {
        if (/price|cost|amount/i.test(k) && v != null) {
          const n = parsePriceFromString(String(v));
          if (n > 0) {
            priceNum = n;
            priceStr = `$${n.toFixed(2)}`;
            break;
          }
        }
      }
    }

    const image = normalizeImage(item);
    const link = buildEbayLink(
      (item.url ?? item.link ?? item.itemUrl ?? item.itemWebUrl) as string | undefined,
      queryForApi,
    );

    const sellerName = parseSellerInfo(item);
    const condition = parseCondition(item);
    const { rating, reviewCount } = parseReviews(item);
    const { shippingPrice, isFree, deliveryDays, deliveryLabel, parsedDeliveryDays } = parseShipping(item);

    const totalPrice = priceNum + shippingPrice;

    // Trust score: eBay is peer-to-peer, slightly lower base trust
    let trustScore = 55;
    if (rating >= 4.5) trustScore += 10;
    if (condition.toLowerCase().includes('new') || condition.toLowerCase().includes('excellent')) trustScore += 5;
    if (isFree) trustScore += 5;
    if (item.topRatedSeller === true) trustScore += 10;

    // Item ID extraction
    const itemId = (() => {
      // Try to extract from URL: /itm/225936405756
      const urlStr = String(item.url ?? '');
      const itmMatch = urlStr.match(/\/itm\/(\d+)/);
      if (itmMatch) return itmMatch[1];
      return String(item.itemId ?? item.id ?? item.epid ?? idx);
    })();

    return {
      id: `ebay-${itemId}-${idx}`,
      name: title,
      price: priceStr,
      image,
      link,
      site: 'eBay',
      seller: sellerName,
      rating: isNaN(rating) ? 0 : Math.min(rating, 5),
      reviewCount: isNaN(reviewCount) ? 0 : reviewCount,
      shipping: 'Domestic' as const,
      category: 'domestic',
      deliveryDays,
      delivery: deliveryLabel,
      is_prime: false,
      badges: condition ? [condition] : [],
      brand: String(item.brand ?? '').trim() || undefined,
      parsedPrice: priceNum,
      parsedDeliveryDays,
      shippingPrice,
      totalPrice,
      trustScore,
    } as unknown as Product;
  }
}

export const ebayProvider = new EbayProvider();
