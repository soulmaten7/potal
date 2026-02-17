import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

/**
 * TargetProvider — RapidAPI Target (ecommet) API
 *
 * Host: target13.p.rapidapi.com (set via RAPIDAPI_HOST_TARGET env)
 * Endpoint: GET /searchByKeywords
 *
 * US Domestic provider. Target is the 5th largest US e-commerce retailer.
 * Affiliate: Target affiliate program (ID in env).
 *
 * Response shape (ecommet / apidojo API):
 *   search.search_response.products[] — array of ProductSummary objects
 *   Each product has deeply nested item.enrichment, item.product_description,
 *   item.primary_brand, price, ratings_and_reviews, parent, etc.
 */

const API_KEY = process.env.RAPIDAPI_KEY ?? '';
const API_HOST = process.env.RAPIDAPI_HOST_TARGET ?? 'target13.p.rapidapi.com';
const TIMEOUT_MS = 8_000;

// ── Affiliate ──
const TARGET_AFFILIATE_ID = process.env.TARGET_AFFILIATE_ID?.trim() || '';

function appendTargetAffiliate(url: string): string {
  if (!TARGET_AFFILIATE_ID) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}afid=${encodeURIComponent(TARGET_AFFILIATE_ID)}`;
}

// ── HTML entity decode (title often has &#38; &#8482; etc.) ──
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#38;/g, '&')
    .replace(/&#8482;/g, '™')
    .replace(/&#174;/g, '®')
    .replace(/&#169;/g, '©')
    .replace(/&#8364;/g, '€')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// ── Safe nested access helpers ──
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function getNestedString(obj: unknown, path: string): string {
  const val = getNestedValue(obj, path);
  return typeof val === 'string' ? val.trim() : '';
}

function getNestedNumber(obj: unknown, path: string): number {
  const val = getNestedValue(obj, path);
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

// ── Price extraction from ecommet API ──
function extractPrice(product: Record<string, unknown>): { priceStr: string; priceNum: number } {
  // Child product: price.current_retail (exact number)
  const price = product.price as Record<string, unknown> | undefined;
  if (price) {
    const currentRetail = price.current_retail;
    if (typeof currentRetail === 'number' && currentRetail > 0) {
      return { priceStr: `$${currentRetail.toFixed(2)}`, priceNum: currentRetail };
    }

    // Fallback: formatted_current_price ("$5.69" or "$5.69 - $26.99")
    const formatted = String(price.formatted_current_price ?? '');
    if (formatted) {
      // If range like "$5.69 - $26.99", take the lowest
      const rangeMatch = formatted.match(/\$?([\d.]+)/);
      if (rangeMatch) {
        const n = parseFloat(rangeMatch[1]);
        if (!Number.isNaN(n) && n > 0) {
          return { priceStr: `$${n.toFixed(2)}`, priceNum: n };
        }
      }
    }

    // Fallback: reg_retail
    const regRetail = price.reg_retail;
    if (typeof regRetail === 'number' && regRetail > 0) {
      return { priceStr: `$${regRetail.toFixed(2)}`, priceNum: regRetail };
    }
  }

  // Parent price fallback (range)
  const parentPrice = getNestedValue(product, 'parent.price') as Record<string, unknown> | undefined;
  if (parentPrice) {
    const formatted = String(parentPrice.formatted_current_price ?? '');
    const rangeMatch = formatted.match(/\$?([\d.]+)/);
    if (rangeMatch) {
      const n = parseFloat(rangeMatch[1]);
      if (!Number.isNaN(n) && n > 0) {
        return { priceStr: `$${n.toFixed(2)}`, priceNum: n };
      }
    }
  }

  return { priceStr: '$0.00', priceNum: 0 };
}

// ── Image extraction ──
function extractImage(product: Record<string, unknown>): string {
  // Primary: item.enrichment.images.primary_image_url
  const primary = getNestedString(product, 'item.enrichment.images.primary_image_url');
  if (primary && primary.startsWith('http')) return primary;

  // Fallback: item.enrichment.image_info.primary_image.url
  const imageInfo = getNestedString(product, 'item.enrichment.image_info.primary_image.url');
  if (imageInfo && imageInfo.startsWith('http')) return imageInfo;

  // Parent image fallback
  const parentPrimary = getNestedString(product, 'parent.item.enrichment.images.primary_image_url');
  if (parentPrimary && parentPrimary.startsWith('http')) return parentPrimary;

  return '';
}

// ── Link extraction ──
function extractLink(product: Record<string, unknown>, query: string): string {
  // Primary: item.enrichment.buy_url
  const buyUrl = getNestedString(product, 'item.enrichment.buy_url');
  if (buyUrl && buyUrl.startsWith('http')) return appendTargetAffiliate(buyUrl);

  // Parent buy_url fallback
  const parentBuyUrl = getNestedString(product, 'parent.item.enrichment.buy_url');
  if (parentBuyUrl && parentBuyUrl.startsWith('http')) return appendTargetAffiliate(parentBuyUrl);

  // Search page fallback
  return appendTargetAffiliate(
    `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`
  );
}

// ── Rating/Reviews extraction ──
function extractRating(product: Record<string, unknown>): { rating: number; reviewCount: number } {
  // Direct ratings_and_reviews on product
  let avg = getNestedNumber(product, 'ratings_and_reviews.statistics.rating.average');
  let count = getNestedNumber(product, 'ratings_and_reviews.statistics.rating.count');

  // Parent ratings fallback (Variation Child products inherit parent ratings)
  if (avg === 0 && count === 0) {
    avg = getNestedNumber(product, 'parent.ratings_and_reviews.statistics.rating.average');
    count = getNestedNumber(product, 'parent.ratings_and_reviews.statistics.rating.count');
  }

  return {
    rating: Math.min(avg, 5),
    reviewCount: Math.max(Math.round(count), 0),
  };
}

// ── Badges extraction (ornaments + ribbons) ──
function extractBadges(product: Record<string, unknown>): string[] {
  const badges: string[] = [];

  // ornaments: [{ display: "Bestseller" }, { display: "Highly rated" }]
  const ornaments = product.ornaments;
  if (Array.isArray(ornaments)) {
    for (const orn of ornaments) {
      const display = (orn as Record<string, unknown>)?.display;
      if (typeof display === 'string' && display.trim()) {
        badges.push(display.trim());
      }
    }
  }

  // item.ribbons: ["Only At Target"]
  const ribbons = getNestedValue(product, 'item.ribbons');
  if (Array.isArray(ribbons)) {
    for (const r of ribbons) {
      if (typeof r === 'string' && r.trim()) {
        badges.push(r.trim());
      }
    }
  }

  return badges;
}

// ── Seller extraction (marketplace vs Target direct) ──
function extractSeller(product: Record<string, unknown>): string {
  const isMarketplace = getNestedValue(product, 'item.fulfillment.is_marketplace');
  if (isMarketplace === true) {
    // Try product_vendors
    const vendors = getNestedValue(product, 'item.product_vendors');
    if (Array.isArray(vendors) && vendors.length > 0) {
      const name = (vendors[0] as Record<string, unknown>)?.vendor_name;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
    return 'Target Marketplace';
  }
  return 'Target';
}

// ── Delivery estimate (Target $35+ free shipping standard) ──
function estimateDelivery(product: Record<string, unknown>, priceNum: number): {
  days: string;
  label: string;
  parsedDeliveryDays: number;
} {
  // Check scheduled_delivery eligibility
  const scheduledDelivery = getNestedValue(product, 'item.eligibility_rules.scheduled_delivery.is_active');

  // Target offers free shipping on orders $35+ (or with RedCard)
  const threshold = getNestedNumber(product, 'item.cart_add_on_threshold') || 35;

  if (priceNum >= threshold) {
    return { days: '3-5 Days', label: 'Free Shipping', parsedDeliveryDays: 4 };
  }

  if (scheduledDelivery === true) {
    return { days: '2-5 Days', label: 'Scheduled Delivery', parsedDeliveryDays: 3 };
  }

  return { days: '3-7 Days', label: 'Standard', parsedDeliveryDays: 5 };
}

export class TargetProvider implements SearchProvider {
  readonly name = 'Target';
  readonly type = 'domestic' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    if (!API_KEY) {
      console.warn('⚠️ [TargetProvider] No RAPIDAPI_KEY');
      return [];
    }

    const q = refineQuery(query);
    const priceIntent = detectPriceIntent(query);

    const headers = {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST,
    };

    // ecommet / apidojo Target API endpoints
    // 주의: count/offset 파라미터 추가하면 "Unexpected end of JSON" 에러 발생
    // RapidAPI Code Snippet 그대로 사용
    const endpoints = [
      `https://${API_HOST}/searchByKeywords?keywords=${encodeURIComponent(q)}&store_id=3207&sort_by=relevance&include_sponsored=false`,
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.error(`❌ [TargetProvider] ${res.status} from ${url}`, errBody.slice(0, 300));
          continue;
        }

        // JSON 파싱 안전 처리 (Unexpected end of JSON 방지)
        const rawText = await res.text();
        let data: unknown;
        try {
          data = JSON.parse(rawText);
        } catch {
          console.error(`❌ [TargetProvider] Invalid JSON (${rawText.length} chars):`, rawText.slice(0, 300));
          continue;
        }
        const products = this.parseResponse(data, q, priceIntent);

        if (products.length > 0) {
          console.log(`✅ [TargetProvider] ${products.length} products from ${url}`);
          return products;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('abort')) {
          console.warn(`⏱️ [TargetProvider] Timeout: ${url}`);
        } else {
          console.error(`❌ [TargetProvider] Error: ${url}`, msg);
        }
      }
    }

    console.warn('⚠️ [TargetProvider] All endpoints returned 0 results');
    return [];
  }

  private parseResponse(
    data: unknown,
    queryForApi: string,
    priceIntent: ReturnType<typeof detectPriceIntent>,
  ): Product[] {
    if (!data || typeof data !== 'object') return [];

    const d = data as Record<string, unknown>;
    let items: Record<string, unknown>[] = [];

    // Helper: check if array items look like products (have tcin or __typename)
    const looksLikeProducts = (arr: unknown[]): boolean => {
      if (arr.length === 0) return false;
      const first = arr[0] as Record<string, unknown>;
      return !!(first.tcin || first.__typename === 'ProductSummary' || first.title || first.name || first.product_id);
    };

    // ── Strategy 1: ecommet API → search.search_response.products[] ──
    const searchResponse = getNestedValue(d, 'search.search_response') as Record<string, unknown> | undefined;
    if (searchResponse) {
      if (Array.isArray(searchResponse.products) && searchResponse.products.length > 0) {
        items = searchResponse.products;
      }
    }

    // ── Strategy 2: Broader nested search — walk up to 3 levels deep for "products" key ──
    if (items.length === 0) {
      const findProductsArray = (obj: Record<string, unknown>, depth: number): Record<string, unknown>[] | null => {
        if (depth > 3) return null;
        for (const [key, val] of Object.entries(obj)) {
          if (key === 'products' && Array.isArray(val) && val.length > 0 && looksLikeProducts(val)) {
            return val;
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const found = findProductsArray(val as Record<string, unknown>, depth + 1);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findProductsArray(d, 0);
      if (found) items = found;
    }

    // ── Strategy 3: Direct top-level arrays ──
    if (items.length === 0) {
      if (Array.isArray(d.products) && looksLikeProducts(d.products)) items = d.products;
      else if (Array.isArray(d.results) && looksLikeProducts(d.results)) items = d.results;
      else if (Array.isArray(d.items) && looksLikeProducts(d.items)) items = d.items;
      else if (d.data && typeof d.data === 'object') {
        const inner = d.data as Record<string, unknown>;
        if (Array.isArray(inner.products)) items = inner.products;
        else if (Array.isArray(inner.search_results)) items = inner.search_results;
      }
      else if (Array.isArray(data) && looksLikeProducts(data as unknown[])) items = data as Record<string, unknown>[];
    }

    // ── Strategy 4: Deep scan — find ANY array that looks like products ──
    if (items.length === 0) {
      const scanForProducts = (obj: Record<string, unknown>): Record<string, unknown>[] | null => {
        for (const val of Object.values(obj)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && looksLikeProducts(val)) {
            return val;
          }
        }
        // Second pass: recurse into nested objects
        for (const val of Object.values(obj)) {
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const found = scanForProducts(val as Record<string, unknown>);
            if (found) return found;
          }
        }
        return null;
      };
      const found = scanForProducts(d);
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
    // ── Title ──
    const rawTitle = getNestedString(item, 'item.product_description.title')
      || String(item.title ?? item.name ?? 'Target Product');
    const title = decodeHtmlEntities(rawTitle);

    // ── Price ──
    const { priceStr, priceNum } = extractPrice(item);

    // ── Image ──
    const image = extractImage(item);

    // ── Link ──
    const link = extractLink(item, queryForApi);

    // ── Brand ──
    const brand = getNestedString(item, 'item.primary_brand.name') || undefined;

    // ── Seller ──
    const seller = extractSeller(item);

    // ── Rating ──
    const { rating, reviewCount } = extractRating(item);

    // ── Badges ──
    const badges = extractBadges(item);

    // ── Delivery ──
    const delivery = estimateDelivery(item, priceNum);

    // ── TCIN (Target product ID) ──
    const tcin = String(item.tcin ?? item.original_tcin ?? item.id ?? idx);

    // ── Trust score: Target is a major trusted retailer ──
    let trustScore = 70;
    if (rating >= 4.5) trustScore += 5;
    if (delivery.label.includes('Free')) trustScore += 5;
    if (badges.some(b => /bestseller/i.test(b))) trustScore += 5;
    if (badges.some(b => /highly rated/i.test(b))) trustScore += 3;
    if (seller === 'Target') trustScore += 3; // Direct Target = more trusted
    if (priceNum > 0 && priceNum < 500) trustScore += 2;

    return {
      id: `target-${tcin}-${idx}`,
      name: title,
      price: priceStr,
      image,
      link,
      site: 'Target',
      seller,
      rating: isNaN(rating) ? 0 : Math.min(rating, 5),
      reviewCount: isNaN(reviewCount) ? 0 : reviewCount,
      shipping: 'Domestic' as const,
      category: 'domestic',
      deliveryDays: delivery.days,
      delivery: delivery.label,
      is_prime: false,
      badges,
      brand,
      parsedPrice: priceNum,
      parsedDeliveryDays: delivery.parsedDeliveryDays,
      shippingPrice: 0, // Target absorbs shipping for $35+ orders
      totalPrice: priceNum,
      trustScore,
    } as unknown as Product;
  }
}

export const targetProvider = new TargetProvider();
