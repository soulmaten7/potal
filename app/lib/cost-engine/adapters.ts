/**
 * Adapters — Bridge between B2C Product type and B2B CostInput
 *
 * B2C frontend continues using Product objects.
 * This adapter converts Product → CostInput so CostEngine stays clean.
 */

import type { Product } from '../../types/product';
import type { CostInput } from './types';

/**
 * Convert B2C Product to CostInput for CostEngine.
 * Used by existing B2C search pipeline (Coordinator, SearchService).
 */
export function toCostInput(product: Product, zipcode?: string): CostInput {
  return {
    price: product.price,
    shippingPrice: product.shippingPrice ?? 0,
    origin: product.site || '',
    shippingType: product.shipping || '',
    zipcode,
  };
}

/**
 * Batch convert B2C Products to CostInput with IDs.
 */
export function toCostInputBatch(
  products: Product[],
  zipcode?: string
): (CostInput & { id: string })[] {
  return products.map(p => ({
    id: p.id,
    ...toCostInput(p, zipcode),
  }));
}
