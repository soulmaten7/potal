/**
 * POTAL API v1 — /api/v1/countries
 *
 * List all supported destination countries with VAT/duty info.
 * Public endpoint — no authentication required.
 * Useful for client-side country selectors and documentation.
 *
 * GET /api/v1/countries                       — All countries (English)
 * GET /api/v1/countries?region=Europe          — Filter by region
 * GET /api/v1/countries?lang=ko               — Korean country names
 * GET /api/v1/countries?lang=ja&region=Asia    — Japanese names, Asia only
 *
 * Supported languages: 50 languages (en, ko, ja, zh, es, fr, de, pt, ru, ar, hi, th, vi, id, tr, pl, nl, sv, da, fi, nb, cs, ro, hu, uk, el, he, ms, it, bg, bn, fa, tl, sw, am, ur, my, km, lo, ka, az, uz, kk, ne, si, hr, sr, lt, lv, sk)
 */

import { NextRequest } from 'next/server';
import { COUNTRY_DATA, getCountryCount } from '@/app/lib/cost-engine';
import { getCountryName, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@/app/lib/cost-engine/country-i18n';

export async function GET(req: NextRequest) {
  const regionFilter = req.nextUrl.searchParams.get('region');
  const langParam = (req.nextUrl.searchParams.get('lang') || 'en').toLowerCase() as SupportedLanguage;
  const lang = SUPPORTED_LANGUAGES.includes(langParam) ? langParam : 'en';

  let countries = Object.values(COUNTRY_DATA).map(c => ({
    code: c.code,
    name: lang === 'en' ? c.name : getCountryName(c.code, lang),
    nameEnglish: c.name,
    region: c.region,
    vatRate: c.vatRate,
    vatLabel: c.vatLabel,
    avgDutyRate: c.avgDutyRate,
    deMinimisUsd: c.deMinimisUsd,
    currency: c.currency,
    hasFtaWithChina: c.hasFtaWithChina,
    notes: c.notes || null,
  }));

  if (regionFilter) {
    const normalizedFilter = regionFilter.toLowerCase();
    countries = countries.filter(c => c.region.toLowerCase() === normalizedFilter);
  }

  // Group by region for easy consumption
  const grouped: Record<string, typeof countries> = {};
  for (const c of countries) {
    if (!grouped[c.region]) grouped[c.region] = [];
    grouped[c.region].push(c);
  }

  return Response.json(
    {
      success: true,
      data: {
        countries,
        grouped,
        total: countries.length,
        totalSupported: getCountryCount(),
        language: lang,
        supportedLanguages: SUPPORTED_LANGUAGES.map(l => ({ code: l, label: LANGUAGE_LABELS[l] })),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400', // 24h cache
      },
    }
  );
}
