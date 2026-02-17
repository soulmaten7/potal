/**
 * POTAL MembershipConfig — 리테일러별 멤버십 프로그램 정의 및 가격/배송 보정값
 *
 * 핵심 원리:
 *   API는 "비회원 기준" 가격을 리턴합니다.
 *   유저가 멤버십 토글을 켜면 → 회원 혜택에 맞게 클라이언트에서 보정합니다.
 *
 *   예) Amazon Prime 회원:
 *       - 배송비 $0 (비회원은 $35 미만 주문 시 $5.99)
 *       - 배송일 1-2일 (비회원은 5-7일)
 *
 * 보정 방식:
 *   - shippingOverride: 멤버십 회원일 때 배송비를 이 값으로 덮어씀
 *   - deliveryDaysOverride: 멤버십 회원일 때 배송일을 이 값으로 덮어씀
 *   - priceDiscountPercent: 멤버십 전용 할인율 (%) — 상품가격에 적용
 *   - freeShippingThreshold: 비회원도 이 금액 이상이면 무료배송
 */

export interface MembershipProgram {
  /** 고유 ID (prime, wplus, choice 등) */
  id: string;
  /** 표시 라벨 */
  label: string;
  /** 토글 버튼에 표시할 뱃지 텍스트 (retailerConfig의 badge와 일치) */
  badge: string;
  /** 뱃지 색상 (Tailwind) — retailerConfig의 ShippingProgram과 동일 */
  badgeColor: string;
  badgeBg: string;
  /** 연 비용 ($) — 정보 표시용 */
  annualCost: number;
  /** 월 비용 ($) — 정보 표시용 */
  monthlyCost: number;

  // ── 보정값 (회원 혜택) ──

  /** 멤버 배송비 오버라이드 (null이면 변경 안 함) */
  shippingOverride: number | null;
  /** 멤버 배송일 오버라이드 [min, max] (null이면 변경 안 함) */
  deliveryDaysOverride: [number, number] | null;
  /** 상품가격 할인율 (%, 0이면 할인 없음) */
  priceDiscountPercent: number;
  /** 비회원 무료배송 최소 주문금액 ($) — 이 금액 미만이면 배송비 추가 */
  freeShippingThreshold: number;
  /** 비회원 배송비 (threshold 미만일 때 부과) */
  nonMemberShipping: number;
  /** 비회원 기본 배송일 [min, max] */
  nonMemberDeliveryDays: [number, number];
}

export interface RetailerMembership {
  /** 리테일러 이름 (FilterSidebar의 리스트와 일치) */
  retailer: string;
  /** retailerConfig.ts의 key와 일치 */
  configKey: string;
  /** 해당 리테일러의 멤버십 프로그램들 */
  programs: MembershipProgram[];
}

/**
 * 전체 멤버십 프로그램 정의
 * ═══════════════════════════════════════
 */
export const MEMBERSHIP_REGISTRY: RetailerMembership[] = [
  // ── Amazon Prime ──
  {
    retailer: 'Amazon',
    configKey: 'amazon',
    programs: [
      {
        id: 'prime',
        label: 'Prime',
        badge: 'Prime',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#00A8E1]',
        annualCost: 139,
        monthlyCost: 14.99,
        shippingOverride: 0,
        deliveryDaysOverride: [1, 2],
        priceDiscountPercent: 0,        // Prime은 가격할인 아님 (일부 Prime 전용가 있지만 API에서 구분 불가)
        freeShippingThreshold: 35,      // 비회원: $35+ 무료
        nonMemberShipping: 5.99,        // 비회원: $35 미만 시 $5.99
        nonMemberDeliveryDays: [5, 7],
      },
    ],
  },

  // ── Walmart+ ──
  {
    retailer: 'Walmart',
    configKey: 'walmart',
    programs: [
      {
        id: 'wplus',
        label: 'W+',
        badge: 'W+',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#0071ce]',
        annualCost: 98,
        monthlyCost: 12.95,
        shippingOverride: 0,
        deliveryDaysOverride: [1, 2],
        priceDiscountPercent: 0,
        freeShippingThreshold: 35,
        nonMemberShipping: 5.99,
        nonMemberDeliveryDays: [3, 5],
      },
    ],
  },

  // ── AliExpress Choice ──
  {
    retailer: 'AliExpress',
    configKey: 'aliexpress',
    programs: [
      {
        id: 'choice',
        label: 'Choice',
        badge: 'Choice',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#FF4747]',
        annualCost: 0,               // 무료 프로그램
        monthlyCost: 0,
        shippingOverride: 0,         // Choice 상품 무료배송
        deliveryDaysOverride: [7, 12],
        priceDiscountPercent: 0,
        freeShippingThreshold: 0,    // Choice는 조건 없이 무료
        nonMemberShipping: 3.99,     // 비-Choice 상품 평균 배송비
        nonMemberDeliveryDays: [15, 30],
      },
    ],
  },

  // ── Best Buy Plus / Total ──
  {
    retailer: 'Best Buy',
    configKey: 'bestbuy',
    programs: [
      {
        id: 'mybby',
        label: 'Plus',
        badge: 'Plus',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#003b64]',
        annualCost: 49.99,
        monthlyCost: 0,              // 연간만
        shippingOverride: 0,
        deliveryDaysOverride: [2, 3],
        priceDiscountPercent: 5,     // 회원 전용 가격 (~5% 할인)
        freeShippingThreshold: 35,
        nonMemberShipping: 5.99,
        nonMemberDeliveryDays: [4, 7],
      },
    ],
  },

  // ── Shein S-Club ──
  {
    retailer: 'Shein',
    configKey: 'shein',
    programs: [
      {
        id: 'sheclub',
        label: 'S-Club',
        badge: 'S-Club',
        badgeColor: 'text-white',
        badgeBg: 'bg-black',
        annualCost: 19.99,
        monthlyCost: 0,
        shippingOverride: 0,
        deliveryDaysOverride: [7, 12],
        priceDiscountPercent: 5,     // 비세일 5% 할인
        freeShippingThreshold: 49,
        nonMemberShipping: 3.99,
        nonMemberDeliveryDays: [10, 18],
      },
    ],
  },

  // ── Costco ──
  {
    retailer: 'Costco',
    configKey: 'costco',
    programs: [
      {
        id: 'costco',
        label: 'Member',
        badge: 'Member',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#E31837]',
        annualCost: 65,
        monthlyCost: 0,
        shippingOverride: null,       // Costco 배송비는 상품마다 다름
        deliveryDaysOverride: [3, 5],
        priceDiscountPercent: 0,      // 회원이어야 구매 가능 (가격할인 개념 아님)
        freeShippingThreshold: 0,
        nonMemberShipping: 0,
        nonMemberDeliveryDays: [3, 5],
      },
    ],
  },

  // ── Target Circle 360 ──
  {
    retailer: 'Target',
    configKey: 'target',
    programs: [
      {
        id: 'circle360',
        label: 'Circle',
        badge: 'Circle',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#CC0000]',
        annualCost: 99,
        monthlyCost: 10.99,
        shippingOverride: 0,
        deliveryDaysOverride: [1, 2],  // 당일배송
        priceDiscountPercent: 1,       // 1% 리워드 (근사치)
        freeShippingThreshold: 35,
        nonMemberShipping: 5.99,
        nonMemberDeliveryDays: [3, 7],
      },
    ],
  },
];

// ── 편의 유틸 ──

/** retailer 이름으로 멤버십 프로그램 조회 */
const registryMap = new Map(MEMBERSHIP_REGISTRY.map(r => [r.retailer.toLowerCase(), r]));

export function getMembershipForRetailer(retailer: string): RetailerMembership | undefined {
  return registryMap.get(retailer.toLowerCase().trim());
}

/** programId로 프로그램 조회 */
const programMap = new Map<string, { retailer: string; program: MembershipProgram }>();
for (const rm of MEMBERSHIP_REGISTRY) {
  for (const prog of rm.programs) {
    programMap.set(prog.id, { retailer: rm.retailer, program: prog });
  }
}

export function getMembershipProgram(programId: string): { retailer: string; program: MembershipProgram } | undefined {
  return programMap.get(programId);
}

/** 모든 프로그램 ID 목록 */
export function getAllProgramIds(): string[] {
  return Array.from(programMap.keys());
}
