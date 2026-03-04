/**
 * POTAL API v1 — /api/v1/sellers/register
 *
 * Register a new seller account.
 * Creates Supabase auth user + sellers row + auto-generates API keys.
 *
 * POST /api/v1/sellers/register
 * Body: { email, password, companyName? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createApiKey } from '@/app/lib/api-auth/keys';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, companyName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required.' } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'Password must be at least 8 characters.' } },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        role: 'seller',
        company_name: companyName || '',
      },
    });

    if (authError) {
      // Check for duplicate email
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

    // 2. Create seller record
    const { data: sellerData, error: sellerError } = await (supabase
      .from('sellers') as any)
      .insert({
        id: userId,
        email,
        company_name: companyName || null,
        plan_id: 'starter',
        subscription_status: 'active',
      })
      .select('id')
      .single();

    if (sellerError) {
      // Cleanup: delete the auth user if seller creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to create seller profile.' } },
        { status: 500 }
      );
    }

    const sellerId = (sellerData as any).id;

    // 3. Auto-generate API keys (publishable + secret)
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
    } catch (keyError) {
      // Keys failed but account created — user can generate keys later
      return NextResponse.json({
        success: true,
        data: {
          message: 'Account created but API key generation failed. Generate keys from the dashboard.',
          sellerId,
          keys: null,
        },
      });
    }

    // 4. Return success with keys
    return NextResponse.json({
      success: true,
      data: {
        message: 'Seller account created successfully.',
        sellerId,
        email,
        plan: 'starter',
        keys: {
          publishable: {
            fullKey: publishableKey.fullKey,
            prefix: publishableKey.prefix,
            note: 'Use this in your widget (client-side safe)',
          },
          secret: {
            fullKey: secretKey.fullKey,
            prefix: secretKey.prefix,
            note: 'Keep this secret! Use for server-side API calls and key management',
          },
          warning: 'Save these keys now — they will NOT be shown again.',
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
