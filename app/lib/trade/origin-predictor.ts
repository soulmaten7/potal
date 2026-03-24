/**
 * F041: Origin Prediction
 * Brand→origin, category→production country mapping.
 */

import { BRAND_ORIGINS } from '@/app/lib/data/brand-origins';

export interface OriginPrediction {
  predictedOrigins: Array<{ country: string; probability: number; basis: 'brand' | 'category' | 'trade_pattern' | 'keyword' }>;
  confidence: number;
  needsVerification: boolean;
}

const CATEGORY_ORIGINS: Record<string, Array<{ country: string; share: number }>> = {
  textiles: [{ country: 'CN', share: 0.35 }, { country: 'BD', share: 0.15 }, { country: 'VN', share: 0.12 }, { country: 'IN', share: 0.10 }],
  electronics: [{ country: 'CN', share: 0.45 }, { country: 'TW', share: 0.12 }, { country: 'KR', share: 0.10 }, { country: 'JP', share: 0.08 }],
  footwear: [{ country: 'CN', share: 0.40 }, { country: 'VN', share: 0.20 }, { country: 'ID', share: 0.10 }, { country: 'IN', share: 0.08 }],
  furniture: [{ country: 'CN', share: 0.40 }, { country: 'VN', share: 0.12 }, { country: 'PL', share: 0.08 }, { country: 'IT', share: 0.07 }],
  automotive: [{ country: 'JP', share: 0.20 }, { country: 'DE', share: 0.18 }, { country: 'KR', share: 0.10 }, { country: 'CN', share: 0.10 }],
  toys: [{ country: 'CN', share: 0.70 }, { country: 'VN', share: 0.08 }, { country: 'IN', share: 0.05 }],
  food: [{ country: 'US', share: 0.15 }, { country: 'BR', share: 0.10 }, { country: 'CN', share: 0.08 }, { country: 'IN', share: 0.07 }],
};

const KEYWORD_TO_CATEGORY: Record<string, string> = {
  shirt: 'textiles', dress: 'textiles', cotton: 'textiles', silk: 'textiles', fabric: 'textiles',
  phone: 'electronics', laptop: 'electronics', computer: 'electronics', chip: 'electronics', cable: 'electronics',
  shoe: 'footwear', boot: 'footwear', sneaker: 'footwear', sandal: 'footwear',
  chair: 'furniture', table: 'furniture', sofa: 'furniture', desk: 'furniture',
  car: 'automotive', engine: 'automotive', tire: 'automotive',
  toy: 'toys', doll: 'toys', game: 'toys',
};

export function predictOrigin(productName: string, brand?: string, category?: string): OriginPrediction {
  try {
  const nameLower = (productName || '').toLowerCase();
  const results: Array<{ country: string; probability: number; basis: OriginPrediction['predictedOrigins'][0]['basis'] }> = [];

  // Brand check
  if (brand) {
    const brandKey = brand.toLowerCase().replace(/[\s-]/g, '_');
    if (BRAND_ORIGINS[brandKey]) {
      results.push({ country: BRAND_ORIGINS[brandKey], probability: 0.85, basis: 'brand' });
    }
  }

  // Check brand in product name
  for (const [b, origin] of Object.entries(BRAND_ORIGINS) as [string, string][]) {
    if (nameLower.includes(b)) {
      results.push({ country: origin, probability: 0.80, basis: 'brand' });
      break;
    }
  }

  // Category detection
  let detectedCategory = category;
  if (!detectedCategory) {
    for (const [kw, cat] of Object.entries(KEYWORD_TO_CATEGORY)) {
      if (nameLower.includes(kw)) { detectedCategory = cat; break; }
    }
  }

  if (detectedCategory && CATEGORY_ORIGINS[detectedCategory]) {
    for (const entry of CATEGORY_ORIGINS[detectedCategory]) {
      if (!results.some(r => r.country === entry.country)) {
        results.push({ country: entry.country, probability: entry.share, basis: 'category' });
      }
    }
  }

  // Default: China for unknown
  if (results.length === 0) {
    results.push({ country: 'CN', probability: 0.30, basis: 'trade_pattern' });
  }

  results.sort((a, b) => b.probability - a.probability);
  const top = results.slice(0, 5);
  const confidence = top[0].probability;

  return {
    predictedOrigins: top,
    confidence: Math.round(confidence * 100) / 100,
    needsVerification: confidence < 0.7,
  };
  } catch {
    return { predictedOrigins: [], confidence: 0, needsVerification: true };
  }
}
