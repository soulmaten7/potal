/**
 * POTAL API v1 — /api/v1/origin
 *
 * Origin Country AI Prediction endpoint.
 * Predicts the most likely country of origin based on product details.
 *
 * POST /api/v1/origin
 * Body: {
 *   productName: string,         // required
 *   hsCode?: string,             // optional — improves prediction accuracy
 *   brand?: string,              // optional — brand name
 *   manufacturer?: string,       // optional — manufacturer name
 *   price?: number,              // optional — unit price
 *   category?: string            // optional — product category
 * }
 *
 * Returns: { predictedOrigin, confidence, reasoning, alternatives[] }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { BRAND_ORIGINS } from '@/app/lib/data/brand-origins';

// Known manufacturing hubs by product category keyword
const MANUFACTURING_HUBS: Record<string, { country: string; code: string; confidence: number }[]> = {
  'electronics': [
    { country: 'China', code: 'CN', confidence: 0.7 },
    { country: 'South Korea', code: 'KR', confidence: 0.1 },
    { country: 'Taiwan', code: 'TW', confidence: 0.08 },
    { country: 'Vietnam', code: 'VN', confidence: 0.05 },
  ],
  'semiconductor': [
    { country: 'Taiwan', code: 'TW', confidence: 0.35 },
    { country: 'South Korea', code: 'KR', confidence: 0.25 },
    { country: 'China', code: 'CN', confidence: 0.15 },
    { country: 'Japan', code: 'JP', confidence: 0.1 },
  ],
  'textile': [
    { country: 'China', code: 'CN', confidence: 0.4 },
    { country: 'Bangladesh', code: 'BD', confidence: 0.15 },
    { country: 'Vietnam', code: 'VN', confidence: 0.12 },
    { country: 'India', code: 'IN', confidence: 0.1 },
  ],
  'clothing': [
    { country: 'China', code: 'CN', confidence: 0.35 },
    { country: 'Bangladesh', code: 'BD', confidence: 0.2 },
    { country: 'Vietnam', code: 'VN', confidence: 0.15 },
    { country: 'Cambodia', code: 'KH', confidence: 0.08 },
  ],
  'automotive': [
    { country: 'Japan', code: 'JP', confidence: 0.25 },
    { country: 'Germany', code: 'DE', confidence: 0.2 },
    { country: 'China', code: 'CN', confidence: 0.15 },
    { country: 'South Korea', code: 'KR', confidence: 0.15 },
  ],
  'pharmaceutical': [
    { country: 'India', code: 'IN', confidence: 0.3 },
    { country: 'China', code: 'CN', confidence: 0.2 },
    { country: 'United States', code: 'US', confidence: 0.15 },
    { country: 'Germany', code: 'DE', confidence: 0.1 },
  ],
  'machinery': [
    { country: 'China', code: 'CN', confidence: 0.35 },
    { country: 'Germany', code: 'DE', confidence: 0.2 },
    { country: 'Japan', code: 'JP', confidence: 0.15 },
    { country: 'Italy', code: 'IT', confidence: 0.1 },
  ],
  'food': [
    { country: 'China', code: 'CN', confidence: 0.15 },
    { country: 'United States', code: 'US', confidence: 0.12 },
    { country: 'Brazil', code: 'BR', confidence: 0.1 },
    { country: 'India', code: 'IN', confidence: 0.08 },
  ],
  'toy': [
    { country: 'China', code: 'CN', confidence: 0.8 },
    { country: 'Vietnam', code: 'VN', confidence: 0.08 },
  ],
  'furniture': [
    { country: 'China', code: 'CN', confidence: 0.45 },
    { country: 'Vietnam', code: 'VN', confidence: 0.15 },
    { country: 'Poland', code: 'PL', confidence: 0.08 },
    { country: 'Italy', code: 'IT', confidence: 0.08 },
  ],
  'cosmetics': [
    { country: 'South Korea', code: 'KR', confidence: 0.25 },
    { country: 'France', code: 'FR', confidence: 0.2 },
    { country: 'China', code: 'CN', confidence: 0.15 },
    { country: 'Japan', code: 'JP', confidence: 0.15 },
  ],
};

// BRAND_ORIGINS imported from @/app/lib/data/brand-origins

// HS Chapter → likely origin
const HS_CHAPTER_ORIGINS: Record<string, { code: string; confidence: number }[]> = {
  '01': [{ code: 'BR', confidence: 0.2 }, { code: 'US', confidence: 0.15 }], // Live animals
  '09': [{ code: 'BR', confidence: 0.25 }, { code: 'VN', confidence: 0.2 }], // Coffee, tea
  '27': [{ code: 'SA', confidence: 0.2 }, { code: 'RU', confidence: 0.15 }], // Mineral fuels
  '61': [{ code: 'CN', confidence: 0.35 }, { code: 'BD', confidence: 0.2 }], // Knitted apparel
  '62': [{ code: 'CN', confidence: 0.35 }, { code: 'BD', confidence: 0.2 }], // Woven apparel
  '64': [{ code: 'CN', confidence: 0.5 }, { code: 'VN', confidence: 0.2 }], // Footwear
  '71': [{ code: 'IN', confidence: 0.2 }, { code: 'ZA', confidence: 0.15 }], // Gems
  '84': [{ code: 'CN', confidence: 0.35 }, { code: 'DE', confidence: 0.15 }], // Machinery
  '85': [{ code: 'CN', confidence: 0.4 }, { code: 'KR', confidence: 0.15 }], // Electronics
  '87': [{ code: 'JP', confidence: 0.2 }, { code: 'DE', confidence: 0.18 }], // Vehicles
  '94': [{ code: 'CN', confidence: 0.4 }, { code: 'VN', confidence: 0.15 }], // Furniture
  '95': [{ code: 'CN', confidence: 0.75 }], // Toys
};

interface OriginPrediction {
  countryCode: string;
  countryName: string;
  confidence: number;
  reasoning: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  CN: 'China', KR: 'South Korea', JP: 'Japan', TW: 'Taiwan', VN: 'Vietnam',
  BD: 'Bangladesh', IN: 'India', DE: 'Germany', US: 'United States', IT: 'Italy',
  FR: 'France', ES: 'Spain', BR: 'Brazil', MX: 'Mexico', TH: 'Thailand',
  ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines', PL: 'Poland', TR: 'Turkey',
  SA: 'Saudi Arabia', RU: 'Russia', ZA: 'South Africa', KH: 'Cambodia', GB: 'United Kingdom',
  CA: 'Canada', AU: 'Australia', NL: 'Netherlands', BE: 'Belgium', SE: 'Sweden',
};

function predictOrigin(
  productName: string,
  hsCode?: string,
  brand?: string,
  aiOrigin?: string,
): OriginPrediction[] {
  const predictions: Map<string, { confidence: number; reasons: string[] }> = new Map();

  const addPrediction = (code: string, conf: number, reason: string) => {
    const existing = predictions.get(code);
    if (existing) {
      existing.confidence = Math.min(0.99, existing.confidence + conf * 0.5);
      existing.reasons.push(reason);
    } else {
      predictions.set(code, { confidence: conf, reasons: [reason] });
    }
  };

  // 1. AI classifier origin (highest weight)
  if (aiOrigin && /^[A-Z]{2}$/.test(aiOrigin)) {
    addPrediction(aiOrigin, 0.7, 'AI classification detected origin');
  }

  // 2. Brand-based prediction
  if (brand) {
    const brandLower = brand.toLowerCase().trim();
    const brandOrigin = BRAND_ORIGINS[brandLower];
    if (brandOrigin) {
      addPrediction(brandOrigin, 0.6, `Brand "${brand}" manufacturing origin`);
    }
  }

  // 3. HS chapter-based prediction
  if (hsCode) {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    const chapterOrigins = HS_CHAPTER_ORIGINS[chapter];
    if (chapterOrigins) {
      for (const o of chapterOrigins) {
        addPrediction(o.code, o.confidence, `HS chapter ${chapter} common origin`);
      }
    }
  }

  // 4. Product keyword-based prediction
  const nameLower = productName.toLowerCase();
  for (const [keyword, hubs] of Object.entries(MANUFACTURING_HUBS)) {
    if (nameLower.includes(keyword)) {
      for (const hub of hubs) {
        addPrediction(hub.code, hub.confidence, `Product category "${keyword}" manufacturing hub`);
      }
    }
  }

  // Convert to sorted array
  const results: OriginPrediction[] = Array.from(predictions.entries())
    .map(([code, data]) => ({
      countryCode: code,
      countryName: COUNTRY_NAMES[code] || code,
      confidence: Math.round(data.confidence * 100) / 100,
      reasoning: data.reasons.join('; '),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  // Fallback if no predictions
  if (results.length === 0) {
    results.push({
      countryCode: 'CN',
      countryName: 'China',
      confidence: 0.3,
      reasoning: 'Default prediction — China is the largest global manufacturing hub',
    });
  }

  return results;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const brand = typeof body.brand === 'string' ? body.brand.trim() : undefined;
  const category = typeof body.category === 'string' ? body.category.trim() : undefined;
  const price = typeof body.price === 'number' ? body.price : undefined;

  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  }

  if (price !== undefined && price < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"price" must be >= 0.');
  }

  if (hsCode && !/^\d{4,10}$/.test(hsCode.replace(/\./g, ''))) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"hsCode" must be 4-10 digits.');
  }

  // Run AI classification to get origin prediction
  let aiOrigin: string | undefined;
  let classifiedHsCode = hsCode;

  try {
    const classification = await classifyProductAsync(productName, category, context.sellerId);
    aiOrigin = classification.countryOfOrigin;
    if (!classifiedHsCode && classification.hsCode && classification.hsCode !== '9999') {
      classifiedHsCode = classification.hsCode;
    }
  } catch { /* classification failed, continue with other signals */ }

  const predictions = predictOrigin(productName, classifiedHsCode, brand, aiOrigin);

  return apiSuccess(
    {
      productName,
      hsCode: classifiedHsCode || null,
      predictedOrigin: predictions[0] ? {
        countryCode: predictions[0].countryCode,
        countryName: predictions[0].countryName,
        confidence: predictions[0].confidence,
        reasoning: predictions[0].reasoning,
      } : null,
      alternatives: predictions.slice(1),
      method: aiOrigin ? 'ai+heuristic' : 'heuristic',
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { productName, hsCode?, brand?, category? }'
  );
}
