import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * TemuProvider — Apify Actor (amit123/temu-products-scraper)
 *
 * Apify 동기 실행 API: run-sync-get-dataset-items
 * 검색어를 보내면 Temu 상품 목록을 JSON 배열로 반환
 *
 * Global(International) provider. 중국→미국 직배송.
 * 배송: 7-15일 기본
 *
 * 비용: ~$1.18 / 1,000건, 무료 $5 크레딧/월
 */

// 환경변수를 런타임에 읽도록 함수로 변경 (Vercel 호환)
const getApifyToken = () => process.env.APIFY_API_TOKEN || '';
const getTemuAffiliate = () => process.env.TEMU_AFFILIATE_CODE || '';
const ACTOR_ID = 'amit123~temu-products-scraper';
const TIMEOUT_MS = 30_000; // Apify Actor 실행은 7~15초 소요

// ── Affiliate ──
function appendTemuAffiliate(url: string): string {
  if (!getTemuAffiliate()) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}aff_code=${encodeURIComponent(getTemuAffiliate())}`;
}

function buildTemuLink(url: string | undefined, query: string): string {
  const base = (url && typeof url === 'string' && url.startsWith('http'))
    ? url
    : `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  return appendTemuAffiliate(base);
}

// ── Price parsing ──
function parsePriceStr(raw: unknown): { priceStr: string; priceNum: number } {
  if (!raw) return { priceStr: '$0.00', priceNum: 0 };
  const s = String(raw).trim();
  const cleaned = s.replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n) || n <= 0) return { priceStr: '$0.00', priceNum: 0 };
  return { priceStr: `$${n.toFixed(2)}`, priceNum: n };
}

// ── Image normalization ──
function normalizeImage(item: Record<string, unknown>): string {
  const thumb = item.thumb_url ?? item.image ?? item.imageUrl ?? item.thumbnail;
  if (typeof thumb === 'string' && thumb.trim()) {
    let url = thumb.trim();
    if (url.startsWith('//')) url = `https:${url}`;
    return url;
  }
  return '';
}

// ── Map Apify item → Product ──
function mapItemToProduct(
  item: Record<string, unknown>,
  index: number,
  query: string,
): Product {
  const title = String(
    item.title ?? item.name ?? item.goods_name ?? 'Temu Product'
  ).trim();

  // Price — try price_info.price_str first, then direct price
  let priceStr = '$0.00';
  let priceNum = 0;

  const priceInfo = item.price_info as Record<string, unknown> | undefined;
  if (priceInfo) {
    const parsed = parsePriceStr(priceInfo.price_str ?? priceInfo.price ?? priceInfo.sale_price);
    priceStr = parsed.priceStr;
    priceNum = parsed.priceNum;
  }

  if (priceNum === 0) {
    const parsed = parsePriceStr(item.price ?? item.salePrice ?? item.sale_price);
    priceStr = parsed.priceStr;
    priceNum = parsed.priceNum;
  }

  // Original price for discount
  let originalPrice = 0;
  if (priceInfo) {
    const orig = parsePriceStr(priceInfo.market_price_str ?? priceInfo.market_price ?? priceInfo.original_price);
    originalPrice = orig.priceNum;
  }

  const image = normalizeImage(item);

  const rawUrl = item.link_url ?? item.url ?? item.product_url;
  const link = buildTemuLink(rawUrl as string | undefined, query);

  // Rating
  let rating = 0;
  let reviewCount = 0;
  const comment = item.comment as Record<string, unknown> | undefined;
  if (comment) {
    rating = parseFloat(String(comment.goods_score ?? comment.rating ?? 0)) || 0;
    reviewCount = parseInt(String(comment.comment_num ?? comment.review_count ?? 0), 10) || 0;
  }
  if (rating === 0) {
    rating = parseFloat(String(item.rating ?? item.goods_score ?? 0)) || 0;
  }
  if (reviewCount === 0) {
    reviewCount = parseInt(String(item.review_count ?? item.reviewCount ?? 0), 10) || 0;
  }

  // Sales count
  const salesStr = String(item.sales_num ?? item.sold ?? item.sales ?? '');
  const salesNum = parseInt(salesStr.replace(/[^\d]/g, ''), 10) || 0;

  // Trust score
  let trustScore = 40;
  if (rating >= 4.5) trustScore += 10;
  if (salesNum > 1000) trustScore += 10;
  if (reviewCount > 100) trustScore += 5;

  const itemId = String(
    item.goods_id ?? item.product_id ?? item.id ?? `temu_${index}`
  );

  // Badges
  const badges: string[] = [];
  if (originalPrice > 0 && priceNum > 0 && originalPrice > priceNum) {
    const discount = Math.round((1 - priceNum / originalPrice) * 100);
    if (discount >= 10) badges.push(`-${discount}%`);
  }
  if (salesNum >= 10000) badges.push('Best Seller');

  return {
    id: `temu-${itemId}-${index}`,
    name: title,
    price: priceStr,
    parsedPrice: priceNum,
    image,
    link,
    site: 'Temu',
    seller: 'Temu',
    rating: Math.min(rating, 5),
    reviewCount,
    shipping: 'International' as const,
    category: 'global' as const,
    deliveryDays: '7-15 Business Days',
    delivery: 'Standard Shipping',
    parsedDeliveryDays: 10,
    shippingPrice: 0,
    totalPrice: priceNum,
    trustScore,
    is_prime: false,
    badges,
    brand: String(item.brand ?? '').trim() || undefined,
  } as unknown as Product;
}

export class TemuProvider implements SearchProvider {
  readonly name = 'Temu';
  readonly type = 'global' as const;

  async search(query: string, page: number = 1): Promise<Product[]> {
    const token = getApifyToken();
    if (!token) {
      console.warn('⚠️ [TemuProvider] No APIFY_API_TOKEN — skipping. Available env keys:', Object.keys(process.env).filter(k => k.includes('APIFY') || k.includes('apify')).join(', ') || 'NONE');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    try {
      console.log(`🔍 [TemuProvider] Searching Temu via Apify: "${trimmed}"`);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Apify 동기 실행 — Actor 실행 + 데이터셋 결과를 한번에 반환
      const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQueries: [trimmed],
          maxProducts: 40,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`❌ [TemuProvider] ${res.status}:`, errBody.slice(0, 300));
        return [];
      }

      const data = await res.json();

      // run-sync-get-dataset-items는 상품 배열을 직접 반환
      let items: Record<string, unknown>[] = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === 'object') {
        for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
          if (Array.isArray(val) && val.length > 0) {
            items = val;
            break;
          }
        }
      }

      if (items.length === 0) {
        console.warn('⚠️ [Temu] No products in response');
        return [];
      }

      const products = items
        .slice(0, 30)
        .map((item, i) => mapItemToProduct(item as Record<string, unknown>, i, trimmed))
        .filter((p) => (p.parsedPrice ?? 0) > 0);

      console.log(`✅ [Temu] ${products.length} products`);
      return products;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        console.warn(`⏱️ [TemuProvider] Timeout (${TIMEOUT_MS}ms)`);
      } else {
        console.error(`❌ [TemuProvider] Error:`, msg);
      }
      return [];
    }
  }
}
