/**
 * Step 9: Route to Country Agent for 7-10 digit classification.
 * Pure code — just routing, no AI calls.
 */

import type { CountryAgentResult } from '../types';
import { routeToCountryAgent } from '../country-agents';

const SUPPORTED_COUNTRIES = new Set(['US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA']);

export async function routeCountry(
  hs6: string,
  destinationCountry: string | undefined,
  keywords: string[],
  price?: number,
  productName?: string
): Promise<CountryAgentResult | null> {
  if (!destinationCountry) return null;

  const country = destinationCountry.toUpperCase();

  if (!SUPPORTED_COUNTRIES.has(country)) {
    // 233 other countries — return null (use 6-digit HS code)
    return null;
  }

  try {
    return await routeToCountryAgent(hs6, country, keywords, price, productName);
  } catch {
    // Country agent failed — return null (use 6-digit)
    return null;
  }
}
