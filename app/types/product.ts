export interface ProductVariant {
  site: string;
  price: string;
  link: string;
  shipping: 'Domestic' | 'International';
  trustScore?: number;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  site: string;
  /** US 시장: Domestic(내수) | International(직구). 프론트 필터는 shipping 또는 category로 분류 */
  shipping: 'Domestic' | 'International';
  /** 필터 보조: 'domestic' | 'international' (소문자). page.tsx (p.shipping || p.category).includes('domestic'|'international') */
  category?: 'domestic' | 'international';
  deliveryDays?: string;
  link?: string;
  /** 배송비 (없거나 무료면 0). Total Landed Cost 계산용 */
  shippingPrice?: number;
  /** 물건값 + 배송비. 최종 지불 가격 */
  totalPrice?: number;
  trustScore?: number;
  variants?: ProductVariant[];
  bestPrice?: string;
  bestPriceSite?: string;
  /** Amazon Prime 여부. 배송 속도 추정에 사용 */
  is_prime?: boolean;
  /** API에서 내려올 수 있음. true면 노출하지 않음 (광고/스폰서 필터링) */
  is_sponsored?: boolean;
  is_ad?: boolean;
  /** 브랜드명. 동적 필터(Brands) 추출용 */
  brand?: string;

  // ── ScoringEngine에서 추가되는 필드 (API 응답에 포함) ──
  /** Best Score (0-100). ScoringEngine이 계산. 높을수록 좋은 상품 */
  bestScore?: number;
  /** 파싱된 가격 (숫자). 문자열 재파싱 없이 정렬에 사용 */
  parsedPrice?: number;
  /** 파싱된 배송일 (숫자, 일 단위). 문자열 재파싱 없이 정렬에 사용 */
  parsedDeliveryDays?: number;

  // ── FraudFilter에서 추가되는 필드 ──
  /** FraudFilter가 의심 플래그를 단 경우. 사유 배열 (예: ['price_too_low', 'low_seller_trust']) */
  fraudFlags?: string[];
  /** rating (Amazon API 등에서 내려옴) */
  rating?: number;
  /** 리뷰 수 */
  reviewCount?: number;

  // ── Shipping Options (AliExpress 등 Global 상품) ──
  /** 배송 옵션 목록 (항공/해운/특급 등) */
  shippingOptions?: Array<{
    method: string;
    cost: number;
    minDays: number;
    maxDays: number;
    type: 'air' | 'sea' | 'express';
  }>;
  /** 현재 선택된 배송 방식 index (기본 0 = fastest) */
  selectedShippingIndex?: number;

  // ── Price Range (AliExpress 등 옵션별 가격차가 큰 상품) ──
  /** 가격 범위의 최저가. 존재하면 "From $X ~ $Y" 형태로 표시 */
  priceRangeMin?: number;

  // ── Search Card 전용 필드 ──
  /** true면 실제 상품이 아닌 "해당 사이트에서 검색" CTA 카드 */
  isSearchCard?: boolean;
  /** 검색카드 태그라인 (예: "Fast fashion, global shipping") */
  searchCardTagline?: string;
}
