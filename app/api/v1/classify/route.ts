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
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';
import { classifyWithVision } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Input Validation Constants ────────────────────
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_TEXT_LENGTH = 500; // productName / category / productHint max chars
const ALLOWED_IMAGE_URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

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

  const productName = typeof body.productName === 'string' ? sanitizeText(body.productName) : '';
  const category = typeof body.category === 'string' ? sanitizeText(body.category, 200) : undefined;
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined;
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined;
  const productHint = typeof body.productHint === 'string' ? sanitizeText(body.productHint, 200) : undefined;

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
    const visionResult = await classifyWithVision(imageData, productHint || productName || undefined);

    if (!visionResult) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Image classification failed. Ensure image is clear and try again.');
    }

    return apiSuccess({
      hsCode: visionResult.result.hsCode,
      description: visionResult.result.description,
      confidence: visionResult.result.confidence,
      method: 'vision',
      countryOfOrigin: visionResult.result.countryOfOrigin,
      detectedProductName: visionResult.result.detectedProductName,
      alternatives: visionResult.result.alternatives,
      meta: {
        provider: visionResult.meta.provider,
        tokensUsed: visionResult.meta.tokensUsed,
        estimatedCostUsd: visionResult.meta.estimatedCostUsd,
      },
    }, {
      sellerId: context.sellerId,
      plan: context.planId,
    });
  }

  // Text-based classification
  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "productName" for text classification or "imageUrl"/"imageBase64" for image classification.');
  }

  const result = await classifyProductAsync(productName, category, context.sellerId);

  return apiSuccess({
    hsCode: result.hsCode,
    description: result.description,
    confidence: result.confidence,
    method: result.classificationSource,
    countryOfOrigin: result.countryOfOrigin,
    alternatives: result.alternatives,
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
