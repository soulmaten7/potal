/**
 * POTAL API — Postman Collection v2.1 Export
 *
 * GET /api/v1/postman
 *
 * Converts the OpenAPI 3.0 spec at public/openapi.json into a
 * Postman Collection v2.1 JSON file for direct import into Postman.
 *
 * The converter extracts each endpoint's request body example (from
 * OpenAPI spec examples) and generates a pre-populated Postman request
 * with headers, URL parts, and body. All 8 endpoints covered.
 *
 * Usage:
 *   curl https://www.potal.app/api/v1/postman > potal.postman_collection.json
 *   then File → Import in Postman.
 *
 * CW38-S7 (2026-04-16 KST)
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface OpenApiOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: { $ref?: string };
        examples?: Record<string, { summary?: string; value: unknown }>;
      };
    };
  };
  responses?: Record<string, {
    description?: string;
    content?: {
      'application/json'?: {
        examples?: Record<string, { summary?: string; value: unknown }>;
      };
    };
  }>;
}

interface OpenApiSpec {
  info: { title: string; version: string; description?: string };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, {
      type?: string;
      required?: string[];
      properties?: Record<string, { type?: string; example?: unknown; enum?: string[] }>;
    }>;
  };
}

// Build a sample body from a schema $ref (fallback when no explicit example is provided)
function buildSampleFromSchema(
  schemaRef: string | undefined,
  spec: OpenApiSpec
): Record<string, unknown> {
  if (!schemaRef) return {};
  const schemaName = schemaRef.replace('#/components/schemas/', '');
  const schema = spec.components?.schemas?.[schemaName];
  if (!schema?.properties) return {};
  const sample: Record<string, unknown> = {};
  const required = new Set(schema.required || []);
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.example !== undefined) sample[key] = prop.example;
    else if (required.has(key)) {
      if (prop.type === 'number' || prop.type === 'integer') sample[key] = 0;
      else if (prop.type === 'boolean') sample[key] = false;
      else if (prop.type === 'array') sample[key] = [];
      else sample[key] = '';
    }
  }
  return sample;
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string; type: string }>;
    url: {
      raw: string;
      protocol: string;
      host: string[];
      path: string[];
    };
    body?: { mode: string; raw: string; options?: { raw: { language: string } } };
    description?: string;
  };
  response: Array<{
    name: string;
    originalRequest?: unknown;
    status: string;
    code: number;
    _postman_previewlanguage: string;
    header: Array<{ key: string; value: string }>;
    body: string;
  }>;
}

export async function GET() {
  try {
    const specPath = path.join(process.cwd(), 'public', 'openapi.json');
    const raw = await fs.readFile(specPath, 'utf-8');
    const spec: OpenApiSpec = JSON.parse(raw);

    const serverUrl = spec.servers[0]?.url || 'https://www.potal.app/api/v1';
    const urlObj = new URL(serverUrl);

    const items: PostmanRequest[] = [];

    for (const [endpointPath, ops] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(ops)) {
        const operation = op as OpenApiOperation;
        const fullUrl = `${serverUrl}${endpointPath}`;
        const u = new URL(fullUrl);
        const host = u.hostname.split('.');
        const urlPath = u.pathname.split('/').filter(Boolean);

        // Extract first request body example (or generate from schema)
        const reqExamples = operation.requestBody?.content?.['application/json']?.examples;
        let bodySample: Record<string, unknown> = {};
        if (reqExamples) {
          const firstKey = Object.keys(reqExamples)[0];
          bodySample = (reqExamples[firstKey]?.value || {}) as Record<string, unknown>;
        } else {
          bodySample = buildSampleFromSchema(
            operation.requestBody?.content?.['application/json']?.schema?.$ref,
            spec
          );
        }

        // Collect response examples as Postman saved responses
        const responses: PostmanRequest['response'] = [];
        for (const [statusCode, resp] of Object.entries(operation.responses || {})) {
          const examples = resp?.content?.['application/json']?.examples;
          if (!examples) continue;
          for (const [exName, ex] of Object.entries(examples)) {
            responses.push({
              name: ex.summary || `${statusCode} ${exName}`,
              status: statusCode === '200' ? 'OK' : statusCode === '400' ? 'Bad Request' : statusCode,
              code: parseInt(statusCode, 10) || 200,
              _postman_previewlanguage: 'json',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: JSON.stringify(ex.value, null, 2),
            });
          }
        }

        items.push({
          name: operation.summary || operation.operationId || endpointPath,
          request: {
            method: method.toUpperCase(),
            header: [
              { key: 'Content-Type', value: 'application/json', type: 'text' },
              { key: 'X-API-Key', value: '{{POTAL_API_KEY}}', type: 'text' },
              { key: 'Accept', value: 'application/json', type: 'text' },
            ],
            url: {
              raw: fullUrl,
              protocol: urlObj.protocol.replace(':', ''),
              host,
              path: urlPath,
            },
            body: method.toLowerCase() === 'get' ? undefined : {
              mode: 'raw',
              raw: JSON.stringify(bodySample, null, 2),
              options: { raw: { language: 'json' } },
            },
            description: operation.description,
          },
          response: responses,
        });
      }
    }

    const collection = {
      info: {
        _postman_id: 'potal-api-v1',
        name: spec.info.title,
        description: `${spec.info.description || ''}\n\nGenerated from OpenAPI 3.0 spec on ${new Date().toISOString()}.\n\nBefore use:\n1. Set the variable POTAL_API_KEY to your API key from https://www.potal.app/dashboard/api-keys\n2. Or replace the X-API-Key header with X-Demo-Request: true for 10 req/min demo access (no key needed).`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'POTAL_API_KEY',
          value: 'YOUR_API_KEY',
          type: 'string',
          description: 'Your POTAL API key (pk_live_... or sk_live_...)',
        },
      ],
      item: items,
    };

    return NextResponse.json(collection, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="potal-api.postman_collection.json"',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to generate Postman collection', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
