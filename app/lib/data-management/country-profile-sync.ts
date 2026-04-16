/**
 * CW38 Phase 2 — Country Profile Sync Utility
 *
 * When a cron detects a change (VAT rate, de minimis, etc.),
 * this utility updates country_profiles and logs the change.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type SyncField = 'vat_rate' | 'de_minimis' | 'de_minimis_usd' | 'avg_duty_rate' | 'currency';

export async function syncCountryProfileField(
  countryCode: string,
  field: SyncField,
  newValue: number | string,
  source: string
): Promise<{ changed: boolean; oldValue: unknown; newValue: unknown }> {
  const sb = getSupabase();
  if (!sb) return { changed: false, oldValue: null, newValue };

  // 1. Get current value
  const { data: current } = await sb
    .from('country_profiles')
    .select(field)
    .eq('code', countryCode)
    .single();

  const oldValue = (current as Record<string, unknown>)?.[field];

  // 2. Compare
  if (oldValue === newValue) {
    return { changed: false, oldValue, newValue };
  }

  // 3. Update
  await sb.from('country_profiles').update({ [field]: newValue }).eq('code', countryCode);

  // 4. Log the change
  await sb.from('health_check_logs').insert({
    checked_at: new Date().toISOString(),
    overall_status: 'yellow',
    checks: [{
      name: 'country-profile-sync',
      status: 'yellow',
      message: `${countryCode}.${field} changed: ${oldValue} → ${newValue} (source: ${source})`,
      countryCode,
      field,
      oldValue,
      newValue,
      source,
    }],
    duration_ms: 0,
  });

  return { changed: true, oldValue, newValue };
}
