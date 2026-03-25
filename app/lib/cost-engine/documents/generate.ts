/**
 * POTAL Customs Documents — Generator
 *
 * Generates Commercial Invoice and Packing List from shipment data.
 * Auto-classifies HS codes for items that don't have one.
 */

import { classifyProductAsync } from '../ai-classifier';
import type {
  GenerateDocumentInput,
  GenerateDocumentResult,
  CommercialInvoice,
  PackingList,
  ShipmentItem,
  PackingListItem,
  CertificateOfOrigin,
  RequiredDocumentsResult,
  RequiredDocument,
  CustomsDeclaration,
} from './types';

// ─── Invoice Number Generator ───────────────────────

function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

// ─── Auto-classify HS Codes ─────────────────────────

/** Minimum confidence for auto-classified HS codes in customs documents */
const MIN_DOC_CONFIDENCE_HIGH = 0.85;
const MIN_DOC_CONFIDENCE_LOW = 0.50;

interface EnrichResult {
  items: ShipmentItem[];
  warnings: string[];
  itemsRequiringAttention: number[];
}

async function enrichItemsWithHsCodes(
  items: GenerateDocumentInput['items'],
  sellerId?: string
): Promise<EnrichResult> {
  const enriched: ShipmentItem[] = [];
  const warnings: string[] = [];
  const itemsRequiringAttention: number[] = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    let hsCode = item.hsCode;
    let classificationSource: string | undefined;

    // Auto-classify if no HS code provided
    if (!hsCode && item.description) {
      try {
        const classification = await classifyProductAsync(
          item.description,
          item.category,
          sellerId
        );
        if (classification.hsCode && classification.confidence >= MIN_DOC_CONFIDENCE_HIGH) {
          hsCode = classification.hsCode;
          classificationSource = 'auto_high_confidence';
        } else if (classification.hsCode && classification.confidence >= MIN_DOC_CONFIDENCE_LOW) {
          hsCode = classification.hsCode;
          classificationSource = 'auto_low_confidence';
          warnings.push(
            `Item ${idx + 1} "${item.description}": HS code ${hsCode} auto-classified with ${Math.round(classification.confidence * 100)}% confidence. Manual verification recommended.`
          );
        }
      } catch {
        // Classification failed
      }
    }

    // Mark items without HS code
    if (!hsCode) {
      hsCode = 'CLASSIFICATION_REQUIRED';
      itemsRequiringAttention.push(idx);
      warnings.push(
        `Item ${idx + 1} "${item.description}": HS code could not be determined. Manual classification required before customs submission.`
      );
    }

    enriched.push({
      description: item.description,
      hsCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: Math.round(item.quantity * item.unitPrice * 100) / 100,
      countryOfOrigin: item.countryOfOrigin,
      weightKg: item.weightKg,
      category: item.category,
      classificationSource,
    });
  }

  return { items: enriched, warnings, itemsRequiringAttention };
}

// ─── Commercial Invoice Generator ───────────────────

function buildCommercialInvoice(
  input: GenerateDocumentInput,
  items: ShipmentItem[],
  invoiceNumber: string
): CommercialInvoice {
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const shipping = input.shippingCost || 0;
  const insurance = input.insuranceCost || 0;
  const grandTotal = Math.round((subtotal + shipping + insurance) * 100) / 100;

  // Determine origin from items or exporter
  const originCountry =
    items.find(i => i.countryOfOrigin)?.countryOfOrigin ||
    input.exporter.country;

  return {
    invoiceNumber,
    invoiceDate: new Date().toISOString().split('T')[0],
    exporter: input.exporter,
    importer: input.importer,
    items,
    currency: input.currency || 'USD',
    subtotal: Math.round(subtotal * 100) / 100,
    shippingCost: shipping,
    insuranceCost: insurance,
    grandTotal,
    incoterm: input.incoterm || 'FOB',
    paymentTerms: input.paymentTerms,
    shippingMethod: input.shippingMethod,
    notes: input.notes,
    destinationCountry: input.importer.country,
    originCountry,
  };
}

// ─── Packing List Generator ─────────────────────────

function buildPackingList(
  input: GenerateDocumentInput,
  items: ShipmentItem[],
  invoiceNumber: string
): PackingList {
  const packingItems: PackingListItem[] = items.map((item, idx) => {
    const inputItem = input.items[idx];
    return {
      ...item,
      packageNumber: `${idx + 1} of ${items.length}`,
      dimensionsCm: inputItem?.dimensionsCm,
    };
  });

  const totalWeightKg = items.reduce((sum, i) => {
    return sum + (i.weightKg ? i.weightKg * i.quantity : 0);
  }, 0);

  return {
    invoiceNumber,
    date: new Date().toISOString().split('T')[0],
    exporter: input.exporter,
    importer: input.importer,
    items: packingItems,
    totalPackages: items.length,
    totalWeightKg: Math.round(totalWeightKg * 1000) / 1000,
    shippingMethod: input.shippingMethod,
    notes: input.notes,
  };
}

// ─── Certificate of Origin Generator ─────────────────

function generateCertificateNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `COO-${y}${m}-${rand}`;
}

function buildCertificateOfOrigin(
  input: GenerateDocumentInput,
  items: ShipmentItem[]
): CertificateOfOrigin {
  const originCountry =
    items.find(i => i.countryOfOrigin)?.countryOfOrigin ||
    input.exporter.country;

  const coItems = items.map(item => ({
    description: item.description,
    hsCode: item.hsCode,
    quantity: item.quantity,
    countryOfOrigin: item.countryOfOrigin || originCountry,
    originCriterion: 'WO', // Default: Wholly Obtained
  }));

  return {
    certificateNumber: generateCertificateNumber(),
    issueDate: new Date().toISOString().split('T')[0],
    exporter: input.exporter,
    importer: input.importer,
    items: coItems,
    isPreferential: false,
    declaration: `The undersigned hereby declares that the above details and statements are correct, that all the goods were produced in ${originCountry} and that they comply with the origin requirements specified for those goods.`,
    originCountry,
    destinationCountry: input.importer.country,
  };
}

// ─── Required Documents by Country ───────────────────

const UNIVERSAL_DOCS: RequiredDocument[] = [
  { name: 'Commercial Invoice', code: 'CI', required: true, description: 'Detailed invoice with item descriptions, values, and trade terms', responsible: 'exporter' },
  { name: 'Packing List', code: 'PL', required: true, description: 'List of contents, weights, and dimensions of each package', responsible: 'exporter' },
  { name: 'Bill of Lading / Airway Bill', code: 'BL', required: true, description: 'Transport document issued by carrier', responsible: 'both' },
];

const COUNTRY_SPECIFIC_DOCS: Record<string, RequiredDocument[]> = {
  US: [
    { name: 'CBP Form 3461 (Entry/Immediate Delivery)', code: 'CBP3461', required: true, description: 'Required for goods valued over $2,500 or regulated items', responsible: 'importer' },
    { name: 'CBP Form 7501 (Entry Summary)', code: 'CBP7501', required: true, description: 'Customs entry summary for duty assessment', responsible: 'importer' },
    { name: 'ISF 10+2 (Importer Security Filing)', code: 'ISF', required: true, description: 'Required for ocean shipments, filed 24h before vessel loading', responsible: 'importer' },
    { name: 'FDA Prior Notice', code: 'FDA', required: false, description: 'Required for food, drugs, cosmetics, medical devices', responsible: 'importer' },
    { name: 'FCC Declaration', code: 'FCC', required: false, description: 'Required for electronic devices', responsible: 'importer' },
  ],
  EU: [
    { name: 'EUR.1 Movement Certificate', code: 'EUR1', required: false, description: 'For preferential tariff rates under EU FTAs', responsible: 'exporter' },
    { name: 'SAD (Single Administrative Document)', code: 'SAD', required: true, description: 'Standard customs declaration form for EU imports', responsible: 'importer' },
    { name: 'EORI Number', code: 'EORI', required: true, description: 'Economic Operators Registration and Identification number', responsible: 'importer' },
    { name: 'CE Marking Declaration', code: 'CE', required: false, description: 'Required for electronics, toys, machinery, medical devices', responsible: 'exporter' },
  ],
  GB: [
    { name: 'C88 (SAD) Import Declaration', code: 'C88', required: true, description: 'UK customs import declaration', responsible: 'importer' },
    { name: 'EORI Number (UK)', code: 'EORI_UK', required: true, description: 'UK EORI required post-Brexit', responsible: 'importer' },
    { name: 'UKCA Marking Declaration', code: 'UKCA', required: false, description: 'UK Conformity Assessment for regulated products', responsible: 'exporter' },
  ],
  CN: [
    { name: 'China Inspection Certificate (CIQ)', code: 'CIQ', required: false, description: 'Required for food, cosmetics, and regulated goods', responsible: 'exporter' },
    { name: 'China Customs Declaration', code: 'CCD', required: true, description: 'Import declaration filed with China Customs', responsible: 'importer' },
    { name: 'CCC Mark Certificate', code: 'CCC', required: false, description: 'China Compulsory Certification for electronics and automotive parts', responsible: 'exporter' },
  ],
  JP: [
    { name: 'Import Declaration (Japan Customs)', code: 'JPCD', required: true, description: 'Filed electronically via NACCS system', responsible: 'importer' },
    { name: 'PSE Mark Certificate', code: 'PSE', required: false, description: 'Required for electrical appliances', responsible: 'exporter' },
    { name: 'Food Sanitation Certificate', code: 'JPFOOD', required: false, description: 'Required for food imports under Food Sanitation Act', responsible: 'importer' },
  ],
  KR: [
    { name: 'Korea Import Declaration', code: 'KRCD', required: true, description: 'Filed via UNI-PASS system', responsible: 'importer' },
    { name: 'KC Mark Certificate', code: 'KC', required: false, description: 'Korea Certification for electronics, consumer goods', responsible: 'exporter' },
  ],
  AU: [
    { name: 'Import Declaration (N10)', code: 'AUN10', required: true, description: 'Australian customs import declaration', responsible: 'importer' },
    { name: 'Biosecurity Import Permit', code: 'AUBIO', required: false, description: 'Required for food, plants, animals, biological materials', responsible: 'importer' },
  ],
  IN: [
    { name: 'Bill of Entry', code: 'INBE', required: true, description: 'Indian customs import declaration', responsible: 'importer' },
    { name: 'Import Export Code (IEC)', code: 'IEC', required: true, description: 'Required for all commercial imports to India', responsible: 'importer' },
    { name: 'BIS Certificate', code: 'BIS', required: false, description: 'Bureau of Indian Standards certification for electronics, toys', responsible: 'exporter' },
  ],
  BR: [
    { name: 'Import License (LI)', code: 'BRLI', required: false, description: 'Required for certain regulated goods via SISCOMEX', responsible: 'importer' },
    { name: 'Import Declaration (DI)', code: 'BRDI', required: true, description: 'Filed via SISCOMEX system', responsible: 'importer' },
    { name: 'INMETRO Certificate', code: 'INMETRO', required: false, description: 'Required for electronics, toys, automotive parts', responsible: 'exporter' },
  ],
  SA: [
    { name: 'SASO Certificate of Conformity', code: 'SASO', required: true, description: 'Saudi Standards certification required for all consumer goods', responsible: 'exporter' },
    { name: 'Legalized Commercial Invoice', code: 'SACI', required: true, description: 'Invoice must be legalized by Saudi embassy or chamber of commerce', responsible: 'exporter' },
  ],
  AE: [
    { name: 'Import Declaration (Dubai Customs)', code: 'AECD', required: true, description: 'Filed via Dubai Trade system', responsible: 'importer' },
    { name: 'ECAS Certificate', code: 'ECAS', required: false, description: 'Emirates Conformity Assessment Scheme for regulated products', responsible: 'exporter' },
  ],
};

// EU member states use EU docs
const EU_MEMBERS = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'FI', 'IE', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT'];

function getRequiredDocuments(
  destinationCountry: string,
  originCountry: string,
  hsCode?: string
): RequiredDocumentsResult {
  const docs: RequiredDocument[] = [...UNIVERSAL_DOCS];
  const notes: string[] = [];
  const dest = destinationCountry.toUpperCase();

  // Certificate of Origin is generally recommended
  docs.push({
    name: 'Certificate of Origin',
    code: 'COO',
    required: false,
    description: 'Certifies the country where goods were manufactured. Required for FTA preferential rates.',
    responsible: 'exporter',
  });

  // Country-specific docs
  if (COUNTRY_SPECIFIC_DOCS[dest]) {
    docs.push(...COUNTRY_SPECIFIC_DOCS[dest]);
  } else if (EU_MEMBERS.includes(dest)) {
    docs.push(...(COUNTRY_SPECIFIC_DOCS['EU'] || []));
    notes.push(`${dest} is an EU member state. EU customs regulations apply.`);
  }

  // HS code-based additional docs
  if (hsCode) {
    const ch = hsCode.slice(0, 2);
    // Food/agricultural products
    if (['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'].includes(ch)) {
      docs.push({
        name: 'Phytosanitary / Health Certificate',
        code: 'PHYTO',
        required: true,
        description: 'Required for food and agricultural products',
        responsible: 'exporter',
      });
      notes.push('Food/agricultural products may require additional permits and inspections.');
    }
    // Chemicals
    if (['28','29','30','31','32','33','34','35','36','37','38'].includes(ch)) {
      docs.push({
        name: 'Material Safety Data Sheet (MSDS)',
        code: 'MSDS',
        required: true,
        description: 'Required for chemical products and hazardous materials',
        responsible: 'exporter',
      });
    }
    // Textiles
    if (['50','51','52','53','54','55','56','57','58','59','60','61','62','63'].includes(ch)) {
      notes.push('Textile products may require country-of-origin labeling and fiber content disclosure.');
    }
  }

  return { destinationCountry: dest, originCountry: originCountry.toUpperCase(), hsCode, documents: docs, notes };
}

// ─── Customs Declaration Generator ──────────────────

function generateDeclarationNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CD-${y}${m}${d}-${rand}`;
}

function buildCustomsDeclaration(
  input: GenerateDocumentInput,
  items: ShipmentItem[],
): CustomsDeclaration {
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const shipping = input.shippingCost || 0;
  const insurance = input.insuranceCost || 0;
  const totalDeclaredValue = Math.round((subtotal + shipping + insurance) * 100) / 100;

  const originCountry =
    items.find(i => i.countryOfOrigin)?.countryOfOrigin ||
    input.exporter.country;

  const declItems = items.map((item, idx) => ({
    itemNumber: idx + 1,
    description: item.description,
    hsCode: item.hsCode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalValue: item.totalPrice,
    countryOfOrigin: item.countryOfOrigin || originCountry,
    weightKg: item.weightKg,
  }));

  return {
    declarationNumber: generateDeclarationNumber(),
    declarationType: 'import',
    declarationDate: new Date().toISOString().split('T')[0],
    declarant: input.importer,
    exporter: input.exporter,
    countryOfOrigin: originCountry,
    countryOfDestination: input.importer.country,
    items: declItems,
    totalDeclaredValue,
    totalDuty: 0, // To be calculated by customs
    totalVat: 0,  // To be calculated by customs
    totalFees: 0,
    totalPayable: 0,
    incoterm: input.incoterm || 'FOB',
    currency: input.currency || 'USD',
    shippingMethod: input.shippingMethod,
  };
}

// ─── Main Generator ─────────────────────────────────

/**
 * Generate customs documents (Commercial Invoice, Packing List, or both).
 *
 * - Auto-classifies HS codes for items without them
 * - Calculates totals, subtotals
 * - Generates unique invoice numbers
 */
export async function generateDocuments(
  input: GenerateDocumentInput,
  sellerId?: string
): Promise<GenerateDocumentResult> {
  // Validate minimum input
  if (!input.items || input.items.length === 0) {
    throw new Error('At least one item is required.');
  }
  if (!input.exporter?.name || !input.exporter?.country) {
    throw new Error('Exporter name and country are required.');
  }
  if (!input.importer?.name || !input.importer?.country) {
    throw new Error('Importer name and country are required.');
  }

  // Enrich items with HS codes
  const enrichResult = await enrichItemsWithHsCodes(input.items, sellerId);
  const enrichedItems = enrichResult.items;
  const invoiceNumber = generateInvoiceNumber();

  const result: GenerateDocumentResult = {
    warnings: enrichResult.warnings.length > 0 ? enrichResult.warnings : undefined,
    itemsRequiringAttention: enrichResult.itemsRequiringAttention.length > 0 ? enrichResult.itemsRequiringAttention : undefined,
    documentMetadata: {
      documentId: `POTAL-${(input.type || 'DOC').toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: 'POTAL API v1',
      declarantName: input.exporter?.name || '[DECLARANT NAME REQUIRED]',
      disclaimer: 'This document was generated electronically. The declarant is responsible for verifying all information before submission to customs authorities.',
    },
  };

  const isAll = input.type === 'all';

  if (input.type === 'commercial_invoice' || input.type === 'both' || isAll) {
    result.commercialInvoice = buildCommercialInvoice(input, enrichedItems, invoiceNumber);
  }

  if (input.type === 'packing_list' || input.type === 'both' || isAll) {
    result.packingList = buildPackingList(input, enrichedItems, invoiceNumber);
  }

  if (input.type === 'certificate_of_origin' || isAll) {
    result.certificateOfOrigin = buildCertificateOfOrigin(input, enrichedItems);
  }

  if (input.type === 'required_documents' || isAll) {
    const firstHsCode = enrichedItems.find(i => i.hsCode && i.hsCode !== 'CLASSIFICATION_REQUIRED')?.hsCode;
    result.requiredDocuments = getRequiredDocuments(
      input.importer.country,
      input.exporter.country,
      firstHsCode
    );
  }

  if (input.type === 'customs_declaration' || isAll) {
    result.customsDeclaration = buildCustomsDeclaration(input, enrichedItems);
  }

  return result;
}
