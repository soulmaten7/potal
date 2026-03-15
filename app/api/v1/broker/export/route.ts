import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { exportABI, exportCSV, exportXML, generatePreFilingChecklist } from '@/app/lib/trade/broker-data-export';
import type { BrokerExportData } from '@/app/lib/trade/broker-data-export';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const format = typeof body.format === 'string' ? body.format : 'json';

  const importer = body.importer as Record<string, unknown> | undefined;
  const exporter = body.exporter as Record<string, unknown> | undefined;

  if (!importer || !exporter || !Array.isArray(body.items)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'importer, exporter, items required.');
  }

  try {
    const data: BrokerExportData = {
      importer: { name: String(importer.name || ''), country: String(importer.country || ''), taxId: typeof importer.tax_id === 'string' ? importer.tax_id : undefined },
      exporter: { name: String(exporter.name || ''), country: String(exporter.country || '') },
      items: (body.items as Record<string, unknown>[]).map(i => ({
        hsCode: String(i.hs_code || ''),
        description: String(i.description || ''),
        value: Number(i.value || 0),
        quantity: Number(i.quantity || 1),
        origin: String(i.origin || ''),
        weight: typeof i.weight === 'number' ? i.weight : undefined,
      })),
      totals: {
        declaredValue: typeof body.declared_value === 'number' ? body.declared_value : 0,
        estimatedDuty: typeof body.estimated_duty === 'number' ? body.estimated_duty : 0,
        estimatedVat: typeof body.estimated_vat === 'number' ? body.estimated_vat : 0,
      },
      incoterm: typeof body.incoterm === 'string' ? body.incoterm : 'FOB',
      currency: typeof body.currency === 'string' ? body.currency : 'USD',
    };

    if (format === 'abi') {
      return new Response(exportABI(data), { headers: { 'Content-Type': 'text/plain', 'Content-Disposition': 'attachment; filename="customs-entry.abi"' } });
    }
    if (format === 'csv') {
      return new Response(exportCSV(data), { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="customs-entry.csv"' } });
    }
    if (format === 'xml') {
      return new Response(exportXML(data), { headers: { 'Content-Type': 'application/xml', 'Content-Disposition': 'attachment; filename="customs-entry.xml"' } });
    }

    const checklist = generatePreFilingChecklist(data);
    return apiSuccess({ data, checklist, formats_available: ['json', 'abi', 'csv', 'xml'] }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Export failed.');
  }
});
