/**
 * F117-F129: Regional Special Tax Rules — DB Query Layer
 *
 * Queries special_tax_rules table for excise, environmental, luxury,
 * digital, telecom, and sin taxes by country and HS code.
 */

import { createClient } from '@supabase/supabase-js';

export interface SpecialTaxRule {
  id: string;
  countryCode: string;
  stateProvince: string | null;
  taxName: string;
  taxType: string;
  rate: number | null;
  rateType: string;
  perUnitAmount: number | null;
  perUnitMeasure: string | null;
  hsCodes: string[];
  thresholdAmount: number | null;
  thresholdCurrency: string;
  description: string;
  authority: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Get special tax rules for a country, optionally filtered by HS code.
 */
export async function getSpecialTaxRules(
  countryCode: string,
  hsCode?: string,
  taxType?: string
): Promise<SpecialTaxRule[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('special_tax_rules')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .or(`effective_to.is.null,effective_to.gte.${today}`);

    if (taxType) {
      query = query.eq('tax_type', taxType);
    }

    if (hsCode) {
      const heading = hsCode.replace(/[^0-9]/g, '').substring(0, 4);
      query = query.contains('hs_codes', [heading]);
    }

    const { data, error } = await query.order('tax_name');

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      countryCode: row.country_code as string,
      stateProvince: (row.state_province as string) || null,
      taxName: row.tax_name as string,
      taxType: row.tax_type as string,
      rate: row.rate !== null ? Number(row.rate) : null,
      rateType: (row.rate_type as string) || 'percentage',
      perUnitAmount: row.per_unit_amount !== null ? Number(row.per_unit_amount) : null,
      perUnitMeasure: (row.per_unit_measure as string) || null,
      hsCodes: (row.hs_codes as string[]) || [],
      thresholdAmount: row.threshold_amount !== null ? Number(row.threshold_amount) : null,
      thresholdCurrency: (row.threshold_currency as string) || 'USD',
      description: (row.description as string) || '',
      authority: (row.authority as string) || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Get all countries that have special tax rules.
 */
export async function getSpecialTaxCountries(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from('special_tax_rules')
      .select('country_code')
      .order('country_code');

    if (!data) return [];
    return [...new Set(data.map((d: Record<string, unknown>) => d.country_code as string))];
  } catch {
    return [];
  }
}
