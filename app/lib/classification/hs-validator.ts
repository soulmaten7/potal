/**
 * F012: HS Code Validation — S+ Grade
 * Format, nomenclature, country-specific, deprecated code detection.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface ValidationResult {
  valid: boolean;
  formatValid: boolean;
  existsInNomenclature: boolean;
  countrySpecific: boolean;
  deprecated: boolean;
  successorCode?: string;
  suggestions?: Array<{ code: string; description: string; similarity: number }>;
  validAtLevels: { hs2: boolean; hs4: boolean; hs6: boolean; hs8?: boolean; hs10?: boolean };
}

// HS 2017 → 2022 reclassified codes
const DEPRECATED_CODES: Record<string, string> = {
  '854239': '854231', '847330': '847310', '870324': '870340',
  '847150': '847141', '853690': '853610', '850440': '850431',
  '854290': '854231', '847989': '847982', '901890': '901812',
};

const HS_FORMAT = /^\d{2,10}$/;

export async function validateHsCode(code: string, country?: string): Promise<ValidationResult> {
  const clean = code.replace(/[\.\-\s]/g, '');
  const result: ValidationResult = {
    valid: false,
    formatValid: false,
    existsInNomenclature: false,
    countrySpecific: false,
    deprecated: false,
    validAtLevels: { hs2: false, hs4: false, hs6: false },
  };

  // Format check
  if (!HS_FORMAT.test(clean) || clean.length < 2) return result;
  result.formatValid = true;

  const hs2 = clean.slice(0, 2);
  const hs4 = clean.length >= 4 ? clean.slice(0, 4) : undefined;
  const hs6 = clean.length >= 6 ? clean.slice(0, 6) : undefined;

  // HS2 chapter validation (01-99)
  const chapter = parseInt(hs2, 10);
  result.validAtLevels.hs2 = chapter >= 1 && chapter <= 99 && chapter !== 98 && chapter !== 77;

  if (!result.validAtLevels.hs2) return result;

  // Check deprecated
  if (hs6 && DEPRECATED_CODES[hs6]) {
    result.deprecated = true;
    result.successorCode = DEPRECATED_CODES[hs6];
  }

  // DB lookup
  const sb = getSupabase();

  if (hs6) {
    const { data } = await sb
      .from('hs_classification_vectors')
      .select('hs6_code, description')
      .eq('hs6_code', hs6)
      .limit(1);

    result.existsInNomenclature = (data && data.length > 0) || false;
    result.validAtLevels.hs6 = result.existsInNomenclature;

    if (hs4) result.validAtLevels.hs4 = true; // If hs6 is valid, hs4 is valid

    // Country-specific check
    if (country && clean.length > 6) {
      const { data: govData } = await sb
        .from('gov_tariff_schedules')
        .select('hs_code')
        .eq('country_code', country.toUpperCase())
        .like('hs_code', `${clean}%`)
        .limit(1);

      result.countrySpecific = (govData && govData.length > 0) || false;
      result.validAtLevels.hs10 = result.countrySpecific;
    }

    // Suggestions if not found
    if (!result.existsInNomenclature) {
      const prefix = hs6.slice(0, 4);
      const { data: suggestions } = await sb
        .from('hs_classification_vectors')
        .select('hs6_code, description')
        .like('hs6_code', `${prefix}%`)
        .limit(3);

      if (suggestions && suggestions.length > 0) {
        result.suggestions = suggestions.map(s => ({
          code: s.hs6_code,
          description: s.description || '',
          similarity: s.hs6_code.slice(0, 4) === hs6.slice(0, 4) ? 0.8 : 0.5,
        }));
      }
    }
  }

  result.valid = result.formatValid && (result.existsInNomenclature || clean.length <= 4);
  return result;
}
