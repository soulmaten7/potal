/**
 * POTAL DDP Checkout — Type Definitions
 *
 * DDP (Delivered Duty Paid) checkout creates a single price
 * that includes product + shipping + duties + taxes.
 * No surprise fees for the buyer at delivery.
 */

// ─── Checkout Session ───────────────────────────────

export interface DdpCheckoutItem {
  /** Product name */
  productName: string;
  /** Product price in USD */
  price: number;
  /** Quantity */
  quantity: number;
  /** HS Code (optional, auto-classified if missing) */
  hsCode?: string;
  /** Product category */
  category?: string;
  /** Country of origin ISO code */
  countryOfOrigin?: string;
  /** Weight in kg (for shipping calc) */
  weightKg?: number;
  /** Image URL for checkout display */
  imageUrl?: string;
}

export interface DdpCheckoutInput {
  /** Seller ID */
  sellerId: string;
  /** Origin country ISO code */
  originCountry: string;
  /** Destination country ISO code */
  destinationCountry: string;
  /** Destination ZIP/postal code */
  zipcode?: string;
  /** Items in the order */
  items: DdpCheckoutItem[];
  /** Shipping cost in USD (seller-provided) */
  shippingCost: number;
  /** Insurance cost in USD (optional) */
  insuranceCost?: number;
  /** Buyer email */
  buyerEmail?: string;
  /** Buyer name */
  buyerName?: string;
  /** Currency for display (default: USD) */
  currency?: string;
  /** Success redirect URL (for seller's own checkout integration) */
  successUrl?: string;
  /** Cancel redirect URL (for seller's own checkout integration) */
  cancelUrl?: string;
  /** Metadata to attach to the session */
  metadata?: Record<string, string>;
}

export interface DdpPriceBreakdown {
  /** Product subtotal */
  subtotal: number;
  /** Shipping cost */
  shippingCost: number;
  /** Insurance cost */
  insuranceCost: number;
  /** Import duty amount */
  importDuty: number;
  /** VAT/GST amount */
  vat: number;
  /** Customs processing fee */
  customsFee: number;
  /** POTAL service fee (% of duty+tax, covers duty remittance) */
  serviceFee: number;
  /** Grand total (DDP price — buyer pays this, no more) */
  grandTotal: number;
  /** Currency */
  currency: string;
  /** Per-item breakdown */
  itemBreakdowns: DdpItemBreakdown[];
}

export interface DdpItemBreakdown {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  hsCode?: string;
  dutyRate: number;
  dutyAmount: number;
  vatAmount: number;
}

export interface DdpCheckoutSession {
  /** POTAL checkout session ID */
  sessionId: string;
  /** DDP price breakdown */
  breakdown: DdpPriceBreakdown;
  /** Session status */
  status: 'created' | 'paid' | 'expired' | 'cancelled';
  /** Created timestamp */
  createdAt: string;
  /** Expires at */
  expiresAt: string;
}
