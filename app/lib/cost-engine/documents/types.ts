/**
 * POTAL Customs Documents — Type Definitions
 *
 * Types for Commercial Invoice, Packing List, and other customs documents.
 */

// ─── Shipment Item ──────────────────────────────────

export interface ShipmentItem {
  /** Product name / description */
  description: string;
  /** HS Code (6 or 10 digits) */
  hsCode?: string;
  /** Quantity */
  quantity: number;
  /** Unit price in USD */
  unitPrice: number;
  /** Total price (quantity × unitPrice) */
  totalPrice: number;
  /** Country of origin ISO 2-letter code */
  countryOfOrigin?: string;
  /** Weight per unit in kg */
  weightKg?: number;
  /** Product category */
  category?: string;
}

// ─── Parties ────────────────────────────────────────

export interface TradeParty {
  /** Company or individual name */
  name: string;
  /** Street address */
  address?: string;
  /** City */
  city?: string;
  /** State / Province */
  state?: string;
  /** Postal / ZIP code */
  postalCode?: string;
  /** Country ISO 2-letter code */
  country: string;
  /** Phone number */
  phone?: string;
  /** Email */
  email?: string;
  /** Tax ID / VAT number / EORI */
  taxId?: string;
}

// ─── Commercial Invoice ─────────────────────────────

export interface CommercialInvoice {
  /** Unique invoice number */
  invoiceNumber: string;
  /** Invoice date (ISO format) */
  invoiceDate: string;
  /** Seller / Exporter */
  exporter: TradeParty;
  /** Buyer / Importer */
  importer: TradeParty;
  /** Line items */
  items: ShipmentItem[];
  /** Currency code (default: USD) */
  currency: string;
  /** Subtotal (sum of all item totalPrice) */
  subtotal: number;
  /** Shipping / freight cost */
  shippingCost: number;
  /** Insurance cost */
  insuranceCost: number;
  /** Grand total (subtotal + shipping + insurance) */
  grandTotal: number;
  /** Incoterm: FOB, CIF, DDP, etc. */
  incoterm: string;
  /** Payment terms */
  paymentTerms?: string;
  /** Shipping method */
  shippingMethod?: string;
  /** Estimated delivery date */
  estimatedDelivery?: string;
  /** Additional notes */
  notes?: string;
  /** Destination country */
  destinationCountry: string;
  /** Origin country */
  originCountry: string;
}

// ─── Packing List ───────────────────────────────────

export interface PackingListItem extends ShipmentItem {
  /** Package number (e.g. "1 of 3") */
  packageNumber?: string;
  /** Dimensions (L × W × H) in cm */
  dimensionsCm?: { length: number; width: number; height: number };
}

export interface PackingList {
  /** Reference to invoice number */
  invoiceNumber: string;
  /** Packing list date */
  date: string;
  /** Seller / Exporter */
  exporter: TradeParty;
  /** Buyer / Importer */
  importer: TradeParty;
  /** Items with packing details */
  items: PackingListItem[];
  /** Total number of packages */
  totalPackages: number;
  /** Total gross weight in kg */
  totalWeightKg: number;
  /** Shipping method */
  shippingMethod?: string;
  /** Additional notes */
  notes?: string;
}

// ─── Generate Document Input ────────────────────────

export interface GenerateDocumentInput {
  /** Document type to generate */
  type: 'commercial_invoice' | 'packing_list' | 'certificate_of_origin' | 'required_documents' | 'customs_declaration' | 'both' | 'all';
  /** Seller/exporter info */
  exporter: TradeParty;
  /** Buyer/importer info */
  importer: TradeParty;
  /** Items in the shipment */
  items: Array<{
    description: string;
    hsCode?: string;
    quantity: number;
    unitPrice: number;
    countryOfOrigin?: string;
    weightKg?: number;
    category?: string;
    dimensionsCm?: { length: number; width: number; height: number };
  }>;
  /** Shipping cost in USD */
  shippingCost?: number;
  /** Insurance cost in USD */
  insuranceCost?: number;
  /** Incoterm (default: FOB) */
  incoterm?: string;
  /** Currency (default: USD) */
  currency?: string;
  /** Payment terms */
  paymentTerms?: string;
  /** Shipping method */
  shippingMethod?: string;
  /** Notes */
  notes?: string;
}

// ─── Certificate of Origin ─────────────────────────

export interface CertificateOfOrigin {
  /** Certificate number */
  certificateNumber: string;
  /** Date of issue */
  issueDate: string;
  /** Exporter / Producer */
  exporter: TradeParty;
  /** Importer / Consignee */
  importer: TradeParty;
  /** Items with origin details */
  items: Array<{
    description: string;
    hsCode?: string;
    quantity: number;
    countryOfOrigin: string;
    /** Origin criterion (WO, PE, etc.) */
    originCriterion?: string;
  }>;
  /** FTA/Trade agreement name (if preferential) */
  tradeAgreement?: string;
  /** Whether this is a preferential certificate */
  isPreferential: boolean;
  /** Exporter declaration text */
  declaration: string;
  /** Country of origin */
  originCountry: string;
  /** Destination country */
  destinationCountry: string;
}

// ─── Required Documents Check ──────────────────────

export interface RequiredDocument {
  /** Document name */
  name: string;
  /** Document code/type */
  code: string;
  /** Whether it's mandatory or optional */
  required: boolean;
  /** Description of what this document is for */
  description: string;
  /** Which party is responsible (exporter/importer/both) */
  responsible: 'exporter' | 'importer' | 'both';
}

export interface RequiredDocumentsResult {
  /** Destination country */
  destinationCountry: string;
  /** Origin country */
  originCountry: string;
  /** HS code (if provided) */
  hsCode?: string;
  /** List of required documents */
  documents: RequiredDocument[];
  /** Country-specific notes */
  notes: string[];
}

// ─── Customs Declaration ──────────────────────────

export interface CustomsDeclaration {
  /** Declaration reference number */
  declarationNumber: string;
  /** Declaration type */
  declarationType: 'import' | 'export' | 'transit';
  /** Date of declaration */
  declarationDate: string;
  /** Importer/declarant */
  declarant: TradeParty;
  /** Exporter/sender */
  exporter: TradeParty;
  /** Country of origin */
  countryOfOrigin: string;
  /** Country of destination */
  countryOfDestination: string;
  /** Items declared */
  items: Array<{
    itemNumber: number;
    description: string;
    hsCode?: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    countryOfOrigin?: string;
    weightKg?: number;
    dutyRate?: number;
    dutyAmount?: number;
    vatRate?: number;
    vatAmount?: number;
  }>;
  /** Total declared value (FOB/CIF) */
  totalDeclaredValue: number;
  /** Total duty payable */
  totalDuty: number;
  /** Total VAT/GST payable */
  totalVat: number;
  /** Total fees */
  totalFees: number;
  /** Grand total payable */
  totalPayable: number;
  /** Incoterm */
  incoterm: string;
  /** Currency */
  currency: string;
  /** Shipping method */
  shippingMethod?: string;
  /** Transport document reference (B/L or AWB number) */
  transportDocumentRef?: string;
  /** IOSS number (if applicable) */
  iossNumber?: string;
  /** EORI number (if applicable) */
  eoriNumber?: string;
}

export interface GenerateDocumentResult {
  commercialInvoice?: CommercialInvoice;
  packingList?: PackingList;
  certificateOfOrigin?: CertificateOfOrigin;
  requiredDocuments?: RequiredDocumentsResult;
  customsDeclaration?: CustomsDeclaration;
}
