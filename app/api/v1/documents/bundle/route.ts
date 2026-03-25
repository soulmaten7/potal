/**
 * POTAL API v1 — POST /api/v1/documents/bundle
 *
 * Generate multiple customs documents in a single request.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { generateDocuments } from '@/app/lib/cost-engine/documents/generate';

const VALID_DOC_TYPES = ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'required_documents', 'customs_declaration'];

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const types = Array.isArray(body.types) ? body.types as string[] : [];
  if (types.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'types array is required. Valid: ' + VALID_DOC_TYPES.join(', '));
  }

  const invalid = types.filter(t => !VALID_DOC_TYPES.includes(t));
  if (invalid.length > 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Invalid document types: ${invalid.join(', ')}`);
  }

  const shipment = body.shipment as Record<string, unknown> | undefined;
  if (!shipment) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'shipment object is required.');
  }

  try {
    const allResult = await generateDocuments(
      { ...shipment, type: 'all' } as Parameters<typeof generateDocuments>[0],
      ctx.sellerId
    );

    const documents: Record<string, unknown>[] = [];
    for (const docType of types) {
      const docData =
        docType === 'commercial_invoice' ? allResult.commercialInvoice :
        docType === 'packing_list' ? allResult.packingList :
        docType === 'certificate_of_origin' ? allResult.certificateOfOrigin :
        docType === 'required_documents' ? allResult.requiredDocuments :
        docType === 'customs_declaration' ? allResult.customsDeclaration : null;

      documents.push({ type: docType, data: docData || null });
    }

    return apiSuccess({
      documents,
      documentCount: documents.length,
      warnings: allResult.warnings,
      itemsRequiringAttention: allResult.itemsRequiringAttention,
      metadata: allResult.documentMetadata,
    }, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Bundle generation failed.');
  }
});
