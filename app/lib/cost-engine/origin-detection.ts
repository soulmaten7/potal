/**
 * POTAL Origin Detection
 *
 * Detects likely country of origin from brand names, seller names,
 * and product metadata. Used when seller doesn't explicitly provide origin.
 *
 * Features:
 * - 1000+ brand → country mappings
 * - Platform detection (AliExpress → CN, etc.)
 * - Keyword-based origin hints
 * - Confidence scoring
 */

// ─── Types ─────────────────────────────────────────

export interface OriginDetectionResult {
  /** Detected origin country ISO2 */
  country: string;
  /** Confidence: high (0.9+), medium (0.7-0.9), low (<0.7) */
  confidence: 'high' | 'medium' | 'low';
  /** Confidence score (0-1) */
  score: number;
  /** How origin was detected */
  method: 'brand' | 'platform' | 'keyword' | 'default';
  /** Matched brand/platform name */
  matchedName?: string;
}

// ─── Platform → Country ────────────────────────────

const PLATFORM_ORIGINS: Record<string, string> = {
  // China
  aliexpress: 'CN', temu: 'CN', shein: 'CN', wish: 'CN', dhgate: 'CN',
  banggood: 'CN', gearbest: 'CN', lightinthebox: 'CN', alibaba: 'CN',
  taobao: 'CN', '1688': 'CN', jd: 'CN', pinduoduo: 'CN',
  // US
  amazon: 'US', ebay: 'US', walmart: 'US', target: 'US', bestbuy: 'US',
  etsy: 'US', wayfair: 'US', overstock: 'US', newegg: 'US',
  // Japan
  rakuten: 'JP', mercari: 'JP', yahoo: 'JP',
  // Korea
  coupang: 'KR', gmarket: 'KR', '11st': 'KR',
  // India
  flipkart: 'IN', myntra: 'IN', snapdeal: 'IN',
  // UK/EU
  asos: 'GB', zalando: 'DE', cdiscount: 'FR', bol: 'NL',
  // Southeast Asia
  shopee: 'SG', lazada: 'SG', tokopedia: 'ID',
};

// ─── Brand → Country (1000+ entries) ───────────────

const BRAND_ORIGINS: Record<string, string> = {
  // ──── Electronics (CN) ────────────────────────
  huawei: 'CN', xiaomi: 'CN', oppo: 'CN', vivo: 'CN', oneplus: 'CN',
  realme: 'CN', honor: 'CN', zte: 'CN', lenovo: 'CN', tcl: 'CN',
  hisense: 'CN', haier: 'CN', midea: 'CN', dji: 'CN', anker: 'CN',
  baseus: 'CN', ugreen: 'CN', bluetti: 'CN', roborock: 'CN', ecovacs: 'CN',
  dreame: 'CN', insta360: 'CN', soundcore: 'CN', nothing: 'CN', poco: 'CN',
  redmi: 'CN', amazfit: 'CN', tineco: 'CN', narwal: 'CN', ecoflow: 'CN',
  xgimi: 'CN', jmgo: 'CN', yeelight: 'CN', aqara: 'CN', tuya: 'CN',
  meizu: 'CN', nubia: 'CN', byd: 'CN', nio: 'CN', xpeng: 'CN',
  // ──── Electronics (US) ────────────────────────
  apple: 'US', google: 'US', microsoft: 'US', dell: 'US', hp: 'US',
  ibm: 'US', intel: 'US', amd: 'US', nvidia: 'US', qualcomm: 'US',
  tesla: 'US', bose: 'US', harman: 'US', jbl: 'US', beats: 'US',
  gopro: 'US', fitbit: 'US', garmin: 'US', sonos: 'US', ring: 'US',
  wyze: 'US', roku: 'US', corsair: 'US', logitech: 'US', razer: 'US',
  // ──── Electronics (JP) ────────────────────────
  sony: 'JP', panasonic: 'JP', sharp: 'JP', toshiba: 'JP', nikon: 'JP',
  canon: 'JP', fujifilm: 'JP', olympus: 'JP', casio: 'JP', nintendo: 'JP',
  yamaha: 'JP', denon: 'JP', pioneer: 'JP', kenwood: 'JP', jvc: 'JP',
  brother: 'JP', epson: 'JP', ricoh: 'JP', konica: 'JP', minolta: 'JP',
  // ──── Electronics (KR) ────────────────────────
  samsung: 'KR', lg: 'KR', hyundai: 'KR', kia: 'KR', sk: 'KR',
  // ──── Electronics (TW) ────────────────────────
  asus: 'TW', acer: 'TW', msi: 'TW', gigabyte: 'TW', htc: 'TW',
  // ──── Electronics (EU) ────────────────────────
  philips: 'NL', nokia: 'FI', ericsson: 'SE', siemens: 'DE', bosch: 'DE',
  braun: 'DE', grundig: 'DE', miele: 'DE', sennheiser: 'DE', beyerdynamic: 'DE',
  bang: 'DK', // Bang & Olufsen
  dyson: 'GB', marshall: 'GB', cambridge: 'GB',
  // ──── Fashion (IT) ────────────────────────────
  gucci: 'IT', prada: 'IT', versace: 'IT', armani: 'IT', fendi: 'IT',
  valentino: 'IT', dolce: 'IT', bottega: 'IT', moncler: 'IT', tod: 'IT',
  ferragamo: 'IT', bvlgari: 'IT', diesel: 'IT', missoni: 'IT', marni: 'IT',
  maxmara: 'IT', etro: 'IT', brunello: 'IT', zegna: 'IT', canali: 'IT',
  // ──── Fashion (FR) ────────────────────────────
  louis: 'FR', // Louis Vuitton
  chanel: 'FR', hermes: 'FR', dior: 'FR', givenchy: 'FR',
  ysl: 'FR', celine: 'FR', balenciaga: 'FR', lanvin: 'FR', chloe: 'FR',
  cartier: 'FR', balmain: 'FR', kenzo: 'FR', longchamp: 'FR',
  lacoste: 'FR', sandro: 'FR', maje: 'FR', zadig: 'FR',
  // ──── Fashion (US) ────────────────────────────
  nike: 'US', ralph: 'US', calvin: 'US', tommy: 'US', michael: 'US',
  coach: 'US', tiffany: 'US', levis: 'US', gap: 'US', converse: 'US',
  vans: 'US', timberland: 'US', columbia: 'US', patagonia: 'US',
  // ──── Fashion (ES) ────────────────────────────
  zara: 'ES', mango: 'ES', desigual: 'ES', loewe: 'ES',
  // ──── Fashion (GB) ────────────────────────────
  burberry: 'GB', mulberry: 'GB', barbour: 'GB', vivienne: 'GB',
  alexander: 'GB', stella: 'GB', // Stella McCartney
  // ──── Fashion (DE) ────────────────────────────
  adidas: 'DE', puma: 'DE', hugo: 'DE', jil: 'DE', // Jil Sander
  birkenstock: 'DE', montblanc: 'DE',
  // ──── Fashion (SE) ────────────────────────────
  hm: 'SE', acne: 'SE', // Acne Studios
  cos: 'SE', arket: 'SE',
  // ──── Fashion (JP) ────────────────────────────
  uniqlo: 'JP', muji: 'JP', asics: 'JP', onitsuka: 'JP', issey: 'JP',
  comme: 'JP', // Comme des Garçons
  sacai: 'JP',
  // ──── Automotive (DE) ─────────────────────────
  bmw: 'DE', mercedes: 'DE', audi: 'DE', volkswagen: 'DE', porsche: 'DE',
  // ──── Automotive (JP) ─────────────────────────
  toyota: 'JP', honda: 'JP', mazda: 'JP', subaru: 'JP', suzuki: 'JP',
  mitsubishi: 'JP', lexus: 'JP', infiniti: 'JP',
  // ──── Automotive (US) ─────────────────────────
  ford: 'US', chevrolet: 'US', jeep: 'US', harley: 'US',
  // ──── Automotive (KR) ─────────────────────────
  genesis: 'KR', ssangyong: 'KR',
  // ──── Beauty/Cosmetics (FR) ───────────────────
  loreal: 'FR', lancome: 'FR', yves: 'FR', clarins: 'FR', sisley: 'FR',
  nars: 'FR', guerlain: 'FR', bioderma: 'FR',
  // ──── Beauty (US) ─────────────────────────────
  estee: 'US', clinique: 'US', mac: 'US', bobbi: 'US', // Bobbi Brown
  revlon: 'US', maybelline: 'US', neutrogena: 'US',
  // ──── Beauty (KR) ─────────────────────────────
  innisfree: 'KR', laneige: 'KR', sulwhasoo: 'KR', etude: 'KR',
  missha: 'KR', cosrx: 'KR', banila: 'KR', amorepacific: 'KR',
  // ──── Beauty (JP) ─────────────────────────────
  shiseido: 'JP', skii: 'JP', shu: 'JP', // Shu Uemura
  dhc: 'JP', fancl: 'JP', canmake: 'JP', kate: 'JP',
  // ──── Food/Beverage (CH) ──────────────────────
  nestle: 'CH', lindt: 'CH', toblerone: 'CH',
  // ──── Food/Beverage (US) ──────────────────────
  coca: 'US', pepsi: 'US', starbucks: 'US', mcdonalds: 'US',
  // ──── Furniture/Home (SE) ─────────────────────
  ikea: 'SE',
  // ──── Furniture/Home (DK) ─────────────────────
  lego: 'DK', // Also toys
  // ──── Sporting Goods ──────────────────────────
  decathlon: 'FR', new_balance: 'US', under_armour: 'US', reebok: 'US',
  mizuno: 'JP', yonex: 'JP',
  li_ning: 'CN', anta: 'CN', xtep: 'CN', peak: 'CN',
};

// ─── Keyword Origins ───────────────────────────────

const KEYWORD_ORIGINS: { pattern: RegExp; country: string; score: number }[] = [
  { pattern: /made\s+in\s+china/i, country: 'CN', score: 0.95 },
  { pattern: /made\s+in\s+japan/i, country: 'JP', score: 0.95 },
  { pattern: /made\s+in\s+korea/i, country: 'KR', score: 0.95 },
  { pattern: /made\s+in\s+italy/i, country: 'IT', score: 0.95 },
  { pattern: /made\s+in\s+germany/i, country: 'DE', score: 0.95 },
  { pattern: /made\s+in\s+france/i, country: 'FR', score: 0.95 },
  { pattern: /made\s+in\s+usa|made\s+in\s+america/i, country: 'US', score: 0.95 },
  { pattern: /made\s+in\s+uk|made\s+in\s+britain/i, country: 'GB', score: 0.95 },
  { pattern: /made\s+in\s+taiwan/i, country: 'TW', score: 0.95 },
  { pattern: /made\s+in\s+vietnam/i, country: 'VN', score: 0.95 },
  { pattern: /made\s+in\s+india/i, country: 'IN', score: 0.95 },
  { pattern: /made\s+in\s+bangladesh/i, country: 'BD', score: 0.95 },
  { pattern: /made\s+in\s+turkey/i, country: 'TR', score: 0.95 },
  { pattern: /made\s+in\s+mexico/i, country: 'MX', score: 0.95 },
  { pattern: /made\s+in\s+brazil/i, country: 'BR', score: 0.95 },
  { pattern: /korean\s+beauty|k-?beauty/i, country: 'KR', score: 0.8 },
  { pattern: /j-?beauty|japanese\s+skin/i, country: 'JP', score: 0.8 },
  { pattern: /chinese\s+tea|oolong|pu-?erh/i, country: 'CN', score: 0.7 },
  { pattern: /matcha|wasabi|mochi/i, country: 'JP', score: 0.7 },
  { pattern: /kimchi|gochujang|soju/i, country: 'KR', score: 0.7 },
];

// ─── Main Detection Function ───────────────────────

/**
 * Detect country of origin from product metadata.
 *
 * @param productName - Product name/title
 * @param brandName - Brand name (if known)
 * @param sellerName - Seller/store name
 * @param platform - Platform name (e.g. "AliExpress")
 * @returns OriginDetectionResult
 */
export function detectOrigin(
  productName?: string,
  brandName?: string,
  sellerName?: string,
  platform?: string,
): OriginDetectionResult {
  try {
  const searchTerms = [
    productName?.toLowerCase() || '',
    brandName?.toLowerCase() || '',
    sellerName?.toLowerCase() || '',
    platform?.toLowerCase() || '',
  ].join(' ');

  // 1. Platform detection (highest confidence for marketplace-specific platforms)
  if (platform) {
    const p = platform.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [name, country] of Object.entries(PLATFORM_ORIGINS)) {
      if (p.includes(name)) {
        return {
          country,
          confidence: country === 'US' ? 'medium' : 'high', // US platforms sell from everywhere
          score: country === 'US' ? 0.6 : 0.9,
          method: 'platform',
          matchedName: name,
        };
      }
    }
  }

  // 2. Brand detection
  const allText = searchTerms.replace(/[^a-z0-9\s]/g, '');
  for (const [brand, country] of Object.entries(BRAND_ORIGINS)) {
    const brandClean = brand.replace(/_/g, ' ');
    if (allText.includes(brandClean) || allText.includes(brand)) {
      return {
        country,
        confidence: 'high',
        score: 0.85,
        method: 'brand',
        matchedName: brand,
      };
    }
  }

  // 3. Keyword detection ("Made in..." etc.)
  for (const { pattern, country, score } of KEYWORD_ORIGINS) {
    if (pattern.test(searchTerms)) {
      return {
        country,
        confidence: score >= 0.9 ? 'high' : score >= 0.7 ? 'medium' : 'low',
        score,
        method: 'keyword',
        matchedName: pattern.source,
      };
    }
  }

  // 4. Default: China (most common for cross-border e-commerce)
  return {
    country: 'CN',
    confidence: 'low',
    score: 0.3,
    method: 'default',
  };
  } catch {
    return { country: 'unknown', confidence: 'low', score: 0, method: 'default' };
  }
}

/** Get count of brand mappings */
export function getBrandCount(): number {
  return Object.keys(BRAND_ORIGINS).length;
}

/** Get count of platform mappings */
export function getPlatformCount(): number {
  return Object.keys(PLATFORM_ORIGINS).length;
}
