/**
 * POTAL API v1 — /api/v1/sellers/keys/create
 *
 * Session-based API key creation.
 * Uses Supabase auth token (Bearer) instead of sk_live_.
 *
 * POST /api/v1/sellers/keys/create
 * Headers: Authorization: Bearer <supabase_access_token>
 * Body: { type: "publishable" | "secret", name?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createApiKey, type KeyType } from '@/app/lib/api-auth/keys';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  try {
    // Verify session token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization header required.' } },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const supabase = getServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired session.' } },
        { status: 401 }
      );
    }

    // Verify seller exists
    const { data: seller } = await (supabase
      .from('sellers') as any)
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      return NextResponse.json(
        { success: false, error: { message: 'Seller profile not found.' } },
        { status: 404 }
      );
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const type: KeyType = body.type === 'publishable' ? 'publishable' : 'secret';
    const name = typeof body.name === 'string' ? body.name.slice(0, 100) : 'Default';
    const rateLimitPerMinute = typeof body.rateLimitPerMinute === 'number'
      ? Math.max(1, Math.min(10000, body.rateLimitPerMinute))
      : 60;

    const result = await createApiKey(supabase as any, {
      sellerId: seller.id,
      type,
      name,
      rateLimitPerMinute,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'API key created. Save the full key — it will not be shown again.',
        key: {
          id: result.keyId,
          fullKey: result.fullKey,
          prefix: result.prefix,
          type: result.type,
          name,
          rateLimitPerMinute,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create API key.';
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
