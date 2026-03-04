/**
 * POTAL CostEngine — B2C Compatibility Wrapper
 *
 * ⚠️ This file is a backward-compatible wrapper.
 * The actual CostEngine lives in: app/lib/cost-engine/
 *
 * B2C code continues importing from here without changes.
 * New B2B code should import from '@/app/lib/cost-engine' directly.
 */

import type { Product } from '../../types/product';
import {
  calculateLandedCost as _calculateLandedCost,
  parsePriceToNumber,
  zipcodeToState,
  CHINA_IMPORT_DUTY_RATE,
  MPF_INFORMAL,
  STATE_TAX_RATES,
} from '../cost-engine';
import { toCostInput } from '../cost-engine/adapters';

// Re-export types
export type { LandedCost, CostBreakdownItem } from '../cost-engine';

// Re-export utilities
export { parsePriceToNumber, zipcodeToState, STATE_TAX_RATES, CHINA_IMPORT_DUTY_RATE, MPF_INFORMAL };

/**
 * B2C-compatible: Calculate landed cost for a Product.
 * Wraps the new CostEngine with Product→CostInput adapter.
 */
export function calculateLandedCost(
  product: Product,
  options?: { zipcode?: string }
) {
  return _calculateLandedCost(toCostInput(product, options?.zipcode));
}

/**
 * B2C-compatible: Calculate landed costs for multiple Products.
 * Used by Coordinator.ts and SearchService.ts.
 */
export function calculateAllLandedCosts(
  products: Product[],
  options?: { zipcode?: string }
) {
  const costMap = new Map<string, ReturnType<typeof _calculateLandedCost>>();
  for (const product of products) {
    costMap.set(product.id, calculateLandedCost(product, options));
  }
  return costMap;
}
