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
  return 'https://placehold.co/400x400?text=No+Image';
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
  const name = (item.product_title ?? item.title ?? item.name ?? 'Unknown Product').toString().trim();
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
  const shipping = assignShipping(item);

  return {
    id: `amazon_${asin}`,
    name,
    price,
    image: normalizeImage(item),
    site: 'Amazon',
    shipping: 'Domestic' as const,
    category: 'domestic' as const,
    link,
    deliveryDays: 'Free Prime Delivery (US)',
    trustScore,
  };
}

export class AmazonProvider implements SearchProvider {
  readonly name = 'Amazon';

  async search(query: string, page: number = 1): Promise<Product[]> {
    // [디버깅] 환경 변수 확인
    console.log('[AmazonProvider] API Key Check:', process.env.RAPIDAPI_KEY ? 'Loaded' : 'Missing');
    const host = process.env.RAPIDAPI_HOST_AMAZON ?? 'real-time-amazon-data.p.rapidapi.com';
    console.log('[AmazonProvider] RAPIDAPI_HOST_AMAZON:', host);

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey?.trim()) {
      console.error('[AmazonProvider] 검색 실패: RAPIDAPI_KEY 없음 → Fallback 모드 전환');
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

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': host,
        },
      });

      // [디버깅] API 응답 상태
      console.log('[AmazonProvider] Response status:', res.status, res.statusText);
      const data = (await res.json()) as Record<string, unknown>;
      const items = (data.data as Record<string, unknown>)?.products ?? data.products ?? data.results;
      const list = Array.isArray(items) ? items : [];
      console.log('[AmazonProvider] Response data (keys):', Object.keys(data));
      console.log('[AmazonProvider] Items count:', list.length, typeof items);

      if (!res.ok) {
        console.error('[AmazonProvider] 검색 실패: API HTTP 에러 → Fallback 모드 전환', {
          status: res.status,
          statusText: res.statusText,
          dataKeys: Object.keys(data),
          dataSample: JSON.stringify(data).slice(0, 500),
        });
        return [];
      }

      if (list.length === 0) {
        console.warn('[AmazonProvider] 검색 실패: API 빈 배열 반환 → Fallback 모드 전환', {
          query: queryForApi,
          dataKeys: Object.keys(data),
        });
      }

      let products = list.map((item: Record<string, unknown>, index: number) =>
        mapItemToProduct(item, index, queryForApi)
      );

      // AI 인텔리전스: 가격 제한 의도가 있으면 해당 금액 이하만 필터링
      if (priceIntent != null && priceIntent.maxPrice > 0) {
        const before = products.length;
        products = products.filter((p) => {
          const num = parsePriceToNumber(p.price);
          return num != null && num <= priceIntent.maxPrice;
        });
        console.log('[AmazonProvider] Price filter:', before, '→', products.length, '(maxPrice:', priceIntent.maxPrice, ')');
      }

      return products;
    } catch (err) {
      const e = err as Error & { response?: { data?: unknown } };
      console.error('[AmazonProvider] 검색 실패: 요청/파싱 예외 → Fallback 모드 전환', {
        message: e?.message,
        name: e?.name,
        responseData: e?.response?.data,
        stack: e?.stack?.slice(0, 300),
      });
      return [];
    }
  }
}
