/**
 * POTAL API v1 — /api/v1/invoice/generate
 * E-Invoice generation: UBL 2.1 XML or JSON format
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  hs_code?: string;
  tax_rate?: number;
}

interface InvoiceData {
  seller: { name: string; address?: string; country?: string; tax_id?: string };
  buyer: { name: string; address?: string; country?: string; tax_id?: string };
  items: InvoiceItem[];
  currency?: string;
  note?: string;
}

function generateInvoiceId() {
  const d = new Date();
  return `INV-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
}

function buildUblXml(invoiceId: string, data: InvoiceData): string {
  const currency = data.currency || 'USD';
  const issueDate = new Date().toISOString().split('T')[0];
  const taxTotal = data.items.reduce((s, i) => s + (i.quantity * i.unit_price * (i.tax_rate || 0) / 100), 0);
  const lineTotal = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const payable = lineTotal + taxTotal;

  const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = data.items.map((item, i) => `
    <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${(item.quantity * item.unit_price).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${escXml(item.description)}</cbc:Description>
        ${item.hs_code ? `<cac:CommodityClassification><cbc:ItemClassificationCode listID="HS">${item.hs_code}</cbc:ItemClassificationCode></cac:CommodityClassification>` : ''}
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${item.unit_price.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${invoiceId}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  ${data.note ? `<cbc:Note>${escXml(data.note)}</cbc:Note>` : ''}
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escXml(data.seller.name)}</cbc:Name></cac:PartyName>
      ${data.seller.country ? `<cac:PostalAddress><cac:Country><cbc:IdentificationCode>${data.seller.country}</cbc:IdentificationCode></cac:Country></cac:PostalAddress>` : ''}
      ${data.seller.tax_id ? `<cac:PartyTaxScheme><cbc:CompanyID>${data.seller.tax_id}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escXml(data.buyer.name)}</cbc:Name></cac:PartyName>
      ${data.buyer.country ? `<cac:PostalAddress><cac:Country><cbc:IdentificationCode>${data.buyer.country}</cbc:IdentificationCode></cac:Country></cac:PostalAddress>` : ''}
      ${data.buyer.tax_id ? `<cac:PartyTaxScheme><cbc:CompanyID>${data.buyer.tax_id}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${taxTotal.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${payable.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${payable.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>`;
}

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const format = typeof body.format === 'string' ? body.format.toLowerCase() : 'json';
  const invoiceData = body.invoice_data as InvoiceData | undefined;

  if (!invoiceData?.seller?.name) return apiError(ApiErrorCode.BAD_REQUEST, 'invoice_data.seller.name required.');
  if (!invoiceData?.buyer?.name) return apiError(ApiErrorCode.BAD_REQUEST, 'invoice_data.buyer.name required.');
  if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'invoice_data.items required.');

  const invoiceId = generateInvoiceId();

  if (format === 'ubl' || format === 'xml') {
    const xml = buildUblXml(invoiceId, invoiceData);
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${invoiceId}.xml"`,
      },
    });
  }

  // JSON format
  const lineTotal = invoiceData.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxTotal = invoiceData.items.reduce((s, i) => s + (i.quantity * i.unit_price * (i.tax_rate || 0) / 100), 0);

  return apiSuccess({
    invoice_id: invoiceId,
    issue_date: new Date().toISOString().split('T')[0],
    currency: invoiceData.currency || 'USD',
    seller: invoiceData.seller,
    buyer: invoiceData.buyer,
    items: invoiceData.items.map((item, i) => ({
      line: i + 1,
      ...item,
      line_total: item.quantity * item.unit_price,
      tax_amount: item.quantity * item.unit_price * (item.tax_rate || 0) / 100,
    })),
    totals: {
      line_total: Math.round(lineTotal * 100) / 100,
      tax_total: Math.round(taxTotal * 100) / 100,
      payable: Math.round((lineTotal + taxTotal) * 100) / 100,
    },
  }, { sellerId: _ctx.sellerId });
});
