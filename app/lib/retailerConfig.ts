/**
 * RetailerConfig — 사이트별 설정 (색상, 로고, 배송 프로그램, Affiliate 등)
 * 새 사이트 추가 시 이 파일에 config만 추가하면 ProductCard·DeliveryBadge가 자동 반영됩니다.
 */

export interface ShippingProgram {
  /** 프로그램 이름 (Prime, W+, RedCard, Choice 등) */
  name: string;
  /** 뱃지 표시용 라벨 */
  badge: string;
  /** 뱃지 색상 (Tailwind text/bg) */
  badgeColor: string;
  badgeBg: string;
  /** 인지도가 높아 뱃지로 표시할 가치가 있는지 (true = 뱃지 표시, false = 텍스트만) */
  showBadge: boolean;
}

export interface RetailerConfig {
  /** 정규화된 키 (lowercase) */
  key: string;
  /** 표시용 이름 */
  displayName: string;
  /** 약자 (3글자) — ProductCard 플랫폼 태그 */
  short: string;
  /** 브랜드 색상 (Tailwind) */
  color: string;
  bg: string;
  /** 마켓 타입 */
  market: 'domestic' | 'global';
  /** 배송 프로그램 목록 */
  shippingPrograms: ShippingProgram[];
  /** 기본 배송 라벨 (프로그램 매칭 안 될 때) */
  defaultShippingLabel: string;
  /** Affiliate 파라미터 키 (예: tag, affid 등) — 비어있으면 미적용 */
  affiliateParamKey: string;
  /** Affiliate ENV 변수명 */
  affiliateEnvKey: string;
  /** 사이트 도메인 */
  domain: string;
}

/**
 * 모든 지원 리테일러 설정
 * ─────────────────────────────────────────
 */
export const RETAILER_CONFIGS: RetailerConfig[] = [
  // ═══ US Domestic ═══
  {
    key: 'amazon',
    displayName: 'Amazon',
    short: 'AMZ',
    color: 'text-[#FF9900]',
    bg: 'bg-[#FF9900]/10',
    market: 'domestic',
    shippingPrograms: [
      {
        name: 'Prime',
        badge: 'Prime',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#00A8E1]',
        showBadge: true,
      },
      {
        name: 'Choice',
        badge: 'Choice',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#FF9900]',
        showBadge: true,
      },
    ],
    defaultShippingLabel: 'Standard Shipping',
    affiliateParamKey: 'tag',
    affiliateEnvKey: 'AMAZON_AFFILIATE_TAG',
    domain: 'amazon.com',
  },
  {
    key: 'walmart',
    displayName: 'Walmart',
    short: 'WMT',
    color: 'text-[#0071ce]',
    bg: 'bg-[#0071ce]/10',
    market: 'domestic',
    shippingPrograms: [
      {
        name: 'W+',
        badge: 'W+',
        badgeColor: 'text-[#0071ce]',
        badgeBg: 'bg-[#0071ce]/10',
        showBadge: false, // 인지도가 Prime만큼 높지 않음 → 텍스트로 표시
      },
    ],
    defaultShippingLabel: 'Standard',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'WALMART_AFFILIATE_ID',
    domain: 'walmart.com',
  },
  {
    key: 'bestbuy',
    displayName: 'Best Buy',
    short: 'BBY',
    color: 'text-[#003b64]',
    bg: 'bg-[#003b64]/10',
    market: 'domestic',
    shippingPrograms: [
      {
        name: 'Store Pickup',
        badge: 'Pickup',
        badgeColor: 'text-[#003b64]',
        badgeBg: 'bg-[#FFF200]/30',
        showBadge: false,
      },
    ],
    defaultShippingLabel: 'Free Shipping',
    affiliateParamKey: 'irclickid',
    affiliateEnvKey: 'BESTBUY_AFFILIATE_ID',
    domain: 'bestbuy.com',
  },
  {
    key: 'ebay',
    displayName: 'eBay',
    short: 'BAY',
    color: 'text-[#e53238]',
    bg: 'bg-[#e53238]/10',
    market: 'domestic',
    shippingPrograms: [
      {
        name: 'Fast N Free',
        badge: "Fast'N Free",
        badgeColor: 'text-white',
        badgeBg: 'bg-[#e53238]',
        showBadge: false, // 셀러 기반이라 일관성 낮음
      },
    ],
    defaultShippingLabel: 'Standard',
    affiliateParamKey: 'campid',
    affiliateEnvKey: 'EBAY_CAMPAIGN_ID',
    domain: 'ebay.com',
  },
  {
    key: 'target',
    displayName: 'Target',
    short: 'TGT',
    color: 'text-[#CC0000]',
    bg: 'bg-[#CC0000]/10',
    market: 'domestic',
    shippingPrograms: [
      {
        name: 'RedCard',
        badge: 'RedCard',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#CC0000]',
        showBadge: false, // 회원 전용, 일반 사용자에게 혼란
      },
    ],
    defaultShippingLabel: 'Standard',
    affiliateParamKey: 'afid',
    affiliateEnvKey: 'TARGET_AFFILIATE_ID',
    domain: 'target.com',
  },

  // ═══ Global ═══
  {
    key: 'aliexpress',
    displayName: 'AliExpress',
    short: 'ALI',
    color: 'text-[#FF4747]',
    bg: 'bg-[#FF4747]/10',
    market: 'global',
    shippingPrograms: [
      {
        name: 'Choice',
        badge: 'Choice',
        badgeColor: 'text-white',
        badgeBg: 'bg-[#FF4747]',
        showBadge: true, // 배송 보장 프로그램이라 가치 있음
      },
    ],
    defaultShippingLabel: '10+ Days',
    affiliateParamKey: 'aff_id',
    affiliateEnvKey: 'ALIEXPRESS_AFFILIATE_ID',
    domain: 'aliexpress.com',
  },
  {
    key: 'temu',
    displayName: 'Temu',
    short: 'TMU',
    color: 'text-[#FB7701]',
    bg: 'bg-[#FB7701]/10',
    market: 'global',
    shippingPrograms: [],
    defaultShippingLabel: 'Standard',
    affiliateParamKey: 'aff_id',
    affiliateEnvKey: 'TEMU_AFFILIATE_ID',
    domain: 'temu.com',
  },
  // ═══ New Domestic — Google Shopping API (2026-02-24) ═══
  {
    key: 'homedepot',
    displayName: 'Home Depot',
    short: 'HDT',
    color: 'text-[#F96302]',
    bg: 'bg-[#F96302]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: '$45+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'HOMEDEPOT_AFFILIATE_ID',
    domain: 'homedepot.com',
  },
  {
    key: 'lowes',
    displayName: "Lowe's",
    short: 'LOW',
    color: 'text-[#004990]',
    bg: 'bg-[#004990]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: '$45+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'LOWES_AFFILIATE_ID',
    domain: 'lowes.com',
  },
  {
    key: 'nordstrom',
    displayName: 'Nordstrom',
    short: 'NRD',
    color: 'text-[#000]',
    bg: 'bg-black/5',
    market: 'domestic',
    shippingPrograms: [
      { name: 'Nordy Club', badge: 'Nordy Club', badgeColor: 'text-[#000]', badgeBg: 'bg-gray-200', showBadge: false },
    ],
    defaultShippingLabel: 'Free Shipping',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'NORDSTROM_AFFILIATE_ID',
    domain: 'nordstrom.com',
  },
  {
    key: 'ikea',
    displayName: 'IKEA',
    short: 'IKA',
    color: 'text-[#0058A3]',
    bg: 'bg-[#0058A3]/10',
    market: 'domestic',
    shippingPrograms: [
      { name: 'IKEA Family', badge: 'Family', badgeColor: 'text-[#0058A3]', badgeBg: 'bg-[#FFDA1A]/20', showBadge: false },
    ],
    defaultShippingLabel: '$50+ Free (Family)',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'IKEA_AFFILIATE_ID',
    domain: 'ikea.com',
  },
  {
    key: 'wayfair',
    displayName: 'Wayfair',
    short: 'WFR',
    color: 'text-[#7B0E7B]',
    bg: 'bg-[#7B0E7B]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: '$35+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'WAYFAIR_AFFILIATE_ID',
    domain: 'wayfair.com',
  },
  {
    key: 'newegg',
    displayName: 'Newegg',
    short: 'NEG',
    color: 'text-[#F7A600]',
    bg: 'bg-[#F7A600]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: '$25+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'NEWEGG_AFFILIATE_ID',
    domain: 'newegg.com',
  },
  {
    key: 'sephora',
    displayName: 'Sephora',
    short: 'SPH',
    color: 'text-[#000]',
    bg: 'bg-black/5',
    market: 'domestic',
    shippingPrograms: [
      { name: 'Beauty Insider', badge: 'Insider', badgeColor: 'text-white', badgeBg: 'bg-[#000]', showBadge: false },
    ],
    defaultShippingLabel: 'Insider Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'SEPHORA_AFFILIATE_ID',
    domain: 'sephora.com',
  },
  {
    key: 'etsy',
    displayName: 'Etsy',
    short: 'ETS',
    color: 'text-[#F1641E]',
    bg: 'bg-[#F1641E]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: 'Seller Dependent',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'ETSY_AFFILIATE_ID',
    domain: 'etsy.com',
  },
  {
    key: 'mercari',
    displayName: 'Mercari',
    short: 'MRC',
    color: 'text-[#4DC9F6]',
    bg: 'bg-[#4DC9F6]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: 'Seller Dependent',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'MERCARI_AFFILIATE_ID',
    domain: 'mercari.com',
  },
  {
    key: 'iherb',
    displayName: 'iHerb',
    short: 'IHB',
    color: 'text-[#458500]',
    bg: 'bg-[#458500]/10',
    market: 'domestic',
    shippingPrograms: [],
    defaultShippingLabel: '$30+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'IHERB_AFFILIATE_ID',
    domain: 'iherb.com',
  },

  // ═══ New Global — Google Shopping API (2026-02-24) ═══
  {
    key: 'shein',
    displayName: 'Shein',
    short: 'SHN',
    color: 'text-[#000]',
    bg: 'bg-black/5',
    market: 'global',
    shippingPrograms: [
      { name: 'S-Club', badge: 'S-Club', badgeColor: 'text-[#000]', badgeBg: 'bg-pink-100', showBadge: false },
    ],
    defaultShippingLabel: '$29+ Free',
    affiliateParamKey: 'ref',
    affiliateEnvKey: 'SHEIN_AFFILIATE_ID',
    domain: 'shein.com',
  },
  {
    key: 'asos',
    displayName: 'ASOS',
    short: 'ASO',
    color: 'text-[#2D2D2D]',
    bg: 'bg-[#2D2D2D]/10',
    market: 'global',
    shippingPrograms: [
      { name: 'Premier', badge: 'Premier', badgeColor: 'text-white', badgeBg: 'bg-[#2D2D2D]', showBadge: false },
    ],
    defaultShippingLabel: '$49.99+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'ASOS_AFFILIATE_ID',
    domain: 'asos.com',
  },
  {
    key: 'farfetch',
    displayName: 'Farfetch',
    short: 'FFH',
    color: 'text-[#000]',
    bg: 'bg-black/5',
    market: 'global',
    shippingPrograms: [
      { name: 'Access', badge: 'Access', badgeColor: 'text-[#000]', badgeBg: 'bg-gray-200', showBadge: false },
    ],
    defaultShippingLabel: 'Access Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'FARFETCH_AFFILIATE_ID',
    domain: 'farfetch.com',
  },
  {
    key: 'yesstyle',
    displayName: 'YesStyle',
    short: 'YST',
    color: 'text-[#E91E8C]',
    bg: 'bg-[#E91E8C]/10',
    market: 'global',
    shippingPrograms: [],
    defaultShippingLabel: 'Standard',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'YESSTYLE_AFFILIATE_ID',
    domain: 'yesstyle.com',
  },
  {
    key: 'mytheresa',
    displayName: 'MyTheresa',
    short: 'MTR',
    color: 'text-[#000]',
    bg: 'bg-black/5',
    market: 'global',
    shippingPrograms: [],
    defaultShippingLabel: '$300+ Free',
    affiliateParamKey: 'affid',
    affiliateEnvKey: 'MYTHERESA_AFFILIATE_ID',
    domain: 'mytheresa.com',
  },
];

// ─── 편의 유틸 ───

/** key로 RetailerConfig 조회 (lowercase 매칭) */
const configMap = new Map(RETAILER_CONFIGS.map(c => [c.key, c]));

export function getRetailerConfig(siteOrSeller: string): RetailerConfig | undefined {
  const key = (siteOrSeller ?? '').toLowerCase().trim().replace(/\s+/g, '');
  // 정확히 매칭
  if (configMap.has(key)) return configMap.get(key);
  // "best buy" → "bestbuy"
  const noSpace = key.replace(/\s/g, '');
  if (configMap.has(noSpace)) return configMap.get(noSpace);
  // 부분 매칭 (fallback)
  for (const c of RETAILER_CONFIGS) {
    if (key.includes(c.key) || c.key.includes(key)) return c;
  }
  return undefined;
}

/** 해당 상품의 배송 프로그램 뱃지를 판단 (is_prime, badges 배열 등 기반) */
export function matchShippingProgram(
  config: RetailerConfig,
  product: { is_prime?: boolean; badges?: string[]; deliveryDays?: string; shipping?: string; delivery?: string },
): ShippingProgram | null {
  if (!config.shippingPrograms.length) return null;

  const allText = [
    ...(product.badges ?? []),
    product.deliveryDays ?? '',
    product.shipping ?? '',
    product.delivery ?? '',
    product.is_prime ? 'prime' : '',
  ].join(' ').toLowerCase();

  for (const prog of config.shippingPrograms) {
    if (allText.includes(prog.name.toLowerCase())) return prog;
  }

  return null;
}

/** Domestic 사이트 목록 */
export const DOMESTIC_RETAILERS = RETAILER_CONFIGS.filter(c => c.market === 'domestic');
/** Global 사이트 목록 */
export const GLOBAL_RETAILERS = RETAILER_CONFIGS.filter(c => c.market === 'global');
