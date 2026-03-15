import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { generateDocuments } from '@/app/lib/cost-engine/documents/generate';
import { generateMultiPagePdf } from '@/app/lib/cost-engine/documents/pdf-generator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const format = typeof body.format === 'string' ? body.format : 'json';

  try {
    const result = await generateDocuments(body as unknown as Parameters<typeof generateDocuments>[0]);

    if (format === 'pdf') {
      const pdfBytes = await generateMultiPagePdf(result);
      return new Response(Buffer.from(pdfBytes), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="customs-documents-bundle.pdf"' },
      });
    }

    return apiSuccess({
      documents: result,
      bundle: true,
      generated_at: new Date().toISOString(),
    }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Document bundle generation failed.');
  }
});
