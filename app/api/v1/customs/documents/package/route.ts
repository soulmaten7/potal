/**
 * POTAL API v1 — /api/v1/customs/documents/package
 *
 * C3: Returns required customs document checklist by destination country.
 * Each document includes required fields and form references.
 *
 * POST /api/v1/customs/documents/package
 * Body: { destinationCountry: string, originCountry?: string, hsCode?: string, value?: number }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface DocumentRequirement {
  document: string;
  form?: string;
  required: boolean;
  fields: string[];
  notes?: string;
}

const BASE_DOCUMENTS: DocumentRequirement[] = [
  {
    document: 'Commercial Invoice',
    required: true,
    fields: ['Seller name/address', 'Buyer name/address', 'Product description', 'HS code', 'Quantity', 'Unit price', 'Total value', 'Currency', 'Country of origin', 'Incoterms', 'Date'],
  },
  {
    document: 'Packing List',
    required: true,
    fields: ['Package count', 'Gross weight per package', 'Net weight', 'Dimensions', 'Contents description', 'Package marks/numbers'],
  },
  {
    document: 'Bill of Lading / Airway Bill',
    required: true,
    fields: ['Shipper', 'Consignee', 'Notify party', 'Port of loading', 'Port of discharge', 'Description of goods', 'Number of packages', 'Gross weight'],
  },
];

const COUNTRY_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  US: [
    { document: 'CBP Form 3461', form: 'CBP-3461', required: true, fields: ['Entry number', 'Importer of record', 'Consignee', 'Port of entry', 'HS code (10-digit)', 'Value', 'Country of origin'], notes: 'Entry/Immediate Delivery' },
    { document: 'CBP Form 7501', form: 'CBP-7501', required: true, fields: ['Entry number', 'Importer EIN/SSN', 'HS code (10-digit)', 'Duty rate', 'Entered value', 'Duty amount', 'MPF', 'HMF'], notes: 'Entry Summary' },
    { document: 'CBP Form 3461 ALT', form: 'CBP-3461ALT', required: false, fields: ['Same as 3461'], notes: 'Alternative Entry for informal entries' },
    { document: 'Customs Bond', required: true, fields: ['Bond type (single/continuous)', 'Bond amount', 'Surety company'], notes: 'Required for formal entries over $2,500' },
  ],
  EU: [
    { document: 'Single Administrative Document (SAD)', form: 'SAD/C88', required: true, fields: ['Declarant EORI', 'Consignee EORI', 'HS code (8-digit CN)', 'Customs value', 'Origin', 'Preference code', 'Previous procedure', 'Tax base'], notes: 'EU customs declaration' },
    { document: 'CN22 / CN23', required: false, fields: ['Sender', 'Addressee', 'Content description', 'Value', 'Weight', 'HS code'], notes: 'For postal items. CN22 for items <300 SDR, CN23 for >300 SDR' },
    { document: 'ICS2 Entry Summary Declaration', form: 'ENS', required: true, fields: ['Consignor', 'Consignee', 'HS code (6-digit)', 'Gross mass', 'Transport document', 'MRN'], notes: 'Pre-arrival filing. Release 3 mandatory for all consignments.' },
  ],
  UK: [
    { document: 'Customs Declaration (CDS)', form: 'C88', required: true, fields: ['EORI number', 'Commodity code (10-digit)', 'Customs value', 'Country of origin', 'Preference claim', 'VAT rate'], notes: 'HMRC Customs Declaration Service' },
    { document: 'Import VAT Statement', required: true, fields: ['Import VAT amount', 'Duty amount', 'VAT registration number'], notes: 'Postponed VAT Accounting available' },
  ],
  JP: [
    { document: 'Import Declaration (輸入申告書)', form: 'NACCS-IDA', required: true, fields: ['Declarant code', 'HS code (9-digit)', 'CIF value (JPY)', 'Country of origin', 'Customs duty', 'Consumption tax'], notes: 'Filed via NACCS system' },
  ],
  KR: [
    { document: 'Import Declaration (수입신고서)', form: 'UNI-PASS', required: true, fields: ['Importer business number', 'HS code (10-digit HSK)', 'CIF value (KRW)', 'Country of origin', 'FTA preference'], notes: 'Filed via UNI-PASS' },
  ],
  CA: [
    { document: 'Customs Coding Form', form: 'B3', required: true, fields: ['Transaction number', 'Importer account', 'HS code (10-digit)', 'Value for duty', 'Duty rate', 'GST/HST', 'Country of origin'], notes: 'CBSA B3 declaration' },
    { document: 'ACI eManifest', required: true, fields: ['Cargo control number', 'House bill', 'Shipper/Consignee', 'HS code', 'Value'], notes: 'Advance Commercial Information pre-arrival' },
  ],
  AU: [
    { document: 'Import Declaration', form: 'N10', required: true, fields: ['ABN', 'HS code (8-digit)', 'Customs value (AUD)', 'Country of origin', 'Duty rate', 'GST'], notes: 'ABF Integrated Cargo System' },
  ],
};

// Certificate of Origin — required for FTA preference claims
const CERTIFICATE_OF_ORIGIN: DocumentRequirement = {
  document: 'Certificate of Origin',
  required: false,
  fields: ['Exporter name/address', 'Producer name/address', 'Importer name/address', 'HS code', 'Origin criteria', 'Blanket period (if applicable)', 'Signature'],
  notes: 'Required to claim preferential (FTA) duty rates. Format varies by agreement.',
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';
  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : undefined;
  const value = typeof body.value === 'number' ? body.value : undefined;

  if (!destinationCountry || destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" must be 2-letter ISO code.');
  }

  const countrySpecific = COUNTRY_DOCUMENTS[destinationCountry] || [];
  const documents = [...BASE_DOCUMENTS, ...countrySpecific];

  // Add Certificate of Origin if FTA might apply
  if (originCountry) {
    documents.push({
      ...CERTIFICATE_OF_ORIGIN,
      notes: `May be required for FTA preference between ${originCountry} and ${destinationCountry}.`,
    });
  }

  // De minimis: some docs not needed for low-value
  let deMinimisNote: string | undefined;
  if (value !== undefined && destinationCountry === 'US' && value <= 800) {
    deMinimisNote = 'Value ≤$800: Section 321 (Type86) entry may apply. Formal entry documents (CBP 3461/7501/Bond) not required.';
  }

  return apiSuccess({
    destinationCountry,
    originCountry: originCountry || null,
    documents: documents.map(d => ({
      ...d,
      requiredFieldCount: d.fields.length,
    })),
    totalDocuments: documents.length,
    requiredDocuments: documents.filter(d => d.required).length,
    deMinimisNote,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { destinationCountry, originCountry?, value? }');
}
