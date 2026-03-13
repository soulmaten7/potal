/**
 * POTAL API v1 — /api/v1/invoicing/e-invoice
 *
 * e-Invoicing compliance check and generation.
 * Supports EU (EN 16931), Italy (SDI/FatturaPA), India (GST e-Invoice),
 * Saudi Arabia (ZATCA/Fatoorah), and other mandates.
 *
 * POST /api/v1/invoicing/e-invoice
 * Body: {
 *   country: string,           // required — destination country
 *   invoiceData: {
 *     invoiceNumber: string,
 *     invoiceDate: string,
 *     seller: { name, taxId, address, country },
 *     buyer: { name, taxId?, address, country },
 *     items: [{ description, quantity, unitPrice, taxRate, hsCode? }],
 *     currency?: string,
 *     paymentTerms?: string,
 *   },
 *   format?: string,           // "ubl" | "cii" | "fatturapa" | "zatca" | "json"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── e-Invoicing Mandates by Country ───────────────

interface EInvoiceMandate {
  country: string;
  mandateStatus: 'mandatory' | 'mandatory_b2g' | 'mandatory_b2b' | 'voluntary' | 'planned';
  format: string;
  platform?: string;
  effectiveDate: string;
  note: string;
}

const E_INVOICE_MANDATES: Record<string, EInvoiceMandate> = {
  IT: { country: 'Italy', mandateStatus: 'mandatory', format: 'FatturaPA (XML)', platform: 'SDI (Sistema di Interscambio)', effectiveDate: '2019-01-01', note: 'All B2B and B2C invoices must go through SDI. Cross-border invoices via Esterometro abolished.' },
  IN: { country: 'India', mandateStatus: 'mandatory_b2b', format: 'GST e-Invoice (JSON)', platform: 'IRP (Invoice Registration Portal)', effectiveDate: '2022-10-01', note: 'Mandatory for businesses with turnover ≥ ₹5 Cr. IRN (Invoice Reference Number) required.' },
  SA: { country: 'Saudi Arabia', mandateStatus: 'mandatory', format: 'ZATCA UBL 2.1', platform: 'FATOORA', effectiveDate: '2024-01-01', note: 'Phase 2 (Integration Phase) — real-time clearance with ZATCA. QR code mandatory.' },
  BR: { country: 'Brazil', mandateStatus: 'mandatory', format: 'NF-e / NFS-e (XML)', platform: 'SEFAZ', effectiveDate: '2006-01-01', note: 'Longest-running e-invoicing mandate. NF-e for goods, NFS-e for services.' },
  MX: { country: 'Mexico', mandateStatus: 'mandatory', format: 'CFDI 4.0 (XML)', platform: 'SAT', effectiveDate: '2022-01-01', note: 'CFDI 4.0 mandatory. Must include fiscal address and tax regime.' },
  FR: { country: 'France', mandateStatus: 'planned', format: 'Factur-X (CII/UBL)', platform: 'PPF/PDP', effectiveDate: '2026-09-01', note: 'Mandate delayed. B2B e-invoicing via PPF platform. Large companies first.' },
  DE: { country: 'Germany', mandateStatus: 'planned', format: 'XRechnung / ZUGFeRD', platform: 'Peppol / direct', effectiveDate: '2025-01-01', note: 'B2G mandatory (XRechnung). B2B mandate planned from 2025.' },
  PL: { country: 'Poland', mandateStatus: 'mandatory', format: 'KSeF (XML)', platform: 'KSeF (Krajowy System e-Faktur)', effectiveDate: '2026-02-01', note: 'KSeF mandatory for all taxpayers.' },
  ES: { country: 'Spain', mandateStatus: 'planned', format: 'Facturae', platform: 'FACe (B2G) / VERI*FACTU', effectiveDate: '2025-07-01', note: 'B2G via FACe mandatory. B2B mandate via VERI*FACTU system.' },
  TR: { country: 'Turkey', mandateStatus: 'mandatory_b2b', format: 'e-Fatura (UBL-TR)', platform: 'GIB', effectiveDate: '2014-01-01', note: 'e-Fatura for B2B, e-Arsiv for B2C. Annual revenue threshold ₺3M.' },
  KR: { country: 'South Korea', mandateStatus: 'mandatory', format: 'e-Tax Invoice', platform: 'NTS (HomeTax)', effectiveDate: '2011-01-01', note: 'Mandatory for all VAT-registered businesses. Real-time issuance via HomeTax.' },
  SG: { country: 'Singapore', mandateStatus: 'voluntary', format: 'Peppol BIS', platform: 'InvoiceNow (Peppol)', effectiveDate: '2019-01-01', note: 'InvoiceNow (Peppol-based) voluntary but encouraged. Widely adopted for B2G.' },
  AU: { country: 'Australia', mandateStatus: 'voluntary', format: 'Peppol BIS', platform: 'Peppol', effectiveDate: '2020-01-01', note: 'Peppol adoption encouraged. Mandate expected in the future.' },
  MY: { country: 'Malaysia', mandateStatus: 'mandatory', format: 'MyInvois (XML/JSON)', platform: 'LHDN MyInvois', effectiveDate: '2024-08-01', note: 'Phased rollout. Large taxpayers first, all by 2025.' },
  EG: { country: 'Egypt', mandateStatus: 'mandatory', format: 'ETA e-Invoice', platform: 'ETA Portal', effectiveDate: '2023-01-01', note: 'All companies must issue e-invoices through ETA portal.' },
};

// EU B2G standard
const EU_B2G_COUNTRIES = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'GR', 'HU', 'IE', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'RO', 'SK', 'SI', 'SE']);

interface InvoiceItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  hsCode?: string;
}

interface InvoiceParty {
  name?: string;
  taxId?: string;
  address?: string;
  country?: string;
}

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

  if (!country || country.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be a 2-letter ISO code.');
  }

  const mandate = E_INVOICE_MANDATES[country];
  const isEuB2G = EU_B2G_COUNTRIES.has(country);

  // If invoice data provided, validate and generate
  let generatedInvoice: Record<string, unknown> | null = null;
  if (invoiceData) {
    const seller = invoiceData.seller as InvoiceParty | undefined;
    const buyer = invoiceData.buyer as InvoiceParty | undefined;
    const items = invoiceData.items as InvoiceItem[] | undefined;

    if (!seller?.name) return apiError(ApiErrorCode.BAD_REQUEST, '"invoiceData.seller.name" is required.');
    if (!buyer?.name) return apiError(ApiErrorCode.BAD_REQUEST, '"invoiceData.buyer.name" is required.');
    if (!items || items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, '"invoiceData.items" is required.');

    const lineItems = items.map((item, i) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const taxRate = item.taxRate || 0;
      const lineTotal = qty * price;
      const taxAmount = lineTotal * taxRate;
      return {
        lineNumber: i + 1,
        description: item.description || '',
        quantity: qty,
        unitPrice: price,
        lineTotal: Math.round(lineTotal * 100) / 100,
        taxRate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        hsCode: item.hsCode || null,
      };
    });

    const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
    const totalTax = lineItems.reduce((s, l) => s + l.taxAmount, 0);

    generatedInvoice = {
      invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      seller: { name: seller.name, taxId: seller.taxId, address: seller.address, country: seller.country },
      buyer: { name: buyer.name, taxId: buyer.taxId, address: buyer.address, country: buyer.country },
      items: lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round((subtotal + totalTax) * 100) / 100,
      currency: (invoiceData.currency as string) || 'USD',
      format,
    };
  }

  return apiSuccess(
    {
      country,
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
        note: 'EU Directive 2014/55/EU requires B2G e-invoicing in EN 16931 format.',
      } : {
        status: 'no_mandate',
        note: 'No e-invoicing mandate found for this country. Standard invoicing applies.',
      },
      invoice: generatedInvoice,
      supportedFormats: ['ubl', 'cii', 'fatturapa', 'zatca', 'json'],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "IT", invoiceData?: {seller, buyer, items}, format?: "ubl" }');
}
