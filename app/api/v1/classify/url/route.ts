/**
 * POTAL API v1 — /api/v1/classify/url
 *
 * URL-based product classification.
 * Scrapes product page, extracts name/description/images via JSON-LD + OG + meta tags,
 * then classifies the product.
 *
 * Features:
 * - JSON-LD structured data extraction (primary)
 * - OpenGraph meta tag fallback
 * - Price + currency extraction
 * - 15s timeout + 2 retries on 5xx/429
 * - Input sanitization (XSS prevention)
 * - 5MB HTML limit with head-first parsing
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, recordClassificationAudit } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_FETCH_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;

// ─── URL Validation ─────────────────────────────────

function isValidProductUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// ─── Sanitization ───────────────────────────────────

/** Strip HTML tags and dangerous patterns from extracted text */
function sanitize(text: string, maxLen: number = 1000): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, maxLen);
}

// ─── Price Extraction ───────────────────────────────

interface ParsedPrice {
  price: number;
  currency: string;
}

/** Parse price string like "$29.99", "€15.50", "£42" */
function parsePrice(priceStr: string, currencyHint?: string): ParsedPrice | null {
  if (!priceStr) return null;
  const clean = priceStr.replace(/[,\s]/g, '');

  // Currency symbol detection
  const currencyMap: Record<string, string> = {
    '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₩': 'KRW',
    '₹': 'INR', 'R$': 'BRL', 'A$': 'AUD', 'C$': 'CAD',
  };

  let currency = currencyHint || 'USD';
  for (const [symbol, code] of Object.entries(currencyMap)) {
    if (clean.includes(symbol)) { currency = code; break; }
  }

  const numMatch = clean.match(/[\d]+\.?\d*/);
  if (!numMatch) return null;

  const price = parseFloat(numMatch[0]);
  if (isNaN(price) || price <= 0) return null;

  return { price: Math.round(price * 100) / 100, currency };
}

// ─── HTML Product Data Extraction ────────────────────

interface ExtractedProduct {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  brand?: string;
  category?: string;
  extractionMethod?: string;
  spaWarning?: string;
}

function extractProductData(html: string): ExtractedProduct {
  const result: ExtractedProduct = {};

  // 1. Try ALL JSON-LD blocks (not just first match)
  const jsonLdBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdBlocks) {
    try {
      const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const jsonLd = JSON.parse(content);

      // Handle @graph arrays
      const candidates = jsonLd['@type'] === 'Product' ? [jsonLd]
        : Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'].filter((n: Record<string, unknown>) => n['@type'] === 'Product')
          : Array.isArray(jsonLd) ? jsonLd.filter((n: Record<string, unknown>) => n['@type'] === 'Product')
            : [];

      for (const product of candidates) {
        if (product && !result.name) {
          result.name = sanitize(product.name || '', 300);
          result.description = product.description ? sanitize(product.description, 500) : undefined;
          result.brand = product.brand?.name || (typeof product.brand === 'string' ? product.brand : undefined);
          result.category = typeof product.category === 'string' ? product.category : undefined;
          if (product.image) {
            result.imageUrl = Array.isArray(product.image) ? product.image[0] : (typeof product.image === 'string' ? product.image : product.image?.url);
          }
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            if (offer?.price) {
              const parsed = parsePrice(String(offer.price), offer.priceCurrency);
              if (parsed) { result.price = parsed.price; result.currency = parsed.currency; }
            }
            if (offer?.priceCurrency && !result.currency) result.currency = offer.priceCurrency;
          }
          result.extractionMethod = 'json_ld';
          break;
        }
      }
      if (result.name) break;
    } catch { /* JSON-LD parse failed — try next block */ }
  }

  // 2. OpenGraph meta tags (fallback)
  if (!result.name) {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitle) result.name = sanitize(ogTitle[1], 300);
    if (!result.extractionMethod && result.name) result.extractionMethod = 'opengraph';
  }
  if (!result.description) {
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDesc) result.description = sanitize(ogDesc[1], 500);
  }
  if (!result.imageUrl) {
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImage) result.imageUrl = ogImage[1];
  }

  // 3. Product-specific meta (Shopify, WooCommerce)
  if (!result.price) {
    const priceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i);
    const currMatch = html.match(/<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i);
    if (priceMatch) {
      const parsed = parsePrice(priceMatch[1], currMatch?.[1]);
      if (parsed) { result.price = parsed.price; result.currency = parsed.currency; }
    }
  }

  // 4. Fallback to title tag
  if (!result.name) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.name = sanitize(titleMatch[1].split(/\s*[-|–—]\s*/)[0], 300);
      if (!result.extractionMethod) result.extractionMethod = 'title_tag';
    }
  }

  // 5. Meta description
  if (!result.description) {
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) result.description = sanitize(metaDesc[1], 500);
  }

  // 6. SPA detection warning
  const hasMinimalContent = html.replace(/<[^>]+>/g, '').trim().length < 500;
  const hasAppRoot = /<div[^>]*id=["'](app|root|__next)["']/i.test(html);
  if (hasMinimalContent && hasAppRoot && !result.name) {
    result.spaWarning = 'This page appears to be a JavaScript-rendered Single Page Application (SPA). Product data may not be available in static HTML. Try providing product details directly via /api/v1/classify instead.';
  }

  return result;
}

// ─── Fetch with Retry ────────────────────────────────

async function fetchWithRetry(url: string): Promise<{ html: string; statusCode: number }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'POTAL-ProductClassifier/1.0 (https://potal.app)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (response.ok) {
        let html = await response.text();
        if (html.length > MAX_FETCH_SIZE) html = html.slice(0, MAX_FETCH_SIZE);
        return { html, statusCode: response.status };
      }

      // Retry on 429/5xx
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 1500; // 1.5s, 3s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (attempt < MAX_RETRIES) continue;
        throw new Error(`Fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
      }
      if (attempt === MAX_RETRIES) throw err;
    }
  }
  throw new Error('Fetch failed after retries');
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

  if (!url) return apiError(ApiErrorCode.BAD_REQUEST, 'Field "url" is required.');
  if (url.length > 2048) return apiError(ApiErrorCode.BAD_REQUEST, 'URL exceeds 2048 character limit.');
  if (!isValidProductUrl(url)) return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid URL. Must be http:// or https://');

  // Fetch product page with retry
  let html: string;
  try {
    const fetchResult = await fetchWithRetry(url);
    html = fetchResult.html;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('timed out')) {
      return apiError(ApiErrorCode.BAD_REQUEST, `URL fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s. The target server is too slow.`);
    }
    return apiError(ApiErrorCode.BAD_REQUEST, `Failed to fetch URL: ${msg}`);
  }

  // Extract product data
  const productInfo = extractProductData(html);

  if (!productInfo.name) {
    const hint = productInfo.spaWarning
      ? ` ${productInfo.spaWarning}`
      : ' Ensure the URL is a product page with structured data (JSON-LD or Open Graph tags).';
    return apiError(ApiErrorCode.BAD_REQUEST, `Could not extract product information from the URL.${hint}`);
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

  // Audit trail (fire-and-forget)
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
        extractionMethod: productInfo.extractionMethod,
      },
      sourceUrl: url,
      ...(productInfo.spaWarning ? { spaWarning: productInfo.spaWarning } : {}),
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { url: "https://example.com/product/123", category?: "electronics" }'
  );
}
