/**
 * POTAL API v1 — /api/v1/admin/regions
 *
 * F096: Multi-Region API Deployment info.
 * Returns deployment regions, edge endpoints, and country recommendations.
 *
 * GET /api/v1/admin/regions?country=JP
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess } from '@/app/lib/api-auth/response';

interface Region {
  id: string;
  name: string;
  location: string;
  latencyBaselineMs: number;
  status: 'active' | 'planned';
}

const REGIONS: Region[] = [
  { id: 'iad1', name: 'US East (Virginia)', location: 'North America', latencyBaselineMs: 50, status: 'active' },
  { id: 'sfo1', name: 'US West (San Francisco)', location: 'North America', latencyBaselineMs: 80, status: 'active' },
  { id: 'lhr1', name: 'Europe (London)', location: 'Europe', latencyBaselineMs: 120, status: 'active' },
  { id: 'cdg1', name: 'Europe (Paris)', location: 'Europe', latencyBaselineMs: 130, status: 'active' },
  { id: 'hnd1', name: 'Asia (Tokyo)', location: 'Asia Pacific', latencyBaselineMs: 200, status: 'active' },
  { id: 'sin1', name: 'Asia (Singapore)', location: 'Asia Pacific', latencyBaselineMs: 180, status: 'active' },
  { id: 'syd1', name: 'Australia (Sydney)', location: 'Oceania', latencyBaselineMs: 220, status: 'active' },
  { id: 'gru1', name: 'South America (São Paulo)', location: 'South America', latencyBaselineMs: 250, status: 'planned' },
];

const EDGE_ENDPOINTS = [
  '/api/v1/classify',
  '/api/v1/calculate',
  '/api/v1/screen',
  '/api/v1/validate',
  '/api/v1/tax/us-sales-tax',
  '/api/v1/exchange-rate',
];

const COUNTRY_TO_REGION: Record<string, string> = {
  US: 'iad1', CA: 'iad1', MX: 'iad1',
  BR: 'iad1', AR: 'iad1', CL: 'iad1', CO: 'iad1',
  GB: 'lhr1', IE: 'lhr1',
  DE: 'cdg1', FR: 'cdg1', IT: 'cdg1', ES: 'cdg1', NL: 'cdg1', BE: 'cdg1',
  AT: 'cdg1', CH: 'cdg1', PL: 'cdg1', CZ: 'cdg1', SE: 'cdg1', DK: 'cdg1',
  JP: 'hnd1', KR: 'hnd1', CN: 'hnd1', TW: 'hnd1', HK: 'hnd1',
  AU: 'syd1', NZ: 'syd1',
  SG: 'sin1', TH: 'sin1', MY: 'sin1', ID: 'sin1', PH: 'sin1', VN: 'sin1', IN: 'sin1',
  AE: 'sin1', SA: 'sin1', IL: 'lhr1', TR: 'lhr1',
  ZA: 'lhr1', NG: 'lhr1', KE: 'lhr1',
};

function getRecommendation(country: string): { recommendedRegion: string; regionName: string; estimatedLatencyMs: number } {
  const regionId = COUNTRY_TO_REGION[country.toUpperCase()] || 'iad1';
  const region = REGIONS.find(r => r.id === regionId) || REGIONS[0];
  return {
    recommendedRegion: region.id,
    regionName: region.name,
    estimatedLatencyMs: region.latencyBaselineMs,
  };
}

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const country = (url.searchParams.get('country') || '').toUpperCase();

  const recommendation = country ? getRecommendation(country) : undefined;

  return apiSuccess({
    deployment: {
      primary: 'iad1',
      primaryName: 'US East (Virginia)',
      provider: 'Vercel',
      regions: REGIONS,
      activeRegions: REGIONS.filter(r => r.status === 'active').length,
    },
    edgeFunctions: {
      enabled: true,
      endpoints: EDGE_ENDPOINTS,
      count: EDGE_ENDPOINTS.length,
      note: 'Edge functions auto-route to nearest Vercel PoP for lowest latency.',
    },
    serverless: {
      region: 'iad1',
      note: 'Full API routes on US East. Supabase DB co-located in us-east-1.',
    },
    recommendation: recommendation ? {
      country,
      ...recommendation,
      note: `For ${country} users, ${recommendation.regionName} provides ~${recommendation.estimatedLatencyMs}ms baseline latency.`,
    } : undefined,
    supportedCountries: Object.keys(COUNTRY_TO_REGION).length,
  }, { sellerId: context.sellerId, plan: context.planId });
});
