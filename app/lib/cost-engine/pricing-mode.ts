/**
 * F025: DDP/DDU Pricing Mode Engine
 *
 * DDP (Delivered Duty Paid): Seller pays all duties/taxes at checkout.
 *   → Customer sees one all-inclusive price. No surprises at delivery.
 *   → Reduces cart abandonment by 20-30% (industry data).
 *
 * DDU/DAP (Delivered Duty Unpaid): Customer pays duties at delivery.
 *   → Lower checkout price, but customs charges at door.
 *   → Risk: customer refuses delivery → return shipping cost.
 */

export type PricingMode = 'DDP' | 'DDU' | 'DAP';

export interface DutyTaxBreakdown {
  importDuty: number;
  vat: number;
  customsFees: number;
  otherTaxes: number;
}

export interface PricingModeResult {
  mode: PricingMode;
  productPrice: number;
  shippingCost: number;
  dutiesAndTaxes: number;
  totalLandedCost: number;
  /** What the customer pays at checkout */
  customerPays: number;
  /** Whether duties are collected at checkout (true for DDP) */
  dutyCollectedAtCheckout: boolean;
  /** For DDU: estimated amount customer pays at delivery */
  estimatedCustomsCharge: number;
  currency: string;
  breakdown: DutyTaxBreakdown;
  /** Display guidance for checkout UI */
  checkoutDisplay: {
    priceLabel: string;
    dutyNote: string;
    badge?: string;
  };
}

export interface PricingModeComparison {
  ddp: PricingModeResult;
  ddu: PricingModeResult;
  difference: number;
  recommendation: string;
  conversionImpact: string;
}

/**
 * Calculate what the customer pays under DDP or DDU pricing.
 */
export function calculatePricingMode(
  mode: PricingMode,
  productPrice: number,
  shippingCost: number,
  importDuty: number,
  vat: number,
  customsFees: number,
  otherTaxes: number,
  currency: string = 'USD',
): PricingModeResult {
  const dutiesAndTaxes = round(importDuty + vat + customsFees + otherTaxes);
  const totalLandedCost = round(productPrice + shippingCost + dutiesAndTaxes);

  const isDDP = mode === 'DDP';

  return {
    mode,
    productPrice: round(productPrice),
    shippingCost: round(shippingCost),
    dutiesAndTaxes,
    totalLandedCost,
    customerPays: isDDP ? totalLandedCost : round(productPrice + shippingCost),
    dutyCollectedAtCheckout: isDDP,
    estimatedCustomsCharge: isDDP ? 0 : dutiesAndTaxes,
    currency,
    breakdown: {
      importDuty: round(importDuty),
      vat: round(vat),
      customsFees: round(customsFees),
      otherTaxes: round(otherTaxes),
    },
    checkoutDisplay: isDDP
      ? {
          priceLabel: `${currency} ${totalLandedCost.toFixed(2)} (all inclusive)`,
          dutyNote: 'All import duties and taxes included. No additional charges at delivery.',
          badge: 'All duties & taxes included ✓',
        }
      : {
          priceLabel: `${currency} ${round(productPrice + shippingCost).toFixed(2)}`,
          dutyNote: `Estimated ${currency} ${dutiesAndTaxes.toFixed(2)} in customs charges may apply at delivery.`,
          badge: undefined,
        },
  };
}

/**
 * Compare DDP vs DDU for the same shipment.
 */
export function comparePricingModes(
  productPrice: number,
  shippingCost: number,
  importDuty: number,
  vat: number,
  customsFees: number,
  otherTaxes: number,
  currency: string = 'USD',
): PricingModeComparison {
  const ddp = calculatePricingMode('DDP', productPrice, shippingCost, importDuty, vat, customsFees, otherTaxes, currency);
  const ddu = calculatePricingMode('DDU', productPrice, shippingCost, importDuty, vat, customsFees, otherTaxes, currency);

  const difference = round(ddp.customerPays - ddu.customerPays);
  const dutyPercent = productPrice > 0 ? round((difference / productPrice) * 100) : 0;

  let recommendation: string;
  let conversionImpact: string;

  if (difference === 0) {
    recommendation = 'No duty applies — DDP and DDU are identical.';
    conversionImpact = 'No impact on conversion.';
  } else if (dutyPercent <= 15) {
    recommendation = 'DDP recommended. Duties are modest — absorb them for better buyer experience.';
    conversionImpact = `DDP adds ${currency} ${difference.toFixed(2)} (${dutyPercent}%) but can reduce cart abandonment by 20-30%.`;
  } else if (dutyPercent <= 40) {
    recommendation = 'DDP recommended with clear pricing. Duties are significant but manageable.';
    conversionImpact = `DDP adds ${currency} ${difference.toFixed(2)} (${dutyPercent}%). Consider offering both options.`;
  } else {
    recommendation = 'DDU may be preferable. High duty-to-price ratio might deter checkout completion.';
    conversionImpact = `DDP adds ${currency} ${difference.toFixed(2)} (${dutyPercent}%). Show DDU with clear customs estimate.`;
  }

  return { ddp, ddu, difference, recommendation, conversionImpact };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
