/**
 * POTAL DDP Checkout — Price Calculator
 *
 * Calculates the all-inclusive DDP price for an order.
 * Uses GlobalCostEngine for duty/tax calculation per item.
 */

import { calculateGlobalLandedCostAsync } from '../cost-engine/GlobalCostEngine';
import type {
  DdpCheckoutInput,
  DdpPriceBreakdown,
  DdpItemBreakdown,
} from './types';

/** POTAL service fee rate (5% of duties+taxes — covers duty remittance handling) */
const SERVICE_FEE_RATE = 0.05;

/**
 * Calculate the full DDP price breakdown for an order.
 */
export async function calculateDdpPrice(
  input: DdpCheckoutInput
): Promise<DdpPriceBreakdown> {
  const itemBreakdowns: DdpItemBreakdown[] = [];
  let totalDuty = 0;
  let totalVat = 0;
  let totalCustomsFee = 0;

  for (const item of input.items) {
    const lineTotal = item.price * item.quantity;

    // Calculate landed cost for this item
    const landedCost = await calculateGlobalLandedCostAsync({
      price: item.price,
      shippingPrice: 0, // Shipping is separate
      origin: item.countryOfOrigin || input.originCountry,
      destinationCountry: input.destinationCountry,
      zipcode: input.zipcode,
      hsCode: item.hsCode,
      productName: item.productName,
      productCategory: item.category,
    });

    const dutyAmount = landedCost.importDuty * item.quantity;
    const vatAmount = landedCost.vat * item.quantity;

    totalDuty += dutyAmount;
    totalVat += vatAmount;
    totalCustomsFee += landedCost.mpf * item.quantity;

    // Extract duty rate from the result
    const dutyRate = item.price > 0
      ? (landedCost.importDuty / item.price) * 100
      : 0;

    itemBreakdowns.push({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal,
      hsCode: landedCost.hsClassification?.hsCode || item.hsCode,
      dutyRate: Math.round(dutyRate * 100) / 100,
      dutyAmount: Math.round(dutyAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
    });
  }

  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = input.shippingCost || 0;
  const insurance = input.insuranceCost || 0;

  // Service fee: percentage of duties + taxes
  const serviceFee = Math.round((totalDuty + totalVat) * SERVICE_FEE_RATE * 100) / 100;

  const grandTotal = Math.round(
    (subtotal + shipping + insurance + totalDuty + totalVat + totalCustomsFee + serviceFee) * 100
  ) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shippingCost: Math.round(shipping * 100) / 100,
    insuranceCost: Math.round(insurance * 100) / 100,
    importDuty: Math.round(totalDuty * 100) / 100,
    vat: Math.round(totalVat * 100) / 100,
    customsFee: Math.round(totalCustomsFee * 100) / 100,
    serviceFee,
    grandTotal,
    currency: input.currency || 'USD',
    itemBreakdowns,
  };
}
