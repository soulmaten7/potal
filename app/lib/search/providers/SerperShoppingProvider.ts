/**
 * SerperShoppingProvider — Google Shopping API 기반 공통 베이스 클래스
 *
 * 2단계 전략:
 * 1단계) Serper Shopping API → 가격/이미지/평점 데이터 확보
 * 2단계) Serper Web Search → 실제 상품 페이지 URL 확보 (검색 화면 대신 상품 페이지로!)
 *
 * 핵심 최적화:
 * - RequestThrottler (5/sec) + early release: deadline 초과 시 슬롯 즉시 반환
 * - 429 자동 재시도: 1회 재시도 + 500ms 딜레이
 * - provider당 상위 3개 상품 URL 해석 (전략1만 = site: 검색)
 * - 시간 예산: provider 시작 후 10초 안에 완료
 * - 지역 URL 자동 정규화 (temu.com/my-en/ → temu.com/)
 *
 * 환경변수: SERPER_API_KEY (필수)
 */

import type { Product } from '@/app/types/product';
import type { SearchProvider } from '../types';

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';
const SHOPPING_TIMEOUT_MS = 8_000;
const WEB_SEARCH_TIMEOUT_MS = 5_000;

// ── 크레딧 절약: 5분 캐시 ──
// 같은 쿼리 반복 시 API 호출 안 함 (1회 검색 = ~43 크레딧 절약)
const apiCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  apiCache.set(key, { data, ts: Date.now() });
  // 메모리 관리: 1000개 초과 시 오래된 것부터 삭제
  if (apiCache.size > 1000) {
    const oldest = apiCache.keys().next().value;
    if (oldest) apiCache.delete(oldest);
  }
}

// ═══════════════════════════════════════════════════════════════
// RequestThrottler — 초당 N개씩 요청을 순차 발사 + early release
//
// waitForSlot()이 { releaseEarly } 반환:
// → 정상: intervalMs 후 자동 해제
// → deadline 초과: releaseEarly() 호출 → 즉시 해제 → 다음 호출자 0ms 대기
// → 결과: deadline 초과 요청은 throttler 시간을 낭비하지 않음
// ═══════════════════════════════════════════════════════════════
class RequestThrottler {
  private chain: Promise<void> = Promise.resolve();
  private readonly intervalMs: number;

  constructor(requestsPerSecond: number) {
    this.intervalMs = Math.ceil(1000 / requestsPerSecond);
  }

  async waitForSlot(): Promise<{ releaseEarly: () => void }> {
    const prev = this.chain;
    let release!: () => void;
    this.chain = new Promise<void>((r) => { release = r; });
    await prev;

    let released = false;
    const doRelease = () => {
      if (!released) { released = true; release(); }
    };

    const timer = setTimeout(doRelease, this.intervalMs);

    return {
      releaseEarly: () => { clearTimeout(timer); doRelease(); },
    };
  }
}

// 전역 throttler: 5/sec (200ms 간격)
const serperThrottler = new RequestThrottler(5);

// ── Serper Shopping response types ──
export interface SerperShoppingItem {
  title?: string;
  source?: string;
  link?: string;
  price?: string;
  imageUrl?: string;
  thumbnail?: string;
  rating?: number;
  ratingCount?: number;
  productId?: string;
  position?: number;
  delivery?: string;
}

interface SerperShoppingResponse {
  shopping?: SerperShoppingItem[];
  searchParameters?: Record<string, unknown>;
}

interface SerperWebResult {
  title?: string;
  link?: string;
  snippet?: string;
}

interface SerperWebResponse {
  organic?: SerperWebResult[];
}

// ── Price parsing ──
function parsePriceStr(raw: string): { priceStr: string; priceNum: number } {
  if (!raw) return { priceStr: '$0.00', priceNum: 0 };
  const cleaned = raw.replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n) || n <= 0) return { priceStr: '$0.00', priceNum: 0 };
  return { priceStr: `$${n.toFixed(2)}`, priceNum: n };
}

// ── URL이 카테고리/검색 페이지인지 판별 ──
function isCategoryOrSearchUrl(url: string): boolean {
  const path = url.toLowerCase();
  return (
    path.includes('/search') || path.includes('/shop/') ||
    path.includes('/category/') || path.includes('/c/') ||
    path.includes('/b/') || path.includes('/sb0/') ||
    path.includes('/sb1/') || path.includes('/buy/') ||
    path.includes('/market/') || path.includes('/n/') ||
    path.includes('pcmcat') || path.endsWith('.c') ||
    path.includes('/reviews/') || path.includes('/review/') ||
    path.includes('/items.aspx') || path.includes('/pdsearch')
  );
}

// ── 지역 URL → US URL 정규화 ──
const REGION_PATH_PREFIXES = /^\/(my-en|ge-en|fi-en|om-en|jo-en|[a-z]{2})\//i;

function normalizeRegionalUrl(url: string, targetDomain: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const domain = targetDomain.toLowerCase();

    if (hostname !== domain && hostname !== `www.${domain}`) {
      if (hostname.endsWith(`.${domain}`)) {
        const sub = hostname.replace(`.${domain}`, '');
        if (sub !== 'www' && sub !== 'us') {
          parsed.hostname = `us.${domain}`;
        }
      }
    }

    const pathMatch = parsed.pathname.match(REGION_PATH_PREFIXES);
    if (pathMatch && pathMatch[1].toLowerCase() !== 'us') {
      parsed.pathname = parsed.pathname.replace(REGION_PATH_PREFIXES, '/');
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

// ── 429 재시도 가능한 Serper fetch (early release 지원) ──
async function serperFetch(
  url: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  label: string,
  deadline?: number,
): Promise<Response | null> {
  const doFetch = async (): Promise<Response | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('abort')) {
        console.warn(`⏱️ ${label} timeout (${timeoutMs}ms)`);
      } else {
        console.warn(`⚠️ ${label} error: ${msg}`);
      }
      return null;
    }
  };

  // throttler 대기
  const { releaseEarly } = await serperThrottler.waitForSlot();

  // ★ deadline 체크: 시간 초과면 슬롯 즉시 반환 → 다음 요청이 바로 진행
  if (deadline && Date.now() > deadline) {
    releaseEarly();
    return null;
  }

  const res = await doFetch();

  // 429면 1회 재시도 (500ms 후)
  if (res && res.status === 429) {
    console.warn(`⚠️ ${label} HTTP 429 → 500ms 후 재시도`);
    await new Promise(r => setTimeout(r, 500));
    const { releaseEarly: re2 } = await serperThrottler.waitForSlot();
    if (deadline && Date.now() > deadline) {
      re2();
      return null;
    }
    const retry = await doFetch();
    if (retry && retry.status === 429) {
      console.warn(`❌ ${label} HTTP 429 재시도도 실패`);
      return null;
    }
    return retry;
  }

  return res;
}

/**
 * 추상 베이스 클래스
 */
/**
 * Provider 카테고리 — 쿼리 기반 사전 필터링에 사용
 *
 * 'general' = 항상 호출 (범용 마켓플레이스)
 * 나머지 = 쿼리 카테고리와 매칭될 때만 호출
 */
export type ProviderCategory =
  | 'general'        // 뭐든 파는 곳 (Etsy, Mercari, Temu)
  | 'electronics'    // 전자제품 (Best Buy, Newegg)
  | 'home'           // 가구/인테리어 (IKEA, Wayfair)
  | 'home_improvement' // 홈 수리/건축자재 (Home Depot, Lowes)
  | 'fashion'        // 패션/의류 (Nordstrom, ASOS, Farfetch, MyTheresa, Shein)
  | 'beauty'         // 뷰티/화장품 (Sephora, YesStyle)
  | 'health'         // 건강/보충제 (iHerb)
  | 'toys'           // 장난감/취미 (다수 매장에서 부분 취급)
  | 'sports'         // 스포츠/아웃도어
  | 'kitchen'        // 주방용품
  | 'baby'           // 유아용품
  | 'pet'            // 반려동물
  | 'office'         // 사무용품
  | 'automotive';    // 자동차용품

export abstract class SerperShoppingProvider implements SearchProvider {
  abstract readonly name: string;
  abstract readonly type: 'domestic' | 'global';
  abstract readonly storeKeyword: string;
  abstract readonly sourceFilter: RegExp;
  abstract readonly domain: string;
  abstract readonly searchUrlTemplate: string;
  abstract readonly affiliateParamKey: string;
  abstract readonly affiliateEnvKey: string;
  abstract readonly defaultDeliveryDays: string;
  abstract readonly defaultParsedDeliveryDays: number;
  abstract readonly defaultShippingPrice: number;

  /**
   * 이 provider가 취급하는 카테고리들
   * 'general'이 포함되면 모든 검색에서 호출됨
   */
  abstract readonly categories: ProviderCategory[];

  protected usesPlusEncoding = false;
  protected enableDirectUrl = true;
  /**
   * provider당 반환 + URL 해석할 상품 수
   * 2개 = 13 providers × 2 = 26 web searches → 429 없이 100% 성공
   * + Amazon/Walmart/eBay/Target (RapidAPI)는 별도로 직접 URL 보유
   */
  protected directUrlLimit = 2;
  protected useGoogleFallback = true;

  /**
   * Web Search의 site: 연산자에 경로 힌트 추가
   * 예: "listing/" → site:etsy.com/listing/ 으로 검색
   */
  protected siteSearchPath = '';

  // ── Affiliate ──
  protected appendAffiliate(url: string): string {
    const affiliate = process.env[this.affiliateEnvKey]?.trim();
    if (!affiliate) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${this.affiliateParamKey}=${encodeURIComponent(affiliate)}`;
  }

  // ── Trust Score ──
  protected calculateTrustScore(rating: number, reviewCount: number, priceNum: number): number {
    let score = 40;
    if (rating >= 4.5) score += 15;
    else if (rating >= 4.0) score += 10;
    else if (rating >= 3.5) score += 5;
    if (reviewCount > 1000) score += 10;
    else if (reviewCount > 100) score += 5;
    if (priceNum > 0) score += 5;
    return Math.min(score, 100);
  }

  // ── Build fallback search link ──
  protected buildSearchLink(title: string): string {
    const words = title.split(/\s+/).slice(0, 5).join(' ');
    const cleaned = words.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    if (this.useGoogleFallback) {
      const q = encodeURIComponent(`site:${this.domain} ${cleaned}`).replace(/%20/g, '+');
      // btnI = "I'm Feeling Lucky" → 첫 번째 검색 결과(상품 페이지)로 자동 리다이렉트
      return `https://www.google.com/search?q=${q}&btnI`;
    }

    const encoded = this.usesPlusEncoding
      ? encodeURIComponent(cleaned).replace(/%20/g, '+')
      : encodeURIComponent(cleaned);
    const url = this.searchUrlTemplate.replace('{query}', encoded);
    return this.appendAffiliate(url);
  }

  // ── 도메인 매칭 ──
  private matchesDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const target = this.domain.toLowerCase();
      return hostname === target || hostname.endsWith(`.${target}`);
    } catch {
      return url.toLowerCase().includes(this.domain.toLowerCase());
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2단계: Web Search로 실제 상품 URL 찾기
  // ══════════════════════════════════════════════════════════
  protected async resolveDirectUrl(title: string, deadline: number): Promise<string | null> {
    const words = title.split(/\s+/);
    const cleanWords = words.map(w => w.replace(/[^a-zA-Z0-9]/g, '')).filter(w => w.length > 0);

    // site: 연산자 + 앞 6단어 (~90% 성공률)
    const sitePrefix = this.siteSearchPath
      ? `site:${this.domain}/${this.siteSearchPath}`
      : `site:${this.domain}`;
    const q = cleanWords.slice(0, 6).join(' ');
    const url = await this.doWebSearch(`${sitePrefix} ${q}`, true, deadline);
    if (url) return normalizeRegionalUrl(url, this.domain);

    return null;
  }

  // ── Web Search 실행 (캐시 지원) ──
  private async doWebSearch(query: string, trustDomain: boolean, deadline?: number): Promise<string | null> {
    const label = `[${this.name}] WebSearch`;
    const cacheKey = `ws:${query}`;

    // 캐시 히트 → API 호출 안 함
    const cached = getCached<SerperWebResponse>(cacheKey);
    if (cached) {
      const results = cached.organic || [];
      for (const r of results) {
        if (!r.link) continue;
        if (!trustDomain && !this.matchesDomain(r.link)) continue;
        if (!isCategoryOrSearchUrl(r.link)) return r.link;
      }
      return null;
    }

    const res = await serperFetch(
      'https://google.serper.dev/search',
      { q: query, gl: 'us', hl: 'en', num: 5 },
      WEB_SEARCH_TIMEOUT_MS,
      label,
      deadline,
    );

    if (!res || !res.ok) {
      if (res) console.warn(`⚠️ ${label} HTTP ${res.status}: ${query.slice(0, 60)}`);
      return null;
    }

    const data: SerperWebResponse = await res.json();
    setCache(cacheKey, data); // 캐시 저장
    const results = data.organic || [];

    for (const r of results) {
      if (!r.link) continue;
      if (!trustDomain && !this.matchesDomain(r.link)) continue;
      if (!isCategoryOrSearchUrl(r.link)) {
        return r.link;
      }
    }

    return null;
  }

  // ── 상품 목록에 직접 URL 일괄 적용 ──
  protected async applyDirectUrls(products: Product[], searchStartTime: number): Promise<void> {
    if (!this.enableDirectUrl) return;

    const limit = Math.min(this.directUrlLimit, products.length);
    const deadline = searchStartTime + 10_000;
    const resolveStart = Date.now();

    const tasks = products.slice(0, limit).map(async (product, i) => {
      const title = product.name || '';
      const directUrl = await this.resolveDirectUrl(title, deadline);
      if (directUrl) {
        products[i] = {
          ...products[i],
          link: this.appendAffiliate(directUrl),
        };
        console.log(`  🔗 [${this.name}] ✅ ${title.slice(0, 40)}`);
      } else if (Date.now() > deadline) {
        console.log(`  🔗 [${this.name}] ⏰ ${title.slice(0, 40)} → time limit`);
      } else {
        console.log(`  🔗 [${this.name}] ❌ ${title.slice(0, 40)} → fallback`);
      }
    });

    await Promise.allSettled(tasks);
    const elapsed = Date.now() - resolveStart;
    console.log(`  ⏱️ [${this.name}] URL resolution: ${elapsed}ms (${limit} products)`);
  }

  // ── Map Serper item → Product ──
  protected mapToProduct(item: SerperShoppingItem, index: number): Product {
    const title = (item.title || `${this.name} Product`).trim();
    const { priceStr, priceNum } = parsePriceStr(item.price || '');
    const image = item.imageUrl || item.thumbnail || '';
    const link = this.buildSearchLink(title);
    const rating = typeof item.rating === 'number' ? Math.min(item.rating, 5) : 0;
    const reviewCount = typeof item.ratingCount === 'number' ? item.ratingCount : 0;
    const productId = item.productId || `${this.storeKeyword}_${index}`;
    const trustScore = this.calculateTrustScore(rating, reviewCount, priceNum);

    const shipping: 'Domestic' | 'International' = this.type === 'domestic' ? 'Domestic' : 'International';
    const category: 'domestic' | 'international' = this.type === 'domestic' ? 'domestic' : 'international';

    return {
      id: `${this.storeKeyword}-${productId}-${index}`,
      name: title,
      price: priceStr,
      parsedPrice: priceNum,
      image,
      link,
      site: this.name,
      seller: this.name,
      rating,
      reviewCount,
      shipping,
      category,
      deliveryDays: this.defaultDeliveryDays,
      delivery: 'Standard Shipping',
      parsedDeliveryDays: this.defaultParsedDeliveryDays,
      shippingPrice: this.defaultShippingPrice,
      totalPrice: priceNum + this.defaultShippingPrice,
      trustScore,
      is_prime: false,
      badges: [],
      brand: undefined,
    } as unknown as Product;
  }

  // ── Core search method ──
  async search(query: string, page: number = 1): Promise<Product[]> {
    if (!SERPER_API_KEY) {
      console.warn(`⚠️ [${this.name}] No SERPER_API_KEY — skipping`);
      return [];
    }

    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const searchStartTime = Date.now();

    try {
      const shoppingQuery = `${trimmed} ${this.storeKeyword}`;
      const shopCacheKey = `shop:${shoppingQuery}`;

      // 캐시 히트 → Shopping API 호출 안 함 (17크레딧 절약)
      let data: SerperShoppingResponse;
      const cachedShop = getCached<SerperShoppingResponse>(shopCacheKey);

      if (cachedShop) {
        console.log(`📦 [${this.name}] Shopping cache hit`);
        data = cachedShop;
      } else {
        const label = `[${this.name}] Shopping`;
        const res = await serperFetch(
          'https://google.serper.dev/shopping',
          { q: shoppingQuery, gl: 'us', hl: 'en', num: 30 },
          SHOPPING_TIMEOUT_MS,
          label,
        );

        if (!res || !res.ok) {
          if (res) console.error(`❌ ${label} HTTP ${res.status}`);
          return [];
        }

        data = await res.json();
        setCache(shopCacheKey, data); // 캐시 저장
      }

      if (!data.shopping || data.shopping.length === 0) {
        console.warn(`⚠️ [${this.name}] No shopping results from Serper`);
        return [];
      }

      const filtered = data.shopping.filter((item) => {
        const source = (item.source || '').toLowerCase();
        return this.sourceFilter.test(source);
      });

      if (filtered.length === 0) {
        console.warn(`⚠️ [${this.name}] No ${this.name} products in shopping results`);
        return [];
      }

      // directUrlLimit만큼만 반환 → 모든 상품이 실제 상품 페이지 URL을 가짐
      // 20개 반환하면 85%가 Google 검색 fallback → 사용자 경험 최악
      // 3개 반환하면 100%가 direct URL → 13 providers × 3 = 39개 상품 충분
      const products = filtered
        .slice(0, this.enableDirectUrl ? this.directUrlLimit : 20)
        .map((item, i) => this.mapToProduct(item, i))
        .filter((p) => (p.parsedPrice ?? 0) > 0);

      // 2단계: 실제 상품 URL 해석 (시간 예산 전달)
      if (this.enableDirectUrl && products.length > 0) {
        await this.applyDirectUrls(products, searchStartTime);
      }

      if (products.length > 0) {
        console.log(`✅ [${this.name}] ${products.length} products via Google Shopping`);
      }

      return products;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        console.warn(`⏱️ [${this.name}] Timeout (${SHOPPING_TIMEOUT_MS}ms)`);
      } else {
        console.error(`❌ [${this.name}] Error:`, msg);
      }
      return [];
    }
  }
}
