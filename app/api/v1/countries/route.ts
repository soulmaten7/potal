/**
 * POTAL API v1 — /api/v1/countries
 *
 * List all supported destination countries with VAT/duty info.
 * Public endpoint — no authentication required.
 * Useful for client-side country selectors and documentation.
 *
 * GET /api/v1/countries              — All countries
 * GET /api/v1/countries?region=Europe — Filter by region
 */

import { NextRequest } from 'next/server';
import { COUNTRY_DATA, getCountryCount } from '@/app/lib/cost-engine';

export async function GET(req: NextRequest) {
  const regionFilter = req.nextUrl.searchParams.get('region');

  let countries = Object.values(COUNTRY_DATA).map(c => ({
    code: c.code,
    name: c.name,
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
