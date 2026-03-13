/**
 * POTAL API v1 — /api/v1/customs/declaration
 *
 * Automated customs declaration preparation.
 * Generates pre-filled customs declaration data with TLC calculation,
 * HS classification, and duty/tax computation.
 *
 * POST /api/v1/customs/declaration
 * Body: {
 *   exporter: { name, address, country, taxId? },
 *   importer: { name, address, country, taxId?, eoriNumber? },
 *   items: [{ description, hsCode?, quantity, unitPrice, weightKg?, countryOfOrigin? }],
 *   shippingCost?: number,
 *   insuranceCost?: number,
 *   incoterm?: string,
 *   currency?: string,
 *   transportDocumentRef?: string,
 *   iossNumber?: string,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { generateDocuments } from '@/app/lib/cost-engine/documents';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import type { TradeParty } from '@/app/lib/cost-engine/documents/types';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const exporter = body.exporter as TradeParty | undefined;
  const importer = body.importer as TradeParty | undefined;
  const items = body.items as Array<Record<string, unknown>> | undefined;

  if (!exporter?.name || !exporter?.country) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"exporter" with name and country is required.');
  }
  if (!importer?.name || !importer?.country) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"importer" with name and country is required.');
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"items" array with at least one item is required.');
  }

  const result = await generateDocuments({
    type: 'customs_declaration',
    exporter,
    importer,
    items: items.map(item => ({
      description: String(item.description || ''),
      hsCode: item.hsCode ? String(item.hsCode) : undefined,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      weightKg: item.weightKg ? Number(item.weightKg) : undefined,
      countryOfOrigin: item.countryOfOrigin ? String(item.countryOfOrigin) : undefined,
    })),
    shippingCost: typeof body.shippingCost === 'number' ? body.shippingCost : undefined,
    insuranceCost: typeof body.insuranceCost === 'number' ? body.insuranceCost : undefined,
    incoterm: typeof body.incoterm === 'string' ? body.incoterm : undefined,
    currency: typeof body.currency === 'string' ? body.currency : undefined,
  });

  if (!result.customsDeclaration) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to generate customs declaration.');
  }

  return apiSuccess(
    {
      declaration: result.customsDeclaration,
      status: 'prepared',
      note: 'Declaration data prepared for submission. Review all fields before filing with customs authority.',
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { exporter: {name, country}, importer: {name, country}, items: [{description, quantity, unitPrice}] }');
}
