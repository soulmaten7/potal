import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * SheinProvider — Unofficial SHEIN API (apidojo) via RapidAPI
 *
 * Host: unofficial-shein.p.rapidapi.com
 * Endpoint: GET /products/search
 * Params: keywords(required), country, currency, language, sort, limit, page
 *
 * Global(International) provider. 중국→미국 직배송 / US warehouse.
 * 배송: 7-14일 기본, Express 감지 시 5일
 *
 * 이전 API (shein-data-api.p.rapidapi.com / Pinto Studio)가 서버 다운 → 환불 처리됨
 * 2026-02-18: apidojo의 Unofficial SHEIN API로 교체
 */

const SHEIN_AFFILIATE = process.env.SHEIN_AFFILIATE_ID || '';

function appendSheinAffiliate(url: string): string {
  if (!SHEIN_AFFILIATE) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}ref=${encodeURIComponent(SHEIN_AFFILIATE)}`;
}

function buildSheinLink(url: string | undefined, query: string): string {
  const base = (url && typeof url === 'string' && url.startsWith('http'))
    ? url
    : `https://us.shein.com/pdsearch/${encodeURIComponent(query)}/`;
  return appendSheinAffiliate(base);
}

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

function normalizeImage(item: Record<string, unknown>): string {
  // Check common image field names
  const keys = [
    'image', 'imageUrl', 'thumbnail', 'mainImage', 'img', 'thumb',
    'goods_img', 'goods_image', 'cover', 'pic', 'photo',
  ];
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().startsWith('http')) return v.trim();
  }
  // Check nested image arrays
  const images = item.images ?? item.imageList ?? item.goods_imgs ?? item.allImages;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
    if (typeof first === 'object' && first !== null) {
      const obj = first as Record<string, unknown>;
      const imgUrl = obj.url ?? obj.src ?? obj.origin_image;
      if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) return imgUrl;
    }
  }
  return 'https://placehold.co/400x400?text=Shein';
}

function mapItemToProduct(
  item: Record<string, unknown>,
  index: number,
  searchQuery: string
): Product {
  const price = normalizePrice(
    item.price ?? item.salePrice ?? item.sale_price ?? item.retailPrice
    ?? item.goods_price ?? item.currentPrice ?? item.promotionPrice ?? 0
  );
  const priceNum = parsePriceToNum(price);

  const name = String(
    item.title ?? item.name ?? item.goods_name ?? item.goods_title
    ?? item.productName ?? 'Unknown Product'
  ).trim();

  const itemId = String(
    item.goods_id ?? item.productId ?? item.id ?? item.itemId
    ?? item.goodsId ?? item.product_id ?? `shein_${index}`
  );

  const rawUrl = item.url ?? item.link ?? item.productUrl
    ?? item.goods_url ?? item.detail_url ?? item.productLink;
  const link = buildSheinLink(rawUrl as string | undefined, searchQuery);

  const rating = parseFloat(String(
    item.rating ?? item.averageRating ?? item.comment_rank ?? item.star ?? 0
  )) || 0;
  const reviews = parseInt(String(
    item.reviewCount ?? item.reviews ?? item.comment_num
    ?? item.totalReviews ?? item.commentCount ?? 0
  ), 10) || 0;

  const brand = String(item.brand ?? item.brandName ?? 'Shein').trim();

  // Shein: 대부분 무료배송, 7-14일 배송
  const shippingPrice = 0;
  const estimatedDays = 10;

  return {
    id: `shein-${itemId}`,
    name,
    price,
    image: normalizeImage(item),
    site: 'Shein',
    shipping: 'International' as const,
    category: 'international' as const,
    link,
    deliveryDays: '7-14 Days',
    parsedDeliveryDays: estimatedDays,
    shippingPrice,
    totalPrice: priceNum + shippingPrice,
    parsedPrice: priceNum,
    trustScore: 48 + Math.min(rating * 3, 10),
    bestScore: 0,
    rating: Math.min(rating, 5),
    reviewCount: reviews,
    brand,
  } as unknown as Product;
}

export class SheinProvider implements SearchProvider {
  readonly name = 'Shein';
  readonly type = 'global' as const;

  // 새 API: Unofficial SHEIN by apidojo
  private host = process.env.RAPIDAPI_HOST_SHEIN || 'unofficial-shein.p.rapidapi.com';
  private apiKey = process.env.RAPIDAPI_KEY || '';

  async search(query: string, page: number = 1): Promise<Product[]> {
    if (!this.apiKey) {
      console.warn('⚠️ [SheinProvider] No RAPIDAPI_KEY — skipping');
      return [];
    }

    // Unofficial SHEIN API (apidojo) — /products/search 엔드포인트
    const endpoints = [
      // 1. 메인 검색 엔드포인트 (apidojo 공식)
      `/products/search?keywords=${encodeURIComponent(query)}&language=en&country=US&currency=USD&sort=7&limit=20&page=${page}`,
      // 2. sort 없이 (기본 정렬)
      `/products/search?keywords=${encodeURIComponent(query)}&language=en&country=US&currency=USD&limit=20&page=${page}`,
      // 3. 최소 파라미터 (keywords만)
      `/products/search?keywords=${encodeURIComponent(query)}&country=US&currency=USD&page=${page}`,
    ];

    for (const endpoint of endpoints) {
      const url = `https://${this.host}${endpoint}`;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        console.log(`🔍 [SheinProvider] Trying: ${endpoint.split('?')[0]}`);

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host,
          },
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.error(`❌ [SheinProvider] ${res.status} from ${endpoint.split('?')[0]}`, errBody.slice(0, 500));
          continue;
        }

        const data = await res.json();

        // Unofficial SHEIN API 응답 구조: data.info.products (주로)
        // 다양한 응답 구조에 대한 fallback 파싱
        const items: Record<string, unknown>[] =
          Array.isArray(data?.info?.products)
            ? data.info.products
            : Array.isArray(data?.data?.products)
              ? data.data.products
              : Array.isArray(data?.products)
                ? data.products
                : Array.isArray(data?.data?.items)
                  ? data.data.items
                  : Array.isArray(data?.data?.list)
                    ? data.data.list
                    : Array.isArray(data?.info?.items)
                      ? data.info.items
                      : Array.isArray(data?.result)
                        ? data.result
                        : Array.isArray(data?.data)
                          ? data.data
                          : Array.isArray(data)
                            ? data
                            : [];

        if (items.length === 0) {
          // Deep scan: find first array with objects
          const findArray = (obj: Record<string, unknown>): Record<string, unknown>[] => {
            for (const key of Object.keys(obj)) {
              const val = obj[key];
              if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                return val as Record<string, unknown>[];
              }
              if (val && typeof val === 'object' && !Array.isArray(val)) {
                const nested = findArray(val as Record<string, unknown>);
                if (nested.length > 0) return nested;
              }
            }
            return [];
          };

          const deepItems = findArray(data);
          if (deepItems.length > 0) {
            console.log(`✅ [SheinProvider] ${deepItems.length} products (deep scan)`);
            return deepItems
              .slice(0, 20)
              .map((item, i) => mapItemToProduct(item, i, query))
              .filter((p) => (p.parsedPrice ?? 0) > 0);
          }

          console.warn(`⚠️ [SheinProvider] No products found from ${endpoint.split('?')[0]}`);
          continue;
        }

        console.log(`✅ [SheinProvider] ${items.length} products found`);

        const results = items
          .slice(0, 20)
          .map((item, i) => mapItemToProduct(item, i, query))
          .filter((p) => (p.parsedPrice ?? 0) > 0);

        if (results.length > 0) return results;

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('abort')) {
          console.warn(`⏱️ [SheinProvider] Timeout`);
        } else {
          console.warn(`⚠️ [SheinProvider] Error: ${message}`);
        }
      }
    } // end for endpoints

    console.warn('⚠️ [SheinProvider] All endpoints returned 0 results');
    return [];
  }
}
