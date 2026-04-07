/**
 * POTAL API Authentication Middleware
 *
 * Full auth pipeline:
 * 1. Extract API key (header/bearer/query)
 * 2. Validate key format + lookup in DB (includes expiration check)
 * 3. Scope check (18-domain mapping)
 * 4. Subscription status check
 * 5. IP rules check (allow/block list)
 * 6. Fraud detection (burst/flood/enumeration)
 * 7. Rate limiting (in-memory sliding window)
 * 8. Plan usage limits
 * 9. Execute handler
 * 10. Log usage + add response headers
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lookupApiKey, type KeyType } from './keys';
import { checkRateLimit } from './rate-limiter';
import { logUsage } from './usage-logger';
// checkPlanLimits removed — Forever Free has no monthly quota (CW22-S4c)
import { apiError, ApiErrorCode } from './response';
import { generateFingerprint, hashRequestBody, checkFraud, recordFraudStrike } from './fraud-prevention';
import { revokeApiKey } from './keys';
// SANDBOX_CONFIG import removed — rate limit is now flat 20/sec for all keys (CW22-S4c)

// ─── Supabase Service Client ─────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error('Missing Supabase environment variables');
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
  sandbox: boolean;
}

// ─── Extract API Key ─────────────────────────────────

function extractApiKey(req: NextRequest): string | null {
  const headerKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
  if (headerKey) return headerKey;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const urlKey = req.nextUrl.searchParams.get('api_key');
  if (urlKey) return urlKey;
  return null;
}

// ─── Extract Client IP ───────────────────────────────

function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// ─── Scope Mapping (18 domains) ──────────────────────

/**
 * Maps API route paths to scope names.
 * Key = scope name, Value = path fragments that require this scope.
 * Covers all ~148 POTAL endpoints.
 */
const SCOPE_ROUTE_MAP: Record<string, string[]> = {
  calculate: ['/calculate', '/cost', '/compare', '/whatif', '/breakdown'],
  classify: ['/classify'],
  validate: ['/validate'],
  screen: ['/screen', '/sanctions', '/screening'],
  admin: ['/sellers/', '/admin/'],
  roo: ['/roo'],
  tax: ['/tax', '/vat', '/ioss'],
  shipping: ['/shipping', '/incoterms', '/labels'],
  compliance: ['/export-controls', '/restrictions', '/compliance', '/type86', '/ics2'],
  customs: ['/customs', '/documents', '/broker'],
  trade: ['/trade-remedies', '/drawback', '/temporary-import', '/sez'],
  webhook: ['/webhooks'],
  billing: ['/billing', '/checkout'],
  exchange: ['/exchange-rate'],
  countries: ['/countries'],
  export: ['/export'],
  origin: ['/origin'],
  verify: ['/verify', '/pre-shipment'],
};

function getRequiredScope(path: string): string | null {
  for (const [scope, patterns] of Object.entries(SCOPE_ROUTE_MAP)) {
    if (patterns.some(p => path.includes(p))) return scope;
  }
  return null; // Unmapped paths = no scope restriction (default allow)
}

// ─── IP Rules Check ──────────────────────────────────

async function checkIpRules(
  supabase: ReturnType<typeof createClient>,
  keyId: string,
  clientIp: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (clientIp === 'unknown') return { allowed: true };

  try {
    const { data, error } = await (supabase.from('api_key_ip_rules') as any)
      .select('ip_address, rule_type')
      .eq('api_key_id', keyId);

    if (error || !data || data.length === 0) return { allowed: true }; // No rules = allow all

    const allowRules = data.filter((r: { rule_type: string }) => r.rule_type === 'allow');
    const blockRules = data.filter((r: { rule_type: string }) => r.rule_type === 'block');

    // If allowlist exists, IP must be in it
    if (allowRules.length > 0) {
      const allowed = allowRules.some((r: { ip_address: string }) => r.ip_address === clientIp);
      if (!allowed) return { allowed: false, reason: `IP ${clientIp} not in allowlist.` };
    }

    // Check blocklist
    if (blockRules.some((r: { ip_address: string }) => r.ip_address === clientIp)) {
      return { allowed: false, reason: `IP ${clientIp} is blocked.` };
    }

    return { allowed: true };
  } catch {
    return { allowed: true }; // Fail-open on DB error
  }
}

// ─── Audit Logger ────────────────────────────────────

export async function logKeyAuditEvent(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await (supabase.from('health_check_logs') as any).insert({
      check_type: 'api_key_audit',
      status: 'healthy',
      response_time_ms: 0,
      details: eventType,
      metadata: { ...details, logged_at: new Date().toISOString() },
    });
  } catch {
    // Fire-and-forget
  }
}

// ─── Demo Rate Limiter (10 req/min/IP) ──────────────
const demoRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkDemoRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = demoRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    demoRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

const DEMO_CONTEXT: ApiAuthContext = {
  keyId: 'demo',
  sellerId: 'demo',
  keyType: 'publishable',
  planId: 'free',
  subscriptionStatus: 'active',
  rateLimitPerMinute: 10,
  sandbox: true,
};

// ─── Middleware Wrapper ──────────────────────────────

type ApiHandler = (req: NextRequest, context: ApiAuthContext) => Promise<Response>;

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();

    // Demo bypass — X-Demo-Request: true, no API key required
    if (req.headers.get('X-Demo-Request') === 'true') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
      if (!checkDemoRateLimit(ip)) {
        return apiError(ApiErrorCode.RATE_LIMITED, 'Demo rate limit exceeded (10/min). Sign up for unlimited access.');
      }
      try {
        const response = await handler(req, DEMO_CONTEXT);
        response.headers.set('X-Demo-Mode', 'true');
        return response;
      } catch {
        return apiError(ApiErrorCode.INTERNAL_ERROR, 'Internal server error.');
      }
    }

    const supabase = getServiceClient();

    // 1. Extract API key
    const apiKey = extractApiKey(req);

    // 1b. Dashboard session auth fallback — accept Supabase JWT tokens
    if (apiKey && apiKey.split('.').length === 3 && !apiKey.startsWith('pk_') && !apiKey.startsWith('sk_')) {
      try {
        const { data: { user } } = await supabase.auth.getUser(apiKey);
        if (user) {
          const { data: sellers } = await (supabase.from('sellers') as any)
            .select('id, plan_id, subscription_status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
          // Pick the seller with highest-tier plan, or most recent
          const sellerRows = sellers as Array<Record<string, unknown>> | null;
          const seller = sellerRows
            ?.sort((a, b) => {
              const planOrder: Record<string, number> = { enterprise: 4, pro: 3, basic: 2, free: 1 };
              return (planOrder[String(b.plan_id)] || 0) - (planOrder[String(a.plan_id)] || 0);
            })?.[0];
          if (seller) {
            const dashCtx: ApiAuthContext = {
              keyId: 'dashboard-session',
              sellerId: String(seller.id),
              keyType: 'publishable',
              planId: String(seller.plan_id || 'free'),
              subscriptionStatus: String(seller.subscription_status || 'active'),
              rateLimitPerMinute: 60,
              sandbox: false,
            };
            const response = await handler(req, dashCtx);
            const elapsed = Date.now() - startTime;
            response.headers.set('X-Response-Time', `${elapsed}ms`);
            return response;
          }
        }
      } catch {
        // Session validation failed — fall through to API key auth
      }
    }

    if (!apiKey) {
      return apiError(ApiErrorCode.UNAUTHORIZED, 'API key is required. Pass via X-API-Key header or api_key query parameter.');
    }

    // 2. Validate key format
    const isSandbox = apiKey.startsWith('pk_test_') || apiKey.startsWith('sk_test_');
    if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('sk_live_') && !isSandbox) {
      return apiError(ApiErrorCode.UNAUTHORIZED, 'Invalid API key format. Use pk_live_, sk_live_, pk_test_, or sk_test_ prefix.');
    }

    // 3. Look up key in database (includes expiration check)
    const keyInfo = await lookupApiKey(supabase as any, apiKey);
    if (!keyInfo) {
      return apiError(ApiErrorCode.UNAUTHORIZED, 'Invalid, revoked, or expired API key.');
    }

    // 4. Scope check
    const scopes = keyInfo.scopes || ['*'];
    if (!scopes.includes('*')) {
      const path = req.nextUrl.pathname;
      const requiredScope = getRequiredScope(path);
      if (requiredScope && !scopes.includes(requiredScope)) {
        return apiError(ApiErrorCode.FORBIDDEN, `API key does not have '${requiredScope}' scope. Key scopes: [${scopes.join(', ')}]`);
      }
    }

    // 5. Subscription status check
    const { subscriptionStatus } = keyInfo;
    if (subscriptionStatus === 'canceled') {
      const periodEnd = keyInfo.currentPeriodEnd ? new Date(keyInfo.currentPeriodEnd) : null;
      if (!periodEnd || new Date() > periodEnd) {
        return apiError(ApiErrorCode.FORBIDDEN, 'Subscription has expired. Please reactivate your plan.');
      }
    }
    if (subscriptionStatus === 'past_due') {
      return apiError(ApiErrorCode.FORBIDDEN, 'Payment is past due. Please update your payment method.');
    }

    // 6. IP rules check
    const clientIp = extractClientIp(req);
    const ipCheck = await checkIpRules(supabase as any, keyInfo.keyId, clientIp);
    if (!ipCheck.allowed) {
      return apiError(ApiErrorCode.FORBIDDEN, ipCheck.reason || 'IP address blocked.');
    }

    // 7. Fraud detection
    const userAgent = req.headers.get('user-agent') || '';
    const fingerprint = generateFingerprint(clientIp, userAgent, apiKey);
    const endpoint = req.nextUrl.pathname;
    const bodyHash = hashRequestBody(endpoint);
    const fraudResult = checkFraud(fingerprint, endpoint, bodyHash);
    if (!fraudResult.allowed) {
      // Record fraud strike — auto-disable key after 5 strikes in 1 hour
      const shouldDisable = recordFraudStrike(apiKey.substring(0, 12));
      if (shouldDisable) {
        revokeApiKey(supabase as any, keyInfo.keyId, keyInfo.sellerId).catch(() => {});
        logKeyAuditEvent(supabase as any, 'key_auto_disabled', {
          key_id: keyInfo.keyId, seller_id: keyInfo.sellerId,
          reason: 'fraud_threshold_exceeded', flags: fraudResult.flags,
        }).catch(() => {});
      }
      return apiError(ApiErrorCode.RATE_LIMITED, fraudResult.reason || 'Request blocked by fraud detection.');
    }

    // 8. Rate limiting — 20 requests/sec per API key
    const rateLimitResult = checkRateLimit(keyInfo.keyId);
    if (!rateLimitResult.allowed) {
      const response = apiError(ApiErrorCode.RATE_LIMITED, 'Rate limit: max 20 requests/sec. Please slow down.');
      response.headers.set('X-RateLimit-Limit', '20');
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));
      response.headers.set('Retry-After', '1');
      return response;
    }

    // 9. (Monthly quota removed — Forever Free has no call caps)

    // 9b. Trial expiration check (B-5: profile incomplete + trial expired = blocked)
    if (!isSandbox) {
      try {
        const { data: sellerRow } = await (supabase.from('sellers') as any)
          .select('trial_type, trial_expires_at, profile_completed_at')
          .eq('id', keyInfo.sellerId)
          .single();
        if (sellerRow
          && sellerRow.trial_type === 'monthly'
          && !sellerRow.profile_completed_at
          && sellerRow.trial_expires_at
          && new Date(sellerRow.trial_expires_at) < new Date()
        ) {
          return apiError(
            ApiErrorCode.FORBIDDEN,
            'Your 30-day trial has expired. Complete your profile at potal.app/dashboard to continue using POTAL for free.'
          );
        }
      } catch { /* fail-open: if DB query fails, allow request through */ }
    }

    // 10. Build context
    const context: ApiAuthContext = {
      keyId: keyInfo.keyId,
      sellerId: keyInfo.sellerId,
      keyType: keyInfo.keyType,
      planId: keyInfo.planId,
      subscriptionStatus,
      rateLimitPerMinute: keyInfo.rateLimitPerMinute,
      sandbox: isSandbox,
    };

    // 11. Execute handler
    let response: Response;
    let statusCode = 200;
    try {
      response = await handler(req, context);
      statusCode = response.status;
    } catch {
      statusCode = 500;
      response = apiError(ApiErrorCode.INTERNAL_ERROR, 'Internal server error.');
    }

    // 12. Log usage (fire-and-forget)
    const responseTimeMs = Date.now() - startTime;
    logUsage(supabase as any, {
      sellerId: keyInfo.sellerId,
      apiKeyId: keyInfo.keyId,
      endpoint,
      method: req.method,
      statusCode,
      responseTimeMs,
      mode: isSandbox ? 'sandbox' : 'live',
    }).catch(() => {});

    // 13. Response headers
    response.headers.set('X-RateLimit-Limit', '20');
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    if (isSandbox) response.headers.set('X-Sandbox-Mode', 'true');
    if (fraudResult.riskScore > 0) {
      response.headers.set('X-Fraud-Risk', String(fraudResult.riskScore));
    }

    // Key expiration warning (7 days before expiry)
    if (keyInfo.expiresAt) {
      const daysLeft = Math.ceil((new Date(keyInfo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft > 0) {
        response.headers.set('X-API-Key-Expires-In', `${daysLeft}d`);
      }
    }

    // Key age warning (90+ days)
    if (keyInfo.createdAt) {
      const ageDays = Math.floor((Date.now() - new Date(keyInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays >= 90) {
        response.headers.set('X-API-Key-Age-Warning', `Key is ${ageDays} days old, consider rotating`);
      }
    }

    return response;
  };
}
