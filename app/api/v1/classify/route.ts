/**
 * POTAL API v1 — /api/v1/classify
 *
 * HS Code classification endpoint.
 * Supports text-based AND image-based classification.
 *
 * POST /api/v1/classify
 * Body (text): { productName: string, category?: string }
 * Body (image): { imageUrl?: string, imageBase64?: string, productHint?: string }
 *
 * Returns: { hsCode, description, confidence, countryOfOrigin, alternatives[], detectedProductName? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, recordClassificationAudit, validateProductDescription, buildReasoningChain, buildMultiDimensionalConfidence, getChapterNote, lookupRulingReference } from '@/app/lib/cost-engine/ai-classifier';
import { classifyWithVision } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess as _apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// CW37-S6: LLM-friendly wrapper for classify responses
function apiSuccess(data: Record<string, unknown>, meta?: Record<string, unknown>) {
  return _apiSuccess({
    ...data,
    _metadata: {
      disclaimer: 'For informational use only. HS code classification is an estimate. Official classification requires a binding ruling from customs authorities.',
      apiVersion: 'v1',
      responseGeneratedAt: new Date().toISOString(),
      confidenceScore: data.confidence ?? data.confidenceScore ?? null,
      classificationMethod: data.method ?? data.classificationMethod ?? null,
      availableEnums: {
        classificationMethod: ['override', 'cache', 'vector', 'keyword', 'ai', 'v3-pipeline', 'keyword_fallback'],
      },
    },
  }, meta);
}
import { resolveHs10 } from '@/app/lib/cost-engine/hs-code/hs10-resolver';
import { classifyWithGRI } from '@/app/lib/cost-engine/gri-classifier';
import { classifyV3 } from '@/app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '@/app/lib/cost-engine/gri-classifier/types';
import { validateFields } from '@/app/lib/cost-engine/gri-classifier/field-validator';

// ─── Input Validation Constants ────────────────────
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_TEXT_LENGTH = 500; // productName / category / productHint max chars
const ALLOWED_IMAGE_URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

/**
 * Extract og:image, title, description from a product URL
 */
async function extractProductUrlMeta(url: string): Promise<{ ogImage?: string; title?: string; description?: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'POTAL-Bot/1.0 (+https://potal.app)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Limit parsing to first 50KB for performance
    const head = html.slice(0, 50000);

    const ogImageMatch = head.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const titleMatch = head.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
      || head.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = head.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || head.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);

    return {
      ogImage: ogImageMatch?.[1] || undefined,
      title: titleMatch?.[1]?.trim() || undefined,
      description: descMatch?.[1]?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Sanitize text input: strip control chars, limit length, remove prompt injection patterns
 */
function sanitizeText(input: string, maxLen: number = MAX_TEXT_LENGTH): string {
  // Remove control characters (except newline/tab)
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Remove common prompt injection delimiters
  clean = clean.replace(/[<>{}|\\]/g, '');
  // Trim and limit length
  return clean.trim().slice(0, maxLen);
}

/**
 * Validate base64 image: check size and detect MIME type from magic bytes
 */
function validateBase64Image(base64: string): { valid: boolean; error?: string } {
  // Strip data URI prefix if present (e.g. "data:image/png;base64,...")
  const rawBase64 = base64.replace(/^data:([^;]+);base64,/, '');

  // Check approximate decoded size (base64 is ~4/3 of original)
  const estimatedBytes = (rawBase64.length * 3) / 4;
  if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: `Image exceeds ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB limit (estimated ${(estimatedBytes / (1024 * 1024)).toFixed(1)}MB).` };
  }

  // Detect MIME from data URI prefix if present
  const dataUriMatch = base64.match(/^data:([^;]+);base64,/);
  if (dataUriMatch) {
    const mime = dataUriMatch[1].toLowerCase();
    if (!ALLOWED_IMAGE_FORMATS.includes(mime)) {
      return { valid: false, error: `Unsupported image format: ${mime}. Allowed: JPEG, PNG, GIF, WebP.` };
    }
  }

  return { valid: true };
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  // Check Content-Length to reject oversized payloads early
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_IMAGE_SIZE_BYTES + 1024) { // +1KB for JSON overhead
    return apiError(ApiErrorCode.BAD_REQUEST, `Request body too large. Max ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  let productName = typeof body.productName === 'string' ? sanitizeText(body.productName) : '';
  const category = typeof body.category === 'string' ? sanitizeText(body.category, 200) : undefined;
  let imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined;
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined;
  const productHint = typeof body.productHint === 'string' ? sanitizeText(body.productHint, 200) : undefined;
  const productUrl = typeof body.product_url === 'string' ? body.product_url.trim() : undefined;

  // product_url: extract og:image + title/description for enriched classification
  let urlMeta: { ogImage?: string; title?: string; description?: string } | null = null;
  if (productUrl) {
    urlMeta = await extractProductUrlMeta(productUrl);
    if (urlMeta) {
      // Use og:image for vision classification if no image provided
      if (!imageUrl && !imageBase64 && urlMeta.ogImage) {
        imageUrl = urlMeta.ogImage;
      }
      // Enrich productName with page title/description
      if (!productName && urlMeta.title) {
        productName = sanitizeText(urlMeta.title);
      }
    }
  }

  // Image-based classification
  if (imageUrl || imageBase64) {
    // Validate imageUrl format
    if (imageUrl && !ALLOWED_IMAGE_URL_PATTERN.test(imageUrl)) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid imageUrl. Must be an HTTP(S) URL ending in .jpg, .jpeg, .png, .gif, or .webp.');
    }

    // Validate base64 image size and format
    if (imageBase64) {
      const validation = validateBase64Image(imageBase64);
      if (!validation.valid) {
        return apiError(ApiErrorCode.BAD_REQUEST, validation.error!);
      }
    }

    const imageData = imageUrl || imageBase64!;
    let visionResult;
    try {
      visionResult = await classifyWithVision(imageData, productHint || productName || undefined);
    } catch (err) {
      console.error('[classify] Vision classification error:', err instanceof Error ? err.message : err);
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Image classification service unavailable. Please try again.');
    }

    if (!visionResult) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Image classification failed. Ensure image is clear and try again.');
    }

    const visionConfidence = calculateConfidenceScore(
      { ...visionResult.result, classificationSource: 'ai' },
      productHint || productName || undefined,
    );

    const visionDetected = visionResult.result.detectedProductName || productHint || productName || '';
    const visionReasoningChain = [
      {
        step: 'lookup' as const,
        detail: `Image analyzed: detected "${visionDetected.substring(0, 50)}"`,
        confidence: 0.9,
      },
      ...buildReasoningChain({
        classificationSource: 'ai',
        productName: visionDetected,
        hsCode: visionResult.result.hsCode,
        description: visionResult.result.description,
        confidence: visionResult.result.confidence,
        category: category,
      }),
    ];
    const visionMultiConfidence = buildMultiDimensionalConfidence({
      classificationSource: 'ai',
      baseConfidence: visionResult.result.confidence,
      productName: visionDetected,
      hsCode: visionResult.result.hsCode,
      description: visionResult.result.description,
      category: category,
      alternatives: visionResult.result.alternatives,
    });
    const visionChapterNote = getChapterNote(visionResult.result.hsCode);
    const visionRulingRef = lookupRulingReference(visionResult.result.hsCode, visionDetected);

    return apiSuccess({
      hsCode: visionResult.result.hsCode,
      description: visionResult.result.description,
      confidence: visionMultiConfidence.overall,
      confidence_detail: visionMultiConfidence,
      confidenceScore: visionConfidence,
      method: 'vision',
      countryOfOrigin: visionResult.result.countryOfOrigin,
      detectedProductName: visionResult.result.detectedProductName,
      alternatives: visionResult.result.alternatives,
      reasoning_chain: visionReasoningChain,
      chapter_note: visionChapterNote,
      ruling_reference: visionRulingRef,
      meta: {
        provider: visionResult.meta.provider,
        tokensUsed: visionResult.meta.tokensUsed,
        estimatedCostUsd: visionResult.meta.estimatedCostUsd,
      },
      ...(productUrl ? { product_url: productUrl, url_meta: urlMeta } : {}),
    }, {
      sellerId: context.sellerId,
      plan: context.planId,
    });
  }

  const classifyStartMs = Date.now();

  // GRI Engine (v3) — default ON. Set CLASSIFICATION_ENGINE=v2 to use legacy pipeline.
  const useGriEngine = process.env.CLASSIFICATION_ENGINE !== 'v2';
  if (useGriEngine && productName) {
    // ── Layer 2: 9-Field Validation ──
    const validationInput = {
      product_name: productName,
      material: typeof body.material === 'string' ? body.material : undefined,
      origin_country: typeof body.origin_country === 'string' ? body.origin_country :
                      typeof body.originCountry === 'string' ? body.originCountry : undefined,
      category: category,
      description: typeof body.description === 'string' ? body.description : undefined,
      processing: typeof body.processing === 'string' ? body.processing : undefined,
      composition: typeof body.composition === 'string' ? body.composition : undefined,
      weight_spec: typeof body.weight_spec === 'string' ? body.weight_spec :
                   typeof body.weightSpec === 'string' ? body.weightSpec : undefined,
      price: body.price ? Number(body.price) : undefined,
    };

    const validation = validateFields(validationInput);

    // CW34: In demo/playground mode, skip strict field validation so users
    // can classify with just a productName. Full validation still runs for
    // authenticated API calls to maintain data quality.
    const isDemoMode = req.headers.get('X-Demo-Request') === 'true';
    if (!isDemoMode && validation.overall_status === 'has_errors') {
      return apiError(
        ApiErrorCode.BAD_REQUEST,
        `Field validation failed. ${validation.error_field_count} field(s) have errors.`,
        { validation, docs_url: 'https://potal.app/docs/api/fields' }
      );
    }

    // has_warnings or valid → v3.3 code-based pipeline
    try {
      const v3Input: ClassifyInputV3 = {
        product_name: productName,
        material: typeof body.material === 'string' ? body.material : (category || ''),
        origin_country: (typeof body.origin_country === 'string' ? body.origin_country :
                        typeof body.originCountry === 'string' ? body.originCountry : 'XX').toUpperCase(),
        destination_country: (body.destination_country || body.destinationCountry)
          ? String(body.destination_country || body.destinationCountry).toUpperCase() : 'US',
        category: category,
        description: typeof body.description === 'string' ? body.description : undefined,
        processing: typeof body.processing === 'string' ? body.processing : undefined,
        composition: typeof body.composition === 'string' ? body.composition : undefined,
        weight_spec: typeof body.weight_spec === 'string' ? body.weight_spec :
                     typeof body.weightSpec === 'string' ? body.weightSpec : undefined,
        price: body.price ? Number(body.price) : undefined,
      };

      const v3Result = await classifyV3(v3Input);

      return apiSuccess({
        hsCode: v3Result.final_hs_code || v3Result.confirmed_hs6 || 'UNKNOWN',
        description: v3Result.country_specific?.national_code
          ? `${v3Result.confirmed_hs6} → ${v3Result.country_specific.national_code}`
          : (v3Result.confirmed_hs6 || 'Classification completed'),
        confidence: v3Result.confidence,
        hsCodePrecision: v3Result.hs_code_precision || 'HS6',
        alternatives: [],
        decisionPath: v3Result.decision_path.map((s, i) => ({
          step: i + 1,
          name: s.step,
          input: s.input_summary,
          output: s.output_summary,
          method: 'code' as const,
          timeMs: s.time_ms,
        })),
        griRulesApplied: v3Result.decision_path.flatMap(s =>
          s.rules_applied.map(r => ({ rule: r, reason: s.step }))
        ),
        aiCallCount: v3Result.ai_call_count || 0,
        classificationMethod: 'v3.3-code-based',
        processingTimeMs: v3Result.processing_time_ms,
        countrySpecific: v3Result.country_specific || undefined,
        ...(validation.overall_status === 'has_warnings' ? { validation } : {}),
      }, {
        sellerId: context.sellerId,
        plan: context.planId,
      });
    } catch {
      // v3 pipeline failed — fall through to legacy engine
    }
  }

  // Text-based classification
  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "productName" for text classification or "imageUrl"/"imageBase64" for image classification.');
  }

  let result;
  try {
    result = await classifyProductAsync(productName, category, context.sellerId);
  } catch (err) {
    void err;
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Classification service unavailable. Please try again.');
  }

  const textConfidence = calculateConfidenceScore(result, productName);
  const processingTimeMs = Date.now() - classifyStartMs;

  // Record audit trail (non-blocking)
  void recordClassificationAudit({
    sellerId: context.sellerId,
    productName,
    productCategory: category,
    result,
    classificationSource: result.classificationSource,
    confidenceScore: textConfidence,
    processingTimeMs,
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
  });

  const descriptionCheck = validateProductDescription(productName, category);

  // HS10 resolution if destination_country provided
  const destCountry = body.destination_country || body.destinationCountry;
  let hs10Info: Record<string, unknown> | undefined;
  if (destCountry && result.hsCode && result.hsCode !== '9999') {
    try {
      const hs10 = await resolveHs10(
        result.hsCode.substring(0, 6),
        String(destCountry),
        productName,
        body.price ? Number(body.price) : undefined,
      );
      hs10Info = {
        hsCode10: hs10.hsCode,
        hsCodePrecision: hs10.hsCodePrecision,
        classificationMethod: hs10.classificationMethod,
        hs10Description: hs10.description,
        hs10Confidence: hs10.confidence,
      };
    } catch { /* non-critical */ }
  }

  // Build explainability
  const reasoningChain = buildReasoningChain({
    classificationSource: result.classificationSource,
    productName,
    hsCode: result.hsCode,
    description: result.description,
    confidence: result.confidence,
    category,
    alternatives: result.alternatives,
  });
  const multiConfidence = buildMultiDimensionalConfidence({
    classificationSource: result.classificationSource,
    baseConfidence: result.confidence,
    productName,
    hsCode: result.hsCode,
    description: result.description,
    category,
    alternatives: result.alternatives,
  });
  const chapterNote = getChapterNote(result.hsCode);
  const rulingRef = lookupRulingReference(result.hsCode, productName);

  return apiSuccess({
    hsCode: result.hsCode,
    description: result.description,
    confidence: multiConfidence.overall,
    confidence_detail: multiConfidence,
    confidenceScore: textConfidence,
    method: result.classificationSource,
    countryOfOrigin: result.countryOfOrigin,
    origin_detail: result.countryOfOrigin ? {
      detected_origin: result.countryOfOrigin,
      origin_type: 'non_preferential' as const,
      origin_note: `Origin ${result.countryOfOrigin} detected from product description/brand analysis. Use /api/v1/origin/determine for preferential origin verification.`,
    } : null,
    alternatives: result.alternatives,
    reasoning_chain: reasoningChain,
    chapter_note: chapterNote,
    ruling_reference: rulingRef,
    descriptionQuality: descriptionCheck,
    ...hs10Info,
    ...(productUrl ? { product_url: productUrl, url_meta: urlMeta } : {}),
  }, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Text: {"productName":"..."} or Image: {"imageUrl":"..."} or {"imageBase64":"..."}. See docs: /api/v1/docs'
  );
}
