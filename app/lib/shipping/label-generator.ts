/**
 * F061: Shipping Label + Customs Form Data Generator
 *
 * Generates structured data for shipping labels, CN22/CN23 customs forms,
 * and commercial invoices. No PDF generation — data only.
 */

export interface ShippingParty {
  name: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  weightGrams: number;
  hsCode?: string;
  originCountry?: string;
}

export interface LabelRequest {
  sender: ShippingParty;
  receiver: ShippingParty;
  items: ShippingItem[];
  shippingMethod?: string;
  packageWeightKg?: number;
}

export interface CustomsForm {
  formType: 'CN22' | 'CN23';
  reason: 'gift' | 'commercial' | 'returned_goods' | 'documents' | 'other';
  items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hsCode: string;
    origin: string;
  }>;
  totalValue: number;
  totalWeight: number;
  currency: string;
  senderDeclaration: string;
}

export interface LabelData {
  sender: ShippingParty;
  receiver: ShippingParty;
  customsForm: CustomsForm;
  commercialInvoice: {
    invoiceNumber: string;
    date: string;
    seller: ShippingParty;
    buyer: ShippingParty;
    items: Array<{ description: string; quantity: number; unitPrice: number; total: number; hsCode: string; origin: string }>;
    subtotal: number;
    currency: string;
    incoterms: string;
    countryOfOrigin: string;
  };
  labelRequirements: LabelRequirement[];
}

export interface LabelRequirement {
  requirement: string;
  mandatory: boolean;
  note?: string;
}

// ─── Customs Form Selection ─────────────────────────

function selectCustomsForm(totalValue: number, currency: string): 'CN22' | 'CN23' {
  // CN22: small packets, value ≤ SDR 300 (~$400 USD)
  // CN23: larger items or value > SDR 300
  const thresholdUsd = 400;
  return totalValue <= thresholdUsd ? 'CN22' : 'CN23';
}

// ─── Label Requirements by Country ──────────────────

const COUNTRY_LABEL_REQS: Record<string, LabelRequirement[]> = {
  US: [
    { requirement: 'Country of origin marking required', mandatory: true },
    { requirement: 'FCC compliance marking (electronics)', mandatory: true, note: 'Required for electronic devices' },
    { requirement: 'English language labeling', mandatory: true },
  ],
  EU: [
    { requirement: 'CE marking (applicable products)', mandatory: true },
    { requirement: 'Country of origin', mandatory: true },
    { requirement: 'WEEE symbol (electronics)', mandatory: true, note: 'Directive 2012/19/EU' },
    { requirement: 'Local language labeling', mandatory: true, note: 'Product labels in destination language' },
  ],
  JP: [
    { requirement: 'Japanese language labeling', mandatory: true },
    { requirement: 'Country of origin (原産国)', mandatory: true },
    { requirement: 'PSE mark (electrical products)', mandatory: true, note: 'Required for AC power products' },
    { requirement: 'Importer name and address on label', mandatory: true },
  ],
  KR: [
    { requirement: 'Korean language labeling (한국어 표시)', mandatory: true },
    { requirement: 'KC mark (applicable products)', mandatory: true },
    { requirement: 'Country of origin (원산지)', mandatory: true },
    { requirement: 'Importer/agent info on label', mandatory: true },
  ],
  AU: [
    { requirement: 'Country of origin', mandatory: true },
    { requirement: 'English language', mandatory: true },
    { requirement: 'Biosecurity declaration for food/plant products', mandatory: true },
  ],
  CA: [
    { requirement: 'Bilingual labeling (English + French)', mandatory: true },
    { requirement: 'Country of origin', mandatory: true },
  ],
  BR: [
    { requirement: 'Portuguese language labeling', mandatory: true },
    { requirement: 'INMETRO certification mark (applicable)', mandatory: true },
    { requirement: 'Country of origin', mandatory: true },
  ],
  CN: [
    { requirement: 'Chinese language labeling (中文标签)', mandatory: true },
    { requirement: 'CCC mark (applicable products)', mandatory: true, note: 'China Compulsory Certification' },
    { requirement: 'Country of origin', mandatory: true },
  ],
};

export function getLabelRequirements(destinationCountry: string): LabelRequirement[] {
  const reqs = COUNTRY_LABEL_REQS[destinationCountry];
  if (reqs) return reqs;

  // EU member state fallback
  const euCountries = new Set(['DE','FR','IT','ES','NL','BE','AT','PL','SE','DK','FI','IE','PT','GR','CZ','RO','HU','BG','SK','SI','HR','LT','LV','EE','CY','MT','LU']);
  if (euCountries.has(destinationCountry)) return COUNTRY_LABEL_REQS['EU'];

  return [
    { requirement: 'Country of origin marking', mandatory: true },
    { requirement: 'Check local language requirements', mandatory: false },
  ];
}

// ─── Main Generator ─────────────────────────────────

export function generateLabelData(request: LabelRequest): LabelData {
  const { sender, receiver, items } = request;

  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalWeight = items.reduce((s, i) => s + i.weightGrams * i.quantity, 0);
  const currency = items[0]?.currency || 'USD';
  const mainOrigin = items[0]?.originCountry || sender.country;

  // Customs form
  const formType = selectCustomsForm(totalValue, currency);
  const customsForm: CustomsForm = {
    formType,
    reason: 'commercial',
    items: items.map(i => ({
      description: i.description.slice(0, 80),
      quantity: i.quantity,
      value: Math.round(i.quantity * i.unitPrice * 100) / 100,
      weight: i.weightGrams * i.quantity,
      hsCode: i.hsCode || '999999',
      origin: i.originCountry || sender.country,
    })),
    totalValue: Math.round(totalValue * 100) / 100,
    totalWeight,
    currency,
    senderDeclaration: 'I certify that the information given in this customs declaration is correct.',
  };

  // Commercial invoice
  const invoiceNumber = `CI-${Date.now().toString(36).toUpperCase()}`;
  const commercialInvoice = {
    invoiceNumber,
    date: new Date().toISOString().split('T')[0],
    seller: sender,
    buyer: receiver,
    items: items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: Math.round(i.quantity * i.unitPrice * 100) / 100,
      hsCode: i.hsCode || '999999',
      origin: i.originCountry || sender.country,
    })),
    subtotal: Math.round(totalValue * 100) / 100,
    currency,
    incoterms: 'DAP',
    countryOfOrigin: mainOrigin,
  };

  return {
    sender,
    receiver,
    customsForm,
    commercialInvoice,
    labelRequirements: getLabelRequirements(receiver.country),
  };
}
