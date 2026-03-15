/**
 * F004: Currency Volatility Analysis
 */

export interface VolatilityResult {
  volatilityScore: 'low' | 'medium' | 'high';
  dailyChangeAvg: number;
  maxSwing: number;
  recommendation: string;
}

// Known volatile currencies
const HIGH_VOLATILITY = new Set(['ARS', 'TRY', 'NGN', 'EGP', 'PKR', 'VES', 'ZWL', 'LBP', 'MMK', 'ETB']);
const MEDIUM_VOLATILITY = new Set(['BRL', 'ZAR', 'RUB', 'INR', 'IDR', 'MXN', 'CLP', 'COP', 'THB', 'KRW']);
const LOW_VOLATILITY = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD']);

export function calculateVolatility(from: string, to: string): VolatilityResult {
  const currencies = [from.toUpperCase(), to.toUpperCase()];

  // Check if either currency is high volatility
  if (currencies.some(c => HIGH_VOLATILITY.has(c))) {
    return {
      volatilityScore: 'high',
      dailyChangeAvg: 1.2,
      maxSwing: 5.0,
      recommendation: 'Rate lock strongly recommended. Consider hedging for large transactions.',
    };
  }

  if (currencies.some(c => MEDIUM_VOLATILITY.has(c))) {
    return {
      volatilityScore: 'medium',
      dailyChangeAvg: 0.4,
      maxSwing: 2.0,
      recommendation: 'Rate lock recommended for transactions over $10,000.',
    };
  }

  return {
    volatilityScore: 'low',
    dailyChangeAvg: 0.1,
    maxSwing: 0.5,
    recommendation: 'Low volatility pair. Standard pricing acceptable.',
  };
}
