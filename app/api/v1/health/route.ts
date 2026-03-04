/**
 * POTAL API v1 — /api/v1/health
 *
 * Health check endpoint. No authentication required.
 * Used by uptime monitors, load balancers, and LLM platform health checks.
 */

import { getCountryCount } from '@/app/lib/cost-engine';

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'POTAL API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: {
        calculate: true,
        batch: true,
        countries: getCountryCount(),
      },
    },
    {
      headers: {
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
