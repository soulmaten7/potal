/**
 * POTAL API v1 — /api/v1/sellers/keys/revoke
 *
 * Session-based API key revocation.
 * Uses Supabase auth token (Bearer) instead of sk_live_.
 *
 * POST /api/v1/sellers/keys/revoke?id=<key_id>
 * Headers: Authorization: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revokeApiKey } from '@/app/lib/api-auth/keys';

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

    // Get key ID from query
    const keyId = req.nextUrl.searchParams.get('id');
    if (!keyId) {
      return NextResponse.json(
        { success: false, error: { message: 'Query parameter "id" is required.' } },
        { status: 400 }
      );
    }

    const success = await revokeApiKey(supabase as any, keyId, user.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: { message: 'API key not found or already revoked.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'API key revoked successfully.', keyId },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
