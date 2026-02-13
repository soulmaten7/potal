/**
 * POTAL FraudFilter — Platform-specific fraud detection rules
 *
 * Stage 1: Instant Remove (rule-based, $0 AI cost)
 * Stage 3: Trust Signal (flag suspicious but don't remove)
 *
 * Stage 2 (AI Brand Filter) is handled by AIFilterService separately.
 */

import type { Product } from '../../types/product';

export interface FraudResult {
  /** Products that passed all checks (clean) */
  clean: Product[];
  /** Products flagged with trust signals (still shown, with warning) */
  flagged: Product[];
  /** Products removed entirely (never shown to user) */
  removed: Product[];
  /** Stats for debugging/logging */
  stats: {
    total: number;
    removed: number;
    flagged: number;
    clean: number;
    removeReasons: Record<string, number>;
    flagReasons: Record<string, number>;
  };
}

// ─── Stage 1: Instant Remove Rules ─────────────────────────────

type RemoveRule = {
  name: string;
  test: (product: Product) => boolean;
  platforms?: string[]; // empty = all platforms
};

const REMOVE_RULES: RemoveRule[] = [
  // === Universal Rules (all platforms) ===
  {
    name: 'price_zero',
    test: (p) => {
      const price = parsePriceNum(p.price);
      return price === 0 || price === null;
    },
  },
  {
    name: 'price_negative',
    test: (p) => {
      const price = parsePriceNum(p.price);
      return price !== null && price < 0;
    },
  },
  {
    name: 'no_image',
    test: (p) => !p.image || p.image.trim() === '' || p.image === 'placeholder',
  },
  {
    name: 'empty_title',
    test: (p) => !p.name || p.name.trim().length < 5,
  },
  {
    name: 'sponsored_ad',
    test: (p) => p.is_sponsored === true || p.is_ad === true,
  },

  // === eBay Specific ===
  {
    name: 'ebay_empty_box',
    test: (p) => {
      const title = (p.name || '').toLowerCase();
      return (
        title.includes('box only') ||
        title.includes('empty box') ||
        title.includes('photo of') ||
        title.includes('picture of') ||
        title.includes('image only')
      );
    },
    platforms: ['ebay'],
  },

  // === Amazon Specific ===
  {
    name: 'amazon_zombie_review',
    test: (p) => {
      // Product with 500+ reviews but created < 30 days ago = suspicious
      // We can only detect this if we have review count and creation date
      // For now, flag products with suspiciously high reviews AND very low price
      const price = parsePriceNum(p.price);
      if (!price) return false;
      // This will be enhanced when we have more data
      return false; // Placeholder — needs product age data from API
    },
    platforms: ['amazon'],
  },

  // === Temu Specific ===
  {
    name: 'temu_extreme_discount',
    test: (p) => {
      // Temu often shows fake "original" prices with 90%+ discount
      // If we detect original price data, remove the fake markup
      // For now, just remove $0 items (caught by universal rule above)
      return false; // Placeholder — needs original_price field
    },
    platforms: ['temu'],
  },
];

// ─── Stage 3: Trust Signal Rules ─────────────────────────────

type FlagRule = {
  name: string;
  test: (product: Product, avgPrice?: number) => boolean;
  platforms?: string[];
};

const FLAG_RULES: FlagRule[] = [
  // Price anomaly: significantly below category average
  {
    name: 'price_too_low',
    test: (p, avgPrice) => {
      if (!avgPrice || avgPrice === 0) return false;
      const price = parsePriceNum(p.price);
      if (!price) return false;
      return price < avgPrice * 0.3; // Less than 30% of average
    },
  },

  // Seller has no reviews or very low rating
  {
    name: 'low_seller_trust',
    test: (p) => {
      const trust = p.trustScore;
      if (trust === undefined || trust === null) return false;
      return trust < 30; // trustScore is 0-100 scale
    },
  },

  // Brand name typo detection (common knockoff patterns)
  {
    name: 'brand_typo_suspected',
    test: (p) => {
      const title = (p.name || '').toLowerCase();
      const KNOCKOFF_PATTERNS = [
        // Nike variants
        /\b(nikee|nkie|niike|n[i1]ke\s*[^a-z])/,
        // Adidas variants
        /\b(adibas|addidas|adiddas|ad[i1]das\s*[^a-z])/,
        // Sony variants
        /\b(sqny|s0ny|sonny\b)/,
        // Apple variants
        /\b(aple|appple|app1e)\b/,
        // Samsung variants
        /\b(samsug|samung|samssung)\b/,
        // Generic "for [brand]" pattern (often accessories or knockoffs)
        /^for\s+(apple|sony|samsung|nike|bose)\b/,
      ];
      return KNOCKOFF_PATTERNS.some(pattern => pattern.test(title));
    },
  },

  // AliExpress: New store (high risk)
  {
    name: 'aliexpress_new_store',
    test: (p) => {
      // Would need store_age from API — placeholder
      return false;
    },
    platforms: ['aliexpress'],
  },

  // AliExpress: Material misrepresentation risk
  {
    name: 'aliexpress_material_risk',
    test: (p) => {
      const title = (p.name || '').toLowerCase();
      const price = parsePriceNum(p.price);
      if (!price) return false;

      // "Genuine leather" items under $15 are almost certainly PU
      if (title.includes('genuine leather') && price < 15) return true;
      // "Silk" items under $10 are almost certainly polyester
      if (title.includes('100% silk') && price < 10) return true;
      // "Real gold" items under $20
      if ((title.includes('real gold') || title.includes('solid gold')) && price < 20) return true;

      return false;
    },
    platforms: ['aliexpress', 'temu', 'shein', 'dhgate'],
  },

  // Walmart: Third-party seller with no ratings
  {
    name: 'walmart_unverified_seller',
    test: (p) => {
      // Would need seller verification data — placeholder
      return false;
    },
    platforms: ['walmart'],
  },
];

// ─── Main Filter Function ─────────────────────────────

export function filterFraudulentProducts(
  products: Product[],
  options?: {
    /** Average price for this search category (for price anomaly detection) */
    categoryAvgPrice?: number;
  }
): FraudResult {
  const clean: Product[] = [];
  const flagged: Product[] = [];
  const removed: Product[] = [];
  const removeReasons: Record<string, number> = {};
  const flagReasons: Record<string, number> = {};

  const avgPrice = options?.categoryAvgPrice ?? calculateAvgPrice(products);

  for (const product of products) {
    const platform = detectPlatform(product);

    // ── Stage 1: Check Remove Rules ──
    let shouldRemove = false;
    for (const rule of REMOVE_RULES) {
      // Skip platform-specific rules that don't apply
      if (rule.platforms && !rule.platforms.includes(platform)) continue;

      if (rule.test(product)) {
        shouldRemove = true;
        removeReasons[rule.name] = (removeReasons[rule.name] || 0) + 1;
        break; // One reason is enough to remove
      }
    }

    if (shouldRemove) {
      removed.push(product);
      continue;
    }

    // ── Stage 3: Check Flag Rules ──
    let isFlagged = false;
    const productFlags: string[] = [];

    for (const rule of FLAG_RULES) {
      if (rule.platforms && !rule.platforms.includes(platform)) continue;

      if (rule.test(product, avgPrice)) {
        isFlagged = true;
        productFlags.push(rule.name);
        flagReasons[rule.name] = (flagReasons[rule.name] || 0) + 1;
      }
    }

    if (isFlagged) {
      // Attach fraud flags to the product for UI rendering
      const flaggedProduct: Product = {
        ...product,
        fraudFlags: productFlags,
      };
      flagged.push(flaggedProduct);
    } else {
      clean.push(product);
    }
  }

  return {
    clean,
    flagged,
    removed,
    stats: {
      total: products.length,
      removed: removed.length,
      flagged: flagged.length,
      clean: clean.length,
      removeReasons,
      flagReasons,
    },
  };
}

// ─── Helper Functions ─────────────────────────────────

function parsePriceNum(price: string | number | undefined | null): number | null {
  if (price === undefined || price === null) return null;
  const str = String(price).replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function detectPlatform(product: Product): string {
  const site = (product.site || '').toLowerCase();
  if (site.includes('amazon')) return 'amazon';
  if (site.includes('walmart')) return 'walmart';
  if (site.includes('ebay')) return 'ebay';
  if (site.includes('target')) return 'target';
  if (site.includes('best buy') || site.includes('bestbuy')) return 'bestbuy';
  if (site.includes('aliexpress')) return 'aliexpress';
  if (site.includes('temu')) return 'temu';
  if (site.includes('shein')) return 'shein';
  if (site.includes('dhgate')) return 'dhgate';
  if (site.includes('costco')) return 'costco';
  if (site.includes('home depot')) return 'homedepot';
  if (site.includes('iherb')) return 'iherb';
  if (site.includes('sephora')) return 'sephora';
  if (site.includes('nike')) return 'nike';
  if (site.includes('etsy')) return 'etsy';
  return 'unknown';
}

function calculateAvgPrice(products: Product[]): number {
  const prices = products
    .map(p => parsePriceNum(p.price))
    .filter((p): p is number => p !== null && p > 0);

  if (prices.length === 0) return 0;
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

// ─── Exports ─────────────────────────────────

export { parsePriceNum, detectPlatform, calculateAvgPrice };
