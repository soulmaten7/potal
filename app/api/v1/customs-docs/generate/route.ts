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

function generateCertificateOfCompliance(shipment: Shipment) {
  const totalValue = shipment.items.reduce((s, i) => s + i.value * i.quantity, 0);

  // Determine applicable standards based on destination
  const COUNTRY_STANDARDS: Record<string, string[]> = {
    US: ['CPSC (Consumer Product Safety)', 'FCC Part 15 (Electronics)', 'FDA (Food/Cosmetics)', 'EPA (Chemical substances)'],
    GB: ['UKCA Marking', 'UK Product Safety Regulations', 'UK Conformity Assessment'],
    EU: ['CE Marking', 'REACH Regulation', 'RoHS Directive', 'General Product Safety Directive'],
    AU: ['Australian Standards (AS/NZS)', 'ACMA (Telecom)', 'TGA (Therapeutics)'],
    JP: ['PSE Mark (Electrical)', 'PSC Mark (Consumer)', 'JIS Standards'],
    KR: ['KC Mark', 'KCC (Radio Equipment)', 'KFDA (Food/Drug)'],
    CN: ['CCC (Compulsory Certification)', 'GB Standards'],
  };

  const dest = shipment.destination.toUpperCase();
  const applicableStandards = COUNTRY_STANDARDS[dest] || ['General product safety standards applicable in destination country'];

  return {
    document_type: 'certificate_of_compliance',
    certificate_number: `COC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    manufacturer: shipment.shipper,
    importer: shipment.consignee,
    destination_country: shipment.destination,
    products: shipment.items.map((item, i) => ({
      line: i + 1,
      hs_code: item.hs_code,
      description: item.description,
      quantity: item.quantity,
      origin: item.origin,
      value: item.value * item.quantity,
    })),
    applicable_standards: applicableStandards,
    compliance_status: 'compliant',
    testing_info: {
      lab_name: 'To be provided by manufacturer',
      test_report_number: 'To be provided',
      test_date: 'To be provided',
    },
    total_value: totalValue,
    currency: shipment.currency || 'USD',
    declaration: `The undersigned hereby certifies that the products listed above conform to the applicable safety, health, and environmental standards required for import into ${shipment.destination}. All necessary testing has been performed by an accredited laboratory.`,
    notes: [
      'This certificate must accompany the shipment at all times.',
      'Original test reports should be available upon request by customs authorities.',
      'Products must bear required markings (CE, UKCA, etc.) as applicable.',
    ],
  };
}

function generatePhytosanitaryCertificate(shipment: Shipment) {
  // Phytosanitary certificates are for plant products, food, and agricultural goods
  const TREATMENT_METHODS = [
    { code: 'HT', name: 'Heat Treatment', description: 'Core temperature 56°C for 30 minutes' },
    { code: 'MB', name: 'Methyl Bromide Fumigation', description: 'Fumigated with methyl bromide per ISPM 15' },
    { code: 'VHT', name: 'Vapor Heat Treatment', description: 'Heated to 46.5°C for specified duration' },
    { code: 'CT', name: 'Cold Treatment', description: 'Held at specified temperature for required duration' },
    { code: 'IR', name: 'Irradiation', description: 'Treated with ionizing radiation per ISPM 18' },
  ];

  const origins = [...new Set(shipment.items.map(i => i.origin))];

  return {
    document_type: 'phytosanitary_certificate',
    certificate_number: `PC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    date: new Date().toISOString().split('T')[0],
    issuing_authority: 'National Plant Protection Organization (NPPO)',
    reference_standard: 'ISPM 12 — Phytosanitary certificates',
    exporter: shipment.shipper,
    consignee: shipment.consignee,
    origin_country: origins.join(', '),
    destination_country: shipment.destination,
    point_of_entry: 'Designated port of entry',
    products: shipment.items.map((item, i) => ({
      line: i + 1,
      description: item.description,
      hs_code: item.hs_code,
      botanical_name: 'To be specified',
      quantity: item.quantity,
      weight_kg: item.weight * item.quantity,
      origin: item.origin,
      packaging: 'Commercial packaging — ISPM 15 compliant wood',
    })),
    treatment: {
      applied: false,
      method: null as typeof TREATMENT_METHODS[0] | null,
      available_methods: TREATMENT_METHODS,
      note: 'Select treatment method if required by destination country phytosanitary regulations.',
    },
    inspection_result: {
      status: 'pending',
      date: null,
      inspector: null,
      findings: 'Inspection to be conducted before certificate issuance.',
    },
    additional_declarations: [
      'The consignment is considered to be free from quarantine pests.',
      'The consignment complies with the phytosanitary requirements of the importing country.',
      'Wood packaging material meets ISPM 15 standards.',
    ],
    declaration: `This is to certify that the plants, plant products, or other regulated articles described herein have been inspected and/or tested according to appropriate official procedures and are considered free from quarantine pests and practically free from other injurious pests, and are considered to conform with the current phytosanitary requirements of the importing country.`,
    notes: [
      'This certificate does not constitute a release for import. Destination country inspection may apply.',
      'The certificate is void if altered, erased, or irregularly completed.',
      'Valid for 14 days from date of issue for perishable items, 60 days for non-perishable.',
    ],
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

  const validTypes = ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'customs_declaration', 'certificate_of_compliance', 'phytosanitary_certificate'];
  if (!validTypes.includes(docType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `doc_type must be one of: ${validTypes.join(', ')}`);
  }

  let document: Record<string, unknown>;
  switch (docType) {
    case 'commercial_invoice': document = generateCommercialInvoice(shipment); break;
    case 'packing_list': document = generatePackingList(shipment); break;
    case 'certificate_of_origin': document = generateCertificateOfOrigin(shipment); break;
    case 'customs_declaration': document = generateCustomsDeclaration(shipment); break;
    case 'certificate_of_compliance': document = generateCertificateOfCompliance(shipment); break;
    case 'phytosanitary_certificate': document = generatePhytosanitaryCertificate(shipment); break;
    default: return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid doc_type.');
  }

  return apiSuccess({
    document,
    validation_warnings: warnings.length > 0 ? warnings : undefined,
    generated_at: new Date().toISOString(),
  }, { sellerId: _ctx.sellerId });
});
