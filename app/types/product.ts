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
}
