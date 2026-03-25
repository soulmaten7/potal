/**
 * POTAL API v1 — /api/v1/branding/preview
 *
 * C3: Branding preview — returns HTML widget simulation
 *
 * POST /api/v1/branding/preview
 * Body: BrandingConfig fields (same as /branding POST)
 * Returns: HTML string for iframe embedding
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import {
  type BrandingConfig,
  DEFAULT_BRANDING,
  PRESET_THEMES,
  validateBrandingConfig,
  generatePreviewHtml,
} from '@/app/lib/branding/widget-theme';

export const POST = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // Build config from request
  const config: BrandingConfig = { ...DEFAULT_BRANDING };

  if (typeof body.primaryColor === 'string') config.primaryColor = body.primaryColor;
  if (typeof body.secondaryColor === 'string') config.secondaryColor = body.secondaryColor;
  if (typeof body.backgroundColor === 'string') config.backgroundColor = body.backgroundColor;
  if (typeof body.textColor === 'string') config.textColor = body.textColor;
  if (typeof body.fontFamily === 'string') config.fontFamily = body.fontFamily.substring(0, 200);
  if (typeof body.borderRadius === 'number') config.borderRadius = body.borderRadius;
  if (typeof body.logoUrl === 'string') config.logoUrl = body.logoUrl;
  if (typeof body.displayName === 'string') config.displayName = body.displayName.substring(0, 100);
  if (typeof body.showPoweredBy === 'boolean') config.showPoweredBy = body.showPoweredBy;
  if (typeof body.theme === 'string' && ['light', 'dark', 'minimal', 'custom'].includes(body.theme)) {
    config.theme = body.theme as BrandingConfig['theme'];
  }

  // Apply preset theme
  if (config.theme !== 'custom' && PRESET_THEMES[config.theme]) {
    Object.assign(config, PRESET_THEMES[config.theme]);
    // Re-apply user overrides on top of preset
    if (typeof body.primaryColor === 'string') config.primaryColor = body.primaryColor;
    if (typeof body.secondaryColor === 'string') config.secondaryColor = body.secondaryColor;
    if (typeof body.backgroundColor === 'string') config.backgroundColor = body.backgroundColor;
    if (typeof body.textColor === 'string') config.textColor = body.textColor;
  }

  // Validate
  const validation = validateBrandingConfig(config);
  if (!validation.valid) {
    return apiError(ApiErrorCode.BAD_REQUEST, validation.errors.join('; '));
  }

  const previewHtml = generatePreviewHtml(config);

  return apiSuccess({
    previewHtml,
    config,
    note: 'Embed previewHtml in an iframe for live preview.',
  });
});
