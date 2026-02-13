/**
 * POTAL ScoringEngine — Best / Fastest / Cheapest Ranking
 *
 * Best Score = weighted composite:
 *   Price(W1=0.35) + Speed(W2=0.25) + SellerTrust(W3=0.20)
 *   + MatchAccuracy(W4=0.15) + ReturnPolicy(W5=0.05)
 *
 * Cheapest = pure Total Landed Cost sort (ascending)
 * Fastest  = pure delivery speed sort (ascending days)
 *
 * Also produces "tab summary" — the top product in each category
 * so the UI can show dynamic values like "$278 · 3 Days" instead of hardcoded.
 */

import type { Product } from '../../types/product';
import type { LandedCost } from './CostEngine';

// ─── Types ──────────────────────────────────────────

export interface ScoredProduct extends Product {
  /** Best Score (0-100, higher is better) */
  bestScore: number;
  /** Total Landed Cost from CostEngine */
  landedCost?: LandedCost;
  /** Parsed delivery days (numeric) */
  parsedDeliveryDays: number;
  /** Normalized price (numeric) */
  parsedPrice: number;
  /** Individual score components for debugging */
  scoreBreakdown?: {
    priceScore: number;
    speedScore: number;
    trustScore: number;
    matchScore: number;
    returnScore: number;
  };
}

export interface TabSummary {
  best: { price: string; days: string } | null;
  cheapest: { price: string; days: string } | null;
  fastest: { price: string; days: string } | null;
}

export interface ScoringResult {
  /** Products sorted by Best Score (default) */
  bestSorted: ScoredProduct[];
  /** Products sorted by cheapest Total Landed Cost */
  cheapestSorted: ScoredProduct[];
  /** Products sorted by fastest delivery */
  fastestSorted: ScoredProduct[];
  /** Tab summary values for UI */
  tabSummary: TabSummary;
}

// ─── Default Weights ────────────────────────────────

const DEFAULT_WEIGHTS = {
  price: 0.35,
  speed: 0.25,
  trust: 0.20,
  match: 0.15,
  returnPolicy: 0.05,
};

// ─── Helper: Parse delivery days from various formats ──

function parseDeliveryDays(product: Product): number {
  // Try deliveryDays field first
  if (product.deliveryDays) {
    const num = parseInt(String(product.deliveryDays), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Try to parse from delivery/shipping text
  const text = (
    (product as any).delivery ||
    (product as any).arrives ||
    product.shipping ||
    ''
  ).toLowerCase();

  // "2-3 days" → take average
  const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)\s*day/);
  if (rangeMatch) {
    return Math.ceil((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
  }

  // "2 days" or "in 3 days"
  const singleMatch = text.match(/(\d+)\s*day/);
  if (singleMatch) return parseInt(singleMatch[1]);

  // "tomorrow" or "next day"
  if (text.includes('tomorrow') || text.includes('next day') || text.includes('1-day')) return 1;

  // "same day" or "today"
  if (text.includes('same day') || text.includes('today')) return 0;

  // Amazon Prime → assume 2 days
  if (product.is_prime || (product as any).badges?.includes('Prime')) return 2;

  // Domestic default
  const shippingType = (product.shipping || '').toLowerCase();
  if (shippingType.includes('domestic')) return 5; // domestic default
  if (shippingType.includes('international') || shippingType.includes('global')) return 14; // global default

  return 7; // unknown default
}

// ─── Helper: Parse price to number ──────────────────

function parsePriceToNum(price: string | number | undefined): number {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const num = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

// ─── Helper: Estimate trust score ───────────────────

function estimateTrustScore(product: Product): number {
  // If product already has a trustScore, use it (0-100 scale)
  if (product.trustScore != null && product.trustScore > 0) {
    return product.trustScore;
  }

  let score = 50; // baseline

  // Rating boost (0-5 scale)
  const rating = (product as any).rating || 0;
  if (rating >= 4.5) score += 25;
  else if (rating >= 4.0) score += 15;
  else if (rating >= 3.5) score += 5;
  else if (rating > 0 && rating < 3.0) score -= 15;

  // Review count boost
  const reviews = (product as any).reviewCount || 0;
  if (reviews >= 1000) score += 15;
  else if (reviews >= 100) score += 10;
  else if (reviews >= 10) score += 5;
  else if (reviews === 0) score -= 10;

  // Prime boost
  if (product.is_prime || (product as any).badges?.includes('Prime')) score += 10;

  // Platform trust boost
  const site = (product.site || '').toLowerCase();
  const trustedPlatforms = ['amazon', 'walmart', 'target', 'best buy', 'bestbuy', 'costco', 'apple', 'nike', 'sephora'];
  if (trustedPlatforms.some(p => site.includes(p))) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ─── Helper: Estimate match accuracy ────────────────

function estimateMatchAccuracy(product: Product, _query?: string): number {
  // For now, return a baseline. This will be enhanced when LLM pre-think
  // layer provides relevance scoring.
  // Higher-priced items with real images tend to be more relevant.

  let score = 70; // baseline — all results from API should be somewhat relevant

  // Has image → more likely real product
  if (product.image && product.image !== 'placeholder') score += 10;

  // Has brand → more likely main product (not accessory)
  if (product.brand) score += 10;

  // Title length sweet spot (not too short, not keyword-stuffed)
  const titleLen = (product.name || '').length;
  if (titleLen >= 20 && titleLen <= 150) score += 10;
  else if (titleLen > 200) score -= 5; // keyword stuffing risk

  return Math.max(0, Math.min(100, score));
}

// ─── Helper: Estimate return policy score ───────────

function estimateReturnPolicyScore(product: Product): number {
  const site = (product.site || '').toLowerCase();

  // Known good return policies
  if (site.includes('amazon')) return 85; // 30-day returns
  if (site.includes('walmart')) return 80;
  if (site.includes('target')) return 85;
  if (site.includes('costco')) return 95; // famously generous
  if (site.includes('best buy') || site.includes('bestbuy')) return 75;
  if (site.includes('apple')) return 80;
  if (site.includes('nike')) return 75;

  // Domestic default
  const shippingType = (product.shipping || '').toLowerCase();
  if (shippingType.includes('domestic')) return 65;

  // Global platforms — harder to return
  if (site.includes('aliexpress')) return 35;
  if (site.includes('temu')) return 40;
  if (site.includes('shein')) return 40;
  if (site.includes('dhgate')) return 25;

  // Global default
  if (shippingType.includes('international') || shippingType.includes('global')) return 35;

  return 50; // unknown
}

// ─── Normalize Score (min-max within set) ───────────

function normalizeValues(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50); // all equal → all get 50
  return values.map(v => ((v - min) / (max - min)) * 100);
}

// ─── Main Scoring Function ──────────────────────────

export function scoreProducts(
  products: Product[],
  options?: {
    /** Map of product ID → LandedCost (from CostEngine) */
    landedCosts?: Map<string, LandedCost>;
    /** Original search query for match accuracy */
    query?: string;
    /** User preference: adjust price vs speed weights */
    priceSpeedBalance?: number; // 0 = all price, 100 = all speed, 50 = default
  }
): ScoringResult {
  if (products.length === 0) {
    return {
      bestSorted: [],
      cheapestSorted: [],
      fastestSorted: [],
      tabSummary: { best: null, cheapest: null, fastest: null },
    };
  }

  const landedCosts = options?.landedCosts;
  const query = options?.query;
  const balance = options?.priceSpeedBalance ?? 50;

  // Adjust weights based on user preference (price ↔ speed slider)
  const weights = { ...DEFAULT_WEIGHTS };
  if (balance !== 50) {
    // balance 0 = max price weight, 100 = max speed weight
    // Total of price+speed remains constant (0.60)
    const totalPriceSpeed = weights.price + weights.speed;
    const speedRatio = balance / 100;
    weights.speed = totalPriceSpeed * speedRatio;
    weights.price = totalPriceSpeed * (1 - speedRatio);
  }

  // Step 1: Parse raw values for each product
  const parsed = products.map(product => {
    const lc = landedCosts?.get(product.id);
    const rawPrice = lc ? lc.totalLandedCost : parsePriceToNum(product.price) + (product.shippingPrice ?? 0);
    const rawDays = parseDeliveryDays(product);
    const rawTrust = estimateTrustScore(product);
    const rawMatch = estimateMatchAccuracy(product, query);
    const rawReturn = estimateReturnPolicyScore(product);

    return {
      product,
      landedCost: lc,
      rawPrice,
      rawDays,
      rawTrust,
      rawMatch,
      rawReturn,
    };
  });

  // Step 2: Normalize price and speed (inverted — lower is better → higher score)
  const prices = parsed.map(p => p.rawPrice);
  const days = parsed.map(p => p.rawDays);
  const normalizedPrices = normalizeValues(prices);
  const normalizedDays = normalizeValues(days);

  // Step 3: Calculate Best Score for each product
  const scoredProducts: ScoredProduct[] = parsed.map((p, i) => {
    // Invert: lower price/days → higher score
    const priceScore = 100 - normalizedPrices[i];
    const speedScore = 100 - normalizedDays[i];
    const trustScore = p.rawTrust;
    const matchScore = p.rawMatch;
    const returnScore = p.rawReturn;

    const bestScore =
      priceScore * weights.price +
      speedScore * weights.speed +
      trustScore * weights.trust +
      matchScore * weights.match +
      returnScore * weights.returnPolicy;

    return {
      ...p.product,
      bestScore: Math.round(bestScore * 100) / 100,
      landedCost: p.landedCost,
      parsedDeliveryDays: p.rawDays,
      parsedPrice: p.rawPrice,
      scoreBreakdown: {
        priceScore: Math.round(priceScore * 100) / 100,
        speedScore: Math.round(speedScore * 100) / 100,
        trustScore: Math.round(trustScore * 100) / 100,
        matchScore: Math.round(matchScore * 100) / 100,
        returnScore: Math.round(returnScore * 100) / 100,
      },
    };
  });

  // Step 4: Sort by each criterion
  const bestSorted = [...scoredProducts].sort((a, b) => b.bestScore - a.bestScore);
  const cheapestSorted = [...scoredProducts].sort((a, b) => a.parsedPrice - b.parsedPrice);
  const fastestSorted = [...scoredProducts].sort((a, b) => a.parsedDeliveryDays - b.parsedDeliveryDays);

  // Step 5: Generate tab summary (top product in each)
  const tabSummary: TabSummary = {
    best: bestSorted.length > 0 ? {
      price: formatPrice(bestSorted[0].parsedPrice),
      days: formatDays(bestSorted[0].parsedDeliveryDays),
    } : null,
    cheapest: cheapestSorted.length > 0 ? {
      price: formatPrice(cheapestSorted[0].parsedPrice),
      days: formatDays(cheapestSorted[0].parsedDeliveryDays),
    } : null,
    fastest: fastestSorted.length > 0 ? {
      price: formatPrice(fastestSorted[0].parsedPrice),
      days: formatDays(fastestSorted[0].parsedDeliveryDays),
    } : null,
  };

  return { bestSorted, cheapestSorted, fastestSorted, tabSummary };
}

// ─── Format Helpers ─────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return '$0';
  return `$${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
}

function formatDays(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 Day';
  return `${days} Days`;
}

// ─── Exports ────────────────────────────────────────

export {
  parseDeliveryDays,
  parsePriceToNum,
  estimateTrustScore,
  estimateReturnPolicyScore,
  DEFAULT_WEIGHTS,
};
