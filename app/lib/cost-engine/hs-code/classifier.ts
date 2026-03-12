/**
 * POTAL HS Code Classifier
 *
 * Keyword-based product classification.
 * Takes product name/description and returns best matching HS Code.
 *
 * Phase 1: Keyword matching with scoring
 * Phase 5: AI-assisted classification (LLM fallback)
 */

import type { HsClassificationResult } from './types';
import { HS_DATABASE } from './hs-database';
import { subdivideHeading } from './heading-subdivider';

/**
 * Normalize text for matching: lowercase, remove special chars
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words and bigrams
 */
function tokenize(text: string): string[] {
  const words = normalize(text).split(' ').filter(Boolean);
  const tokens = [...words];

  // Add bigrams for compound keywords like "hair dryer", "phone case"
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }

  return tokens;
}

/**
 * Calculate match score between product tokens and HS entry keywords
 */
function calculateScore(tokens: string[], keywords: string[]): number {
  let score = 0;
  let matchedKeywords = 0;

  for (const keyword of keywords) {
    const kw = normalize(keyword);

    // Exact token match (highest score)
    if (tokens.includes(kw)) {
      score += 10;
      matchedKeywords++;
      continue;
    }

    // Partial match: token contains keyword or keyword contains token
    // Require minimum 4 chars for substring matching to avoid false positives
    // (e.g. "air" matching "chair", "max" matching "wax")
    for (const token of tokens) {
      if (token.length >= 4 && kw.length >= 4 && (token.includes(kw) || kw.includes(token))) {
        score += 5;
        matchedKeywords++;
        break;
      }
    }
  }

  // Bonus for multiple keyword matches (specificity)
  if (matchedKeywords >= 2) {
    score += matchedKeywords * 3;
  }

  return score;
}

/**
 * Classify a product by name/description → HS Code
 *
 * @param productName - Product name or description
 * @param category - Optional category hint (e.g. 'electronics', 'apparel')
 * @returns Classification result with confidence
 */
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

  const tokens = tokenize(productName);

  // Finished-product keywords: when these appear in the product name,
  // prefer finished-good categories (apparel, footwear, accessories)
  // over raw-material categories (textiles, raw materials, fibers)
  const FINISHED_PRODUCT_WORDS = [
    't-shirt', 'tshirt', 'shirt', 'dress', 'jacket', 'coat', 'blouse', 'sweater', 'hoodie', 'pants', 'trousers', 'skirt', 'suit',
    'shoes', 'boots', 'sneakers', 'sandals', 'slippers', 'footwear',
    'bag', 'handbag', 'backpack', 'purse', 'wallet', 'briefcase', 'suitcase', 'luggage',
    'gloves', 'belt', 'hat', 'cap', 'scarf', 'tie', 'socks', 'underwear',
    'ring', 'necklace', 'bracelet', 'earring', 'jewelry', 'jewellery', 'watch',
  ];
  const RAW_MATERIAL_CATEGORIES = ['textiles', 'raw materials', 'fibers'];
  const FINISHED_CATEGORIES = ['apparel', 'footwear', 'accessories', 'jewelry', 'bags', 'leather'];
  const hasFinishedProductWord = tokens.some(t => FINISHED_PRODUCT_WORDS.includes(t));

  // Score every entry
  const scored = HS_DATABASE.map((entry) => {
    let score = calculateScore(tokens, entry.keywords);

    // Category boost: if caller provides a category hint, boost matches
    if (category && entry.category === category.toLowerCase()) {
      score += 8;
    }

    // Description match bonus
    const descTokens = tokenize(entry.description);
    for (const token of tokens) {
      if (descTokens.includes(token)) {
        score += 3;
      }
    }

    // Finished-product priority: when the product name contains finished-product
    // words (e.g., "t-shirt", "shoes", "bag"), boost finished-good categories
    // and penalize raw-material categories to avoid misclassification
    // (e.g., "Cotton T-Shirt" → 6109 apparel, not 5205 cotton fabric)
    if (hasFinishedProductWord && score > 0) {
      if (FINISHED_CATEGORIES.includes(entry.category)) {
        score += 15;
      } else if (RAW_MATERIAL_CATEGORIES.includes(entry.category)) {
        score = Math.max(score - 10, 1);
      }
    }

    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // No matches
  if (scored.length === 0) {
    return {
      hsCode: '9999',
      description: 'Unclassified — no keyword match',
      confidence: 0,
      method: 'keyword',
      alternatives: [],
    };
  }

  let best = scored[0];

  // Heading subdivision: when top results share the same HS4 heading,
  // use material/gender/description attributes to pick the right subheading
  const heading4 = best.entry.code.slice(0, 4);
  const sameHeadingCandidates = scored
    .filter(s => s.entry.code.startsWith(heading4) && s.score >= best.score * 0.7)
    .map(s => ({ code: s.entry.code, description: s.entry.description, score: s.score }));

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

  // Confidence: normalize score (10 = exact single keyword match)
  // Max realistic score ~40-50 for very specific matches
  const confidence = Math.min((best.score / 30) + confidenceBoost, 1);

  // Alternatives: next best matches (different HS codes)
  const alternatives = scored
    .slice(0, 5)
    .filter((s) => s.entry.code !== best.entry.code && s.score > 3)
    .slice(0, 3)
    .map((s) => ({
      hsCode: s.entry.code,
      description: s.entry.description,
      confidence: Math.min(s.score / 30, 1),
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
