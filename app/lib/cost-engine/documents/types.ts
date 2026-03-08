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
  type: 'commercial_invoice' | 'packing_list' | 'both';
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

export interface GenerateDocumentResult {
  commercialInvoice?: CommercialInvoice;
  packingList?: PackingList;
}
