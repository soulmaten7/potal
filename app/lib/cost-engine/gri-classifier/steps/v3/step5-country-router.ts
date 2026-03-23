/**
 * v3 Step 4: Country Router — 7개국 7~10자리 HS code 확장
 * Enhanced: passes Step 0~3 results + 9-field to country agents for pattern-based matching
 */

import type { CountryAgentResult, NormalizedInputV3 } from '../../types';
import { routeToCountryAgent } from '../../country-agents';

const SUPPORTED_COUNTRIES = new Set(['US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA']);

export interface Step5CountryResult {
  country_result: CountryAgentResult | null;
  destination_country: string;
  is_supported: boolean;
}

export async function routeToCountry(
  hs6: string,
  destinationCountry: string | undefined,
  normalized: NormalizedInputV3,
  price?: number,
  productName?: string
): Promise<Step5CountryResult> {
  if (!destinationCountry) {
    return { country_result: null, destination_country: 'NONE', is_supported: false };
  }

  const country = destinationCountry.toUpperCase();

  if (!SUPPORTED_COUNTRIES.has(country)) {
    return { country_result: null, destination_country: country, is_supported: false };
  }

  try {
    const keywords = [
      ...normalized.material_keywords,
      ...normalized.category_tokens,
      ...normalized.description_tokens,
    ].filter(Boolean);

    // Enhanced: pass full data for pattern-based matching
    const enhancedInput = {
      keywords,
      product_name: productName,
      material_keywords: normalized.material_keywords,
      category_tokens: normalized.category_tokens,
      processing_states: normalized.processing_states,
      composition_parsed: normalized.composition_parsed,
      price,
      weight_spec: normalized.weight_spec,
    };

    const result = await routeToCountryAgent(hs6, country, enhancedInput, price, productName);

    return {
      country_result: result,
      destination_country: country,
      is_supported: true,
    };
  } catch {
    return { country_result: null, destination_country: country, is_supported: true };
  }
}
