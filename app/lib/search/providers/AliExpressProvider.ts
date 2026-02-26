import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

/**
 * AliExpressProvider — Real API via RapidAPI
 *
 * Host: aliexpress-data.p.rapidapi.com
 * Endpoint: GET /item/search (or /products/search)
 *
 * Global(International) provider. 모든 상품은 International 분류.
 * 배송: 7-15일 기본, Choice/Standard Shipping 감지 시 7일
 */

// ── Affiliate ──
const ALI_APP_KEY = process.env.ALIEXPRESS_APP_KEY || '';
const ALI_AFFILIATE_ID = process.env.ALIEXPRESS_AFFILIATE_ID?.trim() || '';

function appendAliAffiliate(url: string): string {
  if (!ALI_AFFILIATE_ID && !ALI_APP_KEY) return url;
  const id = ALI_AFFILIATE_ID || ALI_APP_KEY;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}aff_id=${encodeURIComponent(id)}`;
}

function buildAliLink(url: string | undefined, productId: string | undefined, query: string): string {
  // 1) API가 직접 URL을 준 경우
  if (url && typeof url === 'string') {
    if (url.startsWith('http')) return appendAliAffiliate(url);
    if (url.startsWith('//')) return appendAliAffiliate(`https:${url}`);
  }
  // 2) productId가 있으면 상품 상세 페이지 URL 구성
  if (productId && productId !== '' && !productId.startsWith('ali_')) {
    return appendAliAffiliate(`https://www.aliexpress.com/item/${productId}.html`);
  }
  // 3) 마지막 fallback: 검색 페이지 (이건 거의 안 나와야 함)
  return appendAliAffiliate(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`);
}

// ── Price ──
function normalizePrice(raw: unknown): string {
  if (raw == null) return '$0.00';
  const s = String(raw).trim();
  // AliExpress often returns "US $12.34" or just "12.34"
  const cleaned = s.replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

function parsePriceToNum(priceStr: string): number {
  const s = String(priceStr).replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

// ── Image ──
function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http')) return trimmed;
  return trimmed;
}

function normalizeImage(item: Record<string, unknown>): string {
  // Handle object-style image: { image: { imgUrl: "//..." } }
  const imageObj = item.image;
  if (imageObj && typeof imageObj === 'object' && !Array.isArray(imageObj)) {
    const imgUrl = (imageObj as Record<string, unknown>).imgUrl ?? (imageObj as Record<string, unknown>).url;
    if (typeof imgUrl === 'string' && imgUrl.trim()) return ensureHttps(imgUrl);
  }

  // Handle string-style image fields
  const keys = [
    'product_main_image_url',
    'productMainImageUrl',
    'imageUrl',
    'image',
    'product_image_url',
    'img',
    'mainImage',
    'thumbnailImageUrl',
    'cover',
  ];
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return ensureHttps(v);
  }

  // Try images array: [{ imgUrl: "//..." }] or ["http://..."]
  const images = item.images ?? item.productImages;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string' && first.trim()) return ensureHttps(first);
    if (first && typeof first === 'object') {
      const obj = first as Record<string, unknown>;
      const imgUrl = obj.imgUrl ?? obj.url ?? obj.src;
      if (typeof imgUrl === 'string' && imgUrl.trim()) return ensureHttps(imgUrl);
    }
  }
  return '';
}

// ── 가격 추출: minPrice 대신 실제 판매가 우선 ──
// AliExpress API 응답 구조:
//   prices: { salePrice: { minPrice: 17.12, maxPrice: 1593.14, formattedPrice: "US $1,593.14" } }
//   minPrice는 가장 싼 옵션(부속품 등)일 수 있어서 비교에 부적합.
//   maxPrice 또는 formattedPrice를 우선 사용.
function findPriceInObject(obj: unknown, depth: number = 0): number {
  if (depth > 4) return 0;
  if (obj == null) return 0;

  // 숫자면 바로 반환 (센트 변환 제거 — AliExpress는 달러 단위로 리턴)
  if (typeof obj === 'number') {
    return obj > 0 ? obj : 0;
  }

  // 문자열이면 숫자 추출 ("US $1,593.14" → 1593.14)
  if (typeof obj === 'string') {
    const cleaned = obj.replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n) && n > 0) return n;
    return 0;
  }

  // 객체면 가격 관련 키 탐색 — maxPrice/formattedPrice 우선!
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;

    // 1단계: maxPrice 또는 formattedPrice 먼저 (실제 메인 상품 가격일 가능성 높음)
    const preferredKeys = [
      'formattedPrice', 'maxPrice', 'max',
      'app_sale_price', 'sale_price', 'salePrice',
      'price', 'value', 'current', 'sale', 'discountPrice',
    ];
    for (const key of preferredKeys) {
      if (o[key] != null) {
        const found = findPriceInObject(o[key], depth + 1);
        if (found > 0) return found;
      }
    }

    // 2단계: minPrice는 마지막 수단 (다른 가격 필드가 없을 때만)
    const fallbackKeys = ['minPrice', 'min', 'minAmount', 'minAmountStr'];
    for (const key of fallbackKeys) {
      if (o[key] != null) {
        const found = findPriceInObject(o[key], depth + 1);
        if (found > 0) return found;
      }
    }

    // 3단계: 나머지 키 탐색
    const allChecked = new Set([...preferredKeys, ...fallbackKeys]);
    for (const key of Object.keys(o)) {
      if (allChecked.has(key)) continue;
      const found = findPriceInObject(o[key], depth + 1);
      if (found > 0) return found;
    }
  }

  return 0;
}

// ── minPrice도 별도 추출 (가격 범위 표시용) ──
function findMinPriceInObject(obj: unknown, depth: number = 0): number {
  if (depth > 4 || obj == null) return 0;
  if (typeof obj === 'number') return obj > 0 ? obj : 0;
  if (typeof obj === 'string') {
    const n = parseFloat(obj.replace(/[^0-9.]/g, ''));
    return (!Number.isNaN(n) && n > 0) ? n : 0;
  }
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    // minPrice 직접 탐색
    for (const key of ['minPrice', 'min', 'minAmount']) {
      if (o[key] != null) {
        const found = findMinPriceInObject(o[key], depth + 1);
        if (found > 0) return found;
      }
    }
    // salePrice 하위에 minPrice가 있을 수 있음
    if (o.salePrice != null) return findMinPriceInObject(o.salePrice, depth + 1);
    if (o.prices != null) return findMinPriceInObject(o.prices, depth + 1);
  }
  return 0;
}

// ── Map item → Product ──
function mapItemToProduct(
  item: Record<string, unknown>,
  index: number,
  searchQuery: string
): Product {
  // 1) 먼저 flat 필드에서 가격 시도 (old API)
  let priceNum = 0;
  const flatPriceFields = [
    'app_sale_price', 'sale_price', 'target_sale_price',
    'product_sale_price', 'salePrice', 'promotionPrice', 'min_price',
  ];
  for (const key of flatPriceFields) {
    if (item[key] != null) {
      const n = findPriceInObject(item[key]);
      if (n > 0) { priceNum = n; break; }
    }
  }

  // 2) "prices" 객체에서 가격 탐색 (new API)
  if (priceNum === 0 && item.prices) {
    priceNum = findPriceInObject(item.prices);
  }

  // 3) "price" 필드 (singular)
  if (priceNum === 0 && item.price) {
    priceNum = findPriceInObject(item.price);
  }

  // 4) "trade" 객체에서 가격 탐색
  if (priceNum === 0 && item.trade) {
    priceNum = findPriceInObject(item.trade);
  }

  // minPrice 별도 추출 → 가격 범위 감지
  const minPriceNum = item.prices ? findMinPriceInObject(item.prices) : 0;
  const hasPriceRange = minPriceNum > 0 && priceNum > 0 && minPriceNum < priceNum * 0.5;
  // 가격 범위가 클 때 (minPrice가 메인 가격의 50% 미만) "From $X" 표시
  const price = hasPriceRange ? `From $${minPriceNum.toFixed(2)}` : `$${priceNum.toFixed(2)}`;

  // AliExpress: usually free shipping, sometimes paid
  const shippingRaw = item.shippingFee ?? item.logistics_cost ?? item.freightAmount;
  let shippingPrice = 0;
  if (shippingRaw != null) {
    const s = String(shippingRaw).trim().toLowerCase();
    if (!s.includes('free') && s !== '0' && s !== '') {
      const n = parseFloat(s.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(n)) shippingPrice = n;
    }
  }
  const totalPrice = priceNum + shippingPrice;

  // Handle nested title: { title: { displayTitle: "..." } }
  let rawTitle = item.product_title ?? item.title ?? item.productTitle ?? item.name ?? 'Unknown Product';
  if (rawTitle && typeof rawTitle === 'object' && !Array.isArray(rawTitle)) {
    const titleObj = rawTitle as Record<string, unknown>;
    rawTitle = titleObj.displayTitle ?? titleObj.text ?? titleObj.value ?? 'Unknown Product';
  }
  const name = String(rawTitle).trim();

  const itemId = String(
    item.product_id ?? item.productId ?? item.item_id ?? item.id ?? item.itemId ?? `ali_${index}`
  );

  // Handle nested link: { link: { url: "..." } }
  let rawUrl = item.product_detail_url ?? item.productDetailUrl ?? item.promotion_link ?? item.url ?? item.link;
  if (rawUrl && typeof rawUrl === 'object' && !Array.isArray(rawUrl)) {
    const linkObj = rawUrl as Record<string, unknown>;
    rawUrl = linkObj.url ?? linkObj.href ?? linkObj.value;
  }
  const link = buildAliLink(rawUrl as string | undefined, itemId, searchQuery);

  // Rating & Reviews: flat fields (old API) + nested "trade" object (new API)
  let rating = parseFloat(String(
    item.evaluate_rate ?? item.averageStar ?? item.rating ?? item.starRating ?? 0
  ).replace('%', '')) || 0;
  let reviews = parseInt(String(
    item.lastest_volume ?? item.orders ?? item.tradeCount ?? item.reviewCount ?? item.totalOrders ?? 0
  ).replace(/[^0-9]/g, ''), 10) || 0;

  // New API: { trade: { realTradeCount: "4", tradeDesc: "4 sold" } }
  if ((rating === 0 || reviews === 0) && item.trade && typeof item.trade === 'object') {
    const trade = item.trade as Record<string, unknown>;
    if (rating === 0) {
      const tradeRating = trade.starRating ?? trade.rating ?? trade.averageStar ?? trade.star ?? trade.score ?? trade.averageScore;
      if (tradeRating != null) {
        rating = parseFloat(String(tradeRating).replace('%', '')) || 0;
      }
    }
    if (reviews === 0) {
      // realTradeCount is the actual field name in new API
      const tradeReviews = trade.realTradeCount ?? trade.reviewCount ?? trade.reviews ?? trade.tradeCount ?? trade.totalOrders ?? trade.orders;
      if (tradeReviews != null) {
        reviews = parseInt(String(tradeReviews).replace(/[^0-9]/g, ''), 10) || 0;
      }
      // tradeDesc: "500+ sold" → extract number
      if (reviews === 0 && trade.tradeDesc) {
        const match = String(trade.tradeDesc).match(/(\d[\d,]*)/);
        if (match) reviews = parseInt(match[1].replace(/,/g, ''), 10) || 0;
      }
    }
  }

  // Also check sellingPoints for rating info
  if (rating === 0 && item.sellingPoints && typeof item.sellingPoints === 'object') {
    const sp = item.sellingPoints as Record<string, unknown>;
    // sellingPoints could be array or object
    if (Array.isArray(item.sellingPoints)) {
      for (const point of item.sellingPoints as Record<string, unknown>[]) {
        const pRating = point?.starRating ?? point?.rating ?? point?.score;
        if (pRating != null) {
          rating = parseFloat(String(pRating).replace('%', '')) || 0;
          if (rating > 0) break;
        }
      }
    } else {
      const spRating = sp.starRating ?? sp.rating ?? sp.score;
      if (spRating != null) {
        rating = parseFloat(String(spRating).replace('%', '')) || 0;
      }
    }
  }

  // AliExpress search API는 별점을 제공하지 않는 경우가 많음
  // 판매량이 있으면 합리적인 추정치 부여 (AliExpress 평균 4.2~4.7)
  if (rating === 0 && reviews > 0) {
    rating = reviews >= 100 ? 4.5 : reviews >= 10 ? 4.2 : 4.0;
  }

  // AliExpress ratings can be percentage (e.g., "95.2%") or 5-star scale
  const normalizedRating = rating > 5 ? rating / 20 : rating; // 95.2% → 4.76

  // Trust: AliExpress sellers get lower base trust (international risk)
  const trustScore = Math.min(100, Math.round(normalizedRating * 15 + Math.min(reviews / 100, 20) + 10));

  // Delivery: AliExpress Choice = faster (7d), Standard = 10-15d
  const isChoice = !!(
    item.is_choice === true ||
    String(item.logisticsType ?? item.delivery ?? '').toLowerCase().includes('choice')
  );
  const parsedDeliveryDays = isChoice ? 7 : 12;

  const brand = String(item.brand ?? item.storeName ?? item.store_name ?? '').trim() || undefined;

  return {
    id: `aliexpress_${itemId}`,
    name,
    price,
    parsedPrice: priceNum,
    image: normalizeImage(item),
    site: 'AliExpress',
    shipping: 'International' as const,
    category: 'international' as const,
    link,
    deliveryDays: isChoice ? 'Choice: 7-10 Days' : '10-15 Business Days',
    parsedDeliveryDays,
    shippingPrice,
    totalPrice,
    trustScore,
    rating: Math.round(normalizedRating * 10) / 10,
    reviewCount: reviews,
    brand,
    // 가격 범위가 큰 상품: "From $17.12" 형태로 UI에서 표시 가능
    ...(hasPriceRange ? { priceRangeMin: minPriceNum } : {}),
  };
}

export class AliExpressProvider implements SearchProvider {
  readonly name = 'AliExpress';
  readonly type = 'global' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    const host = process.env.RAPIDAPI_HOST_ALIEXPRESS ?? 'aliexpress-data.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey?.trim()) {
      console.warn('⚠️ [AliExpress] RAPIDAPI_KEY not set');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const queryForApi = refineQuery(trimmed) || trimmed;
    const priceIntent = detectPriceIntent(trimmed);

    try {
      // Primary endpoint: /product/search (Aliexpress Data API)
      const url = new URL(`https://${host}/product/search`);
      url.searchParams.set('query', queryForApi);
      url.searchParams.set('page', String(page));

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': host,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        // Try alternative endpoint
        const altUrl = new URL(`https://${host}/item/search`);
        altUrl.searchParams.set('q', queryForApi);
        altUrl.searchParams.set('page', String(page));

        const controller2 = new AbortController();
        const timer2 = setTimeout(() => controller2.abort(), 8000);

        const altRes = await fetch(altUrl.toString(), {
          method: 'GET',
          headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host },
          signal: controller2.signal,
        });
        clearTimeout(timer2);

        if (!altRes.ok) {
          console.error(`❌ [AliExpress] Both endpoints failed: ${res.status}, ${altRes.status}`);
          return [];
        }

        return this.parseResponse(await altRes.json(), queryForApi, priceIntent);
      }

      return this.parseResponse(await res.json(), queryForApi, priceIntent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        console.warn('⏱️ [AliExpress] Timeout');
      } else {
        console.error('❌ [AliExpress] Fetch error:', msg);
      }
      return [];
    }
  }

  private parseResponse(
    data: Record<string, unknown>,
    queryForApi: string,
    priceIntent: ReturnType<typeof detectPriceIntent>
  ): Product[] {
    let items: unknown[] = [];
    const dataAny = data as any;

    // Try multiple response shapes (ordered by likelihood)
    if (Array.isArray(dataAny.data?.content)) {
      // New /product/search endpoint: { data: { content: [...] } }
      items = dataAny.data.content;
    } else if (Array.isArray(dataAny.result?.resultList)) {
      items = dataAny.result.resultList;
    } else if (Array.isArray(dataAny.result?.products)) {
      items = dataAny.result.products;
    } else if (Array.isArray(dataAny.data?.products)) {
      items = dataAny.data.products;
    } else if (Array.isArray(dataAny.data?.items)) {
      items = dataAny.data.items;
    } else if (Array.isArray(dataAny.data?.list)) {
      items = dataAny.data.list;
    } else if (Array.isArray(data.products)) {
      items = data.products as unknown[];
    } else if (Array.isArray(data.items)) {
      items = data.items as unknown[];
    } else if (Array.isArray(data.data)) {
      items = data.data as unknown[];
    } else if (Array.isArray(dataAny.result?.items)) {
      items = dataAny.result.items;
    } else {
      // Deep scan: find first array with objects
      const deepScan = (obj: Record<string, unknown>, depth: number = 0): unknown[] => {
        if (depth > 3) return [];
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
            return val;
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const nested = deepScan(val as Record<string, unknown>, depth + 1);
            if (nested.length > 0) return nested;
          }
        }
        return [];
      };
      items = deepScan(data);
    }

    const list = items.filter((i): i is Record<string, unknown> => i != null && typeof i === 'object');

    if (list.length === 0) return [];

    let products = list.map((item, index) => mapItemToProduct(item, index, queryForApi));

    // parsedPrice가 0인 아이템 필터
    products = products.filter(p => (p.parsedPrice ?? 0) > 0);

    // 가격 필터
    if (priceIntent != null && priceIntent.maxPrice > 0) {
      products = products.filter(p => {
        const num = parsePriceToNumber(p.price);
        return num != null && num <= priceIntent.maxPrice;
      });
    }

    return products;
  }
}
