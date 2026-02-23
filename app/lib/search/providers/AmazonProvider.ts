import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';
import { refineQuery, detectPriceIntent, parsePriceToNumber } from '../searchIntelligence';

function normalizePrice(raw: unknown): string {
  if (raw == null) return '$0.00';
  const s = String(raw).trim().replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

/** Parse price string to number for totalPrice calculation */
function parsePriceToNum(priceStr: string): number {
  const s = String(priceStr).replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Extract shipping cost from API. "Free" / empty → 0.
 * Tries common keys: shipping_cost, shippingCost, delivery_fee, shipping_fee, shipping.
 */
function parseShippingPrice(item: Record<string, unknown>): number {
  const raw =
    item.shipping_cost ??
    item.shippingCost ??
    item.delivery_fee ??
    item.shipping_fee ??
    item.shipping;
  if (raw == null || raw === '') return 0;
  const s = String(raw).trim().toLowerCase();
  if (s.includes('free') || s === '0' || s === '$0' || s === '$0.00') return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function normalizeImage(item: Record<string, unknown>): string {
  const keys = [
    'product_photo',
    'product_image',
    'imageUrl',
    'thumbnailImage',
    'image',
    'thumbnail',
    'productImage',
    'galleryURL',
  ];
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().startsWith('http')) return v.trim();
  }
  return '';
}

/**
 * US 시장 기준: Amazon은 내수(Domestic). API 응답과 무관하게 항상 Domestic.
 * 배송 정보 불명확 시 Prime/2-day 가정 → Domestic.
 */
function assignShipping(_item: Record<string, unknown>): 'Domestic' {
  return 'Domestic';
}

const AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG?.trim() || 'potal-20';

/**
 * product_url에 파트너 태그(tag=potal-20)를 안전하게 붙임.
 * - 이미 ?가 있으면 &tag=... 추가, 없으면 ?tag=... 추가.
 * - #(hash)가 있으면 쿼리 뒤에만 태그 삽입해 링크 문법 유지.
 */
function appendAffiliateTag(url: string): string {
  const tag = AFFILIATE_TAG;
  const [base, hash] = url.split('#');
  let result: string;
  if (base.includes('?')) {
    const [path, q] = base.split('?');
    const params = new URLSearchParams(q);
    params.set('tag', tag);
    result = `${path}?${params.toString()}`;
  } else {
    result = `${base}?tag=${encodeURIComponent(tag)}`;
  }
  return hash != null && hash !== '' ? `${result}#${hash}` : result;
}

/** product_url 없을 때 사용할 Amazon 검색 결과 URL (tag 수익화 포함) */
function buildAmazonSearchLink(searchText: string): string {
  const raw = (searchText || '').trim() || 'search';
  const encoded = encodeURIComponent(raw);
  return appendAffiliateTag(`https://www.amazon.com/s?k=${encoded}`);
}

function isValidProductUrl(url: unknown): boolean {
  if (url == null || typeof url !== 'string') return false;
  const s = url.trim();
  return s.length > 0 && (s.startsWith('http://') || s.startsWith('https://'));
}

function mapItemToProduct(
  item: Record<string, unknown>,
  index: number,
  searchQuery: string
): Product {
  const price = normalizePrice(
    item.product_price ?? item.price ?? item.current_price ?? item.product_minimum_offer_price ?? 0
  );
  const priceNum = parsePriceToNum(price);
  const shippingPrice = parseShippingPrice(item);
  const totalPrice = priceNum + shippingPrice;

  const rawName = (item.product_title ?? item.title ?? item.name ?? 'Unknown Product').toString().trim();
  // HTML 엔티티 디코딩 (&#38; → &, &#x27; → ', &amp; → &, &quot; → " 등)
  const name = rawName
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
  const asin = (item.asin ?? item.product_id ?? `item_${index}`).toString();

  const rawUrl = item.product_url ?? item.url ?? item.link;
  let link: string;
  if (isValidProductUrl(rawUrl)) {
    link = appendAffiliateTag((rawUrl as string).trim());
  } else {
    link = buildAmazonSearchLink(searchQuery || name);
  }

  const rating = parseFloat(String(item.product_star_rating ?? item.rating ?? 0)) || 0;
  const reviews = parseInt(String(item.product_num_ratings ?? item.reviews_count ?? 0), 10) || 0;
  const trustScore = Math.min(100, Math.round(rating * 20 + (reviews > 1000 ? 10 : 0)));

  // Prime 감지: is_prime 플래그 또는 delivery 텍스트에서 추론
  const isPrime = !!(
    item.is_prime === true ||
    item.is_amazon_choice === true ||
    String(item.delivery ?? '').toLowerCase().includes('prime') ||
    String(item.product_title ?? '').toLowerCase().includes('prime')
  );

  // 배송 일수: Prime → 2일, 일반 → 3~5일
  const parsedDeliveryDays = isPrime ? 2 : 4;

  // 브랜드 추출
  const brand = String(item.product_brand ?? item.brand ?? '').trim() || undefined;

  return {
    id: `amazon_${asin}`,
    name,
    price,
    parsedPrice: priceNum,
    image: normalizeImage(item),
    site: 'Amazon',
    shipping: 'Domestic' as const,
    category: 'domestic' as const,
    link,
    deliveryDays: isPrime ? 'Free Prime 2-Day' : '3-5 Business Days',
    parsedDeliveryDays,
    shippingPrice,
    totalPrice,
    trustScore,
    is_prime: isPrime,
    rating,
    reviewCount: reviews,
    brand,
  };
}

export class AmazonProvider implements SearchProvider {
  readonly name = 'Amazon';
  readonly type = 'domestic' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    const host = process.env.RAPIDAPI_HOST_AMAZON ?? 'real-time-amazon-data.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey?.trim()) {
      console.warn('⚠️ [Amazon] RAPIDAPI_KEY not set');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    // AI 인텔리전스: API 호출 전 검색어 정제 (수식어·가격 구문 제거 → 적중률 향상)
    const queryForApi = refineQuery(trimmed) || trimmed;
    const priceIntent = detectPriceIntent(trimmed);

    try {
      const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
      url.searchParams.set('query', queryForApi);
      url.searchParams.set('page', String(page));
      url.searchParams.set('country', 'US');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

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
        console.error(`❌ [Amazon] HTTP ${res.status}`);
        return [];
      }

      const data = (await res.json()) as Record<string, unknown>;
      const items = (data.data as Record<string, unknown>)?.products ?? data.products ?? data.results;
      const list = Array.isArray(items) ? items : [];

      let products = list.map((item: Record<string, unknown>, index: number) =>
        mapItemToProduct(item, index, queryForApi)
      );

      // $0 상품 제거 (가격 파싱 실패 또는 잘못된 데이터)
      products = products.filter(p => (p.parsedPrice ?? 0) > 0);

      // AI 인텔리전스: 가격 제한 의도가 있으면 해당 금액 이하만 필터링
      if (priceIntent != null && priceIntent.maxPrice > 0) {
        const before = products.length;
        products = products.filter((p) => {
          const num = parsePriceToNumber(p.price);
          return num != null && num <= priceIntent.maxPrice;
        });
      }

      return products;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        console.warn('⏱️ [Amazon] Timeout (10s)');
      } else {
        console.error('❌ [Amazon] Fetch error:', msg);
      }
      return [];
    }
  }
}
