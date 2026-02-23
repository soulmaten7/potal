import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

/**
 * TemuProvider — Apify Actor (amit123/temu-products-scraper)
 *
 * ⚠️ Temu는 Apify를 사용합니다! RapidAPI가 아닙니다!
 * ⚠️ RapidAPI Temu는 구독자1/리뷰0으로 거부됨 — 절대 교체하지 마세요.
 *
 * Apify 동기 실행 API: run-sync-get-dataset-items
 * 검색어를 보내면 Temu 상품 목록을 JSON 배열로 반환
 *
 * 환경변수: APIFY_API_TOKEN (필수), TEMU_AFFILIATE_CODE (선택)
 * 결제 중: 월 $5 무료 크레딧, 초과 시 $1.20/1000상품
 *
 * Global(International) provider. 중국→미국 직배송.
 * 배송: 7-15일 기본
 */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const TEMU_AFFILIATE = process.env.TEMU_AFFILIATE_CODE || '';
const ACTOR_ID = 'amit123~temu-products-scraper';
// ⚠️ 빌드 버전 고정: v1.0.37에서 Temu 403 차단 발생 → v1.0.32는 정상 작동 (2026-02-17 확인)
// Apify Actor 업데이트로 깨지면 이 버전 번호를 마지막 작동 버전으로 교체하세요.
const ACTOR_BUILD = '1.0.32';
const TIMEOUT_MS = 30_000; // Apify Actor 실행은 7~15초 소요

// ── Affiliate ──
function appendTemuAffiliate(url: string): string {
  if (!TEMU_AFFILIATE) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}aff_code=${encodeURIComponent(TEMU_AFFILIATE)}`;
}

function buildTemuLink(url: string | undefined, query: string): string {
  const base =
    url && typeof url === 'string' && url.startsWith('http')
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
  const thumb =
    item.thumb_url ?? item.image ?? item.imageUrl ?? item.thumbnail;
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
    item.title ?? item.name ?? item.goods_name ?? 'Temu Product',
  ).trim();

  // Price — try price_info.price_str first, then direct price
  let priceStr = '$0.00';
  let priceNum = 0;

  const priceInfo = item.price_info as Record<string, unknown> | undefined;
  if (priceInfo) {
    const parsed = parsePriceStr(
      priceInfo.price_str ?? priceInfo.price ?? priceInfo.sale_price,
    );
    priceStr = parsed.priceStr;
    priceNum = parsed.priceNum;
  }

  // Fallback: direct price fields
  if (priceNum === 0) {
    const parsed = parsePriceStr(
      item.price ?? item.salePrice ?? item.sale_price,
    );
    priceStr = parsed.priceStr;
    priceNum = parsed.priceNum;
  }

  // Original price for discount display
  let originalPrice = 0;
  if (priceInfo) {
    const orig = parsePriceStr(
      priceInfo.market_price_str ??
        priceInfo.market_price ??
        priceInfo.original_price,
    );
    originalPrice = orig.priceNum;
  }

  const image = normalizeImage(item);

  const rawUrl = item.link_url ?? item.url ?? item.product_url;
  const link = buildTemuLink(rawUrl as string | undefined, query);

  // Rating — from comment object or direct
  let rating = 0;
  let reviewCount = 0;
  const comment = item.comment as Record<string, unknown> | undefined;
  if (comment) {
    rating =
      parseFloat(String(comment.goods_score ?? comment.rating ?? 0)) || 0;
    reviewCount =
      parseInt(
        String(comment.comment_num ?? comment.review_count ?? 0),
        10,
      ) || 0;
  }
  if (rating === 0) {
    rating =
      parseFloat(String(item.rating ?? item.goods_score ?? 0)) || 0;
  }
  if (reviewCount === 0) {
    reviewCount =
      parseInt(String(item.review_count ?? item.reviewCount ?? 0), 10) || 0;
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
    item.goods_id ?? item.product_id ?? item.id ?? `temu_${index}`,
  );

  const parsedDeliveryDays = 10;

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
    parsedDeliveryDays,
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
    if (!APIFY_TOKEN) {
      console.warn('⚠️ [TemuProvider] No APIFY_API_TOKEN — skipping');
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    try {

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Apify 동기 실행 API — Actor 실행 + 결과를 한번에 반환
      // build 파라미터로 작동하는 버전 고정 (최신 버전이 깨질 수 있음)
      const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&build=${ACTOR_BUILD}`;

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
        console.error(
          `❌ [TemuProvider] ${res.status}:`,
          errBody.slice(0, 300),
        );
        return [];
      }

      const data = await res.json();

      // 응답은 상품 배열 직접 반환 (run-sync-get-dataset-items)
      let items: Record<string, unknown>[] = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === 'object') {
        for (const [key, val] of Object.entries(
          data as Record<string, unknown>,
        )) {
          if (Array.isArray(val) && val.length > 0) {
            items = val;
            break;
          }
        }
      }

      if (items.length === 0) {
        console.warn('⚠️ [TemuProvider] No products in response');
        return [];
      }


      const products = items
        .slice(0, 30)
        .map((item, i) =>
          mapItemToProduct(item as Record<string, unknown>, i, trimmed),
        )
        .filter((p) => (p.parsedPrice ?? 0) > 0);

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
