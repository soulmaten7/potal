/**
 * F065: Address verification/correction.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const COUNTRY_ADDRESS_FORMATS: Record<string, { postalCodePattern: RegExp; fields: string[] }> = {
  US: { postalCodePattern: /^\d{5}(-\d{4})?$/, fields: ['street', 'city', 'state', 'postalCode'] },
  GB: { postalCodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, fields: ['street', 'city', 'postalCode'] },
  CA: { postalCodePattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, fields: ['street', 'city', 'province', 'postalCode'] },
  DE: { postalCodePattern: /^\d{5}$/, fields: ['street', 'postalCode', 'city'] },
  JP: { postalCodePattern: /^\d{3}-?\d{4}$/, fields: ['postalCode', 'prefecture', 'city', 'street'] },
  KR: { postalCodePattern: /^\d{5}$/, fields: ['postalCode', 'city', 'district', 'street'] },
  AU: { postalCodePattern: /^\d{4}$/, fields: ['street', 'city', 'state', 'postalCode'] },
  FR: { postalCodePattern: /^\d{5}$/, fields: ['street', 'postalCode', 'city'] },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() : '';
  const street = typeof body.street === 'string' ? body.street.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required.');

  const format = COUNTRY_ADDRESS_FORMATS[country];
  const issues: string[] = [];
  let valid = true;

  if (!street) { issues.push('Street address is missing.'); valid = false; }
  if (!city) { issues.push('City is missing.'); valid = false; }

  if (format && postalCode) {
    if (!format.postalCodePattern.test(postalCode)) {
      issues.push(`Postal code "${postalCode}" does not match ${country} format.`);
      valid = false;
    }
  } else if (!postalCode) {
    issues.push('Postal/ZIP code is missing.');
  }

  return apiSuccess({
    valid, country,
    address: { street, city, postalCode, country },
    issues,
    format: format ? { requiredFields: format.fields } : null,
    suggestions: !valid ? ['Verify all address fields are complete and correctly formatted.'] : ['Address format appears valid.'],
    note: 'For production-grade address validation, integrate with Google Maps, SmartyStreets, or Loqate API.',
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country, street, city, postalCode }'); }
