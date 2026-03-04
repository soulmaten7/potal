/**
 * POTAL API Usage Logger
 *
 * Records every API call to usage_logs table for billing and analytics.
 * Fire-and-forget — never blocks the API response.
 */

import { createClient } from '@supabase/supabase-js';

interface UsageLogEntry {
  sellerId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  originCountry?: string;
  destinationCountry?: string;
  productPriceCents?: number;
}

/**
 * Log an API request to usage_logs table.
 * Called as fire-and-forget from middleware.
 */
export async function logUsage(
  supabase: ReturnType<typeof createClient>,
  entry: UsageLogEntry
): Promise<void> {
  const { error } = await (supabase.from('usage_logs') as any).insert({
    seller_id: entry.sellerId,
    api_key_id: entry.apiKeyId,
    endpoint: entry.endpoint,
    method: entry.method,
    status_code: entry.statusCode,
    response_time_ms: entry.responseTimeMs,
    origin_country: entry.originCountry || null,
    destination_country: entry.destinationCountry || 'US',
    product_price_cents: entry.productPriceCents || null,
  });

  if (error) {
    console.error('[POTAL] Usage log failed:', error.message);
  }
}
