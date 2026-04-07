/**
 * POTAL API v1 — /api/v1/sellers/register
 *
 * Register a new seller account (Forever Free model).
 * Creates Supabase auth user + sellers row + auto-generates API keys.
 * Sets trial_expires_at = NOW() + 30 days (monthly trial).
 * Profile completion upgrades to Forever Free.
 *
 * POST /api/v1/sellers/register
 * Body: { email, password, companyName, country, industry }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createApiKey } from '@/app/lib/api-auth/keys';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

function maskKey(fullKey: string): string {
  return fullKey.slice(0, 8) + '***';
}

// ─── IP Rate Limiting (5 req/min per IP) ─────
const ipRequests = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRequests.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return false;
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequests.entries()) {
    const active = timestamps.filter(t => now - t < RATE_WINDOW_MS);
    if (active.length === 0) ipRequests.delete(ip);
    else ipRequests.set(ip, active);
  }
}, 300_000).unref();

const VALID_INDUSTRIES = [
  'ecommerce_seller', 'logistics_freight', 'customs_broker',
  'marketplace_operator', 'developer', 'other',
];

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: { message: 'Too many registration attempts. Please try again later.' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, companyName, country, industry } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required.' } },
        { status: 400 }
      );
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: { message: 'Password must be at least 8 characters with letters and numbers.' } },
        { status: 400 }
      );
    }

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Company name is required.' } },
        { status: 400 }
      );
    }

    if (!country || typeof country !== 'string' || country.length !== 2) {
      return NextResponse.json(
        { success: false, error: { message: 'Country (ISO 2-letter code) is required.' } },
        { status: 400 }
      );
    }

    if (!industry || !VALID_INDUSTRIES.includes(industry)) {
      return NextResponse.json(
        { success: false, error: { message: `Industry is required. Options: ${VALID_INDUSTRIES.join(', ')}` } },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'seller',
        company_name: companyName.trim(),
        country: country.toUpperCase(),
        industry,
      },
    });

    if (authError) {
      if (authError.message?.includes('already') || authError.message?.includes('exists')) {
        return NextResponse.json(
          { success: false, error: { message: 'An account with this email already exists.' } },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: { message: authError.message || 'Failed to create account.' } },
        { status: 400 }
      );
    }

    const userId = authData.user.id;
    const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Create seller record with trial
    const { data: sellerData, error: sellerError } = await (supabase
      .from('sellers') as any)
      .insert({
        id: userId,
        user_id: userId,
        contact_email: email,
        company_name: companyName.trim(),
        country: country.toUpperCase(),
        industry,
        plan_id: 'free',
        subscription_status: 'active',
        trial_type: 'monthly',
        trial_expires_at: trialExpiresAt,
      })
      .select('id')
      .single();

    if (sellerError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to create seller profile.' } },
        { status: 500 }
      );
    }

    const sellerId = (sellerData as any).id;

    // 3. Auto-generate API keys
    let publishableKey, secretKey;
    try {
      const pkResult = await createApiKey(supabase as any, {
        sellerId,
        type: 'publishable',
        name: 'Default Publishable Key',
        rateLimitPerMinute: 60,
      });
      publishableKey = pkResult;

      const skResult = await createApiKey(supabase as any, {
        sellerId,
        type: 'secret',
        name: 'Default Secret Key',
        rateLimitPerMinute: 60,
      });
      secretKey = skResult;
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Account created but API key generation failed. Generate keys from the dashboard.',
          sellerId,
          keys: null,
          trial: { type: 'monthly', expiresAt: trialExpiresAt },
        },
      });
    }

    // 4. Return success
    return NextResponse.json({
      success: true,
      data: {
        message: 'Account created! Complete your profile for Forever Free access.',
        sellerId,
        email,
        plan: 'free',
        trial: {
          type: 'monthly',
          expiresAt: trialExpiresAt,
          daysRemaining: 30,
          upgradeToForeverFree: 'Complete your profile in the dashboard.',
        },
        keys: {
          publishable: {
            key: maskKey(publishableKey.fullKey),
            prefix: publishableKey.prefix,
            note: 'Full key available in Dashboard → API Keys',
          },
          secret: {
            key: maskKey(secretKey.fullKey),
            prefix: secretKey.prefix,
            note: 'Full key available in Dashboard → API Keys',
          },
          warning: 'Go to Dashboard → API Keys to view your full keys.',
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
