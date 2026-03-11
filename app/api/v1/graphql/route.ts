/**
 * POTAL API v1 — /api/v1/graphql
 *
 * Lightweight GraphQL endpoint wrapping existing REST APIs.
 * Supports: calculate, classify, restrictions, countries queries.
 *
 * POST /api/v1/graphql
 * Body: { query: "...", variables?: {...} }
 * Headers: X-API-Key: pk_live_... or sk_live_...
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
import { checkRestrictions } from '@/app/lib/cost-engine/restrictions';
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';
import { apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Simple GraphQL-like Query Parser ──────────────

interface ParsedQuery {
  operation: string;
  args: Record<string, unknown>;
}

function parseSimpleGraphQL(query: string, variables?: Record<string, unknown>): ParsedQuery | null {
  // Replace variables
  let q = query;
  if (variables) {
    for (const [key, val] of Object.entries(variables)) {
      q = q.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(val));
    }
  }

  // Match: { operationName(args) { fields } } or query { operationName(args) { fields } }
  const match = q.match(/(?:query\s*\{?\s*)?(\w+)\s*\(([^)]*)\)/);
  if (!match) return null;

  const operation = match[1];
  const argsStr = match[2];

  // Parse arguments: key: value, key: "string"
  const args: Record<string, unknown> = {};
  const argMatches = argsStr.matchAll(/(\w+)\s*:\s*("(?:[^"\\]|\\.)*"|[\d.]+|true|false|\$\w+)/g);
  for (const m of argMatches) {
    const key = m[1];
    let val: unknown = m[2];
    if (typeof val === 'string' && val.startsWith('"')) {
      val = val.slice(1, -1);
    } else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (typeof val === 'string' && !isNaN(Number(val))) val = Number(val);
    args[key] = val;
  }

  return { operation, args };
}

// ─── Handlers ──────────────────────────────────────

async function handleCalculate(args: Record<string, unknown>, context: ApiAuthContext) {
  const input: GlobalCostInput = {
    price: (args.price as number) || 0,
    shippingPrice: (args.shippingPrice as number) || 0,
    origin: (args.origin as string) || undefined,
    destinationCountry: (args.destinationCountry as string) || 'US',
    hsCode: (args.hsCode as string) || undefined,
    productName: (args.productName as string) || undefined,
    zipcode: (args.zipcode as string) || undefined,
    shippingTerms: (args.shippingTerms as 'DDP' | 'DDU') || undefined,
  };

  return calculateGlobalLandedCostAsync(input);
}

async function handleClassify(args: Record<string, unknown>, context: ApiAuthContext) {
  const productName = (args.productName as string) || '';
  if (!productName) throw new Error('productName is required');
  return classifyProductAsync(productName, (args.hsCode as string) || undefined, context.sellerId);
}

function handleRestrictions(args: Record<string, unknown>) {
  const hsCode = (args.hsCode as string) || '';
  const dest = (args.destinationCountry as string) || '';
  if (!hsCode || !dest) throw new Error('hsCode and destinationCountry are required');
  return checkRestrictions(hsCode, dest);
}

// ─── POST Handler ──────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const query = typeof body.query === 'string' ? body.query : '';
  const variables = typeof body.variables === 'object' ? body.variables as Record<string, unknown> : undefined;

  if (!query) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'query field is required.');
  }

  const parsed = parseSimpleGraphQL(query, variables);
  if (!parsed) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Could not parse GraphQL query. Supported operations: calculate, classify, restrictions.');
  }

  try {
    let data: unknown;

    switch (parsed.operation) {
      case 'calculate':
      case 'landedCost':
        data = await handleCalculate(parsed.args, context);
        break;
      case 'classify':
      case 'hsClassify':
        data = await handleClassify(parsed.args, context);
        break;
      case 'restrictions':
      case 'checkRestrictions':
        data = handleRestrictions(parsed.args);
        break;
      default:
        return apiError(ApiErrorCode.BAD_REQUEST, `Unknown operation: ${parsed.operation}. Supported: calculate, classify, restrictions.`);
    }

    return NextResponse.json({
      data: { [parsed.operation]: data },
    });
  } catch (error: any) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, error.message || 'Query execution failed.');
  }
});

export async function GET() {
  return NextResponse.json({
    message: 'POTAL GraphQL API',
    usage: 'POST with { query: "{ calculate(price: 100, destinationCountry: \\"DE\\", origin: \\"CN\\") { totalLandedCost importDuty vat } }" }',
    operations: ['calculate', 'classify', 'restrictions'],
    docs: 'https://www.potal.app/developers/docs',
  });
}
