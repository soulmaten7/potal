/**
 * GA4 이벤트 헬퍼 – 쇼핑몰 이동(Affiliate Link Click) 추적
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type TrackAffiliateClickParams = {
  productName: string;
  price: number;
  vendor: string;
  url: string;
};

/**
 * 사용자가 상품 링크(쇼핑몰 이동)를 클릭할 때 GA4에 이벤트 전송.
 * window.gtag가 있을 때만 전송하여 타입/런타임 오류를 방지합니다.
 */
export function trackAffiliateClick({
  productName,
  price,
  vendor,
  url,
}: TrackAffiliateClickParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", "affiliate_click", {
    content_type: "product",
    item_id: vendor,
    item_name: productName,
    value: price,
    currency: "USD",
    destination: vendor,
    link_url: url,
  });
}
