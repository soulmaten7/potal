/**
 * POTAL API v1 — /api/v1/customs-docs/generate
 * Generate customs documents: commercial_invoice, packing_list, certificate_of_origin, customs_declaration
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface ShipmentItem {
  hs_code: string;
  description: string;
  value: number;
  quantity: number;
  weight: number;
  origin: string;
}

interface Shipment {
  shipper: { name: string; address?: string; country?: string };
  consignee: { name: string; address?: string; country?: string };
  items: ShipmentItem[];
  destination: string;
  incoterms?: string;
  currency?: string;
}

function generateInvoiceNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

function generateCommercialInvoice(shipment: Shipment) {
  const totalValue = shipment.items.reduce((s, i) => s + i.value * i.quantity, 0);
  const totalWeight = shipment.items.reduce((s, i) => s + i.weight * i.quantity, 0);
  return {
    document_type: 'commercial_invoice',
    invoice_number: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    seller: shipment.shipper,
    buyer: shipment.consignee,
    items: shipment.items.map((item, i) => ({
      line: i + 1,
      hs_code: item.hs_code,
      description: item.description,
      origin: item.origin,
      quantity: item.quantity,
      unit_value: item.value,
      total_value: item.value * item.quantity,
      weight_kg: item.weight,
    })),
    totals: {
      total_items: shipment.items.length,
      total_quantity: shipment.items.reduce((s, i) => s + i.quantity, 0),
      total_value: totalValue,
      total_weight_kg: totalWeight,
      currency: shipment.currency || 'USD',
    },
    incoterms: shipment.incoterms || 'DDP',
    payment_terms: 'Net 30',
    declaration: 'I hereby certify that the information on this invoice is true and correct and that the contents of this shipment are as stated above.',
  };
}

function generatePackingList(shipment: Shipment) {
  const totalGross = shipment.items.reduce((s, i) => s + i.weight * i.quantity * 1.1, 0);
  const totalNet = shipment.items.reduce((s, i) => s + i.weight * i.quantity, 0);
  return {
    document_type: 'packing_list',
    date: new Date().toISOString().split('T')[0],
    shipper: shipment.shipper,
    consignee: shipment.consignee,
    items: shipment.items.map((item, i) => ({
      line: i + 1,
      description: item.description,
      hs_code: item.hs_code,
      quantity: item.quantity,
      net_weight_kg: item.weight * item.quantity,
      gross_weight_kg: Math.round(item.weight * item.quantity * 1.1 * 100) / 100,
    })),
    totals: {
      package_count: shipment.items.length,
      total_net_weight_kg: Math.round(totalNet * 100) / 100,
      total_gross_weight_kg: Math.round(totalGross * 100) / 100,
    },
  };
}

function generateCertificateOfOrigin(shipment: Shipment) {
  const origins = [...new Set(shipment.items.map(i => i.origin))];
  return {
    document_type: 'certificate_of_origin',
    date: new Date().toISOString().split('T')[0],
    exporter: shipment.shipper,
    consignee: shipment.consignee,
    producer: shipment.shipper,
    items: shipment.items.map((item, i) => ({
      line: i + 1,
      hs_code: item.hs_code,
      description: item.description,
      origin_country: item.origin,
      quantity: item.quantity,
      value: item.value * item.quantity,
    })),
    origin_countries: origins,
    origin_criteria: origins.length === 1 ? 'Wholly obtained' : 'Substantial transformation',
    declaration: `The undersigned hereby declares that the above details and statements are correct; that all the goods were produced in ${origins.join(', ')} and that they comply with the origin requirements for export to ${shipment.destination}.`,
    certification_type: 'Self-certification',
  };
}

function generateCustomsDeclaration(shipment: Shipment) {
  const totalValue = shipment.items.reduce((s, i) => s + i.value * i.quantity, 0);
  return {
    document_type: 'customs_declaration',
    date: new Date().toISOString().split('T')[0],
    importer: shipment.consignee,
    exporter: shipment.shipper,
    destination_country: shipment.destination,
    items: shipment.items.map((item, i) => ({
      line: i + 1,
      hs_code: item.hs_code,
      description: item.description,
      origin: item.origin,
      quantity: item.quantity,
      declared_value: item.value * item.quantity,
      weight_kg: item.weight * item.quantity,
    })),
    total_declared_value: totalValue,
    currency: shipment.currency || 'USD',
    incoterms: shipment.incoterms || 'DDP',
    declaration: 'I declare that the information provided is true and accurate to the best of my knowledge.',
  };
}

function crossValidate(shipment: Shipment): string[] {
  const warnings: string[] = [];
  for (const item of shipment.items) {
    if (item.value <= 0) warnings.push(`Item "${item.description}": declared value is 0 or negative.`);
    if (item.weight <= 0) warnings.push(`Item "${item.description}": weight is 0 or negative.`);
    if (!item.hs_code || item.hs_code.length < 4) warnings.push(`Item "${item.description}": HS code too short (min 4 digits).`);
  }
  const totalValue = shipment.items.reduce((s, i) => s + i.value * i.quantity, 0);
  if (totalValue > 100000) warnings.push(`High total value ($${totalValue.toFixed(2)}): ensure accurate declaration.`);
  return warnings;
}

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const docType = typeof body.doc_type === 'string' ? body.doc_type : '';
  const shipmentRaw = body.shipment as Record<string, unknown> | undefined;

  if (!shipmentRaw) return apiError(ApiErrorCode.BAD_REQUEST, 'shipment object required.');
  if (!Array.isArray(shipmentRaw.items) || shipmentRaw.items.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'shipment.items array required.');
  }

  const shipment: Shipment = {
    shipper: typeof shipmentRaw.shipper === 'object' && shipmentRaw.shipper !== null
      ? shipmentRaw.shipper as Shipment['shipper']
      : { name: 'Unknown Shipper' },
    consignee: typeof shipmentRaw.consignee === 'object' && shipmentRaw.consignee !== null
      ? shipmentRaw.consignee as Shipment['consignee']
      : { name: 'Unknown Consignee' },
    items: (shipmentRaw.items as ShipmentItem[]).map(i => ({
      hs_code: String(i.hs_code || ''),
      description: String(i.description || ''),
      value: Number(i.value) || 0,
      quantity: Number(i.quantity) || 1,
      weight: Number(i.weight) || 0,
      origin: String(i.origin || ''),
    })),
    destination: String(shipmentRaw.destination || ''),
    incoterms: typeof shipmentRaw.incoterms === 'string' ? shipmentRaw.incoterms : 'DDP',
    currency: typeof shipmentRaw.currency === 'string' ? shipmentRaw.currency : 'USD',
  };

  const warnings = crossValidate(shipment);

  const validTypes = ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'customs_declaration'];
  if (!validTypes.includes(docType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `doc_type must be one of: ${validTypes.join(', ')}`);
  }

  let document: Record<string, unknown>;
  switch (docType) {
    case 'commercial_invoice': document = generateCommercialInvoice(shipment); break;
    case 'packing_list': document = generatePackingList(shipment); break;
    case 'certificate_of_origin': document = generateCertificateOfOrigin(shipment); break;
    case 'customs_declaration': document = generateCustomsDeclaration(shipment); break;
    default: return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid doc_type.');
  }

  return apiSuccess({
    document,
    validation_warnings: warnings.length > 0 ? warnings : undefined,
    generated_at: new Date().toISOString(),
  }, { sellerId: _ctx.sellerId });
});
