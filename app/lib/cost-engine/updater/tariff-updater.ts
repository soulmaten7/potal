/**
 * POTAL Tariff Updater — Automated Duty Rate Refresh
 *
 * Periodically fetches latest tariff rates from government APIs
 * and updates the Supabase DB. Designed to run via Vercel Cron
 * or external scheduler (Make.com, GitHub Actions).
 *
 * Supported sources:
 * - USITC (US) — fetchUsitcDutyRate
 * - UK Trade Tariff — fetchUkTariffDutyRate
 * - EU TARIC — fetchEuTaricDutyRate
 * - Canada CBSA — fetchCanadaCbsaDutyRate
 * - Australia ABF — fetchAustraliaDutyRate
 * - Korea KCS — fetchKoreaDutyRate
 * - Japan Customs — fetchJapanDutyRate
 */

import {
  fetchUsitcDutyRate,
  fetchUkTariffDutyRate,
  fetchEuTaricDutyRate,
  fetchCanadaCbsaDutyRate,
  fetchAustraliaDutyRate,
  fetchKoreaDutyRate,
  fetchJapanDutyRate,
} from '../tariff-api';

// ─── Types ──────────────────────────────────────────

export interface UpdateResult {
  country: string;
  hsCodes: number;
  updated: number;
  failed: number;
  errors: string[];
  durationMs: number;
}

export interface UpdateSummary {
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  countries: UpdateResult[];
  totalUpdated: number;
  totalFailed: number;
}

// ─── Provider Map ───────────────────────────────────

interface TariffProvider {
  country: string;
  label: string;
  fetch: (hsCode: string, origin: string) => Promise<{ dutyRate: number; source: string } | null>;
}

const PROVIDERS: TariffProvider[] = [
  { country: 'US', label: 'USITC', fetch: async (hs) => { const r = await fetchUsitcDutyRate(hs); return r ? { dutyRate: r.mfnRate, source: 'usitc' } : null; } },
  { country: 'GB', label: 'UK Trade Tariff', fetch: async (hs) => { const r = await fetchUkTariffDutyRate(hs); return r ? { dutyRate: r.mfnRate, source: 'uk_tariff' } : null; } },
  { country: 'DE', label: 'EU TARIC', fetch: async (hs) => { const r = await fetchEuTaricDutyRate(hs, 'DE'); return r ? { dutyRate: r.mfnRate, source: 'eu_taric' } : null; } },
  { country: 'CA', label: 'Canada CBSA', fetch: async (hs) => { const r = await fetchCanadaCbsaDutyRate(hs); return r ? { dutyRate: r.mfnRate, source: 'canada_cbsa' } : null; } },
  { country: 'AU', label: 'Australia ABF', fetch: async (hs) => { const r = await fetchAustraliaDutyRate(hs); return r ? { dutyRate: r.mfnRate, source: 'australia_abf' } : null; } },
  { country: 'KR', label: 'Korea KCS', fetch: async (hs) => { const r = await fetchKoreaDutyRate(hs); return r ? { dutyRate: r.mfnRate, source: 'korea_kcs' } : null; } },
  { country: 'JP', label: 'Japan Customs', fetch: async (hs) => { const r = await fetchJapanDutyRate(hs); return r ? { dutyRate: r.mfnRate, source: 'japan_customs' } : null; } },
];

// ─── Supabase REST ──────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zyurflkhiregundhisky.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function upsertDutyRate(
  hsCode: string,
  destinationCountry: string,
  dutyRate: number,
  source: string
): Promise<boolean> {
  try {
    // CW38: Fixed table name live_duty_rate_cache → duty_rates_live
    // and aligned column schema to match what GlobalCostEngine reads
    const res = await fetch(`${SUPABASE_URL}/rest/v1/duty_rates_live`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        hs_code: hsCode,
        destination_country: destinationCountry.toUpperCase(),
        mfn_rate: dutyRate,
        additional_tariff: 0,
        anti_dumping_rate: 0,
        source_api: source,
        effective_date: new Date().toISOString().split('T')[0],
        invalidated_at: null,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Top HS Codes (most traded) ─────────────────────

/** Top 50 most-traded HS code prefixes to check regularly */
const TOP_HS_CODES = [
  '8471', '8517', '6109', '6110', '8528', '9403', '8703', '8542',
  '6204', '6104', '8473', '3004', '8504', '9018', '8708', '8541',
  '6403', '8525', '9405', '3304', '8544', '9503', '8519', '7108',
  '8443', '2710', '8536', '7210', '8501', '9401', '6203', '6105',
  '8507', '7304', '4202', '8531', '8529', '9027', '6402', '8523',
  '3926', '8481', '7318', '8482', '6302', '8414', '7326', '8431',
  '9021', '8537',
];

// ─── Main Update Function ───────────────────────────

/**
 * Run tariff update for all government API providers.
 *
 * @param hsCodes - Optional: specific HS codes to update. Defaults to top 50.
 * @param countries - Optional: specific countries. Defaults to all 7 providers.
 */
export async function runTariffUpdate(
  hsCodes?: string[],
  countries?: string[]
): Promise<UpdateSummary> {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  const codesToCheck = hsCodes || TOP_HS_CODES;
  const providersToUse = countries
    ? PROVIDERS.filter(p => countries.includes(p.country))
    : PROVIDERS;

  const results: UpdateResult[] = [];

  for (const provider of providersToUse) {
    const countryStart = Date.now();
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const hs of codesToCheck) {
      try {
        const rate = await provider.fetch(hs, 'CN'); // default origin CN
        if (rate) {
          const ok = await upsertDutyRate(hs, provider.country, rate.dutyRate, rate.source);
          if (ok) updated++;
          else failed++;
        }
      } catch (err) {
        failed++;
        if (errors.length < 5) {
          errors.push(`${hs}: ${err instanceof Error ? err.message : 'unknown error'}`);
        }
      }

      // Rate limit: small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }

    results.push({
      country: provider.country,
      hsCodes: codesToCheck.length,
      updated,
      failed,
      errors,
      durationMs: Date.now() - countryStart,
    });
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - start,
    countries: results,
    totalUpdated: results.reduce((s, r) => s + r.updated, 0),
    totalFailed: results.reduce((s, r) => s + r.failed, 0),
  };
}

export { PROVIDERS, TOP_HS_CODES };
