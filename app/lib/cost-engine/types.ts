/**
 * POTAL Cost Engine — Type Definitions
 *
 * B2B-ready interfaces. No dependency on B2C Product type.
 * Both B2B API and B2C frontend use these types.
 */

// ─── Input Types ─────────────────────────────────────

/**
 * Minimal input for cost calculation.
 * B2B sellers and AI agents provide this data.
 * B2C Product can be adapted to this via toCostInput().
 */
export interface CostInput {
  /** Product price (number or string like "$29.99") */
  price: string | number;
  /** Shipping cost in USD. 0 = free shipping */
  shippingPrice?: number;
  /** Origin indicator: site name (e.g. "AliExpress") or ISO country code (e.g. "CN", "US") */
  origin?: string;
  /** Shipping type hint: 'domestic' | 'international' | 'global' */
  shippingType?: string;
  /** Buyer's US ZIP code for tax calculation */
  zipcode?: string;
  /** HS Code for precise duty rate (future use) */
  hsCode?: string;
  /** Destination country ISO code (default: "US") */
  destinationCountry?: string;
}

// ─── Output Types ────────────────────────────────────

export interface CostBreakdownItem {
  label: string;
  amount: number;
  note?: string;
}

export interface LandedCost {
  /** Original product price */
  productPrice: number;
  /** Shipping cost (0 for free shipping) */
  shippingCost: number;
  /** Import duty amount */
  importDuty: number;
  /** Merchandise Processing Fee */
  mpf: number;
  /** Estimated sales tax */
  salesTax: number;
  /** Total = product + shipping + duty + mpf + tax */
  totalLandedCost: number;
  /** Whether this is domestic or global */
  type: 'domestic' | 'global';
  /** Whether duty-free */
  isDutyFree: boolean;
  /** Detected origin country */
  originCountry: 'CN' | 'OTHER' | 'DOMESTIC';
  /** Breakdown for display */
  breakdown: CostBreakdownItem[];
}
