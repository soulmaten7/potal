/**
 * POTAL HS Code Classifier — v2
 *
 * Keyword-based product classification with multi-signal confidence.
 *
 * Key design principles:
 * 1. Confidence reflects actual certainty, not just match score
 * 2. Material-only matches (e.g., "cotton") get LOW confidence → LLM fallback
 * 3. Product-type matches (e.g., "t-shirt") get HIGH confidence
 * 4. Cross-category ambiguity lowers confidence → LLM fallback
 * 5. Finished products always beat raw materials for consumer goods
 */

import type { HsClassificationResult } from './types';
import { HS_DATABASE } from './hs-database';
import { subdivideHeading } from './heading-subdivider';

// ─── Constants ───────────────────────────────────────

/**
 * Material keywords: these describe WHAT something is made of, not WHAT it is.
 * When these are the ONLY matching signal, confidence should be low
 * because "cotton" alone could be yarn, fabric, or a t-shirt.
 */
const MATERIAL_KEYWORDS = new Set([
  'cotton', 'silk', 'wool', 'linen', 'polyester', 'nylon', 'rayon', 'cashmere',
  'leather', 'suede', 'canvas', 'denim', 'velvet', 'satin', 'chiffon', 'lace',
  'steel', 'iron', 'copper', 'aluminum', 'aluminium', 'titanium', 'zinc', 'tin', 'lead', 'nickel',
  'gold', 'silver', 'platinum', 'diamond', 'ruby', 'sapphire', 'emerald', 'pearl',
  'wood', 'bamboo', 'cork', 'rattan',
  'rubber', 'plastic', 'glass', 'ceramic', 'porcelain', 'crystal',
  'paper', 'cardboard',
  'synthetic', 'natural',
]);

/**
 * Product-type keywords: these describe WHAT the product IS.
 * These are strong classification signals.
 */
const PRODUCT_TYPE_KEYWORDS = new Set([
  // Apparel
  't-shirt', 'tshirt', 'shirt', 'blouse', 'dress', 'skirt', 'pants', 'trousers', 'jeans',
  'jacket', 'coat', 'blazer', 'sweater', 'hoodie', 'cardigan', 'vest', 'suit',
  'underwear', 'bra', 'socks', 'stockings', 'pajamas', 'robe', 'uniform',
  // Footwear
  'shoes', 'boots', 'sneakers', 'sandals', 'slippers', 'loafers', 'heels', 'flats',
  'footwear', 'moccasins', 'clogs', 'hiking boots',
  // Bags & accessories
  'bag', 'handbag', 'backpack', 'purse', 'wallet', 'briefcase', 'suitcase', 'luggage',
  'belt', 'gloves', 'hat', 'cap', 'scarf', 'tie', 'umbrella',
  // Jewelry & watches
  'ring', 'necklace', 'bracelet', 'earring', 'earrings', 'pendant', 'brooch',
  'jewelry', 'jewellery', 'watch', 'wristwatch',
  // Electronics
  'laptop', 'computer', 'phone', 'smartphone', 'tablet', 'camera', 'television', 'tv',
  'headphones', 'earbuds', 'speaker', 'monitor', 'keyboard', 'mouse', 'printer',
  'charger', 'battery', 'cable', 'adapter', 'router', 'modem', 'scooter',
  // Home
  'chair', 'table', 'desk', 'sofa', 'bed', 'mattress', 'lamp', 'mirror', 'rug', 'carpet',
  'curtain', 'pillow', 'blanket', 'towel', 'sheet',
  // Kitchen
  'pan', 'pot', 'knife', 'fork', 'spoon', 'plate', 'bowl', 'cup', 'mug', 'kettle',
  'blender', 'toaster', 'oven', 'microwave',
  // Toys & sports
  'toy', 'doll', 'puzzle', 'bicycle', 'skateboard', 'racket',
  // Cosmetics
  'perfume', 'lipstick', 'mascara', 'foundation', 'moisturizer', 'sunscreen', 'serum',
  'shampoo', 'soap', 'balm',
  // Food
  'tea', 'coffee', 'chocolate', 'wine', 'beer', 'juice', 'oil', 'vinegar', 'sauce',
  'cheese', 'butter', 'honey', 'sugar', 'flour', 'rice', 'pasta',
  // Vehicles
  'car', 'motorcycle', 'bicycle', 'scooter', 'truck', 'stroller',
  // Tools
  'drill', 'hammer', 'saw', 'wrench', 'screwdriver', 'pliers',
  // Industrial
  'pipe', 'tube', 'valve', 'pump', 'motor', 'engine', 'generator', 'panel',
  // Misc
  'supplement', 'vitamin', 'capsule', 'medicine', 'tablet',
  'guitar', 'racket', 'skateboard', 'mask',
  'coat', 'scarf', 'jeans',
  'bolt', 'foil', 'tire', 'tyre',
  'bottle', 'conditioner',
]);

/**
 * Raw material HS chapters (Ch01-27, 41, 44, 47, 50-55, 72-76)
 * Products in these chapters are typically raw/semi-processed materials.
 */
const RAW_MATERIAL_CHAPTERS = new Set([
  '01','02','03','04','05','06','07','08','09','10','11','12','13','14','15',
  '23','25','26','27',
  '41', // Raw hides
  '44', // Wood (raw)
  '47', // Pulp
  '50', // Silk (raw)
  '51', // Wool (raw)
  '52', // Cotton (raw/yarn/fabric)
  '53', // Other vegetable fibers
  '54', // Man-made filaments
  '55', // Man-made staple fibers
  '72', // Iron and steel
  '74', // Copper
  '75', // Nickel
  '76', // Aluminum
]);

/**
 * Finished product HS chapters
 */
const FINISHED_PRODUCT_CHAPTERS = new Set([
  '16','17','18','19','20','21','22', // Prepared food
  '30','33','34', // Pharma, cosmetics, cleaning
  '39','40', // Plastics, rubber (articles)
  '42', // Leather goods
  '46', // Basketwork
  '48','49', // Paper articles, books
  '56','57','58','59','60', // Special fabrics
  '61','62','63', // Apparel, clothing
  '64','65','66','67', // Footwear, headwear
  '69','70', // Ceramics, glass articles
  '71', // Jewelry
  '73', // Iron/steel articles
  '82','83', // Tools, misc metal
  '84','85', // Machinery, electronics
  '86','87','88','89', // Vehicles
  '90','91','92', // Instruments, clocks, music
  '93','94','95','96','97', // Arms, furniture, toys, misc
]);

// ─── Text Processing ─────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// CW32: simple plural → singular for tokens ending in 's' (len > 3).
// Keeps "t-shirts" → "t-shirt" so the classifier matches the same HS as
// the singular form. Preserves 'ss' words (e.g. 'glass'), short words, and
// irregular plurals are left as-is (they'll still score by partial match).
function singularize(word: string): string | null {
  if (word.length <= 3) return null;
  if (word.endsWith('ss')) return null;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return null;
}

function tokenize(text: string): string[] {
  const words = normalize(text).split(' ').filter(Boolean);
  const tokens = [...words];
  // CW32: add singular form of each plural word so the HS keyword list
  // (which stores singular forms like 't-shirt') matches plural inputs.
  for (const w of words) {
    const singular = singularize(w);
    if (singular && singular !== w) tokens.push(singular);
  }
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
    // Also emit singularized bigrams when the second word is plural
    const s2 = singularize(words[i + 1]);
    if (s2 && s2 !== words[i + 1]) tokens.push(`${words[i]} ${s2}`);
  }
  return tokens;
}

// ─── Scoring ─────────────────────────────────────────

interface ScoredEntry {
  entry: { code: string; description: string; chapter: string; category: string; keywords: string[] };
  rawScore: number;
  matchedCount: number;
  matchedProductType: number; // How many product-type keywords matched
  matchedMaterial: number;    // How many material-only keywords matched
}

function scoreEntry(
  tokens: string[],
  entry: { code: string; description: string; chapter: string; category: string; keywords: string[] },
  category?: string,
): ScoredEntry {
  let rawScore = 0;
  let matchedCount = 0;
  let matchedProductType = 0;
  let matchedMaterial = 0;

  // Track which input tokens already contributed a partial match to this entry
  // Prevents "leather" from scoring on "leather jacket", "leather pants", "leather vest" separately
  const usedPartialTokens = new Set<string>();

  for (const keyword of entry.keywords) {
    const kw = normalize(keyword);
    let matched = false;
    const isBigram = kw.includes(' ');

    // Exact token match
    let isExactMatch = false;
    if (tokens.includes(kw)) {
      // Bigram exact matches are MORE specific → higher score
      // "phone case" exactly matching is worth more than "phone" matching
      rawScore += isBigram ? 15 : 10;
      matched = true;
      isExactMatch = true;
    } else {
      // Partial match (min 4 chars) — each input token can only contribute ONCE per entry
      for (const token of tokens) {
        if (token.length >= 4 && kw.length >= 4 && !usedPartialTokens.has(token) && (token.includes(kw) || kw.includes(token))) {
          rawScore += 5;
          matched = true;
          usedPartialTokens.add(token);
          break;
        }
      }
    }

    if (matched) {
      matchedCount++;
      // Classify what KIND of keyword matched
      if (PRODUCT_TYPE_KEYWORDS.has(kw)) {
        matchedProductType++;
      } else if (MATERIAL_KEYWORDS.has(kw)) {
        matchedMaterial++;
      }
      // Bigram EXACT match containing a product-type word is an extra strong signal
      // IMPORTANT: Only on exact match — partial matches can false-positive
      // (e.g., "leather" partially matching "leather jacket" should NOT boost product-type)
      if (isExactMatch && isBigram && (PRODUCT_TYPE_KEYWORDS.has(kw.split(' ')[0]) || PRODUCT_TYPE_KEYWORDS.has(kw.split(' ')[1]))) {
        matchedProductType++;
      }
    }
  }

  // Multi-keyword specificity bonus
  if (matchedCount >= 2) {
    rawScore += matchedCount * 3;
  }

  // Product-type keyword match is a strong positive signal
  // An entry whose keywords include the exact product type should score much higher
  if (matchedProductType >= 1) {
    rawScore += 12;
  }

  // Category hint boost
  if (category && entry.category === category.toLowerCase()) {
    rawScore += 8;
  }

  // Description match bonus
  const descTokens = tokenize(entry.description);
  for (const token of tokens) {
    if (descTokens.includes(token)) {
      rawScore += 3;
    }
  }

  return { entry, rawScore, matchedCount, matchedProductType, matchedMaterial };
}

// ─── Confidence Calculation ──────────────────────────

/**
 * Calculate confidence based on multiple signals, not just score.
 *
 * High confidence (0.8-1.0): Product-type keyword matched + high score
 * Medium confidence (0.5-0.7): Mixed signals or material-only match
 * Low confidence (0.2-0.4): Ambiguous, should go to LLM
 */
function calculateConfidence(
  best: ScoredEntry,
  scored: ScoredEntry[],
  tokens: string[],
): number {
  const { rawScore, matchedCount, matchedProductType, matchedMaterial } = best;

  // Base confidence from raw score (capped at 0.7 to leave room for signals)
  let confidence = Math.min(rawScore / 40, 0.7);

  // ── Signal 1: Product-type keyword match → HIGH confidence boost ──
  // "t-shirt" or "laptop" directly identifies the product
  if (matchedProductType >= 1) {
    confidence += 0.15;
  }
  if (matchedProductType >= 2) {
    confidence += 0.10; // e.g., "running shoes" matches both "running" context and "shoes"
  }

  // ── Signal 2: Material-only match → confidence PENALTY ──
  // "cotton" alone could be yarn (5205), fabric (5208), or t-shirt (6109)
  // "leather" alone could be raw hide (4101), leather article (4205), or handbag (4202)
  if (matchedMaterial > 0 && matchedProductType === 0) {
    confidence -= 0.25;
    // If ALL input tokens are material keywords (no product words at all),
    // cap confidence hard — this MUST go to LLM for disambiguation
    const allTokensMaterial = tokens.every(t => MATERIAL_KEYWORDS.has(t) || t.length < 3);
    if (allTokensMaterial) {
      confidence = Math.min(confidence, 0.40);
    }
  }

  // ── Signal 3: Ambiguity detection → confidence PENALTY ──
  // Check if alternatives in different chapters/headings have competitive scores
  if (scored.length >= 2) {
    const topHeading4 = best.entry.code.slice(0, 4);

    // Look at top 5 results for cross-chapter competition
    const competitors = scored.slice(1, 5);
    let crossChapterCompetitor = false;
    let crossHeadingCompetitor = false;

    for (const comp of competitors) {
      if (comp.rawScore < best.rawScore * 0.4) break; // Too low to matter
      if (comp.entry.chapter !== best.entry.chapter) {
        crossChapterCompetitor = true;
      } else if (comp.entry.code.slice(0, 4) !== topHeading4) {
        crossHeadingCompetitor = true;
      }
    }

    if (crossChapterCompetitor) {
      confidence -= 0.20; // Strong ambiguity signal
    } else if (crossHeadingCompetitor) {
      confidence -= 0.10;
    }
  }

  // ── Signal 4: Raw material chapter penalty ──
  // If the best match is in a raw material chapter but the input has product-type words,
  // something is wrong → lower confidence to trigger LLM
  const inputHasProductWord = tokens.some(t => PRODUCT_TYPE_KEYWORDS.has(t));
  if (inputHasProductWord && RAW_MATERIAL_CHAPTERS.has(best.entry.chapter)) {
    confidence -= 0.20;
  }

  // ── Signal 5: Multi-keyword cross-validation bonus ──
  // More matched keywords = more confident (but only if they're diverse)
  if (matchedCount >= 3) {
    confidence += 0.05;
  }

  // ── Signal 6: Low total match count → uncertain ──
  // But only if no product-type keyword matched (single product-type match is still reliable)
  if (matchedCount <= 1 && matchedProductType === 0) {
    confidence = Math.min(confidence, 0.45);
  }

  // ── Signal 7: Top alternatives in completely different categories ──
  // If the top 3 results span 3+ different categories, the classifier is guessing
  if (scored.length >= 3) {
    const topCategories = new Set(scored.slice(0, 4).map(s => s.entry.category));
    if (topCategories.size >= 3) {
      confidence -= 0.10;
    }
    // If top 3 span 3+ different HS chapters, even more uncertain
    const topChapters = new Set(scored.slice(0, 4).map(s => s.entry.chapter));
    if (topChapters.size >= 3) {
      confidence -= 0.10;
    }
  }

  return Math.max(Math.min(Math.round(confidence * 100) / 100, 1), 0.05);
}

// ─── Category-aware Re-ranking ───────────────────────

/**
 * When the product name contains a product-type word, re-rank results
 * to prefer finished products over raw materials.
 *
 * This is different from the old approach: instead of hardcoded category lists,
 * we use HS chapter semantics (raw material chapters vs finished product chapters).
 */
function rerankForFinishedProducts(
  scored: ScoredEntry[],
  tokens: string[],
): ScoredEntry[] {
  const inputHasProductWord = tokens.some(t => PRODUCT_TYPE_KEYWORDS.has(t));
  if (!inputHasProductWord) return scored;

  return scored.map(s => {
    let adjustedScore = s.rawScore;

    if (FINISHED_PRODUCT_CHAPTERS.has(s.entry.chapter)) {
      // Boost finished product chapters
      adjustedScore += 12;
    } else if (RAW_MATERIAL_CHAPTERS.has(s.entry.chapter)) {
      // Penalize raw material chapters when product-type word is present
      adjustedScore = Math.max(adjustedScore - 8, 1);
    }

    // Strong boost: if this entry matched a product-type keyword directly,
    // it should dominate entries that only matched material keywords.
    // e.g., "Plastic Toy" → entry with "toy" keyword (9503) should beat
    // entries with only "plastic" keyword (3924)
    if (s.matchedProductType >= 1 && s.matchedMaterial === 0) {
      adjustedScore += 15; // Product-type-only match = strong signal
    } else if (s.matchedProductType >= 1 && s.matchedMaterial >= 1) {
      adjustedScore += 8; // Both matched = moderate signal
    } else if (s.matchedProductType === 0 && s.matchedMaterial >= 1) {
      adjustedScore = Math.max(adjustedScore - 5, 1); // Material-only = weaker
    }

    return { ...s, rawScore: adjustedScore };
  }).sort((a, b) => b.rawScore - a.rawScore);
}

// ─── CW32: Battery classification overrides ─────────
//
// The keyword-based scorer is biased toward HS 8506 for anything containing
// "battery" because the 850650 entry's keywords include a generic "battery"
// token and several partial-matching aliases. Lithium-ion (rechargeable) is
// a different HS heading (8507) and must carry different HAZMAT warnings
// (UN3480/3481 vs UN3090/3091). Pre-classify battery-adjacent products with
// an explicit keyword rule so downstream restriction + FTA logic branches
// on the correct heading.
function overrideBatteryClassification(
  productName: string,
): HsClassificationResult | null {
  const p = productName.toLowerCase();
  if (!/\b(battery|batteries|cell|cells|accumulator|pack)\b|cr\d{4}/.test(p)) {
    return null;
  }

  const mentionsLithium = /\blithium|li.ion\b|li-ion/.test(p);
  const mentionsPrimary = /\b(primary|non[-\s]?rechargeable|disposable)\b/.test(p);
  const mentionsRechargeable =
    /\b(rechargeable|secondary|li.ion|lithium.ion|lithium-ion|power[-\s]?bank|accumulator)\b/.test(
      p,
    ) || /\b18650\b|\b21700\b/.test(p);
  const mentionsCoinCell = /\bcr\d{4}\b|\bbutton[-\s]?cell/.test(p);
  const mentionsAlkaline = /\balkaline\b|\baa\b|\baaa\b/.test(p);

  // Primary (non-rechargeable) lithium cells → 850650
  if ((mentionsLithium && (mentionsPrimary || mentionsCoinCell)) || mentionsCoinCell) {
    return {
      hsCode: '850650',
      description: 'Primary cells and primary batteries — lithium (non-rechargeable)',
      confidence: 0.95,
      method: 'keyword',
      alternatives: [
        { hsCode: '850680', description: 'Primary cells — other', confidence: 0.4 },
      ],
    };
  }

  // Lithium-ion / rechargeable lithium / Li-ion accumulator → 850760
  if (mentionsLithium && mentionsRechargeable) {
    return {
      hsCode: '850760',
      description: 'Electric accumulators — lithium-ion (rechargeable)',
      confidence: 0.95,
      method: 'keyword',
      alternatives: [
        { hsCode: '850780', description: 'Electric accumulators — other', confidence: 0.4 },
      ],
    };
  }

  // Lithium-ion without explicit "rechargeable" keyword — still li-ion chemistry
  if (/li.ion\b|li-ion|lithium.ion|lithium-ion/.test(p)) {
    return {
      hsCode: '850760',
      description: 'Electric accumulators — lithium-ion',
      confidence: 0.9,
      method: 'keyword',
      alternatives: [],
    };
  }

  // Bare "lithium battery" (ambiguous) — default to li-ion (the more common
  // consumer-facing case in 2025+)
  if (mentionsLithium) {
    return {
      hsCode: '850760',
      description: 'Electric accumulators — lithium-ion (default for "lithium battery")',
      confidence: 0.8,
      method: 'keyword',
      alternatives: [
        { hsCode: '850650', description: 'Primary cells — lithium', confidence: 0.3 },
      ],
    };
  }

  // Primary alkaline (AA/AAA) → 850610
  if (mentionsPrimary && mentionsAlkaline) {
    return {
      hsCode: '850610',
      description: 'Primary cells and primary batteries — manganese dioxide (alkaline)',
      confidence: 0.9,
      method: 'keyword',
      alternatives: [],
    };
  }

  return null;
}

// ─── Main Classification ─────────────────────────────

export function classifyProduct(
  productName: string,
  category?: string,
): HsClassificationResult {
  if (!productName || productName.trim().length === 0) {
    return {
      hsCode: '9999',
      description: 'Unclassified product',
      confidence: 0,
      method: 'keyword',
      alternatives: [],
    };
  }

  // CW32: pre-classification override for batteries (8506 vs 8507)
  const batteryOverride = overrideBatteryClassification(productName);
  if (batteryOverride) return batteryOverride;

  const tokens = tokenize(productName);

  // Score every entry
  let scored = HS_DATABASE
    .map(entry => scoreEntry(tokens, entry, category))
    .filter(s => s.rawScore > 0)
    .sort((a, b) => b.rawScore - a.rawScore);

  if (scored.length === 0) {
    return {
      hsCode: '9999',
      description: 'Unclassified — no keyword match',
      confidence: 0,
      method: 'keyword',
      alternatives: [],
    };
  }

  // Re-rank: finished products > raw materials when product-type word is present
  scored = rerankForFinishedProducts(scored, tokens);

  let best = scored[0];

  // Heading subdivision
  const heading4 = best.entry.code.slice(0, 4);
  const sameHeadingCandidates = scored
    .filter(s => s.entry.code.startsWith(heading4) && s.rawScore >= best.rawScore * 0.7)
    .map(s => ({ code: s.entry.code, description: s.entry.description, score: s.rawScore }));

  let confidenceBoost = 0;
  if (sameHeadingCandidates.length > 1) {
    const subdivision = subdivideHeading(sameHeadingCandidates, productName);
    if (subdivision) {
      const subdividedEntry = scored.find(s => s.entry.code === subdivision.bestCode);
      if (subdividedEntry) {
        best = subdividedEntry;
        confidenceBoost = subdivision.confidenceBoost;
      }
    }
  }

  // Calculate multi-signal confidence
  const confidence = Math.min(calculateConfidence(best, scored, tokens) + confidenceBoost, 1);

  // Alternatives: different HS4 headings only
  const seenHeadings = new Set([best.entry.code.slice(0, 4)]);
  const alternatives = scored
    .filter(s => {
      const h4 = s.entry.code.slice(0, 4);
      if (seenHeadings.has(h4) || s.rawScore < 3) return false;
      seenHeadings.add(h4);
      return true;
    })
    .slice(0, 3)
    .map(s => ({
      hsCode: s.entry.code,
      description: s.entry.description,
      confidence: Math.min(calculateConfidence(s, scored, tokens), confidence - 0.01),
    }));

  return {
    hsCode: best.entry.code,
    description: best.entry.description,
    confidence: Math.round(confidence * 100) / 100,
    method: 'keyword',
    alternatives,
  };
}

/**
 * Classify with HS Code override — if seller provides HS Code, use it directly
 */
export function classifyWithOverride(
  productName: string,
  hsCodeOverride?: string,
  category?: string,
): HsClassificationResult {
  if (hsCodeOverride) {
    const entry = HS_DATABASE.find((e) => e.code === hsCodeOverride);
    return {
      hsCode: hsCodeOverride,
      description: entry?.description || 'Seller-provided HS Code',
      confidence: 1,
      method: 'manual',
      alternatives: [],
    };
  }

  return classifyProduct(productName, category);
}
