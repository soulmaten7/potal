/**
 * POTAL API v1 — /api/v1/customs/declaration
 *
 * Customs declaration preparation.
 * 7 country formats: US CBP-7501, EU SAD, UK CDS, JP NACCS, KR UNI-PASS, AU ICS, CA B3
 * Includes HS digit validation per country and XML output option.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { generateDocuments } from '@/app/lib/cost-engine/documents';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import type { TradeParty } from '@/app/lib/cost-engine/documents/types';

// ─── Country Templates ───────────────────────────────

interface DeclarationTemplate {
  form: string;
  name: string;
  minHsDigits: number;
}

const TEMPLATES: Record<string, DeclarationTemplate> = {
  US: { form: 'CBP-7501', name: 'Entry Summary', minHsDigits: 10 },
  EU: { form: 'SAD', name: 'Single Administrative Document', minHsDigits: 8 },
  GB: { form: 'CDS', name: 'Customs Declaration Service', minHsDigits: 10 },
  JP: { form: 'NACCS', name: 'Import Declaration', minHsDigits: 9 },
  KR: { form: 'UNI-PASS', name: '수입신고서', minHsDigits: 10 },
  AU: { form: 'ICS', name: 'Import Declaration N10', minHsDigits: 8 },
  CA: { form: 'B3', name: 'Customs Coding Form B3', minHsDigits: 10 },
};

const EU_MEMBERS = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);

function getTemplate(country: string): DeclarationTemplate {
  if (TEMPLATES[country]) return TEMPLATES[country];
  if (EU_MEMBERS.has(country)) return TEMPLATES.EU;
  return { form: 'GENERIC', name: 'Import Declaration', minHsDigits: 6 };
}

// ─── XML ─────────────────────────────────────────────

function toXml(obj: Record<string, unknown>, form: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<CustomsDeclaration form="${form}">\n`;
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      xml += `  <${k}>\n`;
      for (const item of v) {
        xml += `    <item>`;
        if (typeof item === 'object' && item) {
          for (const [ik, iv] of Object.entries(item as Record<string, unknown>)) {
            xml += `<${ik}>${esc(String(iv ?? ''))}</${ik}>`;
          }
        } else { xml += esc(String(item)); }
        xml += `</item>\n`;
      }
      xml += `  </${k}>\n`;
    } else if (typeof v === 'object') {
      xml += `  <${k}>`;
      for (const [ok, ov] of Object.entries(v as Record<string, unknown>)) {
        xml += `<${ok}>${esc(String(ov ?? ''))}</${ok}>`;
      }
      xml += `</${k}>\n`;
    } else {
      xml += `  <${k}>${esc(String(v))}</${k}>\n`;
    }
  }
  return xml + `</CustomsDeclaration>`;
}

// ─── Handler ─────────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const format = typeof body.format === 'string' ? body.format.toLowerCase() : 'json';
  if (!['json', 'xml'].includes(format)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"format" must be "json" or "xml".');
  }

  const exporter = body.exporter as TradeParty | undefined;
  const importer = body.importer as TradeParty | undefined;
  const items = body.items as Array<Record<string, unknown>> | undefined;

  if (!exporter?.name || !exporter?.country) return apiError(ApiErrorCode.BAD_REQUEST, '"exporter" with name and country required.');
  if (!importer?.name || !importer?.country) return apiError(ApiErrorCode.BAD_REQUEST, '"importer" with name and country required.');
  if (!items || !Array.isArray(items) || items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, '"items" array required.');

  const dest = importer.country.toUpperCase();
  const tmpl = getTemplate(dest);

  // HS digit validation (C4)
  for (let i = 0; i < items.length; i++) {
    const hs = items[i].hsCode ? String(items[i].hsCode).replace(/[^0-9]/g, '') : '';
    if (hs && hs.length < tmpl.minHsDigits) {
      return apiError(ApiErrorCode.BAD_REQUEST,
        `Item ${i + 1}: HS code needs ${tmpl.minHsDigits}+ digits for ${dest} (${tmpl.form}). Got ${hs.length}.`);
    }
  }

  try {
    const result = await generateDocuments({
      type: 'customs_declaration',
      exporter, importer,
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
    }, ctx.sellerId);

    if (!result.customsDeclaration) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Declaration generation failed.');
    }

    const decl = {
      ...result.customsDeclaration,
      formType: tmpl.form,
      formName: tmpl.name,
      destinationCountry: dest,
      warnings: result.warnings,
      itemsRequiringAttention: result.itemsRequiringAttention,
      metadata: result.documentMetadata,
    };

    if (format === 'xml') {
      return new Response(toXml(decl as unknown as Record<string, unknown>, tmpl.form), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="${tmpl.form}_${Date.now()}.xml"`,
        },
      });
    }

    return apiSuccess({
      declaration: decl,
      template: { form: tmpl.form, name: tmpl.name, minHsDigits: tmpl.minHsDigits },
      status: 'prepared',
      note: 'Review all fields before filing with customs authority.',
    }, { sellerId: ctx.sellerId, plan: ctx.planId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Declaration failed.');
  }
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { exporter, importer, items, format?: "json"|"xml" }');
}
