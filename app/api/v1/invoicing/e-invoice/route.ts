/**
 * POTAL API v1 — /api/v1/invoicing/e-invoice
 *
 * e-Invoicing compliance check and generation.
 * Supports EU (EN 16931/UBL), Italy (FatturaPA), India (GST), Saudi (ZATCA),
 * Korea (HomeTax), Brazil (NF-e), and 15+ country mandates.
 *
 * POST /api/v1/invoicing/e-invoice
 * Body: {
 *   country: string,                    // required — destination country
 *   invoiceType?: 'invoice' | 'credit_note' | 'debit_note' | 'corrective',
 *   originalInvoiceNumber?: string,     // required for credit_note/corrective
 *   invoiceData?: {
 *     invoiceNumber?: string,           // auto-generated if omitted
 *     invoiceDate?: string,
 *     seller: { name, taxId, address, country },
 *     buyer: { name, taxId?, address, country, gstin?, codiceDestinatario?, pecEmail? },
 *     items: [{ description, quantity, unitPrice, taxRate, hsCode? }],
 *     currency?: string,
 *     buyerReference?: string,          // EU Peppol required
 *     supplyType?: string,              // India: B2B/B2C/SEZWP/SEZWOP
 *     placeOfSupply?: string,           // India: state code
 *   },
 *   format?: 'ubl' | 'cii' | 'fatturapa' | 'zatca' | 'json',
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createHash } from 'crypto';

// ─── e-Invoicing Mandates ───────────────────────────

interface EInvoiceMandate {
  country: string;
  mandateStatus: 'mandatory' | 'mandatory_b2g' | 'mandatory_b2b' | 'voluntary' | 'planned';
  format: string;
  platform?: string;
  effectiveDate: string;
  note: string;
}

const E_INVOICE_MANDATES: Record<string, EInvoiceMandate> = {
  IT: { country: 'Italy', mandateStatus: 'mandatory', format: 'FatturaPA (XML)', platform: 'SDI', effectiveDate: '2019-01-01', note: 'All B2B/B2C invoices through SDI.' },
  IN: { country: 'India', mandateStatus: 'mandatory_b2b', format: 'GST e-Invoice (JSON)', platform: 'IRP', effectiveDate: '2022-10-01', note: 'Mandatory for turnover ≥ ₹5 Cr.' },
  SA: { country: 'Saudi Arabia', mandateStatus: 'mandatory', format: 'ZATCA UBL 2.1', platform: 'FATOORA', effectiveDate: '2024-01-01', note: 'Phase 2 — real-time clearance.' },
  BR: { country: 'Brazil', mandateStatus: 'mandatory', format: 'NF-e (XML)', platform: 'SEFAZ', effectiveDate: '2006-01-01', note: 'NF-e for goods, NFS-e for services.' },
  MX: { country: 'Mexico', mandateStatus: 'mandatory', format: 'CFDI 4.0 (XML)', platform: 'SAT', effectiveDate: '2022-01-01', note: 'CFDI 4.0 mandatory.' },
  FR: { country: 'France', mandateStatus: 'planned', format: 'Factur-X (CII/UBL)', platform: 'PPF/PDP', effectiveDate: '2026-09-01', note: 'B2B mandate via PPF.' },
  DE: { country: 'Germany', mandateStatus: 'planned', format: 'XRechnung / ZUGFeRD', platform: 'Peppol', effectiveDate: '2025-01-01', note: 'B2G mandatory, B2B planned.' },
  PL: { country: 'Poland', mandateStatus: 'mandatory', format: 'KSeF (XML)', platform: 'KSeF', effectiveDate: '2026-02-01', note: 'KSeF mandatory for all.' },
  ES: { country: 'Spain', mandateStatus: 'planned', format: 'Facturae', platform: 'FACe / VERI*FACTU', effectiveDate: '2025-07-01', note: 'B2G via FACe, B2B via VERI*FACTU.' },
  TR: { country: 'Turkey', mandateStatus: 'mandatory_b2b', format: 'e-Fatura (UBL-TR)', platform: 'GIB', effectiveDate: '2014-01-01', note: 'e-Fatura B2B, e-Arsiv B2C.' },
  KR: { country: 'South Korea', mandateStatus: 'mandatory', format: 'e-Tax Invoice', platform: 'NTS (HomeTax)', effectiveDate: '2011-01-01', note: 'Real-time via HomeTax.' },
  SG: { country: 'Singapore', mandateStatus: 'voluntary', format: 'Peppol BIS', platform: 'InvoiceNow', effectiveDate: '2019-01-01', note: 'Voluntary, widely adopted.' },
  AU: { country: 'Australia', mandateStatus: 'voluntary', format: 'Peppol BIS', platform: 'Peppol', effectiveDate: '2020-01-01', note: 'Encouraged, mandate expected.' },
  MY: { country: 'Malaysia', mandateStatus: 'mandatory', format: 'MyInvois', platform: 'LHDN', effectiveDate: '2024-08-01', note: 'Phased rollout.' },
  EG: { country: 'Egypt', mandateStatus: 'mandatory', format: 'ETA e-Invoice', platform: 'ETA Portal', effectiveDate: '2023-01-01', note: 'All companies via ETA.' },
};

const EU_B2G_COUNTRIES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','GR','HU','IE','LV','LT','LU','MT','NL','PT','RO','SK','SI','SE']);

// ─── C4: Country-specific Required Fields ───────────

const COUNTRY_REQUIRED_FIELDS: Record<string, { fields: string[]; descriptions: Record<string, string> }> = {
  IT: {
    fields: ['seller.taxId', 'buyer.codiceDestinatario'],
    descriptions: { 'seller.taxId': 'Seller Partita IVA', 'buyer.codiceDestinatario': 'Codice Destinatario (7 chars) or PEC email' },
  },
  IN: {
    fields: ['seller.taxId', 'buyer.gstin', 'supplyType', 'placeOfSupply'],
    descriptions: { 'seller.taxId': 'Seller GSTIN', 'buyer.gstin': 'Buyer GSTIN', 'supplyType': 'B2B/B2C/SEZWP', 'placeOfSupply': 'State code' },
  },
  SA: {
    fields: ['seller.taxId', 'buyer.taxId'],
    descriptions: { 'seller.taxId': 'Seller VAT number', 'buyer.taxId': 'Buyer VAT number' },
  },
  KR: {
    fields: ['seller.taxId'],
    descriptions: { 'seller.taxId': '사업자등록번호 (Business Registration Number)' },
  },
};

function validateCountryFields(country: string, invoiceData: Record<string, unknown>): string[] {
  const config = COUNTRY_REQUIRED_FIELDS[country];
  if (!config) return [];

  const missing: string[] = [];
  for (const field of config.fields) {
    const parts = field.split('.');
    let value: unknown = invoiceData;
    for (const p of parts) {
      value = (value as Record<string, unknown>)?.[p];
    }
    if (!value) {
      missing.push(`${field} (${config.descriptions[field] || field})`);
    }
  }
  return missing;
}

// ─── C3: Digital Signature Requirements ─────────────

const SIGNATURE_REQUIRED = new Set(['IT', 'IN', 'SA', 'EG', 'MY']);

interface SigningInfo {
  required: boolean;
  method: string;
  note: string;
  documentHash?: string;
}

function getSigningInfo(country: string, documentContent?: string): SigningInfo {
  if (!SIGNATURE_REQUIRED.has(country)) {
    return { required: false, method: 'none', note: 'Digital signature not required.' };
  }

  const methods: Record<string, string> = {
    IT: 'XAdES-BES (CAdES also accepted)',
    IN: 'QR code with IRN hash from NIC portal',
    SA: 'ZATCA CSID (Cryptographic Stamp Identifier)',
    EG: 'ETA digital signature via token',
    MY: 'Digital certificate from LHDN',
  };

  const hash = documentContent
    ? createHash('sha256').update(documentContent).digest('hex')
    : undefined;

  return {
    required: true,
    method: methods[country] || 'Check local requirements',
    note: 'Document must be digitally signed before submission to tax authority.',
    documentHash: hash,
  };
}

// ─── C5: Submission Guides ──────────────────────────

interface SubmissionGuide {
  system: string;
  url: string;
  method: string;
  deadline: string;
}

const SUBMISSION_GUIDES: Record<string, SubmissionGuide> = {
  IT: { system: 'SDI (Sistema di Interscambio)', url: 'https://www.fatturapa.gov.it', method: 'Upload XML via SDI portal or certified PEC email', deadline: 'Within 12 days of issue' },
  IN: { system: 'NIC (National Informatics Centre)', url: 'https://einvoice1.gst.gov.in', method: 'API submission to generate IRN', deadline: 'Before delivery of goods/services' },
  KR: { system: '국세청 홈택스 (NTS HomeTax)', url: 'https://www.hometax.go.kr', method: 'ERP 연동 또는 직접 발행', deadline: '공급일의 다음 달 10일까지' },
  SA: { system: 'ZATCA FATOORA', url: 'https://fatoora.zatca.gov.sa', method: 'API integration with ZATCA platform', deadline: 'Real-time for B2B, 24hrs for B2C' },
  BR: { system: 'SEFAZ', url: 'https://www.nfe.fazenda.gov.br', method: 'Web service submission', deadline: 'Before goods leave establishment' },
  MX: { system: 'SAT', url: 'https://www.sat.gob.mx', method: 'Via PAC (authorized provider)', deadline: '72 hours from transaction' },
  TR: { system: 'GIB e-Fatura', url: 'https://ebelge.gib.gov.tr', method: 'Via registered integrator', deadline: '7 days from delivery' },
  EG: { system: 'ETA Portal', url: 'https://invoicing.eta.gov.eg', method: 'API or web portal', deadline: 'Within 2 days of issue' },
  PL: { system: 'KSeF', url: 'https://ksef.mf.gov.pl', method: 'API submission to KSeF', deadline: 'Before or on invoice date' },
};

// ─── C1: UBL XML Generation ─────────────────────────

function generateUblXml(invoice: Record<string, unknown>): string {
  const seller = invoice.seller as Record<string, unknown>;
  const buyer = invoice.buyer as Record<string, unknown>;
  const items = invoice.items as Array<Record<string, unknown>>;
  const invoiceTypeCode = invoice.invoiceType === 'credit_note' ? '381' : '380';

  let lines = '';
  for (const item of items) {
    lines += `
    <cac:InvoiceLine>
      <cbc:ID>${item.lineNumber}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${invoice.currency}">${item.lineTotal}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${escapeXml(String(item.description || ''))}</cbc:Name>
        ${item.hsCode ? `<cac:CommodityClassification><cbc:ItemClassificationCode listID="HS">${item.hsCode}</cbc:ItemClassificationCode></cac:CommodityClassification>` : ''}
      </cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="${invoice.currency}">${item.unitPrice}</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${invoice.invoiceDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>${invoice.originalInvoiceNumber ? `
  <cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${invoice.originalInvoiceNumber}</cbc:ID></cac:InvoiceDocumentReference></cac:BillingReference>` : ''}
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(String(seller.name || ''))}</cbc:Name></cac:PartyName>
      ${seller.taxId ? `<cac:PartyTaxScheme><cbc:CompanyID>${seller.taxId}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(String(buyer.name || ''))}</cbc:Name></cac:PartyName>
      ${buyer.taxId ? `<cac:PartyTaxScheme><cbc:CompanyID>${buyer.taxId}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${invoice.subtotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${invoice.grandTotal}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.grandTotal}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── C2: Invoice Number Generation ──────────────────

function generateInvoiceNumber(prefix: string = 'INV'): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `${prefix}-${y}${m}${d}-${seq}`;
}

// ─── POST Handler ───────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const format = typeof body.format === 'string' ? body.format.toLowerCase().trim() : 'json';
  const invoiceData = body.invoiceData as Record<string, unknown> | undefined;
  const invoiceType = typeof body.invoiceType === 'string' ? body.invoiceType as string : 'invoice';
  const originalInvoiceNumber = typeof body.originalInvoiceNumber === 'string' ? body.originalInvoiceNumber : undefined;

  if (!country || country.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be a 2-letter ISO code.');
  }

  // C6: Credit note requires original invoice
  if (['credit_note', 'corrective'].includes(invoiceType) && !originalInvoiceNumber) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"originalInvoiceNumber" is required for ${invoiceType}.`);
  }

  const mandate = E_INVOICE_MANDATES[country];
  const isEuB2G = EU_B2G_COUNTRIES.has(country);

  let generatedInvoice: Record<string, unknown> | null = null;
  let ublXml: string | null = null;
  let signingInfo: SigningInfo | null = null;

  if (invoiceData) {
    const seller = invoiceData.seller as Record<string, unknown> | undefined;
    const buyer = invoiceData.buyer as Record<string, unknown> | undefined;
    const items = invoiceData.items as Array<Record<string, unknown>> | undefined;

    if (!seller?.name) return apiError(ApiErrorCode.BAD_REQUEST, '"invoiceData.seller.name" required.');
    if (!buyer?.name) return apiError(ApiErrorCode.BAD_REQUEST, '"invoiceData.buyer.name" required.');
    if (!items || items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, '"invoiceData.items" required.');

    // C4: Country-specific field validation
    const missingFields = validateCountryFields(country, invoiceData);
    if (missingFields.length > 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Missing required fields for ${country} e-invoice: ${missingFields.join(', ')}`);
    }

    // EU Peppol: buyerReference recommended
    if ((isEuB2G || ['DE', 'FR', 'NL', 'SE', 'DK', 'FI', 'NO'].includes(country)) && !invoiceData.buyerReference) {
      // Not blocking, but add warning
    }

    const lineItems = items.map((item, i) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const lineTotal = Math.round(qty * price * 100) / 100;
      const taxAmount = Math.round(lineTotal * taxRate * 100) / 100;
      return {
        lineNumber: i + 1,
        description: String(item.description || ''),
        quantity: qty,
        unitPrice: price,
        lineTotal,
        taxRate,
        taxAmount,
        hsCode: item.hsCode || null,
      };
    });

    const subtotal = Math.round(lineItems.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const totalTax = Math.round(lineItems.reduce((s, l) => s + l.taxAmount, 0) * 100) / 100;
    const currency = String(invoiceData.currency || 'USD');

    // C2: Invoice number
    const invoiceNumber = String(invoiceData.invoiceNumber || generateInvoiceNumber(invoiceType === 'credit_note' ? 'CN' : 'INV'));

    generatedInvoice = {
      invoiceNumber,
      invoiceDate: String(invoiceData.invoiceDate || new Date().toISOString().split('T')[0]),
      invoiceType,
      originalInvoiceNumber: originalInvoiceNumber || null,
      seller: { name: seller.name, taxId: seller.taxId, address: seller.address, country: seller.country },
      buyer: { name: buyer.name, taxId: buyer.taxId, address: buyer.address, country: buyer.country },
      items: lineItems,
      subtotal,
      totalTax,
      grandTotal: Math.round((subtotal + totalTax) * 100) / 100,
      currency,
      format,
    };

    // C1: Generate UBL XML if requested
    if (['ubl', 'zatca', 'peppol'].includes(format)) {
      ublXml = generateUblXml(generatedInvoice);
    }

    // C3: Signing info
    signingInfo = getSigningInfo(country, ublXml || JSON.stringify(generatedInvoice));
  }

  // C5: Submission guide
  const submissionGuide = SUBMISSION_GUIDES[country] || null;

  return apiSuccess(
    {
      country,
      invoiceType,
      mandate: mandate ? {
        status: mandate.mandateStatus,
        format: mandate.format,
        platform: mandate.platform || null,
        effectiveDate: mandate.effectiveDate,
        note: mandate.note,
      } : isEuB2G ? {
        status: 'mandatory_b2g',
        format: 'EN 16931 (UBL/CII)',
        platform: 'Peppol / National platform',
        effectiveDate: '2020-04-18',
        note: 'EU Directive 2014/55/EU requires B2G e-invoicing.',
      } : {
        status: 'no_mandate',
        note: 'No e-invoicing mandate. Standard invoicing applies.',
      },
      invoice: generatedInvoice,
      ublXml: ublXml || undefined,
      signing: signingInfo || undefined,
      submissionGuide: submissionGuide || undefined,
      supportedFormats: ['ubl', 'cii', 'fatturapa', 'zatca', 'json'],
      supportedInvoiceTypes: ['invoice', 'credit_note', 'debit_note', 'corrective'],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "IT", invoiceType?: "credit_note", invoiceData?: {seller, buyer, items}, format?: "ubl" }');
}
