/**
 * F058: DDP Duty Pre-payment Calculator
 *
 * Calculates pre-payment amounts for DDP shipments including:
 * - Estimated duty + tax + customs fees
 * - Exchange rate buffer (3% for currency fluctuation)
 * - Processing fee
 */

export interface PrepaymentBreakdown {
  dutyAmount: number;
  taxAmount: number;
  customsFees: number;
  processingFee: number;
  exchangeRateBuffer: number;
  subtotal: number;
  totalPrepayment: number;
  currency: string;
  exchangeRate: number;
  bufferPercentage: number;
  validUntil: string;
}

export interface PrepaymentInput {
  declaredValue: number;
  dutyRate: number;
  taxRate: number;
  customsFees?: number;
  currency?: string;
  exchangeRate?: number;
}

const BUFFER_PERCENTAGE = 0.03; // 3% buffer for exchange rate fluctuation
const PROCESSING_FEE = 5.00; // Fixed processing fee per shipment
const VALIDITY_HOURS = 24; // Prepayment quote valid for 24 hours

/**
 * Calculate DDP pre-payment amount with buffer.
 */
export function calculatePrepayment(input: PrepaymentInput): PrepaymentBreakdown {
  const { declaredValue, dutyRate, taxRate, customsFees = 0, currency = 'USD', exchangeRate = 1 } = input;

  if (declaredValue <= 0) throw new Error('declaredValue must be positive');
  if (dutyRate < 0 || taxRate < 0) throw new Error('Rates must be non-negative');

  const dutyAmount = Math.round(declaredValue * dutyRate * 100) / 100;
  const taxableBase = declaredValue + dutyAmount;
  const taxAmount = Math.round(taxableBase * taxRate * 100) / 100;
  const subtotal = dutyAmount + taxAmount + customsFees + PROCESSING_FEE;
  const exchangeRateBuffer = Math.round(subtotal * BUFFER_PERCENTAGE * 100) / 100;
  const totalPrepayment = Math.round((subtotal + exchangeRateBuffer) * 100) / 100;

  const validUntil = new Date(Date.now() + VALIDITY_HOURS * 60 * 60 * 1000).toISOString();

  return {
    dutyAmount,
    taxAmount,
    customsFees,
    processingFee: PROCESSING_FEE,
    exchangeRateBuffer,
    subtotal: Math.round(subtotal * 100) / 100,
    totalPrepayment,
    currency,
    exchangeRate,
    bufferPercentage: BUFFER_PERCENTAGE * 100,
    validUntil,
  };
}
