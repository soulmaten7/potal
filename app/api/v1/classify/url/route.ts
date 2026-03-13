/**
 * POTAL API v1 — /api/v1/classify/url
 *
 * URL-based product classification.
 * Scrapes product page, extracts name/description/images, then classifies.
 *
 * POST /api/v1/classify/url
 * Body: {
 *   url: string,              // required — product page URL
 *   category?: string         // optional category hint
 * }
 *
 * Returns: { hsCode, description, confidence, confidenceScore, method, productInfo }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, recordClassificationAudit } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_FETCH_SIZE = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 10000;

// ─── URL Validation ─────────────────────────────────

function isValidProductUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// ─── HTML Product Data Extraction ────────────────────

interface ExtractedProduct {
  name?: string;
  description?: string;
  price?: string;
  currency?: string;
  imageUrl?: string;
  brand?: string;
  category?: string;
}

function extractProductData(html: string, url: string): ExtractedProduct {
  const result: ExtractedProduct = {};

  // 1. Try JSON-LD structured data (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const product = jsonLd['@type'] === 'Product' ? jsonLd
        : Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'].find((n: Record<string, unknown>) => n['@type'] === 'Product')
          : null;

      if (product) {
        result.name = product.name;
        result.description = typeof product.description === 'string'
          ? product.description.slice(0, 500) : undefined;
        result.brand = product.brand?.name || product.brand;
        result.category = product.category;
        if (product.image) {
          result.imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
        }
        if (product.offers) {
          const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
          result.price = offer?.price;
          result.currency = offer?.priceCurrency;
        }
      }
    } catch { /* JSON-LD parse failed */ }
  }

  // 2. Try Open Graph meta tags
  if (!result.name) {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitle) result.name = ogTitle[1];
  }
  if (!result.description) {
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDesc) result.description = ogDesc[1].slice(0, 500);
  }
  if (!result.imageUrl) {
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImage) result.imageUrl = ogImage[1];
  }

  // 3. Fallback to title tag
  if (!result.name) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      // Clean up common suffixes like " - Store Name" or " | Brand"
      result.name = titleMatch[1].split(/\s*[-|–—]\s*/)[0].trim();
    }
  }

  // 4. Try meta description
  if (!result.description) {
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) result.description = metaDesc[1].slice(0, 500);
  }

  // 5. Try product-specific meta (Shopify, WooCommerce patterns)
  if (!result.price) {
    const priceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i);
    if (priceMatch) result.price = priceMatch[1];
  }
  if (!result.currency) {
    const currMatch = html.match(/<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i);
    if (currMatch) result.currency = currMatch[1];
  }

  return result;
}

// ─── POST Handler ───────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const categoryHint = typeof body.category === 'string' ? body.category.trim().slice(0, 200) : undefined;

  if (!url) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "url" is required.');
  }

  if (!isValidProductUrl(url)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid URL. Must be http:// or https://');
  }

  // Fetch product page
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'POTAL-ProductClassifier/1.0 (https://potal.app)',
        'Accept': 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Failed to fetch URL: HTTP ${response.status}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_FETCH_SIZE) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Page too large to process.');
    }

    html = await response.text();
    if (html.length > MAX_FETCH_SIZE) {
      html = html.slice(0, MAX_FETCH_SIZE);
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return apiError(ApiErrorCode.BAD_REQUEST, 'URL fetch timed out (10s limit).');
    }
    return apiError(ApiErrorCode.BAD_REQUEST, `Failed to fetch URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Extract product data
  const productInfo = extractProductData(html, url);

  if (!productInfo.name) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Could not extract product information from the URL. Ensure it is a product page.');
  }

  // Build classification input
  const classifyInput = [
    productInfo.name,
    productInfo.brand ? `by ${productInfo.brand}` : '',
    productInfo.description ? `- ${productInfo.description.slice(0, 200)}` : '',
  ].filter(Boolean).join(' ');

  const category = categoryHint || productInfo.category || undefined;

  // Classify
  const startMs = Date.now();
  const result = await classifyProductAsync(classifyInput, category, context.sellerId);
  const confidence = calculateConfidenceScore(result, classifyInput);
  const processingTimeMs = Date.now() - startMs;

  // Audit trail
  void recordClassificationAudit({
    sellerId: context.sellerId,
    productName: classifyInput,
    productCategory: category,
    result,
    classificationSource: `url:${result.classificationSource}`,
    confidenceScore: confidence,
    processingTimeMs,
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
  });

  return apiSuccess(
    {
      hsCode: result.hsCode,
      description: result.description,
      confidence: result.confidence,
      confidenceScore: {
        overall: confidence.overall,
        grade: confidence.grade,
        gradeLabel: confidence.gradeLabel,
        reviewRecommended: confidence.reviewRecommended,
      },
      method: `url:${result.classificationSource}`,
      countryOfOrigin: result.countryOfOrigin,
      alternatives: result.alternatives,
      productInfo: {
        name: productInfo.name,
        description: productInfo.description?.slice(0, 200),
        brand: productInfo.brand,
        category: productInfo.category,
        price: productInfo.price,
        currency: productInfo.currency,
        imageUrl: productInfo.imageUrl,
      },
      sourceUrl: url,
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
    'Use POST method. Body: { url: "https://example.com/product/123", category?: "electronics" }'
  );
}
