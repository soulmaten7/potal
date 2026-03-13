/**
 * POTAL API Authentication Middleware
 *
 * Validates API key from request, checks seller status,
 * enforces rate limits, and logs usage.
 *
 * Usage in API routes:
 * ```ts
 * import { withApiAuth } from '@/app/lib/api-auth/middleware';
 *
 * export const GET = withApiAuth(async (req, context) => {
 *   // context.seller, context.keyId, etc. are available
 *   return Response.json({ success: true, data: ... });
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lookupApiKey, type KeyType } from './keys';
import { checkRateLimit } from './rate-limiter';
import { logUsage } from './usage-logger';
import { checkPlanLimits } from './plan-checker';
import { apiError, ApiErrorCode } from './response';

// ─── Supabase Service Client (server-side only) ─────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey);
}

// ─── Auth Context ────────────────────────────────────

export interface ApiAuthContext {
  keyId: string;
  sellerId: string;
  keyType: KeyType;
  planId: string;
  subscriptionStatus: string;
  rateLimitPerMinute: number;
  /** Whether this request is in sandbox/test mode (pk_test_ or sk_test_ key) */
  sandbox: boolean;
}

// ─── Extract API Key from Request ────────────────────

function extractApiKey(req: NextRequest): string | null {
  // 1. X-API-Key header (preferred)
  const headerKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
  if (headerKey) return headerKey;

  // 2. Authorization: Bearer <key>
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 3. Query parameter ?api_key=
  const urlKey = req.nextUrl.searchParams.get('api_key');
  if (urlKey) return urlKey;

  return null;
}

// ─── Middleware Wrapper ──────────────────────────────

type ApiHandler = (
  req: NextRequest,
  context: ApiAuthContext
) => Promise<Response>;

/**
 * Wrap an API route handler with authentication, rate limiting, and usage logging.
 */
export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();
    const supabase = getServiceClient();

    // 1. Extract API key
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return apiError(ApiErrorCode.UNAUTHORIZED, 'API key is required. Pass via X-API-Key header or api_key query parameter.');
    }

    // 2. Validate key format (live + test/sandbox keys)
    const isSandbox = apiKey.startsWith('pk_test_') || apiKey.startsWith('sk_test_');
    if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('sk_live_') && !isSandbox) {
      return apiError(ApiErrorCode.UNAUTHORIZED, 'Invalid API key format. Use pk_live_, sk_live_, pk_test_, or sk_test_ prefix.');
    }

    // 3. Look up key in database
    const keyInfo = await lookupApiKey(supabase as any, apiKey);
    if (!keyInfo) {
      return apiError(ApiErrorCode.UNAUTHORIZED, 'Invalid or revoked API key.');
    }

    // 4. Check subscription status
    const { subscriptionStatus } = keyInfo;
    if (subscriptionStatus === 'canceled') {
      return apiError(ApiErrorCode.FORBIDDEN, 'Subscription is canceled. Please reactivate your plan.');
    }
    if (subscriptionStatus === 'past_due') {
      return apiError(ApiErrorCode.FORBIDDEN, 'Payment is past due. Please update your payment method.');
    }

    // 5. Rate limiting
    const rateLimitResult = checkRateLimit(keyInfo.keyId, keyInfo.rateLimitPerMinute);
    if (!rateLimitResult.allowed) {
      const response = apiError(ApiErrorCode.RATE_LIMITED, `Rate limit exceeded. ${keyInfo.rateLimitPerMinute} requests/minute allowed.`);
      response.headers.set('X-RateLimit-Limit', String(keyInfo.rateLimitPerMinute));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));
      response.headers.set('Retry-After', String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)));
      return response;
    }

    // 6. Plan usage limits (paid plans allow overage, free plan hard-blocks)
    const planCheck = await checkPlanLimits(supabase as any, keyInfo.sellerId, keyInfo.planId);
    if (!planCheck.allowed) {
      return apiError(ApiErrorCode.PLAN_LIMIT_EXCEEDED, `Monthly calculation limit reached (${planCheck.used}/${planCheck.limit}). Upgrade your plan for more.`);
    }

    // 7. Build context
    const context: ApiAuthContext = {
      keyId: keyInfo.keyId,
      sellerId: keyInfo.sellerId,
      keyType: keyInfo.keyType,
      planId: keyInfo.planId,
      subscriptionStatus,
      rateLimitPerMinute: keyInfo.rateLimitPerMinute,
      sandbox: isSandbox,
    };

    // 8. Execute handler
    let response: Response;
    let statusCode = 200;
    try {
      response = await handler(req, context);
      statusCode = response.status;
    } catch (err) {
      statusCode = 500;
      response = apiError(ApiErrorCode.INTERNAL_ERROR, 'Internal server error.');
    }

    // 9. Log usage (fire-and-forget)
    const responseTimeMs = Date.now() - startTime;
    const endpoint = req.nextUrl.pathname;
    logUsage(supabase as any, {
      sellerId: keyInfo.sellerId,
      apiKeyId: keyInfo.keyId,
      endpoint,
      method: req.method,
      statusCode,
      responseTimeMs,
    }).catch(() => {}); // Don't block response on log failure

    // 10. Add rate limit & usage headers
    response.headers.set('X-RateLimit-Limit', String(keyInfo.rateLimitPerMinute));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-Plan-Usage', String(planCheck.used));
    response.headers.set('X-Plan-Limit', String(planCheck.limit));
    if (isSandbox) {
      response.headers.set('X-Sandbox-Mode', 'true');
    }
    if (planCheck.isOverage) {
      response.headers.set('X-Plan-Overage', String(planCheck.overageCount));
      response.headers.set('X-Plan-Overage-Rate', String(planCheck.overageRate));
    }

    return response;
  };
}
