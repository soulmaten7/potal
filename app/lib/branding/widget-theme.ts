/**
 * F105: Widget Theme Engine
 *
 * C2: Generates CSS variables from branding config
 * C5: Validates branding inputs (colors, URLs, CSS sanitization)
 */

// ─── Types ──────────────────────────────────────────

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: number;
  backgroundColor: string;
  textColor: string;
  customCss?: string;
  displayName?: string;
  theme: 'light' | 'dark' | 'minimal' | 'custom';
  showPoweredBy: boolean;
}

export interface BrandProfile {
  name: string;
  config: BrandingConfig;
  active: boolean;
  createdAt: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  theme: 'light',
  showPoweredBy: true,
};

// ─── Preset Themes ──────────────────────────────────

export const PRESET_THEMES: Record<string, Partial<BrandingConfig>> = {
  light: {
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderRadius: 8,
  },
  dark: {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    backgroundColor: '#1F2937',
    textColor: '#F9FAFB',
    borderRadius: 8,
  },
  minimal: {
    primaryColor: '#111827',
    secondaryColor: '#6B7280',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    borderRadius: 4,
  },
};

// ─── C5: Validation ─────────────────────────────────

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const URL_REGEX = /^https?:\/\/.+/;
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
const MAX_LOGO_URL_LENGTH = 2048;
const MAX_CUSTOM_CSS_LENGTH = 10000;

// Dangerous CSS patterns for XSS prevention
const DANGEROUS_CSS_PATTERNS = [
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /@import\s/gi,
  /url\s*\(\s*["']?\s*data:/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
  /onclick|onerror|onload|onmouseover/gi,
  /<script/gi,
  /<\/script/gi,
  /document\./gi,
  /window\./gi,
  /eval\s*\(/gi,
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateColor(color: string, fieldName: string): string | null {
  if (!HEX_COLOR_REGEX.test(color)) {
    return `${fieldName} must be a valid HEX color code (e.g., #FF5733 or #F00). Got: "${color}"`;
  }
  return null;
}

export function validateLogoUrl(url: string): string | null {
  if (url.length > MAX_LOGO_URL_LENGTH) {
    return `Logo URL exceeds maximum length of ${MAX_LOGO_URL_LENGTH} characters.`;
  }
  if (!URL_REGEX.test(url)) {
    return 'Logo URL must be a valid HTTP/HTTPS URL.';
  }
  const lowerUrl = url.toLowerCase().split('?')[0];
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some(ext => lowerUrl.endsWith(ext));
  if (!hasValidExt) {
    return `Logo must be one of: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}. Got: "${url}"`;
  }
  return null;
}

export function sanitizeCustomCss(css: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = css;

  if (sanitized.length > MAX_CUSTOM_CSS_LENGTH) {
    sanitized = sanitized.substring(0, MAX_CUSTOM_CSS_LENGTH);
    warnings.push(`Custom CSS truncated to ${MAX_CUSTOM_CSS_LENGTH} characters.`);
  }

  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '/* removed */');
      warnings.push(`Removed potentially dangerous CSS pattern: ${pattern.source}`);
    }
  }

  return { sanitized, warnings };
}

export function validateBrandingConfig(config: Partial<BrandingConfig>): ValidationResult {
  const errors: string[] = [];

  if (config.primaryColor) {
    const err = validateColor(config.primaryColor, 'primaryColor');
    if (err) errors.push(err);
  }
  if (config.secondaryColor) {
    const err = validateColor(config.secondaryColor, 'secondaryColor');
    if (err) errors.push(err);
  }
  if (config.backgroundColor) {
    const err = validateColor(config.backgroundColor, 'backgroundColor');
    if (err) errors.push(err);
  }
  if (config.textColor) {
    const err = validateColor(config.textColor, 'textColor');
    if (err) errors.push(err);
  }
  if (config.logoUrl) {
    const err = validateLogoUrl(config.logoUrl);
    if (err) errors.push(err);
  }
  if (config.borderRadius !== undefined && (config.borderRadius < 0 || config.borderRadius > 32)) {
    errors.push('borderRadius must be between 0 and 32.');
  }
  if (config.theme && !['light', 'dark', 'minimal', 'custom'].includes(config.theme)) {
    errors.push('theme must be: light, dark, minimal, or custom.');
  }

  return { valid: errors.length === 0, errors };
}

// ─── C2: CSS Generation ─────────────────────────────

export function generateWidgetCSS(config: BrandingConfig): string {
  const lines: string[] = [
    ':root, .potal-widget {',
    `  --potal-primary: ${config.primaryColor};`,
    `  --potal-secondary: ${config.secondaryColor};`,
    `  --potal-font: ${config.fontFamily};`,
    `  --potal-radius: ${config.borderRadius}px;`,
    `  --potal-bg: ${config.backgroundColor};`,
    `  --potal-text: ${config.textColor};`,
    '}',
    '',
    '.potal-widget {',
    '  font-family: var(--potal-font);',
    '  background-color: var(--potal-bg);',
    '  color: var(--potal-text);',
    '  border-radius: var(--potal-radius);',
    '}',
    '.potal-widget .potal-btn-primary {',
    '  background-color: var(--potal-primary);',
    '  color: #fff;',
    '  border-radius: var(--potal-radius);',
    '}',
    '.potal-widget .potal-btn-secondary {',
    '  background-color: var(--potal-secondary);',
    '  color: #fff;',
    '  border-radius: var(--potal-radius);',
    '}',
    '.potal-widget .potal-heading {',
    '  color: var(--potal-primary);',
    '}',
  ];

  if (config.logoUrl) {
    lines.push(
      '.potal-widget .potal-logo {',
      `  background-image: url("${config.logoUrl}");`,
      '  background-size: contain;',
      '  background-repeat: no-repeat;',
      '}',
    );
  }

  if (!config.showPoweredBy) {
    lines.push(
      '.potal-widget .potal-powered-by {',
      '  display: none !important;',
      '}',
    );
  }

  if (config.customCss) {
    const { sanitized } = sanitizeCustomCss(config.customCss);
    lines.push('/* Custom CSS */', sanitized);
  }

  return lines.join('\n');
}

// ─── Preview HTML ───────────────────────────────────

export function generatePreviewHtml(config: BrandingConfig): string {
  const css = generateWidgetCSS(config);
  const displayName = config.displayName || 'Your Store';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body { margin: 0; padding: 20px; background: #f3f4f6; font-family: system-ui; }
${css}
.potal-widget { max-width: 400px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.potal-logo { height: 40px; width: 120px; margin-bottom: 16px; }
.potal-heading { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
.potal-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
.potal-row:last-child { border-bottom: none; }
.potal-total { font-weight: 700; font-size: 16px; margin-top: 12px; padding-top: 12px; border-top: 2px solid var(--potal-primary); display: flex; justify-content: space-between; }
.potal-btn-primary { display: block; width: 100%; padding: 12px; text-align: center; font-weight: 600; border: none; cursor: pointer; margin-top: 16px; font-size: 14px; }
.potal-powered-by { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 12px; }
</style></head><body>
<div class="potal-widget">
  ${config.logoUrl ? '<div class="potal-logo"></div>' : ''}
  <div class="potal-heading">${displayName} — Landed Cost</div>
  <div class="potal-row"><span>Product Value</span><span>$99.00</span></div>
  <div class="potal-row"><span>Import Duty (6.5%)</span><span>$6.44</span></div>
  <div class="potal-row"><span>VAT / GST (20%)</span><span>$21.09</span></div>
  <div class="potal-row"><span>Shipping</span><span>$12.00</span></div>
  <div class="potal-total"><span>Total Landed Cost</span><span>$138.53</span></div>
  <button class="potal-btn-primary">Calculate for Your Product</button>
  ${config.showPoweredBy ? '<div class="potal-powered-by">Powered by POTAL</div>' : ''}
</div></body></html>`;
}
