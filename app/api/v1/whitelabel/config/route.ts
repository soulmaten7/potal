/**
 * POTAL API v1 — /api/v1/whitelabel/config
 *
 * White-label configuration endpoint.
 * Allows Enterprise customers to customize widget/API branding.
 *
 * GET  — Retrieve current white-label config
 * POST — Update white-label config
 *
 * Body (POST): {
 *   brandName?: string,          // Custom brand name (replaces "POTAL")
 *   logoUrl?: string,            // Custom logo URL
 *   primaryColor?: string,       // Hex color (#RRGGBB)
 *   secondaryColor?: string,     // Hex color
 *   customDomain?: string,       // Custom API domain
 *   hideAttribution?: boolean,   // Remove "Powered by POTAL"
 *   customCss?: string,          // Custom CSS for widget
 *   supportEmail?: string,       // Custom support email
 *   supportUrl?: string,         // Custom support URL
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────

interface WhiteLabelConfig {
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  hideAttribution?: boolean;
  customCss?: string;
  supportEmail?: string;
  supportUrl?: string;
}

// ─── Validation ────────────────────────────────────

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const URL_PATTERN = /^https?:\/\/.+/;
const EMAIL_PATTERN = /^[^@]+@[^@]+\.[^@]+$/;

function validateConfig(config: WhiteLabelConfig): string | null {
  if (config.primaryColor && !HEX_COLOR_PATTERN.test(config.primaryColor)) {
    return 'primaryColor must be a hex color (#RRGGBB)';
  }
  if (config.secondaryColor && !HEX_COLOR_PATTERN.test(config.secondaryColor)) {
    return 'secondaryColor must be a hex color (#RRGGBB)';
  }
  if (config.logoUrl && !URL_PATTERN.test(config.logoUrl)) {
    return 'logoUrl must be an HTTP(S) URL';
  }
  if (config.supportUrl && !URL_PATTERN.test(config.supportUrl)) {
    return 'supportUrl must be an HTTP(S) URL';
  }
  if (config.supportEmail && !EMAIL_PATTERN.test(config.supportEmail)) {
    return 'supportEmail must be a valid email address';
  }
  if (config.brandName && config.brandName.length > 100) {
    return 'brandName must be under 100 characters';
  }
  if (config.customCss && config.customCss.length > 10000) {
    return 'customCss must be under 10,000 characters';
  }
  if (config.customDomain && config.customDomain.length > 255) {
    return 'customDomain must be under 255 characters';
  }
  return null;
}

// ─── Supabase ──────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// ─── GET Handler ───────────────────────────────────

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  // Only Enterprise plan can use white-label
  if (context.planId !== 'enterprise') {
    return apiError(ApiErrorCode.FORBIDDEN, 'White-label is available on Enterprise plan only.');
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from('whitelabel_configs')
    .select('*')
    .eq('seller_id', context.sellerId)
    .single();

  const config: WhiteLabelConfig = data ? {
    brandName: data.brand_name,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    customDomain: data.custom_domain,
    hideAttribution: data.hide_attribution,
    customCss: data.custom_css,
    supportEmail: data.support_email,
    supportUrl: data.support_url,
  } : {};

  return apiSuccess(
    { config, isConfigured: !!data },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

// ─── POST Handler ──────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  if (context.planId !== 'enterprise') {
    return apiError(ApiErrorCode.FORBIDDEN, 'White-label is available on Enterprise plan only.');
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const config: WhiteLabelConfig = {
    brandName: typeof body.brandName === 'string' ? body.brandName.trim() : undefined,
    logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl.trim() : undefined,
    primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor.trim() : undefined,
    secondaryColor: typeof body.secondaryColor === 'string' ? body.secondaryColor.trim() : undefined,
    customDomain: typeof body.customDomain === 'string' ? body.customDomain.trim() : undefined,
    hideAttribution: typeof body.hideAttribution === 'boolean' ? body.hideAttribution : undefined,
    customCss: typeof body.customCss === 'string' ? body.customCss.trim() : undefined,
    supportEmail: typeof body.supportEmail === 'string' ? body.supportEmail.trim() : undefined,
    supportUrl: typeof body.supportUrl === 'string' ? body.supportUrl.trim() : undefined,
  };

  const validationError = validateConfig(config);
  if (validationError) {
    return apiError(ApiErrorCode.BAD_REQUEST, validationError);
  }

  const supabase = getSupabase();

  const upsertData = {
    seller_id: context.sellerId,
    brand_name: config.brandName,
    logo_url: config.logoUrl,
    primary_color: config.primaryColor,
    secondary_color: config.secondaryColor,
    custom_domain: config.customDomain,
    hide_attribution: config.hideAttribution,
    custom_css: config.customCss,
    support_email: config.supportEmail,
    support_url: config.supportUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('whitelabel_configs')
    .upsert(upsertData, { onConflict: 'seller_id' });

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to save white-label configuration.');
  }

  return apiSuccess(
    { config, saved: true },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
