/**
 * POTAL API v1 — /api/v1/documents/pdf
 *
 * Generate customs documents as PDF.
 * Same input schema as /api/v1/documents, returns PDF binary or base64.
 *
 * POST /api/v1/documents/pdf
 * Query: ?format=base64 (returns JSON with base64 PDF, for email attachment)
 * Body: same as /api/v1/documents
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { generateDocuments } from '@/app/lib/cost-engine/documents';
import type { GenerateDocumentInput, TradeParty } from '@/app/lib/cost-engine/documents';
import { generatePdf, generateMultiPagePdf } from '@/app/lib/cost-engine/documents/pdf-generator';
import { apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const VALID_DOC_TYPES = ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'required_documents', 'customs_declaration', 'both', 'all'] as const;
const VALID_INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const MAX_ITEMS = 100;
const MAX_TEXT_LENGTH = 500;

function sanitize(val: unknown, maxLen = MAX_TEXT_LENGTH): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/[<>{}|\\]/g, '').trim().slice(0, maxLen);
}

function parseParty(raw: Record<string, unknown>): TradeParty | null {
  const name = sanitize(raw.name);
  const country = sanitize(raw.country, 2).toUpperCase();
  if (!name || !country || country.length !== 2) return null;
  return {
    name, country,
    address: sanitize(raw.address) || undefined,
    city: sanitize(raw.city, 100) || undefined,
    state: sanitize(raw.state, 100) || undefined,
    postalCode: sanitize(raw.postalCode, 20) || undefined,
    phone: sanitize(raw.phone, 30) || undefined,
    email: sanitize(raw.email, 200) || undefined,
    taxId: sanitize(raw.taxId, 50) || undefined,
  };
}

function parseNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && isFinite(val) && val >= 0) return val;
  if (typeof val === 'string') { const n = parseFloat(val); if (isFinite(n) && n >= 0) return n; }
  return fallback;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const url = new URL(req.url);
  const outputFormat = url.searchParams.get('format') || 'binary';

  // Validate
  const docType = sanitize(body.type, 30);
  if (!VALID_DOC_TYPES.includes(docType as typeof VALID_DOC_TYPES[number])) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Invalid type. Must be one of: ${VALID_DOC_TYPES.join(', ')}`);
  }

  if (!body.exporter || typeof body.exporter !== 'object') return apiError(ApiErrorCode.BAD_REQUEST, 'exporter object required.');
  const exporter = parseParty(body.exporter as Record<string, unknown>);
  if (!exporter) return apiError(ApiErrorCode.BAD_REQUEST, 'exporter must have name and 2-letter country code.');

  if (!body.importer || typeof body.importer !== 'object') return apiError(ApiErrorCode.BAD_REQUEST, 'importer object required.');
  const importer = parseParty(body.importer as Record<string, unknown>);
  if (!importer) return apiError(ApiErrorCode.BAD_REQUEST, 'importer must have name and 2-letter country code.');

  if (!Array.isArray(body.items) || body.items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'items array required.');
  if (body.items.length > MAX_ITEMS) return apiError(ApiErrorCode.BAD_REQUEST, `Maximum ${MAX_ITEMS} items.`);

  const items: GenerateDocumentInput['items'] = [];
  for (let i = 0; i < body.items.length; i++) {
    const raw = body.items[i];
    if (!raw || typeof raw !== 'object') return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i} invalid.`);
    const r = raw as Record<string, unknown>;
    const description = sanitize(r.description);
    const quantity = parseNumber(r.quantity, 0);
    const unitPrice = parseNumber(r.unitPrice, 0);
    if (!description) return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i}: description required.`);
    if (quantity <= 0) return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i}: quantity must be > 0.`);
    if (unitPrice <= 0) return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i}: unitPrice must be > 0.`);

    let dimensionsCm: { length: number; width: number; height: number } | undefined;
    if (r.dimensionsCm && typeof r.dimensionsCm === 'object') {
      const d = r.dimensionsCm as Record<string, unknown>;
      dimensionsCm = { length: parseNumber(d.length), width: parseNumber(d.width), height: parseNumber(d.height) };
    }

    items.push({
      description, hsCode: sanitize(r.hsCode, 12) || undefined,
      quantity, unitPrice,
      countryOfOrigin: sanitize(r.countryOfOrigin, 2).toUpperCase() || undefined,
      weightKg: r.weightKg ? parseNumber(r.weightKg) : undefined,
      category: sanitize(r.category, 200) || undefined,
      dimensionsCm,
    });
  }

  const incoterm = sanitize(body.incoterm, 3).toUpperCase() || 'FOB';
  if (!VALID_INCOTERMS.includes(incoterm)) return apiError(ApiErrorCode.BAD_REQUEST, `Invalid incoterm.`);

  const input: GenerateDocumentInput = {
    type: docType as GenerateDocumentInput['type'],
    exporter, importer, items,
    shippingCost: parseNumber(body.shippingCost),
    insuranceCost: parseNumber(body.insuranceCost),
    incoterm,
    currency: sanitize(body.currency, 3).toUpperCase() || 'USD',
    paymentTerms: sanitize(body.paymentTerms, 200) || undefined,
    shippingMethod: sanitize(body.shippingMethod, 100) || undefined,
    notes: sanitize(body.notes, 1000) || undefined,
  };

  try {
    const result = await generateDocuments(input, context.sellerId);

    const isMulti = docType === 'both' || docType === 'all';
    const pdfBytes = isMulti
      ? await generateMultiPagePdf(result)
      : await generatePdf(result, { documentType: docType });

    const dateTag = new Date().toISOString().split('T')[0];
    const filename = `POTAL_${docType}_${dateTag}.pdf`;

    if (outputFormat === 'base64') {
      const base64 = Buffer.from(pdfBytes).toString('base64');
      return Response.json({
        success: true,
        data: {
          filename,
          contentType: 'application/pdf',
          base64,
          sizeBytes: pdfBytes.length,
        },
        meta: { sellerId: context.sellerId, plan: context.planId },
      });
    }

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed.';
    return apiError(ApiErrorCode.INTERNAL_ERROR, message);
  }
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Same body as /api/v1/documents. Query: ?format=base64 for JSON response with base64 PDF.');
}
