/**
 * RapidAPI Real-Time Amazon Data 연동
 * - searchProducts(query, page): API 호출 후 Product 인터페이스로 매핑
 * - Zipper Logic 지원: shipping(Domestic/International) 할당 (배송 정보 또는 순서 기준)
 */

export interface ProductFromApi {
  id: string;
  name: string;
  price: string;
  image: string;
  site: string;
  shipping: 'Domestic' | 'International';
  deliveryDays?: string;
  link?: string;
  trustScore?: number;
}

function normalizePrice(raw: unknown): string {
  if (raw == null) return '$0.00';
  let s = String(raw).trim().replace(/[^\d.]/g, '');
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
 * 배송 정보 또는 순서로 Domestic(US/Fast) vs International(Global/Cheap) 할당
 * - Zipper(좌우 분할)가 동작하도록 둘 다 골고루 넣기
 */
function assignShipping(
  item: Record<string, unknown>,
  index: number
): 'Domestic' | 'International' {
  const shipping = (item.shipping ?? item.shipping_info ?? '').toString().toLowerCase();
  const delivery = (item.delivery_days ?? item.delivery ?? item.deliveryDays ?? '').toString().toLowerCase();
  const combined = `${shipping} ${delivery}`;

  if (/us|domestic|prime|2-?day|fast|free\s*ship/i.test(combined)) return 'Domestic';
  if (/international|global|china|import|2-?3\s*week|slow/i.test(combined)) return 'International';

  // API에 배송 정보 없으면 순서로 번갈아 할당 → 지퍼에서 좌/우 모두 채워짐
  return index % 2 === 0 ? 'Domestic' : 'International';
}

function mapAmazonItemToProduct(item: Record<string, unknown>, index: number): ProductFromApi {
  const price = normalizePrice(
    item.product_price ?? item.price ?? item.current_price ?? item.product_minimum_offer_price ?? 0
  );
  const name = (item.product_title ?? item.title ?? item.name ?? 'Unknown Product').toString().trim();
  const asin = (item.asin ?? item.product_id ?? `item_${index}`).toString();
  let link = (item.product_url ?? item.url ?? item.link ?? '#').toString();
  if (link !== '#' && process.env.AMAZON_AFFILIATE_TAG) {
    const sep = link.includes('?') ? '&' : '?';
    link = `${link}${sep}tag=${process.env.AMAZON_AFFILIATE_TAG}`;
  }
  const rating = parseFloat(String(item.product_star_rating ?? item.rating ?? 0)) || 0;
  const reviews = parseInt(String(item.product_num_ratings ?? item.reviews_count ?? 0), 10) || 0;
  const trustScore = Math.min(100, Math.round(rating * 20 + (reviews > 1000 ? 10 : 0)));
  const shipping = assignShipping(item, index);

  return {
    id: `amazon_${asin}`,
    name,
    price,
    image: normalizeImage(item),
    site: 'Amazon',
    shipping,
    link,
    deliveryDays: shipping === 'Domestic' ? '2-5 Days' : '7-14 Days',
    trustScore,
  };
}

export interface SearchProductsResult {
  products: ProductFromApi[];
  total: number;
}

/**
 * RapidAPI Real-Time Amazon Data 호출 후 Product 형태로 반환
 * - Zipper Logic: shipping을 Domestic/International로 할당해 프론트 지퍼 분할 지원
 */
export async function searchProducts(
  query: string,
  page: number = 1
): Promise<SearchProductsResult> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST_AMAZON ?? 'real-time-amazon-data.p.rapidapi.com';

  if (!apiKey?.trim()) {
    console.error('❌ amazonApi: RAPIDAPI_KEY is missing');
    return { products: [], total: 0 };
  }

  const trimmed = (query || '').trim();
  if (!trimmed) {
    return { products: [], total: 0 };
  }

  try {
    const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
    url.searchParams.set('query', trimmed);
    url.searchParams.set('page', String(page));
    url.searchParams.set('country', 'US');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
    });

    if (!res.ok) {
      console.error(`❌ amazonApi: API error ${res.status} ${res.statusText}`);
      return { products: [], total: 0 };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const items = (data.data as Record<string, unknown>)?.products ?? data.products ?? data.results;
    const list = Array.isArray(items) ? items : [];

    const products: ProductFromApi[] = list.map((item: Record<string, unknown>, index: number) =>
      mapAmazonItemToProduct(item, index)
    );

    const total = (data.data as Record<string, unknown>)?.total_products ?? products.length;

    return { products, total: typeof total === 'number' ? total : products.length };
  } catch (err) {
    console.error('❌ amazonApi searchProducts error:', err);
    return { products: [], total: 0 };
  }
}
