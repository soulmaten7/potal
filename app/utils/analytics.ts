/**
 * GA4 이벤트 헬퍼 — POTAL 쇼핑 비교 에이전트
 *
 * 모든 이벤트는 window.gtag가 있을 때만 전송 (SSR 안전)
 * GA4 이벤트 이름은 snake_case, 파라미터는 GA4 권장 스키마 따름
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ── 내부 헬퍼 ──────────────────────────────

function sendEvent(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

// ── 검색 이벤트 ─────────────────────────────

/** 사용자가 검색을 실행할 때 */
export function trackSearch(params: {
  query: string;
  market: string;
  zipcode?: string;
  hasImage?: boolean;
}): void {
  sendEvent('search', {
    search_term: params.query,
    market: params.market,
    zipcode: params.zipcode || '',
    has_image: params.hasImage || false,
  });
}

/** 검색 결과가 로드됐을 때 */
export function trackSearchResults(params: {
  query: string;
  resultCount: number;
  market: string;
  responseTimeMs?: number;
  providerSuccessCount?: number;
  providerFailCount?: number;
}): void {
  sendEvent('view_search_results', {
    search_term: params.query,
    result_count: params.resultCount,
    market: params.market,
    response_time_ms: params.responseTimeMs ?? 0,
    provider_success: params.providerSuccessCount ?? 0,
    provider_fail: params.providerFailCount ?? 0,
  });
}

// ── 상품 클릭 이벤트 ────────────────────────

/** 상품 "Select" 버튼 클릭 → 쇼핑몰 이동 */
export function trackAffiliateClick(params: {
  productName: string;
  price: number;
  vendor: string;
  url: string;
  position?: number;
}): void {
  sendEvent('affiliate_click', {
    content_type: 'product',
    item_id: params.vendor,
    item_name: params.productName,
    value: params.price,
    currency: 'USD',
    destination: params.vendor,
    link_url: params.url,
    index: params.position ?? 0,
  });
}

/** 상품 카드를 클릭(탭)해서 상세 보기 */
export function trackProductView(params: {
  productName: string;
  price: number;
  vendor: string;
  position?: number;
}): void {
  sendEvent('select_item', {
    item_name: params.productName,
    item_category: params.vendor,
    value: params.price,
    currency: 'USD',
    index: params.position ?? 0,
  });
}

// ── 필터/정렬 이벤트 ────────────────────────

/** 정렬 변경 (Best/Cheapest/Fastest) */
export function trackSortChange(params: {
  sortType: string;
  query?: string;
}): void {
  sendEvent('sort_change', {
    sort_type: params.sortType,
    search_term: params.query ?? '',
  });
}

/** POTAL Filter (AI Smart Suggestion) 적용 */
export function trackFilterApply(params: {
  filterKeywords: string[];
  query?: string;
}): void {
  sendEvent('filter_apply', {
    filter_keywords: params.filterKeywords.join(','),
    filter_count: params.filterKeywords.length,
    search_term: params.query ?? '',
  });
}

/** POTAL Filter 해제 */
export function trackFilterClear(params?: {
  query?: string;
}): void {
  sendEvent('filter_clear', {
    search_term: params?.query ?? '',
  });
}

// ── 위시리스트 이벤트 ───────────────────────

/** 위시리스트 추가 */
export function trackWishlistAdd(params: {
  productName: string;
  price: number;
  vendor: string;
}): void {
  sendEvent('add_to_wishlist', {
    item_name: params.productName,
    value: params.price,
    currency: 'USD',
    item_category: params.vendor,
  });
}

/** 위시리스트 제거 */
export function trackWishlistRemove(params: {
  productName: string;
  vendor: string;
}): void {
  sendEvent('remove_from_wishlist', {
    item_name: params.productName,
    item_category: params.vendor,
  });
}

// ── 질문형 검색 이벤트 ──────────────────────

/** 질문형 쿼리 → 카테고리 추천 표시됨 */
export function trackQuestionQuery(params: {
  query: string;
  suggestedCount: number;
}): void {
  sendEvent('question_query', {
    search_term: params.query,
    suggested_count: params.suggestedCount,
  });
}

/** 추천 카테고리 클릭 */
export function trackSuggestedCategoryClick(params: {
  query: string;
  category: string;
}): void {
  sendEvent('suggested_category_click', {
    original_query: params.query,
    category: params.category,
  });
}

// ── 마켓 전환 이벤트 ────────────────────────

/** All/Domestic/Global 마켓 전환 */
export function trackMarketSwitch(params: {
  market: string;
  query?: string;
}): void {
  sendEvent('market_switch', {
    market: params.market,
    search_term: params.query ?? '',
  });
}

// ── 공유 이벤트 ─────────────────────────────

/** 상품 공유 버튼 클릭 */
export function trackShare(params: {
  productName: string;
  vendor: string;
  method: 'native' | 'clipboard';
}): void {
  sendEvent('share', {
    content_type: 'product',
    item_name: params.productName,
    item_category: params.vendor,
    method: params.method,
  });
}
