/**
 * POTAL API v1 — /api/v1/widget/config
 *
 * Get/update widget configuration for a seller.
 * Used by seller dashboard to customize widget appearance.
 *
 * GET  /api/v1/widget/config  — Get current config
 * POST /api/v1/widget/config  — Update config
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

// ─── GET: Retrieve widget config ─────────────────────

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const supabase = getServiceClient();

  const { data, error } = await (supabase
    .from('widget_configs') as any)
    .select('*')
    .eq('seller_id', context.sellerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (that's fine, return defaults)
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch widget config.');
  }

  const defaultConfig = {
    theme: {
      mode: 'light',
      primaryColor: '#2563eb',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    },
    position: 'inline',
    defaultOrigin: 'CN',
    defaultDestination: 'US',
    showBreakdown: true,
    showPoweredBy: true,
    allowedDomains: [],
  };

  if (!data) {
    return apiSuccess({ config: defaultConfig, isDefault: true });
  }

  return apiSuccess({
    config: {
      ...defaultConfig,
      ...(data.theme_config || {}),
      allowedDomains: data.allowed_domains || [],
    },
    isDefault: false,
    updatedAt: data.updated_at,
  });
});

// ─── POST: Update widget config ──────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  if (context.keyType !== 'secret') {
    return apiError(ApiErrorCode.FORBIDDEN, 'Widget config requires a secret key (sk_live_).');
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const supabase = getServiceClient();

  // Upsert widget config
  const updateData: Record<string, unknown> = {
    seller_id: context.sellerId,
  };

  if (body.theme && typeof body.theme === 'object') {
    updateData.theme_config = body.theme;
  }
  if (Array.isArray(body.allowedDomains)) {
    updateData.allowed_domains = body.allowedDomains;
  }

  const { error } = await (supabase
    .from('widget_configs') as any)
    .upsert(updateData, { onConflict: 'seller_id' });

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to update widget config.');
  }

  return apiSuccess({ message: 'Widget config updated successfully.' });
});
