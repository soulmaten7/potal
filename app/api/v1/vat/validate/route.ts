/**
 * POTAL API v1 — /api/v1/vat/validate
 * VAT number validation (EU VIES + format check)
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const EU_COUNTRIES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);

// VAT format patterns per country
const VAT_FORMATS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/, BE: /^BE[01]\d{9}$/, BG: /^BG\d{9,10}$/, HR: /^HR\d{11}$/,
  CY: /^CY\d{8}[A-Z]$/, CZ: /^CZ\d{8,10}$/, DK: /^DK\d{8}$/, EE: /^EE\d{9}$/,
  FI: /^FI\d{8}$/, FR: /^FR[A-Z0-9]{2}\d{9}$/, DE: /^DE\d{9}$/, GR: /^EL\d{9}$/,
  HU: /^HU\d{8}$/, IE: /^IE\d{7}[A-Z]{1,2}$/, IT: /^IT\d{11}$/, LV: /^LV\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/, LU: /^LU\d{8}$/, MT: /^MT\d{8}$/, NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/, PT: /^PT\d{9}$/, RO: /^RO\d{2,10}$/, SK: /^SK\d{10}$/,
  SI: /^SI\d{8}$/, ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, SE: /^SE\d{10}01$/,
  GB: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
};

async function checkVatVies(countryCode: string, vatNumber: string): Promise<{ valid: boolean; name?: string; address?: string } | null> {
  // Strip country prefix
  const number = vatNumber.replace(/^[A-Z]{2}/, '');
  const cc = countryCode === 'GR' ? 'EL' : countryCode;

  try {
    const res = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: cc, vatNumber: number }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      valid: data.valid === true,
      name: data.name || undefined,
      address: data.address || undefined,
    };
  } catch {
    return null;
  }
}

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const vatNumber = typeof body.vat_number === 'string' ? body.vat_number.toUpperCase().replace(/[\s.-]/g, '') : '';
  const countryCode = typeof body.country_code === 'string' ? body.country_code.toUpperCase().trim() : '';

  if (!vatNumber) return apiError(ApiErrorCode.BAD_REQUEST, 'vat_number required.');
  if (!countryCode || countryCode.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'Valid country_code required.');

  const sb = createClient(supabaseUrl, supabaseKey);

  // Check cache (24h)
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await sb.from('vat_validation_cache')
      .select('valid, company_name, address, checked_at')
      .eq('vat_number', vatNumber).eq('country_code', countryCode)
      .gte('checked_at', cutoff).single();

    if (cached) {
      return apiSuccess({
        vat_number: vatNumber, country_code: countryCode,
        valid: cached.valid, name: cached.company_name, address: cached.address,
        source: 'cache', checked_at: cached.checked_at,
      }, { sellerId: _ctx.sellerId });
    }
  } catch { /* cache miss */ }

  // Format validation
  const pattern = VAT_FORMATS[countryCode];
  const formatValid = pattern ? pattern.test(vatNumber) : true;

  let result: { valid: boolean; name?: string; address?: string; source: string };

  // EU: try VIES API
  if (EU_COUNTRIES.has(countryCode)) {
    const viesResult = await checkVatVies(countryCode, vatNumber);
    if (viesResult) {
      result = { ...viesResult, source: 'VIES' };
    } else {
      // VIES unavailable, fallback to format check
      result = { valid: formatValid, source: 'format_check' };
    }
  } else if (countryCode === 'GB') {
    // UK: format check (HMRC API requires API key)
    result = { valid: formatValid, source: 'format_check' };
  } else {
    // Other: format check only
    result = { valid: formatValid, source: 'format_check' };
  }

  // Cache result
  try {
    await sb.from('vat_validation_cache').upsert({
      vat_number: vatNumber, country_code: countryCode,
      valid: result.valid, company_name: result.name || null, address: result.address || null,
    }, { onConflict: 'vat_number,country_code' });
  } catch { /* non-blocking */ }

  return apiSuccess({
    vat_number: vatNumber, country_code: countryCode,
    valid: result.valid, format_valid: formatValid,
    name: result.name || null, address: result.address || null,
    source: result.source,
    checked_at: new Date().toISOString(),
    note: !result.valid && formatValid ? 'Format matches but registration not confirmed. Verify with local tax authority.' : undefined,
  }, { sellerId: _ctx.sellerId });
});
