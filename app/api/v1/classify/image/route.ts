/**
 * POTAL API v1 — /api/v1/classify/image
 *
 * Dedicated image-based HS classification endpoint.
 * Accepts multipart/form-data with image file.
 * Uses Anthropic Claude Vision for product analysis.
 *
 * POST /api/v1/classify/image
 * Content-Type: multipart/form-data
 * Body: image (file), product_hint? (string)
 *
 * Returns: { hs_code, confidence, image_analysis, reasoning_chain }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, buildReasoningChain, buildMultiDimensionalConfidence, getChapterNote, lookupRulingReference } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImageAnalysis {
  product_type: string;
  material: string;
  color: string;
  size_category: string;
  intended_use: string;
  brand_if_visible: string | null;
  additional_details: string;
}

async function analyzeImageWithClaude(imageBase64: string, mediaType: string, productHint?: string): Promise<{ analysis: ImageAnalysis; productDescription: string } | null> {
  if (!ANTHROPIC_API_KEY) return null;

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
        'x-api-key': ANTHROPIC_API_KEY,
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
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analysis: ImageAnalysis = JSON.parse(jsonMatch[0]);

    // Build a natural product description from the analysis
    const parts = [analysis.product_type];
    if (analysis.material && analysis.material !== 'unknown') parts.push(`made of ${analysis.material}`);
    if (analysis.intended_use && analysis.intended_use !== 'general') parts.push(`for ${analysis.intended_use}`);
    const productDescription = parts.join(', ');

    return { analysis, productDescription };
  } catch {
    return null;
  }
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const contentType = req.headers.get('content-type') || '';

  let imageBase64: string;
  let mediaType: string;
  let productHint: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    // Handle multipart form data
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
      return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported image format: ${imageFile.type}. Allowed: JPEG, PNG, GIF, WebP.`);
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    mediaType = imageFile.type;
  } else if (contentType.includes('application/json')) {
    // Handle JSON with base64 image
    const body = await req.json();
    if (!body.image_base64 && !body.image_url) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "image_base64" or use multipart/form-data with "image" field.');
    }

    if (body.image_url) {
      // Fetch image from URL
      try {
        const imgRes = await fetch(body.image_url, { signal: AbortSignal.timeout(10000) });
        if (!imgRes.ok) {
          return apiError(ApiErrorCode.BAD_REQUEST, 'Failed to fetch image from URL.');
        }
        const buf = await imgRes.arrayBuffer();
        if (buf.byteLength > MAX_IMAGE_SIZE) {
          return apiError(ApiErrorCode.BAD_REQUEST, 'Image exceeds 5MB limit.');
        }
        imageBase64 = Buffer.from(buf).toString('base64');
        mediaType = imgRes.headers.get('content-type') || 'image/jpeg';
      } catch {
        return apiError(ApiErrorCode.BAD_REQUEST, 'Failed to fetch image from URL (timeout or network error).');
      }
    } else {
      // Strip data URI prefix if present
      const raw = (body.image_base64 as string).replace(/^data:([^;]+);base64,/, '');
      const dataUriMatch = (body.image_base64 as string).match(/^data:([^;]+);base64,/);
      imageBase64 = raw;
      mediaType = dataUriMatch?.[1] || 'image/jpeg';
    }
    productHint = body.product_hint;
  } else {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Send image as multipart/form-data or JSON with image_base64.');
  }

  // Step 1: Analyze image with Claude Vision
  const visionResult = await analyzeImageWithClaude(imageBase64, mediaType, productHint);

  if (!visionResult) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Image analysis failed. Ensure ANTHROPIC_API_KEY is configured and image is clear.');
  }

  // Step 2: Classify extracted product description using text classifier
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
