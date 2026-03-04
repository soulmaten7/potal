/**
 * POTAL API v1 — /api/v1/docs
 *
 * Serves the OpenAPI 3.0 specification as JSON.
 * No authentication required — public documentation.
 */

import { openApiSpec } from './openapi';

export async function GET() {
  return Response.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
