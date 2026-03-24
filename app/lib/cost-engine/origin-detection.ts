/**
 * POTAL Origin Detection
 *
 * Detects likely country of origin from brand names, seller names,
 * and product metadata. Used when seller doesn't explicitly provide origin.
 *
 * Features:
 * - 130+ brand → country mappings (from brand-origins.ts)
 * - Platform detection (AliExpress → CN, etc.)
 * - Keyword-based origin hints
 * - Confidence scoring
 */

import { BRAND_ORIGINS, BRAND_COUNT } from '@/app/lib/data/brand-origins';

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

// BRAND_ORIGINS imported from @/app/lib/data/brand-origins

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
  const brandEntries = Object.entries(BRAND_ORIGINS);
  for (let i = 0; i < brandEntries.length; i++) {
    const brand = brandEntries[i][0];
    const brandCountry = brandEntries[i][1];
    const brandClean = brand.replace(/_/g, ' ');
    if (allText.includes(brandClean) || allText.includes(brand)) {
      return {
        country: brandCountry,
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
    return { country: '', confidence: 'low', score: 0, method: 'default' };
  }
}

/** Get count of brand mappings */
export function getBrandCount(): number {
  return BRAND_COUNT;
}

/** Get count of platform mappings */
export function getPlatformCount(): number {
  return Object.keys(PLATFORM_ORIGINS).length;
}
