/**
 * AliExpress Shipping Detail Service
 *
 * 검색 결과의 각 상품에 대해 배송 옵션(항공/해운/특급 등)을 조회.
 * Endpoint: GET /shipping/{product_id}?country_code=US
 * Host: aliexpress-data.p.rapidapi.com
 *
 * 쿼터 관리:
 * - Pro 플랜: 12,000 requests/mo
 * - 검색 1회 = 1 search call + N shipping calls
 * - 상위 N개만 호출하여 쿼터 절약
 */

import type { Product } from '@/app/types/product';

// ─── Types ────────────────────────────────────────────

export interface ShippingOption {
  /** 배송 방식 이름 (e.g., "AliExpress Standard", "ePacket", "DHL Express") */
  method: string;
  /** 배송 비용 (USD) */
  cost: number;
  /** 최소 배송일 */
  minDays: number;
  /** 최대 배송일 */
  maxDays: number;
  /** 배송 유형: air(항공), sea(해운), express(특급) */
  type: 'air' | 'sea' | 'express';
  /** 추적 가능 여부 */
  trackable: boolean;
}

export interface ProductShippingInfo {
  productId: string;
  options: ShippingOption[];
  /** 가장 빠른 배송 옵션 */
  fastest: ShippingOption | null;
  /** 가장 저렴한 배송 옵션 */
  cheapest: ShippingOption | null;
}

// ─── Shipping Method Classification ──────────────────

/**
 * 배송 방식명 → 유형 분류
 * AliExpress는 다양한 물류사를 사용, 이름으로 분류
 */
function classifyShippingType(methodName: string): 'air' | 'sea' | 'express' {
  const lower = methodName.toLowerCase();

  // Express courier (3-7 days)
  if (
    lower.includes('dhl') ||
    lower.includes('fedex') ||
    lower.includes('ups') ||
    lower.includes('ems') ||
    lower.includes('express') ||
    lower.includes('tnt') ||
    lower.includes('dpd') ||
    lower.includes('sf express')
  ) {
    return 'express';
  }

  // Sea shipping (30-60 days)
  if (
    lower.includes('sea') ||
    lower.includes('船') ||
    lower.includes('ocean') ||
    lower.includes('economy') && lower.includes('ship')
  ) {
    return 'sea';
  }

  // Default: Air mail / Standard (10-20 days)
  return 'air';
}

// ─── API Call ─────────────────────────────────────────

/**
 * 단일 상품의 배송 옵션 조회
 */
async function fetchShippingOptions(
  productId: string,
  apiKey: string,
  host: string
): Promise<ShippingOption[]> {
  // AliExpress product ID에서 provider prefix 제거
  const cleanId = productId.replace(/^aliexpress_/, '');

  try {
    const url = new URL(`https://${host}/shipping/${cleanId}`);
    url.searchParams.set('country_code', 'US');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
      signal: AbortSignal.timeout(8000), // 8s timeout per call
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json() as Record<string, unknown>;

    // Response parsing — 여러 구조 시도
    let methods: Record<string, unknown>[] = [];

    const dataAny = data as any;
    if (Array.isArray(dataAny.data?.shippingOptions)) {
      methods = dataAny.data.shippingOptions;
    } else if (Array.isArray(dataAny.data?.logistics)) {
      methods = dataAny.data.logistics;
    } else if (Array.isArray(dataAny.data?.freightResult?.freights)) {
      methods = dataAny.data.freightResult.freights;
    } else if (Array.isArray(dataAny.result?.shippingOptions)) {
      methods = dataAny.result.shippingOptions;
    } else if (Array.isArray(dataAny.shippingOptions)) {
      methods = dataAny.shippingOptions;
    } else if (Array.isArray(data.data)) {
      methods = data.data as Record<string, unknown>[];
    } else {
      // Deep scan for array of shipping objects
      const scan = (obj: Record<string, unknown>, depth = 0): Record<string, unknown>[] => {
        if (depth > 3) return [];
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
            const first = val[0] as Record<string, unknown>;
            if (first.serviceName || first.company || first.method || first.shipping_method || first.logisticsName) {
              return val as Record<string, unknown>[];
            }
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const nested = scan(val as Record<string, unknown>, depth + 1);
            if (nested.length > 0) return nested;
          }
        }
        return [];
      };
      methods = scan(data);
    }

    if (methods.length === 0) {
      return [];
    }

    return methods.map(m => {
      const name = String(
        m.serviceName ?? m.company ?? m.method ?? m.shipping_method ??
        m.logisticsName ?? m.name ?? m.carrier ?? 'Unknown'
      );

      // Cost
      let cost = 0;
      const rawCost = m.freightAmount ?? m.shippingFee ?? m.cost ?? m.price ?? m.amount;
      if (rawCost != null) {
        const s = String(rawCost).replace(/[^0-9.]/g, '');
        const n = parseFloat(s);
        if (!isNaN(n)) cost = n;
      }
      // "Free" detection
      const costStr = String(rawCost ?? '').toLowerCase();
      if (costStr.includes('free')) cost = 0;

      // Delivery days
      let minDays = 10, maxDays = 20;
      const deliveryMin = m.deliveryMinDay ?? m.minDays ?? m.estimatedDeliveryMin ?? m.time_min;
      const deliveryMax = m.deliveryMaxDay ?? m.maxDays ?? m.estimatedDeliveryMax ?? m.time_max;
      if (deliveryMin != null) minDays = parseInt(String(deliveryMin), 10) || 10;
      if (deliveryMax != null) maxDays = parseInt(String(deliveryMax), 10) || 20;

      // delivery time string: "15-30 working days"
      const timeStr = String(m.deliveryTime ?? m.estimatedDelivery ?? m.time ?? '');
      const dayMatch = timeStr.match(/(\d+)\s*[-–~]\s*(\d+)/);
      if (dayMatch) {
        minDays = parseInt(dayMatch[1], 10) || minDays;
        maxDays = parseInt(dayMatch[2], 10) || maxDays;
      }

      // Tracking
      const trackable = !!(m.tracking === true || m.hasTracking === true || m.trackable === true);

      return {
        method: name,
        cost,
        minDays,
        maxDays,
        type: classifyShippingType(name),
        trackable,
      };
    }).filter(o => o.method !== 'Unknown');
  } catch (err) {
    return [];
  }
}

// ─── Batch Fetch (상위 N개) ───────────────────────────

/**
 * 여러 상품의 배송 옵션을 병렬로 조회.
 * maxProducts로 호출 수 제한 (쿼터 관리).
 */
export async function fetchShippingForProducts(
  products: Product[],
  options?: { maxProducts?: number }
): Promise<Map<string, ProductShippingInfo>> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST_ALIEXPRESS ?? 'aliexpress-data.p.rapidapi.com';
  const max = options?.maxProducts ?? 10; // 기본 상위 10개만

  const result = new Map<string, ProductShippingInfo>();

  if (!apiKey?.trim()) {
    return result;
  }

  // AliExpress 상품만 필터
  const aliProducts = products
    .filter(p => p.id.startsWith('aliexpress_'))
    .slice(0, max);

  if (aliProducts.length === 0) return result;

  // 병렬 호출 (Promise.allSettled)
  const promises = aliProducts.map(async (p) => {
    const options = await fetchShippingOptions(p.id, apiKey, host);
    return { productId: p.id, options };
  });

  const settled = await Promise.allSettled(promises);

  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value.options.length > 0) {
      const { productId, options } = s.value;

      // Sort by delivery time
      const sorted = [...options].sort((a, b) => a.minDays - b.minDays);
      const cheapest = [...options].sort((a, b) => a.cost - b.cost)[0] || null;

      result.set(productId, {
        productId,
        options: sorted,
        fastest: sorted[0] || null,
        cheapest,
      });
    }
  }

  return result;
}

// ─── Default shipping options (API 미호출 시 fallback) ─

export function getDefaultShippingOptions(): ShippingOption[] {
  return [
    {
      method: 'AliExpress Standard',
      cost: 0,
      minDays: 10,
      maxDays: 20,
      type: 'air',
      trackable: true,
    },
    {
      method: 'Economy Shipping',
      cost: 0,
      minDays: 25,
      maxDays: 45,
      type: 'sea',
      trackable: false,
    },
  ];
}
