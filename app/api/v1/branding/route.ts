/**
 * POTAL API v1 — /api/v1/branding
 *
 * F105: White-label branding management.
 * C1: CRUD for branding settings
 * C5: Input validation (colors, URLs, CSS XSS prevention)
 * C6: Multi-brand profiles for Enterprise
 *
 * GET  — Retrieve current branding config
 * POST — Update branding config
 *
 * Plan restrictions:
 * - Free/Basic: "Powered by POTAL" required, no custom branding
 * - Pro: Custom colors/fonts, "Powered by POTAL" removable
 * - Enterprise: Full white-label + multi-brand profiles
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import {
  type BrandingConfig,
  type BrandProfile,
  DEFAULT_BRANDING,
  PRESET_THEMES,
  validateBrandingConfig,
  sanitizeCustomCss,
  generateWidgetCSS,
} from '@/app/lib/branding/widget-theme';
import { getPlanFeatures } from '@/app/lib/api-auth/plan-checker';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type WidgetBrandingTier = 'potal' | 'custom' | 'white-label';

function getBrandingTier(planId: string): WidgetBrandingTier {
  const features = getPlanFeatures(planId);
  return features.widgetBranding;
}

// ─── GET: Retrieve branding ─────────────────────────

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const tier = getBrandingTier(context.planId);
  const supabase = getSupabase();

  let config: BrandingConfig = { ...DEFAULT_BRANDING };
  let brandProfiles: BrandProfile[] = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('seller_branding')
        .select('config, brand_profiles, updated_at')
        .eq('seller_id', context.sellerId)
        .single();

      if (data?.config) {
        config = { ...DEFAULT_BRANDING, ...(data.config as Partial<BrandingConfig>) };
      }
      if (data?.brand_profiles && Array.isArray(data.brand_profiles)) {
        brandProfiles = data.brand_profiles as BrandProfile[];
      }
    } catch { /* use defaults */ }
  }

  // Enforce plan restrictions
  if (tier === 'potal') {
    config.showPoweredBy = true;
    config.customCss = undefined;
    config.logoUrl = undefined;
  }

  const css = generateWidgetCSS(config);

  return apiSuccess({
    config,
    css,
    tier,
    brandProfiles: tier === 'white-label' ? brandProfiles : undefined,
    presetThemes: Object.keys(PRESET_THEMES),
    restrictions: {
      canRemovePoweredBy: tier !== 'potal',
      canCustomize: tier !== 'potal',
      canUploadLogo: tier !== 'potal',
      canUseCustomCss: tier === 'white-label',
      canMultiBrand: tier === 'white-label',
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

// ─── POST: Update branding ──────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const tier = getBrandingTier(context.planId);

  // Plan restriction: Free/Basic cannot customize
  if (tier === 'potal') {
    return apiError(ApiErrorCode.FORBIDDEN,
      'Custom branding requires Pro plan or higher. Free/Basic plans display "Powered by POTAL".');
  }

  // Parse input
  const updates: Partial<BrandingConfig> = {};

  if (typeof body.primaryColor === 'string') updates.primaryColor = body.primaryColor;
  if (typeof body.secondaryColor === 'string') updates.secondaryColor = body.secondaryColor;
  if (typeof body.backgroundColor === 'string') updates.backgroundColor = body.backgroundColor;
  if (typeof body.textColor === 'string') updates.textColor = body.textColor;
  if (typeof body.fontFamily === 'string') updates.fontFamily = body.fontFamily.substring(0, 200);
  if (typeof body.borderRadius === 'number') updates.borderRadius = body.borderRadius;
  if (typeof body.logoUrl === 'string') updates.logoUrl = body.logoUrl;
  if (typeof body.displayName === 'string') updates.displayName = body.displayName.substring(0, 100);
  if (typeof body.theme === 'string') updates.theme = body.theme as BrandingConfig['theme'];

  // showPoweredBy: Pro+ can set to false (Free/Basic blocked by early return above)
  if (typeof body.showPoweredBy === 'boolean') {
    updates.showPoweredBy = body.showPoweredBy;
  }

  // customCss: Enterprise only
  if (typeof body.customCss === 'string') {
    if (tier !== 'white-label') {
      return apiError(ApiErrorCode.FORBIDDEN, 'Custom CSS requires Enterprise plan.');
    }
    const { sanitized, warnings } = sanitizeCustomCss(body.customCss);
    updates.customCss = sanitized;
    if (warnings.length > 0) {
      // Continue but note warnings in response
      (body as Record<string, unknown>)._cssWarnings = warnings;
    }
  }

  // Apply preset theme if specified
  if (updates.theme && updates.theme !== 'custom' && PRESET_THEMES[updates.theme]) {
    Object.assign(updates, PRESET_THEMES[updates.theme]);
  }

  // C5: Validate
  const validation = validateBrandingConfig(updates);
  if (!validation.valid) {
    return apiError(ApiErrorCode.BAD_REQUEST, validation.errors.join('; '));
  }

  // C6: Multi-brand profiles (Enterprise only)
  let brandProfiles: BrandProfile[] | undefined;
  if (Array.isArray(body.brandProfiles)) {
    if (tier !== 'white-label') {
      return apiError(ApiErrorCode.FORBIDDEN, 'Multi-brand profiles require Enterprise plan.');
    }
    brandProfiles = [];
    for (const profile of body.brandProfiles) {
      const p = profile as Record<string, unknown>;
      if (typeof p.name !== 'string' || !p.name) continue;
      const profileConfig = (p.config || {}) as Partial<BrandingConfig>;
      const profileValidation = validateBrandingConfig(profileConfig);
      if (!profileValidation.valid) {
        return apiError(ApiErrorCode.BAD_REQUEST, `Brand profile "${p.name}": ${profileValidation.errors.join('; ')}`);
      }
      brandProfiles.push({
        name: String(p.name).substring(0, 50),
        config: { ...DEFAULT_BRANDING, ...profileConfig },
        active: p.active !== false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Save to DB
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Get existing config to merge
      const { data: existing } = await supabase
        .from('seller_branding')
        .select('config, brand_profiles')
        .eq('seller_id', context.sellerId)
        .single();

      const existingConfig = (existing?.config || {}) as Partial<BrandingConfig>;
      const mergedConfig = { ...DEFAULT_BRANDING, ...existingConfig, ...updates };

      const upsertData: Record<string, unknown> = {
        seller_id: context.sellerId,
        config: mergedConfig,
        updated_at: new Date().toISOString(),
      };

      if (brandProfiles !== undefined) {
        upsertData.brand_profiles = brandProfiles;
      }

      await supabase.from('seller_branding').upsert(upsertData, { onConflict: 'seller_id' });
    } catch {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to save branding settings.');
    }
  }

  const mergedForCss = { ...DEFAULT_BRANDING, ...updates };
  const css = generateWidgetCSS(mergedForCss);

  return apiSuccess({
    updated: true,
    config: mergedForCss,
    css,
    tier,
    brandProfiles: brandProfiles || undefined,
    cssWarnings: (body as Record<string, unknown>)._cssWarnings || undefined,
  }, { sellerId: context.sellerId, plan: context.planId });
});
