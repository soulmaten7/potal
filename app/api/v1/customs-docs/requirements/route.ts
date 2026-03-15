/**
 * POTAL API v1 — /api/v1/customs-docs/requirements
 * GET ?origin=CN&destination=US — Required documents for a trade route
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface DocRequirement {
  required: string[];
  conditional: { doc: string; condition: string }[];
  optional: string[];
  notes: string[];
}

const BASE_REQUIRED = ['commercial_invoice', 'packing_list'];

const DESTINATION_DOCS: Record<string, Partial<DocRequirement>> = {
  US: {
    required: ['customs_bond', 'isf_10+2'],
    conditional: [
      { doc: 'fda_prior_notice', condition: 'Food products (HS 01-24)' },
      { doc: 'fcc_declaration', condition: 'Electronics (HS 85)' },
      { doc: 'lacey_act_declaration', condition: 'Plant/wood products' },
    ],
    notes: ['ISF filing required 24h before vessel loading', 'Customs bond required for entries >$2,500'],
  },
  EU: {
    required: ['eur1_or_self_cert'],
    conditional: [
      { doc: 'ce_marking_declaration', condition: 'Regulated products' },
      { doc: 'reach_compliance', condition: 'Chemical substances' },
      { doc: 'ics2_entry_summary', condition: 'All imports (Release 3)' },
    ],
    notes: ['ICS2 Release 3 requires HS6 + 300-char description', 'EUR.1 or self-certification for FTA preference'],
  },
  GB: {
    required: ['customs_declaration_c88'],
    conditional: [
      { doc: 'ukca_declaration', condition: 'Regulated products' },
      { doc: 'health_certificate', condition: 'Animal products' },
    ],
    notes: ['Full customs declarations required post-Brexit'],
  },
  CA: {
    required: ['canada_customs_invoice'],
    conditional: [
      { doc: 'nafta_certificate_of_origin', condition: 'CUSMA/USMCA preference claim' },
      { doc: 'cfia_permit', condition: 'Food/animal/plant products' },
    ],
  },
  AU: {
    required: ['import_declaration'],
    conditional: [
      { doc: 'phytosanitary_certificate', condition: 'Plant products' },
      { doc: 'bicon_permit', condition: 'Biosecurity risk items' },
    ],
    notes: ['Strict biosecurity controls — declare all organic materials'],
  },
  JP: {
    required: ['import_declaration_customs'],
    conditional: [
      { doc: 'food_sanitation_certificate', condition: 'Food products' },
      { doc: 'pse_mark', condition: 'Electrical appliances' },
    ],
  },
  KR: {
    required: ['import_declaration_kcs'],
    conditional: [
      { doc: 'kc_certification', condition: 'Electronics/appliances' },
      { doc: 'quarantine_certificate', condition: 'Agricultural products' },
    ],
  },
};

const FTA_DOCS: Record<string, string> = {
  'CN-ASEAN': 'ASEAN-China FTA Form E',
  'RCEP': 'RCEP Certificate of Origin',
  'CPTPP': 'CPTPP Certificate of Origin',
  'USMCA': 'USMCA Certificate of Origin',
  'EU-UK_TCA': 'Statement on Origin',
};

export const GET = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const origin = (url.searchParams.get('origin') || '').toUpperCase();
  const destination = (url.searchParams.get('destination') || '').toUpperCase();

  if (!origin || !destination) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'origin and destination query params required.');
  }

  const destDocs = DESTINATION_DOCS[destination] || {};
  const required = [...BASE_REQUIRED, ...(destDocs.required || [])];
  const conditional = [
    { doc: 'certificate_of_origin', condition: 'FTA preference claim' },
    { doc: 'bill_of_lading', condition: 'Sea freight' },
    { doc: 'air_waybill', condition: 'Air freight' },
    ...(destDocs.conditional || []),
  ];
  const optional = ['insurance_certificate', 'inspection_certificate', 'weight_certificate'];
  const notes = destDocs.notes || [];

  // Check if FTA docs needed
  const ftaDocs = Object.entries(FTA_DOCS)
    .filter(([key]) => {
      if (key === 'USMCA' && ['US', 'MX', 'CA'].includes(origin) && ['US', 'MX', 'CA'].includes(destination)) return true;
      if (key === 'EU-UK_TCA' && (['EU'].includes(origin) || destination === 'GB')) return true;
      return false;
    })
    .map(([, doc]) => doc);

  if (ftaDocs.length > 0) {
    conditional.push(...ftaDocs.map(d => ({ doc: d, condition: 'FTA preference claim' })));
  }

  return apiSuccess({
    origin,
    destination,
    required,
    conditional,
    optional,
    notes,
    total_documents: required.length + conditional.length + optional.length,
  }, { sellerId: _ctx.sellerId });
});
