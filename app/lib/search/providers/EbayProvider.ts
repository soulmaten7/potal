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
  let deliveryDays = '3-5 Days';    // eBay Domestic 기본값 (USPS Ground Advantage 기준)
  let deliveryLabel = 'Standard';
  let parsedDeliveryDays = 4;       // eBay 대부분 국내 판매자 → 3-5일이 현실적

  // ── 배송일 파싱: 여러 포맷 지원 ──
  // "Free delivery in 3-5 days", "Estimated between Mon, Mar 3 and Thu, Mar 6"
  // "delivery in 2-4 business days", "+$7.99 delivery 5-7 days"
  const daysRangeMatch = msg.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:business\s*)?days?/i);
  const singleDayMatch = !daysRangeMatch ? msg.match(/(\d+)\s*(?:business\s*)?days?/i) : null;

  // eBay API의 다른 배송 필드도 확인
  const deliveryInfo = String(item.delivery ?? item.deliveryMessage ?? item.estimatedDelivery ?? '').trim().toLowerCase();
  const deliveryDaysMatch = !daysRangeMatch && !singleDayMatch
    ? deliveryInfo.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:business\s*)?days?/i)
    : null;

  if (daysRangeMatch) {
    const low = parseInt(daysRangeMatch[1], 10);
    const high = parseInt(daysRangeMatch[2], 10);
    deliveryDays = `${low}-${high} Days`;
    parsedDeliveryDays = Math.ceil((low + high) / 2);
  } else if (singleDayMatch) {
    const days = parseInt(singleDayMatch[1], 10);
    deliveryDays = `${days} Days`;
    parsedDeliveryDays = days;
  } else if (deliveryDaysMatch) {
    const low = parseInt(deliveryDaysMatch[1], 10);
    const high = parseInt(deliveryDaysMatch[2], 10);
    deliveryDays = `${low}-${high} Days`;
    parsedDeliveryDays = Math.ceil((low + high) / 2);
  }

  // ── 배송비 파싱 ──
  if (msg.includes('free')) {
    isFree = true;
    shippingPrice = 0;
    deliveryLabel = `Free Shipping · ${deliveryDays}`;
  } else if (msg.startsWith('+') || msg.includes('$')) {
    // "+$7.99 delivery" or "$5.99 shipping" format
    const priceMatch = msg.match(/\$?([\d.]+)/);
    if (priceMatch) {
      shippingPrice = parseFloat(priceMatch[1]) || 0;
    }
    deliveryLabel = `+$${shippingPrice.toFixed(2)} · ${deliveryDays}`;
  }

  // ── 특급 배송 감지 ──
  if (msg.includes('expedited') || msg.includes('express') || msg.includes('1-day') || msg.includes('next day')) {
    if (parsedDeliveryDays > 3) {
      parsedDeliveryDays = 2;
      deliveryDays = '1-3 Days';
    }
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
interface SellerData {
  name: string;
  feedbackPercent: number;  // e.g. 99.8
  feedbackCount: number;    // e.g. 36600
}

function parseSellerInfo(item: Record<string, unknown>): SellerData {
  const raw = String(item.sellerInfo ?? '').trim();
  if (!raw) return { name: 'eBay Seller', feedbackPercent: 0, feedbackCount: 0 };

  // Extract seller name (first word)
  const parts = raw.split(/\s+/);
  const name = parts[0] || 'eBay Seller';

  // Extract feedback percentage: "99.8% positive" → 99.8
  let feedbackPercent = 0;
  const percentMatch = raw.match(/([\d.]+)%\s*positive/i);
  if (percentMatch) {
    feedbackPercent = parseFloat(percentMatch[1]) || 0;
  }

  // Extract feedback count: "(36.6K)" or "(5,547)" → number
  let feedbackCount = 0;
  const countMatch = raw.match(/\(([\d.,]+)\s*([KkMm])?\)/);
  if (countMatch) {
    let num = parseFloat(countMatch[1].replace(/,/g, '')) || 0;
    const suffix = (countMatch[2] || '').toUpperCase();
    if (suffix === 'K') num *= 1000;
    else if (suffix === 'M') num *= 1000000;
    feedbackCount = Math.round(num);
  }

  return { name, feedbackPercent, feedbackCount };
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

        // ── Challenge/Captcha 감지: eBay가 봇 차단 페이지를 보냈는지 확인 ──
        const dataStr = JSON.stringify(data).slice(0, 500);
        const isChallenged = (
          dataStr.includes('splashui/challenge') ||
          dataStr.includes('original_status":307') ||
          dataStr.includes('captcha') ||
          dataStr.includes('blocked')
        );
        if (isChallenged) {
          console.warn(`⚠️ [eBay] Challenge/captcha detected, retrying after delay...`);
          // 1초 후 재시도 (1회)
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const retryController = new AbortController();
            const retryTimer = setTimeout(() => retryController.abort(), TIMEOUT_MS);
            const retryRes = await fetch(url, { headers, signal: retryController.signal });
            clearTimeout(retryTimer);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              const retryStr = JSON.stringify(retryData).slice(0, 500);
              if (!retryStr.includes('splashui/challenge') && !retryStr.includes('original_status":307')) {
                const retryProducts = this.parseResponse(retryData, q, priceIntent);
                if (retryProducts.length > 0) {
                  return retryProducts;
                }
              }
            }
          } catch { /* retry failed, continue to next endpoint */ }
          console.warn(`⚠️ [eBay] Retry also returned challenge, trying next endpoint...`);
          continue;
        }

        const products = this.parseResponse(data, q, priceIntent);

        if (products.length > 0) {
          return products;
        } else {
          // 디버그: 응답은 200인데 파싱 결과 0건일 때 — 응답 구조 확인용
          const keys = data && typeof data === 'object' ? Object.keys(data) : [];
          console.warn(`⚠️ [eBay] 200 OK but 0 parsed products. Response keys: [${keys.join(',')}], sample: ${dataStr}`);
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

    // Deep scan: walk ALL keys recursively to find product-like arrays
    if (items.length === 0) {
      const PRODUCT_KEYS = ['title', 'name', 'product_title', 'itemTitle', 'heading', 'productName'];
      const PRICE_KEYS = ['price', 'currentPrice', 'sellingPrice', 'cost', 'salePrice'];

      const visited = new WeakSet<object>(); // Circular reference protection
      const findItems = (obj: Record<string, unknown>, depth: number): Record<string, unknown>[] | null => {
        if (depth > 5) return null;
        if (visited.has(obj)) return null; // Prevent infinite loops
        visited.add(obj);
        let bestMatch: Record<string, unknown>[] | null = null;

        for (const [, val] of Object.entries(obj)) {
          if (Array.isArray(val) && val.length >= 2 && typeof val[0] === 'object' && val[0] !== null) {
            const first = val[0] as Record<string, unknown>;
            const firstKeys = Object.keys(first);

            // Require product-like structure: must have a title-like AND price-like key
            const hasTitle = firstKeys.some(k => PRODUCT_KEYS.some(pk => k.toLowerCase().includes(pk.toLowerCase())));
            const hasPrice = firstKeys.some(k => PRICE_KEYS.some(pk => k.toLowerCase().includes(pk.toLowerCase())));

            if (hasTitle && hasPrice && firstKeys.length >= 3) {
              // Prefer larger arrays (more products = more likely the right one)
              if (!bestMatch || val.length > bestMatch.length) {
                bestMatch = val;
              }
            }
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const found = findItems(val as Record<string, unknown>, depth + 1);
            if (found && (!bestMatch || found.length > bestMatch.length)) {
              bestMatch = found;
            }
          }
        }
        return bestMatch;
      };
      const found = findItems(d, 0);
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

    const sellerData = parseSellerInfo(item);
    const sellerName = sellerData.name;
    const condition = parseCondition(item);
    const { rating: productRating, reviewCount: productReviewCount } = parseReviews(item);
    const { shippingPrice, isFree, deliveryDays, deliveryLabel, parsedDeliveryDays } = parseShipping(item);

    // eBay 특성: 상품 리뷰가 없으면 판매자 피드백으로 대체
    // feedbackPercent(99.8%) → 5점 만점 환산 (95%=4.75, 99%=4.95, 100%=5.0)
    let rating = productRating;
    let reviewCount = productReviewCount;
    if (rating === 0 && sellerData.feedbackPercent > 0) {
      rating = Math.min(5, sellerData.feedbackPercent / 20); // 99.8% → 4.99
      reviewCount = sellerData.feedbackCount || 0;
    }

    const totalPrice = priceNum + shippingPrice;

    // Trust score: eBay는 판매자 피드백 기반
    let trustScore = 55;
    if (rating >= 4.5) trustScore += 10;
    if (sellerData.feedbackPercent >= 99) trustScore += 10;
    else if (sellerData.feedbackPercent >= 97) trustScore += 5;
    if (sellerData.feedbackCount >= 1000) trustScore += 5;
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
      sellerFeedbackPercent: sellerData.feedbackPercent || undefined,
      sellerFeedbackCount: sellerData.feedbackCount || undefined,
    } as unknown as Product;
  }
}

export const ebayProvider = new EbayProvider();
