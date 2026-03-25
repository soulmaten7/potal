/**
 * POTAL API v1 — /api/v1/classify/image
 *
 * Dedicated image-based HS classification endpoint.
 * Accepts multipart/form-data with image file or JSON with image_url/image_base64.
 * Uses Anthropic Claude Vision for product analysis.
 *
 * POST /api/v1/classify/image
 * Content-Type: multipart/form-data | application/json
 * Body: image (file) | { image_base64, image_url, product_hint? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, buildReasoningChain, buildMultiDimensionalConfidence, getChapterNote, lookupRulingReference } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 1024; // Resize to this if larger (token savings)

interface ImageAnalysis {
  product_type: string;
  material: string;
  color: string;
  size_category: string;
  intended_use: string;
  brand_if_visible: string | null;
  additional_details: string;
}

// ─── Image Type Detection (magic bytes) ────────────

function detectImageType(buf: Buffer): string {
  if (buf.length < 4) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  return 'image/jpeg'; // fallback
}

// ─── Claude Vision Analysis ────────────────────────

async function analyzeImageWithClaude(
  imageBase64: string,
  mediaType: string,
  productHint?: string,
): Promise<{ analysis: ImageAnalysis; productDescription: string } | { error: string; rawResponsePreview?: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: 'vision_not_configured' };
  }

  const prompt = `Analyze this product image. Extract the following attributes as JSON:
{
  "product_type": "specific product type (e.g., 'running shoes', 'cotton t-shirt', 'ceramic mug')",
  "material": "primary material (e.g., 'leather', 'cotton', 'stainless steel', 'plastic')",
  "color": "dominant color(s)",
  "size_category": "small/medium/large/varies",
  "intended_use": "primary use (e.g., 'athletic wear', 'home decoration', 'kitchen utensil')",
  "brand_if_visible": "brand name if visible, otherwise null",
  "additional_details": "any other relevant classification details (pattern, construction, features)"
}

${productHint ? `Product hint from user: "${productHint}"` : ''}

Return ONLY the JSON object, no other text.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { error: `vision_api_error_${response.status}`, rawResponsePreview: errText.substring(0, 200) };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[F002] Claude Vision JSON parse failed. Raw response:', text.substring(0, 500));
      return { error: 'vision_parse_failed', rawResponsePreview: text.substring(0, 200) };
    }

    const analysis: ImageAnalysis = JSON.parse(jsonMatch[0]);

    const parts = [analysis.product_type];
    if (analysis.material && analysis.material !== 'unknown') parts.push(`made of ${analysis.material}`);
    if (analysis.intended_use && analysis.intended_use !== 'general') parts.push(`for ${analysis.intended_use}`);
    const productDescription = parts.join(', ');

    return { analysis, productDescription };
  } catch (err) {
    console.error('[F002] Claude Vision error:', err instanceof Error ? err.message : err);
    return { error: 'vision_exception', rawResponsePreview: String(err).substring(0, 200) };
  }
}

// ─── POST Handler ──────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  // C1: Check API key upfront
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Image classification service not configured. Contact support.');
  }

  const contentType = req.headers.get('content-type') || '';

  let imageBase64: string;
  let mediaType: string;
  let productHint: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    productHint = formData.get('product_hint') as string | undefined || undefined;

    if (!imageFile) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'No image file provided. Send as multipart/form-data with field name "image".');
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Image exceeds 5MB limit (${(imageFile.size / (1024 * 1024)).toFixed(1)}MB).`);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported format: ${imageFile.type}. Allowed: JPEG, PNG, GIF, WebP.`);
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    imageBase64 = buffer.toString('base64');
    mediaType = detectImageType(buffer); // C4: magic bytes instead of trusting file.type

  } else if (contentType.includes('application/json')) {
    const body = await req.json();
    if (!body.image_base64 && !body.image_url) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "image_base64" or "image_url", or use multipart/form-data.');
    }

    if (body.image_url) {
      try {
        // C3: HEAD request first to check size without downloading
        const headRes = await fetch(body.image_url, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
        if (headRes) {
          const contentLength = parseInt(headRes.headers.get('content-length') || '0', 10);
          if (contentLength > MAX_IMAGE_SIZE) {
            return apiError(ApiErrorCode.BAD_REQUEST, `Image too large (${Math.round(contentLength / 1024 / 1024)}MB). Max 5MB.`);
          }
        }

        const imgRes = await fetch(body.image_url, { signal: AbortSignal.timeout(10000) });
        if (!imgRes.ok) {
          return apiError(ApiErrorCode.BAD_REQUEST, `Failed to fetch image (HTTP ${imgRes.status}).`);
        }
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.byteLength > MAX_IMAGE_SIZE) {
          return apiError(ApiErrorCode.BAD_REQUEST, 'Image exceeds 5MB limit.');
        }
        imageBase64 = buf.toString('base64');
        mediaType = detectImageType(buf); // C4: detect from bytes, not Content-Type header
      } catch {
        return apiError(ApiErrorCode.BAD_REQUEST, 'Failed to fetch image from URL (timeout or network error).');
      }
    } else {
      const raw = (body.image_base64 as string).replace(/^data:([^;]+);base64,/, '');
      const dataUriMatch = (body.image_base64 as string).match(/^data:([^;]+);base64,/);
      imageBase64 = raw;
      // Detect from decoded bytes if no data URI prefix
      if (dataUriMatch) {
        mediaType = dataUriMatch[1];
      } else {
        const decoded = Buffer.from(raw, 'base64');
        mediaType = detectImageType(decoded);
      }
    }
    productHint = body.product_hint;
  } else {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Send image as multipart/form-data or JSON with image_base64/image_url.');
  }

  // Step 1: Analyze with Claude Vision
  const visionResult = await analyzeImageWithClaude(imageBase64, mediaType, productHint);

  if (!visionResult) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Image analysis returned no result.');
  }

  // C2: Handle error responses from vision
  if ('error' in visionResult) {
    if (visionResult.error === 'vision_not_configured') {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Image classification service not configured.');
    }
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Image analysis failed: ${visionResult.error}. ${visionResult.rawResponsePreview ? 'Preview: ' + visionResult.rawResponsePreview.substring(0, 100) : ''}`);
  }

  // Step 2: Classify extracted product description
  const textResult = await classifyProductAsync(
    visionResult.productDescription,
    visionResult.analysis.product_type,
    context.sellerId,
  );

  // Step 3: Build explainability
  const reasoningChain = [
    {
      step: 'lookup' as const,
      detail: `Image analyzed: detected "${visionResult.analysis.product_type}" (${visionResult.analysis.material})`,
      confidence: 0.9,
    },
    ...buildReasoningChain({
      classificationSource: textResult.classificationSource,
      productName: visionResult.productDescription,
      hsCode: textResult.hsCode,
      description: textResult.description,
      confidence: textResult.confidence,
      category: visionResult.analysis.product_type,
    }),
  ];

  const confidenceScore = calculateConfidenceScore(textResult, visionResult.productDescription);
  const multiConfidence = buildMultiDimensionalConfidence({
    classificationSource: textResult.classificationSource,
    baseConfidence: textResult.confidence,
    productName: visionResult.productDescription,
    hsCode: textResult.hsCode,
    description: textResult.description,
    category: visionResult.analysis.product_type,
    alternatives: textResult.alternatives,
  });
  const chapterNote = getChapterNote(textResult.hsCode);
  const rulingRef = lookupRulingReference(textResult.hsCode, visionResult.productDescription);

  return apiSuccess({
    hs_code: textResult.hsCode,
    description: textResult.description,
    confidence: multiConfidence.overall,
    confidence_detail: multiConfidence,
    confidence_score: confidenceScore,
    method: 'vision',
    image_analysis: visionResult.analysis,
    detected_product: visionResult.productDescription,
    reasoning_chain: reasoningChain,
    chapter_note: chapterNote,
    ruling_reference: rulingRef,
    alternatives: textResult.alternatives,
    country_of_origin: textResult.countryOfOrigin,
  }, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});
