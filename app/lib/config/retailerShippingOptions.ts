/**
 * 리테일러별 표준 배송 옵션
 *
 * Supabase 이전 전까지 로컬 config로 관리.
 * 각 리테일러가 일반적으로 제공하는 배송 방식을 정의.
 * 상품별 API 호출 없이 즉시 토글 UI에 표시.
 *
 * POST-MVP: Supabase `retailer_shipping_options` 테이블로 이전 가능
 *   - retailer_id, method, type, min_days, max_days, cost_estimate, trackable
 */

export interface RetailerShippingOption {
  /** 배송 방식 이름 */
  method: string;
  /** 배송 유형 */
  type: 'air' | 'sea' | 'express';
  /** 최소 배송일 */
  minDays: number;
  /** 최대 배송일 */
  maxDays: number;
  /** 예상 배송비 (0 = Free) */
  costEstimate: number;
  /** 추적 가능 여부 */
  trackable: boolean;
  /** 기본 선택 여부 (가장 일반적인 옵션) */
  isDefault?: boolean;
}

export interface RetailerShippingConfig {
  retailerId: string;
  displayName: string;
  options: RetailerShippingOption[];
}

/**
 * 리테일러별 배송 옵션 정의
 *
 * 데이터 출처:
 * - AliExpress: 실제 배송 옵션 기반 (Standard Shipping, Economy, Express)
 * - Shein: 공식 배송 정책 기반
 * - Amazon/Walmart 등 Domestic: 표준 배송 정책 기반
 */
const RETAILER_SHIPPING_OPTIONS: Record<string, RetailerShippingConfig> = {
  // ── Global Retailers (중국발) ──────────────────────
  aliexpress: {
    retailerId: 'aliexpress',
    displayName: 'AliExpress',
    options: [
      {
        method: 'AliExpress Standard',
        type: 'air',
        minDays: 10,
        maxDays: 20,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
      {
        method: 'Economy Shipping',
        type: 'sea',
        minDays: 25,
        maxDays: 45,
        costEstimate: 0,
        trackable: false,
      },
      {
        method: 'DHL / FedEx Express',
        type: 'express',
        minDays: 3,
        maxDays: 7,
        costEstimate: 15,
        trackable: true,
      },
    ],
  },

  shein: {
    retailerId: 'shein',
    displayName: 'SHEIN',
    options: [
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 7,
        maxDays: 14,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
      {
        method: 'Economy Shipping',
        type: 'sea',
        minDays: 15,
        maxDays: 30,
        costEstimate: 0,
        trackable: false,
      },
      {
        method: 'Express Shipping',
        type: 'express',
        minDays: 3,
        maxDays: 7,
        costEstimate: 12.90,
        trackable: true,
      },
    ],
  },

  temu: {
    retailerId: 'temu',
    displayName: 'Temu',
    options: [
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 7,
        maxDays: 15,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
      {
        method: 'Economy Shipping',
        type: 'sea',
        minDays: 15,
        maxDays: 30,
        costEstimate: 0,
        trackable: false,
      },
    ],
  },

  // ── Domestic Retailers (미국 내) ───────────────────
  amazon: {
    retailerId: 'amazon',
    displayName: 'Amazon',
    options: [
      {
        method: 'Prime 2-Day',
        type: 'express',
        minDays: 1,
        maxDays: 2,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 3,
        maxDays: 5,
        costEstimate: 0,
        trackable: true,
      },
    ],
  },

  walmart: {
    retailerId: 'walmart',
    displayName: 'Walmart',
    options: [
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 3,
        maxDays: 5,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
      {
        method: 'Express (W+)',
        type: 'express',
        minDays: 1,
        maxDays: 2,
        costEstimate: 0,
        trackable: true,
      },
    ],
  },

  target: {
    retailerId: 'target',
    displayName: 'Target',
    options: [
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 3,
        maxDays: 5,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
    ],
  },

  bestbuy: {
    retailerId: 'bestbuy',
    displayName: 'Best Buy',
    options: [
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 3,
        maxDays: 7,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
      {
        method: 'Store Pickup',
        type: 'express',
        minDays: 0,
        maxDays: 1,
        costEstimate: 0,
        trackable: false,
      },
    ],
  },

  ebay: {
    retailerId: 'ebay',
    displayName: 'eBay',
    options: [
      {
        method: 'Standard Shipping',
        type: 'air',
        minDays: 5,
        maxDays: 10,
        costEstimate: 0,
        trackable: true,
        isDefault: true,
      },
    ],
  },
};

/**
 * 리테일러 이름으로 배송 옵션 조회
 */
export function getRetailerShippingOptions(retailerName: string): RetailerShippingConfig | null {
  const key = retailerName.toLowerCase().replace(/\s+/g, '').trim();

  // 직접 매치
  if (RETAILER_SHIPPING_OPTIONS[key]) return RETAILER_SHIPPING_OPTIONS[key];

  // 부분 매치
  for (const [id, config] of Object.entries(RETAILER_SHIPPING_OPTIONS)) {
    if (key.includes(id) || id.includes(key)) return config;
  }

  return null;
}

/**
 * Product에 배송 옵션을 enrich
 * shippingOptions가 이미 있으면 (API에서 가져온 경우) 건드리지 않음
 */
export function enrichProductWithShippingOptions(product: {
  site?: string;
  seller?: string;
  shippingOptions?: unknown[];
}): RetailerShippingOption[] | null {
  // 이미 API에서 가져온 배송 옵션이 있으면 사용
  if (product.shippingOptions && product.shippingOptions.length > 0) return null;

  const siteName = product.site || product.seller || '';
  const config = getRetailerShippingOptions(siteName);
  if (!config) return null;

  return config.options;
}
