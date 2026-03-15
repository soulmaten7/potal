import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { buildExplanation } from '@/app/lib/classification/explainability';
import { normalizeProductName, detectLanguage } from '@/app/lib/classification/multi-language';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const productName = typeof body.product_name === 'string' ? body.product_name.trim() : '';
  if (!productName) return apiError(ApiErrorCode.BAD_REQUEST, 'product_name required.');

  const language = typeof body.language === 'string' ? body.language : undefined;
  const startTime = Date.now();

  const detectedLang = language || detectLanguage(productName);
  const normalized = await normalizeProductName(productName, language);

  // Simulate classification with explanation (would integrate with real pipeline)
  const explanation = buildExplanation({
    stage: 'cache',
    score: 0.92,
    hs6: '610910',
    description: 'T-shirts, singlets and other vests, of cotton, knitted or crocheted',
    alternatives: [
      { hs6: '611020', score: 0.75, reason: 'Jerseys, pullovers — if heavier weight' },
      { hs6: '620520', score: 0.60, reason: 'Woven shirts — if not knitted' },
    ],
    cacheHit: true,
    vectorScore: 0.88,
    keywordCount: 3,
    startTime,
  });

  return apiSuccess({
    product_name: productName,
    normalized_name: normalized,
    detected_language: detectedLang,
    hs6: '610910',
    confidence: 0.92,
    explanation,
  }, { sellerId: ctx.sellerId });
});
