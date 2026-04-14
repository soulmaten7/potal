/**
 * CW37-S2: Endpoint deprecation helpers.
 * Adds X-API-Deprecated headers and _deprecation response field.
 */

import { NextResponse } from 'next/server';

export interface DeprecationInfo {
  replacement: string;
  sunsetDate?: string;
  message?: string;
}

const DEPRECATION_MAP: Record<string, DeprecationInfo> = {
  '/api/v1/exchange-rate': { replacement: '/api/v1/calculate', sunsetDate: '2027-01-31', message: 'Exchange rate is now included in calculate response as exchangeRateInfo.' },
  '/api/v1/de-minimis/check': { replacement: '/api/v1/calculate', sunsetDate: '2027-01-31', message: 'De minimis check is now included in calculate response as deMinimisInfo.' },
  '/api/v1/validate/hs-code': { replacement: '/api/v1/classify', sunsetDate: '2027-01-31', message: 'HS code validation is now included in classify response.' },
  '/api/v1/fta': { replacement: '/api/v1/roo/evaluate', sunsetDate: '2027-01-31', message: 'FTA lookup is absorbed into RoO evaluate with auto-detect mode.' },
};

/**
 * Get deprecation info for a path. Returns null if not deprecated.
 */
export function getDeprecation(pathname: string): DeprecationInfo | null {
  for (const [prefix, info] of Object.entries(DEPRECATION_MAP)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return info;
  }
  return null;
}

/**
 * Add deprecation headers and field to an existing Response.
 */
export function addDeprecationHeaders(response: NextResponse, info: DeprecationInfo): NextResponse {
  response.headers.set('X-API-Deprecated', 'true');
  response.headers.set('X-API-Replacement', info.replacement);
  if (info.sunsetDate) response.headers.set('X-API-Sunset', info.sunsetDate);
  return response;
}

/**
 * Deprecation field to spread into response body.
 */
export function deprecationField(info: DeprecationInfo) {
  return {
    _deprecation: {
      deprecated: true,
      replacement: info.replacement,
      sunsetDate: info.sunsetDate || '2027-01-31',
      message: info.message,
    },
  };
}
