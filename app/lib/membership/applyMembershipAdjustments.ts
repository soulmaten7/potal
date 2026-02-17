/**
 * applyMembershipAdjustments — 클라이언트 사이드 멤버십 보정
 *
 * API가 리턴하는 "비회원 기준" 가격을, 유저가 활성화한 멤버십에 맞게 보정합니다.
 *
 * 보정 순서:
 *   1. 해당 상품의 리테일러에 대해 멤버십 활성화 여부 확인
 *   2. 활성화되어 있으면 → 회원 혜택 적용 (배송비 감소, 배송일 단축, 가격 할인)
 *   3. 활성화되어 있지 않으면 → 비회원 패널티 적용 (배송비 추가 가능)
 *   4. totalPrice 재계산
 */

import {
  MEMBERSHIP_REGISTRY,
  type MembershipProgram,
} from './MembershipConfig';

import {
  parseDeliveryDays,
  parsePriceToNum,
  estimateTrustScore,
  estimateReturnPolicyScore,
  DEFAULT_WEIGHTS,
} from '../search/ScoringEngine';

export interface MembershipAdjustedProduct {
  /** 보정된 배송비 */
  adjustedShippingPrice: number;
  /** 보정된 배송일 문자열 */
  adjustedDeliveryDays: string;
  /** 보정된 상품가격 (할인 적용) */
  adjustedProductPrice: number;
  /** 보정된 총 가격 (totalPrice 재계산) */
  adjustedTotalPrice: number;
  /** 적용된 멤버십 프로그램 ID (없으면 null) */
  appliedMembership: string | null;
  /** 멤버십 배지 정보 (UI 표시용) */
  membershipBadge: { label: string; badgeColor: string; badgeBg: string } | null;
  /** 원래 값과 차이가 있는지 */
  hasAdjustment: boolean;
}

/** retailer name → program mapping을 미리 빌드 */
const retailerProgramMap = new Map<string, { programId: string; program: MembershipProgram }[]>();
for (const rm of MEMBERSHIP_REGISTRY) {
  const key = rm.retailer.toLowerCase();
  const programs = rm.programs.map(p => ({ programId: p.id, program: p }));
  retailerProgramMap.set(key, programs);
}

/**
 * 단일 상품에 멤버십 보정 적용
 */
export function adjustProductForMembership(
  product: {
    price: number | string;
    totalPrice?: number;
    shippingPrice?: number;
    seller?: string;
    site?: string;
    deliveryDays?: string;
    arrives?: string;
    parsedDeliveryDays?: number;
  },
  activeMemberships: Record<string, boolean>,
): MembershipAdjustedProduct {
  const retailerName = (product.seller || product.site || '').toLowerCase().trim();
  const productPrice = typeof product.price === 'number'
    ? product.price
    : parseFloat(String(product.price).replace(/[^0-9.-]/g, '')) || 0;

  const originalShipping = product.shippingPrice ?? 0;
  const originalTotal = product.totalPrice ?? productPrice;
  const originalDeliveryDays = product.deliveryDays || product.arrives || '';

  // 이 리테일러에 해당하는 멤버십 프로그램 찾기
  const programs = retailerProgramMap.get(retailerName);

  if (!programs || programs.length === 0) {
    // 멤버십 프로그램이 없는 리테일러 → 보정 없음
    return {
      adjustedShippingPrice: originalShipping,
      adjustedDeliveryDays: originalDeliveryDays,
      adjustedProductPrice: productPrice,
      adjustedTotalPrice: originalTotal,
      appliedMembership: null,
      membershipBadge: null,
      hasAdjustment: false,
    };
  }

  // 활성화된 멤버십 프로그램 찾기
  let activeProgram: MembershipProgram | null = null;
  let activeProgramId: string | null = null;

  for (const { programId, program } of programs) {
    if (activeMemberships[programId]) {
      activeProgram = program;
      activeProgramId = programId;
      break;
    }
  }

  if (activeProgram) {
    // ── 회원 혜택 적용 ──
    let adjustedShipping = originalShipping;
    let adjustedDelivery = originalDeliveryDays;
    let adjustedPrice = productPrice;

    // 배송비 보정
    if (activeProgram.shippingOverride !== null) {
      adjustedShipping = activeProgram.shippingOverride;
    }

    // 배송일 보정
    if (activeProgram.deliveryDaysOverride) {
      const [min, max] = activeProgram.deliveryDaysOverride;
      adjustedDelivery = min === max ? `${min} Days` : `${min}-${max} Days`;
    }

    // 가격 할인 보정
    if (activeProgram.priceDiscountPercent > 0) {
      adjustedPrice = productPrice * (1 - activeProgram.priceDiscountPercent / 100);
      adjustedPrice = Math.round(adjustedPrice * 100) / 100;
    }

    // totalPrice 재계산: 원래 total에서 shipping 차이 + price 차이 반영
    const shippingDelta = adjustedShipping - originalShipping;
    const priceDelta = adjustedPrice - productPrice;
    const adjustedTotal = Math.max(0, Math.round((originalTotal + shippingDelta + priceDelta) * 100) / 100);

    const hasAdjustment = adjustedShipping !== originalShipping
      || adjustedPrice !== productPrice
      || adjustedDelivery !== originalDeliveryDays;

    return {
      adjustedShippingPrice: adjustedShipping,
      adjustedDeliveryDays: adjustedDelivery,
      adjustedProductPrice: adjustedPrice,
      adjustedTotalPrice: adjustedTotal,
      appliedMembership: activeProgramId,
      membershipBadge: {
        label: activeProgram.badge,
        badgeColor: activeProgram.badgeColor,
        badgeBg: activeProgram.badgeBg,
      },
      hasAdjustment,
    };
  } else {
    // ── 비회원 패널티 적용 ──
    // 비회원이고, 상품가격이 무료배송 threshold 미만이면 배송비 추가
    const program = programs[0].program; // 첫 번째 프로그램의 비회원 조건 사용
    let adjustedShipping = originalShipping;
    let adjustedDelivery = originalDeliveryDays;

    // 이미 배송비가 0이고, 비회원 threshold가 있으면 패널티 가능
    if (originalShipping === 0 && program.freeShippingThreshold > 0 && productPrice < program.freeShippingThreshold) {
      adjustedShipping = program.nonMemberShipping;
    }

    // 비회원 배송일이 현재 값보다 길면 적용
    if (program.nonMemberDeliveryDays) {
      const currentDays = product.parsedDeliveryDays || 0;
      const [, maxNonMember] = program.nonMemberDeliveryDays;
      if (currentDays > 0 && currentDays < program.nonMemberDeliveryDays[0]) {
        // API가 Prime 배송일(1-2일)을 리턴했는데 비회원이면 보정
        const [min, max] = program.nonMemberDeliveryDays;
        adjustedDelivery = `${min}-${max} Days`;
      }
    }

    const shippingDelta = adjustedShipping - originalShipping;
    const adjustedTotal = Math.max(0, Math.round((originalTotal + shippingDelta) * 100) / 100);

    const hasAdjustment = adjustedShipping !== originalShipping || adjustedDelivery !== originalDeliveryDays;

    return {
      adjustedShippingPrice: adjustedShipping,
      adjustedDeliveryDays: adjustedDelivery,
      adjustedProductPrice: productPrice,
      adjustedTotalPrice: adjustedTotal,
      appliedMembership: null,
      membershipBadge: null,
      hasAdjustment,
    };
  }
}

/**
 * 상품 배열에 멤버십 보정 일괄 적용
 * Product 객체에 보정값을 직접 머지해서 리턴
 */
export function applyMembershipToProducts<T extends Record<string, any> & { price: string | number }>(
  products: T[],
  activeMemberships: Record<string, boolean>,
): (T & {
  membershipAdjusted?: boolean;
  membershipBadge?: { label: string; badgeColor: string; badgeBg: string } | null;
  appliedMembership?: string | null;
})[] {
  // 멤버십이 하나도 활성화되지 않았으면 원본 그대로
  const anyActive = Object.values(activeMemberships).some(v => v);
  if (!anyActive) return products;

  const adjusted = products.map(product => {
    const adjustment = adjustProductForMembership(product, activeMemberships);

    if (!adjustment.hasAdjustment) return product;

    return {
      ...product,
      shippingPrice: adjustment.adjustedShippingPrice,
      totalPrice: adjustment.adjustedTotalPrice,
      price: adjustment.adjustedProductPrice,
      deliveryDays: adjustment.adjustedDeliveryDays,
      arrives: adjustment.adjustedDeliveryDays,
      membershipAdjusted: true,
      membershipBadge: adjustment.membershipBadge,
      appliedMembership: adjustment.appliedMembership,
    };
  });

  // ── bestScore 재계산: 멤버십 보정된 가격/배송일 기반 ──
  return recalculateBestScores(adjusted);
}

/**
 * 멤버십 보정 후 bestScore 재계산
 * ScoringEngine과 동일한 가중치 + 정규화 로직 사용
 */
function recalculateBestScores<T extends Record<string, any>>(products: T[]): T[] {
  const realProducts = products.filter(p => !p.isSearchCard);
  const searchCards = products.filter(p => p.isSearchCard);

  if (realProducts.length === 0) return products;

  // Step 1: 각 상품의 raw 값 파싱
  const parsed = realProducts.map(product => {
    const rawPrice = (product.totalPrice ?? parsePriceToNum(product.price) + (product.shippingPrice ?? 0));
    const rawDays = parseDeliveryDays(product as any);
    const rawTrust = product.scoreBreakdown?.trustScore ?? estimateTrustScore(product as any);
    const rawMatch = product.scoreBreakdown?.matchScore ?? 50;
    const rawReturn = product.scoreBreakdown?.returnScore ?? estimateReturnPolicyScore(product as any);

    return { product, rawPrice, rawDays, rawTrust, rawMatch, rawReturn };
  });

  // Step 2: 가격과 배송일 정규화 (0-100 스케일, min-max)
  const prices = parsed.map(p => p.rawPrice);
  const days = parsed.map(p => p.rawDays);
  const normalizedPrices = normalizeValues(prices);
  const normalizedDays = normalizeValues(days);

  // Step 3: bestScore 재계산
  const rescored = parsed.map((p, i) => {
    const priceScore = 100 - normalizedPrices[i];  // 낮은 가격 → 높은 점수
    const speedScore = 100 - normalizedDays[i];     // 빠른 배송 → 높은 점수
    const trustScore = p.rawTrust;
    const matchScore = p.rawMatch;
    const returnScore = p.rawReturn;

    let bestScore =
      priceScore * DEFAULT_WEIGHTS.price +
      speedScore * DEFAULT_WEIGHTS.speed +
      trustScore * DEFAULT_WEIGHTS.trust +
      matchScore * DEFAULT_WEIGHTS.match +
      returnScore * DEFAULT_WEIGHTS.returnPolicy;

    // FraudFilter 패널티 유지
    const flags = p.product.fraudFlags;
    if (flags && flags.length > 0) {
      const penalty = Math.min(flags.length * 8, 25);
      bestScore = Math.max(0, bestScore - penalty);
    }

    return {
      ...p.product,
      bestScore: Math.round(bestScore * 100) / 100,
      parsedDeliveryDays: p.rawDays,
      parsedPrice: p.rawPrice,
    };
  });

  return [...rescored, ...searchCards] as T[];
}

/**
 * min-max 정규화 (ScoringEngine과 동일)
 */
function normalizeValues(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 50);
  return values.map(v => ((v - min) / range) * 100);
}
